
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET /api/admin/clients/[id]/credits - Get client's credit transactions
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
    const limit = parseInt(searchParams.get('limit') || '20')
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

    // Fetch credit purchases (positive transactions)
    const creditPurchases = await prisma.creditPurchase.findMany({
      where: {
        userId: params.id,
      },
      select: {
        id: true,
        credits: true,
        amount: true,
        status: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Fetch bookings (negative transactions - credits used)
    const bookings = await prisma.booking.findMany({
      where: {
        userId: params.id,
        status: {
          in: ['CONFIRMED', 'COMPLETED'],
        },
      },
      select: {
        id: true,
        creditsUsed: true,
        startTime: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Combine and format transactions
    const transactions: Array<{
      id: string;
      type: string;
      credits: number;
      amount: number;
      date: Date;
      status: string;
      reason: string;
    }> = []

    // Add credit purchases
    creditPurchases.forEach(purchase => {
      transactions.push({
        id: purchase.id,
        type: 'PURCHASE',
        credits: purchase.credits,
        amount: Number(purchase.amount),
        date: purchase.createdAt,
        status: purchase.status,
        reason: 'Credit purchase',
      })
    })

    // Add credit deductions from bookings
    bookings.forEach(booking => {
      transactions.push({
        id: `booking-${booking.id}`,
        type: 'DEDUCTION',
        credits: -(booking.creditsUsed || 0),
        amount: 0,
        date: booking.createdAt,
        status: 'COMPLETED',
        reason: `Session on ${new Date(booking.startTime).toLocaleDateString()}`,
      })
    })

    // Sort by date (newest first)
    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // Apply pagination
    const startIndex = (page - 1) * limit
    const paginatedTransactions = transactions.slice(startIndex, startIndex + limit)

    return NextResponse.json({
      success: true,
      data: paginatedTransactions,
      pagination: {
        total: transactions.length,
        page,
        limit,
        totalPages: Math.ceil(transactions.length / limit),
      },
    })
  } catch (error) {
    console.error('Get client credits error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch client credits' },
      { status: 500 }
    )
  }
}

// POST /api/admin/clients/[id]/credits - Add or remove credits
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
    const { type, credits, amount, reason } = body

    // Validate input
    if (!type || !credits || typeof credits !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Type and credits are required' },
        { status: 400 }
      )
    }

    if (!['PURCHASE', 'BONUS', 'DEDUCTION'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid transaction type' },
        { status: 400 }
      )
    }

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

    // For deductions, check if client has enough credits
    if (credits < 0) {
      // Calculate current credits
      const totalCredits = await prisma.creditPurchase.aggregate({
        where: {
          userId: params.id,
          status: 'COMPLETED',
        },
        _sum: {
          credits: true,
        },
      })

      const creditsUsed = await prisma.booking.aggregate({
        where: {
          userId: params.id,
          status: {
            in: ['CONFIRMED', 'COMPLETED'],
          },
        },
        _sum: {
          creditsUsed: true,
        },
      })

      const remainingCredits = (totalCredits._sum.credits || 0) - (creditsUsed._sum.creditsUsed || 0)

      if (remainingCredits < Math.abs(credits)) {
        return NextResponse.json(
          { success: false, error: 'Insufficient credits to deduct' },
          { status: 400 }
        )
      }
    }

    // Create credit transaction
    const transaction = await prisma.creditPurchase.create({
      data: {
        userId: params.id,
        credits: Math.abs(credits),
        amount: amount || 0,
        status: 'COMPLETED',
        packageName: `Admin ${credits > 0 ? 'Credit Addition' : 'Credit Deduction'}`,
        pricePerCredit: credits > 0 && amount ? (amount / Math.abs(credits)) : 0,
      },
    })

    // Create notification for the client
    await prisma.notification.create({
      data: {
        userId: params.id,
        type: 'SYSTEM_UPDATE',
        title: `Credits ${credits > 0 ? 'Added' : 'Deducted'}`,
        message: `${Math.abs(credits)} credits have been ${credits > 0 ? 'added to' : 'deducted from'} your account. ${reason || ''}`,
        isRead: false,
      },
    })

    return NextResponse.json({
      success: true,
      message: `Credits ${credits > 0 ? 'added' : 'deducted'} successfully`,
      data: transaction,
    })
  } catch (error) {
    console.error('Credit transaction error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process credit transaction' },
      { status: 500 }
    )
  }
}
