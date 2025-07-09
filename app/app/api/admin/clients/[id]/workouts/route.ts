
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

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

    // Fetch workout sessions
    const workoutSessions = await prisma.workoutSession.findMany({
      where: {
        userId: params.id,
      },
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
              },
            },
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
      take: limit,
      skip: (page - 1) * limit,
    })

    return NextResponse.json({
      success: true,
      data: workoutSessions,
    })
  } catch (error) {
    console.error('Get client workouts error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch client workouts' },
      { status: 500 }
    )
  }
}
