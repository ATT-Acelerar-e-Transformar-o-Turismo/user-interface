import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import indicatorService from '../services/indicatorService';
import { highlightSearchTerms } from '../services/searchUtils';

export default function SearchBox() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [recentItems, setRecentItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const dropdownRef = useRef(null);
  const itemRefs = useRef([]);

  // Load recent items from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('recentItems');
    if (saved) {
      try {
        setRecentItems(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading recent items:', e);
      }
    }
  }, []);

  // Handle clicks outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        searchRef.current && 
        !searchRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
        setIsExpanded(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search for suggestions
  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      setSelectedIndex(-1);
      itemRefs.current = [];
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        setLoading(true);
        const results = await indicatorService.search(query.trim(), 8);
        setSuggestions(results);
        setSelectedIndex(-1); // Reset selection when new results come in
        itemRefs.current = []; // Reset refs when new results come in
      } catch (error) {
        console.error('Search error:', error);
        setSuggestions([]);
        setSelectedIndex(-1);
        itemRefs.current = [];
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const saveRecentItem = (item) => {
    if (!item) return;
    
    let newItem;
    if (typeof item === 'string') {
      // Search term
      newItem = {
        type: 'search',
        value: item.trim(),
        timestamp: Date.now()
      };
    } else {
      // Indicator object
      newItem = {
        type: 'indicator',
        value: {
          id: item.id,
          name: item.name,
          subdomain: item.subdomain,
          domain: item.domain
        },
        timestamp: Date.now()
      };
    }
    
    // Remove existing item with same type and value
    const filtered = recentItems.filter(existingItem => {
      if (existingItem.type !== newItem.type) return true;
      if (newItem.type === 'search') {
        return existingItem.value !== newItem.value;
      } else {
        return existingItem.value.id !== newItem.value.id;
      }
    });
    
    const updated = [newItem, ...filtered].slice(0, 8); // Keep only last 8 items
    
    setRecentItems(updated);
    localStorage.setItem('recentItems', JSON.stringify(updated));
  };

  const handleFocus = () => {
    setIsExpanded(true);
    setShowDropdown(true);
    setSelectedIndex(-1);
  };

  const handleSearch = (searchTerm) => {
    if (!searchTerm.trim()) return;
    
    saveRecentItem(searchTerm);
    setQuery('');
    setShowDropdown(false);
    setIsExpanded(false);
    
    // Navigate to search results page using DomainTemplate
    navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
  };

  const scrollToSelectedItem = (index) => {
    if (index >= 0 && itemRefs.current[index] && dropdownRef.current) {
      const selectedElement = itemRefs.current[index];
      const container = dropdownRef.current;
      
      const elementTop = selectedElement.offsetTop;
      const elementBottom = elementTop + selectedElement.offsetHeight;
      const containerTop = container.scrollTop;
      const containerBottom = containerTop + container.clientHeight;
      
      if (elementTop < containerTop) {
        // Element is above visible area, scroll up
        container.scrollTop = elementTop;
      } else if (elementBottom > containerBottom) {
        // Element is below visible area, scroll down
        container.scrollTop = elementBottom - container.clientHeight;
      }
    }
  };

  const handleKeyDown = (e) => {
    const currentItems = query.trim().length >= 2 ? suggestions : recentItems;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const newIndex = selectedIndex < currentItems.length - 1 ? selectedIndex + 1 : selectedIndex;
      setSelectedIndex(newIndex);
      scrollToSelectedItem(newIndex);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const newIndex = selectedIndex > 0 ? selectedIndex - 1 : -1;
      setSelectedIndex(newIndex);
      scrollToSelectedItem(newIndex);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < currentItems.length) {
        const selectedItem = currentItems[selectedIndex];
        if (query.trim().length >= 2) {
          // Selected from suggestions - navigate to indicator
          handleSuggestionClick(selectedItem);
        } else {
          // Selected from recent items - handle based on type
          handleRecentItemClick(selectedItem);
        }
      } else {
        // No selection, perform search with current query
        handleSearch(query);
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setSelectedIndex(-1);
    }
  };

  const handleSuggestionClick = (indicator) => {
    saveRecentItem(indicator);
    navigate(`/indicator/${indicator.id}`);
    setShowDropdown(false);
    setIsExpanded(false);
    setQuery('');
  };

  const handleRecentItemClick = (recentItem) => {
    if (recentItem.type === 'search') {
      handleSearch(recentItem.value);
    } else if (recentItem.type === 'indicator') {
      navigate(`/indicator/${recentItem.value.id}`);
      setShowDropdown(false);
      setIsExpanded(false);
      setQuery('');
    }
  };

  const clearRecentItems = () => {
    setRecentItems([]);
    localStorage.removeItem('recentItems');
  };

  const renderDropdownContent = () => {
    if (query.trim().length >= 2) {
      // Show search suggestions
      return (
        <>
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <span className="loading loading-spinner loading-sm"></span>
            </div>
          ) : suggestions.length > 0 ? (
            <>
              {suggestions.map((indicator, index) => (
                <div
                  key={indicator.id}
                  ref={(el) => itemRefs.current[index] = el}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                    selectedIndex === index ? 'bg-base-200' : 'hover:bg-base-200'
                  }`}
                  onClick={() => handleSuggestionClick(indicator)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  title={indicator.name}
                >
                  <i 
                    className="fas fa-chart-line text-sm" 
                    style={{ color: indicator.domain?.color || '#6366f1' }}
                  ></i>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {highlightSearchTerms(indicator.name, query)}
                    </div>
                    {indicator.subdomain && (
                      <div className="text-xs text-base-content/60 truncate">
                        {highlightSearchTerms(indicator.subdomain, query)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="text-center py-4 text-base-content/60 text-sm">
              No indicators found
            </div>
          )}
        </>
      );
    } else {
      // Show recent items (searches and indicators)
      return (
        <>
          {recentItems.length > 0 && (
            <div className="flex justify-end py-2 px-4">
              <button
                onClick={clearRecentItems}
                className="text-xs text-base-content/50 hover:text-base-content/80 transition-colors"
              >
                Clear
              </button>
            </div>
          )}
          {recentItems.length > 0 ? (
            <>
              {recentItems.map((item, index) => (
                <div
                  key={`${item.type}-${item.timestamp}-${index}`}
                  ref={(el) => itemRefs.current[index] = el}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                    selectedIndex === index ? 'bg-base-200' : 'hover:bg-base-200'
                  }`}
                  onClick={() => handleRecentItemClick(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  {item.type === 'search' ? (
                    <>
                      <i className="fas fa-history text-base-content/40 text-sm"></i>
                      <span className="text-sm">{item.value}</span>
                    </>
                  ) : (
                    <>
                      <i 
                        className="fas fa-chart-line text-sm" 
                        style={{ color: item.value.domain?.color || '#6366f1' }}
                      ></i>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {item.value.name}
                        </div>
                        {item.value.subdomain && (
                          <div className="text-xs text-base-content/60 truncate">
                            {item.value.subdomain}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </>
          ) : (
            <div className="text-center py-4 text-base-content/60 text-sm">
              No recent items
            </div>
          )}
        </>
      );
    }
  };

  return (
    <>
      {/* Dark backdrop overlay */}
      <div 
        className={`fixed inset-0 bg-black/20 z-40 transition-opacity duration-500 ease-in-out ${
          showDropdown ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        style={{ backdropFilter: 'blur(3px)' }}
        onClick={() => {
          setShowDropdown(false);
          setIsExpanded(false);
        }}
      />
      
      <div className="relative z-50" ref={searchRef}>
        <label className={`input flex items-center gap-2 transition-all duration-300 focus-within:outline-none ${
          isExpanded ? 'w-96' : 'w-64'
        } ${showDropdown ? 'rounded-b-none' : ''}`}>
          <svg 
            className="h-4 w-4 opacity-70 cursor-pointer" 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24"
            onClick={() => handleSearch(query)}
          >
            <g strokeLinejoin="round" strokeLinecap="round" strokeWidth="2" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.3-4.3"></path>
            </g>
          </svg>
          <input
            type="search"
            className="grow focus:outline-none"
            placeholder="Search for indicators..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="opacity-70 hover:opacity-100 transition-opacity"
            >
              <i className="fas fa-times text-sm"></i>
            </button>
          )}
        </label>

        {/* Dropdown */}
        {showDropdown && (
          <div
            ref={dropdownRef}
            className="absolute top-full left-0 right-0 bg-base-100 border border-base-300 border-t-0 rounded-b-lg shadow-lg z-50 max-h-80 overflow-y-auto"
          >
            {renderDropdownContent()}
          </div>
        )}
      </div>
    </>
  );
}