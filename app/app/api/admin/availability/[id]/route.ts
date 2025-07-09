

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, isAdmin } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET /api/admin/availability/[id] - Get specific availability setting
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const settingId = params.id

    const availabilitySetting = await prisma.availabilitySettings.findUnique({
      where: { id: settingId }
    })

    if (!availabilitySetting) {
      return NextResponse.json(
        { success: false, error: 'Availability setting not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: availabilitySetting
    })
  } catch (error) {
    console.error('Get availability setting error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get availability setting' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/availability/[id] - Update availability setting
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const settingId = params.id
    const body = await request.json()

    // Check if setting exists
    const existingSetting = await prisma.availabilitySettings.findUnique({
      where: { id: settingId }
    })

    if (!existingSetting) {
      return NextResponse.json(
        { success: false, error: 'Availability setting not found' },
        { status: 404 }
      )
    }

    const updateData: any = {}
    
    // Update only provided fields
    if (body.dayOfWeek !== undefined) updateData.dayOfWeek = body.dayOfWeek
    if (body.startTime !== undefined) updateData.startTime = body.startTime
    if (body.endTime !== undefined) updateData.endTime = body.endTime
    if (body.breakName !== undefined) updateData.breakName = body.breakName
    if (body.blackoutDate !== undefined) updateData.blackoutDate = body.blackoutDate ? new Date(body.blackoutDate) : null
    if (body.blackoutStart !== undefined) updateData.blackoutStart = body.blackoutStart ? new Date(body.blackoutStart) : null
    if (body.blackoutEnd !== undefined) updateData.blackoutEnd = body.blackoutEnd ? new Date(body.blackoutEnd) : null
    if (body.isRecurring !== undefined) updateData.isRecurring = body.isRecurring
    if (body.recurringType !== undefined) updateData.recurringType = body.recurringType
    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.isActive !== undefined) updateData.isActive = body.isActive

    const updatedSetting = await prisma.availabilitySettings.update({
      where: { id: settingId },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      message: 'Availability setting updated successfully',
      data: updatedSetting
    })
  } catch (error) {
    console.error('Update availability setting error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update availability setting' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/availability/[id] - Delete availability setting
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const settingId = params.id

    // Check if setting exists
    const existingSetting = await prisma.availabilitySettings.findUnique({
      where: { id: settingId }
    })

    if (!existingSetting) {
      return NextResponse.json(
        { success: false, error: 'Availability setting not found' },
        { status: 404 }
      )
    }

    await prisma.availabilitySettings.delete({
      where: { id: settingId }
    })

    return NextResponse.json({
      success: true,
      message: 'Availability setting deleted successfully'
    })
  } catch (error) {
    console.error('Delete availability setting error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete availability setting' },
      { status: 500 }
    )
  }
}

