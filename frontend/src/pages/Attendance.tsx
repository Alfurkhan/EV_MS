import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
    ArrowLeft,
    AlertCircle,
    CheckCircle2,
    ClipboardCheck,
    Eye,
    History,
    Loader2,
    Save,
    UserCheck,
    Users,
} from "lucide-react";
import toast from "react-hot-toast";

import { useAuth } from "../contexts/AuthContext";

import {
    getAttendanceForSession,
    getAttendanceStudents,
    getMyAttendance,
    getAdminAttendance,
    getMySessions,
    markAttendance,
} from "../features/faculty/services/facultyService";

import type {
    AttendanceResponse,
    AttendanceStatus,
    AttendanceStudent,
} from "../features/faculty/types/attendance";

import type { ClassSessionResponse } from "../features/faculty/types/classSession";

const STATUS_OPTIONS: {
    value: AttendanceStatus;
    label: string;
}[] = [
    {
        value: "PRESENT",
        label: "Present",
    },
    {
        value: "ABSENT",
        label: "Absent",
    },
    {
        value: "LATE",
        label: "Late",
    },
    {
        value: "EXCUSED",
        label: "Excused",
    },
];

export default function Attendance() {
    const { hasRole } = useAuth();

    const isStudent = hasRole("ROLE_STUDENT");
    const isAdmin = hasRole("ROLE_ADMIN");

    if (isStudent) {
        return <StudentAttendance />;
    }

    if (isAdmin) {
        return <AdminAttendance />;
    }

    return <FacultyAttendance />;
}

/* ============================================================= */
/* FACULTY ATTENDANCE                                             */
/* ============================================================= */

