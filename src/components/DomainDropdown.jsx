import { useState, useEffect, useRef } from "react"
import domains from "../../public/domains.json"
import { useNavigate } from "react-router-dom"

function Dropdowns({ initialDomain }) {
  const [selectedDomain, setSelectedDomain] = useState(null)
  const [selectedSubdomain, setSelectedSubdomain] = useState(null)
  const domainRef = useRef(null)
  const subdomainRef = useRef(null)

  const navigate = useNavigate()

  useEffect(() => {
    if (initialDomain) {
      setSelectedDomain(initialDomain)
    }
  }, [initialDomain])

  const handleSelectDomain = (domain) => {
    if (selectedDomain === domain) {
      return
    }
    else {
      {/* Navegar para a página do domínio */}
      navigate(domain.DomainPage, {
        state: {domainName: domain.nome}
      })
    }
    setSelectedDomain(domain)
    setSelectedSubdomain(null)
    if (domainRef.current) {
      domainRef.current.removeAttribute("open")
    }
  }

  const handleSelectSubdomain = (subdom) => {
    setSelectedSubdomain(subdom)
    if (subdomainRef.current) {
      subdomainRef.current.removeAttribute("open")
    }
  }

  return (
    <div className="container mx-auto">
      {/* 1º Dropdown - Domínios */}
      <details ref={domainRef} className="dropdown dropdown-right">
        <summary className="btn m-1">{selectedDomain ? selectedDomain.nome : "Escolha o Domínio"}</summary>
        <ul className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
          {domains.dominios.map((domain) => (
            <li key={domain.nome}>
              <a onClick={() => handleSelectDomain(domain)}>{domain.nome}</a>
            </li>
          ))}
        </ul>
      </details>

      {/* 2º Dropdown - Subdomínios */}
      {selectedDomain && (
        <details ref={subdomainRef} className="dropdown dropdown-right">
          <summary className="btn m-1">{selectedSubdomain ? selectedSubdomain.nome : "Escolha o Subdomínio"}</summary>
          <ul className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
            {selectedDomain.subdominios.map((subdom) => (
              <li key={subdom.nome}>
                <a onClick={() => handleSelectSubdomain(subdom)}>{subdom.nome}</a>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}

export default Dropdowns

