import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";
import { DEFAULT_THEME, type ThemeConfig } from "../theme/palettes";

type ThemeContextValue = {
    theme: ThemeConfig;
    previewTheme: ThemeConfig | null;
    setTheme: (theme: ThemeConfig) => void;
    setPreviewTheme: (theme: ThemeConfig) => void;
    clearPreviewTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function applyThemeVariables(theme: ThemeConfig) {
    const root = document.documentElement;

    root.style.setProperty("--ev-primary", theme.primaryColor);
    root.style.setProperty("--ev-primary-hover", "color-mix(in srgb, var(--ev-primary) 88%, black)");
    root.style.setProperty("--ev-primary-soft", "color-mix(in srgb, var(--ev-primary) 10%, white)");
    root.style.setProperty("--ev-accent", theme.accentColor);
    root.style.setProperty("--ev-accent-soft", "color-mix(in srgb, var(--ev-accent) 10%, white)");
    root.dataset.theme = theme.palette;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<ThemeConfig>(DEFAULT_THEME);
    const [previewTheme, setPreviewThemeState] = useState<ThemeConfig | null>(null);

    const setTheme = useCallback((nextTheme: ThemeConfig) => {
        setThemeState(nextTheme);
        setPreviewThemeState(null);
    }, []);

    const setPreviewTheme = useCallback((nextTheme: ThemeConfig) => {
        setPreviewThemeState(nextTheme);
    }, []);

    const clearPreviewTheme = useCallback(() => {
        setPreviewThemeState(null);
    }, []);

    useEffect(() => {
        applyThemeVariables(previewTheme ?? theme);
    }, [theme, previewTheme]);

    const value = useMemo(
        () => ({
            theme,
            previewTheme,
            setTheme,
            setPreviewTheme,
            clearPreviewTheme,
        }),
        [theme, previewTheme, setTheme, setPreviewTheme, clearPreviewTheme],
    );

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
    const context = useContext(ThemeContext);

    if (!context) {
        throw new Error("useTheme must be used within ThemeProvider.");
    }

    return context;
}
