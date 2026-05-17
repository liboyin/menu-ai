/**
 * @jest-environment node
 *
 * next/server's NextRequest extends the Web Fetch Request, which jsdom does
 * not provide. The node environment supplies it natively.
 */
import { NextRequest } from 'next/server'
import * as testee from './route'
import * as chatProcessor from '@/lib/chat-processor'
import * as rateLimit from '@/lib/rate-limit'
import { ProcessedMenu } from '@/types/menu'

jest.mock('@/lib/chat-processor')
jest.mock('@/lib/rate-limit')

const menu: ProcessedMenu = { items: [] }

const makeRequest = (body: unknown): NextRequest =>
  ({
    headers: { get: () => null },
    json: () => Promise.resolve(body),
  }) as unknown as NextRequest

describe('POST /api/chat', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    jest.mocked(rateLimit.getClientIp).mockReturnValue('test-ip')
    jest.mocked(rateLimit.checkRateLimit).mockResolvedValue({
      allowed: true,
      limit: 10,
      remaining: 7,
      retryAfterMs: 0,
    })
  })

  it('returns 429 when the caller is rate-limited and skips generation', async () => {
    jest.mocked(rateLimit.checkRateLimit).mockResolvedValue({
      allowed: false,
      limit: 10,
      remaining: 0,
      retryAfterMs: 30_000,
    })

    const response = await testee.POST(makeRequest({ message: 'hi', menu }))

    expect(response.status).toBe(429)
    expect(response.headers.get('Retry-After')).toBe('30')
    expect(response.headers.get('X-RateLimit-Limit')).toBe('10')
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('0')
    expect(chatProcessor.generateChatResponse).not.toHaveBeenCalled()
  })

  it('returns 400 when message is missing', async () => {
    const response = await testee.POST(makeRequest({ menu }))

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      error: 'Message and menu are required',
    })
    expect(chatProcessor.generateChatResponse).not.toHaveBeenCalled()
  })

  it('returns 400 when menu is missing', async () => {
    const response = await testee.POST(makeRequest({ message: 'hi' }))

    expect(response.status).toBe(400)
    expect(chatProcessor.generateChatResponse).not.toHaveBeenCalled()
  })

  it('returns 200 with the generated response and rate-limit headers', async () => {
    jest.mocked(chatProcessor.generateChatResponse).mockResolvedValue('hello!')

    const response = await testee.POST(makeRequest({ message: 'hi', menu }))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ response: 'hello!' })
    expect(response.headers.get('X-RateLimit-Limit')).toBe('10')
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('7')
    expect(chatProcessor.generateChatResponse).toHaveBeenCalledWith('hi', menu)
  })

  it('returns 500 when generateChatResponse throws', async () => {
    jest
      .mocked(chatProcessor.generateChatResponse)
      .mockRejectedValue(new Error('boom'))
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    const response = await testee.POST(makeRequest({ message: 'hi', menu }))

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({
      error: 'Failed to process chat message',
    })
    errorSpy.mockRestore()
  })
})
