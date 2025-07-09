

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { googleCalendarService } from '@/lib/google-calendar'
import { calendarErrorHandler } from '@/lib/calendar-error-handler'
import { AvailabilitySlot } from '@/lib/types'

export const dynamic = 'force-dynamic'

// POST /api/calendar/freebusy - Check availability for given time range
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { startDate, endDate, slotDuration = 60 } = body

    if (!startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: 'Start date and end date are required' },
        { status: 400 }
      )
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    if (start >= end) {
      return NextResponse.json(
        { success: false, error: 'End date must be after start date' },
        { status: 400 }
      )
    }

    // Get availability settings from database
    const availabilitySettings = await prisma.availabilitySettings.findMany({
      where: {
        isActive: true
      }
    })

    // Get working hours
    const workingHours = availabilitySettings
      .filter(s => s.type === 'WORKING_HOURS')
      .map(s => ({
        dayOfWeek: s.dayOfWeek!,
        startTime: s.startTime!,
        endTime: s.endTime!
      }))

    // Get breaks
    const breaks = availabilitySettings
      .filter(s => s.type === 'BREAK')
      .map(s => ({
        name: s.breakName!,
        startTime: s.startTime!,
        endTime: s.endTime!,
        dayOfWeek: s.dayOfWeek,
        isRecurring: s.isRecurring
      }))

    // Get blackout periods
    const blackoutPeriods = availabilitySettings
      .filter(s => s.type === 'BLACKOUT_DATE' || s.type === 'BLACKOUT_PERIOD')
      .map(s => ({
        start: s.blackoutDate || s.blackoutStart!,
        end: s.blackoutDate || s.blackoutEnd!,
        reason: s.title || s.description || 'Unavailable',
        isRecurring: s.isRecurring
      }))

    // Get existing bookings
    const existingBookings = await prisma.booking.findMany({
      where: {
        status: { in: ['CONFIRMED', 'PENDING'] },
        startTime: {
          gte: start,
          lte: end
        }
      }
    })

    let availableSlots: AvailabilitySlot[] = []
    
    // Get available slots using comprehensive error handler
    const calendarResult = await calendarErrorHandler.handleAvailabilityCheck(
      start,
      end,
      slotDuration
    )

    if (calendarResult.success && calendarResult.availableSlots) {
      // Convert to AvailabilitySlot format
      availableSlots = calendarResult.availableSlots.map(slot => ({
        start: slot.start,
        end: slot.end,
        isAvailable: true
      }))

      // Filter out slots that conflict with existing bookings
      availableSlots = availableSlots.filter(slot => {
        return !existingBookings.some(booking => {
          const bookingStart = new Date(booking.startTime)
          const bookingEnd = new Date(booking.endTime)
          
          return (
            (slot.start >= bookingStart && slot.start < bookingEnd) ||
            (slot.end > bookingStart && slot.end <= bookingEnd) ||
            (slot.start <= bookingStart && slot.end >= bookingEnd)
          )
        })
      })

      // Filter out slots that conflict with breaks
      availableSlots = availableSlots.filter(slot => {
        return !breaks.some(breakTime => {
          const slotDay = slot.start.getDay()
          const slotStartTime = slot.start.toTimeString().slice(0, 5)
          const slotEndTime = slot.end.toTimeString().slice(0, 5)
          
          // Check if break applies to this day
          if (breakTime.dayOfWeek !== null && breakTime.dayOfWeek !== slotDay) {
            return false
          }
          
          // Check time overlap
          return (
            (slotStartTime >= breakTime.startTime && slotStartTime < breakTime.endTime) ||
            (slotEndTime > breakTime.startTime && slotEndTime <= breakTime.endTime) ||
            (slotStartTime <= breakTime.startTime && slotEndTime >= breakTime.endTime)
          )
        })
      })

      // Filter out slots that conflict with blackout periods
      availableSlots = availableSlots.filter(slot => {
        return !blackoutPeriods.some(blackout => {
          const blackoutStart = new Date(blackout.start)
          const blackoutEnd = new Date(blackout.end)
          
          return (
            (slot.start >= blackoutStart && slot.start < blackoutEnd) ||
            (slot.end > blackoutStart && slot.end <= blackoutEnd) ||
            (slot.start <= blackoutStart && slot.end >= blackoutEnd)
          )
        })
      })
    } else {
      console.error('Error getting Google Calendar availability:', calendarResult.error)
      
      // Fallback to basic availability calculation without Google Calendar
      const currentDate = new Date(start)
      
      while (currentDate <= end) {
        const dayOfWeek = currentDate.getDay()
        const dayWorkingHours = workingHours.filter(wh => wh.dayOfWeek === dayOfWeek)
        
        for (const workingHour of dayWorkingHours) {
          const [startHour, startMinute] = workingHour.startTime.split(':').map(Number)
          const [endHour, endMinute] = workingHour.endTime.split(':').map(Number)

          const dayStart = new Date(currentDate)
          dayStart.setHours(startHour, startMinute, 0, 0)

          const dayEnd = new Date(currentDate)
          dayEnd.setHours(endHour, endMinute, 0, 0)

          let slotStart = new Date(dayStart)
          while (slotStart < dayEnd) {
            const slotEnd = new Date(slotStart.getTime() + slotDuration * 60000)
            
            if (slotEnd <= dayEnd && slotStart >= new Date()) {
              // Check if slot conflicts with existing bookings
              const isConflict = existingBookings.some(booking => {
                const bookingStart = new Date(booking.startTime)
                const bookingEnd = new Date(booking.endTime)
                
                return (
                  (slotStart >= bookingStart && slotStart < bookingEnd) ||
                  (slotEnd > bookingStart && slotEnd <= bookingEnd) ||
                  (slotStart <= bookingStart && slotEnd >= bookingEnd)
                )
              })

              if (!isConflict) {
                availableSlots.push({
                  start: new Date(slotStart),
                  end: new Date(slotEnd),
                  isAvailable: true
                })
              }
            }
            
            slotStart = new Date(slotEnd)
          }
        }
        
        currentDate.setDate(currentDate.getDate() + 1)
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        availableSlots,
        workingHours,
        breaks,
        blackoutPeriods,
        existingBookings: existingBookings.map(booking => ({
          id: booking.id,
          startTime: booking.startTime,
          endTime: booking.endTime,
          status: booking.status
        }))
      }
    })
  } catch (error) {
    console.error('Check availability error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to check availability' },
      { status: 500 }
    )
  }
}

