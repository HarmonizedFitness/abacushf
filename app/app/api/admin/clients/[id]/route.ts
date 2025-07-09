
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { isValidEmail } from '@/lib/utils'

export const dynamic = 'force-dynamic'

// GET /api/admin/clients/[id] - Get specific client details
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

    const client = await prisma.user.findUnique({
      where: {
        id: params.id,
        role: 'CLIENT',
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
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      )
    }

    // Calculate remaining credits
    const totalCredits = await prisma.creditPurchase.aggregate({
      where: {
        userId: client.id,
        status: 'COMPLETED',
      },
      _sum: {
        credits: true,
      },
    })

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

    return NextResponse.json({
      success: true,
      data: {
        ...client,
        remainingCredits: Math.max(0, remainingCredits),
      },
    })
  } catch (error) {
    console.error('Get client error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch client' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/clients/[id] - Update client details
export async function PATCH(
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
    const { name, email, phone, fitnessGoals, isActive } = body

    // Validate email if provided
    if (email && !isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Check if email is already taken by another user
    if (email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      })

      if (existingUser && existingUser.id !== params.id) {
        return NextResponse.json(
          { success: false, error: 'Email already taken by another user' },
          { status: 409 }
        )
      }
    }

    // Update client
    const updatedClient = await prisma.user.update({
      where: {
        id: params.id,
        role: 'CLIENT',
      },
      data: {
        ...(name && { name: name.trim() }),
        ...(email && { email: email.toLowerCase() }),
        ...(phone !== undefined && { phone: phone?.trim() || null }),
        ...(fitnessGoals !== undefined && { fitnessGoals: fitnessGoals?.trim() || null }),
        ...(isActive !== undefined && { isActive }),
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

    return NextResponse.json({
      success: true,
      message: 'Client updated successfully',
      data: updatedClient,
    })
  } catch (error) {
    console.error('Update client error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update client' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/clients/[id] - Delete client (optional - for future use)
export async function DELETE(
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

    // Instead of deleting, we'll deactivate the client
    const updatedClient = await prisma.user.update({
      where: {
        id: params.id,
        role: 'CLIENT',
      },
      data: {
        isActive: false,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Client deactivated successfully',
      data: updatedClient,
    })
  } catch (error) {
    console.error('Delete client error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to deactivate client' },
      { status: 500 }
    )
  }
}
