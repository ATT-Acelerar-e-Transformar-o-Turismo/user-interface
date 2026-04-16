import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import FooterSimple from "../components/FooterSimple";
import PropTypes from 'prop-types';

function ScrollToTop() {
    const { pathname } = useLocation();
    useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
    return null;
}

export default function PageTemplate({ children, showSearchBox = true, fullBleed = false, landingFooter = false }) {
    return (
        <div className="flex flex-col min-h-screen">
            <ScrollToTop />
            <Navbar showSearchBox={showSearchBox} />
            <main className={`flex-1 w-full ${fullBleed ? '' : 'pt-[calc(var(--navbar-height)+1.5rem)] sm:pt-[calc(var(--navbar-height)+6rem)]'}`}>
                {children}
            </main>
            {landingFooter ? <Footer /> : <FooterSimple />}
        </div>
    )
}

PageTemplate.propTypes = {
    children: PropTypes.node.isRequired,
    showSearchBox: PropTypes.bool,
    fullBleed: PropTypes.bool,
    landingFooter: PropTypes.bool,
};