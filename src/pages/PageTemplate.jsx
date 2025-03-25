import Navbar from "../components/Navbar";

export default function PageTemplate({ children }) {
    return (
        <>
            <Navbar />
            <div className="container mx-auto w-screen">
                <div className="p-4">
                    {children}
                </div>
            </div>
        </>
    )
}