const announcements = [
    "Semester exams begin from Sept 15.",
    "Faculty meeting tomorrow at 10 AM.",
    "Holiday on Independence Day.",
];

export default function Announcements() {
    return (
        <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-5">
                Announcements
            </h2>

            <div className="space-y-4">
                {announcements.map((announcement) => (
                    <div
                        key={announcement}
                        className="border-b pb-3 text-slate-600"
                    >
                        {announcement}
                    </div>
                ))}
            </div>
        </div>
    );
}