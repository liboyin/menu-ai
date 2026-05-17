import { NextRequest } from 'next/server';
import { RateLimiterMemory, RateLimiterRedis } from 'rate-limiter-flexible';
import * as testee from './rate-limit';

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    on: jest.fn(),
  }));
});

describe('createLimiter', () => {
  beforeEach(() => {
    delete process.env.REDIS_URL;
    testee.resetLimiterForTests();
  });

  it('returns a Memory limiter when REDIS_URL is unset', () => {
    const limiter = testee.createLimiter();
    expect(limiter).toBeInstanceOf(RateLimiterMemory);
  });

  it('returns a Redis limiter when REDIS_URL is set', () => {
    process.env.REDIS_URL = 'redis://localhost:6379';
    const limiter = testee.createLimiter();
    expect(limiter).toBeInstanceOf(RateLimiterRedis);
  });
});

describe('getClientIp', () => {
  function makeRequest(headers: Record<string, string>): NextRequest {
    return {
      headers: {
        get: (name: string) => headers[name.toLowerCase()] ?? null,
      },
    } as unknown as NextRequest;
  }

  it('returns the first entry from x-forwarded-for', () => {
    const req = makeRequest({ 'x-forwarded-for': '203.0.113.5, 10.0.0.1' });
    expect(testee.getClientIp(req)).toBe('203.0.113.5');
  });

  it('falls back to x-real-ip when x-forwarded-for is absent', () => {
    const req = makeRequest({ 'x-real-ip': '198.51.100.7' });
    expect(testee.getClientIp(req)).toBe('198.51.100.7');
  });

  it('returns "unknown" when no IP headers are present', () => {
    const req = makeRequest({});
    expect(testee.getClientIp(req)).toBe('unknown');
  });

  it('skips an empty x-forwarded-for and falls back to x-real-ip', () => {
    const req = makeRequest({
      'x-forwarded-for': '   ',
      'x-real-ip': '198.51.100.9',
    });
    expect(testee.getClientIp(req)).toBe('198.51.100.9');
  });
});

describe('checkRateLimit', () => {
  beforeEach(() => {
    delete process.env.REDIS_URL;
    testee.resetLimiterForTests();
  });

  it('allows requests under the limit and decrements remaining', async () => {
    const first = await testee.checkRateLimit('ip-a');
    const second = await testee.checkRateLimit('ip-a');

    expect(first.allowed).toBe(true);
    expect(first.limit).toBe(10);
    expect(first.remaining).toBe(9);
    expect(first.retryAfterMs).toBe(0);

    expect(second.allowed).toBe(true);
    expect(second.remaining).toBe(8);
  });

  it('blocks requests after the limit is exhausted and reports retryAfter', async () => {
    for (let i = 0; i < 10; i++) {
      await testee.checkRateLimit('ip-b');
    }
    const blocked = await testee.checkRateLimit('ip-b');

    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
  });

  it('keys separate IPs into independent buckets', async () => {
    for (let i = 0; i < 10; i++) {
      await testee.checkRateLimit('ip-c');
    }
    const otherIp = await testee.checkRateLimit('ip-d');

    expect(otherIp.allowed).toBe(true);
    expect(otherIp.remaining).toBe(9);
  });

  it('fails open when the limiter throws a non-RateLimiterRes error', async () => {
    const fakeLimiter = {
      consume: jest.fn().mockRejectedValue(new Error('redis down')),
    };
    testee.setLimiterForTests(fakeLimiter as unknown as RateLimiterMemory);
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const result = await testee.checkRateLimit('ip-e');

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(10);
    expect(fakeLimiter.consume).toHaveBeenCalledWith('ip-e');
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
