import { NextRequest, NextResponse } from 'next/server'
import { processMenuImages } from '@/lib/menu-processor'

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