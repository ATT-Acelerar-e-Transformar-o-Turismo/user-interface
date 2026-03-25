import AdminNavbar from '../components/AdminNavbar';
import PropTypes from 'prop-types';

export default function AdminPageTemplate({ children }) {
    return (
        <div className="min-h-screen bg-base-100">
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
