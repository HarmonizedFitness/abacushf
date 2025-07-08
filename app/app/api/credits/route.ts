
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, getUserCredits } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET /api/credits - Get user's credit information
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()

    // Get remaining credits
    const remainingCredits = await getUserCredits(user.id)

    // Get credit purchase history
    const purchases = await prisma.creditPurchase.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    // Get credit usage history
    const usage = await prisma.booking.findMany({
      where: {
        userId: user.id,
        status: {
          in: ['CONFIRMED', 'COMPLETED'],
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        startTime: true,
        endTime: true,
        creditsUsed: true,
        status: true,
        createdAt: true,
      },
    })

    // Calculate total purchased and used
    const totalPurchased = purchases
      .filter(p => p.status === 'COMPLETED')
      .reduce((sum, p) => sum + p.credits, 0)

    const totalUsed = usage.reduce((sum, u) => sum + u.creditsUsed, 0)

    return NextResponse.json({
      success: true,
      data: {
        remainingCredits,
        totalPurchased,
        totalUsed,
        recentPurchases: purchases,
        recentUsage: usage,
      },
    })
  } catch (error) {
    console.error('Get credits error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch credit information' },
      { status: 500 }
    )
  }
}
