import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import api from "../api/axios";

export type SchoolBranding = {
    name: string;
    tagline: string;
    logoUrl: string;
};

type SchoolBrandingContextValue = SchoolBranding & {
    logoSrc: string;
    refreshBranding: () => Promise<void>;
};

const emptyBranding: SchoolBranding = { name: "", tagline: "", logoUrl: "" };
const SchoolBrandingContext = createContext<SchoolBrandingContextValue | undefined>(undefined);

export function SchoolBrandingProvider({ children }: { children: ReactNode }) {
    const [branding, setBranding] = useState<SchoolBranding>(emptyBranding);

    const refreshBranding = useCallback(async () => {
        try {
            const { data } = await api.get<SchoolBranding>("/public/school-branding");
            setBranding({
                name: data.name || "",
                tagline: data.tagline || "",
                logoUrl: data.logoUrl || "",
            });
        } catch {
            // Branding is optional during initial setup; keep the product identity visible.
        }
    }, []);

    useEffect(() => {
        void refreshBranding();
    }, [refreshBranding]);

    const logoSrc = useMemo(() => {
        if (!branding.logoUrl) return "";
        const baseUrl = (api.defaults.baseURL || "/api").replace(/\/$/, "");
        return `${baseUrl}${branding.logoUrl}`;
    }, [branding.logoUrl]);

    return (
        <SchoolBrandingContext.Provider value={{ ...branding, logoSrc, refreshBranding }}>
            {children}
        </SchoolBrandingContext.Provider>
    );
}

export function useSchoolBranding() {
    const context = useContext(SchoolBrandingContext);
    if (!context) {
        throw new Error("useSchoolBranding must be used within SchoolBrandingProvider.");
    }
    return context;
}
