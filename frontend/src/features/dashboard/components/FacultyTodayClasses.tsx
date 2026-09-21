import { useCallback, useEffect, useState } from "react";
import {
    AlertCircle,
    ArrowRight,
    CalendarDays,
    RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import MyClassCard from "../../faculty/components/MyClassCard";
import {
    endClass,
    getMyClassesToday,
    startClass,
} from "../../faculty/services/facultyService";

import type { FacultyClass } from "../../faculty/types/facultyClass";

export default function FacultyTodayClasses() {
    const navigate = useNavigate();

    const [classes, setClasses] = useState<FacultyClass[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionLoading, setActionLoading] =
        useState<number | null>(null);

    const fetchClasses = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const data = await getMyClassesToday();

            setClasses(data);
        } catch (error: any) {
            console.error(
                "Failed to load faculty classes:",
                error
            );

            setError(
                error?.response?.data?.message ||
                "Unable to load today's classes."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchClasses();
    }, [fetchClasses]);

    const handleStart = async (
        classItem: FacultyClass
    ) => {
        try {
            setActionLoading(classItem.timetableId);

            await startClass(classItem.timetableId);

            await fetchClasses();
        } catch (error: any) {
            console.error(
                "Failed to start class:",
                error
            );

            setError(
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
            setError(
                "No active class session was found."
            );

            return;
        }

        try {
            setActionLoading(classItem.sessionId);

            await endClass(classItem.sessionId);

            await fetchClasses();
        } catch (error: any) {
            console.error(
                "Failed to end class:",
                error
            );

            setError(
                error?.response?.data?.message ||
                "Unable to end the class."
            );
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <section className="space-y-5">

            {/* HEADER */}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <CalendarDays
                            size={20}
                            className="text-blue-600"
                        />

                        <h2 className="text-xl font-bold text-slate-800">
                            Today's Classes
                        </h2>
                    </div>

                    <p className="mt-1 text-sm text-slate-500">
                        Your scheduled classes for today
                    </p>
                </div>

                <div className="flex items-center gap-2">

                    <button
                        type="button"
                        onClick={() => void fetchClasses()}
                        disabled={loading}
                        className="
                            inline-flex
                            items-center
                            gap-2
                            rounded-xl
                            border
                            border-slate-200
                            bg-white
                            px-3
                            py-2
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
                            size={15}
                            className={
                                loading
                                    ? "animate-spin"
                                    : ""
                            }
                        />

                        Refresh
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            navigate("/my-classes")
                        }
                        className="
                            inline-flex
                            items-center
                            gap-2
                            rounded-xl
                            bg-blue-600
                            px-4
                            py-2
                            text-sm
                            font-semibold
                            text-white
                            shadow-sm
                            transition
                            hover:bg-blue-700
                        "
                    >
                        View All

                        <ArrowRight size={15} />
                    </button>

                </div>
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
                        text-sm
                        text-red-700
                    "
                >
                    <AlertCircle
                        size={18}
                        className="mt-0.5 shrink-0"
                    />

                    <span>{error}</span>
                </div>
            )}

            {/* LOADING */}

            {loading ? (
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
                        py-12
                        shadow-sm
                    "
                >
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                        <RefreshCw
                            size={18}
                            className="animate-spin text-blue-500"
                        />

                        Loading today's classes...
                    </div>
                </div>
            ) : classes.length === 0 ? (

                /* EMPTY */

                <div
                    className="
                        rounded-2xl
                        border
                        border-slate-200
                        bg-white
                        px-6
                        py-12
                        text-center
                        shadow-sm
                    "
                >
                    <CalendarDays
                        size={32}
                        className="mx-auto text-slate-300"
                    />

                    <h3 className="mt-3 font-semibold text-slate-700">
                        No classes scheduled today
                    </h3>

                    <p className="mt-1 text-sm text-slate-400">
                        You don't have any classes scheduled
                        for today.
                    </p>
                </div>

            ) : (

                /* CLASSES */

                <div className="space-y-4">
                    {classes.map((classItem) => (
                        <div
                            key={classItem.timetableId}
                            className={
                                actionLoading ===
                                classItem.timetableId ||
                                actionLoading ===
                                classItem.sessionId
                                    ? "pointer-events-none opacity-60"
                                    : ""
                            }
                        >
                            <MyClassCard
                                classItem={classItem}
                                onStart={handleStart}
                                onEnd={handleEnd}
                            />
                        </div>
                    ))}
                </div>
            )}

        </section>
    );
}