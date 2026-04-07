import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import PropTypes from 'prop-types'
import keycloak, { initKeycloak, storeTokens, clearStoredTokens } from '../keycloak'

const AuthContext = createContext(null)

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

  const loginWithCredentials = useCallback(async (username, password) => {
    const tokenUrl = `${keycloak.authServerUrl}/realms/${keycloak.realm}/protocol/openid-connect/token`
    const params = new URLSearchParams({
      grant_type: 'password',
      client_id: keycloak.clientId,
      username,
      password,
    })

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    })

    if (!response.ok) {
      throw new Error('Invalid credentials')
    }

    const data = await response.json()

    // Persist tokens and let initKeycloak() rehydrate properly on reload
    storeTokens(data.access_token, data.refresh_token, data.id_token)
    window.location.href = '/admin'
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
