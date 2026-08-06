const classes = [
    {
        subject: "Mathematics",
        time: "09:00 AM",
    },
    {
        subject: "Physics",
        time: "11:00 AM",
    },
    {
        subject: "Computer Science",
        time: "02:00 PM",
    },
];

export default function UpcomingClasses() {
    return (
        <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-5">
                Upcoming Classes
            </h2>

            <div className="space-y-4">
                {classes.map((item) => (
                    <div
                        key={item.subject}
                        className="flex justify-between items-center border-b pb-3"
                    >
                        <span className="font-medium">
                            {item.subject}
                        </span>

                        <span className="text-slate-500">
                            {item.time}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}