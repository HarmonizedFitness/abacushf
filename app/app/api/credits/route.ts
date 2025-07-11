
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, getUserCredits } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET /api/credits - Get user's credit information
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()

    // FIXED: Calculate credits based on completed workouts instead of bookings
    // Get credit purchases
    const purchases = await prisma.creditPurchase.findMany({
      where: { userId: user.id, status: 'COMPLETED' }
    })
    const totalPurchased = purchases.reduce((sum, p) => sum + p.credits, 0)

    // Get completed workout sessions count
    const completedWorkouts = await prisma.workoutSession.findMany({
      where: {
        userId: user.id,
        status: 'COMPLETED'
      },
      select: {
        id: true,
        date: true,
        status: true,
      },
      orderBy: { date: 'desc' }
    })
    const completedWorkoutsCount = completedWorkouts.length

    // FIXED: Calculate remaining credits = total purchased - completed workouts
    const remainingCredits = Math.max(0, totalPurchased - completedWorkoutsCount)

    // Get remaining credits using the existing function for comparison
    const legacyRemainingCredits = await getUserCredits(user.id)

    // Get recent purchase history
    const recentPurchases = await prisma.creditPurchase.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    // Get credit usage history from bookings
    const bookingUsage = await prisma.booking.findMany({
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

    const totalUsedFromBookings = bookingUsage.reduce((sum, u) => sum + u.creditsUsed, 0)

    // FIXED: Use completed workouts as primary method for remaining credits
    return NextResponse.json({
      success: true,
      data: {
        remainingCredits, // FIXED: Using workouts-based calculation
        totalPurchased,
        totalUsed: completedWorkoutsCount, // FIXED: Show completed workouts as "used"
        recentPurchases,
        recentUsage: bookingUsage,
        completedWorkouts: completedWorkoutsCount,
        verification: {
          remainingCreditsFromBookings: Math.max(0, totalPurchased - totalUsedFromBookings),
          remainingCreditsFromWorkouts: remainingCredits,
          legacyRemainingCredits,
          discrepancy: Math.abs(remainingCredits - legacyRemainingCredits) > 0
        }
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
