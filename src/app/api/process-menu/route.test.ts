/**
 * @jest-environment node
 *
 * next/server's NextRequest extends the Web Fetch Request, which jsdom does
 * not provide. The node environment supplies it natively.
 */
import { NextRequest } from 'next/server'
import * as testee from './route'
import * as menuProcessor from '@/lib/menu-processor'
import * as rateLimit from '@/lib/rate-limit'

jest.mock('@/lib/menu-processor')
jest.mock('@/lib/rate-limit')

const makeImage = (name: string, size: number): File =>
  ({ name, size, type: 'image/jpeg' }) as unknown as File

const makeRequest = (images: File[]): NextRequest => {
  // The route only calls formData().getAll('images'), so a minimal stub
  // returning the duck-typed File array suffices — avoids jsdom Blob coercion.
  const fake = {
    getAll: (key: string) => (key === 'images' ? images : []),
  } as unknown as FormData
  return {
    headers: { get: () => null },
    formData: () => Promise.resolve(fake),
  } as unknown as NextRequest
}

describe('POST /api/process-menu', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    jest.mocked(rateLimit.getClientIp).mockReturnValue('test-ip')
    jest.mocked(rateLimit.checkRateLimit).mockResolvedValue({
      allowed: true,
      limit: 10,
      remaining: 9,
      retryAfterMs: 0,
    })
  })

  it('returns 400 when no images are provided', async () => {
    const response = await testee.POST(makeRequest([]))

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'No images provided' })
    expect(menuProcessor.processMenuImages).not.toHaveBeenCalled()
  })

  it('returns 400 when image count exceeds MAX_IMAGES', async () => {
    const images = Array.from({ length: testee.MAX_IMAGES + 1 }, (_, i) =>
      makeImage(`menu-${i}.jpg`, 1024)
    )

    const response = await testee.POST(makeRequest(images))

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({
      error: `Too many images: limit is ${testee.MAX_IMAGES}`,
    })
    expect(menuProcessor.processMenuImages).not.toHaveBeenCalled()
  })

  it('returns 400 when any image exceeds MAX_IMAGE_SIZE_BYTES', async () => {
    const big = makeImage('huge.jpg', testee.MAX_IMAGE_SIZE_BYTES + 1)
    const small = makeImage('ok.jpg', 1024)

    const response = await testee.POST(makeRequest([small, big]))

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toContain('huge.jpg')
    expect(body.error).toContain('5MB')
    expect(menuProcessor.processMenuImages).not.toHaveBeenCalled()
  })

  it('passes validated images to processMenuImages on success', async () => {
    const images = [makeImage('a.jpg', 1024), makeImage('b.jpg', 2048)]
    jest
      .mocked(menuProcessor.processMenuImages)
      .mockResolvedValue({ items: [] })

    const response = await testee.POST(makeRequest(images))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ items: [] })
    expect(menuProcessor.processMenuImages).toHaveBeenCalledWith(images)
  })

  it('returns 429 when the caller is rate-limited and skips processing', async () => {
    jest.mocked(rateLimit.checkRateLimit).mockResolvedValue({
      allowed: false,
      limit: 10,
      remaining: 0,
      retryAfterMs: 60_000,
    })

    const response = await testee.POST(makeRequest([makeImage('a.jpg', 1024)]))

    expect(response.status).toBe(429)
    expect(response.headers.get('Retry-After')).toBe('60')
    expect(response.headers.get('X-RateLimit-Limit')).toBe('10')
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('0')
    expect(menuProcessor.processMenuImages).not.toHaveBeenCalled()
  })

  it('returns 500 when processMenuImages throws', async () => {
    const images = [makeImage('a.jpg', 1024)]
    jest
      .mocked(menuProcessor.processMenuImages)
      .mockRejectedValue(new Error('boom'))
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    const response = await testee.POST(makeRequest(images))

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({
      error: 'Failed to process menu images',
    })
    errorSpy.mockRestore()
  })
})
