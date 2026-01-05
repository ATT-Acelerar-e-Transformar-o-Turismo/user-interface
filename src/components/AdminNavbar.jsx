import { Link, useLocation } from 'react-router-dom';
import logoRoots from '../assets/logo-roots.png';

/**
 * AdminNavbar - Navigation bar for admin pages with pill-style tab navigation
 * Matches Figma painel_admin_indicadores design exactly
 */
export default function AdminNavbar() {
  const location = useLocation();

  // Determine active tab based on current route
  const getActiveTab = () => {
    const path = location.pathname;

    if (path.includes('/indicators-management') ||
        path.includes('/new_indicator') ||
        path.includes('/edit_indicator') ||
        path.includes('/resources-management') ||
        path.includes('/add_data_resource') ||
        path.includes('/edit_resource')) {
      return 'indicadores';
    }

    if (path.includes('/dimensions')) return 'dimensoes';

    if (path.includes('/domains') ||
        path.includes('/new_domain') ||
        path.includes('/edit_domain')) {
      return 'dominios';
    }

    return 'overview';
  };

  const activeTab = getActiveTab();

  // Navigation tabs configuration
  const tabs = [
    { id: 'overview', label: 'Overview', path: '/admin' },
    { id: 'indicadores', label: 'Indicadores', path: '/indicators-management' },
    { id: 'dimensoes', label: 'Dimensões', path: '/dimensions' },
    { id: 'dominios', label: 'Dominios', path: '/domains-management' }
  ];

  return (
    <nav className="bg-white px-6 py-4">
      <div className="max-w-7xl mx-auto">
        {/* Pill-style container matching main Navbar */}
        <div style={{backgroundColor: 'var(--color-surface)'}} className="rounded-[50px] py-2 px-8 flex items-center justify-between">
          {/* Left side - Logo */}
          <div className="flex items-center">
            <Link to="/" className="block">
              <img src={logoRoots} alt="ROOTS" className="h-11 w-auto" />
            </Link>
          </div>

          {/* Center - Navigation Tabs */}
          <div className="flex items-center gap-3">
            {tabs.map((tab) => (
              <Link
                key={tab.id}
                to={tab.path}
                className={`font-['Onest',sans-serif] text-base transition-colors whitespace-nowrap px-8 py-3.5 rounded-full ${
                  activeTab === tab.id
                    ? 'bg-gray-900 text-white'
                    : 'text-black hover:text-gray-600'
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </div>

          {/* Right side - User Profile Icons */}
          <div className="flex items-center gap-3">
            {/* Notification Icon */}
            <button
              className="w-10 h-10 rounded-full bg-white hover:bg-gray-100 transition-colors flex items-center justify-center"
              aria-label="Notificações"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>

            {/* Settings Icon */}
            <button
              className="w-10 h-10 rounded-full bg-white hover:bg-gray-100 transition-colors flex items-center justify-center"
              aria-label="Definições"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            {/* User Profile Avatar */}
            <Link
              to="/profile"
              className="w-10 h-10 rounded-full bg-white hover:bg-gray-100 transition-colors flex items-center justify-center cursor-pointer"
              aria-label="Perfil do Utilizador"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