function FacultyAttendance() {
    const [searchParams] = useSearchParams();

    const sessionIdParam = searchParams.get("sessionId");

    const sessionId = sessionIdParam
        ? Number(sessionIdParam)
        : null;

    const [view, setView] =
        useState<"TAKE" | "HISTORY">("TAKE");

    const [history, setHistory] =
        useState<ClassSessionResponse[]>([]);

    const [historyLoading, setHistoryLoading] =
        useState(false);

    const [historyError, setHistoryError] =
        useState<string | null>(null);

    const [selectedHistorySession, setSelectedHistorySession] =
        useState<ClassSessionResponse | null>(null);

    const [historyAttendance, setHistoryAttendance] =
        useState<AttendanceResponse[]>([]);

    const [historyAttendanceSearch, setHistoryAttendanceSearch] =
        useState("");

    const [historyAttendanceStatusFilter, setHistoryAttendanceStatusFilter] =
        useState<AttendanceStatus | "ALL">("ALL");

    const [historySearch, setHistorySearch] =
        useState("");

    const [historyFromDate, setHistoryFromDate] =
        useState("");

    const [historyToDate, setHistoryToDate] =
        useState("");

    const [historySubjectFilter, setHistorySubjectFilter] =
        useState("");

    const [historyGradeFilter, setHistoryGradeFilter] =
        useState("");

    const [historySectionFilter, setHistorySectionFilter] =
        useState("");

    const [historyStatusFilter, setHistoryStatusFilter] =
        useState<"ALL" | "COMPLETED" | "CANCELLED">("ALL");

    const [attendanceLoading, setAttendanceLoading] =
        useState(false);

    const [students, setStudents] =
        useState<AttendanceStudent[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [error, setError] =
        useState<string | null>(null);

    const loadHistory = async () => {
        try {
            setHistoryLoading(true);
            setHistoryError(null);

            const data = await getMySessions();

            setHistory(
                data.filter(
                    (session) =>
                        session.status === "COMPLETED" ||
                        session.status === "CANCELLED"
                )
            );
        } catch (error: any) {
            console.error(
                "Failed to load attendance history:",
                error
            );

            setHistoryError(
                error?.response?.data?.message ||
                "Unable to load attendance history."
            );
        } finally {
            setHistoryLoading(false);
        }
    };

    const filteredHistory = useMemo(() => {
        const normalizedSearch =
            historySearch.trim().toLowerCase();

        return history.filter((session) => {
            const matchesSearch =
                !normalizedSearch ||
                session.subjectName
                    .toLowerCase()
                    .includes(normalizedSearch) ||
                session.subjectCode
                    .toLowerCase()
                    .includes(normalizedSearch);

            const matchesFromDate =
                !historyFromDate ||
                session.sessionDate >= historyFromDate;

            const matchesToDate =
                !historyToDate ||
                session.sessionDate <= historyToDate;

            const matchesSubject =
                !historySubjectFilter ||
                session.subjectName === historySubjectFilter;

            const matchesGrade =
                !historyGradeFilter ||
                session.gradeName === historyGradeFilter;

            const matchesSection =
                !historySectionFilter ||
                session.sectionName === historySectionFilter;

            const matchesStatus =
                historyStatusFilter === "ALL" ||
                session.status === historyStatusFilter;

            return (
                matchesSearch &&
                matchesFromDate &&
                matchesToDate &&
                matchesSubject &&
                matchesGrade &&
                matchesSection &&
                matchesStatus
            );
        });
    }, [
        history,
        historySearch,
        historyFromDate,
        historyToDate,
        historySubjectFilter,
        historyGradeFilter,
        historySectionFilter,
        historyStatusFilter,
    ]);

    const loadHistoryAttendance = async (
        session: ClassSessionResponse
    ) => {
        try {
            setAttendanceLoading(true);
            setSelectedHistorySession(session);
            setHistoryAttendance([]);

            setHistoryAttendanceSearch("");
            setHistoryAttendanceStatusFilter("ALL");

            const data =
                await getAttendanceForSession(session.id);

            setHistoryAttendance(data);
        } catch (error: any) {
            console.error(
                "Failed to load historical attendance:",
                error
            );

            setSelectedHistorySession(null);

            toast.error(
                error?.response?.data?.message ||
                "Unable to load attendance records."
            );
        } finally {
            setAttendanceLoading(false);
        }
    };

    const historySummary = useMemo(() => {
        return {
            present: historyAttendance.filter(
                (record) =>
                    record.status === "PRESENT"
            ).length,

            absent: historyAttendance.filter(
                (record) =>
                    record.status === "ABSENT"
            ).length,

            late: historyAttendance.filter(
                (record) =>
                    record.status === "LATE"
            ).length,

            excused: historyAttendance.filter(
                (record) =>
                    record.status === "EXCUSED"
            ).length,
        };
    }, [historyAttendance]);

    const filteredHistoryAttendance = useMemo(() => {
        const normalizedSearch =
            historyAttendanceSearch.trim().toLowerCase();

        return historyAttendance.filter((record) => {
            const matchesSearch =
                !normalizedSearch ||
                record.studentName
                    .toLowerCase()
                    .includes(normalizedSearch) ||
                record.studentEmail
                    .toLowerCase()
                    .includes(normalizedSearch);

            const matchesStatus =
                historyAttendanceStatusFilter === "ALL" ||
                record.status === historyAttendanceStatusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [
        historyAttendance,
        historyAttendanceSearch,
        historyAttendanceStatusFilter,
    ]);

    const loadStudents = async () => {
        if (view !== "TAKE") {
            return;
        }

        if (!sessionId || Number.isNaN(sessionId)) {
            setError(
                "No active class session was selected."
            );
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const data =
                await getAttendanceStudents(sessionId);

            setStudents(data);
        } catch (error: any) {
            console.error(
                "Failed to load attendance students:",
                error
            );

            setError(
                error?.response?.data?.message ||
                "Unable to load students for attendance."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (view === "TAKE") {
            void loadStudents();
        }
    }, [sessionId, view]);

    const updateStudent = (
        studentId: number,
        changes: Partial<AttendanceStudent>
    ) => {
        setStudents((current) =>
            current.map((student) =>
                student.studentId === studentId
                    ? {
                        ...student,
                        ...changes,
                    }
                    : student
            )
        );
    };

    const handleStatusChange = (
        studentId: number,
        status: AttendanceStatus
    ) => {
        updateStudent(studentId, {
            status,
        });
    };

    const handleRemarksChange = (
        studentId: number,
        remarks: string
    ) => {
        updateStudent(studentId, {
            remarks: remarks || null,
        });
    };

    const handleSave = async () => {
        if (!sessionId || Number.isNaN(sessionId)) {
            toast.error(
                "No active class session was selected."
            );
            return;
        }

        const incompleteStudents =
            students.filter(
                (student) => student.status === null
            );

        if (incompleteStudents.length > 0) {
            toast.error(
                `Please mark attendance for all ${incompleteStudents.length} remaining student${incompleteStudents.length === 1 ? "" : "s"}.`
            );
            return;
        }

        try {
            setSaving(true);

            await markAttendance({
                classSessionId: sessionId,
                attendance: students.map(
                    (student) => ({
                        studentId:
                        student.studentId,
                        status:
                            student.status!,
                        remarks:
                        student.remarks,
                    })
                ),
            });

            toast.success(
                "Attendance saved successfully."
            );

            await loadStudents();
        } catch (error: any) {
            console.error(
                "Failed to save attendance:",
                error
            );

            toast.error(
                error?.response?.data?.message ||
                "Unable to save attendance."
            );
        } finally {
            setSaving(false);
        }
    };

    const summary = useMemo(() => {
        return {
            total: students.length,
            present: students.filter(
                (student) =>
                    student.status === "PRESENT"
            ).length,
            absent: students.filter(
                (student) =>
                    student.status === "ABSENT"
            ).length,
            late: students.filter(
                (student) =>
                    student.status === "LATE"
            ).length,
            excused: students.filter(
                (student) =>
                    student.status === "EXCUSED"
            ).length,
            unmarked: students.filter(
                (student) =>
                    student.status === null
            ).length,
        };
    }, [students]);

    const handleTakeAttendanceView = () => {
        setView("TAKE");
        setSelectedHistorySession(null);
        setHistoryAttendance([]);
    };

    const handleHistoryView = () => {
        setView("HISTORY");
        setSelectedHistorySession(null);
        setHistoryAttendance([]);
        void loadHistory();
    };

    const handleBackToHistory = () => {
        setSelectedHistorySession(null);
        setHistoryAttendance([]);
    };

    return (
        <div className="space-y-6">

            {/* HEADER */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <ClipboardCheck
                            size={30}
                            className="text-blue-600"
                        />

                        <h1 className="text-4xl font-bold text-slate-800">
                            Attendance
                        </h1>
                    </div>

                    <p className="mt-1 text-slate-500">
                        Manage class attendance and view attendance history.
                    </p>
                </div>

                {view === "TAKE" &&
                    sessionId &&
                    !Number.isNaN(sessionId) && (
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={
                                saving ||
                                loading ||
                                students.length === 0 ||
                                summary.unmarked > 0
                            }
                            className="
                                inline-flex items-center
                                justify-center gap-2
                                rounded-xl bg-blue-600
                                px-5 py-2.5
                                text-sm font-semibold text-white
                                shadow-sm transition
                                hover:bg-blue-700
                                disabled:cursor-not-allowed
                                disabled:opacity-50
                            "
                        >
                            {saving ? (
                                <Loader2
                                    size={17}
                                    className="animate-spin"
                                />
                            ) : (
                                <Save size={17} />
                            )}

                            {saving
                                ? "Saving..."
                                : "Save Attendance"}
                        </button>
                    )}
            </div>

            {/* VIEW SWITCHER */}
            <div className="inline-flex w-full max-w-md rounded-xl border border-slate-200 bg-slate-100 p-1">
                <button
                    type="button"
                    onClick={handleTakeAttendanceView}
                    className={`
flex-1 rounded-lg px-4 py-2.5
text-sm font-semibold transition
${
                        view === "TAKE"
                            ? "bg-white text-blue-600 shadow-sm"
                            : "text-slate-500 hover:text-slate-700"
                    }
`}
                >
                    <span className="inline-flex items-center gap-2">
                        <ClipboardCheck size={16} />
                        Take Attendance
                    </span>
                </button>

                <button
                    type="button"
                    onClick={handleHistoryView}
                    className={`
flex-1 rounded-lg px-4 py-2.5
text-sm font-semibold transition
${
                        view === "HISTORY"
                            ? "bg-white text-blue-600 shadow-sm"
                            : "text-slate-500 hover:text-slate-700"
                    }
`}
                >
                    <span className="inline-flex items-center gap-2">
                        <History size={16} />
                        Attendance History
                    </span>
                </button>
            </div>

            {/* ===================================================== */}
            {/* TAKE ATTENDANCE                                      */}
            {/* ===================================================== */}

            {view === "TAKE" && (
                <>
                    {(!sessionId ||
                        Number.isNaN(sessionId)) && (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
                            <div className="flex items-start gap-3 text-amber-700">
                                <AlertCircle
                                    size={20}
                                    className="mt-0.5 shrink-0"
                                />

                                <div>
                                    <p className="font-semibold">
                                        No class session selected
                                    </p>

                                    <p className="mt-1 text-sm">
                                        Open an active class from
                                        My Classes and click
                                        Take Attendance.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {sessionId &&
                        !Number.isNaN(sessionId) &&
                        error && (
                            <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
                                <AlertCircle
                                    size={20}
                                    className="mt-0.5 shrink-0"
                                />

                                <div>
                                    <p className="font-medium">
                                        Unable to load attendance
                                    </p>

                                    <p className="mt-1 text-sm text-red-600">
                                        {error}
                                    </p>
                                </div>
                            </div>
                        )}

                    {sessionId &&
                        !Number.isNaN(sessionId) &&
                        !loading &&
                        !error && (
                            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                                <SummaryCard
                                    icon={<Users size={18} />}
                                    label="Total"
                                    value={summary.total}
                                />

                                <SummaryCard
                                    icon={<UserCheck size={18} />}
                                    label="Present"
                                    value={summary.present}
                                />

                                <SummaryCard
                                    icon={<AlertCircle size={18} />}
                                    label="Absent"
                                    value={summary.absent}
                                />

                                <SummaryCard
                                    icon={<CheckCircle2 size={18} />}
                                    label="Late"
                                    value={summary.late}
                                />

                                <SummaryCard
                                    icon={<ClipboardCheck size={18} />}
                                    label="Unmarked"
                                    value={summary.unmarked}
                                />
                            </div>
                        )}

                    {sessionId &&
                        !Number.isNaN(sessionId) &&
                        (
                            loading ? (
                                <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-16 shadow-sm">
                                    <div className="flex items-center gap-3 text-sm text-slate-500">
                                        <Loader2
                                            size={18}
                                            className="animate-spin text-blue-500"
                                        />

                                        Loading students...
                                    </div>
                                </div>
                            ) : students.length === 0 ? (
                                <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
                                    <Users
                                        size={32}
                                        className="mx-auto text-slate-300"
                                    />

                                    <h2 className="mt-4 text-base font-semibold text-slate-800">
                                        No students found
                                    </h2>

                                    <p className="mt-1 text-sm text-slate-400">
                                        There are no active students enrolled
                                        in this class.
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                                    <div className="hidden border-b border-slate-200 bg-slate-50 px-6 py-4 md:grid md:grid-cols-[2fr_1fr_2fr] md:gap-4">
                                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Student
                                        </div>

                                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Status
                                        </div>

                                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Remarks
                                        </div>
                                    </div>

                                    <div className="divide-y divide-slate-100">
                                        {students.map((student) => (
                                            <div
                                                key={student.studentId}
                                                className="grid grid-cols-1 gap-4 px-6 py-5 md:grid-cols-[2fr_1fr_2fr] md:items-center md:gap-4"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-600">
                                                        {student.studentName
                                                            .charAt(0)
                                                            .toUpperCase()}
                                                    </div>

                                                    <div className="min-w-0">
                                                        <p className="truncate font-semibold text-slate-800">
                                                            {student.studentName}
                                                        </p>

                                                        <p className="truncate text-sm text-slate-400">
                                                            {student.studentEmail}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2">
                                                    {STATUS_OPTIONS.map(
                                                        (option) => (
                                                            <button
                                                                key={
                                                                    option.value
                                                                }
                                                                type="button"
                                                                onClick={() =>
                                                                    handleStatusChange(
                                                                        student.studentId,
                                                                        option.value
                                                                    )
                                                                }
                                                                className={`
rounded-lg
border
px-3 py-2
text-xs
font-semibold
transition
${
                                                                    student.status ===
                                                                    option.value
                                                                        ? "border-blue-600 bg-blue-600 text-white"
                                                                        : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                                                                }
`}
                                                            >
                                                                {
                                                                    option.label
                                                                }
                                                            </button>
                                                        )
                                                    )}
                                                </div>

                                                <input
                                                    type="text"
                                                    value={
                                                        student.remarks ?? ""
                                                    }
                                                    onChange={(event) =>
                                                        handleRemarksChange(
                                                            student.studentId,
                                                            event.target.value
                                                        )
                                                    }
                                                    maxLength={500}
                                                    placeholder="Optional remarks"
                                                    className="
                                                        w-full
                                                        rounded-xl
                                                        border border-slate-200
                                                        bg-white
                                                        px-4 py-2.5
                                                        text-sm text-slate-700
                                                        outline-none
                                                        transition
                                                        placeholder:text-slate-400
                                                        focus:border-blue-500
                                                        focus:ring-2
                                                        focus:ring-blue-100
                                                    "
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
                        )}

                    {sessionId &&
                        !Number.isNaN(sessionId) &&
                        !loading &&
                        students.length > 0 && (
                            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
                                <span>
                                    {summary.total}{" "}
                                    {summary.total === 1
                                        ? "student"
                                        : "students"}
                                </span>

                                <span>
                                    {summary.unmarked === 0
                                        ? "All students marked"
                                        : `${summary.unmarked} remaining`}
                                </span>
                            </div>
                        )}
                </>
            )}

            {/* ===================================================== */}
            {/* ATTENDANCE HISTORY                                   */}
            {/* ===================================================== */}

            {view === "HISTORY" && (
                <div className="space-y-6">
                    {selectedHistorySession === null ? (
                        <>
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">
                                    Attendance History
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    View attendance recorded for your completed classes.
                                </p>

                                <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                    <div className="flex flex-col gap-4">

                                        <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end">

                                            {/* SEARCH */}
                                            <div className="min-w-64 flex-1">
                                                <label className="mb-1.5 block text-sm font-medium text-slate-600">
                                                    Search
                                                </label>

                                                <input
                                                    type="text"
                                                    value={historySearch}
                                                    onChange={(event) =>
                                                        setHistorySearch(event.target.value)
                                                    }
                                                    placeholder="Search subject..."
                                                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                                />
                                            </div>

                                            {/* FROM */}
                                            <div>
                                                <label className="mb-1.5 block text-sm font-medium text-slate-600">
                                                    From
                                                </label>

                                                <input
                                                    type="date"
                                                    value={historyFromDate}
                                                    onChange={(event) =>
                                                        setHistoryFromDate(event.target.value)
                                                    }
                                                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                                />
                                            </div>

                                            {/* TO */}
                                            <div>
                                                <label className="mb-1.5 block text-sm font-medium text-slate-600">
                                                    To
                                                </label>

                                                <input
                                                    type="date"
                                                    value={historyToDate}
                                                    onChange={(event) =>
                                                        setHistoryToDate(event.target.value)
                                                    }
                                                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                                />
                                            </div>

                                            {/* SUBJECT */}
                                            <div>
                                                <label className="mb-1.5 block text-sm font-medium text-slate-600">
                                                    Subject
                                                </label>

                                                <select
                                                    value={historySubjectFilter}
                                                    onChange={(event) =>
                                                        setHistorySubjectFilter(
                                                            event.target.value
                                                        )
                                                    }
                                                    className="min-w-40 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                                >
                                                    <option value="">All Subjects</option>

                                                    {[...new Set(
                                                        history.map(
                                                            (session) =>
                                                                session.subjectName
                                                        )
                                                    )]
                                                        .sort()
                                                        .map((subject) => (
                                                            <option
                                                                key={subject}
                                                                value={subject}
                                                            >
                                                                {subject}
                                                            </option>
                                                        ))}
                                                </select>
                                            </div>

                                            {/* GRADE */}
                                            <div>
                                                <label className="mb-1.5 block text-sm font-medium text-slate-600">
                                                    Grade
                                                </label>

                                                <select
                                                    value={historyGradeFilter}
                                                    onChange={(event) =>
                                                        setHistoryGradeFilter(
                                                            event.target.value
                                                        )
                                                    }
                                                    className="min-w-36 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                                >
                                                    <option value="">All Grades</option>

                                                    {[...new Set(
                                                        history.map(
                                                            (session) =>
                                                                session.gradeName
                                                        )
                                                    )]
                                                        .sort()
                                                        .map((grade) => (
                                                            <option
                                                                key={grade}
                                                                value={grade}
                                                            >
                                                                {grade}
                                                            </option>
                                                        ))}
                                                </select>
                                            </div>

                                            {/* SECTION */}
                                            <div>
                                                <label className="mb-1.5 block text-sm font-medium text-slate-600">
                                                    Section
                                                </label>

                                                <select
                                                    value={historySectionFilter}
                                                    onChange={(event) =>
                                                        setHistorySectionFilter(
                                                            event.target.value
                                                        )
                                                    }
                                                    className="min-w-36 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                                >
                                                    <option value="">All Sections</option>

                                                    {[...new Set(
                                                        history.map(
                                                            (session) =>
                                                                session.sectionName
                                                        )
                                                    )]
                                                        .sort()
                                                        .map((section) => (
                                                            <option
                                                                key={section}
                                                                value={section}
                                                            >
                                                                {section}
                                                            </option>
                                                        ))}
                                                </select>
                                            </div>

                                            {/* SESSION STATUS */}
                                            <div>
                                                <label className="mb-1.5 block text-sm font-medium text-slate-600">
                                                    Session Status
                                                </label>

                                                <select
                                                    value={historyStatusFilter}
                                                    onChange={(event) =>
                                                        setHistoryStatusFilter(
                                                            event.target.value as
                                                                | "ALL"
                                                                | "COMPLETED"
                                                                | "CANCELLED"
                                                        )
                                                    }
                                                    className="min-w-40 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                                >
                                                    <option value="ALL">
                                                        All Sessions
                                                    </option>

                                                    <option value="COMPLETED">
                                                        Completed
                                                    </option>

                                                    <option value="CANCELLED">
                                                        Cancelled
                                                    </option>
                                                </select>
                                            </div>

                                            {/* CLEAR */}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setHistorySearch("");
                                                    setHistoryFromDate("");
                                                    setHistoryToDate("");
                                                    setHistorySubjectFilter("");
                                                    setHistoryGradeFilter("");
                                                    setHistorySectionFilter("");
                                                    setHistoryStatusFilter("ALL");
                                                }}
                                                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                                            >
                                                Clear Filters
                                            </button>
                                        </div>

                                        <div className="text-sm text-slate-400">
                                            Showing{" "}
                                            <span className="font-semibold text-slate-600">
                {filteredHistory.length}
            </span>{" "}
                                            of{" "}
                                            <span className="font-semibold text-slate-600">
                {history.length}
            </span>{" "}
                                            classes
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {historyLoading ? (
                                <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-16 shadow-sm">
                                    <div className="flex items-center gap-3 text-sm text-slate-500">
                                        <Loader2
                                            size={18}
                                            className="animate-spin text-blue-500"
                                        />

                                        Loading attendance history...
                                    </div>
                                </div>
                            ) : historyError ? (
                                <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle size={20} />

                                        <div>
                                            <p className="font-semibold">
                                                Unable to load history
                                            </p>

                                            <p className="mt-1 text-sm">
                                                {historyError}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : history.length === 0 ? (
                                <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
                                    <History
                                        size={32}
                                        className="mx-auto text-slate-300"
                                    />

                                    <h2 className="mt-4 font-semibold text-slate-800">
                                        No attendance history
                                    </h2>

                                    <p className="mt-1 text-sm text-slate-400">
                                        Attendance records will appear here after
                                        classes are completed.
                                    </p>
                                </div>
                            ) : filteredHistory.length === 0 ? (
                                <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
                                    <History
                                        size={32}
                                        className="mx-auto text-slate-300"
                                    />

                                    <h2 className="mt-4 font-semibold text-slate-800">
                                        No matching classes
                                    </h2>

                                    <p className="mt-1 text-sm text-slate-400">
                                        No attendance sessions match your current filters.
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                                    <div className="hidden border-b border-slate-200 bg-slate-50 px-6 py-4 md:grid md:grid-cols-[1.2fr_2fr_1.5fr_1fr_1fr] md:gap-4">
                                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Date
                                        </div>

                                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Subject
                                        </div>

                                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Class
                                        </div>

                                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Status
                                        </div>

                                        <div />
                                    </div>

                                    <div className="divide-y divide-slate-100">
                                        {filteredHistory.map((session) => (
                                            <div
                                                key={session.id}
                                                className="grid grid-cols-1 gap-4 px-6 py-5 md:grid-cols-[1.2fr_2fr_1.5fr_1fr_1fr] md:items-center md:gap-4"
                                            >
                                                <div>
                                                    <p className="font-semibold text-slate-800">
                                                        {formatDate(
                                                            session.sessionDate
                                                        )}
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="font-semibold text-slate-800">
                                                        {session.subjectName}
                                                    </p>

                                                    <p className="text-sm text-slate-400">
                                                        {session.subjectCode}
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="font-medium text-slate-700">
                                                        {session.gradeName}
                                                    </p>

                                                    <p className="text-sm text-slate-400">
                                                        Section{" "}
                                                        {session.sectionName}
                                                    </p>
                                                </div>

                                                <div>
                                                    <span
                                                        className={`
inline-flex rounded-full
px-3 py-1
text-xs font-semibold
${
                                                            session.status ===
                                                            "COMPLETED"
                                                                ? "bg-green-50 text-green-700"
                                                                : "bg-red-50 text-red-700"
                                                        }
`}
                                                    >
                                                        {session.status}
                                                    </span>
                                                </div>

                                                <div className="flex justify-start md:justify-end">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            void loadHistoryAttendance(
                                                                session
                                                            )
                                                        }
                                                        className="
                                                            inline-flex items-center gap-2
                                                            rounded-xl border
                                                            border-blue-200
                                                            bg-blue-50
                                                            px-4 py-2
                                                            text-sm font-semibold
                                                            text-blue-700
                                                            transition
                                                            hover:bg-blue-100
                                                        "
                                                    >
                                                        <Eye size={16} />
                                                        View
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="space-y-6">
                            <button
                                type="button"
                                onClick={handleBackToHistory}
                                className="
                                    inline-flex items-center gap-2
                                    text-sm font-semibold
                                    text-slate-600
                                    transition
                                    hover:text-blue-600
                                "
                            >
                                <ArrowLeft size={17} />
                                Back to History
                            </button>

                            <div>
                                <h2 className="text-2xl font-bold text-slate-800">
                                    {selectedHistorySession.subjectName}
                                </h2>

                                <p className="mt-1 text-slate-500">
                                    {selectedHistorySession.gradeName}
                                    {" • "}
                                    Section{" "}
                                    {selectedHistorySession.sectionName}
                                    {" • "}
                                    {formatDate(
                                        selectedHistorySession.sessionDate
                                    )}
                                </p>

                                <p className="mt-1 text-sm text-slate-400">
                                    {selectedHistorySession.scheduledStartTime}
                                    {" - "}
                                    {selectedHistorySession.scheduledEndTime}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                                <SummaryCard
                                    icon={<UserCheck size={18} />}
                                    label="Present"
                                    value={historySummary.present}
                                />

                                <SummaryCard
                                    icon={<AlertCircle size={18} />}
                                    label="Absent"
                                    value={historySummary.absent}
                                />

                                <SummaryCard
                                    icon={<CheckCircle2 size={18} />}
                                    label="Late"
                                    value={historySummary.late}
                                />

                                <SummaryCard
                                    icon={<ClipboardCheck size={18} />}
                                    label="Excused"
                                    value={historySummary.excused}
                                />
                            </div>

                            {!attendanceLoading && historyAttendance.length > 0 && (
                                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-slate-700">
                                                Search Student
                                            </label>

                                            <input
                                                type="text"
                                                value={historyAttendanceSearch}
                                                onChange={(event) =>
                                                    setHistoryAttendanceSearch(
                                                        event.target.value
                                                    )
                                                }
                                                placeholder="Search by student name or email..."
                                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-sm font-medium text-slate-700">
                                                Status
                                            </label>

                                            <select
                                                value={historyAttendanceStatusFilter}
                                                onChange={(event) =>
                                                    setHistoryAttendanceStatusFilter(
                                                        event.target.value as
                                                            | AttendanceStatus
                                                            | "ALL"
                                                    )
                                                }
                                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                                            >
                                                <option value="ALL">All Statuses</option>
                                                <option value="PRESENT">Present</option>
                                                <option value="ABSENT">Absent</option>
                                                <option value="LATE">Late</option>
                                                <option value="EXCUSED">Excused</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                                        <p className="text-sm text-slate-500">
                                            Showing{" "}
                                            <span className="font-semibold text-slate-700">
                    {filteredHistoryAttendance.length}
                </span>{" "}
                                            of{" "}
                                            <span className="font-semibold text-slate-700">
                    {historyAttendance.length}
                </span>{" "}
                                            students
                                        </p>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setHistoryAttendanceSearch("");
                                                setHistoryAttendanceStatusFilter("ALL");
                                            }}
                                            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                                        >
                                            Clear Filters
                                        </button>
                                    </div>
                                </div>
                            )}

                            {attendanceLoading ? (
                                <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-16 shadow-sm">
                                    <div className="flex items-center gap-3 text-sm text-slate-500">
                                        <Loader2
                                            size={18}
                                            className="animate-spin text-blue-500"
                                        />

                                        Loading attendance records...
                                    </div>
                                </div>
                            ) : historyAttendance.length === 0 ? (
                                <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
                                    <ClipboardCheck
                                        size={32}
                                        className="mx-auto text-slate-300"
                                    />

                                    <h2 className="mt-4 font-semibold text-slate-800">
                                        No attendance records
                                    </h2>

                                    <p className="mt-1 text-sm text-slate-400">
                                        No student attendance was recorded
                                        for this class session.
                                    </p>
                                </div>
                            ) : filteredHistoryAttendance.length === 0 ? (
                                <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
                                    <h2 className="font-semibold text-slate-800">
                                        No matching students
                                    </h2>

                                    <p className="mt-1 text-sm text-slate-400">
                                        No students match your current filters.
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                                    <div className="hidden border-b border-slate-200 bg-slate-50 px-6 py-4 md:grid md:grid-cols-[2fr_1fr_2fr] md:gap-4">
                                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Student
                                        </div>

                                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Status
                                        </div>

                                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                            Remarks
                                        </div>
                                    </div>

                                    <div className="divide-y divide-slate-100">
                                        {filteredHistoryAttendance.map((record) => (
                                                <div
                                                    key={record.id}
                                                    className="grid grid-cols-1 gap-4 px-6 py-5 md:grid-cols-[2fr_1fr_2fr] md:items-center md:gap-4"
                                                >
                                                    <div>
                                                        <p className="font-semibold text-slate-800">
                                                            {
                                                                record.studentName
                                                            }
                                                        </p>

                                                        <p className="text-sm text-slate-400">
                                                            {
                                                                record.studentEmail
                                                            }
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <span
                                                            className={`
inline-flex rounded-full
px-3 py-1
text-xs font-semibold
${
                                                                record.status ===
                                                                "PRESENT"
                                                                    ? "bg-green-50 text-green-700"
                                                                    : record.status ===
                                                                    "ABSENT"
                                                                        ? "bg-red-50 text-red-700"
                                                                        : record.status ===
                                                                        "LATE"
                                                                            ? "bg-amber-50 text-amber-700"
                                                                            : "bg-blue-50 text-blue-700"
                                                            }
`}
                                                        >
                                                            {
                                                                record.status
                                                            }
                                                        </span>
                                                    </div>

                                                    <div className="text-sm text-slate-500">
                                                        {
                                                            record.remarks ||
                                                            "—"
                                                        }
                                                    </div>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

/* ============================================================= */
/* STUDENT ATTENDANCE                                             */
/* ============================================================= */

function StudentAttendance() {
    const [attendance, setAttendance] =
        useState<AttendanceResponse[]>([]);

    const [search, setSearch] = useState("");

    const [fromDate, setFromDate] = useState("");

    const [toDate, setToDate] = useState("");

    const [subjectFilter, setSubjectFilter] = useState("");

    const [statusFilter, setStatusFilter] =
        useState<AttendanceStatus | "ALL">("ALL");

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState<string | null>(null);

    useEffect(() => {
        const loadAttendance = async () => {
            try {
                setLoading(true);
                setError(null);

                const data =
                    await getMyAttendance();

                setAttendance(data);
            } catch (error: any) {
                console.error(
                    "Failed to load student attendance:",
                    error
                );

                setError(
                    error?.response?.data?.message ||
                    "Unable to load your attendance."
                );
            } finally {
                setLoading(false);
            }
        };

        void loadAttendance();
    }, []);

    const filteredAttendance = useMemo(() => {
        const normalizedSearch = search
            .trim()
            .toLowerCase();

        return attendance.filter((record) => {
            const matchesSearch =
                !normalizedSearch ||
                record.subjectName
                    .toLowerCase()
                    .includes(normalizedSearch) ||
                record.subjectCode
                    .toLowerCase()
                    .includes(normalizedSearch);

            const matchesFromDate =
                !fromDate ||
                record.sessionDate >= fromDate;

            const matchesToDate =
                !toDate ||
                record.sessionDate <= toDate;

            const matchesSubject =
                !subjectFilter ||
                record.subjectName === subjectFilter;

            const matchesStatus =
                statusFilter === "ALL" ||
                record.status === statusFilter;

            return (
                matchesSearch &&
                matchesFromDate &&
                matchesToDate &&
                matchesSubject &&
                matchesStatus
            );
        });
    }, [
        attendance,
        search,
        fromDate,
        toDate,
        subjectFilter,
        statusFilter,
    ]);

    const summary = useMemo(() => {
        const present =
            filteredAttendance.filter(
                (record) =>
                    record.status === "PRESENT"
            ).length;

        const absent =
            filteredAttendance.filter(
                (record) =>
                    record.status === "ABSENT"
            ).length;

        const late =
            filteredAttendance.filter(
                (record) =>
                    record.status === "LATE"
            ).length;

        const excused =
            filteredAttendance.filter(
                (record) =>
                    record.status === "EXCUSED"
            ).length;

        const attended = present + late;

        const percentage =
            filteredAttendance.length === 0
                ? null
                : Math.round(
                (attended * 10000) /
                filteredAttendance.length
            ) / 100;

        return {
            total: filteredAttendance.length,
            present,
            absent,
            late,
            excused,
            percentage,
        };
    }, [filteredAttendance]);

    return (
        <div className="space-y-6">

            {/* HEADER */}
            <div>
                <div className="flex items-center gap-3">
                    <ClipboardCheck
                        size={30}
                        className="text-blue-600"
                    />

                    <h1 className="text-4xl font-bold text-slate-800">
                        My Attendance
                    </h1>
                </div>

                <p className="mt-1 text-slate-500">
                    View your attendance records and attendance percentage.
                </p>
            </div>

            {/* ERROR */}
            {error && (
                <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
                    <AlertCircle
                        size={20}
                        className="mt-0.5 shrink-0"
                    />

                    <div>
                        <p className="font-semibold">
                            Unable to load attendance
                        </p>

                        <p className="mt-1 text-sm text-red-600">
                            {error}
                        </p>
                    </div>
                </div>
            )}

            {/* LOADING */}
            {loading ? (
                <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-20 shadow-sm">
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                        <Loader2
                            size={18}
                            className="animate-spin text-blue-500"
                        />

                        Loading your attendance...
                    </div>
                </div>
            ) : (
                <>
                    {/* OVERVIEW */}
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">

                        <StudentAttendanceCard
                            label="Attendance"
                            value={
                                summary.percentage === null
                                    ? "—"
                                    : `${summary.percentage}%`
                            }
                            icon={
                                <ClipboardCheck size={18} />
                            }
                        />

                        <StudentAttendanceCard
                            label="Total Classes"
                            value={summary.total}
                            icon={
                                <Users size={18} />
                            }
                        />

                        <StudentAttendanceCard
                            label="Present"
                            value={summary.present}
                            icon={
                                <UserCheck size={18} />
                            }
                        />

                        <StudentAttendanceCard
                            label="Absent"
                            value={summary.absent}
                            icon={
                                <AlertCircle size={18} />
                            }
                        />

                        <StudentAttendanceCard
                            label="Late"
                            value={summary.late}
                            icon={
                                <CheckCircle2 size={18} />
                            }
                        />

                        <StudentAttendanceCard
                            label="Excused"
                            value={summary.excused}
                            icon={
                                <ClipboardCheck size={18} />
                            }
                        />

                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex flex-col gap-4">

                            <div className="flex flex-col gap-4 lg:flex-row lg:items-end">

                                {/* SEARCH */}
                                <div className="flex-1">
                                    <label className="mb-1.5 block text-sm font-medium text-slate-600">
                                        Search
                                    </label>

                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(event) =>
                                            setSearch(event.target.value)
                                        }
                                        placeholder="Search subject..."
                                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>

                                {/* FROM DATE */}
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-600">
                                        From
                                    </label>

                                    <input
                                        type="date"
                                        value={fromDate}
                                        onChange={(event) =>
                                            setFromDate(event.target.value)
                                        }
                                        className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>

                                {/* TO DATE */}
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-600">
                                        To
                                    </label>

                                    <input
                                        type="date"
                                        value={toDate}
                                        onChange={(event) =>
                                            setToDate(event.target.value)
                                        }
                                        className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>

                                {/* SUBJECT */}
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-600">
                                        Subject
                                    </label>

                                    <select
                                        value={subjectFilter}
                                        onChange={(event) =>
                                            setSubjectFilter(event.target.value)
                                        }
                                        className="min-w-44 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    >
                                        <option value="">All Subjects</option>

                                        {[...new Set(
                                            attendance.map(
                                                (record) => record.subjectName
                                            )
                                        )]
                                            .sort()
                                            .map((subject) => (
                                                <option
                                                    key={subject}
                                                    value={subject}
                                                >
                                                    {subject}
                                                </option>
                                            ))}
                                    </select>
                                </div>

                                {/* STATUS */}
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-600">
                                        Status
                                    </label>

                                    <select
                                        value={statusFilter}
                                        onChange={(event) =>
                                            setStatusFilter(
                                                event.target.value as
                                                    | AttendanceStatus
                                                    | "ALL"
                                            )
                                        }
                                        className="min-w-36 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    >
                                        <option value="ALL">All Status</option>
                                        <option value="PRESENT">Present</option>
                                        <option value="ABSENT">Absent</option>
                                        <option value="LATE">Late</option>
                                        <option value="EXCUSED">Excused</option>
                                    </select>
                                </div>

                                {/* CLEAR */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearch("");
                                        setFromDate("");
                                        setToDate("");
                                        setSubjectFilter("");
                                        setStatusFilter("ALL");
                                    }}
                                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                                >
                                    Clear Filters
                                </button>

                            </div>

                            {/* RESULT COUNT */}
                            <div className="text-sm text-slate-400">
                                Showing{" "}
                                <span className="font-semibold text-slate-600">
                {filteredAttendance.length}
            </span>{" "}
                                of{" "}
                                <span className="font-semibold text-slate-600">
                {attendance.length}
            </span>{" "}
                                records
                            </div>

                        </div>
                    </div>

                    {/* HISTORY */}
                    <div className="space-y-4">

                        <div>
                            <h2 className="text-xl font-bold text-slate-800">
                                Attendance History
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Your individual attendance records.
                            </p>
                        </div>

                        {attendance.length === 0 ? (
                            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
                                <History
                                    size={32}
                                    className="mx-auto text-slate-300"
                                />

                                <h2 className="mt-4 font-semibold text-slate-800">
                                    No attendance records
                                </h2>

                                <p className="mt-1 text-sm text-slate-400">
                                    Your attendance records will appear here
                                    once attendance is recorded.
                                </p>
                            </div>
                        ) : filteredAttendance.length === 0 ? (
                            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
                            <History
                            size={32}
                            className="mx-auto text-slate-300"
                        />

                        <h2 className="mt-4 font-semibold text-slate-800">
                            No matching records
                        </h2>

                        <p className="mt-1 text-sm text-slate-400">
                        No attendance records match your current filters.
                        </p>
                            </div>
                        ) : (

                            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                                {/* TABLE HEADER */}
                                <div className="hidden border-b border-slate-200 bg-slate-50 px-6 py-4 md:grid md:grid-cols-[1.2fr_2fr_1.5fr_1.2fr_2fr] md:gap-4">
                                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Date
                                    </div>

                                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Subject
                                    </div>

                                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Class
                                    </div>

                                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Status
                                    </div>

                                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Remarks
                                    </div>
                                </div>

                                {/* RECORDS */}
                                <div className="divide-y divide-slate-100">
                                    {filteredAttendance.map((record) => (
                                        <div
                                            key={record.id}
                                            className="grid grid-cols-1 gap-4 px-6 py-5 md:grid-cols-[1.2fr_2fr_1.5fr_1.2fr_2fr] md:items-center md:gap-4"
                                        >
                                            {/* DATE */}
                                            <div>
                                                <p className="font-semibold text-slate-800">
                                                    {formatDate(
                                                        record.sessionDate
                                                    )}
                                                </p>
                                            </div>

                                            {/* SUBJECT */}
                                            <div>
                                                <p className="font-semibold text-slate-800">
                                                    {record.subjectName || "Unknown Subject"}
                                                </p>

                                                {record.subjectCode && (
                                                    <p className="text-sm text-slate-400">
                                                        {record.subjectCode}
                                                    </p>
                                                )}
                                            </div>

                                            {/* CLASS */}
                                            <div>
                                                <p className="font-medium text-slate-700">
                                                    {record.gradeName && record.sectionName
                                                        ? `${record.gradeName} - ${record.sectionName}`
                                                        : "Unknown Class"}
                                                </p>
                                            </div>

                                            {/* STATUS */}
                                            <div>
                                                <StudentStatusBadge
                                                    status={
                                                        record.status
                                                    }
                                                />
                                            </div>

                                            {/* REMARKS */}
                                            <div className="text-sm text-slate-500">
                                                {record.remarks ||
                                                    "—"}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

function StudentAttendanceCard({
                                   label,
                                   value,
                                   icon,
                               }: {
    label: string;
    value: number | string;
    icon: React.ReactNode;
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                    {icon}
                </div>

                <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-400">
                        {label}
                    </p>

                    <p className="truncate text-xl font-bold text-slate-800">
                        {value}
                    </p>
                </div>
            </div>
        </div>
    );
}

function StudentStatusBadge({
                                status,
                            }: {
    status: AttendanceStatus;
}) {
    const className =
        status === "PRESENT"
            ? "bg-green-50 text-green-700"
            : status === "ABSENT"
                ? "bg-red-50 text-red-700"
                : status === "LATE"
                    ? "bg-amber-50 text-amber-700"
                    : "bg-blue-50 text-blue-700";

    return (
        <span
            className={`
                inline-flex rounded-full
                px-3 py-1
                text-xs font-semibold
                ${className}
            `}
        >
            {status}
        </span>
    );
}

interface SummaryCardProps {
    icon: React.ReactNode;
    label: string;
    value: number;
}

function SummaryCard({
                         icon,
                         label,
                         value,
                     }: SummaryCardProps) {
    return (
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                {icon}
            </div>

            <div>
                <p className="text-xs font-medium text-slate-400">
                    {label}
                </p>

                <p className="text-xl font-bold text-slate-800">
                    {value}
                </p>
            </div>
        </div>
    );
}

function formatDate(date: string) {
    return new Date(
        `${date}T00:00:00`
    ).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function AdminAttendance() {
    const [attendance, setAttendance] =
        useState<AttendanceResponse[]>([]);

    const [search, setSearch] = useState("");

    const [fromDate, setFromDate] = useState("");

    const [toDate, setToDate] = useState("");

    const [subjectFilter, setSubjectFilter] =
        useState("");

    const [facultyFilter, setFacultyFilter] =
        useState("");

    const [gradeFilter, setGradeFilter] =
        useState("");

    const [sectionFilter, setSectionFilter] =
        useState("");

    const [statusFilter, setStatusFilter] =
        useState<AttendanceStatus | "ALL">("ALL");

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState<string | null>(null);

    useEffect(() => {
        const loadAttendance = async () => {
            try {
                setLoading(true);
                setError(null);

                const data =
                    await getAdminAttendance();

                setAttendance(data);
            } catch (error: any) {
                console.error(
                    "Failed to load admin attendance:",
                    error
                );

                setError(
                    error?.response?.data?.message ||
                    "Unable to load school attendance."
                );
            } finally {
                setLoading(false);
            }
        };

        void loadAttendance();
    }, []);

    const filteredAttendance = useMemo(() => {
        const normalizedSearch =
            search.trim().toLowerCase();

        return attendance.filter((record) => {
            const matchesSearch =
                !normalizedSearch ||
                record.studentName
                    .toLowerCase()
                    .includes(normalizedSearch) ||
                record.studentEmail
                    .toLowerCase()
                    .includes(normalizedSearch) ||
                record.subjectName
                    .toLowerCase()
                    .includes(normalizedSearch) ||
                record.subjectCode
                    .toLowerCase()
                    .includes(normalizedSearch) ||
                (record.facultyName ?? "")
                    .toLowerCase()
                    .includes(normalizedSearch) ||
                (record.facultyEmail ?? "")
                    .toLowerCase()
                    .includes(normalizedSearch);

            const matchesFromDate =
                !fromDate ||
                record.sessionDate >= fromDate;

            const matchesToDate =
                !toDate ||
                record.sessionDate <= toDate;

            const matchesSubject =
                !subjectFilter ||
                record.subjectName === subjectFilter;

            const matchesFaculty =
                !facultyFilter ||
                record.facultyName === facultyFilter;

            const matchesGrade =
                !gradeFilter ||
                record.gradeName === gradeFilter;

            const matchesSection =
                !sectionFilter ||
                record.sectionName === sectionFilter;

            const matchesStatus =
                statusFilter === "ALL" ||
                record.status === statusFilter;

            return (
                matchesSearch &&
                matchesFromDate &&
                matchesToDate &&
                matchesSubject &&
                matchesFaculty &&
                matchesGrade &&
                matchesSection &&
                matchesStatus
            );
        });
    }, [
        attendance,
        search,
        fromDate,
        toDate,
        subjectFilter,
        facultyFilter,
        gradeFilter,
        sectionFilter,
        statusFilter,
    ]);

    const adminSummary = useMemo(() => {
        const total = filteredAttendance.length;

        const present = filteredAttendance.filter(
            (record) => record.status === "PRESENT"
        ).length;

        const absent = filteredAttendance.filter(
            (record) => record.status === "ABSENT"
        ).length;

        const late = filteredAttendance.filter(
            (record) => record.status === "LATE"
        ).length;

        const excused = filteredAttendance.filter(
            (record) => record.status === "EXCUSED"
        ).length;

        const attended = present + late;

        const percentage =
            total === 0
                ? 0
                : Math.round(
                      (attended * 10000) / total
                  ) / 100;

        return {
            total,
            present,
            absent,
            late,
            excused,
            percentage,
        };
    }, [filteredAttendance]);

    return (
        <div className="space-y-6">

            {/* HEADER */}
            <div>
                <div className="flex items-center gap-3">
                    <ClipboardCheck
                        size={30}
                        className="text-blue-600"
                    />

                    <h1 className="text-4xl font-bold text-slate-800">
                        Attendance
                    </h1>
                </div>

                <p className="mt-1 text-slate-500">
                    View and monitor attendance across the school.
                </p>
            </div>

            {/* ERROR */}
            {error && (
                <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
                    <AlertCircle
                        size={20}
                        className="mt-0.5 shrink-0"
                    />

                    <div>
                        <p className="font-semibold">
                            Unable to load attendance
                        </p>

                        <p className="mt-1 text-sm text-red-600">
                            {error}
                        </p>
                    </div>
                </div>
            )}

            {/* LOADING */}
            {loading ? (
                <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-20 shadow-sm">
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                        <Loader2
                            size={18}
                            className="animate-spin text-blue-500"
                        />

                        Loading school attendance...
                    </div>
                </div>
            ) : (
                <>
                    {/* FILTERS */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex flex-col gap-4">

                            <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end">

                                {/* SEARCH */}
                                <div className="min-w-64 flex-1">
                                    <label className="mb-1.5 block text-sm font-medium text-slate-600">
                                        Search
                                    </label>

                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(event) =>
                                            setSearch(
                                                event.target.value
                                            )
                                        }
                                        placeholder="Student, subject, or faculty..."
                                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>

                                {/* FROM */}
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-600">
                                        From
                                    </label>

                                    <input
                                        type="date"
                                        value={fromDate}
                                        onChange={(event) =>
                                            setFromDate(
                                                event.target.value
                                            )
                                        }
                                        className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>

                                {/* TO */}
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-600">
                                        To
                                    </label>

                                    <input
                                        type="date"
                                        value={toDate}
                                        onChange={(event) =>
                                            setToDate(
                                                event.target.value
                                            )
                                        }
                                        className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>

                                {/* SUBJECT */}
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-600">
                                        Subject
                                    </label>

                                    <select
                                        value={subjectFilter}
                                        onChange={(event) =>
                                            setSubjectFilter(
                                                event.target.value
                                            )
                                        }
                                        className="min-w-40 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    >
                                        <option value="">
                                            All Subjects
                                        </option>

                                        {[...new Set(
                                            attendance.map(
                                                (record) =>
                                                    record.subjectName
                                            )
                                        )]
                                            .sort()
                                            .map((subject) => (
                                                <option
                                                    key={subject}
                                                    value={subject}
                                                >
                                                    {subject}
                                                </option>
                                            ))}
                                    </select>
                                </div>

                                {/* FACULTY */}
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-600">
                                        Faculty
                                    </label>

                                    <select
                                        value={facultyFilter}
                                        onChange={(event) =>
                                            setFacultyFilter(
                                                event.target.value
                                            )
                                        }
                                        className="min-w-40 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    >
                                        <option value="">
                                            All Faculty
                                        </option>

                                        {[...new Set(
                                            attendance
                                                .map(
                                                    (record) =>
                                                        record.facultyName
                                                )
                                                .filter(
                                                    (
                                                        faculty
                                                    ): faculty is string =>
                                                        Boolean(faculty)
                                                )
                                        )]
                                            .sort()
                                            .map((faculty) => (
                                                <option
                                                    key={faculty}
                                                    value={faculty}
                                                >
                                                    {faculty}
                                                </option>
                                            ))}
                                    </select>
                                </div>

                                {/* GRADE */}
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-600">
                                        Grade
                                    </label>

                                    <select
                                        value={gradeFilter}
                                        onChange={(event) =>
                                            setGradeFilter(
                                                event.target.value
                                            )
                                        }
                                        className="min-w-36 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    >
                                        <option value="">
                                            All Grades
                                        </option>

                                        {[...new Set(
                                            attendance.map(
                                                (record) =>
                                                    record.gradeName
                                            )
                                        )]
                                            .sort()
                                            .map((grade) => (
                                                <option
                                                    key={grade}
                                                    value={grade}
                                                >
                                                    {grade}
                                                </option>
                                            ))}
                                    </select>
                                </div>

                                {/* SECTION */}
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-600">
                                        Section
                                    </label>

                                    <select
                                        value={sectionFilter}
                                        onChange={(event) =>
                                            setSectionFilter(
                                                event.target.value
                                            )
                                        }
                                        className="min-w-36 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    >
                                        <option value="">
                                            All Sections
                                        </option>

                                        {[...new Set(
                                            attendance.map(
                                                (record) =>
                                                    record.sectionName
                                            )
                                        )]
                                            .sort()
                                            .map((section) => (
                                                <option
                                                    key={section}
                                                    value={section}
                                                >
                                                    {section}
                                                </option>
                                            ))}
                                    </select>
                                </div>

                                {/* STATUS */}
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-600">
                                        Status
                                    </label>

                                    <select
                                        value={statusFilter}
                                        onChange={(event) =>
                                            setStatusFilter(
                                                event.target.value as
                                                    | AttendanceStatus
                                                    | "ALL"
                                            )
                                        }
                                        className="min-w-40 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    >
                                        <option value="ALL">
                                            All Statuses
                                        </option>

                                        <option value="PRESENT">
                                            Present
                                        </option>

                                        <option value="ABSENT">
                                            Absent
                                        </option>

                                        <option value="LATE">
                                            Late
                                        </option>

                                        <option value="EXCUSED">
                                            Excused
                                        </option>
                                    </select>
                                </div>

                                {/* CLEAR */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearch("");
                                        setFromDate("");
                                        setToDate("");
                                        setSubjectFilter("");
                                        setFacultyFilter("");
                                        setGradeFilter("");
                                        setSectionFilter("");
                                        setStatusFilter("ALL");
                                    }}
                                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                                >
                                    Clear Filters
                                </button>
                            </div>

                            <div className="text-sm text-slate-400">
                                Showing{" "}
                                <span className="font-semibold text-slate-600">
                                    {filteredAttendance.length}
                                </span>{" "}
                                of{" "}
                                <span className="font-semibold text-slate-600">
                                    {attendance.length}
                                </span>{" "}
                                records
                            </div>
                        </div>
                    </div>

                    {/* OVERVIEW */}
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">

                        <AdminAttendanceCard
                            label="Attendance"
                            value={
                                adminSummary.total === 0
                                    ? "—"
                                    : `${adminSummary.percentage}%`
                            }
                            icon={
                                <ClipboardCheck size={18} />
                            }
                        />

                        <AdminAttendanceCard
                            label="Total Records"
                            value={adminSummary.total}
                            icon={
                                <Users size={18} />
                            }
                        />

                        <AdminAttendanceCard
                            label="Present"
                            value={adminSummary.present}
                            icon={
                                <UserCheck size={18} />
                            }
                        />

                        <AdminAttendanceCard
                            label="Absent"
                            value={adminSummary.absent}
                            icon={
                                <AlertCircle size={18} />
                            }
                        />

                        <AdminAttendanceCard
                            label="Late"
                            value={adminSummary.late}
                            icon={
                                <CheckCircle2 size={18} />
                            }
                        />

                    </div>

                    {/* HISTORY */}
                    <div className="space-y-4">

                        <div>
                            <h2 className="text-xl font-bold text-slate-800">
                                Attendance Records
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Attendance recorded across all classes and students.
                            </p>
                        </div>

                        {attendance.length === 0 ? (
                            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
                                <History
                                    size={32}
                                    className="mx-auto text-slate-300"
                                />

                                <h2 className="mt-4 font-semibold text-slate-800">
                                    No attendance records
                                </h2>

                                <p className="mt-1 text-sm text-slate-400">
                                    Attendance records will appear here once
                                    attendance is recorded.
                                </p>
                            </div>
                        ) : filteredAttendance.length === 0 ? (
                            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
                                <History
                                    size={32}
                                    className="mx-auto text-slate-300"
                                />

                                <h2 className="mt-4 font-semibold text-slate-800">
                                    No matching records
                                </h2>

                                <p className="mt-1 text-sm text-slate-400">
                                    No attendance records match your current filters.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                                {/* TABLE HEADER */}
                                <div className="hidden border-b border-slate-200 bg-slate-50 px-6 py-4 md:grid md:grid-cols-[1fr_1.6fr_1.6fr_1.5fr_1.4fr_1fr] md:gap-4">

                                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Date
                                    </div>

                                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Student
                                    </div>

                                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Subject
                                    </div>

                                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Class
                                    </div>

                                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Faculty
                                    </div>

                                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Status
                                    </div>

                                </div>

                                {/* RECORDS */}
                                <div className="divide-y divide-slate-100">

                                    {filteredAttendance.map((record) => (
                                        <div
                                            key={record.id}
                                            className="grid grid-cols-1 gap-4 px-6 py-5 md:grid-cols-[1fr_1.6fr_1.6fr_1.5fr_1.4fr_1fr] md:items-center md:gap-4"
                                        >

                                            {/* DATE */}
                                            <div>
                                                <p className="font-semibold text-slate-800">
                                                    {formatDate(
                                                        record.sessionDate
                                                    )}
                                                </p>
                                            </div>

                                            {/* STUDENT */}
                                            <div className="min-w-0">
                                                <p className="truncate font-semibold text-slate-800">
                                                    {record.studentName}
                                                </p>

                                                <p className="truncate text-sm text-slate-400">
                                                    {record.studentEmail}
                                                </p>
                                            </div>

                                            {/* SUBJECT */}
                                            <div className="min-w-0">
                                                <p className="truncate font-semibold text-slate-800">
                                                    {record.subjectName}
                                                </p>

                                                <p className="text-sm text-slate-400">
                                                    {record.subjectCode}
                                                </p>
                                            </div>

                                            {/* CLASS */}
                                            <div>
                                                <p className="font-medium text-slate-700">
                                                    {record.gradeName}
                                                </p>

                                                <p className="text-sm text-slate-400">
                                                    Section{" "}
                                                    {record.sectionName}
                                                </p>
                                            </div>

                                            {/* FACULTY */}
                                            <div className="min-w-0">
                                                <p className="truncate font-medium text-slate-700">
                                                    {record.facultyName ||
                                                        "Unassigned"}
                                                </p>

                                                {record.facultyEmail && (
                                                    <p className="truncate text-sm text-slate-400">
                                                        {
                                                            record.facultyEmail
                                                        }
                                                    </p>
                                                )}
                                            </div>

                                            {/* STATUS */}
                                            <div>
                                                <AdminStatusBadge
                                                    status={
                                                        record.status
                                                    }
                                                />
                                            </div>

                                        </div>
                                    ))}

                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

function AdminAttendanceCard({
                                 label,
                                 value,
                                 icon,
                             }: {
    label: string;
    value: string | number;
    icon: React.ReactNode;
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500">
                        {label}
                    </p>

                    <p className="mt-2 text-2xl font-bold text-slate-800">
                        {value}
                    </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    {icon}
                </div>
            </div>
        </div>
    );
}

function AdminStatusBadge({
                              status,
                          }: {
    status: AttendanceStatus;
}) {
    const styles: Record<AttendanceStatus, string> = {
        PRESENT:
            "bg-emerald-50 text-emerald-700 border-emerald-200",
        ABSENT:
            "bg-red-50 text-red-700 border-red-200",
        LATE:
            "bg-amber-50 text-amber-700 border-amber-200",
        EXCUSED:
            "bg-blue-50 text-blue-700 border-blue-200",
    };

    const labels: Record<AttendanceStatus, string> = {
        PRESENT: "Present",
        ABSENT: "Absent",
        LATE: "Late",
        EXCUSED: "Excused",
    };

    return (
        <span
            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${styles[status]}`}
        >
            {labels[status]}
        </span>
    );
}