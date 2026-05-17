import { NextRequest, NextResponse } from 'next/server'
import { processMenuImages } from '@/lib/menu-processor'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

export const runtime = 'nodejs'

// Vercel-specific: extend the serverless function timeout to 60s (Hobby plan
// default is 10s, which is too short for a multi-image Gemini vision call).
// Ignored on other platforms.
export const maxDuration = 60

// Caps on per-request upload work — bounds Gemini token cost, base64
// expansion, and serverless memory before any third-party API is called.
export const MAX_IMAGES = 4
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024

/**
 * Handles POST /api/process-menu.
 *
 * Expects a multipart form with one or more image files under the key
 * "images". Validates per-request limits (count and per-file size), then
 * delegates to processMenuImages and returns the structured menu as JSON.
 *
 * Args:
 *   request: The incoming Next.js request containing FormData.
 *
 * Returns:
 *   200 with ProcessedMenu JSON on success; 400 if no images are provided,
 *   if more than MAX_IMAGES are sent, or if any image exceeds
 *   MAX_IMAGE_SIZE_BYTES; or 500 on processing failure.
 */
export async function POST(request: NextRequest) {
  try {
    const rl = await checkRateLimit(getClientIp(request))
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil(rl.retryAfterMs / 1000).toString(),
            'X-RateLimit-Limit': rl.limit.toString(),
            'X-RateLimit-Remaining': '0',
          },
        }
      )
    }

    const formData = await request.formData()
    const images = formData.getAll('images') as File[]

    if (!images || images.length === 0) {
      return NextResponse.json(
        { error: 'No images provided' },
        { status: 400 }
      )
    }

    if (images.length > MAX_IMAGES) {
      return NextResponse.json(
        { error: `Too many images: limit is ${MAX_IMAGES}` },
        { status: 400 }
      )
    }

    const oversized = images.find((image) => image.size > MAX_IMAGE_SIZE_BYTES)
    if (oversized) {
      const limitMb = MAX_IMAGE_SIZE_BYTES / (1024 * 1024)
      return NextResponse.json(
        { error: `Image "${oversized.name}" exceeds ${limitMb}MB limit` },
        { status: 400 }
      )
    }

    const processedMenu = await processMenuImages(images)

    return NextResponse.json(processedMenu, {
      headers: {
        'X-RateLimit-Limit': rl.limit.toString(),
        'X-RateLimit-Remaining': rl.remaining.toString(),
      },
    })
  } catch (error) {
    console.error('Error processing menu:', error)
    return NextResponse.json(
      { error: 'Failed to process menu images' },
      { status: 500 }
    )
  }
}