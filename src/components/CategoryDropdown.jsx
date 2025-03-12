
import { useState, useEffect, useRef } from "react";
import categorias from "../../public/categorias.json"; 

function CategoryDropdown({ }) {
  const [selectedCat, setSelectedCat] = useState(null);
  const domainRef = useRef(null);
  const containerRef = useRef(null);


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        if (domainRef.current) domainRef.current.removeAttribute("open");
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleSelectCat = (domain) => {

    if (domainRef.current) domainRef.current.removeAttribute("open");

    setSelectedCat(domain);

  };

  return (
    <div ref={containerRef} className="container mx-auto">
        <details ref={domainRef} className="dropdown dropdown-right">
        <summary className="btn m-1 flex items-center gap-2">
            {selectedCat && (
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedCat.cor }}/>
            )}
            {selectedCat ? selectedCat.nome : "Escolha a categoria"}
        </summary>
        <ul className="dropdown-content w-max menu p-2 shadow bg-base-100 rounded-box">
            {categorias.Categorias.map((categoria) => (
            <li key={categoria.nome}>
                <a className="flex items-center gap-2" onClick={() => handleSelectCat(categoria)}>
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: categoria.cor }}/>
                    {categoria.nome}
                </a>
            </li>
            ))}
        </ul>
        </details>
    </div>
    );
}

export default CategoryDropdown; 
