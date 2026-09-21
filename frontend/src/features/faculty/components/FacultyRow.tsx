import type { Faculty } from "../types/faculty";
import FacultyActionsMenu from "./FacultyActionsMenu";

interface FacultyRowProps {
    faculty: Faculty;
    onViewDetails: (faculty: Faculty) => void;
    onEditFaculty: (faculty: Faculty) => void;
    onSuccess: () => void;
}

function getInitials(name: string): string {
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join("");
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

export default function FacultyRow({
                                       faculty,
                                       onViewDetails,
                                       onEditFaculty,
                                       onSuccess,
                                   }: FacultyRowProps) {
    const accountStatus = getAccountStatus(faculty);

    const phone = faculty.phoneNumber
        ? `${faculty.countryCode ?? ""} ${faculty.phoneNumber}`.trim()
        : "—";

    return (
        <tr className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50">
            {/* Faculty */}
            <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    <div
                        className="
                            flex h-10 w-10 shrink-0 items-center justify-center
                            rounded-full bg-blue-50 text-sm font-semibold text-blue-600
                        "
                    >
                        {getInitials(faculty.fullName)}
                    </div>

                    <div className="min-w-0">
                        <p className="truncate font-medium text-slate-800">
                            {faculty.fullName}
                        </p>

                        <p className="mt-0.5 text-xs text-slate-400">
                            ID: {faculty.id}
                        </p>
                    </div>
                </div>
            </td>

            {/* Email */}
            <td className="px-6 py-4">
                <p className="max-w-[240px] truncate text-sm text-slate-600">
                    {faculty.email}
                </p>
            </td>

            {/* Phone */}
            <td className="px-6 py-4">
                <p className="text-sm text-slate-600">
                    {phone}
                </p>
            </td>

            {/* Status */}
            <td className="px-6 py-4">
                <span
                    className={`
                        inline-flex rounded-full px-3 py-1 text-xs font-medium
                        ${accountStatus.className}
                    `}
                >
                    {accountStatus.label}
                </span>
            </td>

            {/* Actions */}
            <td className="px-6 py-4 text-right">
                <FacultyActionsMenu
                    faculty={faculty}
                    onViewDetails={onViewDetails}
                    onEditFaculty={onEditFaculty}
                    onSuccess={onSuccess}
                />
            </td>
        </tr>
    );
}