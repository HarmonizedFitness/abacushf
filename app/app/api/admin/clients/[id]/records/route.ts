
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { calculatePersonalRecords, isBodyweightExercise } from '@/lib/utils'

export const dynamic = 'force-dynamic'

// GET /api/admin/clients/[id]/records - Get client's personal records with calculation
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
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')
    const calculate = searchParams.get('calculate') !== 'false' // Default to true for admin

    // Verify client exists
    const client = await prisma.user.findUnique({
      where: {
        id: params.id,
        role: 'CLIENT',
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    })

    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      )
    }

    // Get stored personal records
    const personalRecords = await prisma.personalRecord.findMany({
      where: {
        userId: params.id,
      },
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
      orderBy: {
        achievedAt: 'desc',
      },
      take: limit,
      skip: (page - 1) * limit,
    })

    // Calculate PRs from workout data if requested
    let calculatedPRs: any[] = []
    let userBodyWeight: number | undefined

    if (calculate) {
      // Get client's latest body weight
      const latestBodyWeight = await prisma.progressEntry.findFirst({
        where: {
          userId: params.id,
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
              userId: params.id
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

    // FIXED: Use calculated PRs as primary data source (same logic as client endpoint)
    let finalRecords = []
    
    if (calculate && calculatedPRs.length > 0) {
      // Use calculated PRs as primary data source for accurate admin view
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

    return NextResponse.json({
      success: true,
      data: finalRecords,
      client: {
        id: client.id,
        name: client.name,
        email: client.email
      },
      calculated: calculate ? {
        totalCalculatedPRs: calculatedPRs.filter(pr => !pr.isBodyweight).length,
        userBodyWeight
      } : null,
      pagination: {
        page,
        limit,
        total: finalRecords.length,
        totalPages: Math.ceil(finalRecords.length / limit),
      }
    })
  } catch (error) {
    console.error('Get client records error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch client records' },
      { status: 500 }
    )
  }
}

// POST /api/admin/clients/[id]/records - Admin can manually update client PRs
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
          userId: params.id,
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
        userId: params.id,
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

    return NextResponse.json({
      success: true,
      message: `Personal record updated for ${client.name}`,
      data: personalRecord,
    })
  } catch (error) {
    console.error('Update client PR error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update personal record' },
      { status: 500 }
    )
  }
}
