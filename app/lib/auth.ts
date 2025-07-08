
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/db'
import { UserRole } from '@prisma/client'

export async function getSession() {
  return await getServerSession(authOptions)
}

export async function getCurrentUser() {
  const session = await getSession()

  if (!session?.user?.email) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      image: true,
      phone: true,
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

  return user
}

export async function requireAuth() {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('Authentication required')
  }

  if (!user.isActive) {
    throw new Error('Account is deactivated')
  }

  return user
}

export async function requireRole(role: UserRole) {
  const user = await requireAuth()

  if (user.role !== role) {
    throw new Error(`${role} role required`)
  }

  return user
}

export async function requireAdmin() {
  return await requireRole('ADMIN')
}

export async function isAdmin() {
  const user = await getCurrentUser()
  return user?.role === 'ADMIN'
}

export async function getUserCredits(userId: string): Promise<number> {
  // Get total credits purchased
  const totalPurchased = await prisma.creditPurchase.aggregate({
    where: {
      userId,
      status: 'COMPLETED',
    },
    _sum: {
      credits: true,
    },
  })

  // Get total credits used
  const totalUsed = await prisma.booking.aggregate({
    where: {
      userId,
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

  return Math.max(0, purchased - used)
}

export async function canBookSession(userId: string, creditsRequired: number = 1): Promise<boolean> {
  const availableCredits = await getUserCredits(userId)
  return availableCredits >= creditsRequired
}

export async function isUserActive(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isActive: true },
  })

  return user?.isActive ?? false
}

export async function hasPermission(
  userId: string,
  action: 'read' | 'write' | 'delete',
  resource: 'user' | 'booking' | 'exercise' | 'workout' | 'config',
  targetUserId?: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, isActive: true },
  })

  if (!user?.isActive) {
    return false
  }

  // Admin has all permissions
  if (user.role === 'ADMIN') {
    return true
  }

  // Client permissions
  if (user.role === 'CLIENT') {
    switch (resource) {
      case 'user':
        // Clients can only read/write their own profile
        return targetUserId === userId && (action === 'read' || action === 'write')
      
      case 'booking':
        // Clients can read/write their own bookings
        return targetUserId === userId && (action === 'read' || action === 'write')
      
      case 'exercise':
        // Clients can only read exercises
        return action === 'read'
      
      case 'workout':
        // Clients can read/write their own workouts
        return targetUserId === userId && (action === 'read' || action === 'write')
      
      case 'config':
        // Clients can only read certain configs
        return action === 'read'
      
      default:
        return false
    }
  }

  return false
}

export async function validateSession(): Promise<boolean> {
  try {
    const session = await getSession()
    
    if (!session?.user?.id) {
      return false
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isActive: true },
    })

    return user?.isActive ?? false
  } catch {
    return false
  }
}
