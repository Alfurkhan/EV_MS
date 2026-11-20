import { useAuth } from "../../../contexts/AuthContext";

export default function RecentActivities() {
    const { hasRole } = useAuth();

    const isAdmin = hasRole("ROLE_ADMIN");
    const isFaculty = hasRole("ROLE_FACULTY");
    const isStudent = hasRole("ROLE_STUDENT");

    const activities = isAdmin
        ? [
            { title: "New student registered", time: "10 mins ago" },
            { title: "Faculty added", time: "35 mins ago" },
            { title: "New course created", time: "1 hour ago" },
            { title: "Attendance submitted", time: "Today" },
        ]
        : isFaculty
            ? [
                { title: "Attendance submitted", time: "15 mins ago" },
                { title: "Assignment created", time: "40 mins ago" },
                { title: "Student submission received", time: "1 hour ago" },
                { title: "New notification", time: "Today" },
            ]
            : isStudent
                ? [
                    { title: "Assignment due tomorrow", time: "20 mins ago" },
                    { title: "Attendance marked", time: "1 hour ago" },
                    { title: "New course material available", time: "Today" },
                    { title: "New notification", time: "Today" },
                ]
                : [];

    return (
        <div className="h-full rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-6">
                <h2 className="text-xl font-semibold text-slate-800">
                    Recent Activities
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                    Latest updates and activities.
                </p>
            </div>

            <div className="space-y-5">
                {activities.map((item, index) => (
                    <div
                        key={index}
                        className="border-l-4 border-brand pl-4"
                    >
                        <p className="font-medium text-slate-700">
                            {item.title}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                            {item.time}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
