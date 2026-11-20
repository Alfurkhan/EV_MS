import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useLayoutEffect,
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

const THEME_CACHE_KEY = "ev_school_theme_v1";

type ThemeContextValue = {
    theme: ThemeConfig;
    loading: boolean;
    loadError: string;
    setTheme: (theme: ThemeConfig) => void;
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

function readCachedTheme(): ThemeConfig {
    try {
        const hasRestorableSession =
            !!localStorage.getItem("accessToken") &&
            !!localStorage.getItem("refreshToken") &&
            !!localStorage.getItem("roles");

        if (!hasRestorableSession) return DEFAULT_THEME;

        const cached = localStorage.getItem(THEME_CACHE_KEY);
        return cached
            ? normalizeTheme(JSON.parse(cached) as Partial<ThemeConfig>)
            : DEFAULT_THEME;
    } catch {
        return DEFAULT_THEME;
    }
}

function cacheTheme(theme: ThemeConfig) {
    try {
        localStorage.setItem(THEME_CACHE_KEY, JSON.stringify(theme));
    } catch (error) {
        console.warn("Unable to cache school theme:", error);
    }
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

    // Reuse the last server-confirmed theme immediately on a browser refresh.
    const [theme, setThemeState] = useState<ThemeConfig>(readCachedTheme);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");

    useEffect(() => {
        if (authLoading) return;

        let active = true;

        if (!isAuthenticated) {
            setThemeState(DEFAULT_THEME);
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
                const savedTheme = normalizeTheme(data);
                setThemeState(savedTheme);
                cacheTheme(savedTheme);
            })
            .catch((error) => {
                if (!active) return;

                // Keep the cached theme visible if the API is temporarily unavailable.
                console.error("Failed to load school theme:", error);
                setLoadError(
                    error?.response?.data?.detail ||
                        error?.response?.data?.message ||
                        "Saved school theme could not be refreshed. The last saved appearance is being used.",
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
        const normalizedTheme = normalizeTheme(nextTheme);
        setThemeState(normalizedTheme);
        cacheTheme(normalizedTheme);
        setLoadError("");
    }, []);

    // Apply before the browser paints the next frame after React updates.
    useLayoutEffect(() => {
        applyThemeVariables(theme);
    }, [theme]);

    const value = useMemo(
        () => ({ theme, loading, loadError, setTheme }),
        [theme, loading, loadError, setTheme],
    );

    return (
        <ThemeContext.Provider value={value}>
            {authLoading || (isAuthenticated && loading) ? (
                <div className="min-h-screen bg-slate-50" aria-busy="true" />
            ) : (
                children
            )}
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
