import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import AdminNavbar from '../components/AdminNavbar';
import PropTypes from 'prop-types';

function ScrollToTop() {
    const { pathname } = useLocation();
    useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
    return null;
}

export default function AdminPageTemplate({ children, bgClassName = 'bg-base-100' }) {
    return (
        <div className={`admin-theme min-h-screen ${bgClassName}`}>
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
    bgClassName: PropTypes.string,
};
