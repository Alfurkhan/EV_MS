import {
    UserPlus,
    GraduationCap,
    CalendarPlus,
    BookOpen,
} from "lucide-react";

const actions = [
    {
        title: "Add Student",
        icon: UserPlus,
    },
    {
        title: "Add Faculty",
        icon: GraduationCap,
    },
    {
        title: "Take Attendance",
        icon: CalendarPlus,
    },
    {
        title: "Create Course",
        icon: BookOpen,
    },
];

export default function QuickActions() {
    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">
                Quick Actions
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                {actions.map((action) => {
                    const Icon = action.icon;

                    return (
                        <button
                            key={action.title}
                            className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-lg transition-all hover:-translate-y-1"
                        >
                            <Icon
                                size={30}
                                className="mx-auto text-blue-600"
                            />

                            <p className="mt-4 font-medium">
                                {action.title}
                            </p>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}