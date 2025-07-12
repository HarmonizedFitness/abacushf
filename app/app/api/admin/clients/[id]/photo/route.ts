

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin()

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

    // Verify client exists
    const client = await prisma.user.findUnique({
      where: {
        id: params.id,
        role: 'CLIENT',
      },
    })

    if (!client) {
      return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 })
    }

    // Convert file to base64 data URL for simple storage
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')
    const dataUrl = `data:${file.type};base64,${base64}`

    // Update client's image in database
    const updatedClient = await prisma.user.update({
      where: { id: params.id },
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
      message: `Profile photo updated for ${updatedClient.name}`,
      imageUrl: updatedClient.image,
      data: updatedClient,
    })
  } catch (error) {
    console.error('Failed to update client photo:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update client photo' },
      { status: 500 }
    )
  }
}
