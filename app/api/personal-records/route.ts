
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

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const category = searchParams.get('category')

    const skip = (page - 1) * limit

    const where: any = {
      userId: session.user.id // Only show personal records for current client
    }
    
    if (category && category !== 'all') {
      where.exercise = {
        category: category
      }
    }

    const [personalRecords, total] = await Promise.all([
      prisma.personalRecord.findMany({
        where,
        include: {
          exercise: {
            select: {
              id: true,
              name: true,
              category: true,
              muscleGroups: true,
              imageUrl: true,
            }
          }
        },
        orderBy: {
          achievedAt: 'desc'
        },
        skip,
        take: limit,
      }),
      prisma.personalRecord.count({ where })
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      success: true,
      data: personalRecords,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    })
  } catch (error) {
    console.error('Failed to fetch personal records:', error)
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

    // Only admins can manually create personal records
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { exerciseId, userId, weight, reps, duration, notes } = body

    if (!exerciseId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!weight && !duration) {
      return NextResponse.json(
        { error: 'Either weight or duration must be provided' },
        { status: 400 }
      )
    }

    // Calculate volume for weight-based exercises
    let volume = null
    if (weight && reps) {
      volume = weight * reps
    }

    // Check if this is a new PR
    const existingPR = await prisma.personalRecord.findFirst({
      where: {
        userId,
        exerciseId,
      },
      orderBy: [
        { volume: 'desc' },
        { duration: 'desc' },
      ]
    })

    const isNewPR = !existingPR || 
      (volume && volume > Number(existingPR.volume || 0)) ||
      (duration && duration > (existingPR.duration || 0))

    if (isNewPR) {
      const personalRecord = await prisma.personalRecord.upsert({
        where: {
          userId_exerciseId: {
            userId,
            exerciseId,
          }
        },
        update: {
          weight,
          reps,
          duration,
          volume,
          notes,
          achievedAt: new Date(),
        },
        create: {
          userId,
          exerciseId,
          weight,
          reps,
          duration,
          volume,
          notes,
          achievedAt: new Date(),
        },
        include: {
          exercise: {
            select: {
              id: true,
              name: true,
              category: true,
              muscleGroups: true,
            }
          }
        }
      })

      return NextResponse.json({
        success: true,
        data: personalRecord,
      })
    } else {
      return NextResponse.json(
        { error: 'This is not a new personal record' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Failed to create personal record:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
