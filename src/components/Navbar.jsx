import { Link, useNavigate, useLocation } from "react-router-dom"
import { useState, useRef, useEffect } from "react"
import { useTranslation } from 'react-i18next'
import PropTypes from 'prop-types'
import logoRoots from '../assets/logo-roots.png'
import indicatorService from '../services/indicatorService'
import { highlightSearchTerms } from '../utils/searchUtils'
import LoginModal from './LoginModal'
import { useAuth } from '../contexts/AuthContext'

const imgUserIcon = "/assets/figma/user-icon.svg";

export default function Navbar({ showSearchBox = false }) {
    const { t } = useTranslation();
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

    const searchInputRef = useRef(null);
    const dropdownRef = useRef(null);
    const itemRefs = useRef([]);
    const navigate = useNavigate();
    const location = useLocation();
    const { user, isAuthenticated, login, logout } = useAuth();

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
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 100);
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
            <div className={`w-full fixed top-0 z-50 pointer-events-none font-['Onest'] text-black transition-transform duration-300 bg-base-100/70 backdrop-blur-md ${isHidden ? '-translate-y-full' : 'translate-y-0'}`}>
		<div className="w-full flex items-center justify-between py-2 px-4 lg:px-12 pointer-events-auto">

                    {/* Logo - Left Side */}
                    <div className="flex-shrink-0">
                        <Link to="/">
                            <img src={logoRoots} alt="ROOTS" className="h-[30px] lg:h-[50px] w-auto" />
                        </Link>
                    </div>

                    {/* Navigation Links - Center */}
                    <div className="hidden lg:flex items-center gap-10 flex-1 justify-center">
                        <Link
                            to="/"
                            className="font-['Onest'] font-medium text-[24px] leading-none text-[#0a0a0a] tracking-[-0.24px] py-2 hover:text-[#009368] transition-colors border-b-2 border-transparent hover:border-[#009368]"
                        >
                            {t('nav.home')}
                        </Link>

                        <button
                            onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
                            className="font-['Onest'] font-medium text-[24px] leading-none text-[#0a0a0a] tracking-[-0.24px] py-2 hover:text-[#009368] transition-colors"
                        >
                            {t('nav.about')}
                        </button>

                        <Link
                            to="/indicators"
                            className="font-['Onest'] font-medium text-[24px] leading-none text-[#0a0a0a] tracking-[-0.24px] py-2 hover:text-[#009368] transition-colors"
                        >
                            {t('nav.dimensions')}
                        </Link>

                        <Link
                            to="/blog"
                            className="font-['Onest'] font-medium text-[24px] leading-none text-[#0a0a0a] tracking-[-0.24px] py-2 hover:text-[#009368] transition-colors"
                        >
                            {t('nav.blog')}
                        </Link>

                        <Link
                            to="/contact"
                            className="font-['Onest'] font-medium text-[24px] leading-none text-[#0a0a0a] tracking-[-0.24px] py-2 hover:text-[#009368] transition-colors"
                        >
                            {t('nav.contact')}
                        </Link>

                        {isAuthenticated && user?.role === 'admin' && (
                            <Link
                                to="/admin"
                                className="font-['Onest'] font-medium text-[24px] leading-none text-[#0a0a0a] tracking-[-0.24px] py-2 hover:text-[#009368] transition-colors"
                            >
                                {t('nav.admin')}
                            </Link>
                        )}
                    </div>

                    {/* Login Button - Right Side */}
                    <div className="hidden lg:flex items-center flex-shrink-0">
                        {isAuthenticated ? (
                            <button
                                onClick={logout}
                                className="bg-[#009368] text-[#fafafa] font-['Onest'] font-medium text-[21px] px-[18px] py-[8px] rounded-full hover:bg-[#007a56] transition-colors flex items-center gap-2 tracking-[0.105px] min-h-[48px]"
                            >
                                <img src={imgUserIcon} alt="" className="w-5 h-5" />
                                <span className="leading-[31.5px]">{t('nav.logout')}</span>
                            </button>
                        ) : (
                            <button
                                onClick={() => setIsLoginModalOpen(true)}
                                className="bg-[#009368] text-[#fafafa] font-['Onest'] font-medium text-[21px] px-[18px] py-[8px] rounded-full hover:bg-[#007a56] transition-colors flex items-center gap-2 tracking-[0.105px] min-h-[48px]"
                            >
                                <img src={imgUserIcon} alt="" className="w-5 h-5" />
                                <span className="leading-[31.5px]">{t('nav.login')}</span>
                            </button>
                        )}
                    </div>

                    {/* Mobile Menu */}
                    <div className="lg:hidden">
                        <div className="dropdown dropdown-end">
                            <label tabIndex={0} className="btn btn-ghost btn-circle">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" /></svg>
                            </label>
                            <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
                                <li><Link to="/">{t('nav.home')}</Link></li>
                                <li><button onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}>{t('nav.about')}</button></li>
                                <li><Link to="/indicators">{t('nav.dimensions')}</Link></li>
                                <li><Link to="/blog">{t('nav.blog')}</Link></li>
                                <li><Link to="/contact">{t('nav.contact')}</Link></li>
                                {isAuthenticated && user?.role === 'admin' && (
                                    <li><Link to="/admin">{t('nav.admin')}</Link></li>
                                )}
                                <li>
                                    {isAuthenticated ? (
                                        <button onClick={logout}>{t('nav.logout')}</button>
                                    ) : (
                                        <button onClick={() => setIsLoginModalOpen(true)}>{t('nav.login')}</button>
                                    )}
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

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
