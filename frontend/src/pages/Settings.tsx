import { useEffect, useMemo, useState } from "react";
import {
    Activity,
    Bell,
    BookOpen,
    CalendarDays,
    ClipboardCheck,
    GraduationCap,
    LockKeyhole,
    School,
    Settings2,
    ShieldCheck,
    Users,
    type LucideIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/axios";

type SettingAuditEntry = {
    id: number;
    key: string;
    oldValue: string | null;
    newValue: string | null;
    changedBy: number;
    changedAt: string;
};

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
    const [savedSettings, setSavedSettings] = useState<Record<string, string>>({});
    const [auditEntries, setAuditEntries] = useState<SettingAuditEntry[]>([]);
    const [loading, setLoading] = useState(true);

    const selectedCategory = useMemo(
        () => categories.find((category) => category.id === activeCategory) ?? categories[0],
        [activeCategory],
    );

    useEffect(() => {
        let mounted = true;

        const loadSettings = async () => {
            setLoading(true);
            try {
                const [settingsResponse, auditResponse] = await Promise.all([
                    api.get<Record<string, string>>("/admin/settings"),
                    api.get<SettingAuditEntry[]>("/admin/settings/audit"),
                ]);

                if (!mounted) return;
                setSavedSettings(settingsResponse.data ?? {});
                setAuditEntries(auditResponse.data ?? []);
            } catch {
                if (mounted) {
                    toast.error("Unable to load school settings.");
                }
            } finally {
                if (mounted) setLoading(false);
            }
        };

        void loadSettings();
        return () => {
            mounted = false;
        };
    }, []);

    const SelectedIcon = selectedCategory.icon;

    return (
        <div className="space-y-6 pb-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-600">
                        <Settings2 size={16} />
                        Administration
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                        Settings
                    </h1>
                    <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
                        Manage school-wide preferences and control how eVidyalaya works for your school.
                    </p>
                </div>
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300">
                    <LockKeyhole size={14} />
                    Admin access only
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Saved configuration values</p>
                        <div className="rounded-xl bg-blue-50 p-2 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                            <Settings2 size={18} />
                        </div>
                    </div>
                    <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">
                        {loading ? "—" : Object.keys(savedSettings).length}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Stored securely in the application database
                    </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Recent configuration changes</p>
                        <div className="rounded-xl bg-violet-50 p-2 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">
                            <Activity size={18} />
                        </div>
                    </div>
                    <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">
                        {loading ? "—" : auditEntries.length}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Latest changes retained in the audit history
                    </p>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
                <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
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
                                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${active
                                        ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                                        : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/70"}`}
                                >
                                    <Icon size={18} className="shrink-0" />
                                    <span className="min-w-0 flex-1">
                                        <span className="block text-sm font-semibold">{category.title}</span>
                                        <span className={`mt-0.5 block truncate text-xs ${active ? "text-blue-600/80 dark:text-blue-300/70" : "text-slate-400"}`}>
                                            {category.description}
                                        </span>
                                    </span>
                                </button>
                            );
                        })}
                    </nav>
                </aside>

                <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex flex-col gap-4 border-b border-slate-100 pb-6 dark:border-slate-800 sm:flex-row sm:items-start">
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                            <SelectedIcon size={23} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                    {selectedCategory.title}
                                </h2>
                                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                    {selectedCategory.phase}
                                </span>
                            </div>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                                {selectedCategory.details}
                            </p>
                        </div>
                    </div>

                    <div className="flex min-h-64 flex-col items-center justify-center px-4 py-10 text-center">
                        <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                            <Settings2 size={25} />
                        </div>
                        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
                            This section is being prepared
                        </h3>
                        <p className="mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
                            The settings foundation is in place. Controls will be enabled in the planned implementation phase, once each option is connected to its actual application behavior.
                        </p>
                    </div>
                </section>
            </div>

            <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                <ShieldCheck size={19} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        Your configuration is protected
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                        Only administrators can access school-wide settings. Configuration changes are recorded with the administrator and timestamp. eVidyalaya product identity and branding will remain part of the application.
                    </p>
                </div>
            </div>
        </div>
    );
}
