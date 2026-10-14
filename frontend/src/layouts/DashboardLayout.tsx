import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Topbar";

import AccountImportButton
    from "../features/account-import/components/AccountImportButton";
import AccountImportModal
    from "../features/account-import/components/AccountImportModal";

export default function DashboardLayout() {
    const [isAccountImportOpen, setIsAccountImportOpen] =
        useState(false);

    const location = useLocation();
    const isDashboardPage = location.pathname === "/dashboard";

    return (
        <div className="h-screen flex overflow-hidden bg-slate-100">

            <Sidebar />

            <div className="flex-1 flex flex-col min-w-0">

                <Header />

                <main className="flex-1 overflow-y-auto overflow-x-hidden p-8 bg-slate-100">
                    <Outlet />
                </main>

            </div>

            {isDashboardPage && (
                <>
                    <AccountImportButton
                        onClick={() => {
                            setIsAccountImportOpen(true);
                        }}
                    />

                    {isAccountImportOpen && (
                        <AccountImportModal
                            onClose={() => {
                                setIsAccountImportOpen(false);
                            }}
                        />
                    )}
                </>
            )}

        </div>
    );
}
