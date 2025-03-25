const Filter = ({ filters, activeFilters, onFilterChange }) => {
  const handleCheckboxChange = (filterGroup, option) => {
    const filter = activeFilters.find(f => f.label === filterGroup);
    const newValues = filter.values.includes(option)
      ? filter.values.filter(item => item !== option)
      : [...filter.values, option];

    onFilterChange(filterGroup, newValues);
  };

  return (
    <details className="dropdown">
      <summary className="btn mt-6 w-24">Filters &#x25BC;</summary>
      <div className="dropdown-content bg-base-200 rounded-box z-1 w-52 p-2 shadow-sm">
        {filters.map(({ label, values }) => (
          <div key={label}>
            <h4 className="font-bold">{label}</h4>
            {values.map(option => (
              <label key={option} className="flex items-center">
                <input
                  type="checkbox"
                  checked={activeFilters.find(f => f.label === label).values.includes(option)}
                  onChange={() => handleCheckboxChange(label, option)}
                  className="mr-2"
                />
                {option}
              </label>
            ))}
          </div>
        ))}
      </div>
    </details>
  );
};

export default Filter;