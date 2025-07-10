
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const profileUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format').optional(),
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

    // Get remaining credits only for non-admin users
    let remainingCredits = 0
    if (profile.role !== 'ADMIN') {
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
      remainingCredits = Math.max(0, purchased - used)
    }

    return NextResponse.json({
      success: true,
      data: {
        ...profile,
        remainingCredits: profile.role === 'ADMIN' ? undefined : remainingCredits,
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

    // Check if email is being changed and validate uniqueness
    if (validatedData.email && validatedData.email !== user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: validatedData.email.toLowerCase() },
      })
      
      if (existingUser && existingUser.id !== user.id) {
        return NextResponse.json(
          { success: false, error: 'Email is already in use by another user' },
          { status: 409 }
        )
      }
    }

    // Prepare update data based on user role
    const updateData: any = {
      name: validatedData.name,
      phone: validatedData.phone || null,
    }

    // Add email if provided (all users can change email)
    if (validatedData.email) {
      updateData.email = validatedData.email.toLowerCase()
    }

    // Add client-specific fields only for non-admin users
    if (user.role !== 'ADMIN') {
      updateData.dateOfBirth = validatedData.dateOfBirth ? new Date(validatedData.dateOfBirth) : null
      updateData.fitnessGoals = validatedData.fitnessGoals || null
    }

    // Update user profile
    const updatedProfile = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
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

    // Get remaining credits only for non-admin users
    let remainingCredits = 0
    if (updatedProfile.role !== 'ADMIN') {
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
      remainingCredits = Math.max(0, purchased - used)
    }

    return NextResponse.json({
      success: true,
      data: {
        ...updatedProfile,
        remainingCredits: updatedProfile.role === 'ADMIN' ? undefined : remainingCredits,
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
