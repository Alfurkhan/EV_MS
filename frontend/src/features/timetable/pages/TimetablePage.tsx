import {
    AlertCircle,
    CalendarDays,
    Filter,
    List,
    Plus,
    RefreshCw,
    Search,
    X,
} from "lucide-react";

import { useMemo, useState } from "react";

import { useTimetable } from "../hooks/useTimetable";

import AddScheduleModal from "../components/AddScheduleModal";
import DeleteScheduleModal from "../components/DeleteScheduleModal";
import EditScheduleModal from "../components/EditScheduleModal";
import ScheduleActionsMenu from "../components/ScheduleActionsMenu";
import ScheduleDetailsModal from "../components/ScheduleDetailsModal";
import TimetableGrid from "../components/TimetableGrid";

import {
    disableTimetable,
    enableTimetable,
} from "../services/timetableService";

import type { Timetable } from "../types/timetable";

import Toast from "../../../components/common/Toast";

type ViewMode = "timetable" | "list";
type ClassTypeFilter = "ALL" | "ONLINE" | "OFFLINE";

export default function TimetablePage() {
    const {
        timetables,
        loading,
        error,
        refresh,
    } = useTimetable();

    const [viewMode, setViewMode] =
        useState<ViewMode>("timetable");

    const [search, setSearch] = useState("");

    const [academicYearFilter, setAcademicYearFilter] =
        useState("ALL");

    const [gradeFilter, setGradeFilter] =
        useState("ALL");

    const [sectionFilter, setSectionFilter] =
        useState("ALL");

    const [facultyFilter, setFacultyFilter] =
        useState("ALL");

    const [classTypeFilter, setClassTypeFilter] =
        useState<ClassTypeFilter>("ALL");

    const [statusFilter, setStatusFilter] =
        useState("ALL");

    const [filtersOpen, setFiltersOpen] =
        useState(false);

    const [addScheduleOpen, setAddScheduleOpen] =
        useState(false);

    const [editScheduleOpen, setEditScheduleOpen] =
        useState(false);

    const [deleteScheduleOpen, setDeleteScheduleOpen] =
        useState(false);

    const [selectedTimetable, setSelectedTimetable] =
        useState<Timetable | null>(null);

    const [detailsOpen, setDetailsOpen] =
        useState(false);

    const [toast, setToast] = useState<{
        type: "success" | "error";
        message: string;
    } | null>(null);

    const academicYears = useMemo(() => {
        return Array.from(
            new Map(
                timetables.map((item) => [
                    item.academicYearId,
                    item.academicYearName,
                ])
            ).entries()
        );
    }, [timetables]);

    const grades = useMemo(() => {
        const filtered =
            academicYearFilter === "ALL"
                ? timetables
                : timetables.filter(
                    (item) =>
                        String(item.academicYearId) ===
                        academicYearFilter
                );

        return Array.from(
            new Map(
                filtered.map((item) => [
                    item.gradeId,
                    item.gradeName,
                ])
            ).entries()
        );
    }, [timetables, academicYearFilter]);

    const sections = useMemo(() => {
        const filtered = timetables.filter((item) => {
            const academicYearMatches =
                academicYearFilter === "ALL" ||
                String(item.academicYearId) ===
                academicYearFilter;

            const gradeMatches =
                gradeFilter === "ALL" ||
                String(item.gradeId) === gradeFilter;

            return academicYearMatches && gradeMatches;
        });

        return Array.from(
            new Map(
                filtered.map((item) => [
                    item.sectionId,
                    item.sectionName,
                ])
            ).entries()
        );
    }, [
        timetables,
        academicYearFilter,
        gradeFilter,
    ]);

    const faculties = useMemo(() => {
        return Array.from(
            new Map(
                timetables.map((item) => [
                    item.facultyId,
                    item.facultyName,
                ])
            ).entries()
        );
    }, [timetables]);

    const filteredTimetables = useMemo(() => {
        const query = search.trim().toLowerCase();

        return timetables.filter((item) => {
            const searchableValues = [
                item.academicYearName,
                item.gradeName,
                item.sectionName,
                item.subjectName,
                item.subjectCode,
                item.facultyName,
                item.facultyEmail,
                item.dayOfWeek,
                item.startDate,
                item.endDate,
                item.classType,
                item.room,
                item.meetingLink,
                item.notes,
            ];

            const searchMatches =
                !query ||
                searchableValues
                    .filter(Boolean)
                    .some((value) =>
                        value!.toLowerCase().includes(query)
                    );

            const academicYearMatches =
                academicYearFilter === "ALL" ||
                String(item.academicYearId) ===
                academicYearFilter;

            const gradeMatches =
                gradeFilter === "ALL" ||
                String(item.gradeId) === gradeFilter;

            const sectionMatches =
                sectionFilter === "ALL" ||
                String(item.sectionId) ===
                sectionFilter;

            const facultyMatches =
                facultyFilter === "ALL" ||
                String(item.facultyId) ===
                facultyFilter;

            const classTypeMatches =
                classTypeFilter === "ALL" ||
                item.classType === classTypeFilter;

            const statusMatches =
                statusFilter === "ALL" ||
                (statusFilter === "ACTIVE" &&
                    item.active) ||
                (statusFilter === "INACTIVE" &&
                    !item.active);

            return (
                searchMatches &&
                academicYearMatches &&
                gradeMatches &&
                sectionMatches &&
                facultyMatches &&
                classTypeMatches &&
                statusMatches
            );
        });
    }, [
        timetables,
        search,
        academicYearFilter,
        gradeFilter,
        sectionFilter,
        facultyFilter,
        classTypeFilter,
        statusFilter,
    ]);

    const activeFilterCount = [
        academicYearFilter,
        gradeFilter,
        sectionFilter,
        facultyFilter,
        classTypeFilter,
        statusFilter,
    ].filter((value) => value !== "ALL").length;

    const clearFilters = () => {
        setAcademicYearFilter("ALL");
        setGradeFilter("ALL");
        setSectionFilter("ALL");
        setFacultyFilter("ALL");
        setClassTypeFilter("ALL");
        setStatusFilter("ALL");
    };

    const handleScheduleCreated = async () => {
        setAddScheduleOpen(false);

        await refresh();

        setToast({
            type: "success",
            message: "Schedule created successfully.",
        });
    };

    const handleScheduleUpdated = async () => {
        setEditScheduleOpen(false);
        setSelectedTimetable(null);

        await refresh();

        setToast({
            type: "success",
            message: "Schedule updated successfully.",
        });
    };

    const handleScheduleDeleted = async () => {
        setDeleteScheduleOpen(false);
        setSelectedTimetable(null);

        await refresh();

        setToast({
            type: "success",
            message: "Schedule deleted successfully.",
        });
    };

    const handleAcademicYearChange = (
        value: string
    ) => {
        setAcademicYearFilter(value);
        setGradeFilter("ALL");
        setSectionFilter("ALL");
    };

    const handleGradeChange = (value: string) => {
        setGradeFilter(value);
        setSectionFilter("ALL");
    };

    const handleViewSchedule = (
        timetable: Timetable
    ) => {
        setSelectedTimetable(timetable);
        setDetailsOpen(true);
    };

    const handleEditSchedule = (
        timetable: Timetable
    ) => {
        setSelectedTimetable(timetable);
        setEditScheduleOpen(true);
    };

    const handleToggleScheduleStatus = async (
        timetable: Timetable
    ) => {
        try {
            if (timetable.active) {
                await disableTimetable(timetable.id);

                setToast({
                    type: "success",
                    message: "Schedule disabled successfully.",
                });
            } else {
                await enableTimetable(timetable.id);

                setToast({
                    type: "success",
                    message: "Schedule enabled successfully.",
                });
            }

            await refresh();
        } catch (err) {
            console.error(
                "Failed to update schedule status:",
                err
            );

            let message =
                "Failed to update schedule status. Please try again.";

            if (
                typeof err === "object" &&
                err !== null &&
                "response" in err
            ) {
                const response = (
                    err as {
                        response?: {
                            data?: {
                                message?: string;
                            };
                        };
                    }
                ).response;

                if (response?.data?.message) {
                    message = response.data.message;
                }
            }

            setToast({
                type: "error",
                message,
            });
        }
    };

    const handleDeleteSchedule = (
        timetable: Timetable
    ) => {
        setSelectedTimetable(timetable);
        setDeleteScheduleOpen(true);
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

    const formatDateRange = (
        startDate: string,
        endDate: string
    ) => {
        if (!startDate && !endDate) {
            return "—";
        }

        if (startDate === endDate) {
            return formatDate(startDate);
        }

        return `${formatDate(startDate)} – ${formatDate(endDate)}`;
    };

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

    return (
        <div className="min-h-full bg-slate-50 p-6">
            {/* Header */}
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                            <CalendarDays size={22} />
                        </div>

                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">
                                Timetable
                            </h1>

                            <p className="text-sm text-slate-500">
                                Manage class schedules, date ranges, and faculty assignments
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() =>
                            setAddScheduleOpen(true)
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
                    >
                        <Plus size={17} />
                        Add Schedule
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            setFiltersOpen(
                                (current) => !current
                            )
                        }
                        className={`relative inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium shadow-sm transition ${
    filtersOpen ||
    activeFilterCount > 0
        ? "border-indigo-200 bg-indigo-50 text-indigo-700"
        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
}`}
                    >
                        <Filter size={17} />
                        Filters

                        {activeFilterCount > 0 && (
                            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1.5 text-[11px] font-bold text-white">
                                {activeFilterCount}
                            </span>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => void refresh()}
                        disabled={loading}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <RefreshCw
                            size={17}
                            className={
                                loading
                                    ? "animate-spin"
                                    : ""
                            }
                        />

                        Refresh
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="relative">
                    <Search
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                        type="text"
                        value={search}
                        onChange={(event) =>
                            setSearch(event.target.value)
                        }
                        placeholder="Search by subject, faculty, date, class type, room, meeting link..."
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-10 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                    />

                    {search && (
                        <button
                            type="button"
                            onClick={() => setSearch("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                        >
                            <X size={17} />
                        </button>
                    )}
                </div>
            </div>

            {/* Filters */}
            {filtersOpen && (
                <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h2 className="text-sm font-semibold text-slate-900">
                                Filter timetable
                            </h2>

                            <p className="mt-0.5 text-xs text-slate-500">
                                Narrow down schedules by academic details,
                                faculty, class type, or status.
                            </p>
                        </div>

                        {activeFilterCount > 0 && (
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 transition hover:text-indigo-700"
                            >
                                <X size={14} />
                                Clear filters
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
                        {/* Academic Year */}
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-slate-600">
                                Academic Year
                            </label>

                            <select
                                value={academicYearFilter}
                                onChange={(event) =>
                                    handleAcademicYearChange(
                                        event.target.value
                                    )
                                }
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                            >
                                <option value="ALL">
                                    All Academic Years
                                </option>

                                {academicYears.map(
                                    ([id, name]) => (
                                        <option
                                            key={id}
                                            value={id}
                                        >
                                            {name}
                                        </option>
                                    )
                                )}
                            </select>
                        </div>

                        {/* Grade */}
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-slate-600">
                                Grade
                            </label>

                            <select
                                value={gradeFilter}
                                onChange={(event) =>
                                    handleGradeChange(
                                        event.target.value
                                    )
                                }
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                            >
                                <option value="ALL">
                                    All Grades
                                </option>

                                {grades.map(
                                    ([id, name]) => (
                                        <option
                                            key={id}
                                            value={id}
                                        >
                                            {name}
                                        </option>
                                    )
                                )}
                            </select>
                        </div>

                        {/* Section */}
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-slate-600">
                                Section
                            </label>

                            <select
                                value={sectionFilter}
                                onChange={(event) =>
                                    setSectionFilter(
                                        event.target.value
                                    )
                                }
                                disabled={
                                    sections.length === 0
                                }
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                            >
                                <option value="ALL">
                                    All Sections
                                </option>

                                {sections.map(
                                    ([id, name]) => (
                                        <option
                                            key={id}
                                            value={id}
                                        >
                                            Section {name}
                                        </option>
                                    )
                                )}
                            </select>
                        </div>

                        {/* Faculty */}
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-slate-600">
                                Faculty
                            </label>

                            <select
                                value={facultyFilter}
                                onChange={(event) =>
                                    setFacultyFilter(
                                        event.target.value
                                    )
                                }
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                            >
                                <option value="ALL">
                                    All Faculty
                                </option>

                                {faculties.map(
                                    ([id, name]) => (
                                        <option
                                            key={id}
                                            value={id}
                                        >
                                            {name}
                                        </option>
                                    )
                                )}
                            </select>
                        </div>

                        {/* Class Type */}
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-slate-600">
                                Class Type
                            </label>

                            <select
                                value={classTypeFilter}
                                onChange={(event) =>
                                    setClassTypeFilter(
                                        event.target.value as ClassTypeFilter
                                    )
                                }
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                            >
                                <option value="ALL">
                                    All Types
                                </option>

                                <option value="OFFLINE">
                                    Offline
                                </option>

                                <option value="ONLINE">
                                    Online
                                </option>
                            </select>
                        </div>

                        {/* Status */}
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-slate-600">
                                Status
                            </label>

                            <select
                                value={statusFilter}
                                onChange={(event) =>
                                    setStatusFilter(
                                        event.target.value
                                    )
                                }
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                            >
                                <option value="ALL">
                                    All Status
                                </option>

                                <option value="ACTIVE">
                                    Active
                                </option>

                                <option value="INACTIVE">
                                    Inactive
                                </option>
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {/* View Toggle */}
            {!loading && !error && (
                <div className="mb-5 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-semibold text-slate-800">
                            {viewMode === "timetable"
                                ? "Weekly Timetable"
                                : "Schedule List"}
                        </p>

                        <p className="mt-0.5 text-xs text-slate-500">
                            {viewMode === "timetable"
                                ? "View active classes across the school week."
                                : "View and manage individual timetable records."}
                        </p>
                    </div>

                    <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                        <button
                            type="button"
                            onClick={() =>
                                setViewMode("timetable")
                            }
                            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition ${
    viewMode === "timetable"
        ? "bg-indigo-600 text-white shadow-sm"
        : "text-slate-600 hover:bg-slate-50"
}`}
                        >
                            <CalendarDays size={16} />
                            Timetable
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                setViewMode("list")
                            }
                            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition ${
    viewMode === "list"
        ? "bg-indigo-600 text-white shadow-sm"
        : "text-slate-600 hover:bg-slate-50"
}`}
                        >
                            <List size={16} />
                            List
                        </button>
                    </div>
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                        <RefreshCw
                            size={20}
                            className="animate-spin"
                        />
                        Loading timetable...
                    </div>
                </div>
            )}

            {/* Error */}
            {!loading && error && (
                <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-red-200 bg-white px-6 text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
                        <AlertCircle size={24} />
                    </div>

                    <h2 className="text-base font-semibold text-slate-900">
                        Unable to load timetable
                    </h2>

                    <p className="mt-1 max-w-md text-sm text-slate-500">
                        {error}
                    </p>

                    <button
                        type="button"
                        onClick={() => void refresh()}
                        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
                    >
                        <RefreshCw size={16} />
                        Try Again
                    </button>
                </div>
            )}

            {/* Timetable View */}
            {!loading &&
                !error &&
                viewMode === "timetable" && (
                    <TimetableGrid
                        timetables={filteredTimetables}
                        onView={handleViewSchedule}
                        onEdit={handleEditSchedule}
                        onToggleStatus={(timetable) =>
                            void handleToggleScheduleStatus(timetable)
                        }
                        onDelete={handleDeleteSchedule}
                    />
                )}

            {/* List View - Empty */}
            {!loading &&
                !error &&
                viewMode === "list" &&
                filteredTimetables.length === 0 && (
                    <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 text-center">
                        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                            <CalendarDays size={24} />
                        </div>

                        <h2 className="text-base font-semibold text-slate-900">
                            {search ||
                            activeFilterCount > 0
                                ? "No timetable entries found"
                                : "No timetable entries yet"}
                        </h2>

                        <p className="mt-1 max-w-md text-sm text-slate-500">
                            {search ||
                            activeFilterCount > 0
                                ? "Try changing your search or filters."
                                : "Create a schedule to start managing the school's timetable."}
                        </p>

                        {(search ||
                            activeFilterCount > 0) && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearch("");
                                    clearFilters();
                                }}
                                className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                            >
                                <X size={16} />
                                Reset
                            </button>
                        )}
                    </div>
                )}

            {/* List Table */}
            {!loading &&
                !error &&
                viewMode === "list" &&
                filteredTimetables.length > 0 && (
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1350px] text-left">
                                <thead className="border-b border-slate-200 bg-slate-50">
                                <tr>
                                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Schedule
                                    </th>

                                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Class
                                    </th>

                                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Subject
                                    </th>

                                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Faculty
                                    </th>

                                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Mode
                                    </th>

                                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Location / Link
                                    </th>

                                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Status
                                    </th>

                                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Actions
                                    </th>
                                </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100">
                                {filteredTimetables.map(
                                    (item) => (
                                        <tr
                                            key={item.id}
                                            className="transition hover:bg-slate-50"
                                        >
                                            <td className="px-5 py-4">
                                                <div className="flex items-start gap-3">
                                                    <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                                                        <CalendarDays size={17} />
                                                    </div>

                                                    <div>
                                                        <p className="font-medium text-slate-900">
                                                            {item.dayOfWeek}
                                                        </p>

                                                        <p className="mt-0.5 text-sm text-slate-500">
                                                            {formatTime(
                                                                item.startTime
                                                            )}
                                                            {" – "}
                                                            {formatTime(
                                                                item.endTime
                                                            )}
                                                        </p>

                                                        <p className="mt-1 text-xs text-slate-400">
                                                            {formatDateRange(
                                                                item.startDate,
                                                                item.endDate
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-5 py-4">
                                                <p className="font-medium text-slate-900">
                                                    {item.gradeName}
                                                </p>

                                                <p className="mt-0.5 text-sm text-slate-500">
                                                    Section{" "}
                                                    {item.sectionName}
                                                </p>

                                                <p className="mt-0.5 text-xs text-slate-400">
                                                    {item.academicYearName}
                                                </p>
                                            </td>

                                            <td className="px-5 py-4">
                                                <p className="font-medium text-slate-900">
                                                    {item.subjectName}
                                                </p>

                                                <p className="mt-0.5 text-xs text-slate-500">
                                                    {item.subjectCode}
                                                </p>
                                            </td>

                                            <td className="px-5 py-4">
                                                <p className="font-medium text-slate-900">
                                                    {item.facultyName}
                                                </p>

                                                <p className="mt-0.5 text-xs text-slate-500">
                                                    {item.facultyEmail}
                                                </p>
                                            </td>

                                            <td className="px-5 py-4">
                                                {item.classType ===
                                                "ONLINE" ? (
                                                    <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                                                        Online
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                                                        Offline
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-5 py-4">
                                                {item.classType === "ONLINE" ? (
                                                    item.meetingLink ? (
                                                        <a
                                                            href={item.meetingLink}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="block max-w-[220px] truncate text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
                                                            title={item.meetingLink}
                                                        >
                                                            Join online class
                                                        </a>
                                                    ) : (
                                                        <span className="text-sm text-slate-500">
                                                            No meeting link
                                                        </span>
                                                    )
                                                ) : (
                                                    <span className="text-sm text-slate-700">
                                                        {item.room || "No room"}
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-5 py-4">
                                                {item.active ? (
                                                    <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                                                        Inactive
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-5 py-4 text-right">
                                                <ScheduleActionsMenu
                                                    active={
                                                        item.active
                                                    }
                                                    onView={() =>
                                                        handleViewSchedule(
                                                            item
                                                        )
                                                    }
                                                    onEdit={() =>
                                                        handleEditSchedule(
                                                            item
                                                        )
                                                    }
                                                    onToggleStatus={() =>
                                                        void handleToggleScheduleStatus(
                                                            item
                                                        )
                                                    }
                                                    onDelete={() =>
                                                        handleDeleteSchedule(
                                                            item
                                                        )
                                                    }
                                                />
                                            </td>
                                        </tr>
                                    )
                                )}
                                </tbody>
                            </table>
                        </div>

                        <div className="border-t border-slate-200 px-5 py-3">
                            <p className="text-xs text-slate-500">
                                Showing{" "}
                                <span className="font-semibold text-slate-700">
                                    {filteredTimetables.length}
                                </span>{" "}
                                of{" "}
                                <span className="font-semibold text-slate-700">
                                    {timetables.length}
                                </span>{" "}
                                timetable{" "}
                                {timetables.length === 1
                                    ? "entry"
                                    : "entries"}
                            </p>
                        </div>
                    </div>
                )}

            {/* Toast */}
            {toast && (
                <Toast
                    type={toast.type}
                    message={toast.message}
                    onClose={() =>
                        setToast(null)
                    }
                />
            )}

            {/* Add Schedule Modal */}
            <AddScheduleModal
                open={addScheduleOpen}
                onClose={() =>
                    setAddScheduleOpen(false)
                }
                onSuccess={() =>
                    void handleScheduleCreated()
                }
            />

            {/* Edit Schedule Modal */}
            <EditScheduleModal
                open={editScheduleOpen}
                timetable={selectedTimetable}
                onClose={() => {
                    setEditScheduleOpen(false);
                    setSelectedTimetable(null);
                }}
                onSuccess={() =>
                    void handleScheduleUpdated()
                }
            />

            {/* Delete Schedule Modal */}
            <DeleteScheduleModal
                open={deleteScheduleOpen}
                timetable={selectedTimetable}
                onClose={() => {
                    setDeleteScheduleOpen(false);
                    setSelectedTimetable(null);
                }}
                onSuccess={() =>
                    void handleScheduleDeleted()
                }
            />

            {/* Schedule Details Modal */}
            <ScheduleDetailsModal
                open={detailsOpen}
                timetable={selectedTimetable}
                onClose={() => {
                    setDetailsOpen(false);
                    setSelectedTimetable(null);
                }}
            />
        </div>
    );
}
