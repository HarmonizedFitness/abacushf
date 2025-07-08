
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET /api/schedule/available-slots - Get available time slots
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const duration = parseInt(searchParams.get('duration') || '60') // Default 60 minutes

    if (!date) {
      return NextResponse.json(
        { success: false, error: 'Date is required' },
        { status: 400 }
      )
    }

    const selectedDate = new Date(date)
    const dayOfWeek = selectedDate.getDay() // 0 = Sunday, 1 = Monday, etc.
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const dayName = dayNames[dayOfWeek]

    // Get business hours for the selected day
    const businessHoursConfig = await prisma.businessConfig.findUnique({
      where: { key: `business_hours_${dayName}` },
    })

    if (!businessHoursConfig) {
      return NextResponse.json({
        success: true,
        data: { slots: [], isOpen: false },
      })
    }

    const businessHours = JSON.parse(businessHoursConfig.value)

    if (!businessHours.isOpen) {
      return NextResponse.json({
        success: true,
        data: { slots: [], isOpen: false },
      })
    }

    // Create time slots for the day
    const startTime = businessHours.start // e.g., "07:00"
    const endTime = businessHours.end // e.g., "19:00"

    const slots = generateTimeSlots(selectedDate, startTime, endTime, duration)

    // Get existing bookings for the date
    const startOfDay = new Date(selectedDate)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(selectedDate)
    endOfDay.setHours(23, 59, 59, 999)

    const existingBookings = await prisma.booking.findMany({
      where: {
        startTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          in: ['CONFIRMED', 'PENDING'],
        },
      },
      select: {
        startTime: true,
        endTime: true,
      },
    })

    // Mark unavailable slots
    const availableSlots = slots.map(slot => {
      const isBooked = existingBookings.some(booking => 
        (slot.startTime >= booking.startTime && slot.startTime < booking.endTime) ||
        (slot.endTime > booking.startTime && slot.endTime <= booking.endTime) ||
        (slot.startTime <= booking.startTime && slot.endTime >= booking.endTime)
      )

      return {
        ...slot,
        isAvailable: !isBooked && slot.startTime > new Date(),
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        slots: availableSlots,
        isOpen: true,
        businessHours,
      },
    })
  } catch (error) {
    console.error('Get available slots error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch available slots' },
      { status: 500 }
    )
  }
}

function generateTimeSlots(date: Date, startTime: string, endTime: string, duration: number) {
  const slots = []
  const [startHour, startMinute] = startTime.split(':').map(Number)
  const [endHour, endMinute] = endTime.split(':').map(Number)

  const start = new Date(date)
  start.setHours(startHour, startMinute, 0, 0)

  const end = new Date(date)
  end.setHours(endHour, endMinute, 0, 0)

  let current = new Date(start)

  while (current < end) {
    const slotEnd = new Date(current.getTime() + duration * 60 * 1000)

    if (slotEnd <= end) {
      slots.push({
        id: `${current.getTime()}-${slotEnd.getTime()}`,
        startTime: new Date(current),
        endTime: new Date(slotEnd),
        duration,
        isAvailable: true, // Will be updated based on existing bookings
      })
    }

    current = new Date(current.getTime() + duration * 60 * 1000)
  }

  return slots
}
