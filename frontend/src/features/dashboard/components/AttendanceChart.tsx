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

export default function AttendanceChart() {
    const { hasRole } = useAuth();

    const isAdmin = hasRole("ROLE_ADMIN");
    const isFaculty = hasRole("ROLE_FACULTY");
    const isStudent = hasRole("ROLE_STUDENT");

    const studentData = [
        { day: "Mon", attendance: 92 },
        { day: "Tue", attendance: 88 },
        { day: "Wed", attendance: 95 },
        { day: "Thu", attendance: 84 },
        { day: "Fri", attendance: 90 },
    ];

    const facultyData = [
        { day: "Mon", attendance: 94 },
        { day: "Tue", attendance: 91 },
        { day: "Wed", attendance: 96 },
        { day: "Thu", attendance: 89 },
        { day: "Fri", attendance: 93 },
    ];

    const adminData = [
        { day: "Mon", attendance: 95 },
        { day: "Tue", attendance: 93 },
        { day: "Wed", attendance: 96 },
        { day: "Thu", attendance: 92 },
        { day: "Fri", attendance: 94 },
    ];

    let data = studentData;
    let title = "My Attendance";
    let description = "Your attendance this week.";

    if (isAdmin) {
        data = adminData;
        title = "School Attendance";
        description = "Overall attendance across the school.";
    } else if (isFaculty) {
        data = facultyData;
        title = "Class Attendance";
        description = "Attendance across your assigned classes.";
    } else if (isStudent) {
        data = studentData;
        title = "My Attendance";
        description = "Your attendance this week.";
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm p-6">

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-semibold text-slate-800">
                        {title}
                    </h2>

                    <p className="text-sm text-slate-500 mt-1">
                        {description}
                    </p>
                </div>

                <span className="text-sm text-slate-500">
                    This Week
                </span>
            </div>

            {/* Chart */}
            <div className="h-[300px]">
                <ResponsiveContainer
                    width="100%"
                    height="100%"
                >
                    <LineChart
                        data={data}
                        margin={{
                            top: 10,
                            right: 10,
                            left: -20,
                            bottom: 5,
                        }}
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                        />

                        <XAxis
                            dataKey="day"
                            tickLine={false}
                            axisLine={false}
                        />

                        <YAxis
                            domain={[70, 100]}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) =>
                                `${value}%`
                            }
                        />

                        <Tooltip
                            formatter={(value) =>
                                `${value}%`
                            }
                            labelFormatter={(label) =>
                                `${label}`
                            }
                        />

                        <Line
                            type="monotone"
                            dataKey="attendance"
                            stroke="#2563eb"
                            strokeWidth={3}
                            dot={{
                                r: 5,
                            }}
                            activeDot={{
                                r: 7,
                            }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}