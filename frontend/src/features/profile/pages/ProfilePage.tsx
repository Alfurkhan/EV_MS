import Toast from "../../../components/common/Toast";
import EditProfileModal from "../components/EditProfileModal";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, BookOpen, BriefcaseBusiness, Building2 } from "lucide-react";

import { useProfile } from "../../../contexts/ProfileContext";
import { useSchoolBranding } from "../../../contexts/SchoolBrandingContext";
import ProfileCard from "../components/ProfileCard";
import ProfileInfo from "../components/ProfileInfo";

import { getProfile } from "../services/profileService";

import type { Profile } from "../types/profile";

function SchoolAffiliation({ role }: { role: string | null }) {
    const { name, tagline, logoSrc } = useSchoolBranding();

    if (!name || (role !== "ROLE_STUDENT" && role !== "ROLE_FACULTY")) {
        return null;
    }

    const isStudent = role === "ROLE_STUDENT";
    const AffiliationIcon = isStudent ? BookOpen : BriefcaseBusiness;

    return (
        <Link
            to="/school-profile"
            className="group my-5 flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition-all duration-200 hover:border-brand/20 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            aria-label={`View ${name} school profile`}
        >
            <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-slate-50 p-1.5">
                {logoSrc ? (
                    <img src={logoSrc} alt="" className="h-full w-full object-contain" />
                ) : (
                    <Building2 size={21} className="text-brand" />
                )}
            </span>

            <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <AffiliationIcon size={14} strokeWidth={2} className="shrink-0 text-brand" />
                    {isStudent ? "Studying at" : "Teaching at"}
                </span>
                <span className="mt-0.5 block truncate text-sm font-semibold text-slate-800 transition-colors group-hover:text-brand">
                    {name}
                </span>
                {tagline && (
                    <span className="mt-0.5 block truncate text-xs text-slate-500">
                        {tagline}
                    </span>
                )}
            </span>

            <span className="flex size-9 shrink-0 items-center justify-center rounded-full text-slate-400 transition-all group-hover:bg-brand-soft group-hover:text-brand">
                <ArrowUpRight size={17} />
            </span>
        </Link>
    );
}

export default function ProfilePage() {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [open, setOpen] = useState(false);
    const { refreshProfile } = useProfile();

    const [toast, setToast] = useState<{
        type: "success" | "error";
        message: string;
    } | null>(null);

    useEffect(() => {
        getProfile()
            .then(setProfile)
            .catch(console.error);
    }, []);

    if (!profile) {
        return (
            <div className="text-center mt-20">
                Loading Profile...
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto">
            <ProfileCard
                profile={profile}
                onEdit={() => setOpen(true)}
            />

            <SchoolAffiliation role={profile.role} />

            <ProfileInfo profile={profile} />

            {open && (
                <EditProfileModal
                    profile={profile}
                    onClose={() => setOpen(false)}
                    onUpdated={(updatedProfile) => {
                        setProfile((currentProfile) => ({
                            ...currentProfile,
                            ...updatedProfile,
                        }));

                        // Keep the persistent header identity in sync with profile edits.
                        void refreshProfile();

                        setToast({
                            type: "success",
                            message: "Your profile information has been saved.",
                        });
                    }}
                    onError={(message) => {
                        setToast({
                            type: "error",
                            message,
                        });
                    }}
                />
            )}

            {toast && (
                <Toast
                    type={toast.type}
                    message={toast.message}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
}
