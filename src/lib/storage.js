import { useState, useEffect, useCallback } from "react";

export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch {
      /* ignore corrupt storage */
    }
    const initial = typeof initialValue === "function" ? initialValue() : initialValue;
    localStorage.setItem(key, JSON.stringify(initial));
    return initial;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  const reset = useCallback(() => {
    const initial = typeof initialValue === "function" ? initialValue() : initialValue;
    setValue(initial);
  }, [initialValue]);

  return [value, setValue, reset];
}
