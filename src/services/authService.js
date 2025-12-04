import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const authService = {
  async login(credentials) {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/users/auth/login`, {
        email: credentials.email,
        password: credentials.password,
        remember_me: credentials.rememberMe
      })

      if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token)
        localStorage.setItem('user', JSON.stringify(response.data.user))
      }

      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Login failed')
    }
  },

  async logout() {
    try {
      await axios.post(`${API_BASE_URL}/api/users/auth/logout`)
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  },

  async getCurrentUser() {
    try {
      const token = localStorage.getItem('token')
      if (!token) return null

      const response = await axios.get(`${API_BASE_URL}/api/users/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      return response.data
    } catch (error) {
      console.error('Get current user error:', error)
      this.logout()
      return null
    }
  },

  getToken() {
    return localStorage.getItem('token')
  },

  getUser() {
    const userStr = localStorage.getItem('user')
    return userStr ? JSON.parse(userStr) : null
  },

  isAuthenticated() {
    return !!this.getToken()
  }
}

export default authService