import { useCallback, useEffect, useState } from "react";

import { getMyClassesToday } from "../services/facultyService";
import type { FacultyClass } from "../types/facultyClass";

export function useMyClasses() {
    const [classes, setClasses] = useState<FacultyClass[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchClasses = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const data = await getMyClassesToday();

            setClasses(data);
        } catch (error: any) {
            console.error("Failed to load my classes:", error);

            setError(
                error?.response?.data?.message ||
                "Unable to load your classes."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchClasses();
    }, [fetchClasses]);

    return {
        classes,
        loading,
        error,
        refresh: fetchClasses,
    };
}