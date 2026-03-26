import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import AdminNavbar from '../components/AdminNavbar';
import PropTypes from 'prop-types';

function ScrollToTop() {
    const { pathname } = useLocation();
    useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
    return null;
}

export default function AdminPageTemplate({ children }) {
    return (
        <div className="min-h-screen bg-base-100">
            <ScrollToTop />
            <AdminNavbar />
            <main style={{ paddingTop: 'calc(var(--navbar-height) + 6rem)' }}>
                {children}
            </main>
        </div>
    );
}

AdminPageTemplate.propTypes = {
    children: PropTypes.node.isRequired,
};
