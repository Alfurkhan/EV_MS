import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
    ArrowLeft, Building2, FileText, Globe, Mail, MapPin, Phone, Pencil, GraduationCap,
    Loader2, School, type LucideIcon,
} from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../contexts/AuthContext";
import { useSchoolBranding } from "../contexts/SchoolBrandingContext";

type SchoolProfileDetails = {
    name: string;
    tagline: string;
    about: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    logoUrl: string;
};

function Detail({
    icon: Icon,
    label,
    children,
}: {
    icon: LucideIcon;
    label: string;
    children: ReactNode;
}) {
    return (
        <div className="flex min-w-0 gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                <Icon size={18} strokeWidth={1.9} />
            </span>
            <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
                <div className="mt-1 break-words text-sm font-medium leading-6 text-slate-800">{children}</div>
            </div>
        </div>
    );
}

export default function SchoolProfilePage() {
    const [school, setSchool] = useState<SchoolProfileDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const { hasRole } = useAuth();
    const { logoSrc } = useSchoolBranding();

    useEffect(() => {
        let active = true;
        api.get<SchoolProfileDetails>("/school-profile")
            .then(({ data }) => {
                if (active) setSchool(data);
            })
            .catch((requestError) => {
                if (active) setError(
                    requestError?.response?.data?.detail ||
                    requestError?.response?.data?.message ||
                    "Unable to load the school profile. Please try again."
                );
            })
            .finally(() => active && setLoading(false));
        return () => { active = false; };
    }, []);

    if (loading) {
        return (
            <div className="flex min-h-80 items-center justify-center gap-3 text-sm text-slate-500">
                <Loader2 size={22} className="animate-spin text-brand" />
                Loading school profile...
            </div>
        );
    }

    if (error || !school) {
        return (
            <div className="mx-auto flex min-h-80 max-w-xl flex-col items-center justify-center text-center">
                <span className="flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                    <School size={26} />
                </span>
                <h1 className="mt-4 text-lg font-semibold text-slate-900">School profile unavailable</h1>
                <p className="mt-2 text-sm text-slate-500">{error || "School details could not be found."}</p>
                <Link to="/dashboard" className="mt-5 text-sm font-semibold text-brand hover:text-brand">Return to dashboard</Link>
            </div>
        );
    }

    const resolvedLogo = school.logoUrl
        ? `${(api.defaults.baseURL || "/api").replace(/\/$/, "")}${school.logoUrl}`
        : logoSrc;

    return (
        <div className="mx-auto max-w-5xl space-y-6 pb-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900">
                    <ArrowLeft size={17} /> Back to dashboard
                </Link>
                {hasRole("ROLE_ADMIN") && (
                    <Link to="/settings" className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2">
                        <Pencil size={15} /> Edit school profile
                    </Link>
                )}
            </div>

            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="h-2 bg-gradient-to-r from-brand via-brand to-accent" />
                <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:p-9">
                    <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-3">
                        {resolvedLogo ? (
                            <img src={resolvedLogo} alt={school.name ? `${school.name} logo` : "School logo"} className="h-full w-full object-contain" />
                        ) : (
                            <Building2 size={42} className="text-brand" />
                        )}
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">School profile</p>
                        <h1 className="mt-2 break-words text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{school.name || "Your School"}</h1>
                        {school.tagline && <p className="mt-2 text-base text-slate-500">{school.tagline}</p>}
                    </div>
                </div>
            </section>

            {school.about && (
                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
                    <div className="flex items-center gap-3">
                        <span className="flex size-9 items-center justify-center rounded-xl bg-brand-soft text-brand">
                            <FileText size={18} strokeWidth={1.9} />
                        </span>
                        <h2 className="text-base font-semibold text-slate-900">About our school</h2>
                    </div>
                    <p className="mt-4 max-w-4xl whitespace-pre-line text-sm leading-7 text-slate-600">{school.about}</p>
                </section>
            )}

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
                <div className="mb-6 flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-xl bg-brand-soft text-brand">
                        <Building2 size={18} strokeWidth={1.9} />
                    </span>
                    <h2 className="text-base font-semibold text-slate-900">School information</h2>
                </div>
                <div className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
                    {school.address && <Detail icon={MapPin} label="Address">{school.address}</Detail>}
                    {school.phone && <Detail icon={Phone} label="Contact number">{school.phone}</Detail>}
                    {school.email && <Detail icon={Mail} label="Official email"><a href={`mailto:${school.email}`} className="transition-colors hover:text-brand hover:underline">{school.email}</a></Detail>}
                    {school.website && <Detail icon={Globe} label="Website"><a href={school.website} target="_blank" rel="noreferrer" className="text-brand transition-colors hover:text-brand hover:underline">{school.website}</a></Detail>}
                    {!school.address && !school.phone && !school.email && !school.website && (
                        <p className="text-sm text-slate-400">Additional school contact information has not been added yet.</p>
                    )}
                </div>
            </section>

            <div className="flex items-center justify-center gap-2 py-2 text-xs text-slate-400">
                <GraduationCap size={15} />
                <span>Powered by eVidyalaya</span>
            </div>
        </div>
    );
}
