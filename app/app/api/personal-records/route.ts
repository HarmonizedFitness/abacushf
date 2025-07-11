
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { calculatePersonalRecords, isBodyweightExercise, calculatePRStatistics } from '@/lib/utils'

export const dynamic = 'force-dynamic'

// GET /api/personal-records - Get user's personal records with automatic calculation
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const exerciseId = searchParams.get('exerciseId')
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '20')
    const page = parseInt(searchParams.get('page') || '1')
    const calculate = searchParams.get('calculate') === 'true'

    const where: any = {
      userId: user.id,
    }

    if (exerciseId) {
      where.exerciseId = exerciseId
    }

    if (category) {
      where.exercise = {
        category,
      }
    }

    // Get stored personal records
    const [personalRecords, total] = await Promise.all([
      prisma.personalRecord.findMany({
        where,
        orderBy: { achievedAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
        include: {
          exercise: {
            select: {
              id: true,
              name: true,
              category: true,
              muscleGroups: true,
              equipment: true,
              imageUrl: true,
            },
          },
        },
      }),
      prisma.personalRecord.count({ where }),
    ])

    // If calculate=true, also calculate PRs from workout data and compare
    let calculatedPRs: any[] = []
    let userBodyWeight: number | undefined

    if (calculate) {
      // Get user's latest body weight
      const latestBodyWeight = await prisma.progressEntry.findFirst({
        where: {
          userId: user.id,
          type: 'BODY_WEIGHT'
        },
        orderBy: { recordedAt: 'desc' },
        select: { value: true }
      })

      userBodyWeight = latestBodyWeight ? Number(latestBodyWeight.value) : undefined

      // Get all workout sets for calculation
      const workoutSets = await prisma.workoutSet.findMany({
        where: {
          workoutExercise: {
            workoutSession: {
              userId: user.id
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
        }
      })

      calculatedPRs = calculatePersonalRecords(workoutSets, userBodyWeight)
    }

    // FIXED: Use calculated PRs as primary data, filter out bodyweight exercises
    let finalRecords = []
    
    if (calculate && calculatedPRs.length > 0) {
      // Use calculated PRs as primary data source
      finalRecords = calculatedPRs
        .filter(pr => !pr.isBodyweight) // Filter out bodyweight exercises
        .map(pr => {
          // Find corresponding stored record for additional data
          const storedRecord = personalRecords.find(stored => stored.exerciseId === pr.exerciseId)
          
          return {
            id: storedRecord?.id || pr.exerciseId,
            exerciseId: pr.exerciseId,
            // FIXED: Use calculated weight PR instead of stored weight
            weight: pr.maxWeight?.weight || null,
            reps: pr.maxWeight?.reps || null,
            // FIXED: Use calculated volume PR instead of stored volume  
            volume: pr.maxVolume?.volume || null,
            duration: storedRecord?.duration || null,
            notes: storedRecord?.notes || null,
            achievedAt: pr.maxWeight?.achievedAt || pr.maxVolume?.achievedAt || storedRecord?.achievedAt || new Date().toISOString(),
            exercise: {
              id: pr.exerciseId,
              name: pr.exerciseName,
              category: pr.category,
              muscleGroups: storedRecord?.exercise?.muscleGroups || [],
              equipment: storedRecord?.exercise?.equipment || null,
              imageUrl: storedRecord?.exercise?.imageUrl || null,
            },
            isBodyweight: pr.isBodyweight,
            calculated: {
              maxWeight: pr.maxWeight,
              maxVolume: pr.maxVolume,
              userBodyWeight,
              totalLifetimeVolume: pr.totalLifetimeVolume
            }
          }
        })
    } else {
      // Fallback to stored records if calculation is disabled
      finalRecords = personalRecords.map(record => {
        const isBodyweight = isBodyweightExercise(record.exercise)
        return {
          ...record,
          isBodyweight,
          calculated: null
        }
      }).filter(record => !record.isBodyweight) // Filter out bodyweight exercises
    }

    // Calculate accurate statistics if requested
    let calculatedStats = null
    if (calculate && calculatedPRs.length > 0) {
      calculatedStats = calculatePRStatistics(calculatedPRs)
    }

    return NextResponse.json({
      success: true,
      data: finalRecords,
      pagination: {
        total: finalRecords.length,
        page,
        limit,
        totalPages: Math.ceil(finalRecords.length / limit),
        hasNext: page * limit < finalRecords.length,
        hasPrev: page > 1,
      },
      calculated: calculate ? {
        totalCalculatedPRs: calculatedPRs.filter(pr => !pr.isBodyweight).length,
        userBodyWeight,
        // Add accurate statistics based on calculated PRs
        statistics: calculatedStats
      } : null
    })
  } catch (error) {
    console.error('Get personal records error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch personal records' },
      { status: 500 }
    )
  }
}

// POST /api/personal-records - Create/update personal record manually
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { exerciseId, weight, reps, duration, notes } = body

    // Validate input
    if (!exerciseId) {
      return NextResponse.json(
        { success: false, error: 'Exercise ID is required' },
        { status: 400 }
      )
    }

    if (!weight && !duration) {
      return NextResponse.json(
        { success: false, error: 'Weight or duration is required' },
        { status: 400 }
      )
    }

    // Check if exercise exists
    const exercise = await prisma.exercise.findUnique({
      where: { id: exerciseId, isActive: true },
    })

    if (!exercise) {
      return NextResponse.json(
        { success: false, error: 'Exercise not found' },
        { status: 404 }
      )
    }

    // Calculate volume if weight and reps provided
    const volume = weight && reps ? weight * reps : null

    // Create or update personal record
    const personalRecord = await prisma.personalRecord.upsert({
      where: {
        userId_exerciseId: {
          userId: user.id,
          exerciseId,
        },
      },
      update: {
        weight: weight || null,
        reps: reps || null,
        duration: duration || null,
        volume: volume || null,
        notes: notes || null,
        achievedAt: new Date(),
      },
      create: {
        userId: user.id,
        exerciseId,
        weight: weight || null,
        reps: reps || null,
        duration: duration || null,
        volume: volume || null,
        notes: notes || null,
        achievedAt: new Date(),
      },
      include: {
        exercise: {
          select: {
            id: true,
            name: true,
            category: true,
            muscleGroups: true,
          },
        },
      },
    })

    // Create notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'PERSONAL_RECORD',
        title: 'Personal Record Updated! 🎉',
        message: `You updated your PR for ${exercise.name}${weight ? `: ${weight} lbs` : ''}${reps ? ` x ${reps} reps` : ''}${duration ? `: ${duration}s` : ''}`,
        isRead: false,
        metadata: {
          exerciseId,
          weight: weight?.toString(),
          reps: reps?.toString(),
          duration: duration?.toString(),
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Personal record updated successfully',
      data: personalRecord,
    })
  } catch (error) {
    console.error('Create/update personal record error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update personal record' },
      { status: 500 }
    )
  }
}
