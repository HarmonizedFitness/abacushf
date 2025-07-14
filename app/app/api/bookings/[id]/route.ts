
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, isAdmin } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET /api/bookings/[id] - Get specific booking
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const bookingId = params.id

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
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

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Check permissions - user can only see their own bookings (unless admin)
    const userIsAdmin = await isAdmin()
    if (!userIsAdmin && booking.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      data: booking,
    })
  } catch (error) {
    console.error('Get booking error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch booking' },
      { status: 500 }
    )
  }
}

// PATCH /api/bookings/[id] - Update booking
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const bookingId = params.id
    const body = await request.json()
    const { startTime, endTime, notes, status } = body

    // Get existing booking
    const existingBooking = await prisma.booking.findUnique({
      where: { id: bookingId },
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

    if (!existingBooking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Check permissions
    const userIsAdmin = await isAdmin()
    if (!userIsAdmin && existingBooking.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    // Only allow certain status changes for non-admins
    if (!userIsAdmin && status && status !== 'CANCELLED') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized status change' },
        { status: 403 }
      )
    }

    const updateData: any = {}

    if (startTime) updateData.startTime = new Date(startTime)
    if (endTime) updateData.endTime = new Date(endTime)
    if (notes !== undefined) updateData.notes = notes
    if (status) updateData.status = status

    // Validate dates if provided
    if (updateData.startTime || updateData.endTime) {
      const start = updateData.startTime || existingBooking.startTime
      const end = updateData.endTime || existingBooking.endTime

      if (start >= end) {
        return NextResponse.json(
          { success: false, error: 'End time must be after start time' },
          { status: 400 }
        )
      }

      if (start < new Date() && start !== existingBooking.startTime) {
        return NextResponse.json(
          { success: false, error: 'Cannot reschedule to past time' },
          { status: 400 }
        )
      }

      // Check for conflicts (excluding current booking)
      const conflictingBooking = await prisma.booking.findFirst({
        where: {
          id: { not: bookingId },
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

      if (conflictingBooking) {
        return NextResponse.json(
          { success: false, error: 'Time slot is already booked' },
          { status: 409 }
        )
      }
    }



    // Update booking
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: updateData,
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

    // Create notification for status changes
    if (status === 'CANCELLED') {
      await prisma.notification.create({
        data: {
          userId: existingBooking.userId,
          type: 'BOOKING_CANCELLED',
          title: 'Session Cancelled',
          message: `Your training session for ${existingBooking.startTime.toLocaleDateString()} has been cancelled.`,
          isRead: false,
          metadata: {
            bookingId: bookingId,
            originalStartTime: existingBooking.startTime.toISOString(),
          },
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Booking updated successfully',
      data: updatedBooking,
    })
  } catch (error) {
    console.error('Update booking error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update booking' },
      { status: 500 }
    )
  }
}

// DELETE /api/bookings/[id] - Cancel booking
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const bookingId = params.id

    // Get existing booking
    const existingBooking = await prisma.booking.findUnique({
      where: { id: bookingId },
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

    if (!existingBooking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Check permissions
    const userIsAdmin = await isAdmin()
    if (!userIsAdmin && existingBooking.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    // Check if booking can be cancelled (e.g., not in the past)
    if (existingBooking.startTime < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Cannot cancel past sessions' },
        { status: 400 }
      )
    }

    // Update booking status to cancelled instead of deleting
    const cancelledBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: { 
        status: 'CANCELLED',
      },
    })

    // Create notification
    await prisma.notification.create({
      data: {
        userId: existingBooking.userId,
        type: 'BOOKING_CANCELLED',
        title: 'Session Cancelled',
        message: `Your training session for ${existingBooking.startTime.toLocaleDateString()} has been cancelled.`,
        isRead: false,
        metadata: {
          bookingId: bookingId,
          originalStartTime: existingBooking.startTime.toISOString(),
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: cancelledBooking,
    })
  } catch (error) {
    console.error('Cancel booking error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to cancel booking' },
      { status: 500 }
    )
  }
}
