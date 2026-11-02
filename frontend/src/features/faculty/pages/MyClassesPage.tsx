import { useState } from "react";
import {
    AlertCircle,
    BookOpen,
    RefreshCw,
    SearchX,
    Search,
    FilterX,
    Filter,
    ChevronDown,
} from "lucide-react";
import toast from "react-hot-toast";

import WeeklyTimetableGrid from "../components/WeeklyTimetableGrid";
import FacultyTimetableDraftPage from "../../timetable/pages/FacultyTimetableDraftPage";
import { useMyClasses } from "../hooks/useMyClasses";
import {
    startClass,
    endClass,
} from "../services/facultyService";

import type { FacultyClass } from "../types/facultyClass";

export default function MyClassesPage() {
    const {
        classes,
        loading,
        error,
        refresh,
    } = useMyClasses();

    const [actionLoading, setActionLoading] =
        useState<number | null>(null);

    const [activeView, setActiveView] =
        useState<"classes" | "create" | "drafts">("classes");


    const [searchText, setSearchText] = useState("");
    const [dayFilter, setDayFilter] = useState("ALL");
    const [subjectFilter, setSubjectFilter] = useState("ALL");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [typeFilter, setTypeFilter] = useState("ALL");
    const [filtersOpen, setFiltersOpen] = useState(false);

    const filteredClasses = classes.filter((item) => {
        const term = searchText.trim().toLowerCase();
        const matchesSearch = !term || [
            item.subjectName, item.subjectCode, item.gradeName,
            item.sectionName, item.room ?? "",
        ].some((value) => value.toLowerCase().includes(term));
        return matchesSearch &&
            (dayFilter === "ALL" || item.dayOfWeek === dayFilter) &&
            (subjectFilter === "ALL" || item.subjectName === subjectFilter) &&
            (statusFilter === "ALL" || item.status === statusFilter) &&
            (typeFilter === "ALL" || item.classType === typeFilter);
    });

    const activeFilterCount = [
        searchText.trim(),
        dayFilter !== "ALL" ? dayFilter : "",
        subjectFilter !== "ALL" ? subjectFilter : "",
        statusFilter !== "ALL" ? statusFilter : "",
        typeFilter !== "ALL" ? typeFilter : "",
    ].filter(Boolean).length;

    const clearFilters = () => {
        setSearchText("");
        setDayFilter("ALL");
        setSubjectFilter("ALL");
        setStatusFilter("ALL");
        setTypeFilter("ALL");
    };

    const handleStart = async (
        classItem: FacultyClass
    ) => {
        try {
            setActionLoading(classItem.timetableId);

            await startClass(classItem.timetableId);

            toast.success("Class started successfully.");

            await refresh();
        } catch (error: any) {
            console.error(
                "Failed to start class:",
                error
            );

            toast.error(
                error?.response?.data?.message ||
                "Unable to start the class."
            );
        } finally {
            setActionLoading(null);
        }
    };

    const handleEnd = async (
        classItem: FacultyClass
    ) => {
        if (classItem.sessionId === null) {
            toast.error(
                "No active class session was found."
            );

            return;
        }

        try {
            setActionLoading(classItem.sessionId);

            await endClass(classItem.sessionId);

            toast.success("Class ended successfully.");

            await refresh();
        } catch (error: any) {
            console.error(
                "Failed to end class:",
                error
            );

            toast.error(
                error?.response?.data?.message ||
                "Unable to end the class."
            );
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="space-y-6">

            {/* HEADER */}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-slate-800">
                        My Classes
                    </h1>

                    <p className="mt-1 text-slate-500">
                        {activeView === "classes"
                            ? "View all classes assigned to you"
                            : activeView === "create"
                                ? "Create a class schedule and save it as a draft for admin approval"
                                : "Review your class drafts and track their approval status"}
                    </p>
                </div>

                {activeView === "classes" && <button
                    type="button"
                    onClick={() => void refresh()}
                    disabled={loading}
                    className="
                        inline-flex
                        items-center
                        justify-center
                        gap-2
                        rounded-xl
                        border
                        border-slate-200
                        bg-white
                        px-4
                        py-2.5
                        text-sm
                        font-medium
                        text-slate-600
                        shadow-sm
                        transition
                        hover:bg-slate-50
                        disabled:cursor-not-allowed
                        disabled:opacity-60
                    "
                >
                    <RefreshCw
                        size={16}
                        className={
                            loading
                                ? "animate-spin"
                                : ""
                        }
                    />

                    Refresh
                </button>}
            </div>

            <div className="flex w-fit max-w-full flex-wrap gap-1.5 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm" role="tablist" aria-label="Class management views">
                {([
                    { id: "classes", label: "My Classes" },
                    { id: "create", label: "Schedule a Class" },
                    { id: "drafts", label: "View Drafts" },
                ] as const).map((tab) => (
                    <button key={tab.id} type="button" role="tab" aria-selected={activeView === tab.id}
                        onClick={() => setActiveView(tab.id)}
                        className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${activeView === tab.id ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}>
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeView === "classes" ? <>
            {/* ERROR */}

            {error && (
                <div
                    className="
                        flex
                        items-start
                        gap-3
                        rounded-2xl
                        border
                        border-red-200
                        bg-red-50
                        p-4
                        text-red-700
                    "
                >
                    <AlertCircle
                        size={20}
                        className="mt-0.5 shrink-0"
                    />

                    <div>
                        <p className="font-medium">
                            Unable to load your classes
                        </p>

                        <p className="mt-1 text-sm text-red-600">
                            {error}
                        </p>
                    </div>
                </div>
            )}


            {classes.length > 0 && (
                <div className="flex flex-col items-start gap-3">
                    <div className="flex w-full justify-end">
                        <button type="button" onClick={() => setFiltersOpen((open) => !open)} aria-expanded={filtersOpen} aria-controls="faculty-class-filters"
                            className={"inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition " + (filtersOpen || activeFilterCount > 0 ? "border-indigo-200 bg-indigo-50 text-indigo-700" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50")}>
                            <Filter size={16} /> Filters
                            {activeFilterCount > 0 && <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-xs text-white">{activeFilterCount}</span>}
                            <ChevronDown size={16} className={"transition-transform " + (filtersOpen ? "rotate-180" : "")} />
                        </button>
                    </div>
                    {filtersOpen && (
                        <section id="faculty-class-filters" className="w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                                <div><h3 className="font-semibold text-slate-800">Filter classes</h3><p className="text-xs text-slate-500">Narrow your timetable by keyword, weekday, subject, status, or class type.</p></div>
                                <button type="button" onClick={clearFilters} disabled={activeFilterCount === 0} className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 disabled:cursor-not-allowed disabled:text-slate-400">Clear filters</button>
                            </div>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                <label className="text-xs font-semibold text-slate-600 sm:col-span-2 lg:col-span-3">Search classes
                                    <span className="relative mt-1 block"><Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="Search subject, code, grade, section, or room..." className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm font-normal outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" />
                                    </span>
                                </label>
                                <label className="text-xs font-semibold text-slate-600">Weekday
                                    <select value={dayFilter} onChange={(e) => setDayFilter(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-normal outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100">
                                        <option value="ALL">All weekdays</option>
                                        {[...new Set(classes.map((item) => item.dayOfWeek).filter((day): day is string => Boolean(day)))].sort().map((day) => <option key={day} value={day}>{day.charAt(0) + day.slice(1).toLowerCase()}</option>)}
                                    </select>
                                </label>
                                <label className="text-xs font-semibold text-slate-600">Subject
                                    <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-normal outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100">
                                        <option value="ALL">All subjects</option>
                                        {[...new Set(classes.map((item) => item.subjectName))].sort().map((subject) => <option key={subject} value={subject}>{subject}</option>)}
                                    </select>
                                </label>
                                <label className="text-xs font-semibold text-slate-600">Status
                                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-normal outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100">
                                        <option value="ALL">All statuses</option><option value="NOT_STARTED">Not started</option><option value="IN_PROGRESS">In progress</option><option value="COMPLETED">Completed</option><option value="CANCELLED">Cancelled</option>
                                    </select>
                                </label>
                                <label className="text-xs font-semibold text-slate-600">Class type
                                    <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-normal outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100">
                                        <option value="ALL">All class types</option><option value="ONLINE">Online</option><option value="OFFLINE">Offline</option>
                                    </select>
                                </label>
                            </div>
                        </section>
                    )}
                </div>
            )}

            {/* LOADING */}

            {loading && !classes.length ? (
                <div
                    className="
                        flex
                        items-center
                        justify-center
                        rounded-2xl
                        border
                        border-slate-200
                        bg-white
                        px-6
                        py-16
                        shadow-sm
                    "
                >
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                        <RefreshCw
                            size={18}
                            className="animate-spin text-blue-500"
                        />

                        Loading your classes...
                    </div>
                </div>
            ) : classes.length === 0 ? (

                /* EMPTY STATE */

                <div
                    className="
                        rounded-2xl
                        border
                        border-slate-200
                        bg-white
                        px-6
                        py-16
                        text-center
                        shadow-sm
                    "
                >
                    <div
                        className="
                            mx-auto
                            flex
                            h-14
                            w-14
                            items-center
                            justify-center
                            rounded-full
                            bg-slate-100
                            text-slate-400
                        "
                    >
                        <SearchX size={24} />
                    </div>

                    <h2 className="mt-4 text-base font-semibold text-slate-800">
                        No assigned classes found
                    </h2>

                    <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                        You don't have any approved class schedules assigned yet. You can create a class schedule or review drafts awaiting administrator approval.
                    </p>
                    <div className="mt-5 flex flex-wrap justify-center gap-3">
                        <button type="button" onClick={() => setActiveView("create")} className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">Schedule a Class</button>
                        <button type="button" onClick={() => setActiveView("drafts")} className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">View Drafts</button>
                    </div>
                </div>

            ) : (
                /* CLASS LIST */
                filteredClasses.length > 0 ? (
                    <WeeklyTimetableGrid classes={filteredClasses} actionLoading={actionLoading} onStart={handleStart} onEnd={handleEnd} />
                ) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
                        <SearchX size={28} className="mx-auto text-slate-400" />
                        <h2 className="mt-3 text-base font-semibold text-slate-800">No matching classes</h2>
                        <p className="mt-1 text-sm text-slate-500">Try changing your search or filters to see more classes.</p>
                        <button type="button" onClick={clearFilters} className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Clear filters</button>
                    </div>
                )
            )}

            {/* SUMMARY */}

            {!loading && classes.length > 0 && (
                <div
                    className="
                        flex
                        items-center
                        gap-2
                        rounded-xl
                        border
                        border-slate-200
                        bg-white
                        px-4
                        py-3
                        text-sm
                        text-slate-500
                        shadow-sm
                    "
                >
                    <BookOpen size={16} />

                    <span>
                        {filteredClasses.length} of {classes.length} classes shown
                    </span>
                </div>
            )}
            </> : <FacultyTimetableDraftPage view={activeView} onViewChange={setActiveView} />}
        </div>
    );
}