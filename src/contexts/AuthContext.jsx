import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import PropTypes from 'prop-types'
import keycloak, { initKeycloak } from '../keycloak'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => {
    initKeycloak()
      .then((auth) => {
        setAuthenticated(auth)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Keycloak init failed:', err)
        setError('Authentication service unavailable')
        setLoading(false)
      })

    keycloak.onTokenExpired = () => {
      keycloak.updateToken(30).catch(() => {
        keycloak.logout()
      })
    }
  }, [])

  const user = authenticated ? {
    id: keycloak.subject,
    email: keycloak.tokenParsed?.email,
    full_name: keycloak.tokenParsed?.name || '',
    role: keycloak.tokenParsed?.realm_access?.roles?.includes('admin') ? 'admin' : 'user',
  } : null

  const login = useCallback(() => {
    keycloak.login()
  }, [])

  const logout = useCallback(() => {
    keycloak.logout({ redirectUri: window.location.origin })
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const value = {
    user,
    token: keycloak.token || null,
    isAuthenticated: authenticated,
    loading,
    error,
    login,
    logout,
    clearError
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
