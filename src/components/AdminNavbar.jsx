import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import Navbar from './Navbar';

const adminNavItems = [
    { label: 'Overview', path: '/admin', exact: true },
    { label: 'Indicadores', path: '/indicators-management' },
    { label: 'Dimensões', path: '/dimensions' },
    { label: 'Dominios', path: '/domains-management' },
    { label: 'Notícias e Eventos', path: '/blog-management' },
];

function AdminRightContent() {
    const { t } = useTranslation();
    const { logout } = useAuth();

    return (
        <div className="hidden lg:flex items-center gap-3 shrink-0">
            {/* User management */}
            <Link
                to="/admin/users"
                className="w-10 h-10 rounded-full hover:bg-black/5 transition-colors flex items-center justify-center"
                aria-label="Gestão de Utilizadores"
            >
                <svg className="w-5 h-5 text-[#0a0a0a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            </Link>

            <div className="w-px h-[24px] bg-[#0a0a0a] opacity-20" />

            {/* Logout */}
            <button
                onClick={logout}
                className="font-medium text-[17px] text-[#0a0a0a] tracking-[-0.2px] leading-none whitespace-nowrap hover:text-[#009368] transition-colors"
            >
                {t('nav.logout')}
            </button>
        </div>
    );
}

export default function AdminNavbar() {
    return (
        <Navbar
            navItems={adminNavItems}
            rightContent={<AdminRightContent />}
        />
    );
}
