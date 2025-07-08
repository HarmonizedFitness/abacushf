
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET /api/admin/workouts/[id] - Get specific workout session
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    
    // Check if user is admin
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

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
                    category: true,
                    muscleGroups: true,
                    instructions: true,
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
                category: true,
                muscleGroups: true,
                instructions: true,
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

    return NextResponse.json({
      success: true,
      data: workout,
    })
  } catch (error) {
    console.error('Get admin workout error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch workout' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/workouts/[id] - Update workout session
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    
    // Check if user is admin
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const workoutId = params.id
    const body = await request.json()
    const { 
      date, 
      duration, 
      notes, 
      status,
      groups = [],
      exercises = []
    } = body

    // Check if workout exists
    const existingWorkout = await prisma.workoutSession.findUnique({
      where: { id: workoutId },
    })

    if (!existingWorkout) {
      return NextResponse.json(
        { success: false, error: 'Workout not found' },
        { status: 404 }
      )
    }

    // Validate all exercises exist
    const allExerciseIds = [
      ...exercises.map((e: any) => e.exerciseId),
      ...groups.flatMap((g: any) => g.exercises.map((e: any) => e.exerciseId))
    ]

    if (allExerciseIds.length > 0) {
      const validExercises = await prisma.exercise.findMany({
        where: { id: { in: allExerciseIds }, isActive: true },
        select: { id: true },
      })

      if (validExercises.length !== allExerciseIds.length) {
        return NextResponse.json(
          { success: false, error: 'Some exercises are invalid' },
          { status: 400 }
        )
      }
    }

    // Delete existing groups and exercises
    await prisma.workoutExerciseGroup.deleteMany({
      where: { workoutSessionId: workoutId },
    })

    await prisma.workoutExercise.deleteMany({
      where: { workoutSessionId: workoutId, groupId: null },
    })

    // Update workout session with new data
    const workout = await prisma.workoutSession.update({
      where: { id: workoutId },
      data: {
        date: date ? new Date(date) : undefined,
        duration,
        notes,
        status,
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
      data: workout,
    })
  } catch (error) {
    console.error('Update admin workout error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update workout' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/workouts/[id] - Delete workout session
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    
    // Check if user is admin
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const workoutId = params.id

    // Check if workout exists
    const existingWorkout = await prisma.workoutSession.findUnique({
      where: { id: workoutId },
    })

    if (!existingWorkout) {
      return NextResponse.json(
        { success: false, error: 'Workout not found' },
        { status: 404 }
      )
    }

    // Delete workout (cascade will handle related records)
    await prisma.workoutSession.delete({
      where: { id: workoutId },
    })

    return NextResponse.json({
      success: true,
      message: 'Workout deleted successfully',
    })
  } catch (error) {
    console.error('Delete admin workout error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete workout' },
      { status: 500 }
    )
  }
}
