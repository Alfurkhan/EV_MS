import {
    CheckCircle2,
    Lock,
    Mail,
    Phone,
    ShieldCheck,
    User,
    X,
} from "lucide-react";

import type { Faculty } from "../types/faculty";

interface FacultyDetailsModalProps {
    faculty: Faculty | null;
    onClose: () => void;
}

function getAccountStatus(faculty: Faculty): {
    label: string;
    className: string;
} {
    if (!faculty.accountEnabled && faculty.accountLocked) {
        return {
            label: "Disabled + Locked",
            className: "bg-red-50 text-red-700",
        };
    }

    if (!faculty.accountEnabled) {
        return {
            label: "Disabled",
            className: "bg-slate-100 text-slate-600",
        };
    }

    if (faculty.accountLocked) {
        return {
            label: "Locked",
            className: "bg-amber-50 text-amber-700",
        };
    }

    return {
        label: "Active",
        className: "bg-emerald-50 text-emerald-700",
    };
}

function getInitials(name: string): string {
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join("");
}

export default function FacultyDetailsModal({
                                                faculty,
                                                onClose,
                                            }: FacultyDetailsModalProps) {
    if (!faculty) {
        return null;
    }

    const accountStatus = getAccountStatus(faculty);

    const phone = faculty.phoneNumber
        ? `${faculty.countryCode ?? ""} ${faculty.phoneNumber}`.trim()
        : "—";

    return (
        <div
            className="
                fixed
                inset-0
                z-50
                flex
                items-center
                justify-center
                bg-slate-900/40
                px-4
                py-6
                backdrop-blur-sm
            "
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    onClose();
                }
            }}
        >
            <div
                className="
                    max-h-[92vh]
                    w-full
                    max-w-2xl
                    overflow-y-auto
                    rounded-2xl
                    border
                    border-slate-200
                    bg-white
                    shadow-2xl
                "
                role="dialog"
                aria-modal="true"
                aria-labelledby="faculty-details-title"
            >
                {/* HEADER */}

                <div
                    className="
                        flex
                        items-start
                        justify-between
                        gap-4
                        border-b
                        border-slate-200
                        px-6
                        py-5
                    "
                >
                    <div>
                        <h2
                            id="faculty-details-title"
                            className="text-xl font-semibold text-slate-800"
                        >
                            Faculty Details
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            View faculty account information.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close faculty details"
                        className="
                            rounded-lg
                            p-1.5
                            text-slate-400
                            transition
                            hover:bg-slate-100
                            hover:text-slate-600
                        "
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-6 px-6 py-6">
                    {/* PROFILE */}

                    <div
                        className="
                            flex
                            items-center
                            gap-4
                            rounded-2xl
                            bg-slate-50
                            p-5
                        "
                    >
                        <div
                            className="
                                flex
                                h-16
                                w-16
                                shrink-0
                                items-center
                                justify-center
                                rounded-full
                                bg-blue-50
                                text-lg
                                font-semibold
                                text-blue-600
                            "
                        >
                            {getInitials(faculty.fullName)}
                        </div>

                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-lg font-semibold text-slate-800">
                                    {faculty.fullName}
                                </h3>

                                <span
                                    className={`
                                        inline-flex
                                        rounded-full
                                        px-3
                                        py-1
                                        text-xs
                                        font-medium
                                        ${accountStatus.className}
                                    `}
                                >
                                    {accountStatus.label}
                                </span>
                            </div>

                            <p className="mt-1 text-sm text-slate-500">
                                Faculty ID: {faculty.id}
                            </p>
                        </div>
                    </div>

                    {/* PERSONAL INFORMATION */}

                    <section>
                        <div className="mb-4">
                            <h3 className="text-sm font-semibold text-slate-800">
                                Personal Information
                            </h3>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div
                                className="
                                    rounded-xl
                                    border
                                    border-slate-200
                                    bg-white
                                    p-4
                                "
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="
                                            flex
                                            h-9
                                            w-9
                                            items-center
                                            justify-center
                                            rounded-lg
                                            bg-blue-50
                                            text-blue-600
                                        "
                                    >
                                        <Mail size={17} />
                                    </div>

                                    <div className="min-w-0">
                                        <p className="text-xs text-slate-400">
                                            Email
                                        </p>

                                        <p className="mt-0.5 truncate text-sm font-medium text-slate-700">
                                            {faculty.email}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div
                                className="
                                    rounded-xl
                                    border
                                    border-slate-200
                                    bg-white
                                    p-4
                                "
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="
                                            flex
                                            h-9
                                            w-9
                                            items-center
                                            justify-center
                                            rounded-lg
                                            bg-blue-50
                                            text-blue-600
                                        "
                                    >
                                        <Phone size={17} />
                                    </div>

                                    <div>
                                        <p className="text-xs text-slate-400">
                                            Phone
                                        </p>

                                        <p className="mt-0.5 text-sm font-medium text-slate-700">
                                            {phone}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ACCOUNT INFORMATION */}

                    <section>
                        <div className="mb-4">
                            <h3 className="text-sm font-semibold text-slate-800">
                                Account Information
                            </h3>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-3">
                            {/* ACCOUNT STATUS */}

                            <div
                                className="
                                    rounded-xl
                                    border
                                    border-slate-200
                                    bg-white
                                    p-4
                                "
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`
                                            flex
                                            h-9
                                            w-9
                                            items-center
                                            justify-center
                                            rounded-lg
                                            ${accountStatus.className}
                                        `}
                                    >
                                        <User size={17} />
                                    </div>

                                    <div>
                                        <p className="text-xs text-slate-400">
                                            Account Status
                                        </p>

                                        <p className="mt-0.5 text-sm font-medium text-slate-700">
                                            {accountStatus.label}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* EMAIL VERIFICATION */}

                            <div
                                className="
                                    rounded-xl
                                    border
                                    border-slate-200
                                    bg-white
                                    p-4
                                "
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="
                                            flex
                                            h-9
                                            w-9
                                            items-center
                                            justify-center
                                            rounded-lg
                                            bg-emerald-50
                                            text-emerald-600
                                        "
                                    >
                                        <CheckCircle2 size={17} />
                                    </div>

                                    <div>
                                        <p className="text-xs text-slate-400">
                                            Email Verification
                                        </p>

                                        <p className="mt-0.5 text-sm font-medium text-slate-700">
                                            {faculty.emailVerified
                                                ? "Verified"
                                                : "Not Verified"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* LOGIN ACCESS */}

                            <div
                                className="
                                    rounded-xl
                                    border
                                    border-slate-200
                                    bg-white
                                    p-4
                                "
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`
                                            flex
                                            h-9
                                            w-9
                                            items-center
                                            justify-center
                                            rounded-lg
                                            ${
                                            faculty.accountEnabled &&
                                            !faculty.accountLocked
                                                ? "bg-emerald-50 text-emerald-600"
                                                : "bg-red-50 text-red-600"
                                        }
                                        `}
                                    >
                                        {faculty.accountLocked ? (
                                            <Lock size={17} />
                                        ) : (
                                            <ShieldCheck size={17} />
                                        )}
                                    </div>

                                    <div>
                                        <p className="text-xs text-slate-400">
                                            Login Access
                                        </p>

                                        <p className="mt-0.5 text-sm font-medium text-slate-700">
                                            {faculty.accountEnabled &&
                                            !faculty.accountLocked
                                                ? "Allowed"
                                                : "Restricted"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ROLE */}

                    <section>
                        <div
                            className="
                                flex
                                items-center
                                justify-between
                                rounded-xl
                                border
                                border-slate-200
                                bg-slate-50
                                px-4
                                py-3
                            "
                        >
                            <div>
                                <p className="text-xs text-slate-400">
                                    Role
                                </p>

                                <p className="mt-0.5 text-sm font-medium text-slate-700">
                                    Faculty
                                </p>
                            </div>

                            <span
                                className="
                                    rounded-full
                                    bg-blue-50
                                    px-3
                                    py-1
                                    text-xs
                                    font-medium
                                    text-blue-700
                                "
                            >
                                ROLE_FACULTY
                            </span>
                        </div>
                    </section>
                </div>

                {/* FOOTER */}

                <div
                    className="
                        flex
                        justify-end
                        border-t
                        border-slate-200
                        bg-slate-50
                        px-6
                        py-4
                    "
                >
                    <button
                        type="button"
                        onClick={onClose}
                        className="
                            rounded-xl
                            bg-blue-600
                            px-5
                            py-2.5
                            text-sm
                            font-medium
                            text-white
                            transition
                            hover:bg-blue-700
                        "
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}