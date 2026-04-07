import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import keycloak from '../keycloak'

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    )
  }

  if (!isAuthenticated) {
    keycloak.login()
    return null
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return children
}
