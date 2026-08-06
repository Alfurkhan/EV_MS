import {
    Users,
    GraduationCap,
    BookOpen,
    ClipboardCheck,
} from "lucide-react";

export const dashboardStats = [
    {
        title: "Students",
        value: "1,248",
        subtitle: "+12 this week",
        icon: Users,
        color: "text-blue-600",
        bg: "bg-blue-100",
        border: "border-blue-500",
    },
    {
        title: "Faculty",
        value: "84",
        subtitle: "+3 new",
        icon: GraduationCap,
        color: "text-green-600",
        bg: "bg-green-100",
        border: "border-green-500",
    },
    {
        title: "Courses",
        value: "36",
        subtitle: "Active Courses",
        icon: BookOpen,
        color: "text-orange-600",
        bg: "bg-orange-100",
        border: "border-orange-500",
    },
    {
        title: "Attendance",
        value: "94%",
        subtitle: "Excellent",
        icon: ClipboardCheck,
        color: "text-purple-600",
        bg: "bg-purple-100",
        border: "border-purple-500",
    },
];