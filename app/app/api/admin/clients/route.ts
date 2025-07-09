
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { isValidEmail } from '@/lib/utils'
import bcrypt from 'bcryptjs'

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

// POST /api/admin/clients - Create a new client
export async function POST(request: NextRequest) {
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
    const { firstName, lastName, email, phone, goals, experience, notes } = body

    // Validate input
    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { success: false, error: 'First name, last name, and email are required' },
        { status: 400 }
      )
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'User already exists with this email' },
        { status: 409 }
      )
    }

    // Generate a temporary password for the client
    const tempPassword = Math.random().toString(36).slice(-8) + 'A1!'
    const hashedPassword = await bcrypt.hash(tempPassword, 12)

    // Create the client
    const client = await prisma.user.create({
      data: {
        name: `${firstName.trim()} ${lastName.trim()}`,
        email: email.toLowerCase(),
        password: hashedPassword,
        phone: phone?.trim() || null,
        fitnessGoals: goals?.trim() || null,
        role: 'CLIENT',
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        fitnessGoals: true,
        isActive: true,
        createdAt: true,
      },
    })

    // Create welcome notification for the client
    await prisma.notification.create({
      data: {
        userId: client.id,
        type: 'WELCOME',
        title: 'Welcome to Harmonized Fitness! 💪',
        message: 'Your trainer has created an account for you. We\'re excited to help you achieve your fitness goals!',
        isRead: false,
      },
    })

    // Create notification for admin about the new client
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'SYSTEM_UPDATE',
        title: 'New Client Added',
        message: `${client.name} has been successfully added to your client list.`,
        isRead: false,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Client created successfully',
      data: {
        client,
        tempPassword, // In a real app, this would be sent via email
      },
    })
  } catch (error) {
    console.error('Create client error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create client' },
      { status: 500 }
    )
  }
}
