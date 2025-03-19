import { useNavigate } from "react-router-dom"

export default function DomainCard({ DomainTitle, DomainPage, DomainColor, DomainImage }) {

    const navigate = useNavigate();
    
    const handleClick = () => {
        navigate(DomainPage, {
            state: {domainName: DomainTitle}
        })
    }

    return (
        <div className="card bg-base-100 w-96 shadow-md" style={{ background: `${DomainColor}` }}>
            <figure className="px-10 pt-10">
                <img
                src={DomainImage}
                alt={DomainTitle}
                className="rounded-xl" />
            </figure>
            <div className="card-body items-center text-center">
                <div className="card-actions">
                    <button className="btn" onClick={handleClick} >{DomainTitle}</button>
                </div>
            </div>
        </div>
    )
}