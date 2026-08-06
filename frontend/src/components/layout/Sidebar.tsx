import { useLayout } from "../../contexts/LayoutContext";
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

const menu = [
    {
        section: "MAIN",
        items: [
            {
                icon: LayoutDashboard,
                label: "Dashboard",
                path: "/dashboard",
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
            },
            {
                icon: GraduationCap,
                label: "Faculty",
                path: "/faculty",
            },
            {
                icon: CalendarCheck,
                label: "Attendance",
                path: "/attendance",
            },
            {
                icon: BookOpen,
                label: "Courses",
                path: "/courses",
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
            },
            {
                icon: Settings,
                label: "Settings",
                path: "/settings",
            },
        ],
    },
];

export default function Sidebar() {

    const { sidebarOpen } = useLayout();

    return (
        <aside
            className={`
        bg-slate-900
        text-white
        flex
        flex-col
        transition-[width]
        duration-300
        ${
                sidebarOpen
                    ? "w-72"
                    : "w-20"
            }
    `}
        >

            <div className="h-20 flex items-center px-8 border-b border-slate-800">

                <div>

                    {sidebarOpen ? (
                        <>
                            <h1 className="text-2xl font-bold">
                                E-Vidyalaya
                            </h1>

                            <p className="text-slate-400 text-sm">
                                School ERP
                            </p>
                        </>
                    ) : (
                        <h1 className="text-2xl font-bold">
                            EV
                        </h1>
                    )}

                </div>

            </div>

            <div className="flex-1 px-4 py-6">

                {menu.map((group) => (

                    <div key={group.section} className="mb-8">

                        {sidebarOpen && (
                            <p className="text-xs uppercase text-slate-500 px-4 mb-3">
                                {group.section}
                            </p>
                        )}

                        <div className="space-y-2">

                            {group.items.map((item) => {

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
                                            <span>{item.label}</span>
                                        )}

                                    </NavLink>
                                );

                            })}

                        </div>

                    </div>

                ))}

            </div>

            <div className="border-t border-slate-800 p-4">

                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-600 transition">

                    <LogOut size={20} />

                    {sidebarOpen && "Logout"}

                </button>

            </div>

        </aside>
    );
}