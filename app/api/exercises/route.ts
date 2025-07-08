
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can access exercises
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const search = searchParams.get('search')
    const category = searchParams.get('category')
    const muscleGroup = searchParams.get('muscleGroup')
    const favorites = searchParams.get('favorites') === 'true'

    const skip = (page - 1) * limit

    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (category && category !== 'all') {
      where.category = category
    }

    if (muscleGroup && muscleGroup !== 'all') {
      where.muscleGroups = { has: muscleGroup }
    }

    const [exercises, total] = await Promise.all([
      prisma.exercise.findMany({
        where,
        include: {
          _count: {
            select: {
              favoritedBy: true,
              workoutExercises: true,
            }
          },
          favoritedBy: favorites ? {
            where: { id: session.user.id }
          } : false,
        },
        orderBy: {
          name: 'asc'
        },
        skip,
        take: limit,
      }),
      prisma.exercise.count({ where })
    ])

    const totalPages = Math.ceil(total / limit)

    // Add isFavorite field to exercises
    const exercisesWithFavorites = exercises.map(exercise => ({
      ...exercise,
      isFavorite: favorites ? exercise.favoritedBy?.length > 0 : false,
      favoritedBy: undefined, // Remove the favoritedBy field from response
    }))

    return NextResponse.json({
      success: true,
      data: exercisesWithFavorites,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    })
  } catch (error) {
    console.error('Failed to fetch exercises:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
