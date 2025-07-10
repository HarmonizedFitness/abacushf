
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, isAdmin } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET /api/exercises/[id] - Get specific exercise
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const exerciseId = params.id

    const exercise = await prisma.exercise.findUnique({
      where: { id: exerciseId },
      include: {
        _count: {
          select: {
            favoritedBy: true,
            workoutExercises: true,
            personalRecords: true,
          },
        },

        personalRecords: {
          where: { userId: user.id },
          orderBy: { achievedAt: 'desc' },
          take: 1,
        },
      },
    })

    if (!exercise || !exercise.isActive) {
      return NextResponse.json(
        { success: false, error: 'Exercise not found' },
        { status: 404 }
      )
    }

    // Add personal record and clean response
    const exerciseWithDetails = {
      ...exercise,
      personalRecord: exercise.personalRecords[0] || null,
      personalRecords: undefined, // Remove from response
    }

    return NextResponse.json({
      success: true,
      data: exerciseWithDetails,
    })
  } catch (error) {
    console.error('Get exercise error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch exercise' },
      { status: 500 }
    )
  }
}

// PATCH /api/exercises/[id] - Update exercise (admin only)
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
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const exerciseId = params.id
    const body = await request.json()
    const { 
      name, 
      description, 
      instructions, 
      category, 
      muscleGroups, 
      equipment,
      difficulty,
      forceType,
      isFavorite,
      imageUrl,
      videoUrl,
      isActive
    } = body

    // Check if exercise exists
    const existingExercise = await prisma.exercise.findUnique({
      where: { id: exerciseId },
    })

    if (!existingExercise) {
      return NextResponse.json(
        { success: false, error: 'Exercise not found' },
        { status: 404 }
      )
    }

    const updateData: any = {}
    if (name) updateData.name = name.trim()
    if (description !== undefined) updateData.description = description?.trim() || null
    if (instructions !== undefined) updateData.instructions = instructions?.trim() || null
    if (category) updateData.category = category.trim()
    if (muscleGroups && Array.isArray(muscleGroups)) updateData.muscleGroups = muscleGroups
    if (equipment !== undefined) updateData.equipment = equipment?.trim() || null
    if (difficulty !== undefined) updateData.difficulty = difficulty?.trim() || null
    if (forceType !== undefined) updateData.forceType = forceType?.trim() || null
    if (isFavorite !== undefined) updateData.isFavorite = Boolean(isFavorite)
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl?.trim() || null
    if (videoUrl !== undefined) updateData.videoUrl = videoUrl?.trim() || null
    if (isActive !== undefined) updateData.isActive = isActive

    // Check for name conflicts if name is being updated
    if (name && name !== existingExercise.name) {
      const nameConflict = await prisma.exercise.findFirst({
        where: { 
          name: { equals: name, mode: 'insensitive' },
          id: { not: exerciseId },
        },
      })

      if (nameConflict) {
        return NextResponse.json(
          { success: false, error: 'Exercise with this name already exists' },
          { status: 409 }
        )
      }
    }

    // Update exercise
    const updatedExercise = await prisma.exercise.update({
      where: { id: exerciseId },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      message: 'Exercise updated successfully',
      data: updatedExercise,
    })
  } catch (error) {
    console.error('Update exercise error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update exercise' },
      { status: 500 }
    )
  }
}

// DELETE /api/exercises/[id] - Delete exercise (admin only)
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
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const exerciseId = params.id

    // Check if exercise exists
    const existingExercise = await prisma.exercise.findUnique({
      where: { id: exerciseId },
    })

    if (!existingExercise) {
      return NextResponse.json(
        { success: false, error: 'Exercise not found' },
        { status: 404 }
      )
    }

    // Check if exercise is used in any workouts
    const workoutUsage = await prisma.workoutExercise.count({
      where: { exerciseId },
    })

    if (workoutUsage > 0) {
      // Don't delete, just deactivate
      await prisma.exercise.update({
        where: { id: exerciseId },
        data: { isActive: false },
      })

      return NextResponse.json({
        success: true,
        message: 'Exercise deactivated (was used in workouts)',
      })
    } else {
      // Safe to delete
      await prisma.exercise.delete({
        where: { id: exerciseId },
      })

      return NextResponse.json({
        success: true,
        message: 'Exercise deleted successfully',
      })
    }
  } catch (error) {
    console.error('Delete exercise error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete exercise' },
      { status: 500 }
    )
  }
}
