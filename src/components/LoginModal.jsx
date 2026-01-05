import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'

export default function LoginModal({ isOpen, onClose, onLogin, onRegister }) {
    const [isRegisterMode, setIsRegisterMode] = useState(false)
    const [isClosing, setIsClosing] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        rememberMe: false
    })
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [showPassword, setShowPassword] = useState(false)

    // Reset closing state when modal opens
    useEffect(() => {
        if (isOpen) {
            setIsClosing(false)
        }
    }, [isOpen])


    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }))
        setError('')
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')

        if (isRegisterMode && formData.password !== formData.confirmPassword) {
            setError('As palavras passe não coincidem')
            setIsLoading(false)
            return
        }

        try {
            if (isRegisterMode) {
                await onRegister(formData)
            } else {
                await onLogin(formData)
            }
            handleClose()
        } catch (error) {
            setError(error.message || (isRegisterMode ? 'Erro ao registar' : 'Erro ao fazer login'))
            setIsLoading(false)
        }
    }

    const handleForgotPassword = () => {
        alert('Funcionalidade de recuperação de palavra-passe em desenvolvimento')
    }

    const handleClose = () => {
        setIsClosing(true)
        setTimeout(() => {
            onClose()
            setIsClosing(false)
        }, 120)
    }

    const toggleMode = () => {
        setIsRegisterMode(!isRegisterMode)
        setFormData({
            name: '',
            email: '',
            password: '',
            confirmPassword: '',
            rememberMe: false
        })
        setError('')
        setShowPassword(false)
    }

    // Keep in DOM during animation, don't unmount
    if (!isOpen && !isClosing) return null

    return (
        <>
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes fadeOut {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
                @keyframes modalSlideIn {
                    from { opacity: 0; transform: scale(0.9) translateY(-20px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                @keyframes modalSlideOut {
                    from { opacity: 1; transform: scale(1) translateY(0); }
                    to { opacity: 0; transform: scale(0.9) translateY(-20px); }
                }
            `}</style>
            <div
                className="fixed inset-0 flex items-center justify-center z-50"
                style={{
                    animation: isClosing ? 'fadeOut 0.12s ease-out' : 'fadeIn 0.12s ease-out',
                    pointerEvents: isClosing ? 'none' : 'auto',
                    backdropFilter: 'blur(4px) brightness(1.05)',
                    backgroundColor: 'rgba(0, 0, 0, 0.1)'
                }}
                onClick={isClosing ? undefined : handleClose}
            >
            <div
                className="bg-white rounded-2xl p-8 w-full max-w-md mx-4 relative shadow-2xl border border-gray-200"
                style={{
                    animation: isClosing ? 'modalSlideOut 0.12s ease-out' : 'modalSlideIn 0.12s ease-out',
                    transformOrigin: 'center center',
                    willChange: 'transform, opacity'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={handleClose}
                    className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Title */}
                <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
                    {isRegisterMode ? 'Criar Conta' : 'Iniciar Sessão'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Name Field - only for register */}
                    {isRegisterMode && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nome
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                                style={{'--tw-ring-color': 'var(--color-primary)'}}
                                placeholder="Digite seu nome"
                                required
                            />
                        </div>
                    )}

                    {/* Email Field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            E-mail
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
                            placeholder="Digite seu e-mail"
                            required
                        />
                    </div>

                    {/* Password Field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Palavra Passe
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 pr-12"
                                    placeholder="Digite sua palavra-passe"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    {showPassword ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    )}
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Confirm Password Field - only for register */}
                    {isRegisterMode && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Confirmar Palavra Passe
                            </label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                                style={{'--tw-ring-color': 'var(--color-primary)'}}
                                placeholder="Confirme sua palavra-passe"
                                required
                            />
                        </div>
                    )}

                    {/* Remember Me Checkbox - only for login */}
                    {!isRegisterMode && (
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="rememberMe"
                            name="rememberMe"
                            checked={formData.rememberMe}
                            onChange={handleInputChange}
                            className="w-4 h-4 rounded border-gray-300 focus:ring-primary focus:ring-opacity-50"
                        />
                        <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-700">
                            Guardar credenciais
                        </label>
                    </div>
                    )}

                    {/* Forgot Password Link - only for login */}
                    {!isRegisterMode && (
                        <div className="text-center">
                            <button
                                type="button"
                                onClick={handleForgotPassword}
                                className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
                            >
                                Esqueci-me da palavra passe
                            </button>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="text-center text-sm text-red-600">
                            {error}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 bg-primary text-white font-medium rounded-full transition-all duration-200 hover:bg-primary/90 disabled:opacity-70"
                    >
                        {isLoading ? 'Aguarde...' : (isRegisterMode ? 'Criar Conta' : 'Iniciar Sessão')}
                    </button>
                </form>

                {/* Toggle between Login/Register */}
                <div className="text-center mt-6">
                    <button
                        onClick={toggleMode}
                        className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
                    >
                        {isRegisterMode ? 'Já tem conta? Clique aqui para entrar!' : 'Ainda não tem conta? Clique aqui!'}
                    </button>
                </div>
            </div>
            </div>
        </>
    )
}

LoginModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onLogin: PropTypes.func.isRequired,
    onRegister: PropTypes.func.isRequired
}