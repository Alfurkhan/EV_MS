import StudentRow from "./StudentRow";
import type { Student } from "../types/student";

interface StudentTableProps {
    students: Student[];
    onViewDetails: (student: Student) => void;
    onEditStudent: (student: Student) => void;
    onAssignEnrollment: (student: Student) => void;
    onSuccess: () => void;
}

export default function StudentTable({
                                         students,
                                         onViewDetails,
                                         onEditStudent,
                                         onAssignEnrollment,
                                         onSuccess,
                                     }: StudentTableProps) {
    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {/* Table Header */}
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-4">
                <div>
                    <h2 className="font-semibold text-slate-800">
                        Students
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        {students.length} student
                        {students.length === 1 ? "" : "s"} found
                    </p>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px] text-left">
                    <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                        <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Student
                        </th>

                        <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Email
                        </th>

                        <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Phone
                        </th>

                        <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Grade
                        </th>

                        <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Section
                        </th>

                        <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Status
                        </th>

                        <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Actions
                        </th>
                    </tr>
                    </thead>

                    <tbody>
                    {students.length === 0 ? (
                        <tr>
                            <td
                                colSpan={7}
                                className="px-6 py-14 text-center"
                            >
                                <div className="flex flex-col items-center justify-center">
                                    <div
                                        className="
                                                flex
                                                h-12
                                                w-12
                                                items-center
                                                justify-center
                                                rounded-full
                                                bg-slate-100
                                                text-slate-400
                                            "
                                    >
                                            <span className="text-xl">
                                                👤
                                            </span>
                                    </div>

                                    <p className="mt-4 text-sm font-medium text-slate-700">
                                        No students found
                                    </p>

                                    <p className="mt-1 text-sm text-slate-400">
                                        Try changing your search or filters.
                                    </p>
                                </div>
                            </td>
                        </tr>
                    ) : (
                        students.map((student) => (
                            <StudentRow
                                student={student}
                                onViewDetails={onViewDetails}
                                onEditStudent={onEditStudent}
                                onAssignEnrollment={onAssignEnrollment}
                                onSuccess={onSuccess}
                            />
                        ))
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}