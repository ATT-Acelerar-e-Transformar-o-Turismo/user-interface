import Navbar from "../components/Navbar";

export default function PageTemplate({ children }) {
    return (
        <>
            <Navbar />
            {children}
        </>
    )
}