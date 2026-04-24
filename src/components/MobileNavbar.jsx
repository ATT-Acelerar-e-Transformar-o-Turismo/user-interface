import { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PropTypes from 'prop-types'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons'
import { cn } from '../utils/cn'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'

const logoDark = '/roots.svg'
const logoWhite = '/roots-white.svg'

export default function MobileNavbar() {
    const { t, i18n } = useTranslation()
    const { isAuthenticated, user, login, logout } = useAuth()
    const location = useLocation()
    const [isOpen, setIsOpen] = useState(false)
    const [openDropdown, setOpenDropdown] = useState(null)
    const navRef = useRef(null)

    const rootsSubItems = [
        { label: t('roots.nav.quem_somos'), path: '/roots/about' },
        { label: t('roots.nav.governanca'), path: '/roots/governance' },
        { label: t('roots.nav.territorio'), path: '/roots/territory' },
        { label: t('roots.nav.redes'), path: '/roots/networks-certifications' },
    ]

    useEffect(() => {
        setIsOpen(false)
        setOpenDropdown(null)
    }, [location.pathname])

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (navRef.current && !navRef.current.contains(e.target)) {
                setIsOpen(false)
                setOpenDropdown(null)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const toggleDropdown = (name) => {
        setOpenDropdown(prev => prev === name ? null : name)
    }

    return (
        <div ref={navRef} className="relative">
            {/* Invisible spacer — keeps navbar wrapper height consistent */}
            <div className="flex items-center gap-2 px-2 py-1 invisible">
                <img src={logoDark} alt="" className="h-9 w-auto" />
                <span className="font-medium text-lg px-3 py-1">Menu</span>
            </div>

            {/* Actual navbar — always absolutely positioned so it never affects layout */}
            <motion.div
                animate={{ backgroundColor: isOpen ? '#084d92' : '#fffefc' }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className={cn(
                    'absolute top-0 left-0 shadow-[0px_0px_4px_0px_rgba(0,0,0,0.05)] px-2 pt-1 overflow-hidden',
                    isOpen ? 'rounded-2xl pb-3.5' : 'rounded-full pb-1'
                )}
            >
                {/* Header: logo + menu/close button */}
                <div className="flex items-center gap-2">
                    <Link to="/" className="shrink-0">
                        <img src={isOpen ? logoWhite : logoDark} alt="ROOTS" className="h-9 w-auto" />
                    </Link>
                    <motion.button
                        onClick={() => { setIsOpen(!isOpen); if (isOpen) setOpenDropdown(null) }}
                        animate={{
                            backgroundColor: isOpen ? '#fffefc' : '#084d92',
                            color: isOpen ? '#084d92' : '#fffefc',
                        }}
                        transition={{ duration: 0.25 }}
                        className="font-medium text-lg leading-6 px-3 py-1 rounded-full whitespace-nowrap"
                    >
                        {isOpen ? t('common.close') : 'Menu'}
                    </motion.button>
                </div>

                {/* Expandable nav content */}
                <AnimatePresence>
                    {isOpen && (
                        <motion.nav
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: 'easeInOut' }}
                            className="overflow-hidden flex flex-col gap-3.5 pl-1.5 mt-6"
                        >
                            {/* ROOTS dropdown */}
                            <div className="flex flex-col">
                                <button
                                    onClick={() => toggleDropdown('roots')}
                                    className="flex items-center justify-between w-full"
                                >
                                    <span className="font-bold text-2xl leading-6 text-[#fffefc]">ROOTS</span>
                                    <FontAwesomeIcon
                                        icon={openDropdown === 'roots' ? faChevronUp : faChevronDown}
                                        className="text-[#fffefc] text-sm mr-2"
                                    />
                                </button>
                                <AnimatePresence>
                                    {openDropdown === 'roots' && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="flex flex-col gap-1 mt-2">
                                                {rootsSubItems.map(sub => (
                                                    <Link
                                                        key={sub.path}
                                                        to={sub.path}
                                                        className={cn(
                                                            'font-medium text-lg leading-6 text-[#fffefc]',
                                                            location.pathname === sub.path && 'opacity-70'
                                                        )}
                                                    >
                                                        {sub.label}
                                                    </Link>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Indicadores */}
                            <Link to="/indicators" className="font-bold text-2xl leading-6 text-[#fffefc]">
                                {t('nav.indicators')}
                            </Link>

                            {/* Publicações */}
                            <Link to="/publications" className="font-bold text-2xl leading-6 text-[#fffefc]">
                                {t('nav.publications', 'Publicações')}
                            </Link>

                            {/* Notícias */}
                            <Link to="/news-events" className="font-bold text-2xl leading-6 text-[#fffefc]">
                                {t('nav.news')}
                            </Link>

                            {/* Admin — only for admin users */}
                            {isAuthenticated && user?.role === 'admin' && (
                                <Link to="/admin" className="font-bold text-2xl leading-6 text-[#fffefc]">
                                    {t('nav.admin')}
                                </Link>
                            )}

                            {/* Divider */}
                            <div className="w-full h-px bg-white/20 my-1" />

                            {/* Login/Logout + Language */}
                            <div className="flex items-center justify-between">
                                {isAuthenticated ? (
                                    <button
                                        onClick={() => { logout(); setIsOpen(false) }}
                                        className="font-medium text-lg leading-6 text-[#fffefc]"
                                    >
                                        {t('nav.logout')}
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => { login(); setIsOpen(false) }}
                                        className="font-medium text-lg leading-6 text-[#fffefc]"
                                    >
                                        {t('nav.login')}
                                    </button>
                                )}
                                <button
                                    onClick={() => i18n.changeLanguage(i18n.language?.startsWith('pt') ? 'en' : 'pt')}
                                    className="font-medium text-lg leading-6 text-[#fffefc] bg-white/10 px-3 py-1 rounded-full"
                                >
                                    {i18n.language?.startsWith('pt') ? 'PT' : 'EN'}
                                </button>
                            </div>
                        </motion.nav>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    )
}

MobileNavbar.propTypes = {}
