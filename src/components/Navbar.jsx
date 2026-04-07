import { Link, useNavigate, useLocation } from "react-router-dom"
import { useState, useRef, useEffect } from "react"
import { useTranslation } from 'react-i18next'
import PropTypes from 'prop-types'
import logoRoots from '../assets/logo-roots.svg'
import indicatorService from '../services/indicatorService'
import { highlightSearchTerms } from '../utils/searchUtils'
import LoginModal from './LoginModal'
import MobileNavbar from './MobileNavbar'
import { useAuth } from '../contexts/AuthContext'

const imgUserIcon = "/assets/figma/user-icon.svg";

export default function Navbar({ navItems = null, rightContent = null, showSearchBox = false }) {
    const { t, i18n } = useTranslation();
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [recentItems, setRecentItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [isHidden, setIsHidden] = useState(false);
    const [lastScrollY, setLastScrollY] = useState(0);
    const [isRootsOpen, setIsRootsOpen] = useState(false);
    const rootsDropdownRef = useRef(null);
    const rootsTimeoutRef = useRef(null);

    const rootsSubItems = [
        { label: t('roots.nav.quem_somos'), path: '/roots/about' },
        { label: t('roots.nav.governanca'), path: '/roots/governance' },
        { label: t('roots.nav.territorio'), path: '/roots/territory' },
        { label: t('roots.nav.redes'), path: '/roots/networks-certifications' },
    ];

    const searchInputRef = useRef(null);
    const dropdownRef = useRef(null);
    const itemRefs = useRef([]);
    const navbarWrapperRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();
    const { user, isAuthenticated, login, logout } = useAuth();

    // Keep --navbar-height in sync with the wrapper's rendered height
    useEffect(() => {
        const el = navbarWrapperRef.current;
        if (!el) return;
        const observer = new ResizeObserver(() => {
            document.documentElement.style.setProperty('--navbar-height', `${el.offsetHeight}px`);
        });
        observer.observe(el);
        document.documentElement.style.setProperty('--navbar-height', `${el.offsetHeight}px`);
        return () => observer.disconnect();
    }, []);

    // Scroll behavior to hide/show navbar
    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            if (currentScrollY > lastScrollY && currentScrollY > 100) {
                setIsHidden(true);
            } else {
                setIsHidden(false);
            }
            setLastScrollY(currentScrollY);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    useEffect(() => {
        setIsSearchOpen(false);
        setSearchQuery('');
        setShowDropdown(false);
        setSelectedIndex(-1);
        setIsRootsOpen(false);
    }, [location.pathname]);

    // Close ROOTS dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (rootsDropdownRef.current && !rootsDropdownRef.current.contains(e.target)) {
                setIsRootsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogin = async (formData) => {
        await login(formData);
        setIsLoginModalOpen(false);
    };

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

    useEffect(() => {
        if (isSearchOpen && searchInputRef.current) {
            setTimeout(() => { searchInputRef.current?.focus(); }, 100);
        }
    }, [isSearchOpen]);

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
            newItem = { type: 'search', value: item.trim(), timestamp: Date.now() };
        } else {
            newItem = { type: 'indicator', value: { id: item.id, name: item.name, subdomain: item.subdomain, domain: item.domain }, timestamp: Date.now() };
        }
        const filtered = recentItems.filter(existingItem => {
            if (existingItem.type !== newItem.type) return true;
            return newItem.type === 'search' ? existingItem.value !== newItem.value : existingItem.value.id !== newItem.value.id;
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
            if (elementTop < containerTop) container.scrollTop = elementTop;
            else if (elementBottom > containerBottom) container.scrollTop = elementBottom - container.clientHeight;
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
                if (searchQuery.trim().length >= 2) handleSuggestionClick(selectedItem);
                else handleRecentItemClick(selectedItem);
            } else {
                handleSearch(e);
            }
        } else if (e.key === 'Escape') {
            setIsSearchOpen(false);
            setSearchQuery('');
            setShowDropdown(false);
        }
    };

    // Active/hover green pill — Figma node 388:2452
    const navItemClass = (path, exact = false, forceActive = false) => {
        const isActive = forceActive || (exact
            ? location.pathname === path
            : location.pathname === path || location.pathname.startsWith(path + '/'));
        const base = 'flex items-center justify-center px-[24px] py-[16px] font-medium text-[20px] tracking-[-0.2px] leading-none whitespace-nowrap rounded-full transition-all duration-200';
        return isActive
            ? `${base} bg-primary text-primary-content`
            : `${base} text-[#0a0a0a] hover:bg-primary hover:text-primary-content`;
    };

    const isRootsActive = location.pathname.startsWith('/roots/');

    // Default public nav items (includes admin link when appropriate)
    const defaultItems = [
        { label: 'ROOTS', path: '/', exact: true },
        { label: t('nav.domains'), path: '/indicators' },
        { label: t('nav.blog'), path: '/news-events' },
        ...(isAuthenticated && user?.role === 'admin' ? [{ label: t('nav.admin'), path: '/admin' }] : []),
    ];

    const items = navItems ?? defaultItems;

    // Default right section: login/logout + language toggle
    const defaultRight = (
        <div className="hidden lg:flex items-center gap-5 shrink-0">
            {isAuthenticated ? (
                <button
                    onClick={logout}
                    className="flex items-center gap-2 font-medium text-[17px] text-[#0a0a0a] tracking-[-0.2px] leading-none whitespace-nowrap hover:text-primary transition-colors"
                >
                    <img src={imgUserIcon} alt="" className="w-4 h-4" />
                    <span>{t('nav.logout')}</span>
                </button>
            ) : (
                <button
                    onClick={() => setIsLoginModalOpen(true)}
                    className="flex items-center gap-2 font-medium text-[17px] text-[#0a0a0a] tracking-[-0.2px] leading-none whitespace-nowrap hover:text-primary transition-colors"
                >
                    <img src={imgUserIcon} alt="" className="w-4 h-4" />
                    <span>{t('nav.login')}</span>
                </button>
            )}
            <div className="w-px h-[24px] bg-[#0a0a0a] opacity-20" />
            <button
                onClick={() => i18n.changeLanguage(i18n.language?.startsWith('pt') ? 'en' : 'pt')}
                className="font-medium text-[17px] text-[#0a0a0a] tracking-[-0.2px] leading-none whitespace-nowrap hover:text-primary transition-colors"
            >
                {i18n.language?.startsWith('pt') ? 'PT' : 'EN'}
            </button>
        </div>
    );

    // Default mobile items
    const defaultMobileItems = [
        { label: t('nav.home'), path: '/' },
        { label: 'ROOTS', path: '/roots', isRoots: true },
        { label: t('nav.domains'), path: '/indicators' },
        { label: t('nav.blog'), path: '/news-events' },
        ...(isAuthenticated && user?.role === 'admin' ? [{ label: t('nav.admin'), path: '/admin' }] : []),
    ];

    const mobileItems = navItems
        ? items.map(item => ({ label: item.label, path: item.path }))
        : defaultMobileItems;

    return (
        <>
            {/* Floating pill navbar — Figma node 724:1948 */}
            <div ref={navbarWrapperRef} className={`fixed top-0 left-0 right-0 z-50 px-4 lg:px-12 pt-3 lg:pt-5 pointer-events-none font-['Onest'] transition-transform duration-300 ${isHidden ? '-translate-y-full' : 'translate-y-0'}`}>
                {/* Desktop nav pill — hidden on mobile */}
                <nav className="hidden lg:flex bg-[#fffefc] rounded-[999999px] shadow-[0px_0px_3px_2px_rgba(0,0,0,0.05)] items-center h-[72px] px-9 pointer-events-auto">

                    {/* Logo */}
                    <Link to="/" className="shrink-0 flex items-center">
                        <img src={logoRoots} alt="ROOTS" className="h-9 w-auto" />
                    </Link>

                    {/* Nav Items — desktop, auto-sized and centered */}
                    <div className="flex mx-auto items-center h-full gap-4">
                        {items.map(item => {
                            if (item.label === 'ROOTS') {
                                return (
                                    <div
                                        key={item.path}
                                        ref={rootsDropdownRef}
                                        className="relative"
                                        onMouseEnter={() => {
                                            clearTimeout(rootsTimeoutRef.current);
                                            setIsRootsOpen(true);
                                        }}
                                        onMouseLeave={() => {
                                            rootsTimeoutRef.current = setTimeout(() => setIsRootsOpen(false), 200);
                                        }}
                                    >
                                        <Link
                                            to={item.path}
                                            className={navItemClass(item.path, item.exact, isRootsActive || isRootsOpen)}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setIsRootsOpen(prev => !prev);
                                            }}
                                        >
                                            {item.label}
                                        </Link>
                                        {isRootsOpen && (
                                            <div className="absolute top-full left-0 mt-2 bg-[#fffefc] rounded-[18px] p-4 flex flex-col gap-2 shadow-[0px_0px_3px_2px_rgba(0,0,0,0.05)] min-w-[260px] z-50">
                                                {rootsSubItems.map(sub => (
                                                    <Link
                                                        key={sub.path}
                                                        to={sub.path}
                                                        className={`flex items-center p-2 rounded-lg font-medium text-[20px] tracking-[-0.2px] leading-none whitespace-nowrap transition-colors ${
                                                            location.pathname === sub.path
                                                                ? 'text-primary'
                                                                : 'text-[#0a0a0a] hover:text-primary'
                                                        }`}
                                                    >
                                                        {sub.label}
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            }
                            return (
                                <Link key={item.path} to={item.path} className={navItemClass(item.path, item.exact)}>
                                    {item.label}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Right section */}
                    {rightContent ?? defaultRight}
                </nav>

                {/* Mobile navbar — visible only below lg, above all content */}
                <div className="lg:hidden pointer-events-auto relative z-[60]">
                    <MobileNavbar onLoginClick={() => setIsLoginModalOpen(true)} />
                </div>
            </div>

            {!rightContent && (
                <LoginModal
                    isOpen={isLoginModalOpen}
                    onClose={() => setIsLoginModalOpen(false)}
                    onLogin={handleLogin}
                />
            )}
        </>
    );
}

Navbar.propTypes = {
    navItems: PropTypes.arrayOf(PropTypes.shape({
        label: PropTypes.string.isRequired,
        path: PropTypes.string.isRequired,
        exact: PropTypes.bool,
    })),
    rightContent: PropTypes.node,
    showSearchBox: PropTypes.bool,
};
