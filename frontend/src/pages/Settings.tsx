import { useState } from "react";
import {
    Activity,
    Bell,
    BookOpen,
    CalendarDays,
    ClipboardCheck,
    GraduationCap,
    Info,
    LockKeyhole,
    School,
    Settings2,
    ShieldCheck,
    Users,
    type LucideIcon,
} from "lucide-react";

type SettingsCategory = {
    id: string;
    title: string;
    description: string;
    phase: string;
    icon: LucideIcon;
    details: string;
};

const categories: SettingsCategory[] = [
    {
        id: "school",
        title: "School profile",
        description: "School identity and branding",
        phase: "Phase 2",
        icon: School,
        details: "Manage the school's name, logo, contact details and identity across eVidyalaya. eVidyalaya branding will remain visible alongside the school's identity.",
    },
    {
        id: "academic",
        title: "Academic settings",
        description: "Academic year and grading",
        phase: "Phase 3",
        icon: GraduationCap,
        details: "Choose the default academic year and configure academic calendar and grading preferences.",
    },
    {
        id: "attendance",
        title: "Attendance",
        description: "Attendance rules and thresholds",
        phase: "Phase 3",
        icon: ClipboardCheck,
        details: "Configure attendance thresholds, working days and the rules applied when attendance is recorded.",
    },
    {
        id: "timetable",
        title: "Timetable",
        description: "Class scheduling preferences",
        phase: "Phase 5",
        icon: CalendarDays,
        details: "Set default class durations, working days and scheduling preferences used when creating timetables.",
    },
    {
        id: "notifications",
        title: "Notifications",
        description: "Email and in-app preferences",
        phase: "Phase 4",
        icon: Bell,
        details: "Control school-wide email and in-app notifications for announcements, assignments, assessments, timetables and results.",
    },
    {
        id: "assessments",
        title: "Assignments & examinations",
        description: "Submission and result rules",
        phase: "Phase 5",
        icon: BookOpen,
        details: "Configure submission limits, accepted file types, evaluation and result-publication preferences.",
    },
    {
        id: "users",
        title: "User management",
        description: "Account creation and activation",
        phase: "Phase 6",
        icon: Users,
        details: "Manage school-wide account creation, registration and account-activation policies.",
    },
    {
        id: "security",
        title: "Security",
        description: "Account and session policies",
        phase: "Phase 6",
        icon: ShieldCheck,
        details: "Review configurable password, login and session policies. Infrastructure secrets remain managed outside this page.",
    },
    {
        id: "system",
        title: "System information",
        description: "Application and service status",
        phase: "Phase 7",
        icon: Activity,
        details: "View read-only application version and service information. Sensitive infrastructure configuration will not be exposed here.",
    },
];

export default function Settings() {
    const [activeCategory, setActiveCategory] = useState("school");
    const [showProtectionInfo, setShowProtectionInfo] = useState(false);

    const selectedCategory =
        categories.find((category) => category.id === activeCategory) ?? categories[0];

    const SelectedIcon = selectedCategory.icon;

    return (
        <div className="space-y-6 pb-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-600">
                        <Settings2 size={16} />
                        Administration
                    </div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                            Settings
                        </h1>
                        <div
                            className="relative"
                            onMouseEnter={() => setShowProtectionInfo(true)}
                            onMouseLeave={() => setShowProtectionInfo(false)}
                            onFocus={() => setShowProtectionInfo(true)}
                            onBlur={(event) => {
                                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                                    setShowProtectionInfo(false);
                                }
                            }}
                        >
                            <button
                                type="button"
                                aria-label="About settings protection"
                                aria-expanded={showProtectionInfo}
                                aria-describedby="settings-protection-tooltip"
                                onClick={() => setShowProtectionInfo((visible) => !visible)}
                                className="inline-flex size-7 items-center justify-center rounded-full text-slate-400 transition hover:bg-blue-50 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
                            >
                                <Info size={17} />
                            </button>
                            <div
                                id="settings-protection-tooltip"
                                role="tooltip"
                                className={`absolute left-0 top-full z-30 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-3 text-left text-xs leading-5 text-slate-600 shadow-lg transition-all duration-200 ease-out sm:left-auto sm:right-0 ${
                                    showProtectionInfo
                                        ? "translate-y-0 opacity-100"
                                        : "pointer-events-none -translate-y-1 opacity-0"
                                }`}
                            >
                                Only administrators can access school-wide settings. Configuration changes are recorded with the administrator and timestamp. eVidyalaya's product identity and branding will remain part of the application.
                            </div>
                        </div>
                    </div>
                    <p className="mt-1 max-w-2xl text-sm text-slate-500">
                        Manage school-wide preferences and control how eVidyalaya works for your school.
                    </p>
                </div>
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                    <LockKeyhole size={14} />
                    Admin access only
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
                <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                    <div className="px-3 pb-3 pt-2">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Configuration
                        </p>
                    </div>
                    <nav className="space-y-1" aria-label="Settings categories">
                        {categories.map((category) => {
                            const Icon = category.icon;
                            const active = category.id === activeCategory;
                            return (
                                <button
                                    key={category.id}
                                    type="button"
                                    onClick={() => setActiveCategory(category.id)}
                                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                                        active
                                            ? "bg-blue-50 text-blue-700"
                                            : "text-slate-600 hover:bg-slate-50"
                                    }`}
                                >
                                    <Icon size={18} className="shrink-0" />
                                    <span className="min-w-0 flex-1">
                                        <span className="block text-sm font-semibold">{category.title}</span>
                                        <span className={`mt-0.5 block truncate text-xs ${
                                            active ? "text-blue-600/80" : "text-slate-400"
                                        }`}>
                                            {category.description}
                                        </span>
                                    </span>
                                </button>
                            );
                        })}
                    </nav>
                </aside>

                <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                    <div className="flex flex-col gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-start">
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                            <SelectedIcon size={23} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="text-xl font-bold text-slate-900">
                                    {selectedCategory.title}
                                </h2>
                                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                                    {selectedCategory.phase}
                                </span>
                            </div>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                                {selectedCategory.details}
                            </p>
                        </div>
                    </div>

                    <div className="flex min-h-64 flex-col items-center justify-center px-4 py-10 text-center">
                        <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                            <Settings2 size={25} />
                        </div>
                        <h3 className="text-base font-semibold text-slate-800">
                            This section is being prepared
                        </h3>
                        <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                            The settings foundation is in place. Controls will be enabled in the planned implementation phase, once each option is connected to its actual application behavior.
                        </p>
                    </div>
                </section>
            </div>
        </div>
    );
}
