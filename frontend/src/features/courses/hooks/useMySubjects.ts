import {
    useCallback,
    useEffect,
    useState,
} from "react";

import {
    getMyStudentSubjects,
    type StudentSubject,
} from "../services/subjectService";

export function useMySubjects() {

    const [subjects, setSubjects] =
        useState<StudentSubject[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const fetchSubjects =
        useCallback(async () => {

            try {

                setLoading(true);
                setError("");

                const data =
                    await getMyStudentSubjects();

                setSubjects(data);

            } catch (error: any) {

                console.error(
                    "Failed to load student subjects:",
                    error
                );

                setError(
                    error?.response?.data?.message ||
                    "Unable to load your subjects."
                );

            } finally {

                setLoading(false);

            }

        }, []);

    useEffect(() => {
        void fetchSubjects();
    }, [fetchSubjects]);

    return {
        subjects,
        loading,
        error,
        refresh: fetchSubjects,
    };
}