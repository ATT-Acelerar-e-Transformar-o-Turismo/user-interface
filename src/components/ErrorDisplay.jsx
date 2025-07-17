import React from 'react';

const ErrorDisplay = ({ error, onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center my-8 p-8">
      <div className="alert alert-error max-w-md">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-6 w-6 shrink-0 stroke-current" 
          fill="none" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth="2" 
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" 
          />
        </svg>
        <div>
          <h3 className="font-bold">Error loading domains</h3>
          <div className="text-xs">{error}</div>
        </div>
      </div>
      {onRetry && (
        <button className="btn btn-outline btn-sm mt-4" onClick={onRetry}>
          Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorDisplay;