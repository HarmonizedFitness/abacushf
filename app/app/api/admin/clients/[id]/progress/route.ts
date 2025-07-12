
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
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
})

// GET /api/admin/clients/[id]/progress - Get client's progress entries
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

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')

    // Verify client exists
    const client = await prisma.user.findUnique({
      where: {
        id: params.id,
        role: 'CLIENT',
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    })

    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      )
    }

    // Build where clause
    const whereClause: any = { userId: params.id }
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
      where: { userId: params.id },
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
      client: {
        id: client.id,
        name: client.name,
        email: client.email
      },
      summary: progressSummary,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    })
  } catch (error) {
    console.error('Failed to fetch client progress entries:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch progress entries' },
      { status: 500 }
    )
  }
}

// POST /api/admin/clients/[id]/progress - Admin creates progress entry for client
export async function POST(
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

    const body = await request.json()
    const validatedData = progressEntrySchema.parse(body)

    // Verify client exists
    const client = await prisma.user.findUnique({
      where: {
        id: params.id,
        role: 'CLIENT',
      },
    })

    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      )
    }

    // Create progress entry
    const progressEntry = await prisma.progressEntry.create({
      data: {
        userId: params.id,
        type: validatedData.type,
        value: validatedData.value,
        unit: validatedData.unit || null,
        notes: validatedData.notes || null,
        recordedAt: validatedData.recordedAt ? new Date(validatedData.recordedAt) : new Date(),
        recordedBy: user.id, // Admin who created it
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
      message: `Progress entry created for ${client.name}`,
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
