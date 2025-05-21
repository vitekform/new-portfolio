import React, { createContext, useState, useEffect, useContext } from 'react';
import Cookies from 'js-cookie';

// Create the context
const ThemeContext = createContext();

// Custom hook to use the theme context
export const useTheme = () => useContext(ThemeContext);

// Theme provider component
export const ThemeProvider = ({ children }) => {
  // Initialize theme from cookie or system preference
  const [darkMode, setDarkMode] = useState(() => {
    // First check if there's a theme cookie
    const savedTheme = Cookies.get('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    // Otherwise use system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Update data-theme attribute when darkMode changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    // Save theme preference to cookie (expires in 365 days)
    Cookies.set('theme', darkMode ? 'dark' : 'light', { expires: 365 });
  }, [darkMode]);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(prevMode => !prevMode);
  };

  // Context value
  const value = {
    darkMode,
    toggleDarkMode
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;