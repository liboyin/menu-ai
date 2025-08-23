import { NextRequest, NextResponse } from 'next/server'
import { ProcessedMenu } from '@/types/menu'
import { generateChatResponse } from '@/lib/chat-processor'

export async function POST(request: NextRequest) {
  try {
    const { message, menu }: { message: string; menu: ProcessedMenu } = await request.json()

    if (!message || !menu) {
      return NextResponse.json(
        { error: 'Message and menu are required' },
        { status: 400 }
      )
    }

    const response = await generateChatResponse(message, menu)

    return NextResponse.json({ response })
  } catch (error) {
    console.error('Error in chat API:', error)
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    )
  }
}