

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, isAdmin } from '@/lib/auth'
import { googleCalendarService } from '@/lib/google-calendar'
import { SyncOperation, SyncStatus } from '@/lib/types'

export const dynamic = 'force-dynamic'

// POST /api/admin/calendar/sync - Manual resync with Google Calendar
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    
    // Check if user is admin
    const userIsAdmin = await isAdmin()
    if (!userIsAdmin) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const force = searchParams.get('force') === 'true'
    
    // Test Google Calendar connection first
    const isConnected = await googleCalendarService.testConnection()
    if (!isConnected) {
      return NextResponse.json(
        { success: false, error: 'Unable to connect to Google Calendar' },
        { status: 500 }
      )
    }

    // Get all active bookings that need syncing
    const bookings = await prisma.booking.findMany({
      where: {
        status: { in: ['CONFIRMED', 'PENDING'] },
        OR: [
          { syncStatus: 'PENDING' as const },
          { syncStatus: 'FAILED' as const },
          ...(force ? [{ syncStatus: 'SYNCED' as const }] : [])
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    })

    let syncResults = {
      success: 0,
      failed: 0,
      total: bookings.length,
      errors: [] as string[]
    }

    // Process each booking
    for (const booking of bookings) {
      try {
        let eventId = booking.googleCalendarEventId
        
        if (!eventId) {
          // Create new event
          eventId = await googleCalendarService.createEvent({
            summary: `Personal Training Session - ${booking.user.name}`,
            description: `Training session with ${booking.user.name}\n\nClient: ${booking.user.email}${booking.notes ? `\n\nNotes: ${booking.notes}` : ''}`,
            start: {
              dateTime: booking.startTime.toISOString(),
              timeZone: 'America/New_York'
            },
            end: {
              dateTime: booking.endTime.toISOString(),
              timeZone: 'America/New_York'
            },
            attendees: [
              {
                email: booking.user.email,
                displayName: booking.user.name
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
          
          // Update booking with event ID
          await prisma.booking.update({
            where: { id: booking.id },
            data: {
              googleCalendarEventId: eventId,
              syncStatus: 'SYNCED',
              lastSyncAt: new Date(),
              syncError: null
            }
          })
        } else {
          // Update existing event
          await googleCalendarService.updateEvent(eventId, {
            summary: `Personal Training Session - ${booking.user.name}`,
            description: `Training session with ${booking.user.name}\n\nClient: ${booking.user.email}${booking.notes ? `\n\nNotes: ${booking.notes}` : ''}`,
            start: {
              dateTime: booking.startTime.toISOString(),
              timeZone: 'America/New_York'
            },
            end: {
              dateTime: booking.endTime.toISOString(),
              timeZone: 'America/New_York'
            },
            attendees: [
              {
                email: booking.user.email,
                displayName: booking.user.name
              }
            ]
          })
          
          // Update sync status
          await prisma.booking.update({
            where: { id: booking.id },
            data: {
              syncStatus: 'SYNCED',
              lastSyncAt: new Date(),
              syncError: null
            }
          })
        }

        // Log successful sync
        await prisma.calendarSyncLog.create({
          data: {
            operation: eventId === booking.googleCalendarEventId ? 'UPDATE' : 'CREATE',
            status: 'SYNCED',
            bookingId: booking.id,
            eventId: eventId,
            details: {
              bookingStart: booking.startTime.toISOString(),
              bookingEnd: booking.endTime.toISOString(),
              clientName: booking.user.name,
              clientEmail: booking.user.email
            }
          }
        })

        syncResults.success++
      } catch (error) {
        console.error(`Error syncing booking ${booking.id}:`, error)
        
        // Update booking with error
        await prisma.booking.update({
          where: { id: booking.id },
          data: {
            syncStatus: 'FAILED',
            syncError: error?.toString() || 'Unknown error',
            lastSyncAt: new Date()
          }
        })

        // Log failed sync
        await prisma.calendarSyncLog.create({
          data: {
            operation: booking.googleCalendarEventId ? 'UPDATE' : 'CREATE',
            status: 'FAILED',
            bookingId: booking.id,
            eventId: booking.googleCalendarEventId,
            errorMessage: error?.toString() || 'Unknown error'
          }
        })

        syncResults.failed++
        syncResults.errors.push(`Booking ${booking.id}: ${error?.toString() || 'Unknown error'}`)
      }
    }

    const isSuccess = syncResults.failed === 0
    const message = isSuccess 
      ? `✅ Calendar successfully synced with Google. ${syncResults.success} bookings synced.`
      : `⚠️ Partial sync completed. ${syncResults.success} succeeded, ${syncResults.failed} failed.`

    return NextResponse.json({
      success: isSuccess,
      message,
      data: syncResults
    })
  } catch (error) {
    console.error('Calendar sync error:', error)
    
    // Log general sync error
    await prisma.calendarSyncLog.create({
      data: {
        operation: 'SYNC',
        status: 'FAILED',
        errorMessage: error?.toString() || 'Unknown error'
      }
    })

    return NextResponse.json(
      { success: false, error: '⚠️ Unable to sync with Google Calendar' },
      { status: 500 }
    )
  }
}

// GET /api/admin/calendar/sync - Get sync status
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    
    // Check if user is admin
    const userIsAdmin = await isAdmin()
    if (!userIsAdmin) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const page = parseInt(searchParams.get('page') || '1')

    // Get sync statistics
    const [syncStats, recentLogs] = await Promise.all([
      prisma.booking.groupBy({
        by: ['syncStatus'],
        _count: {
          _all: true
        },
        where: {
          status: { in: ['CONFIRMED', 'PENDING'] }
        }
      }),
      prisma.calendarSyncLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit
      })
    ])

    const stats = {
      synced: syncStats.find(s => s.syncStatus === 'SYNCED')?._count._all || 0,
      pending: syncStats.find(s => s.syncStatus === 'PENDING')?._count._all || 0,
      failed: syncStats.find(s => s.syncStatus === 'FAILED')?._count._all || 0,
      conflict: syncStats.find(s => s.syncStatus === 'CONFLICT')?._count._all || 0,
      total: syncStats.reduce((sum, s) => sum + s._count._all, 0)
    }

    return NextResponse.json({
      success: true,
      data: {
        stats,
        recentLogs: recentLogs.map(log => ({
          id: log.id,
          operation: log.operation,
          status: log.status,
          errorMessage: log.errorMessage,
          createdAt: log.createdAt,
          bookingId: log.bookingId
        }))
      }
    })
  } catch (error) {
    console.error('Get sync status error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get sync status' },
      { status: 500 }
    )
  }
}

