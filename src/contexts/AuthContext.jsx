import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import PropTypes from 'prop-types'
import keycloak, { initKeycloak, storeTokens, clearStoredTokens } from '../keycloak'

const AuthContext = createContext(null)

function parseJwt(token) {
  const base64Url = token.split('.')[1]
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
  return JSON.parse(atob(base64))
}

export function AuthProvider({ children }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => {
    initKeycloak()
      .then((auth) => {
        if (auth) {
          storeTokens(keycloak.token, keycloak.refreshToken, keycloak.idToken)
        }
        setAuthenticated(auth)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Keycloak init failed:', err)
        clearStoredTokens()
        setError('Authentication service unavailable')
        setLoading(false)
      })

    keycloak.onTokenExpired = () => {
      keycloak.updateToken(30)
        .then(() => {
          storeTokens(keycloak.token, keycloak.refreshToken, keycloak.idToken)
        })
        .catch(() => {
          clearStoredTokens()
          keycloak.logout({ redirectUri: window.location.origin })
        })
    }

    keycloak.onAuthRefreshSuccess = () => {
      storeTokens(keycloak.token, keycloak.refreshToken, keycloak.idToken)
    }
  }, [])

  const user = authenticated ? {
    id: keycloak.subject,
    email: keycloak.tokenParsed?.email,
    full_name: keycloak.tokenParsed?.name || '',
    role: keycloak.tokenParsed?.realm_access?.roles?.includes('admin') ? 'admin' : 'user',
  } : null

  const login = useCallback(() => {
    window.location.href = '/admin/login'
  }, [])

  const loginWithCredentials = useCallback(async (email, password) => {
    const params = new URLSearchParams({
      grant_type: 'password',
      client_id: 'att-frontend',
      username: email,
      password: password,
    })

    const response = await fetch('/auth/realms/att/protocol/openid-connect/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    })

    if (!response.ok) {
      throw new Error('Invalid credentials')
    }

    const data = await response.json()

    // Hydrate keycloak-js instance with the obtained tokens
    keycloak.token = data.access_token
    keycloak.refreshToken = data.refresh_token
    keycloak.idToken = data.id_token
    keycloak.tokenParsed = parseJwt(data.access_token)
    keycloak.idTokenParsed = data.id_token ? parseJwt(data.id_token) : null
    keycloak.authenticated = true
    keycloak.subject = keycloak.tokenParsed.sub

    storeTokens(data.access_token, data.refresh_token, data.id_token)
    setAuthenticated(true)
  }, [])

  const logout = useCallback(() => {
    clearStoredTokens()
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
    loginWithCredentials,
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
