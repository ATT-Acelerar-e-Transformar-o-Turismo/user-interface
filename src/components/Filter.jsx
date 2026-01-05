const Filter = ({ filters, activeFilters, onFilterChange }) => {
  const handleCheckboxChange = (filterGroup, option) => {
    const filter = activeFilters.find(f => f.label === filterGroup);
    if (!filter) return;

    const newValues = filter.values.includes(option)
      ? filter.values.filter(item => item !== option)
      : [...filter.values, option];

    onFilterChange(filterGroup, newValues);
  };

  return (
    <details className="dropdown">
      <summary className="flex items-center justify-between w-32 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-green-500 cursor-pointer transition-colors">
        <span className="text-gray-700">Filtros</span>
        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </summary>
      <div className="dropdown-content bg-white border border-gray-100 rounded-lg z-50 w-52 p-4 shadow-lg mt-2">
        {filters.map(({ label, values }) => (
          <div key={label} className="mb-4 last:mb-0">
            <h4 className="font-semibold text-gray-900 mb-2 text-sm">{label}</h4>
            <div className="space-y-2">
              {values.map(option => (
                <label key={option} className="flex items-center cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={activeFilters.find(f => f.label === label)?.values?.includes(option) || false}
                    onChange={() => handleCheckboxChange(label, option)}
                    className="mr-3 rounded border-gray-300 text-green-600 focus:ring-green-500 transition-all"
                  />
                  <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">{option}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </details>
  );
};

export default Filter;