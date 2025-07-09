

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, isAdmin } from '@/lib/auth'
import { AvailabilityType, RecurringType } from '@/lib/types'

export const dynamic = 'force-dynamic'

// GET /api/admin/availability - Get availability settings
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
    const type = searchParams.get('type') as AvailabilityType | null
    const active = searchParams.get('active') === 'true'

    const where: any = {}
    if (type) where.type = type
    if (active) where.isActive = true

    const availabilitySettings = await prisma.availabilitySettings.findMany({
      where,
      orderBy: [
        { type: 'asc' },
        { dayOfWeek: 'asc' },
        { startTime: 'asc' }
      ]
    })

    // Group by type for easier frontend consumption
    const groupedSettings = {
      workingHours: availabilitySettings.filter(s => s.type === 'WORKING_HOURS'),
      breaks: availabilitySettings.filter(s => s.type === 'BREAK'),
      blackoutDates: availabilitySettings.filter(s => s.type === 'BLACKOUT_DATE'),
      blackoutPeriods: availabilitySettings.filter(s => s.type === 'BLACKOUT_PERIOD')
    }

    return NextResponse.json({
      success: true,
      data: {
        all: availabilitySettings,
        grouped: groupedSettings
      }
    })
  } catch (error) {
    console.error('Get availability settings error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get availability settings' },
      { status: 500 }
    )
  }
}

// POST /api/admin/availability - Create availability setting
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

    const body = await request.json()
    const {
      type,
      dayOfWeek,
      startTime,
      endTime,
      breakName,
      blackoutDate,
      blackoutStart,
      blackoutEnd,
      isRecurring,
      recurringType,
      title,
      description,
      isActive = true
    } = body

    // Validate required fields based on type
    if (!type || !['WORKING_HOURS', 'BREAK', 'BLACKOUT_DATE', 'BLACKOUT_PERIOD'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid availability type' },
        { status: 400 }
      )
    }

    if (type === 'WORKING_HOURS' && (!dayOfWeek && dayOfWeek !== 0 || !startTime || !endTime)) {
      return NextResponse.json(
        { success: false, error: 'Working hours require dayOfWeek, startTime, and endTime' },
        { status: 400 }
      )
    }

    if (type === 'BREAK' && (!breakName || !startTime || !endTime)) {
      return NextResponse.json(
        { success: false, error: 'Breaks require breakName, startTime, and endTime' },
        { status: 400 }
      )
    }

    if (type === 'BLACKOUT_DATE' && !blackoutDate) {
      return NextResponse.json(
        { success: false, error: 'Blackout date requires blackoutDate' },
        { status: 400 }
      )
    }

    if (type === 'BLACKOUT_PERIOD' && (!blackoutStart || !blackoutEnd)) {
      return NextResponse.json(
        { success: false, error: 'Blackout period requires blackoutStart and blackoutEnd' },
        { status: 400 }
      )
    }

    // Create availability setting
    const availabilitySetting = await prisma.availabilitySettings.create({
      data: {
        type,
        dayOfWeek: dayOfWeek ?? null,
        startTime: startTime ?? null,
        endTime: endTime ?? null,
        breakName: breakName ?? null,
        blackoutDate: blackoutDate ? new Date(blackoutDate) : null,
        blackoutStart: blackoutStart ? new Date(blackoutStart) : null,
        blackoutEnd: blackoutEnd ? new Date(blackoutEnd) : null,
        isRecurring: isRecurring ?? false,
        recurringType: recurringType ?? null,
        title: title ?? null,
        description: description ?? null,
        isActive
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Availability setting created successfully',
      data: availabilitySetting
    })
  } catch (error) {
    console.error('Create availability setting error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create availability setting' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/availability - Bulk update availability settings
export async function PUT(request: NextRequest) {
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

    const body = await request.json()
    const { settings } = body

    if (!Array.isArray(settings)) {
      return NextResponse.json(
        { success: false, error: 'Settings must be an array' },
        { status: 400 }
      )
    }

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (prisma) => {
      const results = []

      for (const setting of settings) {
        const { id, ...updateData } = setting
        
        if (id) {
          // Update existing setting
          const updated = await prisma.availabilitySettings.update({
            where: { id },
            data: updateData
          })
          results.push(updated)
        } else {
          // Create new setting
          const created = await prisma.availabilitySettings.create({
            data: updateData
          })
          results.push(created)
        }
      }

      return results
    })

    return NextResponse.json({
      success: true,
      message: `💾 Availability settings updated successfully`,
      data: result
    })
  } catch (error) {
    console.error('Bulk update availability settings error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update availability settings' },
      { status: 500 }
    )
  }
}

