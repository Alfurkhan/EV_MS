import WelcomeBanner from "../features/dashboard/components/WelcomeBanner";
import StatsGrid from "../features/dashboard/components/StatsGrid";
import AttendanceChart from "../features/dashboard/components/AttendanceChart";
import RecentActivities from "../features/dashboard/components/RecentActivities";
import QuickActions from "../features/dashboard/components/QuickActions";

export default function Dashboard() {
    return (
        <div className="space-y-8">

            <WelcomeBanner />

            <StatsGrid />

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