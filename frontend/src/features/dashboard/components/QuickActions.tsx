import {
    UserPlus,
    GraduationCap,
    CalendarPlus,
    BookOpen,
    ClipboardList,
    Bell,
    Users,
    ClipboardCheck,
} from "lucide-react";

import { useAuth } from "../../../contexts/AuthContext";

export default function QuickActions() {
    const { hasRole } = useAuth();

    const isAdmin = hasRole("ROLE_ADMIN");
    const isFaculty = hasRole("ROLE_FACULTY");
    const isStudent = hasRole("ROLE_STUDENT");

    const actions = isAdmin
        ? [
            { title: "Add Student", icon: UserPlus },
            { title: "Add Faculty", icon: GraduationCap },
            { title: "Take Attendance", icon: CalendarPlus },
            { title: "Create Course", icon: BookOpen },
        ]
        : isFaculty
            ? [
                { title: "Take Attendance", icon: ClipboardCheck },
                { title: "My Students", icon: Users },
                { title: "Create Assignment", icon: ClipboardList },
                { title: "My Courses", icon: BookOpen },
            ]
            : isStudent
                ? [
                    { title: "My Subjects", icon: BookOpen },
                    { title: "My Attendance", icon: CalendarPlus },
                    { title: "Assignments", icon: ClipboardList },
                    { title: "Notifications", icon: Bell },
                ]
                : [];

    return (
        <div className="mt-8">
            <div className="mb-5">
                <h2 className="text-xl font-semibold text-slate-800">
                    Quick Actions
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                    Quickly access your frequently used features.
                </p>
            </div>

            <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
                {actions.map((action) => {
                    const Icon = action.icon;

                    return (
                        <button
                            key={action.title}
                            className="rounded-2xl bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                        >
                            <Icon
                                size={30}
                                className="mx-auto text-brand"
                            />
                            <p className="mt-4 font-medium text-slate-700">
                                {action.title}
                            </p>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
