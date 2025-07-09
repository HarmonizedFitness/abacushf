
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const profileUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  fitnessGoals: z.string().optional(),
})

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile with additional data
    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        dateOfBirth: true,
        fitnessGoals: true,
        image: true,
        role: true,
        isActive: true,
        createdAt: true,
        daysPerWeek: true,
        _count: {
          select: {
            bookings: true,
            workoutSessions: true,
            personalRecords: true,
            creditPurchases: true,
          },
        },
      },
    })

    if (!profile) {
      return NextResponse.json({ success: false, error: 'Profile not found' }, { status: 404 })
    }

    // Get remaining credits
    const totalPurchased = await prisma.creditPurchase.aggregate({
      where: {
        userId: user.id,
        status: 'COMPLETED',
      },
      _sum: {
        credits: true,
      },
    })

    const totalUsed = await prisma.booking.aggregate({
      where: {
        userId: user.id,
        status: {
          in: ['CONFIRMED', 'COMPLETED'],
        },
      },
      _sum: {
        creditsUsed: true,
      },
    })

    const purchased = totalPurchased._sum.credits || 0
    const used = totalUsed._sum.creditsUsed || 0
    const remainingCredits = Math.max(0, purchased - used)

    return NextResponse.json({
      success: true,
      data: {
        ...profile,
        remainingCredits,
      },
    })
  } catch (error) {
    console.error('Failed to fetch profile:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = profileUpdateSchema.parse(body)

    // Update user profile
    const updatedProfile = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: validatedData.name,
        phone: validatedData.phone || null,
        dateOfBirth: validatedData.dateOfBirth ? new Date(validatedData.dateOfBirth) : null,
        fitnessGoals: validatedData.fitnessGoals || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        dateOfBirth: true,
        fitnessGoals: true,
        image: true,
        role: true,
        isActive: true,
        createdAt: true,
        daysPerWeek: true,
        _count: {
          select: {
            bookings: true,
            workoutSessions: true,
            personalRecords: true,
            creditPurchases: true,
          },
        },
      },
    })

    // Get remaining credits
    const totalPurchased = await prisma.creditPurchase.aggregate({
      where: {
        userId: user.id,
        status: 'COMPLETED',
      },
      _sum: {
        credits: true,
      },
    })

    const totalUsed = await prisma.booking.aggregate({
      where: {
        userId: user.id,
        status: {
          in: ['CONFIRMED', 'COMPLETED'],
        },
      },
      _sum: {
        creditsUsed: true,
      },
    })

    const purchased = totalPurchased._sum.credits || 0
    const used = totalUsed._sum.creditsUsed || 0
    const remainingCredits = Math.max(0, purchased - used)

    return NextResponse.json({
      success: true,
      data: {
        ...updatedProfile,
        remainingCredits,
      },
    })
  } catch (error) {
    console.error('Failed to update profile:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid data provided', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}
