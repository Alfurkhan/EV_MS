import {
    Menu,
    Search,
    UserCircle,
    GraduationCap,
    BadgeCheck,
    UserRound,
} from "lucide-react";

import { useLayout } from "../../contexts/LayoutContext";
import { useProfile } from "../../contexts/ProfileContext";
import { useAuth } from "../../contexts/AuthContext";
import { useState, useRef, useEffect } from "react";
import UserMenu from "./UserMenu";\nimport { Link } from "react-router-dom";
import NotificationBell from "./NotificationBell";
import { useSchoolBranding } from "../../contexts/SchoolBrandingContext";

function getGreeting() {
    const hour = new Date().getHours();

    if (hour < 12) return "Good morning,";
    if (hour < 17) return "Good afternoon,";
    return "Good evening,";
}

function formatRole(role: string | null | undefined) {
    if (!role) return "User";

    return role
        .replace(/^ROLE_/, "")
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getRoleIcon(role: string | null | undefined) {
    if (role === "ROLE_STUDENT") {
        return <GraduationCap size={12} aria-hidden="true" />;
    }

    if (role === "ROLE_FACULTY") {
        return <UserRound size={12} aria-hidden="true" />;
    }

    return <BadgeCheck size={12} aria-hidden="true" />;
}

export default function Topbar() {
    const { sidebarOpen, setSidebarOpen } = useLayout();
    const { profile } = useProfile();
    const { hasRole } = useAuth();
    const { name: schoolName, tagline: schoolTagline, logoSrc } = useSchoolBranding();

    const [menuOpen, setMenuOpen] = useState(false);
    const [greeting, setGreeting] = useState(getGreeting);
    const menuRef = useRef<HTMLDivElement>(null);

    const fullName = profile?.fullName?.trim() || "";
    const displayName = fullName ? fullName.split(/\s+/)[0] : "there";
    const role =
        profile?.role ||
        (hasRole("ROLE_ADMIN")
            ? "ROLE_ADMIN"
            : hasRole("ROLE_FACULTY")
                ? "ROLE_FACULTY"
                : hasRole("ROLE_STUDENT")
                    ? "ROLE_STUDENT"
                    : null);

    const roleBadgeStyle =
        role === "ROLE_ADMIN"
            ? "bg-indigo-50 text-indigo-700 ring-indigo-100"
            : role === "ROLE_FACULTY"
                ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
                : role === "ROLE_STUDENT"
                    ? "bg-sky-50 text-sky-700 ring-sky-100"
                    : "bg-slate-100 text-slate-600 ring-slate-200";

    useEffect(() => {
        const updateGreeting = () => setGreeting(getGreeting());
        const interval = window.setInterval(updateGreeting, 60_000);

        return () => window.clearInterval(interval);
    }, []);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node)
            ) {
                setMenuOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <header className="relative z-30 flex h-20 shrink-0 items-center justify-between bg-white px-4 shadow-sm sm:px-8">
            {/* LEFT SIDE */}
            <div className="flex min-w-0 items-center">
                <button
                    type="button"
                    aria-label="Toggle sidebar"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="mr-3 rounded-lg p-2 transition hover:bg-slate-100 sm:mr-5"
                >
                    <Menu size={24} />
                </button>

                <Link
                    to="/school-profile"
                    aria-label="View school profile"
                    className="group flex min-w-0 items-center gap-3 rounded-xl py-1 pr-2 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                >
                    {logoSrc ? (
                        <img src={logoSrc} alt="" className="h-10 w-10 shrink-0 rounded-lg object-contain" />
                    ) : (
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                            <GraduationCap size={22} />
                        </span>
                    )}
                    <div className="min-w-0">
                        <h2 className="truncate text-lg font-bold text-slate-900 transition group-hover:text-blue-700 sm:text-xl">
                            {schoolName.trim() || "Your School"}
                        </h2>
                        <p className="hidden truncate text-xs text-slate-500 sm:block">
                            {schoolTagline.trim() || "School"}
                        </p>
                    </div>
                </Link>
            </div>

            {/* RIGHT SIDE */}
            <div className="ml-3 flex shrink-0 items-center gap-2 sm:gap-4">
                {/* Search */}
                <div className="hidden h-11 items-center rounded-xl bg-slate-100 px-4 lg:flex">
                    <Search size={18} className="text-slate-500" />
                    <input
                        placeholder="Search..."
                        aria-label="Search"
                        className="ml-3 w-32 bg-transparent text-sm outline-none xl:w-44"
                    />
                </div>

                <NotificationBell />

                {/* Persistent user identity and profile menu */}
                <div className="relative" ref={menuRef}>
                    <button
                        type="button"
                        aria-label="Open user menu"
                        aria-expanded={menuOpen}
                        onClick={() => setMenuOpen((open) => !open)}
                        className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-left transition hover:bg-slate-50 sm:gap-3"
                    >
                        <div className="hidden min-w-0 flex-col items-end sm:flex">
                            <span className="text-[11px] leading-4 text-slate-500">
                                {greeting}
                            </span>
                            <span className="max-w-36 truncate text-sm font-semibold leading-5 text-slate-800">
                                {displayName}
                            </span>
                            <span
                                className={`mt-0.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ring-1 ring-inset ${roleBadgeStyle}`}
                            >
                                {getRoleIcon(role)}
                                {formatRole(role)}
                            </span>
                        </div>

                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 ring-1 ring-blue-100">
                            <UserCircle size={30} className="text-blue-600" />
                        </span>
                    </button>

                    {menuOpen && (
                        <UserMenu onClose={() => setMenuOpen(false)} />
                    )}
                </div>
            </div>
        </header>
    );
}
