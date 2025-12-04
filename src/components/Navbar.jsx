import { Link } from "react-router-dom"
import SearchBox from "./SearchBox"
import PropTypes from 'prop-types'
import logoRoots from '../assets/logo-roots.png'

export default function Navbar({ showSearchBox = true }) {
    return (
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
                    <Link to="/search" className="text-gray-700 transition-colors" onMouseEnter={(e) => e.target.style.color = '#009367'} onMouseLeave={(e) => e.target.style.color = '#374151'}>
                        Pesquisar
                    </Link>
                    <Link to="/blog" className="text-gray-700 transition-colors" onMouseEnter={(e) => e.target.style.color = '#009367'} onMouseLeave={(e) => e.target.style.color = '#374151'}>
                        Blog
                    </Link>
                </div>

                {/* Center - Search Box (when enabled) */}
                {showSearchBox && (
                    <div className="flex-1 max-w-md mx-8">
                        <SearchBox />
                    </div>
                )}

                {/* Right side - Login Button */}
                <div className="flex items-center space-x-4">
                    <Link
                        to="/login"
                        className="text-white font-medium px-6 py-2 rounded-full transition-colors"
                        style={{backgroundColor: '#009367'}}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#007a5a'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#009367'}
                    >
                        Login
                    </Link>

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
    )
}

Navbar.propTypes = {
    showSearchBox: PropTypes.bool,
};