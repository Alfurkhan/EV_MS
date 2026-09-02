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
                <p className="text-sm font-medium text-slate-700">
                    No student enrollments found.
                </p>

                <p className="mt-1 text-sm text-slate-500">
                    Enroll a student to get started.
                </p>
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="overflow-x-auto">

                <table className="w-full min-w-[900px]">

                    {/* ================================================= */}
                    {/* TABLE HEADER */}
                    {/* ================================================= */}

                    <thead className="border-b border-slate-200 bg-slate-50">

                    <tr>

                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Student
                        </th>

                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Email
                        </th>

                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Academic Year
                        </th>

                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Grade
                        </th>

                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Section
                        </th>

                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Status
                        </th>

                        <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Action
                        </th>

                    </tr>

                    </thead>


                    {/* ================================================= */}
                    {/* TABLE BODY */}
                    {/* ================================================= */}

                    <tbody className="divide-y divide-slate-100">

                    {enrollments.map((enrollment) => (

                        <tr
                            key={enrollment.id}
                            className="transition hover:bg-slate-50"
                        >

                            {/* STUDENT */}

                            <td className="px-6 py-4">

                                <div className="text-sm font-semibold text-slate-900">
                                    {enrollment.studentName}
                                </div>

                            </td>


                            {/* EMAIL */}

                            <td className="px-6 py-4">

                                <div className="text-sm text-slate-600">
                                    {enrollment.studentEmail}
                                </div>

                            </td>


                            {/* ACADEMIC YEAR */}

                            <td className="px-6 py-4">

                                <div className="text-sm text-slate-700">
                                    {enrollment.academicYearName}
                                </div>

                            </td>


                            {/* GRADE */}

                            <td className="px-6 py-4">

                                <div className="text-sm text-slate-700">
                                    {enrollment.gradeName}
                                </div>

                            </td>


                            {/* SECTION */}

                            <td className="px-6 py-4">

                                <div className="text-sm text-slate-700">
                                    {enrollment.sectionName}
                                </div>

                            </td>


                            {/* STATUS */}

                            <td className="px-6 py-4">

                                    <span
                                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                                            enrollment.active
                                                ? "bg-green-50 text-green-700"
                                                : "bg-slate-100 text-slate-600"
                                        }`}
                                    >
                                        {enrollment.active
                                            ? "Active"
                                            : "Inactive"}
                                    </span>

                            </td>


                            {/* ACTION */}

                            <td className="px-6 py-4 text-right">

                                <button
                                    type="button"
                                    onClick={() =>
                                        onManage(enrollment)
                                    }
                                    className="
                                            text-sm
                                            font-medium
                                            text-blue-600
                                            transition
                                            hover:text-blue-700
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