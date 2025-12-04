import { createContext, useContext, useReducer, useEffect } from 'react'
import PropTypes from 'prop-types'
import authService from '../services/authService'

const AuthContext = createContext(null)

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        loading: true,
        error: null
      }
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        loading: false,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        error: null
      }
    case 'LOGIN_FAILURE':
      return {
        ...state,
        loading: false,
        user: null,
        token: null,
        isAuthenticated: false,
        error: action.payload
      }
    case 'LOGOUT':
      return {
        ...state,
        loading: false,
        user: null,
        token: null,
        isAuthenticated: false,
        error: null
      }
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        token: authService.getToken()
      }
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      }
    default:
      return state
  }
}

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  useEffect(() => {
    // Check if user is already logged in on app start
    const token = authService.getToken()
    const user = authService.getUser()

    if (token && user) {
      dispatch({ type: 'SET_USER', payload: user })
    }
  }, [])

  const login = async (credentials) => {
    dispatch({ type: 'LOGIN_START' })

    try {
      const response = await authService.login(credentials)

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: response.user,
          token: response.access_token
        }
      })

      return response
    } catch (error) {
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: error.message
      })
      throw error
    }
  }

  const logout = async () => {
    try {
      await authService.logout()
    } catch (error) {
      console.error('Logout error:', error)
    }

    dispatch({ type: 'LOGOUT' })
  }

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' })
  }

  const value = {
    ...state,
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