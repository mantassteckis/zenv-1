import { RateLimiterMemory } from 'rate-limiter-flexible';
import { NextRequest, NextResponse } from 'next/server';

// Rate limiter configurations for different endpoints
const rateLimiters = {
  // General API endpoints - 100 requests per minute
  general: new RateLimiterMemory({
    points: 100, // Number of requests
    duration: 60, // Per 60 seconds
    blockDuration: 60, // Block for 60 seconds if limit exceeded
  }),
  
  // AI test generation - more restrictive (10 requests per minute)
  aiGeneration: new RateLimiterMemory({
    points: 10,
    duration: 60,
    blockDuration: 120, // Block for 2 minutes
  }),
  
  // Test submission - moderate limits (30 requests per minute)
  testSubmission: new RateLimiterMemory({
    points: 30,
    duration: 60,
    blockDuration: 60,
  }),
  
  // Authentication endpoints - strict limits (5 requests per minute)
  auth: new RateLimiterMemory({
    points: 5,
    duration: 60,
    blockDuration: 300, // Block for 5 minutes
  }),
};

export type RateLimiterType = keyof typeof rateLimiters;

/**
 * Rate limiting middleware for Next.js API routes
 * @param limiterType - Type of rate limiter to use
 * @param identifier - Unique identifier for rate limiting (IP, user ID, etc.)
 * @returns Promise that resolves if request is allowed, rejects if rate limited
 */
export async function checkRateLimit(
  limiterType: RateLimiterType,
  identifier: string
): Promise<void> {
  const limiter = rateLimiters[limiterType];
  
  try {
    await limiter.consume(identifier);
  } catch (rateLimiterRes: any) {
    // Rate limit exceeded
    const secs = Math.round(rateLimiterRes.msBeforeNext / 1000) || 1;
    throw new Error(`Rate limit exceeded. Try again in ${secs} seconds.`);
  }
}

/**
 * Get client identifier from request (IP address or user ID)
 * @param req - Next.js request object
 * @param userId - Optional user ID for authenticated requests
 * @returns Unique identifier for rate limiting
 */
export function getClientIdentifier(req: NextRequest, userId?: string): string {
  if (userId) {
    return `user:${userId}`;
  }
  
  // Get IP address from various headers
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIp || req.ip || 'unknown';
  
  return `ip:${ip}`;
}

/**
 * Rate limiting middleware wrapper for API routes
 * @param limiterType - Type of rate limiter to use
 * @param handler - API route handler function
 * @returns Wrapped handler with rate limiting
 */
export function withRateLimit<T extends any[]>(
  limiterType: RateLimiterType,
  handler: (req: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (req: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      // Extract user ID from Authorization header if present
      let userId: string | undefined;
      const authHeader = req.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        // In a real implementation, you'd decode the JWT token here
        // For now, we'll use IP-based rate limiting
        userId = undefined;
      }
      
      const identifier = getClientIdentifier(req, userId);
      await checkRateLimit(limiterType, identifier);
      
      // Rate limit passed, proceed with the original handler
      return handler(req, ...args);
    } catch (error) {
      // Rate limit exceeded
      const message = error instanceof Error ? error.message : 'Rate limit exceeded';
      
      return NextResponse.json(
        { 
          error: 'Too Many Requests',
          message,
          code: 'RATE_LIMIT_EXCEEDED'
        },
        { 
          status: 429,
          headers: {
            'Retry-After': '60', // Default retry after 60 seconds
            'X-RateLimit-Limit': String(rateLimiters[limiterType].points),
            'X-RateLimit-Remaining': '0',
          }
        }
      );
    }
  };
}

/**
 * Get rate limit info for a client without consuming points
 * @param limiterType - Type of rate limiter
 * @param identifier - Client identifier
 * @returns Rate limit information
 */
export async function getRateLimitInfo(
  limiterType: RateLimiterType,
  identifier: string
): Promise<{
  limit: number;
  remaining: number;
  resetTime: number;
}> {
  const limiter = rateLimiters[limiterType];
  
  try {
    const res = await limiter.get(identifier);
    const remaining = Math.max(0, limiter.points - (res?.hitCount || 0));
    const resetTime = res?.msBeforeNext ? Date.now() + res.msBeforeNext : Date.now();
    
    return {
      limit: limiter.points,
      remaining,
      resetTime,
    };
  } catch (error) {
    // If no record exists, return full limit
    return {
      limit: limiter.points,
      remaining: limiter.points,
      resetTime: Date.now() + (limiter.duration * 1000),
    };
  }
}