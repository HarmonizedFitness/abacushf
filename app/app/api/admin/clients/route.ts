
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET /api/admin/clients - Get all clients for admin
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
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')

    const where: any = {
      role: 'CLIENT',
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [clients, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          fitnessGoals: true,
          isActive: true,
          createdAt: true,
          _count: {
            select: {
              bookings: true,
              workoutSessions: true,
              personalRecords: true,
              creditPurchases: true,
            },
          },
        },
        orderBy: { name: 'asc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.user.count({ where }),
    ])

    // Calculate remaining credits for each client
    const clientsWithCredits = await Promise.all(
      clients.map(async (client) => {
        // Get total credits purchased
        const totalCredits = await prisma.creditPurchase.aggregate({
          where: {
            userId: client.id,
            status: 'COMPLETED',
          },
          _sum: {
            credits: true,
          },
        })

        // Get total credits used (bookings)
        const creditsUsed = await prisma.booking.aggregate({
          where: {
            userId: client.id,
            status: {
              in: ['CONFIRMED', 'COMPLETED'],
            },
          },
          _sum: {
            creditsUsed: true,
          },
        })

        const remainingCredits = (totalCredits._sum.credits || 0) - (creditsUsed._sum.creditsUsed || 0)

        return {
          ...client,
          remainingCredits: Math.max(0, remainingCredits),
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: clientsWithCredits,
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
    console.error('Get admin clients error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch clients' },
      { status: 500 }
    )
  }
}
