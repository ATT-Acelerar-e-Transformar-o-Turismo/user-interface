import React from 'react';

export function highlightSearchTerms(text, query) {
  if (!text || !query) {
    return text;
  }

  const words = query.trim().split(/\s+/).filter(word => word.length > 0);

  if (words.length === 0) {
    return text;
  }

  const pattern = words.map(word =>
    word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  ).join('|');

  const regex = new RegExp(`(${pattern})`, 'gi');

  const parts = text.split(regex);

  return parts.map((part, index) => {
    const isMatch = words.some(word =>
      part.toLowerCase() === word.toLowerCase()
    );

    if (isMatch) {
      return React.createElement('strong', {
        key: index,
        className: 'font-bold text-blue-600'
      }, part);
    }
    return part;
  });
}

export function containsSearchTerms(text, query) {
  if (!text || !query) return false;

  const words = query.trim().split(/\s+/).filter(word => word.length > 0);
  const textLower = text.toLowerCase();

  return words.some(word => textLower.includes(word.toLowerCase()));
}
