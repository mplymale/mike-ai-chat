// /api/_rateLimiter.js
// In-memory rate limiter — works within warm Vercel instances.
// Good enough protection for a personal portfolio site.

const requests = new Map();

const WINDOW_MS    = 60 * 1000; // 1 minute window
const MAX_REQUESTS = 20;        // max requests per IP per window

export function isRateLimited(ip) {
  const now   = Date.now();
  const entry = requests.get(ip);

  // New IP or expired window — reset
  if (!entry || now > entry.resetTime) {
    requests.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return false;
  }

  // Over limit
  if (entry.count >= MAX_REQUESTS) {
    return true;
  }

  entry.count++;
  return false;
}

// Clean up expired entries to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of requests.entries()) {
    if (now > entry.resetTime) requests.delete(ip);
  }
}, WINDOW_MS);
