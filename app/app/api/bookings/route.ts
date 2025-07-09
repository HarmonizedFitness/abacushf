
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser, requireAuth, getUserCredits, canBookSession } from '@/lib/auth'
import { googleCalendarService, createBookingEvent } from '@/lib/google-calendar'
import { calendarErrorHandler } from '@/lib/calendar-error-handler'

export const dynamic = 'force-dynamic'

// GET /api/bookings - Get user's bookings
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '10')
    const page = parseInt(searchParams.get('page') || '1')

    const where: any = {
      userId: user.id,
    }

    if (status) {
      where.status = status
    }

    if (startDate || endDate) {
      where.startTime = {}
      if (startDate) {
        where.startTime.gte = new Date(startDate)
      }
      if (endDate) {
        where.startTime.lte = new Date(endDate)
      }
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        orderBy: { startTime: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.booking.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: bookings,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    })
  } catch (error) {
    console.error('Get bookings error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch bookings' },
      { status: 500 }
    )
  }
}

// POST /api/bookings - Create new booking
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { startTime, endTime, notes, creditsUsed = 1 } = body

    // Validate input
    if (!startTime || !endTime) {
      return NextResponse.json(
        { success: false, error: 'Start time and end time are required' },
        { status: 400 }
      )
    }

    const start = new Date(startTime)
    const end = new Date(endTime)

    // Validate dates
    if (start >= end) {
      return NextResponse.json(
        { success: false, error: 'End time must be after start time' },
        { status: 400 }
      )
    }

    if (start < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Cannot book sessions in the past' },
        { status: 400 }
      )
    }

    // Check if user has enough credits
    const canBook = await canBookSession(user.id, creditsUsed)
    if (!canBook) {
      return NextResponse.json(
        { success: false, error: 'Insufficient credits to book this session' },
        { status: 400 }
      )
    }

    // Check for conflicts
    const existingBooking = await prisma.booking.findFirst({
      where: {
        OR: [
          {
            startTime: { lte: start },
            endTime: { gt: start },
          },
          {
            startTime: { lt: end },
            endTime: { gte: end },
          },
          {
            startTime: { gte: start },
            endTime: { lte: end },
          },
        ],
        status: {
          in: ['CONFIRMED', 'PENDING'],
        },
      },
    })

    if (existingBooking) {
      return NextResponse.json(
        { success: false, error: 'Time slot is already booked' },
        { status: 409 }
      )
    }

    // Create booking with Google Calendar integration using comprehensive error handling
    let googleCalendarEventId: string | null = null
    let syncStatus: 'PENDING' | 'SYNCED' | 'FAILED' = 'PENDING'
    let syncError: string | null = null

    // Create booking first to get ID for error logging
    const booking = await prisma.booking.create({
      data: {
        userId: user.id,
        startTime: start,
        endTime: end,
        notes: notes || null,
        creditsUsed,
        status: 'CONFIRMED',
        syncStatus: 'PENDING',
        lastSyncAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Try to create Google Calendar event using comprehensive error handler
    const calendarResult = await calendarErrorHandler.handleBookingCreation({
      id: booking.id,
      clientName: user.name,
      clientEmail: user.email,
      startTime: start,
      endTime: end,
      notes: notes || undefined
    })

    if (calendarResult.success) {
      googleCalendarEventId = calendarResult.eventId!
      syncStatus = 'SYNCED'
      
      // Log successful sync
      await prisma.calendarSyncLog.create({
        data: {
          operation: 'CREATE',
          status: 'SYNCED',
          bookingId: booking.id,
          eventId: googleCalendarEventId,
          details: {
            clientName: user.name,
            clientEmail: user.email,
            startTime: start.toISOString(),
            endTime: end.toISOString(),
            notes: notes || null
          }
        }
      })
    } else {
      syncError = calendarResult.error?.message || 'Unknown error'
      syncStatus = 'FAILED'
      console.error('Calendar sync failed:', calendarResult.error)
    }

    // Update booking with sync results
    const updatedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        googleCalendarEventId,
        syncStatus,
        syncError,
        lastSyncAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Create notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'BOOKING_CONFIRMED',
        title: 'Session Confirmed! 📅',
        message: `Your training session for ${start.toLocaleDateString()} at ${start.toLocaleTimeString()} has been confirmed.`,
        isRead: false,
        metadata: {
          bookingId: updatedBooking.id,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          googleCalendarEventId,
          syncStatus
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Your session has been booked and added to our schedule. See you soon!',
      data: updatedBooking,
    })
  } catch (error) {
    console.error('Create booking error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create booking' },
      { status: 500 }
    )
  }
}
