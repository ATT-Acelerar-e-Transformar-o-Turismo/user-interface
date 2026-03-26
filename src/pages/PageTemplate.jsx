import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PropTypes from 'prop-types';

function ScrollToTop() {
    const { pathname } = useLocation();
    useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
    return null;
}

export default function PageTemplate({ children, showSearchBox = true, fullBleed = false }) {
    return (
        <div className="flex flex-col min-h-screen">
            <ScrollToTop />
            <Navbar showSearchBox={showSearchBox} />
            <main className="flex-1 w-full" style={fullBleed ? undefined : { paddingTop: 'calc(var(--navbar-height) + 6rem)' }}>
                {children}
            </main>
            <Footer />
        </div>
    )
}

PageTemplate.propTypes = {
    children: PropTypes.node.isRequired,
    showSearchBox: PropTypes.bool,
    fullBleed: PropTypes.bool,
};