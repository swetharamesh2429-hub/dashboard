const buckets = new Map()

export function rateLimit({ windowMs = 60_000, max = 10 } = {}) {
  return (req, res, next) => {
    const key = `${req.ip}:${req.path}`, now = Date.now()
    const bucket = buckets.get(key) || { count: 0, resetAt: now + windowMs }
    if (now > bucket.resetAt) { bucket.count = 0; bucket.resetAt = now + windowMs }
    bucket.count += 1
    buckets.set(key, bucket)
    if (bucket.count > max) return res.status(429).json({ message: 'Too many requests. Please try again shortly.' })
    next()
  }
}
