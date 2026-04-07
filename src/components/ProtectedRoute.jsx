import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import keycloak from '../keycloak'

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, user, loading } = useAuth()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      keycloak.login()
    }
  }, [loading, isAuthenticated])

  if (loading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    )
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return children
}
