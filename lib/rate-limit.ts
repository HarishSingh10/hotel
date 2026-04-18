/**
 * Simple in-memory rate limiter for API routes.
 * For production with multiple instances, replace the Map with Redis.
 */

interface RateLimitEntry {
    count: number
    resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Clean up expired entries every 5 minutes
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        const now = Date.now()
        for (const [key, entry] of store.entries()) {
            if (entry.resetAt < now) store.delete(key)
        }
    }, 5 * 60 * 1000)
}

export interface RateLimitOptions {
    /** Max requests allowed in the window */
    limit: number
    /** Window duration in seconds */
    windowSec: number
}

export interface RateLimitResult {
    success: boolean
    remaining: number
    resetAt: number
}

/**
 * Check rate limit for a given key (e.g. IP address or user ID).
 */
export function rateLimit(key: string, opts: RateLimitOptions): RateLimitResult {
    const now = Date.now()
    const windowMs = opts.windowSec * 1000

    const entry = store.get(key)

    if (!entry || entry.resetAt < now) {
        // New window
        const newEntry: RateLimitEntry = { count: 1, resetAt: now + windowMs }
        store.set(key, newEntry)
        return { success: true, remaining: opts.limit - 1, resetAt: newEntry.resetAt }
    }

    if (entry.count >= opts.limit) {
        return { success: false, remaining: 0, resetAt: entry.resetAt }
    }

    entry.count++
    return { success: true, remaining: opts.limit - entry.count, resetAt: entry.resetAt }
}

/**
 * Get client IP from request headers (works behind proxies/Vercel).
 */
export function getClientIp(req: Request): string {
    const forwarded = req.headers.get('x-forwarded-for')
    if (forwarded) return forwarded.split(',')[0].trim()
    return req.headers.get('x-real-ip') ?? 'unknown'
}
