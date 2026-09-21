import type { Timetable } from "../types/timetable";
import ScheduleActionsMenu from "./ScheduleActionsMenu";

import {
    CalendarDays,
    Clock3,
    DoorOpen,
    ExternalLink,
    Monitor,
    UserRound,
} from "lucide-react";

interface TimetableClassCardProps {
    timetable: Timetable;
    onView: () => void;
    onEdit: () => void;
    onToggleStatus: () => void;
    onDelete: () => void;
}

export default function TimetableClassCard({
    timetable,
    onView,
    onEdit,
    onToggleStatus,
    onDelete,
}: TimetableClassCardProps) {
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

    const formatDateRange = () => {
        if (!timetable.startDate && !timetable.endDate) {
            return "No date range";
        }

        if (timetable.startDate === timetable.endDate) {
            return formatDate(timetable.startDate);
        }

        return `${formatDate(timetable.startDate)} – ${formatDate(
    timetable.endDate
)}`;
    };

    const isOnline = timetable.classType === "ONLINE";

    return (
        <div
            className={`group relative min-h-[185px] rounded-xl border p-3 shadow-sm transition ${
    timetable.active
        ? "border-indigo-100 bg-white hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
        : "border-slate-200 bg-slate-50 opacity-75"
}`}
        >
            {/* Header */}
            <div className="mb-2 flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <p
                        className={`truncate text-sm font-semibold ${
    timetable.active
        ? "text-slate-900"
        : "text-slate-500"
}`}
                        title={timetable.subjectName}
                    >
                        {timetable.subjectName}
                    </p>

                    <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                        {timetable.subjectCode}
                    </p>
                </div>

                <ScheduleActionsMenu
                    active={timetable.active}
                    onView={onView}
                    onEdit={onEdit}
                    onToggleStatus={onToggleStatus}
                    onDelete={onDelete}
                />
            </div>

            {/* Date Range */}
            <div className="mb-2 flex items-center gap-1.5 text-[11px] text-slate-500">
                <CalendarDays
                    size={12}
                    className="shrink-0 text-indigo-500"
                />

                <span
                    className="truncate"
                    title={formatDateRange()}
                >
                    {formatDateRange()}
                </span>
            </div>

            {/* Time */}
            <div className="mb-2 flex items-center gap-1.5 text-xs text-slate-500">
                <Clock3
                    size={13}
                    className="shrink-0 text-indigo-500"
                />

                <span>
                    {formatTime(timetable.startTime)}
                    {" – "}
                    {formatTime(timetable.endTime)}
                </span>
            </div>

            {/* Faculty */}
            <div className="mb-2 flex items-center gap-1.5 text-xs text-slate-600">
                <UserRound
                    size={13}
                    className="shrink-0 text-slate-400"
                />

                <span
                    className="truncate"
                    title={timetable.facultyName}
                >
                    {timetable.facultyName}
                </span>
            </div>

            {/* Class Type */}
            <div className="mb-2">
                {isOnline ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                        <Monitor size={11} />
                        Online
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                        <DoorOpen size={11} />
                        Offline
                    </span>
                )}
            </div>

            {/* Location / Meeting Link */}
            <div className="flex min-w-0 items-center gap-1.5 text-xs text-slate-500">
                {isOnline ? (
                    <>
                        <ExternalLink
                            size={13}
                            className="shrink-0 text-slate-400"
                        />

                        {timetable.meetingLink ? (
                            <a
                                href={timetable.meetingLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(event) =>
                                    event.stopPropagation()
                                }
                                className="truncate text-blue-600 hover:text-blue-700 hover:underline"
                                title={timetable.meetingLink}
                            >
                                Join meeting
                            </a>
                        ) : (
                            <span className="truncate">
                                No meeting link
                            </span>
                        )}
                    </>
                ) : (
                    <>
                        <DoorOpen
                            size={13}
                            className="shrink-0 text-slate-400"
                        />

                        <span
                            className="truncate"
                            title={timetable.room || undefined}
                        >
                            {timetable.room || "No room"}
                        </span>
                    </>
                )}
            </div>

            {/* Status */}
            <div className="mt-3">
                {timetable.active ? (
                    <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                        Active
                    </span>
                ) : (
                    <span className="inline-flex rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                        Inactive
                    </span>
                )}
            </div>
        </div>
    );
}
