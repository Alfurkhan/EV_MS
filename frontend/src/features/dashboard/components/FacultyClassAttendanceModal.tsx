import { X, CalendarDays } from "lucide-react";

import type {
    FacultyClassAttendancePoint,
    FacultyClassAttendanceSummary,
} from "../../faculty/types/attendance";

interface FacultyClassAttendanceModalProps {
    open: boolean;
    weekStart: string;
    weekEnd: string;
    dailyAttendance: FacultyClassAttendancePoint[];
    classSummaries: FacultyClassAttendanceSummary[];
    overallAverage: number | null;
    onClose: () => void;
}

export default function FacultyClassAttendanceModal({
                                                        open,
                                                        weekStart,
                                                        weekEnd,
                                                        dailyAttendance,
                                                        classSummaries,
                                                        overallAverage,
                                                        onClose,
                                                    }: FacultyClassAttendanceModalProps) {

    if (!open) {
        return null;
    }

    const formatDate = (date: string) => {
        return new Date(`${date}T00:00:00`).toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }
        );
    };

    const groupedByDate =
        dailyAttendance.reduce<
            Record<string, FacultyClassAttendancePoint[]>
        >((groups, item) => {

            if (!groups[item.date]) {
                groups[item.date] = [];
            }

            groups[item.date].push(item);

            return groups;

        }, {});

    const sortedDates =
        Object.keys(groupedByDate).sort();

    const formatAttendance = (
        attendance: number | null
    ) => {
        return attendance === null
            ? "—"
            : `${attendance}%`;
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={onClose}
        >
            <div
                className="w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl"
                onClick={(event) => event.stopPropagation()}
            >

                {/* Header */}
                <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">

                    <div>
                        <h2 className="text-xl font-semibold text-slate-800">
                            Weekly Class Attendance
                        </h2>

                        <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                            <CalendarDays size={16} />

                            <span>
                                {formatDate(weekStart)}
                                {" – "}
                                {formatDate(weekEnd)}
                            </span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                        aria-label="Close attendance modal"
                    >
                        <X size={20} />
                    </button>

                </div>

                {/* Content */}
                <div className="max-h-[calc(90vh-170px)] overflow-y-auto px-6 py-5">

                    {sortedDates.length === 0 ? (

                        <div className="py-12 text-center text-sm text-slate-500">
                            No class attendance data available for this week.
                        </div>

                    ) : (

                        <div className="space-y-6">

                            {sortedDates.map((date) => {

                                const entries =
                                    groupedByDate[date];

                                const firstEntry =
                                    entries[0];

                                return (
                                    <div key={date}>

                                        {/* Day */}
                                        <div className="mb-3 flex items-center gap-2">

                                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                                <CalendarDays size={18} />
                                            </div>

                                            <div>
                                                <h3 className="font-semibold text-slate-800">
                                                    {firstEntry.day}
                                                </h3>

                                                <p className="text-xs text-slate-500">
                                                    {formatDate(date)}
                                                </p>
                                            </div>

                                        </div>

                                        {/* Classes */}
                                        <div className="space-y-2">

                                            {entries.map((entry) => (

                                                <div
                                                    key={entry.timetableId}
                                                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                                                >

                                                    <div className="min-w-0">

                                                        <p className="font-medium text-slate-800">
                                                            {entry.subjectName}
                                                        </p>

                                                        <p className="mt-0.5 text-sm text-slate-500">
                                                            {entry.gradeName}
                                                            {" · "}
                                                            {entry.sectionName}
                                                        </p>

                                                    </div>

                                                    <div className="ml-4 text-right">

                                                        <p className="text-lg font-semibold text-slate-800">
                                                            {formatAttendance(
                                                                entry.attendance
                                                            )}
                                                        </p>

                                                        <p className="text-xs text-slate-400">
                                                            Attendance
                                                        </p>

                                                    </div>

                                                </div>

                                            ))}

                                        </div>

                                    </div>
                                );
                            })}

                            {/* Weekly Summary */}
                            <div className="border-t border-slate-200 pt-6">

                                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                                    Weekly Class Average
                                </h3>

                                <div className="space-y-2">

                                    {classSummaries.map((summary) => (

                                        <div
                                            key={`${summary.subjectId}-${summary.gradeId}-${summary.sectionId}`}
                                            className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3"
                                        >

                                            <div>
                                                <p className="font-medium text-slate-800">
                                                    {summary.subjectName}
                                                </p>

                                                <p className="text-sm text-slate-500">
                                                    {summary.gradeName}
                                                    {" · "}
                                                    {summary.sectionName}
                                                </p>
                                            </div>

                                            <p className="font-semibold text-slate-800">
                                                {formatAttendance(
                                                    summary.attendance
                                                )}
                                            </p>

                                        </div>

                                    ))}

                                </div>

                            </div>

                            {/* Overall Average */}
                            <div className="rounded-xl bg-slate-900 px-5 py-4 text-white">

                                <div className="flex items-center justify-between">

                                    <div>
                                        <p className="text-sm text-slate-300">
                                            Overall Average
                                        </p>

                                        <p className="mt-1 text-xs text-slate-400">
                                            Average across your classes this week
                                        </p>
                                    </div>

                                    <p className="text-2xl font-bold">
                                        {formatAttendance(
                                            overallAverage
                                        )}
                                    </p>

                                </div>

                            </div>

                        </div>
                    )}

                </div>

                {/* Footer */}
                <div className="flex justify-end border-t border-slate-200 px-6 py-4">

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
                    >
                        Close
                    </button>

                </div>

            </div>
        </div>
    );
}