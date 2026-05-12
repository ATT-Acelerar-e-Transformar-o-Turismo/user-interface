import { useEffect, useState } from 'react';

// Returns `value` after it has been stable for `delay` ms. Used by the admin
// list pages to keep typing snappy — without it every keystroke triggered a
// loadData() that flipped `loading` to true and unmounted the entire page
// including the search input, so the user lost focus mid-word.
export default function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handle);
  }, [value, delay]);
  return debounced;
}
