import { useLayout } from "../../contexts/LayoutContext";
import { useAuth } from "../../contexts/AuthContext";
import { NavLink } from "react-router-dom";

import {
    LayoutDashboard,
    Users,
    GraduationCap,
    CalendarCheck,
    BookOpen,
    Bell,
    Settings,
    LogOut,
} from "lucide-react";

type Role =
    | "ROLE_STUDENT"
    | "ROLE_FACULTY"
    | "ROLE_ADMIN";

type MenuItem = {
    icon: React.ElementType;
    label: string;
    path: string;
    allowedRoles: Role[];
};

type MenuSection = {
    section: string;
    items: MenuItem[];
};

const menu: MenuSection[] = [
    {
        section: "MAIN",
        items: [
            {
                icon: LayoutDashboard,
                label: "Dashboard",
                path: "/dashboard",
                allowedRoles: [
                    "ROLE_STUDENT",
                    "ROLE_FACULTY",
                    "ROLE_ADMIN",
                ],
            },
        ],
    },

    {
        section: "ACADEMICS",
        items: [
            {
                icon: Users,
                label: "Students",
                path: "/students",
                allowedRoles: ["ROLE_ADMIN"],
            },
            {
                icon: GraduationCap,
                label: "Faculty",
                path: "/faculty",
                allowedRoles: ["ROLE_ADMIN"],
            },
            {
                icon: CalendarCheck,
                label: "Attendance",
                path: "/attendance",
                allowedRoles: [
                    "ROLE_STUDENT",
                    "ROLE_FACULTY",
                    "ROLE_ADMIN",
                ],
            },
            {
                icon: BookOpen,
                label: "Courses",
                path: "/courses",
                allowedRoles: [
                    "ROLE_STUDENT",
                    "ROLE_FACULTY",
                    "ROLE_ADMIN",
                ],
            },
        ],
    },

    {
        section: "SYSTEM",
        items: [
            {
                icon: Bell,
                label: "Notifications",
                path: "/notifications",
                allowedRoles: [
                    "ROLE_STUDENT",
                    "ROLE_FACULTY",
                    "ROLE_ADMIN",
                ],
            },
            {
                icon: Settings,
                label: "Settings",
                path: "/settings",
                allowedRoles: ["ROLE_ADMIN"],
            },
        ],
    },
];

export default function Sidebar() {
    const { sidebarOpen } = useLayout();
    const { logout, hasRole } = useAuth();

    return (
        <aside
            className={`
                bg-slate-900
                text-white
                flex
                flex-col
                h-screen
                shrink-0
                transition-[width]
                duration-300
                ${
                sidebarOpen
                    ? "w-72"
                    : "w-20"
            }
            `}
        >

            {/* Logo */}
            <div className="h-20 flex items-center px-8 border-b border-slate-800 overflow-hidden">

                <div className="relative w-full h-12 flex items-center">

                    {/* Collapsed Logo */}
                    <h1
                        className={`
                absolute
                left-0
                text-2xl
                font-bold
                whitespace-nowrap
                transition-all
                duration-200
                ease-out
                ${
                            sidebarOpen
                                ? "opacity-0 scale-95"
                                : "opacity-100 scale-100"
                        }
            `}
                    >
                        EV
                    </h1>

                    {/* Expanded Logo */}
                    <div
                        className={`
                            transition-all
                            duration-300
                            ease-out
                            whitespace-nowrap
                            ${
                                sidebarOpen
                                    ? "opacity-100 translate-x-0"
                                    : "opacity-0 -translate-x-2"
                        }
            `}
                    >
                        <h1 className="text-2xl font-bold">
                            E-Vidyalaya
                        </h1>

                        <p className="text-slate-400 text-sm">
                            School ERP
                        </p>
                    </div>

                </div>

            </div>


            {/* Navigation */}
            <div className="flex-1 overflow-y-auto px-4 py-6">

                {menu.map((group) => {

                    /*
                     * Only keep menu items for which
                     * the current user has permission.
                     */
                    const visibleItems = group.items.filter(
                        (item) =>
                            item.allowedRoles.some((role) =>
                                hasRole(role)
                            )
                    );

                    /*
                     * Don't display an empty section.
                     */
                    if (visibleItems.length === 0) {
                        return null;
                    }

                    return (
                        <div
                            key={group.section}
                            className="mb-8"
                        >

                            {sidebarOpen && (
                                <p className="text-xs uppercase text-slate-500 px-4 mb-3">
                                    {group.section}
                                </p>
                            )}

                            <div className="space-y-2">

                                {visibleItems.map((item) => {

                                    const Icon = item.icon;

                                    return (
                                        <NavLink
                                            key={item.label}
                                            to={item.path}
                                            className={({ isActive }) =>
                                                `w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                                                    isActive
                                                        ? "bg-blue-600 text-white shadow"
                                                        : "text-slate-300 hover:bg-slate-800"
                                                }`
                                            }
                                        >

                                            <Icon size={20} />

                                            {sidebarOpen && (
                                                <span>
                                                    {item.label}
                                                </span>
                                            )}

                                        </NavLink>
                                    );

                                })}

                            </div>

                        </div>
                    );
                })}

            </div>


            {/* Logout */}
            <div className="border-t border-slate-800 p-4">

                <button
                    onClick={logout}
                    className="
                        w-full
                        flex
                        items-center
                        gap-3
                        px-4
                        py-3
                        rounded-xl
                        text-slate-300
                        hover:bg-red-600
                        hover:text-white
                        active:scale-[0.98]
                        transition-all
                        duration-200
                    "
                >

                    <LogOut
                        size={20}
                        className="shrink-0"
                    />

                    {sidebarOpen && (
                        <span>
                            Logout
                        </span>
                    )}

                </button>

            </div>

        </aside>
    );
}