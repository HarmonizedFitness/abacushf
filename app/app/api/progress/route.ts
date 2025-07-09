
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const progressEntrySchema = z.object({
  type: z.enum([
    'BODY_WEIGHT',
    'BMI',
    'BODY_FAT_PERCENTAGE',
    'MUSCLE_MASS',
    'CHEST_MEASUREMENT',
    'WAIST_MEASUREMENT',
    'HIP_MEASUREMENT',
    'ARM_MEASUREMENT',
    'THIGH_MEASUREMENT',
    'NECK_MEASUREMENT',
    'STRENGTH_SCORE',
    'CARDIO_SCORE',
    'FLEXIBILITY_SCORE',
    'CUSTOM_MEASUREMENT',
  ]),
  value: z.number().min(0, 'Value must be positive'),
  unit: z.string().optional(),
  notes: z.string().optional(),
  recordedAt: z.string().optional(),
  userId: z.string().optional(), // For admin creating entries for clients
})

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const targetUserId = searchParams.get('userId')
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')

    // Determine which user's progress to fetch
    let userId = user.id
    if (targetUserId && user.role === 'ADMIN') {
      userId = targetUserId
    } else if (targetUserId && user.role === 'CLIENT' && targetUserId !== user.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 })
    }

    // Build where clause
    const whereClause: any = { userId }
    if (type) {
      whereClause.type = type
    }

    // Get progress entries
    const progressEntries = await prisma.progressEntry.findMany({
      where: whereClause,
      orderBy: { recordedAt: 'desc' },
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
      },
    })

    // Get total count
    const totalCount = await prisma.progressEntry.count({
      where: whereClause,
    })

    // Get progress summary by type
    const progressSummary = await prisma.progressEntry.groupBy({
      by: ['type'],
      where: { userId },
      _count: {
        id: true,
      },
      orderBy: {
        type: 'asc',
      },
    })

    return NextResponse.json({
      success: true,
      data: progressEntries,
      summary: progressSummary,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    })
  } catch (error) {
    console.error('Failed to fetch progress entries:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch progress entries' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = progressEntrySchema.parse(body)

    // Determine target user
    let targetUserId = user.id
    if (validatedData.userId && user.role === 'ADMIN') {
      targetUserId = validatedData.userId
    } else if (validatedData.userId && user.role === 'CLIENT') {
      return NextResponse.json({ success: false, error: 'Unauthorized to create entries for other users' }, { status: 403 })
    }

    // Create progress entry
    const progressEntry = await prisma.progressEntry.create({
      data: {
        userId: targetUserId,
        type: validatedData.type,
        value: validatedData.value,
        unit: validatedData.unit || null,
        notes: validatedData.notes || null,
        recordedAt: validatedData.recordedAt ? new Date(validatedData.recordedAt) : new Date(),
        recordedBy: user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: progressEntry,
    })
  } catch (error) {
    console.error('Failed to create progress entry:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid data provided', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create progress entry' },
      { status: 500 }
    )
  }
}
