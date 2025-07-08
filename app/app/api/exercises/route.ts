
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, isAdmin } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET /api/exercises - Get exercises
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const muscleGroup = searchParams.get('muscleGroup')
    const search = searchParams.get('search')
    const favorites = searchParams.get('favorites') === 'true'
    const limit = parseInt(searchParams.get('limit') || '20')
    const page = parseInt(searchParams.get('page') || '1')

    const where: any = {
      isActive: true,
    }

    if (category) {
      where.category = category
    }

    if (muscleGroup) {
      where.muscleGroups = {
        has: muscleGroup,
      }
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (favorites) {
      where.favoritedBy = {
        some: {
          id: user.id,
        },
      }
    }

    const [exercises, total] = await Promise.all([
      prisma.exercise.findMany({
        where,
        orderBy: { name: 'asc' },
        take: limit,
        skip: (page - 1) * limit,
        include: {
          _count: {
            select: {
              favoritedBy: true,
              workoutExercises: true,
            },
          },
          favoritedBy: {
            where: { id: user.id },
            select: { id: true },
          },
        },
      }),
      prisma.exercise.count({ where }),
    ])

    // Add isFavorite flag
    const exercisesWithFavorites = exercises.map((exercise) => ({
      ...exercise,
      isFavorite: exercise.favoritedBy.length > 0,
      favoritedBy: undefined, // Remove from response
    }))

    return NextResponse.json({
      success: true,
      data: exercisesWithFavorites,
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
    console.error('Get exercises error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch exercises' },
      { status: 500 }
    )
  }
}

// POST /api/exercises - Create new exercise (admin only)
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    
    // Check if user is admin
    const userIsAdmin = await isAdmin()
    if (!userIsAdmin) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { 
      name, 
      description, 
      instructions, 
      category, 
      muscleGroups, 
      equipment,
      imageUrl,
      videoUrl 
    } = body

    // Validate input
    if (!name || !category || !muscleGroups || !Array.isArray(muscleGroups)) {
      return NextResponse.json(
        { success: false, error: 'Name, category, and muscle groups are required' },
        { status: 400 }
      )
    }

    // Check if exercise with same name exists
    const existingExercise = await prisma.exercise.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    })

    if (existingExercise) {
      return NextResponse.json(
        { success: false, error: 'Exercise with this name already exists' },
        { status: 409 }
      )
    }

    // Create exercise
    const exercise = await prisma.exercise.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        instructions: instructions?.trim() || null,
        category: category.trim(),
        muscleGroups,
        equipment: equipment?.trim() || null,
        imageUrl: imageUrl?.trim() || null,
        videoUrl: videoUrl?.trim() || null,
        isActive: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Exercise created successfully',
      data: exercise,
    })
  } catch (error) {
    console.error('Create exercise error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create exercise' },
      { status: 500 }
    )
  }
}
