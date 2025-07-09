
import { googleCalendarService } from './google-calendar'
import { prisma } from './db'

interface RetryConfig {
  maxRetries: number
  baseDelay: number
  maxDelay: number
  backoffFactor: number
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffFactor: 2
}

export class CalendarError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode?: number,
    public readonly isRetryable: boolean = false
  ) {
    super(message)
    this.name = 'CalendarError'
  }
}

export class RateLimitError extends CalendarError {
  constructor(message: string, public readonly retryAfter?: number) {
    super(message, 'RATE_LIMIT_EXCEEDED', 429, true)
  }
}

export class AuthenticationError extends CalendarError {
  constructor(message: string) {
    super(message, 'AUTHENTICATION_ERROR', 401, false)
  }
}

export class NotFoundError extends CalendarError {
  constructor(message: string) {
    super(message, 'NOT_FOUND', 404, false)
  }
}

export class ConflictError extends CalendarError {
  constructor(message: string) {
    super(message, 'CONFLICT', 409, false)
  }
}

export class NetworkError extends CalendarError {
  constructor(message: string) {
    super(message, 'NETWORK_ERROR', 500, true)
  }
}

export class CalendarErrorHandler {
  private static instance: CalendarErrorHandler
  private rateLimitTracker: Map<string, number> = new Map()
  private readonly rateLimitWindow = 60000 // 1 minute

  private constructor() {}

  static getInstance(): CalendarErrorHandler {
    if (!CalendarErrorHandler.instance) {
      CalendarErrorHandler.instance = new CalendarErrorHandler()
    }
    return CalendarErrorHandler.instance
  }

  /**
   * Parse and classify errors from Google Calendar API
   */
  parseError(error: any): CalendarError {
    if (!error) {
      return new CalendarError('Unknown error occurred', 'UNKNOWN_ERROR')
    }

    // Handle Google API errors
    if (error.response?.status) {
      const status = error.response.status
      const message = error.response.data?.error?.message || error.message || 'Unknown error'

      switch (status) {
        case 400:
          return new CalendarError(`Invalid request: ${message}`, 'INVALID_REQUEST', 400)
        case 401:
          return new AuthenticationError(`Authentication failed: ${message}`)
        case 403:
          if (message.includes('rate')) {
            const retryAfter = error.response.headers?.['retry-after'] 
              ? parseInt(error.response.headers['retry-after']) * 1000 
              : undefined
            return new RateLimitError(`Rate limit exceeded: ${message}`, retryAfter)
          }
          return new CalendarError(`Access denied: ${message}`, 'ACCESS_DENIED', 403)
        case 404:
          return new NotFoundError(`Resource not found: ${message}`)
        case 409:
          return new ConflictError(`Conflict: ${message}`)
        case 429:
          const retryAfter = error.response.headers?.['retry-after'] 
            ? parseInt(error.response.headers['retry-after']) * 1000 
            : undefined
          return new RateLimitError(`Rate limit exceeded: ${message}`, retryAfter)
        case 500:
        case 502:
        case 503:
        case 504:
          return new NetworkError(`Server error: ${message}`)
        default:
          return new CalendarError(`HTTP ${status}: ${message}`, 'HTTP_ERROR', status, status >= 500)
      }
    }

    // Handle network errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
      return new NetworkError(`Network error: ${error.message}`)
    }

