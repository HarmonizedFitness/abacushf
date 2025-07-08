
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, isAdmin } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET /api/workouts/[id] - Get specific workout
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const workoutId = params.id

    const workout = await prisma.workoutSession.findUnique({
      where: { id: workoutId },
      include: {
        exercises: {
          include: {
            exercise: {
              select: {
                id: true,
                name: true,
                description: true,
                category: true,
                muscleGroups: true,
                equipment: true,
              },
            },
          },
          orderBy: { order: 'asc' },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!workout) {
      return NextResponse.json(
        { success: false, error: 'Workout not found' },
        { status: 404 }
      )
    }

    // Check permissions
    const userIsAdmin = await isAdmin()
    if (!userIsAdmin && workout.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      data: workout,
    })
  } catch (error) {
    console.error('Get workout error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch workout' },
      { status: 500 }
    )
  }
}

// PATCH /api/workouts/[id] - Update workout
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const workoutId = params.id
    const body = await request.json()
    const { date, duration, notes, status, exercises } = body

    // Get existing workout
    const existingWorkout = await prisma.workoutSession.findUnique({
      where: { id: workoutId },
    })

    if (!existingWorkout) {
      return NextResponse.json(
        { success: false, error: 'Workout not found' },
        { status: 404 }
      )
    }

    // Check permissions
    const userIsAdmin = await isAdmin()
    if (!userIsAdmin && existingWorkout.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    const updateData: any = {}
    if (date) updateData.date = new Date(date)
    if (duration) updateData.duration = duration
    if (notes !== undefined) updateData.notes = notes
    if (status) updateData.status = status

    // Update workout session
    const updatedWorkout = await prisma.workoutSession.update({
      where: { id: workoutId },
      data: updateData,
      include: {
        exercises: {
          include: {
            exercise: {
              select: {
                id: true,
                name: true,
                category: true,
                muscleGroups: true,
              },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    })

    // Update exercises if provided
    if (exercises && Array.isArray(exercises)) {
      // Delete existing exercises
      await prisma.workoutExercise.deleteMany({
        where: { workoutSessionId: workoutId },
      })

      // Create new exercises
      await prisma.workoutExercise.createMany({
        data: exercises.map((exercise: any, index: number) => ({
          workoutSessionId: workoutId,
          exerciseId: exercise.exerciseId,
          sets: exercise.sets,
          reps: exercise.reps,
          weight: exercise.weight || null,
          duration: exercise.duration || null,
          restTime: exercise.restTime || null,
          notes: exercise.notes || null,
          order: exercise.order || index + 1,
        })),
      })

      // Fetch updated workout with new exercises
      const finalWorkout = await prisma.workoutSession.findUnique({
        where: { id: workoutId },
        include: {
          exercises: {
            include: {
              exercise: {
                select: {
                  id: true,
                  name: true,
                  category: true,
                  muscleGroups: true,
                },
              },
            },
            orderBy: { order: 'asc' },
          },
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Workout updated successfully',
        data: finalWorkout,
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Workout updated successfully',
      data: updatedWorkout,
    })
  } catch (error) {
    console.error('Update workout error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update workout' },
      { status: 500 }
    )
  }
}

// DELETE /api/workouts/[id] - Delete workout
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const workoutId = params.id

    // Get existing workout
    const existingWorkout = await prisma.workoutSession.findUnique({
      where: { id: workoutId },
    })

    if (!existingWorkout) {
      return NextResponse.json(
        { success: false, error: 'Workout not found' },
        { status: 404 }
      )
    }

    // Check permissions
    const userIsAdmin = await isAdmin()
    if (!userIsAdmin && existingWorkout.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    // Delete workout (exercises will be deleted due to cascade)
    await prisma.workoutSession.delete({
      where: { id: workoutId },
    })

    return NextResponse.json({
      success: true,
      message: 'Workout deleted successfully',
    })
  } catch (error) {
    console.error('Delete workout error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete workout' },
      { status: 500 }
    )
  }
}
