import { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PropTypes from 'prop-types'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons'
import { cn } from '../utils/cn'

const logoDark = '/roots.svg'
const logoWhite = '/roots-white.svg'

export default function MobileNavbar({ onLoginClick }) {
    const { t } = useTranslation()
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

    const publicacoesSubItems = [
        { label: t('nav.publications_reports'), path: '/publications/reports' },
        { label: t('nav.publications_documents'), path: '/publications/documents' },
        { label: t('nav.publications_studies'), path: '/publications/studies' },
    ]

    // Close menu on route change
    useEffect(() => {
        setIsOpen(false)
        setOpenDropdown(null)
    }, [location.pathname])

    // Close on outside click
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

    // Collapsed state
    if (!isOpen) {
        return (
            <div ref={navRef} className="flex items-center gap-2 bg-[#fffefc] rounded-full shadow-[0px_0px_4px_0px_rgba(0,0,0,0.05)] px-2 py-1">
                <Link to="/" className="shrink-0">
                    <img src={logoDark} alt="ROOTS" className="h-9 w-auto" />
                </Link>
                <button
                    onClick={() => setIsOpen(true)}
                    className="bg-[#084d92] text-[#fffefc] font-medium text-lg leading-6 px-3 py-1 rounded-full whitespace-nowrap"
                >
                    Menu
                </button>
            </div>
        )
    }

    // Expanded state
    return (
        <div ref={navRef} className="bg-[#084d92] rounded-2xl shadow-[0px_0px_4px_0px_rgba(0,0,0,0.05)] px-2 pt-1 pb-3.5 flex flex-col gap-6 min-w-[200px]">
            {/* Header: logo + close */}
            <div className="flex items-center gap-2">
                <Link to="/" className="shrink-0">
                    <img src={logoWhite} alt="ROOTS" className="h-9 w-auto" />
                </Link>
                <button
                    onClick={() => { setIsOpen(false); setOpenDropdown(null) }}
                    className="bg-[#fffefc] text-[#084d92] font-medium text-lg leading-6 px-3 py-1 rounded-full whitespace-nowrap"
                >
                    {t('close')}
                </button>
            </div>

            {/* Navigation items */}
            <nav className="flex flex-col gap-3.5 pl-1.5">
                {/* ROOTS dropdown */}
                <div className="flex flex-col">
                    <button
                        onClick={() => toggleDropdown('roots')}
                        className="flex items-center justify-between w-full"
                    >
                        <span className="font-bold text-2xl leading-6 text-[#fffefc]">
                            ROOTS
                        </span>
                        <FontAwesomeIcon
                            icon={openDropdown === 'roots' ? faChevronUp : faChevronDown}
                            className="text-[#fffefc] text-sm"
                        />
                    </button>
                    {openDropdown === 'roots' && (
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
                    )}
                </div>

                {/* Indicadores */}
                <Link
                    to="/indicators"
                    className="font-bold text-2xl leading-6 text-[#fffefc]"
                >
                    {t('nav.indicators')}
                </Link>

                {/* Publicações dropdown */}
                <div className="flex flex-col">
                    <button
                        onClick={() => toggleDropdown('publicacoes')}
                        className="flex items-center justify-between w-full"
                    >
                        <span className="font-bold text-2xl leading-6 text-[#fffefc]">
                            {t('nav.publications')}
                        </span>
                        <FontAwesomeIcon
                            icon={openDropdown === 'publicacoes' ? faChevronUp : faChevronDown}
                            className="text-[#fffefc] text-sm"
                        />
                    </button>
                    {openDropdown === 'publicacoes' && (
                        <div className="flex flex-col gap-1 mt-2">
                            {publicacoesSubItems.map(sub => (
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
                    )}
                </div>

                {/* Notícias */}
                <Link
                    to="/news-events"
                    className="font-bold text-2xl leading-6 text-[#fffefc]"
                >
                    {t('nav.news')}
                </Link>
            </nav>
        </div>
    )
}

MobileNavbar.propTypes = {
    onLoginClick: PropTypes.func,
}
