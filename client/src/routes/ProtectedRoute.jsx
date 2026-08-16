import { Navigate, useLocation } from 'react-router-dom'

export default function ProtectedRoute({ session, role, children }) {
  const location = useLocation()
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (role && session.role !== role) return <Navigate to={`/${session.role.toLowerCase()}/dashboard`} replace />
  return children
}
