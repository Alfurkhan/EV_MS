import {
    CalendarDays,
    CheckCircle2,
    Clock3,
    ExternalLink,
    FileText,
    GraduationCap,
    Mail,
    MapPin,
    Monitor,
    User,
    X,
} from "lucide-react";

import type { Timetable } from "../types/timetable";

interface ScheduleDetailsModalProps {
    open: boolean;
    timetable: Timetable | null;
    onClose: () => void;
}

export default function ScheduleDetailsModal({
    open,
    timetable,
    onClose,
}: ScheduleDetailsModalProps) {
    if (!open || !timetable) {
        return null;
    }

    const formatTime = (time: string) => {
        const [hours, minutes] = time
            .split(":")
            .map(Number);

        const date = new Date();

        date.setHours(hours, minutes, 0, 0);

        return date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatDate = (value: string) => {
        if (!value) {
            return "—";
        }

        const date = new Date(`${value}T00:00:00`);

        if (Number.isNaN(date.getTime())) {
            return value;
        }

        return date.toLocaleDateString([], {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const formatDateTime = (value: string) => {
        if (!value) {
            return "—";
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return value;
        }

        return date.toLocaleString([], {
            dateStyle: "medium",
            timeStyle: "short",
        });
    };

    const isOnline = timetable.classType === "ONLINE";

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                                <CalendarDays size={20} />
                            </div>

                            <div>
                                <h2 className="text-lg font-bold text-slate-900">
                                    Schedule Details
                                </h2>

                                <p className="text-sm text-slate-500">
                                    View complete timetable information
                                </p>
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="max-h-[75vh] overflow-y-auto p-6">
                    {/* Schedule Summary */}
                    <div className="mb-6 rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">
                                    Schedule
                                </p>

                                <h3 className="mt-1 text-xl font-bold text-slate-900">
                                    {timetable.dayOfWeek}
                                </h3>

                                <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                                    <CalendarDays size={16} />

                                    <span>
                                        {formatDate(
                                            timetable.startDate
                                        )}
                                        {" – "}
                                        {formatDate(
                                            timetable.endDate
                                        )}
                                    </span>
                                </div>

                                <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                                    <Clock3 size={16} />

                                    <span>
                                        {formatTime(
                                            timetable.startTime
                                        )}
                                        {" – "}
                                        {formatTime(
                                            timetable.endTime
                                        )}
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                {isOnline ? (
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-700">
                                        <Monitor size={14} />
                                        Online
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-700">
                                        <MapPin size={14} />
                                        Offline
                                    </span>
                                )}

                                {timetable.active ? (
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                                        <CheckCircle2 size={14} />
                                        Active
                                    </span>
                                ) : (
                                    <span className="inline-flex rounded-full bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600">
                                        Inactive
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Academic Information */}
                    <section className="mb-6">
                        <div className="mb-3 flex items-center gap-2">
                            <GraduationCap
                                size={18}
                                className="text-indigo-600"
                            />

                            <h3 className="text-sm font-semibold text-slate-900">
                                Academic Information
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-xs font-medium text-slate-500">
                                    Academic Year
                                </p>

                                <p className="mt-1 font-semibold text-slate-800">
                                    {timetable.academicYearName}
                                </p>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-xs font-medium text-slate-500">
                                    Grade
                                </p>

                                <p className="mt-1 font-semibold text-slate-800">
                                    {timetable.gradeName}
                                </p>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-xs font-medium text-slate-500">
                                    Section
                                </p>

                                <p className="mt-1 font-semibold text-slate-800">
                                    Section {timetable.sectionName}
                                </p>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-xs font-medium text-slate-500">
                                    Subject
                                </p>

                                <p className="mt-1 font-semibold text-slate-800">
                                    {timetable.subjectName}
                                </p>

                                <p className="mt-0.5 text-xs text-slate-500">
                                    {timetable.subjectCode}
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Faculty */}
                    <section className="mb-6">
                        <div className="mb-3 flex items-center gap-2">
                            <User
                                size={18}
                                className="text-indigo-600"
                            />

                            <h3 className="text-sm font-semibold text-slate-900">
                                Faculty
                            </h3>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                            <p className="font-semibold text-slate-800">
                                {timetable.facultyName}
                            </p>

                            <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                                <Mail size={14} />

                                <span>
                                    {timetable.facultyEmail}
                                </span>
                            </div>
                        </div>
                    </section>

                    {/* Schedule Information */}
                    <section className="mb-6">
                        <div className="mb-3 flex items-center gap-2">
                            <Clock3
                                size={18}
                                className="text-indigo-600"
                            />

                            <h3 className="text-sm font-semibold text-slate-900">
                                Schedule Information
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-xs font-medium text-slate-500">
                                    Start Date
                                </p>

                                <p className="mt-1 font-semibold text-slate-800">
                                    {formatDate(
                                        timetable.startDate
                                    )}
                                </p>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-xs font-medium text-slate-500">
                                    End Date
                                </p>

                                <p className="mt-1 font-semibold text-slate-800">
                                    {formatDate(
                                        timetable.endDate
                                    )}
                                </p>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-xs font-medium text-slate-500">
                                    Day
                                </p>

                                <p className="mt-1 font-semibold text-slate-800">
                                    {timetable.dayOfWeek}
                                </p>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-xs font-medium text-slate-500">
                                    Time
                                </p>

                                <p className="mt-1 font-semibold text-slate-800">
                                    {formatTime(
                                        timetable.startTime
                                    )}
                                    {" – "}
                                    {formatTime(
                                        timetable.endTime
                                    )}
                                </p>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-xs font-medium text-slate-500">
                                    Class Type
                                </p>

                                <div className="mt-1 flex items-center gap-2">
                                    {isOnline ? (
                                        <>
                                            <Monitor
                                                size={15}
                                                className="text-blue-500"
                                            />

                                            <p className="font-semibold text-blue-700">
                                                Online
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <MapPin
                                                size={15}
                                                className="text-amber-500"
                                            />

                                            <p className="font-semibold text-amber-700">
                                                Offline
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-xs font-medium text-slate-500">
                                    {isOnline
                                        ? "Meeting Link"
                                        : "Room"}
                                </p>

                                {isOnline ? (
                                    timetable.meetingLink ? (
                                        <a
                                            href={
                                                timetable.meetingLink
                                            }
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                                        >
                                            Join Meeting
                                            <ExternalLink
                                                size={14}
                                            />
                                        </a>
                                    ) : (
                                        <p className="mt-1 font-semibold text-slate-500">
                                            No meeting link
                                        </p>
                                    )
                                ) : (
                                    <div className="mt-1 flex items-center gap-2">
                                        <MapPin
                                            size={15}
                                            className="text-slate-400"
                                        />

                                        <p className="font-semibold text-slate-800">
                                            {timetable.room ||
                                                "Not specified"}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:col-span-2">
                                <p className="text-xs font-medium text-slate-500">
                                    Schedule ID
                                </p>

                                <p className="mt-1 font-semibold text-slate-800">
                                    #{timetable.id}
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Notes */}
                    <section className="mb-6">
                        <div className="mb-3 flex items-center gap-2">
                            <FileText
                                size={18}
                                className="text-indigo-600"
                            />

                            <h3 className="text-sm font-semibold text-slate-900">
                                Notes
                            </h3>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
                                {timetable.notes ||
                                    "No notes added."}
                            </p>
                        </div>
                    </section>

                    {/* Metadata */}
                    <section>
                        <div className="mb-3">
                            <h3 className="text-sm font-semibold text-slate-900">
                                Record Information
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div>
                                <p className="text-xs font-medium text-slate-500">
                                    Created
                                </p>

                                <p className="mt-1 text-sm text-slate-700">
                                    {formatDateTime(
                                        timetable.createdAt
                                    )}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs font-medium text-slate-500">
                                    Last Updated
                                </p>

                                <p className="mt-1 text-sm text-slate-700">
                                    {formatDateTime(
                                        timetable.updatedAt
                                    )}
                                </p>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end border-t border-slate-200 bg-slate-50 px-6 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
