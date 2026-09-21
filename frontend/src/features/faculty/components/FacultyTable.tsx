import FacultyRow from "./FacultyRow";
import type { Faculty } from "../types/faculty";

interface FacultyTableProps {
    faculties: Faculty[];
    onViewDetails: (faculty: Faculty) => void;
    onEditFaculty: (faculty: Faculty) => void;
    onSuccess: () => void;
}

export default function FacultyTable({
                                         faculties,
                                         onViewDetails,
                                         onEditFaculty,
                                         onSuccess,
                                     }: FacultyTableProps) {
    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-4">
                <div>
                    <h2 className="font-semibold text-slate-800">
                        Faculty
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        {faculties.length} faculty member
                        {faculties.length === 1 ? "" : "s"} found
                    </p>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left">
                    <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                        <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Faculty
                        </th>

                        <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Email
                        </th>

                        <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Phone
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
                    {faculties.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="px-6 py-14 text-center">
                                <div className="flex flex-col items-center justify-center">
                                    <div
                                        className="
                                                flex h-12 w-12 items-center justify-center
                                                rounded-full bg-slate-100 text-slate-400
                                            "
                                    >
                                        <span className="text-xl">👤</span>
                                    </div>

                                    <p className="mt-4 text-sm font-medium text-slate-700">
                                        No faculty found
                                    </p>

                                    <p className="mt-1 text-sm text-slate-400">
                                        Try changing your search or filters.
                                    </p>
                                </div>
                            </td>
                        </tr>
                    ) : (
                        faculties.map((faculty) => (
                            <FacultyRow
                                key={faculty.id}
                                faculty={faculty}
                                onViewDetails={onViewDetails}
                                onEditFaculty={onEditFaculty}
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