import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { LuUserRound } from 'react-icons/lu';
import Navbar from './Navbar';
import Weather from './Weather';

function AdminRightContent() {
    const { t, i18n } = useTranslation();
    const { logout } = useAuth();
    const isPt = i18n.language?.startsWith('pt');

    return (
        <div className="hidden lg:flex items-center gap-4 shrink-0">
            <Weather />
            <div className="w-px h-[24px] bg-[#0a0a0a] opacity-20" />
            <button
                type="button"
                onClick={() => i18n.changeLanguage(isPt ? 'en' : 'pt')}
                className="font-medium text-[17px] text-[#0a0a0a] tracking-[-0.2px] leading-none whitespace-nowrap hover:text-[#009368] transition-colors"
                aria-label={isPt ? 'Switch to English' : 'Mudar para Português'}
            >
                {isPt ? 'PT' : 'EN'}
            </button>
            <div className="w-px h-[24px] bg-[#0a0a0a] opacity-20" />
            <Link
                to="/admin/users"
                className="flex items-center justify-center w-6 h-6 text-[#0a0a0a] hover:text-[#009368] transition-colors"
                aria-label={t('admin.nav.user_management')}
            >
                <LuUserRound className="w-5 h-5" strokeWidth={1.75} aria-hidden="true" />
            </Link>
            <button
                type="button"
                onClick={logout}
                className="font-medium text-[17px] text-[#0a0a0a] tracking-[-0.2px] leading-none whitespace-nowrap hover:text-[#009368] transition-colors"
            >
                {t('nav.logout')}
            </button>
        </div>
    );
}

export default function AdminNavbar() {
    const { t } = useTranslation();

    const adminNavItems = [
        { label: t('admin.nav.indicators'), path: '/admin/indicators-management' },
        { label: t('admin.nav.dimensions'), path: '/admin/dimensions' },
        { label: t('admin.nav.areas'), path: '/admin/areas-management' },
        { label: t('admin.nav.publications'), path: '/admin/publications' },
        { label: t('admin.nav.news_events'), path: '/admin/news-events' },
    ];

    return (
        <Navbar
            navItems={adminNavItems}
            rightContent={<AdminRightContent />}
        />
    );
}
