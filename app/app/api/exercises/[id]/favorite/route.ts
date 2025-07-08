
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// POST /api/exercises/[id]/favorite - Add exercise to favorites
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const exerciseId = params.id

    // Check if exercise exists and is active
    const exercise = await prisma.exercise.findUnique({
      where: { id: exerciseId, isActive: true },
    })

    if (!exercise) {
      return NextResponse.json(
        { success: false, error: 'Exercise not found' },
        { status: 404 }
      )
    }

    // Add to favorites
    await prisma.user.update({
      where: { id: user.id },
      data: {
        favoriteExercises: {
          connect: { id: exerciseId },
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Exercise added to favorites',
    })
  } catch (error) {
    console.error('Add favorite error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to add exercise to favorites' },
      { status: 500 }
    )
  }
}

// DELETE /api/exercises/[id]/favorite - Remove exercise from favorites
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const exerciseId = params.id

    // Remove from favorites
    await prisma.user.update({
      where: { id: user.id },
      data: {
        favoriteExercises: {
          disconnect: { id: exerciseId },
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Exercise removed from favorites',
    })
  } catch (error) {
    console.error('Remove favorite error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to remove exercise from favorites' },
      { status: 500 }
    )
  }
}
