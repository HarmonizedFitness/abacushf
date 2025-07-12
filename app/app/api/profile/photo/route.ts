

import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('photo') as File

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ success: false, error: 'Invalid file type' }, { status: 400 })
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: 'File too large' }, { status: 400 })
    }

    // Convert file to base64 data URL for simple storage
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')
    const dataUrl = `data:${file.type};base64,${base64}`

    // Update user's image in database
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { image: dataUrl },
      select: {
        id: true,
        image: true,
        name: true,
        email: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Profile photo updated successfully',
      imageUrl: updatedUser.image,
      data: updatedUser,
    })
  } catch (error) {
    console.error('Failed to update profile photo:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update profile photo' },
      { status: 500 }
    )
  }
}
