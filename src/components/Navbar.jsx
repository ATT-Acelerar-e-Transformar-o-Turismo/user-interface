import { Link, useNavigate, useLocation } from "react-router-dom"
import { useState, useRef, useEffect } from "react"
import PropTypes from 'prop-types'
import logoRoots from '../assets/logo-roots.png'
import indicatorService from '../services/indicatorService'
import { highlightSearchTerms } from '../services/searchUtils'
import LoginModal from './LoginModal'
import { useAuth } from '../contexts/AuthContext'

export default function Navbar({ showSearchBox = false }) {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [recentItems, setRecentItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

    const searchInputRef = useRef(null);
    const dropdownRef = useRef(null);
    const itemRefs = useRef([]);
    const navigate = useNavigate();
    const location = useLocation();
    const { user, isAuthenticated, login, logout } = useAuth();

    // Close search when location changes (user navigates)
    useEffect(() => {
        setIsSearchOpen(false);
        setSearchQuery('');
        setShowDropdown(false);
        setSelectedIndex(-1);
    }, [location.pathname]);

    const toggleSearch = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsSearchOpen(!isSearchOpen);
        if (!isSearchOpen) {
            setSearchQuery('');
            setShowDropdown(false);
            setSelectedIndex(-1);
        } else {
            setShowDropdown(true);
        }
    };

    const handleLogin = async (formData) => {
        await login(formData);
        setIsLoginModalOpen(false);
    };

    // Load recent items from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('recentItems');
        if (saved) {
            try {
                setRecentItems(JSON.parse(saved));
            } catch (e) {
                console.error('Error loading recent items:', e);
            }
        }
    }, []);

    // Focus the search input when it opens
    useEffect(() => {
        if (isSearchOpen && searchInputRef.current) {
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 100);
        }
    }, [isSearchOpen]);

    // Debounced search for suggestions
    useEffect(() => {
        if (searchQuery.trim().length < 2) {
            setSuggestions([]);
            setSelectedIndex(-1);
            itemRefs.current = [];
            return;
        }

        const timeoutId = setTimeout(async () => {
            try {
                setLoading(true);
                const results = await indicatorService.search(searchQuery.trim(), 6);
                setSuggestions(results);
                setSelectedIndex(-1);
                itemRefs.current = [];
            } catch (error) {
                console.error('Search error:', error);
                setSuggestions([]);
                setSelectedIndex(-1);
                itemRefs.current = [];
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    const saveRecentItem = (item) => {
        if (!item) return;

        let newItem;
        if (typeof item === 'string') {
            newItem = {
                type: 'search',
                value: item.trim(),
                timestamp: Date.now()
            };
        } else {
            newItem = {
                type: 'indicator',
                value: {
                    id: item.id,
                    name: item.name,
                    subdomain: item.subdomain,
                    domain: item.domain
                },
                timestamp: Date.now()
            };
        }

        const filtered = recentItems.filter(existingItem => {
            if (existingItem.type !== newItem.type) return true;
            if (newItem.type === 'search') {
                return existingItem.value !== newItem.value;
            } else {
                return existingItem.value.id !== newItem.value.id;
            }
        });

        const updated = [newItem, ...filtered].slice(0, 8);
        setRecentItems(updated);
        localStorage.setItem('recentItems', JSON.stringify(updated));
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            saveRecentItem(searchQuery);
            navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
            setIsSearchOpen(false);
            setSearchQuery('');
            setShowDropdown(false);
        }
    };

    const handleSuggestionClick = (indicator) => {
        saveRecentItem(indicator);
        navigate(`/indicator/${indicator.id}`);
        setIsSearchOpen(false);
        setSearchQuery('');
        setShowDropdown(false);
    };

    const handleRecentItemClick = (recentItem) => {
        if (recentItem.type === 'search') {
            setSearchQuery(recentItem.value);
            saveRecentItem(recentItem.value);
            navigate(`/search?q=${encodeURIComponent(recentItem.value)}`);
        } else if (recentItem.type === 'indicator') {
            navigate(`/indicator/${recentItem.value.id}`);
        }
        setIsSearchOpen(false);
        setSearchQuery('');
        setShowDropdown(false);
    };

    const scrollToSelectedItem = (index) => {
        if (index >= 0 && itemRefs.current[index] && dropdownRef.current) {
            const selectedElement = itemRefs.current[index];
            const container = dropdownRef.current;

            const elementTop = selectedElement.offsetTop;
            const elementBottom = elementTop + selectedElement.offsetHeight;
            const containerTop = container.scrollTop;
            const containerBottom = containerTop + container.clientHeight;

            if (elementTop < containerTop) {
                container.scrollTop = elementTop;
            } else if (elementBottom > containerBottom) {
                container.scrollTop = elementBottom - container.clientHeight;
            }
        }
    };

    const handleKeyDown = (e) => {
        const currentItems = searchQuery.trim().length >= 2 ? suggestions : recentItems;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            const newIndex = selectedIndex < currentItems.length - 1 ? selectedIndex + 1 : selectedIndex;
            setSelectedIndex(newIndex);
            scrollToSelectedItem(newIndex);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const newIndex = selectedIndex > 0 ? selectedIndex - 1 : -1;
            setSelectedIndex(newIndex);
            scrollToSelectedItem(newIndex);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedIndex >= 0 && selectedIndex < currentItems.length) {
                const selectedItem = currentItems[selectedIndex];
                if (searchQuery.trim().length >= 2) {
                    handleSuggestionClick(selectedItem);
                } else {
                    handleRecentItemClick(selectedItem);
                }
            } else {
                handleSearch(e);
            }
        } else if (e.key === 'Escape') {
            setIsSearchOpen(false);
            setSearchQuery('');
            setShowDropdown(false);
        }
    };

    const clearRecentItems = () => {
        setRecentItems([]);
        localStorage.removeItem('recentItems');
    };

    return (
        <>
            <nav className="bg-white px-6 py-4">
                <div className="max-w-7xl mx-auto">
                    {/* Pill-style container matching Figma design */}
                    <div style={{backgroundColor: 'var(--color-surface)'}} className="rounded-[50px] py-2 px-8 flex items-center justify-between">
                        {/* Left side - Logo */}
                        <div className="flex items-center">
                            <Link to="/" className="block">
                                <img src={logoRoots} alt="ROOTS" className="h-11 w-auto" />
                            </Link>
                        </div>

                        {/* Center - Navigation Menu with integrated search */}
                        <div className="hidden md:flex items-center gap-12">
                            <Link
                                to="/about"
                                className={`font-['Onest',sans-serif] text-base transition-colors whitespace-nowrap px-8 py-3.5 rounded-full ${
                                    location.pathname === '/about'
                                        ? 'bg-primary text-primary-content'
                                        : 'text-black hover:text-primary'
                                }`}
                            >
                                Quem Somos
                            </Link>
                            <Link
                                to="/domains"
                                className={`font-['Onest',sans-serif] text-base transition-colors whitespace-nowrap px-8 py-3.5 rounded-full ${
                                    location.pathname === '/domains' || location.pathname.startsWith('/indicator') || location.pathname.startsWith('/search')
                                        ? 'bg-primary text-primary-content'
                                        : 'text-black hover:text-primary'
                                }`}
                            >
                                Indicadores
                            </Link>

                            {/* Search Button or Search Bar */}
                            {!isSearchOpen ? (
                                <button
                                    onClick={toggleSearch}
                                    className="text-black font-['Onest',sans-serif]  text-base transition-colors hover:text-primary whitespace-nowrap px-8 py-3.5 rounded-full"
                                >
                                    Pesquisar
                                </button>
                            ) : (
                                <div className="relative">
                                    <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm animate-in fade-in zoom-in-95 duration-200">
                                        <svg
                                            className="w-4 h-4 text-gray-400 cursor-pointer"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                            onClick={handleSearch}
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                        <input
                                            ref={searchInputRef}
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            onFocus={() => setShowDropdown(true)}
                                            placeholder="Pesquisar indicadores..."
                                            className="bg-transparent outline-none text-sm w-48 placeholder:text-gray-400 text-black font-['Onest',sans-serif]"
                                        />
                                        {searchQuery && (
                                            <button
                                                onClick={() => setSearchQuery('')}
                                                className="text-gray-400 hover:text-gray-600 transition-colors"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        )}
                                        <button
                                            onClick={toggleSearch}
                                            className="text-gray-400 hover:text-gray-600 transition-colors ml-1"
                                            aria-label="Fechar pesquisa"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>

                                    {/* Autocomplete Dropdown */}
                                    {showDropdown && (
                                        <div
                                            ref={dropdownRef}
                                            className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto"
                                        >
                                            {searchQuery.trim().length >= 2 ? (
                                                // Show search suggestions
                                                <>
                                                    {loading ? (
                                                        <div className="flex items-center justify-center py-4">
                                                            <span className="loading loading-spinner loading-sm"></span>
                                                        </div>
                                                    ) : suggestions.length > 0 ? (
                                                        <>
                                                            {suggestions.map((indicator, index) => (
                                                                <div
                                                                    key={indicator.id}
                                                                    ref={(el) => itemRefs.current[index] = el}
                                                                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                                                                        selectedIndex === index ? 'bg-gray-100' : 'hover:bg-gray-50'
                                                                    }`}
                                                                    onClick={() => handleSuggestionClick(indicator)}
                                                                    onMouseEnter={() => setSelectedIndex(index)}
                                                                >
                                                                    <i
                                                                        className="fas fa-chart-line text-sm"
                                                                        style={{ color: indicator.domain?.color || 'var(--color-primary)' }}
                                                                    ></i>
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="font-medium text-sm truncate">
                                                                            {highlightSearchTerms(indicator.name, searchQuery)}
                                                                        </div>
                                                                        {indicator.subdomain && (
                                                                            <div className="text-xs text-gray-500 truncate">
                                                                                {highlightSearchTerms(indicator.subdomain, searchQuery)}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </>
                                                    ) : (
                                                        <div className="text-center py-4 text-gray-500 text-sm">
                                                            Nenhum indicador encontrado
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                // Show recent items
                                                <>
                                                    {recentItems.length > 0 && (
                                                        <div className="flex justify-end py-2 px-4">
                                                            <button
                                                                onClick={clearRecentItems}
                                                                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                                                            >
                                                                Limpar
                                                            </button>
                                                        </div>
                                                    )}
                                                    {recentItems.length > 0 ? (
                                                        <>
                                                            {recentItems.map((item, index) => (
                                                                <div
                                                                    key={`${item.type}-${item.timestamp}-${index}`}
                                                                    ref={(el) => itemRefs.current[index] = el}
                                                                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                                                                        selectedIndex === index ? 'bg-gray-100' : 'hover:bg-gray-50'
                                                                    }`}
                                                                    onClick={() => handleRecentItemClick(item)}
                                                                    onMouseEnter={() => setSelectedIndex(index)}
                                                                >
                                                                    {item.type === 'search' ? (
                                                                        <>
                                                                            <i className="fas fa-history text-gray-400 text-sm"></i>
                                                                            <span className="text-sm">{item.value}</span>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <i
                                                                                className="fas fa-chart-line text-sm"
                                                                                style={{ color: item.value.domain?.color || 'var(--color-primary)' }}
                                                                            ></i>
                                                                            <div className="flex-1 min-w-0">
                                                                                <div className="font-medium text-sm truncate">
                                                                                    {item.value.name}
                                                                                </div>
                                                                                {item.value.subdomain && (
                                                                                    <div className="text-xs text-gray-500 truncate">
                                                                                        {item.value.subdomain}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </>
                                                    ) : (
                                                        <div className="text-center py-4 text-gray-500 text-sm">
                                                            Nenhum item recente
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            <Link
                                to="/blog"
                                className={`font-['Onest',sans-serif] text-base transition-colors whitespace-nowrap px-8 py-3.5 rounded-full ${
                                    location.pathname === '/blog' || location.pathname.startsWith('/blog/')
                                        ? 'bg-primary text-primary-content'
                                        : 'text-black hover:text-primary'
                                }`}
                            >
                                Blog
                            </Link>

                            {/* Admin dropdown menu */}
                            {isAuthenticated && user?.role === 'admin' && (
                                <div className="relative">
                                    <details className="dropdown">
                                        <summary className="font-['Onest',sans-serif] text-base transition-colors whitespace-nowrap px-8 py-3.5 rounded-full text-black hover:text-primary cursor-pointer list-none flex items-center gap-1">
                                            Admin
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

                        {/* Right side - Login/User Section */}
                        <div className="flex items-center gap-3">
                            {isAuthenticated ? (
                                <>
                                    <button
                                        onClick={logout}
                                        className="font-['Onest',sans-serif] text-base px-8 py-3.5 rounded-full transition-colors text-black hover:text-primary whitespace-nowrap"
                                    >
                                        Sair
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => setIsLoginModalOpen(true)}
                                    className={`font-['Onest',sans-serif] text-base px-8 py-3.5 rounded-full transition-colors whitespace-nowrap ${
                                        location.pathname === '/' || location.pathname === '/login'
                                            ? 'bg-primary text-primary-content hover:bg-primary/90'
                                            : 'text-black hover:text-primary'
                                    }`}
                                >
                                    Login
                                </button>
                            )}

                            {/* Mobile menu button */}
                            <div className="md:hidden ml-4">
                                <details className="dropdown dropdown-end">
                                    <summary className="btn btn-ghost">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                        </svg>
                                    </summary>
                                    <ul className="dropdown-content menu bg-white rounded-box z-10 w-52 p-2 shadow-lg border">
                                        <li><Link to="/about" className="text-gray-700">Quem Somos</Link></li>
                                        <li><Link to="/domains" className="text-gray-700">Indicadores</Link></li>
                                        <li><button onClick={toggleSearch} className="text-gray-700">Pesquisar</button></li>
                                        <li><Link to="/blog" className="text-gray-700">Blog</Link></li>
                                        {isAuthenticated && user?.role === 'admin' && (
                                            <>
                                                <div className="divider my-2"></div>
                                                <li><Link to="/indicators-management" className="text-gray-700">Admin - Indicadores</Link></li>
                                                <li><Link to="/admin/blog" className="text-gray-700">Admin - Blog</Link></li>
                                                <li><Link to="/favorites" className="text-gray-700">Favoritos</Link></li>
                                            </>
                                        )}
                                    </ul>
                                </details>
                            </div>
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
