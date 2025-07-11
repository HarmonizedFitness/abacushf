
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const clientUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  phone: z.string().optional(),
  fitnessGoals: z.string().optional(),
  isActive: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  daysPerWeek: z.number().min(1).max(7).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAdmin()

    const client = await prisma.user.findUnique({
      where: { id: params.id },
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
        isArchived: true,
        daysPerWeek: true,
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
    })

    if (!client) {
      return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 })
    }

    // FIXED: Get remaining credits using same calculation as client view (workout-based)
    const totalPurchased = await prisma.creditPurchase.aggregate({
      where: {
        userId: client.id,
        status: 'COMPLETED',
      },
      _sum: {
        credits: true,
      },
    })

    const completedWorkouts = await prisma.workoutSession.count({
      where: {
        userId: client.id,
        status: 'COMPLETED'
      }
    })

    const purchased = totalPurchased._sum.credits || 0
    const remainingCredits = Math.max(0, purchased - completedWorkouts)

    return NextResponse.json({
      success: true,
      data: {
        ...client,
        remainingCredits,
      },
    })
  } catch (error) {
    console.error('Failed to fetch client:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch client' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAdmin()

    const body = await request.json()
    const validatedData = clientUpdateSchema.parse(body)

    // Check if client exists
    const existingClient = await prisma.user.findUnique({
      where: { id: params.id },
    })

    if (!existingClient) {
      return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 })
    }

    // Update client
    const updatedClient = await prisma.user.update({
      where: { id: params.id },
      data: {
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.phone !== undefined && { phone: validatedData.phone || null }),
        ...(validatedData.fitnessGoals !== undefined && { fitnessGoals: validatedData.fitnessGoals || null }),
        ...(validatedData.isActive !== undefined && { isActive: validatedData.isActive }),
        ...(validatedData.isArchived !== undefined && { isArchived: validatedData.isArchived }),
        ...(validatedData.daysPerWeek !== undefined && { daysPerWeek: validatedData.daysPerWeek }),
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
        isArchived: true,
        daysPerWeek: true,
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
    })

    // FIXED: Get remaining credits using same calculation as client view (workout-based)
    const totalPurchased = await prisma.creditPurchase.aggregate({
      where: {
        userId: updatedClient.id,
        status: 'COMPLETED',
      },
      _sum: {
        credits: true,
      },
    })

    const completedWorkouts = await prisma.workoutSession.count({
      where: {
        userId: updatedClient.id,
        status: 'COMPLETED'
      }
    })

    const purchased = totalPurchased._sum.credits || 0
    const remainingCredits = Math.max(0, purchased - completedWorkouts)

    return NextResponse.json({
      success: true,
      data: {
        ...updatedClient,
        remainingCredits,
      },
    })
  } catch (error) {
    console.error('Failed to update client:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid data provided', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update client' },
      { status: 500 }
    )
  }
}
