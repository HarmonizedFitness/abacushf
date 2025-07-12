
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { generateWorkoutDisplayName } from '@/lib/utils'

export const dynamic = 'force-dynamic'

// GET /api/admin/clients/[id]/workouts - Get client's workout sessions
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
    const limit = parseInt(searchParams.get('limit') || '10')
    const page = parseInt(searchParams.get('page') || '1')
    const from = searchParams.get('from')
    const detailed = searchParams.get('detailed') === 'true'

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

    // Build where clause
    const whereClause: any = { userId: params.id }
    if (from) {
      whereClause.date = { gte: new Date(from) }
    }

    // Fetch workout sessions
    const workoutSessions = await prisma.workoutSession.findMany({
      where: whereClause,
      select: {
        id: true,
        date: true,
        duration: true,
        notes: true,
        status: true,
        createdAt: true,
        exercises: {
          select: {
            id: true,
            exercise: {
              select: {
                name: true,
                ...(detailed && {
                  category: true,
                  muscleGroups: true,
                  equipment: true,
                }),
              },
            },
            ...(detailed && {
              sets: {
                select: {
                  id: true,
                  setNumber: true,
                  reps: true,
                  weight: true,
                  duration: true,
                },
              },
            }),
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
      take: limit,
      skip: (page - 1) * limit,
    })

    // Get total count for pagination
    const totalCount = await prisma.workoutSession.count({
      where: whereClause,
    })

    // FIXED: Add meaningful workout display names to each workout
    const workoutsWithDisplayNames = workoutSessions.map(workout => ({
      ...workout,
      displayName: generateWorkoutDisplayName({
        ...workout,
        user: client // Add client info for name generation
      }),
      // Ensure date is properly formatted (no offset issues)
      date: workout.date.toISOString(),
    }))

    return NextResponse.json({
      success: true,
      data: workoutsWithDisplayNames,
      client: {
        id: client.id,
        name: client.name,
        email: client.email
      },
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page * limit < totalCount,
        hasPrev: page > 1,
      },
    })
  } catch (error) {
    console.error('Get client workouts error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch client workouts' },
      { status: 500 }
    )
  }
}
