
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can access this endpoint
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const clientId = searchParams.get('clientId')

    const skip = (page - 1) * limit

    const where: any = {}
    if (status && status !== 'all') {
      where.status = status
    }
    if (clientId && clientId !== 'all') {
      where.userId = clientId
    }

    const [workouts, total] = await Promise.all([
      prisma.workoutSession.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          },
          exercises: {
            include: {
              exercise: {
                select: {
                  id: true,
                  name: true,
                  category: true,
                }
              }
            }
          }
        },
        orderBy: {
          date: 'desc'
        },
        skip,
        take: limit,
      }),
      prisma.workoutSession.count({ where })
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      success: true,
      data: workouts,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    })
  } catch (error) {
    console.error('Failed to fetch workouts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can create workouts
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { clientId, date, duration, status, notes, groups = [], exercises = [] } = body

    if (!clientId || !date || (groups.length === 0 && exercises.length === 0)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify client exists
    const client = await prisma.user.findUnique({
      where: { id: clientId, role: 'CLIENT' }
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    // Create the workout session with groups and exercises
    const workoutSession = await prisma.workoutSession.create({
      data: {
        userId: clientId,
        date: new Date(date),
        duration: duration || 60,
        status: status || 'COMPLETED',
        notes,
        // Create exercise groups
        groups: {
          create: groups.map((group: any) => ({
            type: group.type || 'REGULAR',
            name: group.name,
            notes: group.notes,
            order: group.order,
            rounds: group.rounds,
            restBetweenRounds: group.restBetweenRounds,
            exercises: {
              create: group.exercises.map((exercise: any) => ({
                exerciseId: exercise.exerciseId,
                order: exercise.order,
                orderInGroup: exercise.orderInGroup,
                notes: exercise.notes,
                sets: {
                  create: exercise.sets.map((set: any) => ({
                    setNumber: set.setNumber,
                    reps: set.reps,
                    weight: set.weight ? parseFloat(set.weight) : null,
                    duration: set.duration,
                    restTime: set.restTime,
                    notes: set.notes,
                    isDropSet: set.isDropSet || false,
                  }))
                }
              }))
            }
          }))
        },
        // Create ungrouped exercises
        exercises: {
          create: exercises.map((exercise: any) => ({
            exerciseId: exercise.exerciseId,
            order: exercise.order,
            notes: exercise.notes,
            sets: {
              create: exercise.sets.map((set: any) => ({
                setNumber: set.setNumber,
                reps: set.reps,
                weight: set.weight ? parseFloat(set.weight) : null,
                duration: set.duration,
                restTime: set.restTime,
                notes: set.notes,
                isDropSet: set.isDropSet || false,
              }))
            }
          }))
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        groups: {
          include: {
            exercises: {
              include: {
                exercise: true,
                sets: true
              }
            }
          }
        },
        exercises: {
          include: {
            exercise: true,
            sets: true
          }
        }
      }
    })

    // Update personal records for completed workouts
    if (status === 'COMPLETED') {
      const allExercises = [
        ...exercises,
        ...groups.flatMap((group: any) => group.exercises)
      ]

      for (const exercise of allExercises) {
        if (exercise.sets && exercise.sets.length > 0) {
          // Find the best set (highest weight * reps)
          const bestSet = exercise.sets.reduce((best: any, current: any) => {
            const currentVolume = (current.weight || 0) * (current.reps || 0)
            const bestVolume = (best.weight || 0) * (best.reps || 0)
            return currentVolume > bestVolume ? current : best
          })

          if (bestSet.weight && bestSet.reps) {
            const volume = bestSet.weight * bestSet.reps

            // Check if this is a new PR
            const existingPR = await prisma.personalRecord.findFirst({
              where: {
                userId: clientId,
                exerciseId: exercise.exerciseId,
              },
              orderBy: {
                volume: 'desc'
              }
            })

            if (!existingPR || volume > Number(existingPR.volume || 0)) {
              await prisma.personalRecord.upsert({
                where: {
                  userId_exerciseId: {
                    userId: clientId,
                    exerciseId: exercise.exerciseId,
                  }
                },
                update: {
                  weight: bestSet.weight,
                  reps: bestSet.reps,
                  volume,
                  achievedAt: new Date(date),
                },
                create: {
                  userId: clientId,
                  exerciseId: exercise.exerciseId,
                  weight: bestSet.weight,
                  reps: bestSet.reps,
                  volume,
                  achievedAt: new Date(date),
                }
              })
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        workout: workoutSession,
      },
    })
  } catch (error) {
    console.error('Failed to create workout:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
