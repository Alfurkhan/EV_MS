import {
    User,
    Mail,
    Phone,
    CalendarDays,
    Clock3,
    AtSign,
    ShieldCheck,
    BadgeCheck,
} from "lucide-react";

import type { Profile } from "../types/profile";
import InfoCard from "./InfoCard";

type Props = {
    profile: Profile;
};

export default function ProfileInfo({
                                        profile,
                                    }: Props) {

    return (
        <div className="mt-10 space-y-10">

            {/* =========================
                PERSONAL INFORMATION
            ========================== */}

            <section>

                <div className="mb-6">

                    <h2 className="text-2xl font-bold text-slate-800">
                        Personal Information
                    </h2>

                    <p className="text-slate-500 mt-1">
                        Your basic personal and contact details
                    </p>

                </div>

                <div className="grid md:grid-cols-2 gap-6">

                    <InfoCard
                        icon={<User size={22} />}
                        label="Full Name"
                        value={profile.fullName || "Not Added"}
                    />

                    <InfoCard
                        icon={<Mail size={22} />}
                        label="Email"
                        value={profile.email || "Not Added"}
                    />

                    <InfoCard
                        icon={<Phone size={22} />}
                        label="Phone Number"
                        value={formatPhoneNumber(
                            profile.countryCode,
                            profile.phoneNumber
                        )}
                    />

                </div>

            </section>


            {/* =========================
                ACCOUNT INFORMATION
            ========================== */}

            <section>

                <div className="mb-6">

                    <h2 className="text-2xl font-bold text-slate-800">
                        Account Information
                    </h2>

                    <p className="text-slate-500 mt-1">
                        Your account identity and security status
                    </p>

                </div>

                <div className="grid md:grid-cols-2 gap-6">

                    <InfoCard
                        icon={<AtSign size={22} />}
                        label="Username"
                        value={profile.username}
                    />

                    <InfoCard
                        icon={<ShieldCheck size={22} />}
                        label="Role"
                        value={formatRole(profile.role)}
                    />

                    <InfoCard
                        icon={<BadgeCheck size={22} />}
                        label="Account Status"
                        value={
                            profile.accountEnabled
                                ? "Active"
                                : "Disabled"
                        }
                    />

                    <InfoCard
                        icon={<Mail size={22} />}
                        label="Email Verification"
                        value={
                            profile.emailVerified
                                ? "Verified"
                                : "Not Verified"
                        }
                    />

                </div>

            </section>


            {/* =========================
                ACCOUNT ACTIVITY
            ========================== */}

            <section>

                <div className="mb-6">

                    <h2 className="text-2xl font-bold text-slate-800">
                        Account Activity
                    </h2>

                    <p className="text-slate-500 mt-1">
                        Important account dates
                    </p>

                </div>

                <div className="grid md:grid-cols-2 gap-6">

                    <InfoCard
                        icon={<CalendarDays size={22} />}
                        label="Account Created"
                        value={formatDate(profile.createdAt)}
                    />

                    <InfoCard
                        icon={<Clock3 size={22} />}
                        label="Last Login"
                        value={formatDateTime(profile.lastLoginAt)}
                    />

                </div>

            </section>

        </div>
    );
}


/* =========================
   HELPERS
========================= */

function formatDate(value: string) {

    return new Date(value).toLocaleDateString(
        undefined,
        {
            year: "numeric",
            month: "long",
            day: "numeric",
        }
    );
}


function formatDateTime(value: string) {

    return new Date(value).toLocaleString(
        undefined,
        {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
        }
    );
}


function formatRole(role: string | null | undefined) {

    if (!role) {
        return "Not Assigned";
    }

    return role
        .replace(/^ROLE_/, "")
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatPhoneNumber(
    countryCode: string | null | undefined,
    phoneNumber: string | null | undefined
) {

    if (!phoneNumber) {
        return "Not Added";
    }

    return [
        countryCode,
        phoneNumber,
    ]
        .filter(Boolean)
        .join(" ");
}