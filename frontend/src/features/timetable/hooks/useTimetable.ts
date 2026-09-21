import { useCallback, useEffect, useState } from "react";
import { getTimetables } from "../services/timetableService";
import type { Timetable } from "../types/timetable";

export function useTimetable() {
    const [timetables, setTimetables] = useState<Timetable[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const data = await getTimetables();
            setTimetables(data);
        } catch (err) {
            console.error("Failed to fetch timetables:", err);

            setError(
                "Failed to load timetable. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    return {
        timetables,
        loading,
        error,
        refresh,
    };
}