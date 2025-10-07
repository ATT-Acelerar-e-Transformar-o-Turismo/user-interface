import PropTypes from 'prop-types';

export default function Pagination({
  currentPage,
  totalItems,
  pageSize,
  hasNextPage = null,
  onPageChange,
  loading = false,
  showItemCount = false,
  className = "",
  itemName = "items"
}) {
  // Calculate pagination info
  const totalPages = Math.ceil(totalItems / pageSize);
  const hasNext = hasNextPage !== null ? hasNextPage : currentPage < totalPages - 1;
  const startIndex = currentPage * pageSize + 1;
  const endIndex = Math.min((currentPage + 1) * pageSize, totalItems);

  // Don't render if only one page and no items
  if (totalItems === 0 || (totalPages <= 1 && !hasNext && currentPage === 0)) {
    return null;
  }

  const handlePrevious = () => {
    if (currentPage > 0) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (hasNext) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className={`flex flex-col items-center mt-4 gap-2 ${className}`}>
      {/* Navigation Controls */}
      <div className="flex justify-center gap-2">
        <button 
          className="btn btn-sm" 
          onClick={handlePrevious}
          disabled={currentPage === 0 || loading}
        >
          Previous
        </button>
        <span className="flex items-center px-4">
          Page {currentPage + 1}{totalPages > 0 && ` of ${totalPages}`}
        </span>
        <button 
          className="btn btn-sm" 
          onClick={handleNext}
          disabled={!hasNext || loading}
        >
          Next
        </button>
      </div>
      
      {/* Item Count Display */}
      {showItemCount && totalItems > 0 && (
        <div className="text-sm text-base-content/60">
          Showing {startIndex} - {endIndex} of {totalItems} {itemName}
          {totalPages > 0 && ` (Page ${currentPage + 1} of ${totalPages})`}
        </div>
      )}
    </div>
  );
}

Pagination.propTypes = {
  currentPage: PropTypes.number.isRequired,
  totalItems: PropTypes.number.isRequired,
  pageSize: PropTypes.number.isRequired,
  hasNextPage: PropTypes.bool,
  onPageChange: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  showItemCount: PropTypes.bool,
  className: PropTypes.string,
  itemName: PropTypes.string
};