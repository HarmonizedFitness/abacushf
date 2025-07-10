

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { calculatePersonalRecords } from '@/lib/utils'

export const dynamic = 'force-dynamic'

// POST /api/personal-records/calculate - Calculate PRs from workout data
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { userId } = body

    // Determine target user
    let targetUserId = user.id
    if (userId && user.role === 'ADMIN') {
      targetUserId = userId
    } else if (userId && user.role === 'CLIENT') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to calculate PRs for other users' },
        { status: 403 }
      )
    }

    // Verify target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, name: true, role: true }
    })

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Get user's latest body weight from progress entries
    const latestBodyWeight = await prisma.progressEntry.findFirst({
      where: {
        userId: targetUserId,
        type: 'BODY_WEIGHT'
      },
      orderBy: { recordedAt: 'desc' },
      select: { value: true }
    })

    const userBodyWeight = latestBodyWeight ? Number(latestBodyWeight.value) : undefined

    // Get all workout sets for the user with exercise and workout session data
    const workoutSets = await prisma.workoutSet.findMany({
      where: {
        workoutExercise: {
          workoutSession: {
            userId: targetUserId
          }
        }
      },
      include: {
        workoutExercise: {
          include: {
            exercise: {
              select: {
                id: true,
                name: true,
                category: true,
                equipment: true
              }
            },
            workoutSession: {
              select: {
                id: true,
                date: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // Calculate PRs using utility function
    const calculatedPRs = calculatePersonalRecords(workoutSets, userBodyWeight)

    let updatedCount = 0
    let createdCount = 0

    // Update PersonalRecord entries
    for (const pr of calculatedPRs) {
      if (!pr.exerciseId) continue

      // Determine the best record to store (prioritize volume PR, fallback to weight PR)
      const bestRecord = pr.maxVolume || pr.maxWeight
      if (!bestRecord) continue

      const prData = {
        userId: targetUserId,
        exerciseId: pr.exerciseId,
        weight: pr.isBodyweight ? null : bestRecord.weight,
        reps: bestRecord.reps,
        volume: pr.maxVolume?.volume || null,
        achievedAt: new Date(bestRecord.achievedAt),
        notes: `Auto-calculated PR${pr.isBodyweight ? ' (Bodyweight)' : ''}`
      }

      // Upsert personal record
      const existingPR = await prisma.personalRecord.findUnique({
        where: {
          userId_exerciseId: {
            userId: targetUserId,
            exerciseId: pr.exerciseId
          }
        }
      })

      if (existingPR) {
        // Only update if the new PR is actually better
        const shouldUpdate = (pr.maxVolume && (!existingPR.volume || pr.maxVolume.volume > Number(existingPR.volume))) ||
                           (!pr.maxVolume && pr.maxWeight && (!existingPR.weight || pr.maxWeight.weight > Number(existingPR.weight)))

        if (shouldUpdate) {
          await prisma.personalRecord.update({
            where: { id: existingPR.id },
            data: prData
          })
          updatedCount++
        }
      } else {
        await prisma.personalRecord.create({
          data: prData
        })
        createdCount++
      }
    }

    return NextResponse.json({
      success: true,
      message: `PRs calculated successfully for ${targetUser.name}`,
      data: {
        userId: targetUserId,
        userName: targetUser.name,
        calculatedPRs: calculatedPRs.length,
        createdRecords: createdCount,
        updatedRecords: updatedCount,
        userBodyWeight
      }
    })
  } catch (error) {
    console.error('Calculate PRs error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to calculate personal records' },
      { status: 500 }
    )
  }
}

// GET /api/personal-records/calculate - Get calculated PRs without saving
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    // Determine target user
    let targetUserId = user.id
    if (userId && user.role === 'ADMIN') {
      targetUserId = userId
    } else if (userId && user.role === 'CLIENT') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to view PRs for other users' },
        { status: 403 }
      )
    }

    // Get user's latest body weight
    const latestBodyWeight = await prisma.progressEntry.findFirst({
      where: {
        userId: targetUserId,
        type: 'BODY_WEIGHT'
      },
      orderBy: { recordedAt: 'desc' },
      select: { value: true }
    })

    const userBodyWeight = latestBodyWeight ? Number(latestBodyWeight.value) : undefined

    // Get all workout sets for the user
    const workoutSets = await prisma.workoutSet.findMany({
      where: {
        workoutExercise: {
          workoutSession: {
            userId: targetUserId
          }
        }
      },
      include: {
        workoutExercise: {
          include: {
            exercise: {
              select: {
                id: true,
                name: true,
                category: true,
                equipment: true
              }
            },
            workoutSession: {
              select: {
                id: true,
                date: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // Calculate PRs using utility function
    const calculatedPRs = calculatePersonalRecords(workoutSets, userBodyWeight)

    return NextResponse.json({
      success: true,
      data: calculatedPRs,
      userBodyWeight,
      totalSets: workoutSets.length
    })
  } catch (error) {
    console.error('Get calculated PRs error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to calculate personal records' },
      { status: 500 }
    )
  }
}

