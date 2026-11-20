import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";
import api from "../api/axios";
import { useAuth } from "./AuthContext";
import {
    DEFAULT_THEME,
    THEME_PALETTES,
    isValidHexColor,
    type PaletteId,
    type ThemeConfig,
} from "../theme/palettes";

type ThemeContextValue = {
    theme: ThemeConfig;
    previewTheme: ThemeConfig | null;
    loading: boolean;
    loadError: string;
    setTheme: (theme: ThemeConfig) => void;
    setPreviewTheme: (theme: ThemeConfig) => void;
    clearPreviewTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function normalizeTheme(data: Partial<ThemeConfig> | undefined): ThemeConfig {
    const validPalette =
        THEME_PALETTES.some((item) => item.id === data?.palette) ||
        data?.palette === "custom";

    return {
        palette: validPalette
            ? (data!.palette as PaletteId)
            : DEFAULT_THEME.palette,
        primaryColor:
            typeof data?.primaryColor === "string" &&
            isValidHexColor(data.primaryColor)
                ? data.primaryColor.toUpperCase()
                : DEFAULT_THEME.primaryColor,
        accentColor:
            typeof data?.accentColor === "string" &&
            isValidHexColor(data.accentColor)
                ? data.accentColor.toUpperCase()
                : DEFAULT_THEME.accentColor,
    };
}

function applyThemeVariables(theme: ThemeConfig) {
    const root = document.documentElement;

    root.style.setProperty("--ev-primary", theme.primaryColor);
    root.style.setProperty(
        "--ev-primary-hover",
        "color-mix(in srgb, var(--ev-primary) 88%, black)",
    );
    root.style.setProperty(
        "--ev-primary-soft",
        "color-mix(in srgb, var(--ev-primary) 10%, white)",
    );
    root.style.setProperty("--ev-accent", theme.accentColor);
    root.style.setProperty(
        "--ev-accent-soft",
        "color-mix(in srgb, var(--ev-accent) 10%, white)",
    );
    root.dataset.theme = theme.palette;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const { isAuthenticated, loading: authLoading, user } = useAuth();

    const [theme, setThemeState] = useState<ThemeConfig>(DEFAULT_THEME);
    const [previewTheme, setPreviewThemeState] =
        useState<ThemeConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");

    useEffect(() => {
        if (authLoading) return;

        let active = true;

        if (!isAuthenticated) {
            setThemeState(DEFAULT_THEME);
            setPreviewThemeState(null);
            setLoadError("");
            setLoading(false);

            return () => {
                active = false;
            };
        }

        setLoading(true);
        setLoadError("");

        api.get<Partial<ThemeConfig>>("/theme")
            .then(({ data }) => {
                if (!active) return;

                setThemeState(normalizeTheme(data));
                setPreviewThemeState(null);
            })
            .catch((error) => {
                if (!active) return;

                console.error("Failed to load school theme:", error);
                setThemeState(DEFAULT_THEME);
                setLoadError(
                    error?.response?.data?.detail ||
                        error?.response?.data?.message ||
                        "Saved school theme could not be loaded. The default palette is being used.",
                );
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, [authLoading, isAuthenticated, user?.accessToken]);

    const setTheme = useCallback((nextTheme: ThemeConfig) => {
        setThemeState(nextTheme);
        setPreviewThemeState(null);
        setLoadError("");
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
            loading,
            loadError,
            setTheme,
            setPreviewTheme,
            clearPreviewTheme,
        }),
        [
            theme,
            previewTheme,
            loading,
            loadError,
            setTheme,
            setPreviewTheme,
            clearPreviewTheme,
        ],
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
        throw new Error("useTheme must be used within ThemeProvider.");
    }

    return context;
}
