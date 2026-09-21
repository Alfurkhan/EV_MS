import { useCallback, useEffect, useState } from "react";

import { getMyStudentTimetable } from "../services/studentTimetableService";

import type { StudentTimetableEntry } from "../types/studentTimetable";

/*
 * ============================================================
 * STUDENT TIMETABLE HOOK
 * ============================================================
 *
 * Handles:
 * - Loading state
 * - Timetable data
 * - Error state
 * - Refresh
 *
 * The component does not need to know how the API works.
 */

export function useStudentTimetable() {

    const [timetable, setTimetable] =
        useState<StudentTimetableEntry[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    /*
     * ========================================================
     * FETCH TIMETABLE
     * ========================================================
     */

    const fetchTimetable = useCallback(async () => {

        try {

            setLoading(true);
            setError("");

            const data =
                await getMyStudentTimetable();

            setTimetable(data);

        } catch (error: any) {

            console.error(
                "Failed to load student timetable:",
                error
            );

            setError(
                error?.response?.data?.message ||
                "Unable to load your timetable."
            );

        } finally {

            setLoading(false);

        }

    }, []);

    /*
     * ========================================================
     * INITIAL LOAD
     * ========================================================
     */

    useEffect(() => {

        void fetchTimetable();

    }, [fetchTimetable]);

    /*
     * ========================================================
     * RETURN
     * ========================================================
     */

    return {
        timetable,
        loading,
        error,
        refresh: fetchTimetable,
    };
}