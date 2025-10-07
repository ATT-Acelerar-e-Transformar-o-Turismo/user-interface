import React from 'react';

/**
 * Utility functions for search functionality
 */

/**
 * Highlight search terms in text with bold formatting
 * @param {string} text - The text to highlight
 * @param {string} query - The search query
 * @returns {JSX.Element} - Text with highlighted terms
 */
export function highlightSearchTerms(text, query) {
  if (!text || !query) {
    return text;
  }

  // Split query into individual words and filter out empty strings
  const words = query.trim().split(/\s+/).filter(word => word.length > 0);
  
  if (words.length === 0) {
    return text;
  }

  // Create a regex pattern that matches any of the words (case-insensitive)
  const pattern = words.map(word => 
    // Escape special regex characters
    word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  ).join('|');
  
  const regex = new RegExp(`(${pattern})`, 'gi');
  
  // Split the text by the matches
  const parts = text.split(regex);
  
  return parts.map((part, index) => {
    // Check if this part matches any search word (case-insensitive)
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

/**
 * Check if a string contains any of the search words
 * @param {string} text - Text to check
 * @param {string} query - Search query
 * @returns {boolean} - True if text contains any search words
 */
export function containsSearchTerms(text, query) {
  if (!text || !query) return false;
  
  const words = query.trim().split(/\s+/).filter(word => word.length > 0);
  const textLower = text.toLowerCase();
  
  return words.some(word => textLower.includes(word.toLowerCase()));
}