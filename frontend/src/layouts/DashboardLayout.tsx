import { Outlet } from "react-router-dom";

import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Topbar";

export default function DashboardLayout() {
    return (
        <div className="min-h-screen bg-slate-100 flex">

            <Sidebar />

            <div className="flex-1 flex flex-col">

                <Header />

                <main className="flex-1 p-8 bg-slate-100 overflow-auto">

                    <Outlet />

                </main>

            </div>

        </div>
    );
}