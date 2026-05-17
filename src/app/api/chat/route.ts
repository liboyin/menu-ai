import { NextRequest, NextResponse } from 'next/server'
import { ProcessedMenu } from '@/types/menu'
import { generateChatResponse } from '@/lib/chat-processor'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

export const runtime = 'nodejs'

// Vercel-specific: extend the serverless function timeout to 60s (Hobby plan
// default is 10s, which can be too short for Gemini chat completions over a
// large inlined menu). Ignored on other platforms.
export const maxDuration = 60

/**
 * Handles POST /api/chat.
 *
 * Expects a JSON body with "message" (string) and "menu" (ProcessedMenu).
 * Returns an AI-generated response grounded in the supplied menu.
 *
 * Args:
 *   request: The incoming Next.js request with JSON body.
 *
 * Returns:
 *   200 with { response: string } on success, 400 if fields are missing,
 *   or 500 on generation failure.
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

    const { message, menu }: { message: string; menu: ProcessedMenu } = await request.json()

    if (!message || !menu) {
      return NextResponse.json(
        { error: 'Message and menu are required' },
        { status: 400 }
      )
    }

    const response = await generateChatResponse(message, menu)

    return NextResponse.json(
      { response },
      {
        headers: {
          'X-RateLimit-Limit': rl.limit.toString(),
          'X-RateLimit-Remaining': rl.remaining.toString(),
        },
      }
    )
  } catch (error) {
    console.error('Error in chat API:', error)
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    )
  }
}