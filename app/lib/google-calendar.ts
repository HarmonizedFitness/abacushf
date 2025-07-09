
import { google } from 'googleapis'
import { GoogleAuth } from 'google-auth-library'

// Service Account Configuration
const serviceAccountConfig = {
  type: 'service_account',
  project_id: 'sacred-augury-465402-t5',
  private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
  private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: 'booking-app@sacred-augury-465402-t5.iam.gserviceaccount.com',
  client_id: process.env.GOOGLE_CLIENT_ID,
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/booking-app%40sacred-augury-465402-t5.iam.gserviceaccount.com`,
  universe_domain: 'googleapis.com'
}

// Initialize Google Auth
const auth = new GoogleAuth({
  credentials: serviceAccountConfig,
  scopes: [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/calendar.freebusy'
  ]
})

// Initialize Google Calendar API
const calendar = google.calendar({ version: 'v3', auth })

export interface CalendarEvent {
  id?: string
  summary: string
  description?: string
  start: {
    dateTime: string
    timeZone: string
  }
  end: {
    dateTime: string
    timeZone: string
  }
  attendees?: Array<{
    email: string
    displayName?: string
  }>
  reminders?: {
    useDefault: boolean
    overrides?: Array<{
      method: 'email' | 'popup'
      minutes: number
    }>
  }
}

export interface FreeBusyRequest {
  timeMin: string
  timeMax: string
  timeZone?: string
  items: Array<{
    id: string
  }>
}

export interface FreeBusyResponse {
  busy: Array<{
    start: string
    end: string
  }>
}

export class GoogleCalendarService {
  private calendarId: string
  private timeZone: string

  constructor(calendarId: string = 'primary', timeZone: string = 'America/New_York') {
    this.calendarId = calendarId
    this.timeZone = timeZone
  }

  /**
   * Create a new calendar event
   */
  async createEvent(event: CalendarEvent): Promise<string> {
    try {
      const response = await calendar.events.insert({
        calendarId: this.calendarId,
        requestBody: {
          ...event,
          start: {
            ...event.start,
            timeZone: this.timeZone
          },
          end: {
            ...event.end,
            timeZone: this.timeZone
          }
        }
      })

      if (!response.data.id) {
        throw new Error('Failed to create calendar event: No event ID returned')
      }

      return response.data.id
    } catch (error) {
      console.error('Error creating calendar event:', error)
      throw new Error(`Failed to create calendar event: ${error}`)
    }
  }

  /**
   * Update an existing calendar event
   */
  async updateEvent(eventId: string, event: Partial<CalendarEvent>): Promise<void> {
    try {
      await calendar.events.update({
        calendarId: this.calendarId,
        eventId,
        requestBody: {
          ...event,
          start: event.start ? {
            ...event.start,
            timeZone: this.timeZone
          } : undefined,
          end: event.end ? {
            ...event.end,
            timeZone: this.timeZone
          } : undefined
        }
      })
    } catch (error) {
      console.error('Error updating calendar event:', error)
      throw new Error(`Failed to update calendar event: ${error}`)
    }
  }

  /**
   * Delete a calendar event
   */
  async deleteEvent(eventId: string): Promise<void> {
    try {
      await calendar.events.delete({
        calendarId: this.calendarId,
        eventId
      })
    } catch (error: any) {
      console.error('Error deleting calendar event:', error)
      // Don't throw error if event doesn't exist
      if (error?.status !== 404) {
        throw new Error(`Failed to delete calendar event: ${error}`)
      }
    }
  }

  /**
   * Get calendar event by ID
   */
  async getEvent(eventId: string): Promise<CalendarEvent | null> {
    try {
      const response = await calendar.events.get({
        calendarId: this.calendarId,
        eventId
      })

      if (!response.data) {
        return null
      }

      return {
        id: response.data.id ?? undefined,
        summary: response.data.summary ?? '',
        description: response.data.description ?? undefined,
        start: {
          dateTime: response.data.start?.dateTime ?? '',
          timeZone: response.data.start?.timeZone ?? this.timeZone
        },
        end: {
          dateTime: response.data.end?.dateTime ?? '',
          timeZone: response.data.end?.timeZone ?? this.timeZone
        },
        attendees: response.data.attendees?.map(attendee => ({
          email: attendee.email ?? '',
          displayName: attendee.displayName ?? undefined
        })) ?? undefined,
        reminders: response.data.reminders ? {
          useDefault: response.data.reminders.useDefault ?? false,
          overrides: response.data.reminders.overrides?.map(override => ({
            method: override.method as 'email' | 'popup',
            minutes: override.minutes ?? 0
          })) ?? undefined
        } : undefined
      }
    } catch (error: any) {
      console.error('Error getting calendar event:', error)
      if (error?.status === 404) {
        return null
      }
      throw new Error(`Failed to get calendar event: ${error}`)
    }
  }

  /**
   * Check busy/free time using freebusy API
   */
  async checkFreeBusy(request: FreeBusyRequest): Promise<FreeBusyResponse> {
    try {
      const response = await calendar.freebusy.query({
        requestBody: {
          timeMin: request.timeMin,
          timeMax: request.timeMax,
          timeZone: request.timeZone ?? this.timeZone,
          items: request.items
        }
      })

      const calendarData = response.data.calendars?.[this.calendarId]
      const busy = calendarData?.busy ?? []

      return {
        busy: busy.map(busyTime => ({
          start: busyTime.start ?? '',
          end: busyTime.end ?? ''
        }))
      }
    } catch (error) {
      console.error('Error checking free/busy:', error)
      throw new Error(`Failed to check availability: ${error}`)
    }
  }

  /**
   * Get available time slots for a given date range
   */
  async getAvailableSlots(
    startDate: Date,
    endDate: Date,
    slotDuration: number = 60, // minutes
    workingHours: { start: string; end: string }[] = [
      { start: '09:00', end: '17:00' }
    ]
  ): Promise<Array<{ start: Date; end: Date }>> {
    try {
      // Get busy times from Google Calendar
      const freeBusyResponse = await this.checkFreeBusy({
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        items: [{ id: this.calendarId }]
      })

      const busyTimes = freeBusyResponse.busy.map(busy => ({
        start: new Date(busy.start),
        end: new Date(busy.end)
      }))

      // Generate available slots based on working hours
      const availableSlots: Array<{ start: Date; end: Date }> = []
      const currentDate = new Date(startDate)

      while (currentDate <= endDate) {
        for (const workingHour of workingHours) {
          const [startHour, startMinute] = workingHour.start.split(':').map(Number)
          const [endHour, endMinute] = workingHour.end.split(':').map(Number)

          const dayStart = new Date(currentDate)
          dayStart.setHours(startHour, startMinute, 0, 0)

          const dayEnd = new Date(currentDate)
          dayEnd.setHours(endHour, endMinute, 0, 0)

          let slotStart = new Date(dayStart)
          while (slotStart < dayEnd) {
            const slotEnd = new Date(slotStart.getTime() + slotDuration * 60000)
            
            if (slotEnd <= dayEnd) {
              // Check if slot conflicts with busy times
              const isConflict = busyTimes.some(busy => 
                (slotStart >= busy.start && slotStart < busy.end) ||
                (slotEnd > busy.start && slotEnd <= busy.end) ||
                (slotStart <= busy.start && slotEnd >= busy.end)
              )

              if (!isConflict && slotStart >= new Date()) {
                availableSlots.push({
                  start: new Date(slotStart),
                  end: new Date(slotEnd)
                })
              }
            }
            
            slotStart = new Date(slotEnd)
          }
        }
        
        currentDate.setDate(currentDate.getDate() + 1)
      }

      return availableSlots
    } catch (error) {
      console.error('Error getting available slots:', error)
      throw new Error(`Failed to get available slots: ${error}`)
    }
  }

  /**
   * Test connection to Google Calendar API
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await calendar.calendarList.list()
      return response.status === 200
    } catch (error) {
      console.error('Google Calendar connection test failed:', error)
      return false
    }
  }
}

// Default service instance
export const googleCalendarService = new GoogleCalendarService()

// Utility functions for booking integration
export const createBookingEvent = (
  clientName: string,
  clientEmail: string,
  startTime: Date,
  endTime: Date,
  notes?: string
): CalendarEvent => ({
  summary: `Personal Training Session - ${clientName}`,
  description: `Training session with ${clientName}\n\nClient: ${clientEmail}${notes ? `\n\nNotes: ${notes}` : ''}`,
  start: {
    dateTime: startTime.toISOString(),
    timeZone: 'America/New_York'
  },
  end: {
    dateTime: endTime.toISOString(),
    timeZone: 'America/New_York'
  },
  attendees: [
    {
      email: clientEmail,
      displayName: clientName
    }
  ],
  reminders: {
    useDefault: false,
    overrides: [
      { method: 'email', minutes: 24 * 60 }, // 24 hours
      { method: 'popup', minutes: 60 } // 1 hour
    ]
  }
})

export const updateBookingEvent = (
  eventId: string,
  clientName: string,
  clientEmail: string,
  startTime: Date,
  endTime: Date,
  notes?: string
): { eventId: string; event: Partial<CalendarEvent> } => ({
  eventId,
  event: {
    summary: `Personal Training Session - ${clientName}`,
    description: `Training session with ${clientName}\n\nClient: ${clientEmail}${notes ? `\n\nNotes: ${notes}` : ''}`,
    start: {
      dateTime: startTime.toISOString(),
      timeZone: 'America/New_York'
    },
    end: {
      dateTime: endTime.toISOString(),
      timeZone: 'America/New_York'
    },
    attendees: [
      {
        email: clientEmail,
        displayName: clientName
      }
    ]
  }
})
