import WelcomeBanner from "../features/dashboard/components/WelcomeBanner";
import StatsGrid from "../features/dashboard/components/StatsGrid";
import AttendanceChart from "../features/dashboard/components/AttendanceChart";
import RecentActivities from "../features/dashboard/components/RecentActivities";
import QuickActions from "../features/dashboard/components/QuickActions";
import MyAcademicDetails from "../features/dashboard/components/MyAcademicDetails";
import { useAuth } from "../contexts/AuthContext";

export default function Dashboard() {
    const { user } = useAuth();

    const isStudent = user?.roles.includes("ROLE_STUDENT");

    return (
        <div className="space-y-8">

            <WelcomeBanner />

            <StatsGrid />

            {isStudent && <MyAcademicDetails />}

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                <div className="xl:col-span-2">
                    <AttendanceChart />
                </div>

                <div>
                    <RecentActivities />
                </div>

            </div>

            <QuickActions />

        </div>
    );
}