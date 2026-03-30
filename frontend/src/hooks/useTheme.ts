import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

const THEME_KEY = 'pfm-theme';

const getSystemTheme = (): Theme => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
};

const getStoredTheme = (): Theme | null => {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(THEME_KEY);
    return stored === 'light' || stored === 'dark' ? stored : null;
};

export function useTheme() {
    const [theme, setThemeState] = useState<Theme>(() => {
        return getStoredTheme() ?? getSystemTheme();
    });

    useEffect(() => {
        const root = document.documentElement;
        root.setAttribute('data-theme', theme);
        localStorage.setItem(THEME_KEY, theme);
    }, [theme]);

    const toggleTheme = () => {
        setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
    };

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
    };

    return { theme, toggleTheme, setTheme };
}
