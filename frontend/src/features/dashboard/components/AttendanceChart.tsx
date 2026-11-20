import { useEffect, useState } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { useAuth } from "../../../contexts/AuthContext";
import {
    getAttendanceDashboard,
    getFacultyWeeklyClassAttendance,
    type AttendanceChartPoint,
} from "../../faculty/services/facultyService";
import type { FacultyWeeklyClassAttendanceResponse } from "../../faculty/types/attendance";
import FacultyClassAttendanceModal from "./FacultyClassAttendanceModal";

export default function AttendanceChart() {
    const { hasRole } = useAuth();
    const isAdmin = hasRole("ROLE_ADMIN");
    const isFaculty = hasRole("ROLE_FACULTY");
    const isStudent = hasRole("ROLE_STUDENT");

    const [data, setData] = useState<AttendanceChartPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [classAttendanceOpen, setClassAttendanceOpen] = useState(false);
    const [classAttendance, setClassAttendance] = useState<FacultyWeeklyClassAttendanceResponse | null>(null);
    const [classAttendanceLoading, setClassAttendanceLoading] = useState(false);

    useEffect(() => {
        getAttendanceDashboard()
            .then((response) => setData(response.chart))
            .catch((error) => {
                console.error("Failed to load attendance chart:", error);
                setData([]);
            })
            .finally(() => setLoading(false));
    }, []);

    const handleViewClassAttendance = async () => {
        if (!isFaculty) return;
        if (classAttendance) {
            setClassAttendanceOpen(true);
            return;
        }
        setClassAttendanceLoading(true);
        try {
            const response = await getFacultyWeeklyClassAttendance();
            setClassAttendance(response);
            setClassAttendanceOpen(true);
        } catch (error) {
            console.error("Failed to load faculty class attendance:", error);
        } finally {
            setClassAttendanceLoading(false);
        }
    };

    let title = "My Attendance";
    let description = "Your attendance this week.";
    if (isAdmin) {
        title = "School Attendance";
        description = "Overall attendance across the school.";
    } else if (isFaculty) {
        title = "Class Attendance";
        description = "Attendance across your assigned classes.";
    } else if (isStudent) {
        title = "My Attendance";
        description = "Your attendance this week.";
    }

    return (
        <>
            <div className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-800">{title}</h2>
                        <p className="mt-1 text-sm text-slate-500">{description}</p>
                    </div>
                    <span className="text-sm text-slate-500">This Week</span>
                </div>

                <div className="h-[300px]">
                    {loading ? (
                        <div className="flex h-full items-center justify-center text-sm text-slate-500">Loading attendance...</div>
                    ) : data.length === 0 ? (
                        <div className="flex h-full items-center justify-center text-sm text-slate-500">No attendance data available.</div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="day" tickLine={false} axisLine={false} />
                                <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
                                <Tooltip
                                    formatter={(value) => value === null || value === undefined ? "No data" : `${value}%`}
                                    labelFormatter={(label) => `${label}`}
                                />
                                <Line type="monotone" dataKey="attendance" stroke="var(--ev-primary)" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 7 }} connectNulls={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {isFaculty && (
                    <div className="mt-4 flex justify-end">
                        <button type="button" onClick={handleViewClassAttendance} disabled={classAttendanceLoading} className="rounded-lg border border-brand/30 px-4 py-2 text-sm font-medium text-brand transition hover:bg-brand-soft disabled:cursor-not-allowed disabled:opacity-60">
                            {classAttendanceLoading ? "Loading..." : "View Class Attendance"}
                        </button>
                    </div>
                )}
            </div>

            {isFaculty && classAttendance && (
                <FacultyClassAttendanceModal
                    open={classAttendanceOpen}
                    weekStart={classAttendance.weekStart}
                    weekEnd={classAttendance.weekEnd}
                    dailyAttendance={classAttendance.dailyAttendance}
                    classSummaries={classAttendance.classSummaries}
                    overallAverage={classAttendance.overallAverage}
                    onClose={() => setClassAttendanceOpen(false)}
                />
            )}
        </>
    );
}
