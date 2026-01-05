import React from 'react';

const BlogLoadingSkeleton = () => {
  return (
    <div className="animate-pulse bg-base-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Title Placeholder */}
        <div className="h-10 bg-base-200 rounded w-3/4 mb-4"></div>
        {/* Meta Info Placeholder */}
        <div className="h-4 bg-base-200 rounded w-1/3 mb-8"></div>

        {/* Image Placeholder (optional) */}
        <div className="h-64 bg-base-200 rounded-lg mb-8"></div>

        {/* Content Lines Placeholder */}
        <div className="space-y-3">
          <div className="h-5 bg-base-200 rounded w-full"></div>
          <div className="h-5 bg-base-200 rounded w-11/12"></div>
          <div className="h-5 bg-base-200 rounded w-full"></div>
          <div className="h-5 bg-base-200 rounded w-10/12"></div>
          <div className="h-5 bg-base-200 rounded w-full"></div>
          <div className="h-5 bg-base-200 rounded w-9/12"></div>
        </div>

        {/* More Content Lines */}
        <div className="mt-8 space-y-3">
          <div className="h-5 bg-base-200 rounded w-full"></div>
          <div className="h-5 bg-base-200 rounded w-11/12"></div>
          <div className="h-5 bg-base-200 rounded w-full"></div>
        </div>
      </div>
    </div>
  );
};

export default BlogLoadingSkeleton;
