
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET /api/admin/workouts - Get all workout sessions for admin
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    
    // Check if user is admin
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '20')
    const page = parseInt(searchParams.get('page') || '1')

    const where: any = {}

    if (clientId) {
      where.userId = clientId
    }

    if (status) {
      where.status = status
    }

    if (startDate || endDate) {
      where.date = {}
      if (startDate) {
        where.date.gte = new Date(startDate)
      }
      if (endDate) {
        where.date.lte = new Date(endDate)
      }
    }

    const [workouts, total] = await Promise.all([
      prisma.workoutSession.findMany({
        where,
        orderBy: { date: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
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
            where: { groupId: null }, // Ungrouped exercises
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
      }),
      prisma.workoutSession.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: workouts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    })
  } catch (error) {
    console.error('Get admin workouts error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch workouts' },
      { status: 500 }
    )
  }
}

// POST /api/admin/workouts - Create new workout session with advanced features
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    
    // Check if user is admin
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { 
      clientId, 
      date, 
      duration, 
      notes, 
      status = 'COMPLETED',
      groups = [],
      exercises = []
    } = body

    // Validate input
    if (!clientId || !date || !duration) {
      return NextResponse.json(
        { success: false, error: 'Client ID, date, and duration are required' },
        { status: 400 }
      )
    }

    if (groups.length === 0 && exercises.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one exercise or group is required' },
        { status: 400 }
      )
    }

    // Validate client exists
    const client = await prisma.user.findUnique({
      where: { id: clientId, role: 'CLIENT' },
    })

    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      )
    }

    // Validate all exercises exist
    const allExerciseIds = [
      ...exercises.map((e: any) => e.exerciseId),
      ...groups.flatMap((g: any) => g.exercises.map((e: any) => e.exerciseId))
    ]

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

    // Create workout session with groups and exercises
    const workout = await prisma.workoutSession.create({
      data: {
        userId: clientId,
        date: new Date(date),
        duration,
        notes: notes || null,
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

    // Check for new personal records
    const newPRs = []
    const allWorkoutExercises = [
      ...workout.exercises,
      ...workout.groups.flatMap(g => g.exercises)
    ]

    for (const workoutExercise of allWorkoutExercises) {
      // Find the best set for this exercise
      const bestSet = workoutExercise.sets.reduce((best, current) => {
        if (!best) return current
        
        const currentVolume = (Number(current.weight) || 0) * (current.reps || 0)
        const bestVolume = (Number(best.weight) || 0) * (best.reps || 0)
        
        if (currentVolume > bestVolume) return current
        if (currentVolume === bestVolume && (Number(current.weight) || 0) > (Number(best.weight) || 0)) return current
        
        return best
      }, null as any)

      if (bestSet?.weight && bestSet?.reps) {
        const volume = Number(bestSet.weight) * Number(bestSet.reps)

        // Get current PR
        const existingPR = await prisma.personalRecord.findUnique({
          where: {
            userId_exerciseId: {
              userId: clientId,
              exerciseId: workoutExercise.exerciseId,
            },
          },
        })

        const isNewPR = !existingPR || 
                       (bestSet.weight > Number(existingPR.weight || 0)) ||
                       (bestSet.weight === Number(existingPR.weight) && bestSet.reps > (existingPR.reps || 0)) ||
                       (volume > Number(existingPR.volume || 0))

        if (isNewPR) {
          const pr = await prisma.personalRecord.upsert({
            where: {
              userId_exerciseId: {
                userId: clientId,
                exerciseId: workoutExercise.exerciseId,
              },
            },
            update: {
              weight: bestSet.weight,
              reps: bestSet.reps,
              volume,
              notes: `New PR from workout on ${new Date(date).toLocaleDateString()}`,
              achievedAt: new Date(),
            },
            create: {
              userId: clientId,
              exerciseId: workoutExercise.exerciseId,
              weight: bestSet.weight,
              reps: bestSet.reps,
              volume,
              notes: `First PR recorded on ${new Date(date).toLocaleDateString()}`,
              achievedAt: new Date(),
            },
            include: {
              exercise: {
                select: {
                  name: true,
                },
              },
            },
          })
          newPRs.push(pr)
        }
      }
    }

    // Create notifications for new PRs
    for (const pr of newPRs) {
      await prisma.notification.create({
        data: {
          userId: clientId,
          type: 'PERSONAL_RECORD',
          title: 'New Personal Record! 🎉',
          message: `Congratulations! You achieved a new PR on ${pr.exercise.name}: ${pr.weight} lbs x ${pr.reps} reps`,
          isRead: false,
          metadata: {
            exerciseId: pr.exerciseId,
            weight: pr.weight?.toString(),
            reps: pr.reps?.toString(),
            volume: pr.volume?.toString(),
          },
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Workout logged successfully',
      data: {
        workout,
        newPersonalRecords: newPRs.length,
      },
    })
  } catch (error) {
    console.error('Create admin workout error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create workout' },
      { status: 500 }
    )
  }
}
