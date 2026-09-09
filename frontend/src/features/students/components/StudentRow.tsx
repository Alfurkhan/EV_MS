import type { Student } from "../types/student";
import StudentActionsMenu from "./StudentActionsMenu";

interface StudentRowProps {
    student: Student;
    onViewDetails: (student: Student) => void;
    onEditStudent: (student: Student) => void;
    onAssignEnrollment: (student: Student) => void;
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

export default function StudentRow({
                                       student,
                                       onViewDetails,
                                       onEditStudent,
                                       onAssignEnrollment,
                                       onSuccess,
                                   }: StudentRowProps) {
    const enrollment = student.enrollment;
    const accountStatus = getAccountStatus(student);

    const phone = student.phoneNumber
        ? `${student.countryCode ?? ""} ${student.phoneNumber}`.trim()
        : "—";

    return (
        <tr className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50">
            {/* Student */}
            <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    <div
                        className="
                            flex
                            h-10
                            w-10
                            shrink-0
                            items-center
                            justify-center
                            rounded-full
                            bg-blue-50
                            text-sm
                            font-semibold
                            text-blue-600
                        "
                    >
                        {getInitials(student.fullName)}
                    </div>

                    <div className="min-w-0">
                        <p className="truncate font-medium text-slate-800">
                            {student.fullName}
                        </p>

                        <p className="mt-0.5 text-xs text-slate-400">
                            ID: {student.id}
                        </p>
                    </div>
                </div>
            </td>

            {/* Email */}
            <td className="px-6 py-4">
                <p className="max-w-[240px] truncate text-sm text-slate-600">
                    {student.email}
                </p>
            </td>

            {/* Phone */}
            <td className="px-6 py-4">
                <p className="text-sm text-slate-600">
                    {phone}
                </p>
            </td>

            {/* Grade */}
            <td className="px-6 py-4">
                <p className="text-sm font-medium text-slate-700">
                    {enrollment?.gradeName ?? "—"}
                </p>
            </td>

            {/* Section */}
            <td className="px-6 py-4">
                <p className="text-sm text-slate-600">
                    {enrollment?.sectionName ?? "—"}
                </p>
            </td>

            {/* Status */}
            <td className="px-6 py-4">
                <div className="flex flex-col items-start gap-1.5">
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

                    <span
                        className={`
                            inline-flex
                            rounded-full
                            px-3
                            py-1
                            text-xs
                            font-medium
                            ${
                            enrollment?.active
                                ? "bg-blue-50 text-blue-700"
                                : "bg-slate-100 text-slate-500"
                        }
                        `}
                    >
                        {enrollment?.active
                            ? "Enrolled"
                            : "Not Enrolled"}
                    </span>
                </div>
            </td>

            {/* Actions */}
            <td className="px-6 py-4 text-right">
                <StudentActionsMenu
                    student={student}
                    onViewDetails={onViewDetails}
                    onEditStudent={onEditStudent}
                    onAssignEnrollment={onAssignEnrollment}
                    onSuccess={onSuccess}
                />
            </td>
        </tr>
    );
}