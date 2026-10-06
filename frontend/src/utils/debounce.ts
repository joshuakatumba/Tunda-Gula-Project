import { useState, useEffect } from "react";

/**
 * Debounce a value. Returns the debounced value that only updates
 * after `delay` ms of inactivity.
 *
 * Usage:
 *   const debouncedSearch = useDebounce(searchTerm, 400);
 *   useEffect(() => { fetchResults(debouncedSearch); }, [debouncedSearch]);
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
