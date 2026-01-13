import apiClient from './apiClient'

const authService = {
  async login(credentials) {
    try {
      const response = await apiClient.post('/api/auth/login', {
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
      await apiClient.post('/api/auth/logout')
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

      const response = await apiClient.get('/api/auth/me')

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