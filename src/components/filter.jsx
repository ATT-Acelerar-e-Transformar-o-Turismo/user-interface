const Filter = ({ filters, activeFilters, onFilterChange }) => {
  const handleCheckboxChange = (filterGroup, option) => {
    const newActiveFilters = activeFilters[filterGroup].includes(option)
      ? activeFilters[filterGroup].filter(item => item !== option) // Remove o filtro se já estiver ativo
      : [...activeFilters[filterGroup], option]; // Adiciona o filtro se não estiver ativo

    onFilterChange(filterGroup, newActiveFilters);
  };

  return (
    <details className="dropdown">
      <summary className="btn mt-6 w-24">Filters &#x25BC;</summary>
      <div className="dropdown-content bg-base-200 rounded-box z-1 w-52 p-2 shadow-sm">
        {Object.entries(filters).map(([filterGroup, options]) => (
          <div key={filterGroup}>
            <h4 className="font-bold">{filterGroup}</h4>
            {options.map(option => (
              <label key={option} className="flex items-center">
                <input
                  type="checkbox"
                  checked={activeFilters[filterGroup].includes(option)}
                  onChange={() => handleCheckboxChange(filterGroup, option)}
                  className="mr-2"
                />
                {option}
              </label>
            ))}
          </div>
        ))}
      </div>
    </details>
  )
}

export default Filter