
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET /api/workouts - Get user's workout sessions
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '10')
    const page = parseInt(searchParams.get('page') || '1')

    const where: any = {
      userId: user.id,
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
    console.error('Get workouts error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch workouts' },
      { status: 500 }
    )
  }
}

// POST /api/workouts - Create new workout session
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { date, duration, notes, exercises, status = 'COMPLETED' } = body

    // Validate input
    if (!date || !duration || !exercises || !Array.isArray(exercises) || exercises.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Date, duration, and exercises are required' },
        { status: 400 }
      )
    }

    // Validate exercises
    const exerciseIds = exercises.map((e: any) => e.exerciseId)
    const validExercises = await prisma.exercise.findMany({
      where: { id: { in: exerciseIds }, isActive: true },
      select: { id: true },
    })

    if (validExercises.length !== exerciseIds.length) {
      return NextResponse.json(
        { success: false, error: 'Some exercises are invalid' },
        { status: 400 }
      )
    }

    // Create workout session with exercises
    const workout = await prisma.workoutSession.create({
      data: {
        userId: user.id,
        date: new Date(date),
        duration,
        notes: notes || null,
        status,
        exercises: {
          create: exercises.map((exercise: any, index: number) => ({
            exerciseId: exercise.exerciseId,
            sets: exercise.sets,
            reps: exercise.reps,
            weight: exercise.weight || null,
            duration: exercise.duration || null,
            restTime: exercise.restTime || null,
            notes: exercise.notes || null,
            order: exercise.order || index + 1,
          })),
        },
      },
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

    // Check for new personal records
    const newPRs = []
    for (const exercise of exercises) {
      if (exercise.weight && exercise.reps) {
        const volume = exercise.weight * exercise.reps * exercise.sets

        // Get current PR
        const existingPR = await prisma.personalRecord.findUnique({
          where: {
            userId_exerciseId: {
              userId: user.id,
              exerciseId: exercise.exerciseId,
            },
          },
        })

        const isNewPR = !existingPR || 
                       (exercise.weight > Number(existingPR.weight || 0)) ||
                       (exercise.weight === Number(existingPR.weight) && exercise.reps > (existingPR.reps || 0)) ||
                       (volume > Number(existingPR.volume || 0))

        if (isNewPR) {
          const pr = await prisma.personalRecord.upsert({
            where: {
              userId_exerciseId: {
                userId: user.id,
                exerciseId: exercise.exerciseId,
              },
            },
            update: {
              weight: exercise.weight,
              reps: exercise.reps,
              volume,
              notes: `New PR from workout on ${new Date(date).toLocaleDateString()}`,
              achievedAt: new Date(),
            },
            create: {
              userId: user.id,
              exerciseId: exercise.exerciseId,
              weight: exercise.weight,
              reps: exercise.reps,
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
          userId: user.id,
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
    console.error('Create workout error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create workout' },
      { status: 500 }
    )
  }
}
