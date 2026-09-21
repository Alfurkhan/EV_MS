import { useCallback, useEffect, useState } from "react";
import {
    getFaculties,
} from "../services/facultyService";
import type { Faculty } from "../types/faculty";

export function useFaculty() {
    const [faculties, setFaculties] = useState<Faculty[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchFaculties = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const data = await getFaculties();

            setFaculties(data);
        } catch (err) {
            console.error("Failed to load faculties:", err);
            setError("Failed to load faculties.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFaculties();
    }, [fetchFaculties]);

    return {
        faculties,
        loading,
        error,
        refresh: fetchFaculties,
    };
}