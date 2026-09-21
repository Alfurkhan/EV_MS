import { useState } from "react";
import {
    AlertCircle,
    BookOpen,
    RefreshCw,
    SearchX,
} from "lucide-react";
import toast from "react-hot-toast";

import MyClassCard from "../components/MyClassCard";
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
                        View and manage your classes for today
                    </p>
                </div>

                <button
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
                </button>
            </div>

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
                        No classes scheduled for today
                    </h2>

                    <p className="mt-1 text-sm text-slate-400">
                        You don't have any active classes
                        scheduled for today.
                    </p>
                </div>

            ) : (

                /* CLASS LIST */

                <div className="space-y-4">
                    {classes.map((classItem) => (
                        <div
                            key={classItem.timetableId}
                            className={
                                actionLoading ===
                                classItem.timetableId ||
                                actionLoading ===
                                classItem.sessionId
                                    ? "opacity-70"
                                    : ""
                            }
                        >
                            <MyClassCard
                                classItem={classItem}
                                onStart={
                                    handleStart
                                }
                                onEnd={
                                    handleEnd
                                }
                            />
                        </div>
                    ))}
                </div>
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
                        {classes.length}{" "}
                        {classes.length === 1
                            ? "class"
                            : "classes"}{" "}
                        scheduled today
                    </span>
                </div>
            )}
        </div>
    );
}