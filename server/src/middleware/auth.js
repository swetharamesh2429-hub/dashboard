import jwt from 'jsonwebtoken'

export function createAuth(jwtSecret) {
  return (roles = []) => (req, res, next) => {
    try {
      const token = (req.headers.authorization || '').replace('Bearer ', '')
      const user = jwt.verify(token, jwtSecret)
      if (roles.length && !roles.includes(user.role)) return res.status(403).json({ message: 'This account is not authorized for this portal.' })
      req.user = user
      next()
    } catch {
      return res.status(401).json({ message: 'Authentication required.' })
    }
  }
}
