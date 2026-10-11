"use client";

import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";

export type ThemeMode = "light" | "dark" | "system";
export type ThemeAccent = "blue" | "purple";

interface ThemeContextValue {
    readonly mode: ThemeMode;
    readonly accent: ThemeAccent;
    readonly isDark: boolean;
    readonly setMode: (mode: ThemeMode) => void;
    readonly setAccent: (accent: ThemeAccent) => void;
}

const THEME_STORAGE_KEY = "noptrix-theme-mode";
const ACCENT_STORAGE_KEY = "noptrix-theme-accent";

const ThemeContext = createContext<ThemeContextValue | null>(null);

const isThemeMode = (value: string | null): value is ThemeMode =>
    value === "light" || value === "dark" || value === "system";

const isThemeAccent = (value: string | null): value is ThemeAccent =>
    value === "blue" || value === "purple";

export function ThemeProvider({ children }: { readonly children: ReactNode }) {
    const [isDark, setIsDark] = useState(false);
    const [mode, setMode] = useState<ThemeMode>(() => {
        if (typeof window === "undefined") {
            return "system";
        }

        const storedMode = window.localStorage.getItem(THEME_STORAGE_KEY);
        return isThemeMode(storedMode) ? storedMode : "system";
    });
    const [accent, setAccent] = useState<ThemeAccent>(() => {
        if (typeof window === "undefined") {
            return "blue";
        }

        const storedAccent = window.localStorage.getItem(ACCENT_STORAGE_KEY);
        return isThemeAccent(storedAccent) ? storedAccent : "blue";
    });

    useEffect(() => {
        window.localStorage.setItem(THEME_STORAGE_KEY, mode);
        window.localStorage.setItem(ACCENT_STORAGE_KEY, accent);

        const media = window.matchMedia("(prefers-color-scheme: dark)");

        const applyMode = () => setIsDark(
            mode === "dark" || (mode === "system" && media.matches),
        );
        applyMode();

        if (mode !== "system") {
            return;
        }

        media.addEventListener("change", applyMode);
        return () => media.removeEventListener("change", applyMode);
    }, [accent, mode]);

    const value = useMemo(
        () => ({ mode, accent, isDark, setMode, setAccent }),
        [accent, isDark, mode],
    );

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);

    if (!context) {
        throw new Error("useTheme must be used within a ThemeProvider.");
    }

    return context;
}
