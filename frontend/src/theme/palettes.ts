export type PaletteId =
    | "ocean-blue"
    | "emerald-green"
    | "royal-violet"
    | "teal"
    | "sunrise-amber"
    | "custom";

export type ThemeConfig = {
    palette: PaletteId;
    primaryColor: string;
    accentColor: string;
};

export type ThemePalette = {
    id: Exclude<PaletteId, "custom">;
    name: string;
    description: string;
    primaryColor: string;
    accentColor: string;
};

export const THEME_PALETTES: ThemePalette[] = [
    {
        id: "ocean-blue",
        name: "Ocean Blue",
        description: "A familiar, balanced blue with a teal accent.",
        primaryColor: "#2563EB",
        accentColor: "#0D9488",
    },
    {
        id: "emerald-green",
        name: "Emerald Green",
        description: "A fresh green paired with a confident blue.",
        primaryColor: "#059669",
        accentColor: "#2563EB",
    },
    {
        id: "royal-violet",
        name: "Royal Violet",
        description: "A rich violet balanced by a calm teal.",
        primaryColor: "#7C3AED",
        accentColor: "#0D9488",
    },
    {
        id: "teal",
        name: "Teal",
        description: "A calm teal with a warm amber accent.",
        primaryColor: "#0D9488",
        accentColor: "#D97706",
    },
    {
        id: "sunrise-amber",
        name: "Sunrise Amber",
        description: "A warm amber paired with a clear blue.",
        primaryColor: "#D97706",
        accentColor: "#2563EB",
    },
];

export const DEFAULT_THEME: ThemeConfig = {
    palette: "ocean-blue",
    primaryColor: "#2563EB",
    accentColor: "#0D9488",
};

export function getPaletteTheme(paletteId: Exclude<PaletteId, "custom">): ThemeConfig {
    const palette = THEME_PALETTES.find((item) => item.id === paletteId);

    if (!palette) {
        return DEFAULT_THEME;
    }

    return {
        palette: palette.id,
        primaryColor: palette.primaryColor,
        accentColor: palette.accentColor,
    };
}

export function isValidHexColor(value: string): boolean {
    return /^#[0-9A-Fa-f]{6}$/.test(value);
}
