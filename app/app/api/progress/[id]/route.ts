
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const progressUpdateSchema = z.object({
  value: z.number().min(0, 'Value must be positive'),
  unit: z.string().optional(),
  notes: z.string().optional(),
  recordedAt: z.string().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = progressUpdateSchema.parse(body)

    // Get existing progress entry
    const existingEntry = await prisma.progressEntry.findUnique({
      where: { id: params.id },
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

    if (!existingEntry) {
      return NextResponse.json({ success: false, error: 'Progress entry not found' }, { status: 404 })
    }

    // Check permissions
    if (user.role === 'CLIENT' && existingEntry.userId !== user.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
    }

    // Update progress entry
    const updatedEntry = await prisma.progressEntry.update({
      where: { id: params.id },
      data: {
        value: validatedData.value,
        unit: validatedData.unit || null,
        notes: validatedData.notes || null,
        recordedAt: validatedData.recordedAt ? new Date(validatedData.recordedAt) : existingEntry.recordedAt,
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

    return NextResponse.json({
      success: true,
      data: updatedEntry,
    })
  } catch (error) {
    console.error('Failed to update progress entry:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid data provided', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update progress entry' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Get existing progress entry
    const existingEntry = await prisma.progressEntry.findUnique({
      where: { id: params.id },
    })

    if (!existingEntry) {
      return NextResponse.json({ success: false, error: 'Progress entry not found' }, { status: 404 })
    }

    // Check permissions - only admin can delete
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
    }

    // Delete progress entry
    await prisma.progressEntry.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      success: true,
      message: 'Progress entry deleted successfully',
    })
  } catch (error) {
    console.error('Failed to delete progress entry:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete progress entry' },
      { status: 500 }
    )
  }
}
