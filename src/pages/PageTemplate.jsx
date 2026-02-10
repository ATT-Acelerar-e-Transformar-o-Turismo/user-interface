import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PropTypes from 'prop-types';

export default function PageTemplate({ children, showSearchBox = true }) {
    return (
        <div className="flex flex-col min-h-screen">
            <Navbar showSearchBox={showSearchBox} />
            <main className="flex-1 w-full">
                {children}
            </main>
            <Footer />
        </div>
    )
}

PageTemplate.propTypes = {
    children: PropTypes.node.isRequired,
    showSearchBox: PropTypes.bool,
};