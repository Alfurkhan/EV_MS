import { useEffect, useState } from "react";
import { Check, Loader2, Palette, RotateCcw, Save, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import { useTheme } from "../../contexts/ThemeContext";
import {
    DEFAULT_THEME,
    THEME_PALETTES,
    getPaletteTheme,
    isValidHexColor,
    type PaletteId,
    type ThemeConfig,
} from "../../theme/palettes";

function getErrorMessage(error: any, fallback: string) {
    return error?.response?.data?.detail || error?.response?.data?.message || error?.response?.data?.error || fallback;
}

function ColorField({
    label,
    value,
    onChange,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
}) {
    return (
        <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
            <span className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2.5 transition focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-50">
                <input
                    type="color"
                    value={isValidHexColor(value) ? value : "#000000"}
                    onChange={(event) => onChange(event.target.value.toUpperCase())}
                    aria-label={`${label} color picker`}
                    className="size-9 cursor-pointer rounded-lg border-0 bg-transparent p-0"
                />
                <input
                    type="text"
                    value={value}
                    onChange={(event) => onChange(event.target.value.toUpperCase())}
                    maxLength={7}
                    spellCheck={false}
                    aria-label={`${label} HEX value`}
                    placeholder="#2563EB"
                    className="min-w-0 flex-1 bg-transparent px-1 py-2 font-mono text-sm font-medium text-slate-700 outline-none"
                />
            </span>
            {!isValidHexColor(value) && (
                <span className="mt-1.5 block text-xs text-red-600">Enter a valid HEX color, such as #2563EB.</span>
            )}
        </label>
    );
}

export default function AppearanceSettings() {
    const {
        theme,
        loading,
        loadError,
        setTheme,
        setPreviewTheme,
        clearPreviewTheme,
    } = useTheme();

    const [draft, setDraft] = useState<ThemeConfig>(theme);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!loading) {
            setDraft(theme);
        }
    }, [theme, loading]);

    useEffect(() => {
        if (!loading) {
            setPreviewTheme(draft);
        }
    }, [draft, loading, setPreviewTheme]);

    useEffect(() => {
        return () => clearPreviewTheme();
    }, [clearPreviewTheme]);

    const hasValidColors = isValidHexColor(draft.primaryColor) && isValidHexColor(draft.accentColor);
    const selectPalette = (paletteId: Exclude<PaletteId, "custom">) => {
        setDraft(getPaletteTheme(paletteId));
    };

    const updateColor = (key: "primaryColor" | "accentColor", value: string) => {
        setDraft((current) => ({ ...current, palette: "custom", [key]: value }));
    };

    const saveTheme = async () => {
        if (!hasValidColors) {
            toast.error("Please correct the HEX color values before saving.");
            return;
        }

        setSaving(true);
        try {
            await api.put("/admin/settings", {
                settings: {
                    "theme.palette": draft.palette,
                    "theme.primaryColor": draft.primaryColor.toUpperCase(),
                    "theme.accentColor": draft.accentColor.toUpperCase(),
                },
            });
            const savedTheme = {
                ...draft,
                primaryColor: draft.primaryColor.toUpperCase(),
                accentColor: draft.accentColor.toUpperCase(),
            };
            setDraft(savedTheme);
            setTheme(savedTheme);
            toast.success("Application theme saved successfully.");
        } catch (error) {
            toast.error(getErrorMessage(error, "Unable to save the application theme. Please try again."));
        } finally {
            setSaving(false);
        }
    };

    const resetToDefault = () => {
        setDraft(DEFAULT_THEME);
        toast.success("Default palette selected. Save changes to apply it across the school.");
    };

    if (loading) {
        return (
            <div className="flex min-h-72 items-center justify-center">
                <Loader2 className="animate-spin text-blue-600" size={25} />
                <span className="ml-3 text-sm text-slate-500">Loading appearance settings...</span>
            </div>
        );
    }

    return (
        <div className="space-y-8 pt-6">
            <section>
                <div className="mb-5">
                    <h3 className="text-base font-semibold text-slate-900">Choose a color palette</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                        Select a coordinated palette for the school-wide application appearance. Your selection is previewed before it is saved.
                    </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {THEME_PALETTES.map((palette) => {
                        const selected = draft.palette === palette.id;
                        return (
                            <button
                                key={palette.id}
                                type="button"
                                onClick={() => selectPalette(palette.id)}
                                aria-pressed={selected}
                                className={`rounded-2xl border p-4 text-left transition focus:outline-none focus:ring-4 focus:ring-blue-100 ${selected ? "border-blue-500 bg-blue-50/50 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"}`}
                            >
                                <span className="mb-3 flex items-center justify-between gap-3">
                                    <span className="text-sm font-semibold text-slate-800">{palette.name}</span>
                                    {selected && <Check size={17} className="text-blue-600" />}
                                </span>
                                <span className="mb-3 flex items-center gap-2">
                                    <span className="size-9 rounded-xl shadow-inner" style={{ backgroundColor: palette.primaryColor }} />
                                    <span className="size-9 rounded-xl shadow-inner" style={{ backgroundColor: palette.accentColor }} />
                                    <span className="ml-auto font-mono text-[11px] text-slate-400">{palette.primaryColor}</span>
                                </span>
                                <span className="block text-xs leading-5 text-slate-500">{palette.description}</span>
                            </button>
                        );
                    })}
                </div>
            </section>

            <section className="rounded-2xl border border-slate-200 p-5 sm:p-6">
                <div className="mb-5 flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                        <Palette size={19} />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-slate-900">Custom colors</h3>
                        <p className="mt-1 text-sm leading-5 text-slate-500">Fine-tune the primary and accent colors using the picker or a HEX value.</p>
                    </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                    <ColorField label="Primary color" value={draft.primaryColor} onChange={(value) => updateColor("primaryColor", value)} />
                    <ColorField label="Accent color" value={draft.accentColor} onChange={(value) => updateColor("accentColor", value)} />
                </div>
                {draft.palette === "custom" && (
                    <p className="mt-3 text-xs font-medium text-slate-500">Custom palette selected</p>
                )}
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200">
                <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
                    <Sparkles size={17} className="text-slate-500" />
                    <h3 className="text-sm font-semibold text-slate-800">Live preview</h3>
                    <span className="ml-auto text-xs text-slate-400">Preview only · Not yet saved</span>
                </div>
                <div className="space-y-4 bg-slate-50/70 p-5 sm:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-xl text-sm font-bold text-white" style={{ backgroundColor: draft.primaryColor }}>EV</div>
                            <div>
                                <p className="text-sm font-semibold text-slate-800">School dashboard</p>
                                <p className="text-xs text-slate-500">A preview of the application theme</p>
                            </div>
                        </div>
                        <span className="rounded-full px-3 py-1.5 text-xs font-semibold" style={{ backgroundColor: draft.accentColor + "18", color: draft.accentColor }}>Accent label</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <button type="button" className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm" style={{ backgroundColor: draft.primaryColor }}>Primary action</button>
                        <button type="button" className="rounded-xl border px-4 py-2.5 text-sm font-semibold" style={{ borderColor: draft.accentColor, color: draft.accentColor }}>Secondary action</button>
                        <span className="rounded-lg px-3 py-2 text-sm font-medium" style={{ backgroundColor: draft.primaryColor + "14", color: draft.primaryColor }}>Selected item</span>
                    </div>
                </div>
            </section>

            {loadError && (
                <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-5 text-amber-800">
                    {loadError} You can still choose a palette; saving will require the theme API to be reachable.
                </div>
            )}

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <button
                    type="button"
                    onClick={resetToDefault}
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                    <RotateCcw size={16} /> Reset to default
                </button>
                <button
                    type="button"
                    onClick={saveTheme}
                    disabled={saving || !hasValidColors}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {saving ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />}
                    {saving ? "Saving..." : "Save changes"}
                </button>
            </div>
            <p className="text-xs leading-5 text-slate-400">Theme changes are school-wide. Students and Faculty will see the saved appearance automatically; school logos and eVidyalaya identity are not changed.</p>
        </div>
    );
}
