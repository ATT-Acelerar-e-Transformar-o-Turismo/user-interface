import Navbar from "../components/Navbar";
import PropTypes from 'prop-types';

export default function PageTemplate({ children, showSearchBox = true }) {
    return (
        <>
            <Navbar showSearchBox={showSearchBox} />
            <main className="w-full">
                {children}
            </main>
        </>
    )
}

PageTemplate.propTypes = {
    children: PropTypes.node.isRequired,
    showSearchBox: PropTypes.bool,
};