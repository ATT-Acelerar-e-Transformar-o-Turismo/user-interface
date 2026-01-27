import { useNavigate } from "react-router-dom"
import { cn } from "../utils/cn"

export default function DomainCard({ DomainTitle, DomainPage, DomainColor, DomainImage }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(DomainPage, {
      state: { domainName: DomainTitle }
    })
  }

  return (
    <div className={cn(
      "card bg-base-100 w-96 shadow-md m-4 border-2 rounded-[10px]"
    )}
      style={{ borderColor: DomainColor }}
    >
      <figure className="px-10 pt-10">
        <img
          src={DomainImage}
          alt={DomainTitle}
          className="rounded-xl"
        />
      </figure>
      <div className="card-body items-center text-center">
        <div className="card-actions">
          <button
            className={cn("btn rounded-[10px]")}
            onClick={handleClick}
            style={{ borderColor: DomainColor }}
          >
            {DomainTitle}
          </button>
        </div>
      </div>
    </div>
  )
}
