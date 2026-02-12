import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { extractActivitiesFromImage } from '@/lib/anthropic/vision'

export async function POST(request: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const image = formData.get('image') as File

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!validTypes.includes(image.type)) {
      return NextResponse.json(
        { error: 'Invalid image type. Supported: JPG, PNG, WebP, GIF' },
        { status: 400 }
      )
    }

    // Check file size (max 10MB)
    if (image.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Image too large. Maximum size is 10MB' },
        { status: 400 }
      )
    }

    // Convert to base64
    const bytes = await image.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')

    // Extract activities
    const activities = await extractActivitiesFromImage(base64, image.type)

    return NextResponse.json({ activities })
  } catch (error) {
    console.error('Error in POST /api/ai/extract:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to process image'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
