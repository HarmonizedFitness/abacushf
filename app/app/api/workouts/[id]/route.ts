
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
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        groups: {
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
                sets: {
                  orderBy: { setNumber: 'asc' },
                },
              },
              orderBy: { orderInGroup: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
        exercises: {
          where: { groupId: null }, // Ungrouped exercises
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
            sets: {
              orderBy: { setNumber: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
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
    const { date, duration, notes, status, exercises = [], groups = [] } = body

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
    })

    // Update exercises and groups if provided
    if (exercises.length > 0 || groups.length > 0) {
      // Delete existing exercises and groups (cascade will handle sets)
      await prisma.workoutExerciseGroup.deleteMany({
        where: { workoutSessionId: workoutId },
      })
      await prisma.workoutExercise.deleteMany({
        where: { workoutSessionId: workoutId },
      })

      // Create new groups and exercises
      await prisma.workoutSession.update({
        where: { id: workoutId },
        data: {
          groups: {
            create: groups.map((group: any, groupIndex: number) => ({
              type: group.type || 'REGULAR',
              name: group.name,
              notes: group.notes,
              order: group.order || groupIndex + 1,
              rounds: group.rounds,
              restBetweenRounds: group.restBetweenRounds,
              exercises: {
                create: group.exercises.map((exercise: any, exerciseIndex: number) => ({
                  exerciseId: exercise.exerciseId,
                  order: exercise.order || exerciseIndex + 1,
                  orderInGroup: exercise.orderInGroup || exerciseIndex + 1,
                  notes: exercise.notes,
                  sets: {
                    create: exercise.sets.map((set: any) => ({
                      setNumber: set.setNumber,
                      reps: set.reps,
                      weight: set.weight,
                      duration: set.duration,
                      restTime: set.restTime,
                      notes: set.notes,
                      isDropSet: set.isDropSet || false,
                    })),
                  },
                })),
              },
            })),
          },
          exercises: {
            create: exercises.map((exercise: any, exerciseIndex: number) => ({
              exerciseId: exercise.exerciseId,
              order: exercise.order || exerciseIndex + 1,
              notes: exercise.notes,
              sets: {
                create: exercise.sets.map((set: any) => ({
                  setNumber: set.setNumber,
                  reps: set.reps,
                  weight: set.weight,
                  duration: set.duration,
                  restTime: set.restTime,
                  notes: set.notes,
                  isDropSet: set.isDropSet || false,
                })),
              },
            })),
          },
        },
      })
    }

    // Fetch updated workout with new structure
    const finalWorkout = await prisma.workoutSession.findUnique({
      where: { id: workoutId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        groups: {
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
                sets: {
                  orderBy: { setNumber: 'asc' },
                },
              },
              orderBy: { orderInGroup: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
        exercises: {
          where: { groupId: null },
          include: {
            exercise: {
              select: {
                id: true,
                name: true,
                category: true,
                muscleGroups: true,
              },
            },
            sets: {
              orderBy: { setNumber: 'asc' },
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
