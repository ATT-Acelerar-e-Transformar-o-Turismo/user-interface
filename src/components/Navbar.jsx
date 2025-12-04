import { Link } from "react-router-dom"
import { useState, useRef, useEffect } from "react"
import SearchBox from "./SearchBox"
import LoginModal from "./LoginModal"
import PropTypes from 'prop-types'
import logoRoots from '../assets/logo-roots.png'
import { useAuth } from '../contexts/AuthContext'

export default function Navbar({ showSearchBox = true }) {
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
    const [isSearchActive, setIsSearchActive] = useState(false)
    const { user, isAuthenticated, login, logout } = useAuth()
    const searchBoxRef = useRef(null)

    // Auto-focus search box when activated
    useEffect(() => {
        if (isSearchActive && searchBoxRef.current) {
            // Small delay to ensure DOM is updated
            setTimeout(() => {
                searchBoxRef.current.focus()
            }, 100)
        }
    }, [isSearchActive])

    const handleLogin = async (formData) => {
        await login(formData);
        setIsLoginModalOpen(false);
    }

    const toggleSearch = () => {
        setIsSearchActive(!isSearchActive)
    }
    return (
        <>
            <nav className="bg-white border-b border-gray-100 px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    {/* Left side - Logo */}
                    <div className="flex items-center">
                        <Link to="/" className="block">
                            <img src={logoRoots} alt="ROOTS" className="h-8 w-auto" />
                        </Link>
                    </div>

                    {/* Center - Navigation Menu */}
                    <div className="hidden md:flex items-center space-x-8">
                        <Link to="/about" className="text-gray-700 transition-colors" style={{'--hover-color': '#009367'}} onMouseEnter={(e) => e.target.style.color = '#009367'} onMouseLeave={(e) => e.target.style.color = '#374151'}>
                            Quem Somos
                        </Link>
                        <Link to="/domains" className="text-gray-700 transition-colors" onMouseEnter={(e) => e.target.style.color = '#009367'} onMouseLeave={(e) => e.target.style.color = '#374151'}>
                            Indicadores
                        </Link>
                        {!isSearchActive && (
                            <button onClick={toggleSearch} className="text-gray-700 transition-colors" onMouseEnter={(e) => e.target.style.color = '#009367'} onMouseLeave={(e) => e.target.style.color = '#374151'}>
                                Pesquisar
                            </button>
                        )}
                        <Link to="/blog" className="text-gray-700 transition-colors" onMouseEnter={(e) => e.target.style.color = '#009367'} onMouseLeave={(e) => e.target.style.color = '#374151'}>
                            Blog
                        </Link>
                        {isAuthenticated && user?.role === 'admin' && (
                            <div className="relative">
                                <details className="dropdown">
                                    <summary className="btn btn-ghost text-gray-700 transition-colors hover:text-gray-700 hover:bg-transparent border-none shadow-none p-0 h-auto min-h-0 font-normal" onMouseEnter={(e) => e.target.style.color = '#009367'} onMouseLeave={(e) => e.target.style.color = '#374151'}>
                                        Admin
                                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </summary>
                                    <ul className="dropdown-content menu bg-white rounded-box z-50 w-52 p-2 shadow-lg border border-gray-200 mt-1">
                                        <li>
                                            <Link to="/indicators-management" className="text-gray-700 hover:bg-gray-50">
                                                Gestão de Indicadores
                                            </Link>
                                        </li>
                                        <li>
                                            <Link to="/admin/blog" className="text-gray-700 hover:bg-gray-50">
                                                Gestão de Blog
                                            </Link>
                                        </li>
                                        <li>
                                            <Link to="/favorites" className="text-gray-700 hover:bg-gray-50">
                                                Favoritos
                                            </Link>
                                        </li>
                                    </ul>
                                </details>
                            </div>
                        )}
                    </div>

                    {/* Center - Search Box (when search is active) */}
                    {showSearchBox && isSearchActive && (
                        <div className="flex-1 max-w-md mx-8 flex items-center space-x-2">
                            <SearchBox ref={searchBoxRef} />
                            <button onClick={toggleSearch} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    )}

                    {/* Right side - User Actions */}
                    <div className="flex items-center space-x-4">
                        {isAuthenticated ? (
                            <div className="flex items-center space-x-3">
                                <span className="text-gray-700 text-sm">
                                    Olá, {user?.full_name || user?.email}
                                </span>
                                <button
                                    onClick={logout}
                                    className="text-gray-600 hover:text-gray-800 font-medium px-4 py-2 rounded-full border border-gray-300 hover:border-gray-400 transition-colors"
                                >
                                    Sair
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsLoginModalOpen(true)}
                                className="text-white font-medium px-6 py-2 rounded-full transition-colors"
                                style={{backgroundColor: '#009367'}}
                                onMouseEnter={(e) => e.target.style.backgroundColor = '#007a5a'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = '#009367'}
                            >
                                Login
                            </button>
                        )}

                        {/* Mobile menu button */}
                        <div className="md:hidden">
                            <details className="dropdown dropdown-end">
                                <summary className="btn btn-ghost">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                </summary>
                                <ul className="dropdown-content menu bg-white rounded-box z-10 w-52 p-2 shadow-lg border">
                                    <li><Link to="/about" className="text-gray-700">Quem Somos</Link></li>
                                    <li><Link to="/domains" className="text-gray-700">Indicadores</Link></li>
                                    <li><Link to="/search" className="text-gray-700">Pesquisar</Link></li>
                                    <li><Link to="/blog" className="text-gray-700">Blog</Link></li>
                                    <div className="divider my-2"></div>
                                    <li><Link to="/indicators-management" className="text-gray-700">Admin - Indicadores</Link></li>
                                    <li><Link to="/admin/blog" className="text-gray-700">Admin - Blog</Link></li>
                                    <li><Link to="/favorites" className="text-gray-700">Favoritos</Link></li>
                                </ul>
                            </details>
                        </div>
                    </div>
                </div>
            </nav>

            <LoginModal
                isOpen={isLoginModalOpen}
                onClose={() => setIsLoginModalOpen(false)}
                onLogin={handleLogin}
            />
        </>
    )
}

Navbar.propTypes = {
    showSearchBox: PropTypes.bool,
};