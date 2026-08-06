const activities = [
    {
        title: "New student registered",
        time: "10 mins ago",
    },
    {
        title: "Attendance submitted",
        time: "35 mins ago",
    },
    {
        title: "Faculty added assignment",
        time: "1 hour ago",
    },
    {
        title: "Fee payment received",
        time: "Today",
    },
];

export default function RecentActivities() {
    return (
        <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-6">
                Recent Activities
            </h2>

            <div className="space-y-5">
                {activities.map((item, index) => (
                    <div
                        key={index}
                        className="border-l-4 border-blue-600 pl-4"
                    >
                        <p className="font-medium">
                            {item.title}
                        </p>

                        <p className="text-sm text-slate-500">
                            {item.time}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}