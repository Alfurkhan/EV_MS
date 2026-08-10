import {
    Menu,
    Search,
    Bell,
    UserCircle,
} from "lucide-react";

import { useLayout } from "../../contexts/LayoutContext";

import {
    useLocation,
} from "react-router-dom";

import { useState, useRef, useEffect } from "react";
import UserMenu from "./UserMenu";

export default function Topbar() {

    const location = useLocation();

    const {
        sidebarOpen,
        setSidebarOpen,
    } = useLayout();

    const [menuOpen, setMenuOpen] = useState(false);

    const menuRef =
        useRef<HTMLDivElement>(null);


    /*
     * Page titles
     */
    const pageInfo: Record<
        string,
        {
            title: string;
            subtitle: string;
        }
    > = {

        "/dashboard": {
            title: "Dashboard",
            subtitle: "Welcome back",
        },

        "/students": {
            title: "Students",
            subtitle: "Manage student records",
        },

        "/faculty": {
            title: "Faculty",
            subtitle: "Manage faculty members",
        },

        "/attendance": {
            title: "Attendance",
            subtitle: "Track and manage attendance",
        },

        "/courses": {
            title: "Courses",
            subtitle: "Manage courses and subjects",
        },

        "/notifications": {
            title: "Notifications",
            subtitle: "Stay updated with school activities",
        },

        "/settings": {
            title: "Settings",
            subtitle: "Manage system settings",
        },

        "/profile": {
            title: "My Profile",
            subtitle: "Manage your personal information",
        },

    };


    const currentPage =
        pageInfo[location.pathname] ?? {
            title: "E-Vidyalaya",
            subtitle: "School ERP",
        };


    /*
     * Close user menu when clicking outside
     */
    useEffect(() => {

        function handleClickOutside(
            event: MouseEvent
        ) {

            if (
                menuRef.current &&
                !menuRef.current.contains(
                    event.target as Node
                )
            ) {
                setMenuOpen(false);
            }

        }

        document.addEventListener(
            "mousedown",
            handleClickOutside
        );

        return () => {

            document.removeEventListener(
                "mousedown",
                handleClickOutside
            );

        };

    }, []);


    return (

        <header className="bg-white h-20 px-8 flex items-center justify-between shadow-sm">

            {/* LEFT SIDE */}
            <div className="flex items-center">

                {/* Sidebar Toggle */}
                <button
                    onClick={() =>
                        setSidebarOpen(!sidebarOpen)
                    }
                    className="mr-5 p-2 rounded-lg hover:bg-slate-100 transition"
                >
                    <Menu size={24} />
                </button>


                {/* Page Information */}
                <div>

                    <h2 className="text-2xl font-bold">
                        {currentPage.title}
                    </h2>

                    <p className="text-slate-500">
                        {currentPage.subtitle}
                    </p>

                </div>

            </div>


            {/* RIGHT SIDE */}
            <div className="flex items-center gap-6">

                {/* Search */}
                <div className="flex items-center bg-slate-100 rounded-xl px-4 h-11">

                    <Search size={18} />

                    <input
                        placeholder="Search..."
                        className="bg-transparent outline-none ml-3"
                    />

                </div>


                {/* Notifications */}
                <Bell
                    className="cursor-pointer"
                    size={22}
                />


                {/* User Menu */}
                <div
                    className="relative"
                    ref={menuRef}
                >

                    <button
                        onClick={() =>
                            setMenuOpen(!menuOpen)
                        }
                        className="rounded-full"
                    >

                        <UserCircle
                            size={36}
                            className="text-blue-600 cursor-pointer"
                        />

                    </button>


                    {menuOpen && (

                        <UserMenu
                            onClose={() =>
                                setMenuOpen(false)
                            }
                        />

                    )}

                </div>

            </div>

        </header>

    );
}