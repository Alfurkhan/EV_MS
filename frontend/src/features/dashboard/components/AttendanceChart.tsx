export default function AttendanceChart() {
    return (
        <div className="bg-white rounded-2xl shadow-sm p-6 h-[360px]">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">
                    Attendance Overview
                </h2>

                <span className="text-sm text-slate-500">
                    This Week
                </span>
            </div>

            <div className="h-[260px] flex items-center justify-center rounded-xl border-2 border-dashed border-slate-200">
                <p className="text-slate-400">
                    📊 Chart will be connected later
                </p>
            </div>
        </div>
    );
}