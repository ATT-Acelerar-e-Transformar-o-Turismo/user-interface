import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import logoRoots from '../assets/green-logo.svg'
import loginBg from '../assets/admin-login-bg.jpg'

export default function AdminLogin() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { loginWithCredentials, isAuthenticated, user, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && isAuthenticated && user?.role === 'admin') {
      navigate('/admin', { replace: true })
    }
  }, [loading, isAuthenticated, user, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      await loginWithCredentials(username, password)
      // loginWithCredentials triggers a full page reload to /admin
    } catch {
      setError('Credenciais inválidas. Tente novamente.')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#009368] p-6 md:p-12 flex items-center justify-center">
      <div className="bg-base-100 rounded-xl flex w-full max-w-[1400px] min-h-[600px] lg:min-h-[700px] overflow-hidden">
        {/* Left — background image */}
        <div className="hidden lg:block lg:w-1/2 xl:w-[55%] relative">
          <img
            src={loginBg}
            alt=""
            className="absolute inset-0 w-full h-full object-cover rounded-l-xl"
          />
        </div>

        {/* Right — login form */}
        <div className="flex-1 flex items-center justify-center p-8 md:p-12">
          <div className="w-full max-w-[382px] flex flex-col items-center gap-7">
            {/* Logo */}
            <img src={logoRoots} alt="ROOTS" className="w-[240px]" />

            {/* Subtitle */}
            <p className="text-center text-[17px] font-medium leading-[21px] tracking-[0.085px] text-base-content">
              Insira as suas credenciais para aceder à plataforma de administração
            </p>

            {/* Form */}
            <form onSubmit={handleSubmit} className="w-full flex flex-col gap-12">
              <div className="flex flex-col gap-6">
                {/* Email field */}
                <div className="flex flex-col gap-4">
                  <label htmlFor="admin-username" className="text-[17px] font-medium leading-[21px] tracking-[0.085px] text-base-content">
                    E-mail:
                  </label>
                  <input
                    id="admin-username"
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Insira o seu e-mail ou nome de utilizador"
                    required
                    className="w-full h-11 px-5 rounded-full border border-base-300 bg-white text-[15px] placeholder:text-gray-400 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] focus:outline-none focus:border-[#009368] transition-colors"
                  />
                </div>

                {/* Password field */}
                <div className="flex flex-col gap-4">
                  <label htmlFor="admin-password" className="text-[17px] font-medium leading-[21px] tracking-[0.085px] text-base-content">
                    Palavra-passe:
                  </label>
                  <input
                    id="admin-password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Insira a sua palavra-passe"
                    required
                    className="w-full h-11 px-5 rounded-full border border-base-300 bg-white text-[15px] placeholder:text-gray-400 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] focus:outline-none focus:border-[#009368] transition-colors"
                  />
                </div>
              </div>

              {/* Error message */}
              {error && (
                <p role="alert" className="text-error text-sm text-center -mt-6">{error}</p>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full h-11 rounded-full bg-[#009368] hover:bg-[#007a56] text-white font-medium text-[17px] tracking-[0.087px] cursor-pointer transition-colors disabled:opacity-60"
              >
                {submitting ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  'Iniciar sessão'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
