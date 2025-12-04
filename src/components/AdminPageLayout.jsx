import PropTypes from 'prop-types';
import AdminNavbar from './AdminNavbar';

/**
 * AdminPageLayout - Layout wrapper for admin pages
 * Includes AdminNavbar and content area with optional edit panel link
 */
export default function AdminPageLayout({ children, showEditPanel = true }) {
  return (
    <div className="min-h-screen bg-white">
      <AdminNavbar />

      <main className="relative">
        {/* Edit Panel Link */}
        {showEditPanel && (
          <div className="absolute top-6 right-6">
            <button className="text-base font-medium text-black hover:text-gray-600 transition-colors">
              Editar painel
            </button>
          </div>
        )}

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}

AdminPageLayout.propTypes = {
  children: PropTypes.node.isRequired,
  showEditPanel: PropTypes.bool
};
