import React, { createContext, useState, useEffect, useContext } from 'react';

const ThemeContext = createContext(null);

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem('mockai_theme');
    if (stored) return stored === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [appVersion, setAppVersion] = useState(() => {
    const stored = localStorage.getItem('mockai_app_version');
    return stored === 'v2' ? 'v2' : 'v1';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('mockai_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('mockai_theme', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    const root = document.documentElement;
    if (appVersion === 'v2') {
      root.classList.add('version-2');
      localStorage.setItem('mockai_app_version', 'v2');
    } else {
      root.classList.remove('version-2');
      localStorage.setItem('mockai_app_version', 'v1');
    }
  }, [appVersion]);

  const toggleTheme = () => setIsDark((prev) => !prev);
  const switchVersion = (v) => setAppVersion(v === 'v2' ? 'v2' : 'v1');
  const toggleVersion = () => setAppVersion((prev) => (prev === 'v1' ? 'v2' : 'v1'));

  const value = {
    isDark,
    toggleTheme,
    appVersion,
    switchVersion,
    toggleVersion,
    isVersion2: appVersion === 'v2'
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
