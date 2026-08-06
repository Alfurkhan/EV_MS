import {
    Users,
    GraduationCap,
    BookOpen,
    CalendarCheck,
} from "lucide-react";

import StatsCard from "./StatsCard";

export default function StatsGrid() {
    return (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
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
        </div>
    );
}