import apiClient from './apiClient'
import { API_ENDPOINTS } from '../constants/api'
import { STORAGE_KEYS } from '../constants/app'

const authService = {
  async login(credentials) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, {
        email: credentials.email,
        password: credentials.password,
        remember_me: credentials.rememberMe
      })

      if (response.data.access_token) {
        localStorage.setItem(STORAGE_KEYS.TOKEN, response.data.access_token)
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.data.user))
      }

      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Login failed')
    }
  },

  async logout() {
    try {
      await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT)
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem(STORAGE_KEYS.TOKEN)
      localStorage.removeItem(STORAGE_KEYS.USER)
    }
  },

  async getCurrentUser() {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
      if (!token) return null

      const response = await apiClient.get(API_ENDPOINTS.AUTH.ME)

      return response.data
    } catch (error) {
      console.error('Get current user error:', error)
      this.logout()
      return null
    }
  },

  getToken() {
    return localStorage.getItem(STORAGE_KEYS.TOKEN)
  },

  getUser() {
    const userStr = localStorage.getItem(STORAGE_KEYS.USER)
    return userStr ? JSON.parse(userStr) : null
  },

  isAuthenticated() {
    return !!this.getToken()
  }
}

export default authService