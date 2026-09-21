import {
    BookOpen,
    CalendarDays,
    CheckCircle2,
    Clock3,
    ExternalLink,
    MapPin,
    Monitor,
    PlayCircle,
    StickyNote,
    Square,
    ClipboardCheck,
} from "lucide-react";

import type { FacultyClass } from "../types/facultyClass";

import { useNavigate } from "react-router-dom";

interface MyClassCardProps {
    classItem: FacultyClass;
    onStart: (classItem: FacultyClass) => void;
    onEnd: (classItem: FacultyClass) => void;
}

function formatTime(time: string) {
    const [hours, minutes] = time.split(":").map(Number);

    const date = new Date();
    date.setHours(hours, minutes, 0, 0);

    return date.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
    });
}

function formatDate(date: string) {
    return new Date(`${date}T00:00:00`).toLocaleDateString([], {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function formatDuration(minutes: number | null) {
    if (minutes === null) {
        return null;
    }

    if (minutes < 60) {
        return `${minutes} min`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
        return `${hours} hr`;
    }

    return `${hours} hr ${remainingMinutes} min`;
}

function formatDateTime(value: string | null) {
    if (!value) {
        return null;
    }

    return new Date(value).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
    });
}

export default function MyClassCard({
    classItem,
    onStart,
    onEnd,
}: MyClassCardProps) {
    const navigate = useNavigate();

    const isNotStarted =
        classItem.status === "NOT_STARTED";

    const isInProgress =
        classItem.status === "IN_PROGRESS";

    const isCompleted =
        classItem.status === "COMPLETED";

    const isOnline =
        classItem.classType === "ONLINE";

    return (
        <div
            className="
                rounded-2xl
                border
                border-slate-200
                bg-white
                p-5
                shadow-sm
                transition
                hover:shadow-md
            "
        >
            {/* TOP ROW */}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                        <Clock3 size={16} />

                        <span>
                            {formatTime(
                                classItem.scheduledStartTime
                            )}
                            {" – "}
                            {formatTime(
                                classItem.scheduledEndTime
                            )}
                        </span>
                    </div>

                    <h2 className="mt-2 text-xl font-bold text-slate-800">
                        {classItem.subjectName}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        {classItem.gradeName}
                        {" • "}
                        Section {classItem.sectionName}
                    </p>
                </div>

                {/* STATUS */}

                {isNotStarted && (
                    <div
                        className="
                            inline-flex
                            w-fit
                            items-center
                            gap-2
                            rounded-full
                            bg-slate-100
                            px-3
                            py-1.5
                            text-xs
                            font-semibold
                            text-slate-600
                        "
                    >
                        <Clock3 size={14} />

                        Not Started
                    </div>
                )}

                {isInProgress && (
                    <div
                        className="
                            inline-flex
                            w-fit
                            items-center
                            gap-2
                            rounded-full
                            bg-red-50
                            px-3
                            py-1.5
                            text-xs
                            font-semibold
                            text-red-600
                        "
                    >
                        <span className="h-2 w-2 rounded-full bg-red-500" />

                        In Progress
                    </div>
                )}

                {isCompleted && (
                    <div
                        className="
                            inline-flex
                            w-fit
                            items-center
                            gap-2
                            rounded-full
                            bg-green-50
                            px-3
                            py-1.5
                            text-xs
                            font-semibold
                            text-green-600
                        "
                    >
                        <CheckCircle2 size={14} />

                        Completed
                    </div>
                )}
            </div>

            {/* TIMETABLE INFORMATION */}

            <div
                className="
                    mt-5
                    grid
                    grid-cols-1
                    gap-3
                    border-t
                    border-slate-100
                    pt-4
                    sm:grid-cols-2
                "
            >
                {/* SUBJECT CODE */}

                <div className="flex items-center gap-2 text-sm text-slate-500">
                    <BookOpen
                        size={16}
                        className="text-slate-400"
                    />

                    <span>
                        {classItem.subjectCode}
                    </span>
                </div>

                {/* DATE RANGE */}

                <div className="flex items-center gap-2 text-sm text-slate-500">
                    <CalendarDays
                        size={16}
                        className="text-slate-400"
                    />

                    <span>
                        {formatDate(classItem.startDate)}
                        {" – "}
                        {formatDate(classItem.endDate)}
                    </span>
                </div>

                {/* CLASS TYPE */}

                <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Monitor
                        size={16}
                        className="text-slate-400"
                    />

                    <span>
                        {isOnline
                            ? "Online Class"
                            : "Offline Class"}
                    </span>
                </div>

                {/* ROOM — OFFLINE ONLY */}

                {!isOnline && (
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        <MapPin
                            size={16}
                            className="text-slate-400"
                        />

                        <span>
                            {classItem.room ||
                                "Room not assigned"}
                        </span>
                    </div>
                )}

                {/* MEETING LINK — ONLINE ONLY */}

                {isOnline && classItem.meetingLink && (
                    <a
                        href={classItem.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="
                            inline-flex
                            w-fit
                            items-center
                            gap-2
                            text-sm
                            font-medium
                            text-blue-600
                            transition
                            hover:text-blue-700
                            hover:underline
                        "
                    >
                        <ExternalLink size={16} />

                        Join Meeting
                    </a>
                )}
            </div>

            {/* NOTES */}

            {classItem.notes && (
                <div
                    className="
                        mt-4
                        flex
                        items-start
                        gap-2
                        rounded-xl
                        bg-slate-50
                        px-4
                        py-3
                        text-sm
                        text-slate-600
                    "
                >
                    <StickyNote
                        size={16}
                        className="mt-0.5 shrink-0 text-slate-400"
                    />

                    <span>
                        {classItem.notes}
                    </span>
                </div>
            )}

            {/* SESSION INFORMATION */}

            {isInProgress && classItem.startedAt && (
                <div
                    className="
                        mt-4
                        rounded-xl
                        bg-red-50
                        px-4
                        py-3
                        text-sm
                        text-red-700
                    "
                >
                    Class started at{" "}
                    <span className="font-semibold">
                        {formatDateTime(
                            classItem.startedAt
                        )}
                    </span>
                </div>
            )}

            {isCompleted && (
                <div
                    className="
                        mt-4
                        rounded-xl
                        bg-green-50
                        px-4
                        py-3
                    "
                >
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-green-700">
                        {classItem.startedAt && (
                            <span>
                                Started{" "}
                                <strong>
                                    {formatDateTime(
                                        classItem.startedAt
                                    )}
                                </strong>
                            </span>
                        )}

                        {classItem.endedAt && (
                            <span>
                                Ended{" "}
                                <strong>
                                    {formatDateTime(
                                        classItem.endedAt
                                    )}
                                </strong>
                            </span>
                        )}

                        {classItem.durationMinutes !== null && (
                            <span>
                                Duration{" "}
                                <strong>
                                    {formatDuration(
                                        classItem.durationMinutes
                                    )}
                                </strong>
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* ACTION */}
            <div className="mt-5 flex flex-wrap justify-end gap-3">
                {isNotStarted && (
                    <button
                        type="button"
                        onClick={() => onStart(classItem)}
                        className="
                inline-flex items-center gap-2
                rounded-xl bg-blue-600
                px-5 py-2.5
                text-sm font-semibold text-white
                shadow-sm transition
                hover:bg-blue-700
            "
                    >
                        <PlayCircle size={17} />
                        Start Class
                    </button>
                )}

                {isInProgress && (
                    <>
                        <button
                            type="button"
                            onClick={() =>
                                navigate(
                                    `/attendance?sessionId=${classItem.sessionId}`
                                )
                            }
                            className="
                    inline-flex items-center gap-2
                    rounded-xl border border-blue-200
                    bg-blue-50
                    px-5 py-2.5
                    text-sm font-semibold text-blue-700
                    shadow-sm transition
                    hover:bg-blue-100
                "
                        >
                            <ClipboardCheck size={17} />
                            Take Attendance
                        </button>

                        <button
                            type="button"
                            onClick={() => onEnd(classItem)}
                            className="
                    inline-flex items-center gap-2
                    rounded-xl bg-red-600
                    px-5 py-2.5
                    text-sm font-semibold text-white
                    shadow-sm transition
                    hover:bg-red-700
                "
                        >
                            <Square size={16} />
                            End Class
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
