
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET /api/personal-records - Get user's personal records
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const exerciseId = searchParams.get('exerciseId')
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '20')
    const page = parseInt(searchParams.get('page') || '1')

    const where: any = {
      userId: user.id,
    }

    if (exerciseId) {
      where.exerciseId = exerciseId
    }

    if (category) {
      where.exercise = {
        category,
      }
    }

    const [personalRecords, total] = await Promise.all([
      prisma.personalRecord.findMany({
        where,
        orderBy: { achievedAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
        include: {
          exercise: {
            select: {
              id: true,
              name: true,
              category: true,
              muscleGroups: true,
              imageUrl: true,
            },
          },
        },
      }),
      prisma.personalRecord.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: personalRecords,
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
    console.error('Get personal records error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch personal records' },
      { status: 500 }
    )
  }
}

// POST /api/personal-records - Create/update personal record manually
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { exerciseId, weight, reps, duration, notes } = body

    // Validate input
    if (!exerciseId) {
      return NextResponse.json(
        { success: false, error: 'Exercise ID is required' },
        { status: 400 }
      )
    }

    if (!weight && !duration) {
      return NextResponse.json(
        { success: false, error: 'Weight or duration is required' },
        { status: 400 }
      )
    }

    // Check if exercise exists
    const exercise = await prisma.exercise.findUnique({
      where: { id: exerciseId, isActive: true },
    })

    if (!exercise) {
      return NextResponse.json(
        { success: false, error: 'Exercise not found' },
        { status: 404 }
      )
    }

    // Calculate volume if weight and reps provided
    const volume = weight && reps ? weight * reps : null

    // Create or update personal record
    const personalRecord = await prisma.personalRecord.upsert({
      where: {
        userId_exerciseId: {
          userId: user.id,
          exerciseId,
        },
      },
      update: {
        weight: weight || null,
        reps: reps || null,
        duration: duration || null,
        volume: volume || null,
        notes: notes || null,
        achievedAt: new Date(),
      },
      create: {
        userId: user.id,
        exerciseId,
        weight: weight || null,
        reps: reps || null,
        duration: duration || null,
        volume: volume || null,
        notes: notes || null,
        achievedAt: new Date(),
      },
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
    })

    // Create notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'PERSONAL_RECORD',
        title: 'Personal Record Updated! 🎉',
        message: `You updated your PR for ${exercise.name}${weight ? `: ${weight} lbs` : ''}${reps ? ` x ${reps} reps` : ''}${duration ? `: ${duration}s` : ''}`,
        isRead: false,
        metadata: {
          exerciseId,
          weight: weight?.toString(),
          reps: reps?.toString(),
          duration: duration?.toString(),
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Personal record updated successfully',
      data: personalRecord,
    })
  } catch (error) {
    console.error('Create/update personal record error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update personal record' },
      { status: 500 }
    )
  }
}
