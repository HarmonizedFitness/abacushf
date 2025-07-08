
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
    const { clientId, date, duration, status, notes, exercises } = body

    if (!clientId || !date || !exercises || exercises.length === 0) {
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

    // Create the workout session
    const workoutSession = await prisma.workoutSession.create({
      data: {
        userId: clientId,
        date: new Date(date),
        duration: duration || 60,
        status: status || 'COMPLETED',
        notes,
        exercises: {
          create: exercises.map((exercise: any, index: number) => ({
            exerciseId: exercise.exerciseId,
            sets: exercise.sets,
            reps: exercise.reps,
            weight: exercise.weight,
            duration: exercise.duration,
            restTime: exercise.restTime,
            notes: exercise.notes,
            order: index + 1,
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
        exercises: {
          include: {
            exercise: true
          }
        }
      }
    })

    // Update personal records for completed workouts
    if (status === 'COMPLETED') {
      for (const exercise of exercises) {
        if (exercise.weight && exercise.reps) {
          const volume = exercise.weight * exercise.sets * exercise.reps

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
                weight: exercise.weight,
                reps: exercise.reps,
                volume,
                achievedAt: new Date(date),
              },
              create: {
                userId: clientId,
                exerciseId: exercise.exerciseId,
                weight: exercise.weight,
                reps: exercise.reps,
                volume,
                achievedAt: new Date(date),
              }
            })
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: workoutSession,
    })
  } catch (error) {
    console.error('Failed to create workout:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
