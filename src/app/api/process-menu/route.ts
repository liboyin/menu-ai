import { NextRequest, NextResponse } from 'next/server'
import { processMenuImages } from '@/lib/menu-processor'

/**
 * Handles POST /api/process-menu.
 *
 * Expects a multipart form with one or more image files under the key
 * "images". Delegates to processMenuImages and returns the structured menu
 * as JSON.
 *
 * Args:
 *   request: The incoming Next.js request containing FormData.
 *
 * Returns:
 *   200 with ProcessedMenu JSON on success, 400 if no images are provided,
 *   or 500 on processing failure.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const images = formData.getAll('images') as File[]
    
    if (!images || images.length === 0) {
      return NextResponse.json(
        { error: 'No images provided' },
        { status: 400 }
      )
    }

    const processedMenu = await processMenuImages(images)
    
    return NextResponse.json(processedMenu)
  } catch (error) {
    console.error('Error processing menu:', error)
    return NextResponse.json(
      { error: 'Failed to process menu images' },
      { status: 500 }
    )
  }
}