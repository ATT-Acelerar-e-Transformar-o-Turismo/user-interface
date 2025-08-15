
import { useState, useEffect, useRef } from "react";
import categories from "../../public/categories.json"; 

function CategoryDropdown({ setSelectedCategory }) {
  const [selectedCat, setSelectedCat] = useState(null);
  const containerRef = useRef(null);
  const categoryRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        if (categoryRef.current) categoryRef.current.removeAttribute("open");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectCategory = (category) => {
    setSelectedCat(category);
    setSelectedCategory(category);
    if (categoryRef.current) categoryRef.current.removeAttribute("open");
  };

  const clearCategory = () => {
    setSelectedCat(null);
    setSelectedCategory(null);
  };

  return (
    <div ref={containerRef} className="container mx-auto">
      <details ref={categoryRef} className="dropdown dropdown-right">
        <summary className="btn m-1">
          {selectedCat?.name || "Escolha a categoria"}
        </summary>
        <ul className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
          {categories.map((category, index) => (
            <li key={category?.name || index}>
              <a onClick={() => handleSelectCategory(category)}>
                {category?.name || "Unnamed Category"}
              </a>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}

export default CategoryDropdown; 
