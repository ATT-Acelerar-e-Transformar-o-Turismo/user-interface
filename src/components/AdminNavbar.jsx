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
    { id: 'dominios', label: 'Dominios', path: '/domains' }
  ];

  return (
    <nav className="bg-white px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="bg-[#f1f0f0] rounded-[50px] py-4 px-8 flex items-center justify-between">
          {/* Left side - Logo */}
          <div className="flex items-center">
            <Link to="/" className="block">
              <img src={logoRoots} alt="ROOTS" className="h-11 w-auto" />
            </Link>
          </div>

          {/* Center - Pill-style Navigation Tabs */}
          <div className="flex items-center">
            <div className="bg-[#f1f0f0] rounded-full px-2 py-2 flex gap-1">
              {tabs.map((tab) => (
                <Link
                  key={tab.id}
                  to={tab.path}
                  className={`
                    px-6 py-2.5 rounded-full font-['Onest',sans-serif] font-medium text-base transition-all duration-200 whitespace-nowrap
                    ${activeTab === tab.id
                      ? 'bg-[#989898] text-white font-semibold'
                      : 'text-black hover:bg-gray-200'
                    }
                  `}
                >
                  {tab.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right side - User Profile Icons */}
          <div className="flex items-center gap-3">
            {/* Notification Icon */}
            <button
              className="w-8 h-8 rounded-full bg-[#d9d9d9] hover:bg-gray-300 transition-colors flex items-center justify-center"
              aria-label="Notificações"
            >
              <div className="w-2 h-2 rounded-full bg-gray-500"></div>
            </button>

            {/* Settings Icon */}
            <button
              className="w-8 h-8 rounded-full bg-[#d9d9d9] hover:bg-gray-300 transition-colors flex items-center justify-center"
              aria-label="Definições"
            >
              <div className="w-2 h-2 rounded-full bg-gray-500"></div>
            </button>

            {/* User Profile Avatar */}
            <Link
              to="/profile"
              className="w-10 h-10 rounded-full bg-[#d9d9d9] hover:bg-gray-400 transition-colors flex items-center justify-center cursor-pointer"
              aria-label="Perfil do Utilizador"
            >
              <div className="w-3 h-3 rounded-full bg-gray-500"></div>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
