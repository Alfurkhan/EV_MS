import {
    CheckCircle2,
    UserRoundCheck,
    XCircle,
} from "lucide-react";

import type { StudentEnrollment } from "../services/studentEnrollmentService";

interface StudentEnrollmentTableProps {
    enrollments: StudentEnrollment[];
    onManage: (enrollment: StudentEnrollment) => void;
}

export default function StudentEnrollmentTable({
                                                   enrollments,
                                                   onManage,
                                               }: StudentEnrollmentTableProps) {

    if (enrollments.length === 0) {
        return (
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">

                <UserRoundCheck
                    size={40}
                    className="mx-auto text-slate-300"
                />

                <h3
                    className="
                        mt-4
                        text-lg
                        font-semibold
                        text-slate-700
                    "
                >
                    No Student Enrollments
                </h3>

                <p
                    className="
                        mt-1
                        text-sm
                        text-slate-400
                    "
                >
                    Enroll a student to get started.
                </p>

            </div>
        );
    }

    return (
        <div
            className="
                overflow-hidden
                rounded-2xl
                border
                border-slate-200
                bg-white
                shadow-sm
            "
        >

            <div className="overflow-x-auto">

                <table className="w-full min-w-[1100px]">

                    <thead>

                    <tr
                        className="
                            border-b
                            border-slate-200
                            bg-slate-50
                        "
                    >

                        {/* STUDENT */}

                        <th
                            className="
                                whitespace-nowrap
                                px-6
                                py-4
                                text-left
                                text-xs
                                font-semibold
                                uppercase
                                tracking-wide
                                text-slate-500
                            "
                        >
                            Student
                        </th>

                        {/* EMAIL */}

                        <th
                            className="
                                whitespace-nowrap
                                px-6
                                py-4
                                text-left
                                text-xs
                                font-semibold
                                uppercase
                                tracking-wide
                                text-slate-500
                            "
                        >
                            Email
                        </th>

                        {/* ACADEMIC YEAR */}

                        <th
                            className="
                                whitespace-nowrap
                                px-6
                                py-4
                                text-left
                                text-xs
                                font-semibold
                                uppercase
                                tracking-wide
                                text-slate-500
                            "
                        >
                            Academic Year
                        </th>

                        {/* GRADE */}

                        <th
                            className="
                                whitespace-nowrap
                                px-6
                                py-4
                                text-left
                                text-xs
                                font-semibold
                                uppercase
                                tracking-wide
                                text-slate-500
                            "
                        >
                            Grade
                        </th>

                        {/* SECTION */}

                        <th
                            className="
                                whitespace-nowrap
                                px-6
                                py-4
                                text-left
                                text-xs
                                font-semibold
                                uppercase
                                tracking-wide
                                text-slate-500
                            "
                        >
                            Section
                        </th>

                        {/* STATUS */}

                        <th
                            className="
                                whitespace-nowrap
                                px-6
                                py-4
                                text-left
                                text-xs
                                font-semibold
                                uppercase
                                tracking-wide
                                text-slate-500
                            "
                        >
                            Status
                        </th>

                        {/* ACTION */}

                        <th
                            className="
                                whitespace-nowrap
                                px-6
                                py-4
                                text-right
                                text-xs
                                font-semibold
                                uppercase
                                tracking-wide
                                text-slate-500
                            "
                        >
                            Action
                        </th>

                    </tr>

                    </thead>

                    <tbody>

                    {enrollments.map((enrollment) => (

                        <tr
                            key={enrollment.id}
                            className="
                                border-b
                                border-slate-100
                                last:border-b-0
                                hover:bg-slate-50/70
                            "
                        >

                            {/* STUDENT */}

                            <td className="px-6 py-4">

                                <div
                                    className="
                                        flex
                                        items-center
                                        gap-3
                                        whitespace-nowrap
                                    "
                                >

                                    <div
                                        className="
                                            flex
                                            h-10
                                            w-10
                                            shrink-0
                                            items-center
                                            justify-center
                                            rounded-xl
                                            bg-blue-50
                                            text-blue-600
                                        "
                                    >

                                        <UserRoundCheck
                                            size={19}
                                        />

                                    </div>

                                    <div>

                                        <p
                                            className="
                                                whitespace-nowrap
                                                text-sm
                                                font-semibold
                                                text-slate-800
                                            "
                                        >
                                            {enrollment.studentName}
                                        </p>

                                        <p
                                            className="
                                                whitespace-nowrap
                                                text-xs
                                                text-slate-400
                                            "
                                        >
                                            Student Enrollment
                                        </p>

                                    </div>

                                </div>

                            </td>

                            {/* EMAIL */}

                            <td className="px-6 py-4">

                                <div
                                    className="
                                        whitespace-nowrap
                                        text-sm
                                        text-slate-600
                                    "
                                >
                                    {enrollment.studentEmail}
                                </div>

                            </td>

                            {/* ACADEMIC YEAR */}

                            <td className="px-6 py-4">

                                <div
                                    className="
                                        whitespace-nowrap
                                        text-sm
                                        text-slate-700
                                    "
                                >
                                    {enrollment.academicYearName}
                                </div>

                            </td>

                            {/* GRADE */}

                            <td className="px-6 py-4">

                                <div
                                    className="
                                        whitespace-nowrap
                                        text-sm
                                        text-slate-700
                                    "
                                >
                                    {enrollment.gradeName}
                                </div>

                            </td>

                            {/* SECTION */}

                            <td className="px-6 py-4">

                                <div
                                    className="
                                        whitespace-nowrap
                                        text-sm
                                        text-slate-700
                                    "
                                >
                                    {enrollment.sectionName}
                                </div>

                            </td>

                            {/* STATUS */}

                            <td className="px-6 py-4">

                                {enrollment.active ? (

                                    <span
                                        className="
                                            inline-flex
                                            items-center
                                            gap-1.5
                                            whitespace-nowrap
                                            rounded-full
                                            bg-green-50
                                            px-3
                                            py-1.5
                                            text-xs
                                            font-semibold
                                            text-green-600
                                        "
                                    >

                                        <CheckCircle2
                                            size={14}
                                        />

                                        Active

                                    </span>

                                ) : (

                                    <span
                                        className="
                                            inline-flex
                                            items-center
                                            gap-1.5
                                            whitespace-nowrap
                                            rounded-full
                                            bg-slate-100
                                            px-3
                                            py-1.5
                                            text-xs
                                            font-semibold
                                            text-slate-500
                                        "
                                    >

                                        <XCircle
                                            size={14}
                                        />

                                        Inactive

                                    </span>

                                )}

                            </td>

                            {/* ACTION */}

                            <td className="px-6 py-4 text-right">

                                <button
                                    type="button"
                                    onClick={() => onManage(enrollment)}
                                    className="
                                        whitespace-nowrap
                                        rounded-lg
                                        px-4
                                        py-2
                                        text-sm
                                        font-semibold
                                        text-blue-600
                                        transition
                                        hover:bg-blue-50
                                    "
                                >
                                    Manage
                                </button>

                            </td>

                        </tr>

                    ))}

                    </tbody>

                </table>

            </div>

        </div>
    );
}