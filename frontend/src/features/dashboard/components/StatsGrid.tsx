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

export default function StatsGrid() {
    const { hasRole } = useAuth();

    const isAdmin = hasRole("ROLE_ADMIN");
    const isFaculty = hasRole("ROLE_FACULTY");
    const isStudent = hasRole("ROLE_STUDENT");

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
                        value="94%"
                        subtitle="Today's attendance"
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
                        value="6"
                        subtitle="Currently assigned"
                        icon={School}
                        color="text-blue-600"
                        bg="bg-blue-100"
                        border="border-blue-600"
                    />

                    <StatsCard
                        title="My Students"
                        value="184"
                        subtitle="Across all classes"
                        icon={Users}
                        color="text-green-600"
                        bg="bg-green-100"
                        border="border-green-600"
                    />

                    <StatsCard
                        title="My Courses"
                        value="5"
                        subtitle="Currently teaching"
                        icon={BookOpen}
                        color="text-orange-600"
                        bg="bg-orange-100"
                        border="border-orange-600"
                    />

                    <StatsCard
                        title="Attendance"
                        value="92%"
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
                        title="My Courses"
                        value="6"
                        subtitle="Currently enrolled"
                        icon={BookOpen}
                        color="text-blue-600"
                        bg="bg-blue-100"
                        border="border-blue-600"
                    />

                    <StatsCard
                        title="My Attendance"
                        value="87%"
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