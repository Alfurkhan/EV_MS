import { useCallback, useEffect, useState } from "react";

import {
    getStudents,
    type StudentUser,
} from "../services/studentService";

import {
    getEnrollmentsByAcademicYear,
    type StudentEnrollment,
} from "../../academic/services/studentEnrollmentService";

import {
    getActiveAcademicYear,
    type AcademicYear,
} from "../../academic/services/academicYearService";


export type StudentWithEnrollment = StudentUser & {
    enrollment: StudentEnrollment | null;
};


export function useStudents() {

    const [students, setStudents] = useState<StudentWithEnrollment[]>([]);
    const [academicYear, setAcademicYear] =
        useState<AcademicYear | null>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);


    const fetchStudents = useCallback(async () => {

        try {

            setLoading(true);
            setError(null);


            /*
             * ----------------------------------------------------
             * 1. Get all students
             * ----------------------------------------------------
             */

            const studentUsers = await getStudents();


            /*
             * ----------------------------------------------------
             * 2. Get the currently active academic year
             * ----------------------------------------------------
             */

            const activeYear =
                await getActiveAcademicYear();

            setAcademicYear(activeYear);


            /*
             * ----------------------------------------------------
             * 3. Get enrollments for the active academic year
             * ----------------------------------------------------
             */

            const enrollments =
                await getEnrollmentsByAcademicYear(
                    activeYear.id
                );


            /*
             * ----------------------------------------------------
             * 4. Merge student + current enrollment
             * ----------------------------------------------------
             */

            const enrollmentMap =
                new Map<number, StudentEnrollment>();


            enrollments.forEach((enrollment) => {

                enrollmentMap.set(
                    enrollment.studentId,
                    enrollment
                );

            });


            const mergedStudents =
                studentUsers.map((student) => ({

                    ...student,

                    enrollment:
                        enrollmentMap.get(student.id) ?? null,

                }));


            /*
             * ----------------------------------------------------
             * 5. Store final student list
             * ----------------------------------------------------
             */

            setStudents(mergedStudents);

        } catch (err) {

            console.error(
                "Failed to load students:",
                err
            );

            setError(
                "Failed to load students."
            );

        } finally {

            setLoading(false);

        }

    }, []);


    /*
     * --------------------------------------------------------
     * Initial load
     * --------------------------------------------------------
     */

    useEffect(() => {

        fetchStudents();

    }, [fetchStudents]);


    return {
        students,
        academicYear,
        loading,
        error,
        refresh: fetchStudents,
    };
}