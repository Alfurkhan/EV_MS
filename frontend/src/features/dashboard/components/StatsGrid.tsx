import { useEffect, useState } from "react";

import {
    Users,
    GraduationCap,
    BookOpen,
    CalendarCheck,
    ClipboardList,
    School,
    Bell,
} from "lucide-react";

import StatsCard from "./StatsCard";
import { useAuth } from "../../../contexts/AuthContext";

import { getMyClassesToday } from "../../faculty/services/facultyService";

import { getMyStudentsCount } from "../../academic/services/studentEnrollmentService";

import { getAttendanceDashboard } from "../../faculty/services/facultyService";

import {
    getMySubjects,
    getMyStudentSubjects,
} from "../../courses/services/subjectService";

export default function StatsGrid() {
    const { hasRole } = useAuth();

    const isAdmin = hasRole("ROLE_ADMIN");
    const isFaculty = hasRole("ROLE_FACULTY");
    const isStudent = hasRole("ROLE_STUDENT");

    const [facultyClassCount, setFacultyClassCount] =
        useState<number | null>(null);

    const [facultyStudentCount, setFacultyStudentCount] =
        useState<number | null>(null);

    const [facultyCourseCount, setFacultyCourseCount] =
        useState<number | null>(null);

    const [studentSubjectCount, setStudentSubjectCount] =
        useState<number | null>(null);

    const [attendancePercentage, setAttendancePercentage] =
        useState<number | null>(null);

    useEffect(() => {
        /*
         * =====================================================
         * FACULTY DASHBOARD DATA
         * =====================================================
         */

        if (isFaculty && !isAdmin) {

            getMyClassesToday()
                .then((classes) => {
                    setFacultyClassCount(classes.length);
                })
                .catch((error) => {
                    console.error(
                        "Failed to load faculty class count:",
                        error
                    );
                });

            getMySubjects()
                .then((subjects) => {
                    setFacultyCourseCount(subjects.length);
                })
                .catch((error) => {
                    console.error(
                        "Failed to load faculty course count:",
                        error
                    );
                });

            getMyStudentsCount()
                .then((count) => {
                    setFacultyStudentCount(count);
                })
                .catch((error) => {
                    console.error(
                        "Failed to load faculty student count:",
                        error
                    );
                });
        }

        getAttendanceDashboard()
            .then((data) => {
                if (isAdmin) {
                    setAttendancePercentage(
                        data.overallPercentage
                    );
                } else if (isStudent) {
                    setAttendancePercentage(
                        data.overallPercentage
                    );
                } else {
                    setAttendancePercentage(
                        data.todayPercentage
                    );
                }
            })
            .catch((error) => {
                console.error(
                    "Failed to load attendance dashboard:",
                    error
                );
            });


        /*
         * =====================================================
         * STUDENT DASHBOARD DATA
         * =====================================================
         */

        if (isStudent && !isAdmin) {

            getMyStudentSubjects()
                .then((subjects) => {
                    setStudentSubjectCount(subjects.length);
                })
                .catch((error) => {
                    console.error(
                        "Failed to load student subject count:",
                        error
                    );
                });
        }

    }, [isFaculty, isStudent, isAdmin]);


    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">

            {/* ========================= */}
            {/* ADMIN DASHBOARD */}
            {/* ========================= */}

            {isAdmin && (
                <>
                    <StatsCard
                        title="Students"
                        value="1,248"
                        subtitle="+32 this month"
                        icon={Users}
                        color="text-blue-600"
                        bg="bg-blue-100"
                        border="border-blue-600"
                    />

                    <StatsCard
                        title="Faculty"
                        value="86"
                        subtitle="+4 this month"
                        icon={GraduationCap}
                        color="text-green-600"
                        bg="bg-green-100"
                        border="border-green-600"
                    />

                    <StatsCard
                        title="Courses"
                        value="42"
                        subtitle="Across all grades"
                        icon={BookOpen}
                        color="text-orange-600"
                        bg="bg-orange-100"
                        border="border-orange-600"
                    />

                    <StatsCard
                        title="Attendance"
                        value={
                            attendancePercentage === null
                                ? "—"
                                : `${attendancePercentage}%`
                        }
                        subtitle="Overall attendance"
                        icon={CalendarCheck}
                        color="text-purple-600"
                        bg="bg-purple-100"
                        border="border-purple-600"
                    />
                </>
            )}


            {/* ========================= */}
            {/* FACULTY DASHBOARD */}
            {/* ========================= */}

            {isFaculty && !isAdmin && (
                <>
                    <StatsCard
                        title="My Classes"
                        value={
                            facultyClassCount === null
                                ? "—"
                                : String(facultyClassCount)
                        }
                        subtitle="Scheduled today"
                        icon={School}
                        color="text-blue-600"
                        bg="bg-blue-100"
                        border="border-blue-600"
                    />

                    <StatsCard
                        title="My Students"
                        value={
                            facultyStudentCount === null
                                ? "—"
                                : String(facultyStudentCount)
                        }
                        subtitle="Across all classes"
                        icon={Users}
                        color="text-green-600"
                        bg="bg-green-100"
                        border="border-green-600"
                    />

                    <StatsCard
                        title="My Courses"
                        value={
                            facultyCourseCount === null
                                ? "—"
                                : String(facultyCourseCount)
                        }
                        subtitle="Currently teaching"
                        icon={BookOpen}
                        color="text-orange-600"
                        bg="bg-orange-100"
                        border="border-orange-600"
                    />

                    <StatsCard
                        title="Attendance"
                        value={
                            attendancePercentage === null
                                ? "—"
                                : `${attendancePercentage}%`
                        }
                        subtitle="Today's attendance"
                        icon={CalendarCheck}
                        color="text-purple-600"
                        bg="bg-purple-100"
                        border="border-purple-600"
                    />
                </>
            )}


            {/* ========================= */}
            {/* STUDENT DASHBOARD */}
            {/* ========================= */}

            {isStudent && !isAdmin && (
                <>
                    <StatsCard
                        title="My Subjects"
                        value={
                            studentSubjectCount === null
                                ? "—"
                                : String(studentSubjectCount)
                        }
                        subtitle="Available for your grade"
                        icon={BookOpen}
                        color="text-blue-600"
                        bg="bg-blue-100"
                        border="border-blue-600"
                    />

                    <StatsCard
                        title="My Attendance"
                        value={
                            attendancePercentage === null
                                ? "—"
                                : `${attendancePercentage}%`
                        }
                        subtitle="Overall attendance"
                        icon={CalendarCheck}
                        color="text-green-600"
                        bg="bg-green-100"
                        border="border-green-600"
                    />

                    <StatsCard
                        title="Assignments"
                        value="4"
                        subtitle="Pending submission"
                        icon={ClipboardList}
                        color="text-orange-600"
                        bg="bg-orange-100"
                        border="border-orange-600"
                    />

                    <StatsCard
                        title="Notifications"
                        value="3"
                        subtitle="Unread notifications"
                        icon={Bell}
                        color="text-purple-600"
                        bg="bg-purple-100"
                        border="border-purple-600"
                    />
                </>
            )}

        </div>
    );
}