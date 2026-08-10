import { Outlet } from "react-router-dom";

import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Topbar";

export default function DashboardLayout() {
    return (
        <div className="h-screen flex overflow-hidden bg-slate-100">

            <Sidebar />

            <div className="flex-1 flex flex-col min-w-0">

                <Header />

                <main className="flex-1 overflow-y-auto overflow-x-hidden p-8 bg-slate-100">

                    <Outlet />

                </main>

            </div>

        </div>
    );
}