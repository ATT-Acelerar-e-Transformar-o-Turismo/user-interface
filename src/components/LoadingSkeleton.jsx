import React from 'react';

const LoadingSkeleton = () => {
  return (
    <div className='flex flex-row flex-wrap place-content-center gap-8 my-8 w-full'>
      {[1, 2, 3].map((index) => (
        <div key={index} className="w-80 h-96 bg-base-200 rounded-lg animate-pulse">
          <div className="h-48 bg-base-300 rounded-t-lg mb-4"></div>
          <div className="px-4 pb-4">
            <div className="h-6 bg-base-300 rounded mb-2"></div>
            <div className="h-4 bg-base-300 rounded w-3/4"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LoadingSkeleton;