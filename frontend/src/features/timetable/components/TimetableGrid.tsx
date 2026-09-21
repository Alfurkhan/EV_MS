import { CalendarDays } from "lucide-react";

import TimetableClassCard from "./TimetableClassCard";
import type { Timetable } from "../types/timetable";

interface TimetableGridProps {
    timetables: Timetable[];

    onView: (timetable: Timetable) => void;
    onEdit: (timetable: Timetable) => void;
    onToggleStatus: (timetable: Timetable) => void;
    onDelete: (timetable: Timetable) => void;
}

const DAYS = [
    { value: "MONDAY", label: "Monday" },
    { value: "TUESDAY", label: "Tuesday" },
    { value: "WEDNESDAY", label: "Wednesday" },
    { value: "THURSDAY", label: "Thursday" },
    { value: "FRIDAY", label: "Friday" },
    { value: "SATURDAY", label: "Saturday" },
    { value: "SUNDAY", label: "Sunday" },
];

function timeToMinutes(time: string): number {
    const [hours, minutes] = time
        .split(":")
        .map(Number);

    return hours * 60 + minutes;
}

function formatTime(time: string): string {
    const [hours, minutes] = time
        .split(":")
        .map(Number);

    const date = new Date();

    date.setHours(hours, minutes, 0, 0);

    return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function TimetableGrid({
    timetables,
    onView,
    onEdit,
    onToggleStatus,
    onDelete,
}: TimetableGridProps) {
    const activeTimetables = timetables.filter(
        (item) => item.active
    );

    const sortedTimetables = [...activeTimetables].sort(
        (a, b) =>
            timeToMinutes(a.startTime) -
            timeToMinutes(b.startTime)
    );

    const timeSlots = Array.from(
        new Map(
            sortedTimetables.map((item) => [
                item.startTime,
                {
                    startTime: item.startTime,
                    endTime: item.endTime,
                },
            ])
        ).values()
    ).sort(
        (a, b) =>
            timeToMinutes(a.startTime) -
            timeToMinutes(b.startTime)
    );

    const getClassesForDayAndTime = (
        day: string,
        startTime: string
    ) => {
        return sortedTimetables
            .filter(
                (item) =>
                    item.dayOfWeek === day &&
                    item.startTime === startTime
            )
            .sort(
                (a, b) =>
                    timeToMinutes(a.startTime) -
                    timeToMinutes(b.startTime)
            );
    };

    if (activeTimetables.length === 0) {
        return (
            <div className="flex min-h-[350px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 text-center shadow-sm">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500">
                    <CalendarDays size={28} />
                </div>

                <h2 className="text-base font-semibold text-slate-900">
                    No active schedules
                </h2>

                <p className="mt-1 max-w-md text-sm text-slate-500">
                    There are no active timetable entries matching
                    the selected filters.
                </p>
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
                <div className="min-w-[1250px]">
                    {/* Header */}
                    <div className="grid grid-cols-[100px_repeat(7,minmax(150px,1fr))] border-b border-slate-200 bg-slate-50">
                        <div className="border-r border-slate-200 px-3 py-4">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                Time
                            </p>
                        </div>

                        {DAYS.map((day) => (
                            <div
                                key={day.value}
                                className="border-r border-slate-200 px-4 py-4 text-center last:border-r-0"
                            >
                                <p className="text-sm font-semibold text-slate-800">
                                    {day.label}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Time rows */}
                    {timeSlots.map((slot) => (
                        <div
                            key={slot.startTime}
                            className="grid grid-cols-[100px_repeat(7,minmax(150px,1fr))] border-b border-slate-100 last:border-b-0"
                        >
                            {/* Time */}
                            <div className="border-r border-slate-200 bg-slate-50/70 px-3 py-4">
                                <p className="text-xs font-semibold text-slate-700">
                                    {formatTime(slot.startTime)}
                                </p>

                                <p className="mt-1 text-[10px] text-slate-400">
                                    {formatTime(slot.endTime)}
                                </p>
                            </div>

                            {/* Days */}
                            {DAYS.map((day) => {
                                const classes =
                                    getClassesForDayAndTime(
                                        day.value,
                                        slot.startTime
                                    );

                                return (
                                    <div
                                        key={`${day.value}-${slot.startTime}`}
                                        className="min-h-[170px] border-r border-slate-100 p-2.5 last:border-r-0"
                                    >
                                        {classes.length > 0 ? (
                                            <div className="space-y-2">
                                                {classes.map(
                                                    (timetable) => (
                                                        <TimetableClassCard
                                                            key={
                                                                timetable.id
                                                            }
                                                            timetable={
                                                                timetable
                                                            }
                                                            onView={() =>
                                                                onView(
                                                                    timetable
                                                                )
                                                            }
                                                            onEdit={() =>
                                                                onEdit(
                                                                    timetable
                                                                )
                                                            }
                                                            onToggleStatus={() =>
                                                                onToggleStatus(
                                                                    timetable
                                                                )
                                                            }
                                                            onDelete={() =>
                                                                onDelete(
                                                                    timetable
                                                                )
                                                            }
                                                        />
                                                    )
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex h-full min-h-[145px] items-center justify-center">
                                                <span className="text-[11px] text-slate-300">
                                                    —
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 bg-slate-50 px-5 py-3">
                <p className="text-xs text-slate-500">
                    Showing{" "}
                    <span className="font-semibold text-slate-700">
                        {activeTimetables.length}
                    </span>{" "}
                    active schedule{" "}
                    {activeTimetables.length === 1
                        ? "entry"
                        : "entries"}
                </p>
            </div>
        </div>
    );
}
