import React, { createContext, useContext, useState, useEffect } from 'react';
const ThemeContext = createContext(undefined);
const THEME_STORAGE_KEY = 'qc-theme-mode';
export const ThemeProvider = ({ children }) => {
    const [themeMode, setThemeModeState] = useState(() => {
        const saved = localStorage.getItem(THEME_STORAGE_KEY);
        if (saved === 'light' || saved === 'dark' || saved === 'system') {
            return saved;
        }
        return 'system';
    });
    const [resolvedTheme, setResolvedTheme] = useState('light');
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const updateResolved = (mode) => {
            let resolved = 'light';
            if (mode === 'light') {
                resolved = 'light';
            }
            else if (mode === 'dark') {
                resolved = 'dark';
            }
            else {
                resolved = mediaQuery.matches ? 'dark' : 'light';
            }
            setResolvedTheme(resolved);
            document.documentElement.setAttribute('data-theme', resolved);
            document.body.setAttribute('data-theme', resolved);
        };
        updateResolved(themeMode);
        const handleSystemChange = (e) => {
            if (themeMode === 'system') {
                const resolved = e.matches ? 'dark' : 'light';
                setResolvedTheme(resolved);
                document.documentElement.setAttribute('data-theme', resolved);
                document.body.setAttribute('data-theme', resolved);
            }
        };
        mediaQuery.addEventListener('change', handleSystemChange);
        return () => mediaQuery.removeEventListener('change', handleSystemChange);
    }, [themeMode]);
    const setThemeMode = (mode) => {
        setThemeModeState(mode);
        localStorage.setItem(THEME_STORAGE_KEY, mode);
    };
    return (<ThemeContext.Provider value={{ themeMode, resolvedTheme, setThemeMode }}>
      {children}
    </ThemeContext.Provider>);
};
export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
