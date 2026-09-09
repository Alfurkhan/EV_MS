import {
    CheckCircle2,
    GraduationCap,
    Lock,
    Mail,
    Phone,
    ShieldCheck,
    User,
    X,
} from "lucide-react";

import type { Student } from "../types/student";

interface StudentDetailsModalProps {
    open: boolean;
    student: Student | null;
    onClose: () => void;
}

function getAccountStatus(student: Student): {
    label: string;
    className: string;
} {
    if (!student.accountEnabled && student.accountLocked) {
        return {
            label: "Disabled + Locked",
            className: "bg-red-50 text-red-700",
        };
    }

    if (!student.accountEnabled) {
        return {
            label: "Disabled",
            className: "bg-slate-100 text-slate-600",
        };
    }

    if (student.accountLocked) {
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

export default function StudentDetailsModal({
                                                open,
                                                student,
                                                onClose,
                                            }: StudentDetailsModalProps) {
    if (!open || !student) {
        return null;
    }

    const enrollment = student.enrollment;
    const accountStatus = getAccountStatus(student);

    const phone = student.phoneNumber
        ? `${student.countryCode ?? ""} ${student.phoneNumber}`.trim()
        : "—";

    const loginAccess = student.accountLocked
        ? {
            label: "Locked",
            className: "bg-red-50 text-red-700",
        }
        : student.accountEnabled
            ? {
                label: "Enabled",
                className: "bg-blue-50 text-blue-700",
            }
            : {
                label: "Disabled",
                className: "bg-slate-100 text-slate-600",
            };

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
                p-4
                backdrop-blur-sm
            "
            role="dialog"
            aria-modal="true"
            aria-labelledby="student-details-title"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    onClose();
                }
            }}
        >
            <div
                className="
                    flex
                    max-h-[90vh]
                    w-full
                    max-w-2xl
                    flex-col
                    overflow-hidden
                    rounded-2xl
                    border
                    border-slate-200
                    bg-white
                    shadow-2xl
                "
            >
                {/* HEADER */}

                <div
                    className="
                        flex
                        shrink-0
                        items-center
                        justify-between
                        border-b
                        border-slate-200
                        px-6
                        py-5
                    "
                >
                    <div>
                        <h2
                            id="student-details-title"
                            className="
                                text-xl
                                font-semibold
                                text-slate-800
                            "
                        >
                            Student Details
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            View student account and academic information.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close student details"
                        className="
                            rounded-lg
                            p-2
                            text-slate-400
                            transition
                            hover:bg-slate-100
                            hover:text-slate-700
                        "
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* CONTENT */}

                <div
                    className="
                        min-h-0
                        overflow-y-auto
                        px-6
                        py-6
                    "
                >
                    {/* STUDENT PROFILE */}

                    <div
                        className="
                            flex
                            items-center
                            gap-4
                            rounded-2xl
                            border
                            border-slate-200
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
                                bg-blue-100
                                text-lg
                                font-semibold
                                text-blue-600
                            "
                        >
                            {getInitials(student.fullName)}
                        </div>

                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <h3
                                    className="
                                        truncate
                                        text-lg
                                        font-semibold
                                        text-slate-800
                                    "
                                >
                                    {student.fullName}
                                </h3>

                                <span
                                    className={`
                                        inline-flex
                                        shrink-0
                                        items-center
                                        rounded-full
                                        px-2.5
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
                                Student ID: {student.id}
                            </p>
                        </div>
                    </div>

                    {/* PERSONAL INFORMATION */}

                    <section className="mt-7">
                        <div className="mb-4">
                            <h3 className="text-sm font-semibold text-slate-800">
                                Personal Information
                            </h3>

                            <p className="mt-1 text-xs text-slate-400">
                                Contact information associated with the account.
                            </p>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            {/* EMAIL */}

                            <div
                                className="
                                    rounded-xl
                                    border
                                    border-slate-200
                                    bg-white
                                    p-4
                                "
                            >
                                <div className="flex items-center gap-2 text-slate-400">
                                    <Mail size={16} />

                                    <span
                                        className="
                                            text-xs
                                            font-medium
                                            uppercase
                                            tracking-wide
                                        "
                                    >
                                        Email
                                    </span>
                                </div>

                                <p
                                    className="
                                        mt-2
                                        break-all
                                        text-sm
                                        font-medium
                                        text-slate-700
                                    "
                                >
                                    {student.email}
                                </p>
                            </div>

                            {/* PHONE */}

                            <div
                                className="
                                    rounded-xl
                                    border
                                    border-slate-200
                                    bg-white
                                    p-4
                                "
                            >
                                <div className="flex items-center gap-2 text-slate-400">
                                    <Phone size={16} />

                                    <span
                                        className="
                                            text-xs
                                            font-medium
                                            uppercase
                                            tracking-wide
                                        "
                                    >
                                        Phone
                                    </span>
                                </div>

                                <p className="mt-2 text-sm font-medium text-slate-700">
                                    {phone}
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* ACCOUNT INFORMATION */}

                    <section className="mt-7">
                        <div className="mb-4">
                            <h3 className="text-sm font-semibold text-slate-800">
                                Account
                            </h3>

                            <p className="mt-1 text-xs text-slate-400">
                                Current status and access information.
                            </p>
                        </div>

                        <div className="grid gap-3 md:grid-cols-3">
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
                                <div className="flex items-center gap-2 text-slate-400">
                                    <ShieldCheck size={16} />

                                    <p className="text-xs font-medium">
                                        Account Status
                                    </p>
                                </div>

                                <span
                                    className={`
                                        mt-3
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
                                <div className="flex items-center gap-2 text-slate-400">
                                    <Mail size={16} />

                                    <p className="text-xs font-medium">
                                        Email Verification
                                    </p>
                                </div>

                                <span
                                    className={`
                                        mt-3
                                        inline-flex
                                        items-center
                                        gap-1.5
                                        rounded-full
                                        px-3
                                        py-1
                                        text-xs
                                        font-medium
                                        ${
                                        student.emailVerified
                                            ? "bg-emerald-50 text-emerald-700"
                                            : "bg-amber-50 text-amber-700"
                                    }
                                    `}
                                >
                                    {student.emailVerified ? (
                                        <CheckCircle2 size={13} />
                                    ) : null}

                                    {student.emailVerified
                                        ? "Verified"
                                        : "Not Verified"}
                                </span>
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
                                <div className="flex items-center gap-2 text-slate-400">
                                    <Lock size={16} />

                                    <p className="text-xs font-medium">
                                        Login Access
                                    </p>
                                </div>

                                <span
                                    className={`
                                        mt-3
                                        inline-flex
                                        rounded-full
                                        px-3
                                        py-1
                                        text-xs
                                        font-medium
                                        ${loginAccess.className}
                                    `}
                                >
                                    {loginAccess.label}
                                </span>
                            </div>
                        </div>
                    </section>

                    {/* ACADEMIC INFORMATION */}

                    <section className="mt-7">
                        <div className="mb-4">
                            <h3 className="text-sm font-semibold text-slate-800">
                                Academic Information
                            </h3>

                            <p className="mt-1 text-xs text-slate-400">
                                Current academic enrollment details.
                            </p>
                        </div>

                        {enrollment ? (
                            <>
                                <div
                                    className="
                                        grid
                                        gap-3
                                        md:grid-cols-2
                                    "
                                >
                                    {/* ACADEMIC YEAR */}

                                    <div
                                        className="
                                            rounded-xl
                                            border
                                            border-slate-200
                                            bg-white
                                            p-4
                                        "
                                    >
                                        <p className="text-xs font-medium text-slate-400">
                                            Academic Year
                                        </p>

                                        <p className="mt-2 text-sm font-semibold text-slate-700">
                                            {enrollment.academicYearName}
                                        </p>
                                    </div>

                                    {/* GRADE */}

                                    <div
                                        className="
                                            rounded-xl
                                            border
                                            border-slate-200
                                            bg-white
                                            p-4
                                        "
                                    >
                                        <p className="text-xs font-medium text-slate-400">
                                            Grade
                                        </p>

                                        <p className="mt-2 text-sm font-semibold text-slate-700">
                                            {enrollment.gradeName}
                                        </p>
                                    </div>

                                    {/* SECTION */}

                                    <div
                                        className="
                                            rounded-xl
                                            border
                                            border-slate-200
                                            bg-white
                                            p-4
                                        "
                                    >
                                        <p className="text-xs font-medium text-slate-400">
                                            Section
                                        </p>

                                        <p className="mt-2 text-sm font-semibold text-slate-700">
                                            {enrollment.sectionName}
                                        </p>
                                    </div>

                                    {/* ENROLLMENT STATUS */}

                                    <div
                                        className="
                                            rounded-xl
                                            border
                                            border-slate-200
                                            bg-white
                                            p-4
                                        "
                                    >
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <GraduationCap size={16} />

                                            <p className="text-xs font-medium">
                                                Enrollment Status
                                            </p>
                                        </div>

                                        <span
                                            className={`
                                                mt-3
                                                inline-flex
                                                rounded-full
                                                px-3
                                                py-1
                                                text-xs
                                                font-medium
                                                ${
                                                enrollment.active
                                                    ? "bg-blue-50 text-blue-700"
                                                    : "bg-slate-100 text-slate-500"
                                            }
                                            `}
                                        >
                                            {enrollment.active
                                                ? "Active"
                                                : "Inactive"}
                                        </span>
                                    </div>
                                </div>

                                {/* ENROLLMENT SUMMARY */}

                                <div
                                    className="
                                        mt-3
                                        flex
                                        items-center
                                        gap-3
                                        rounded-xl
                                        border
                                        border-blue-100
                                        bg-blue-50/60
                                        px-4
                                        py-3
                                    "
                                >
                                    <GraduationCap
                                        size={18}
                                        className="shrink-0 text-blue-500"
                                    />

                                    <p className="text-sm text-blue-800">
                                        {enrollment.active
                                            ? `Currently enrolled in ${enrollment.gradeName} — ${enrollment.sectionName} for ${enrollment.academicYearName}.`
                                            : `Enrollment is inactive for ${enrollment.academicYearName}.`}
                                    </p>
                                </div>
                            </>
                        ) : (
                            <div
                                className="
                                    rounded-xl
                                    border
                                    border-dashed
                                    border-slate-300
                                    bg-slate-50
                                    px-5
                                    py-8
                                    text-center
                                "
                            >
                                <User
                                    size={22}
                                    className="mx-auto text-slate-400"
                                />

                                <p className="mt-3 text-sm font-medium text-slate-600">
                                    No enrollment found
                                </p>

                                <p className="mt-1 text-xs text-slate-400">
                                    This student is not currently enrolled in
                                    the selected academic year.
                                </p>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
}