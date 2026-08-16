export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.path}` })
}

export function errorHandler(error, req, res, next) {
  console.error(error)
  const status = error.statusCode || 500
  res.status(status).json({ message: status >= 500 ? 'Unable to complete this request. Please try again.' : error.message })
}