    // Handle other errors
    return new CalendarError(error.message || 'Unknown error', 'UNKNOWN_ERROR')
  }

  /**
   * Check if we're within rate limits
   */
  checkRateLimit(operation: string): boolean {
    const now = Date.now()
    const lastCall = this.rateLimitTracker.get(operation)
    
    if (!lastCall || now - lastCall > this.rateLimitWindow) {
      this.rateLimitTracker.set(operation, now)
      return true
    }
    
    return false
  }

  /**
   * Calculate delay for exponential backoff
   */
  calculateDelay(attempt: number, config: RetryConfig = DEFAULT_RETRY_CONFIG): number {
    const delay = config.baseDelay * Math.pow(config.backoffFactor, attempt)
    return Math.min(delay, config.maxDelay)
  }

  /**
   * Execute operation with retry logic
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    config: RetryConfig = DEFAULT_RETRY_CONFIG
  ): Promise<T> {
    let lastError: CalendarError | null = null

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        // Check rate limit
        if (!this.checkRateLimit(operationName)) {
          throw new RateLimitError('Local rate limit exceeded')
        }

        const result = await operation()
        
        // Reset rate limit tracker on success
        this.rateLimitTracker.delete(operationName)
        
        return result
      } catch (error) {
        const calendarError = this.parseError(error)
        lastError = calendarError

        // Log the error
        console.error(`Calendar operation failed (attempt ${attempt + 1}/${config.maxRetries + 1}):`, {
          operation: operationName,
          error: calendarError.message,
          code: calendarError.code,
          statusCode: calendarError.statusCode
        })

        // Don't retry if it's the last attempt or error is not retryable
        if (attempt === config.maxRetries || !calendarError.isRetryable) {
          break
        }

        // Calculate delay
        let delay = this.calculateDelay(attempt, config)
        
        // Use retry-after header if available
        if (calendarError instanceof RateLimitError && calendarError.retryAfter) {
          delay = calendarError.retryAfter
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw lastError
  }

  /**
   * Log error to database
   */
  async logError(
    error: CalendarError,
    operation: string,
    bookingId?: string,
    eventId?: string,
    additionalData?: any
  ): Promise<void> {
    try {
      await prisma.calendarSyncLog.create({
        data: {
          operation: operation as any,
          status: 'FAILED',
          bookingId,
          eventId,
          errorMessage: error.message,
          details: {
            code: error.code,
            statusCode: error.statusCode,
            isRetryable: error.isRetryable,
            additionalData
          }
        }
      })
    } catch (logError) {
      console.error('Failed to log calendar error:', logError)
    }
  }

  /**
   * Handle booking creation with comprehensive error handling
   */
  async handleBookingCreation(
    bookingData: {
      id: string
      clientName: string
      clientEmail: string
      startTime: Date
      endTime: Date
      notes?: string
    }
  ): Promise<{ success: boolean; eventId?: string; error?: CalendarError }> {
    try {
      const eventId = await this.executeWithRetry(
        async () => {
          return await googleCalendarService.createEvent({
            summary: `Personal Training Session - ${bookingData.clientName}`,
            description: `Training session with ${bookingData.clientName}\n\nClient: ${bookingData.clientEmail}${bookingData.notes ? `\n\nNotes: ${bookingData.notes}` : ''}`,
            start: {
              dateTime: bookingData.startTime.toISOString(),
              timeZone: 'America/New_York'
            },
            end: {
              dateTime: bookingData.endTime.toISOString(),
              timeZone: 'America/New_York'
            },
            attendees: [
              {
                email: bookingData.clientEmail,
                displayName: bookingData.clientName
              }
            ],
            reminders: {
              useDefault: false,
              overrides: [
                { method: 'email', minutes: 24 * 60 },
                { method: 'popup', minutes: 60 }
              ]
            }
          })
        },
        'CREATE_EVENT'
      )

      return { success: true, eventId }
    } catch (error) {
      const calendarError = this.parseError(error)
      
      // Log error to database
      await this.logError(calendarError, 'CREATE', bookingData.id, undefined, {
        clientName: bookingData.clientName,
        clientEmail: bookingData.clientEmail,
        startTime: bookingData.startTime.toISOString(),
        endTime: bookingData.endTime.toISOString()
      })

      return { success: false, error: calendarError }
    }
  }

  /**
   * Handle booking update with comprehensive error handling
   */
  async handleBookingUpdate(
    bookingData: {
      id: string
      eventId: string
      clientName: string
      clientEmail: string
      startTime: Date
      endTime: Date
      notes?: string
    }
  ): Promise<{ success: boolean; error?: CalendarError }> {
    try {
      await this.executeWithRetry(
        async () => {
          await googleCalendarService.updateEvent(bookingData.eventId, {
            summary: `Personal Training Session - ${bookingData.clientName}`,
            description: `Training session with ${bookingData.clientName}\n\nClient: ${bookingData.clientEmail}${bookingData.notes ? `\n\nNotes: ${bookingData.notes}` : ''}`,
            start: {
              dateTime: bookingData.startTime.toISOString(),
              timeZone: 'America/New_York'
            },
            end: {
              dateTime: bookingData.endTime.toISOString(),
              timeZone: 'America/New_York'
            },
            attendees: [
              {
                email: bookingData.clientEmail,
                displayName: bookingData.clientName
              }
            ]
          })
        },
        'UPDATE_EVENT'
      )

      return { success: true }
    } catch (error) {
      const calendarError = this.parseError(error)
      
      // Log error to database
      await this.logError(calendarError, 'UPDATE', bookingData.id, bookingData.eventId, {
        clientName: bookingData.clientName,
        clientEmail: bookingData.clientEmail,
        startTime: bookingData.startTime.toISOString(),
        endTime: bookingData.endTime.toISOString()
      })

      return { success: false, error: calendarError }
    }
  }

  /**
   * Handle booking deletion with comprehensive error handling
   */
  async handleBookingDeletion(
    bookingId: string,
    eventId: string
  ): Promise<{ success: boolean; error?: CalendarError }> {
    try {
      await this.executeWithRetry(
        async () => {
          await googleCalendarService.deleteEvent(eventId)
        },
        'DELETE_EVENT'
      )

      return { success: true }
    } catch (error) {
      const calendarError = this.parseError(error)
      
      // Don't consider 404 as an error for deletion
      if (calendarError instanceof NotFoundError) {
        return { success: true }
      }
      
      // Log error to database
      await this.logError(calendarError, 'DELETE', bookingId, eventId)

      return { success: false, error: calendarError }
    }
  }

  /**
   * Handle availability check with comprehensive error handling
   */
  async handleAvailabilityCheck(
    startDate: Date,
    endDate: Date,
    slotDuration: number = 60
  ): Promise<{ success: boolean; availableSlots?: any[]; error?: CalendarError }> {
    try {
      const availableSlots = await this.executeWithRetry(
        async () => {
          return await googleCalendarService.getAvailableSlots(startDate, endDate, slotDuration)
        },
        'CHECK_AVAILABILITY'
      )

      return { success: true, availableSlots }
    } catch (error) {
      const calendarError = this.parseError(error)
      
      // Log error to database
      await this.logError(calendarError, 'SYNC', undefined, undefined, {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        slotDuration
      })

      return { success: false, error: calendarError }
    }
  }
}

// Export singleton instance
export const calendarErrorHandler = CalendarErrorHandler.getInstance()
