// Simple in-memory rate limiter for server actions / API routes
// Note: In a real distributed production environment (e.g. Vercel edge), 
// this should be replaced with Upstash Redis or similar.

const rateLimitMap = new Map<string, { count: number; expiresAt: number }>();

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Checks if a given identifier (e.g., IP address or user ID) has exceeded the rate limit.
 * @param identifier Unique key (e.g. user ID, IP)
 * @param limit Max number of requests allowed in the window
 * @param windowMs Time window in milliseconds (default 60s)
 */
export async function checkRateLimit(
  identifier: string,
  limit: number = 10,
  windowMs: number = 60000
): Promise<RateLimitResult> {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || record.expiresAt < now) {
    // New or expired record
    rateLimitMap.set(identifier, {
      count: 1,
      expiresAt: now + windowMs,
    });
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: now + windowMs,
    };
  }

  if (record.count >= limit) {
    // Rate limit exceeded
    return {
      success: false,
      limit,
      remaining: 0,
      reset: record.expiresAt,
    };
  }

  // Increment existing record
  record.count += 1;
  return {
    success: true,
    limit,
    remaining: limit - record.count,
    reset: record.expiresAt,
  };
}

// Cleanup interval to prevent memory leak on long-running servers
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of rateLimitMap.entries()) {
      if (value.expiresAt < now) {
        rateLimitMap.delete(key);
      }
    }
  }, 60000); // Run cleanup every minute
}
