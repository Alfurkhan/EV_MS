import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Search, Users, Filter, ChevronDown, AlertCircle, SearchX } from "lucide-react";
import { getActiveAcademicYear, type AcademicYear } from "../../academic/services/academicYearService";
import { getMyStudents, type FacultyStudent } from "../services/myStudentsService";
import ContextualReportButton from "../../reports/components/ContextualReportButton";

export default function MyStudentsPage() {
    const [year, setYear] = useState<AcademicYear | null>(null);
    const [students, setStudents] = useState<FacultyStudent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [grade, setGrade] = useState("ALL");
    const [section, setSection] = useState("ALL");
    const [filtersOpen, setFiltersOpen] = useState(false);

    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            const activeYear = await getActiveAcademicYear();
            setYear(activeYear);
            const roster = await getMyStudents({ academicYearId: activeYear.id });
            setStudents(roster);
        } catch (err: any) {
            setError(err?.response?.data?.message || err?.response?.data?.error || err?.message || "Unable to load your students. Please try again.");
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => { void load(); }, []);

    const grades = useMemo(() => [...new Map(students.map(s => [s.gradeId, { id: s.gradeId, name: s.gradeName }])).values()].sort((a, b) => a.name.localeCompare(b.name)), [students]);
    const sections = useMemo(() => [...new Set(students.filter(s => grade === "ALL" || String(s.gradeId) === grade).map(s => s.sectionName))].sort(), [students, grade]);
    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        return students.filter(s =>
            (grade === "ALL" || String(s.gradeId) === grade) &&
            (section === "ALL" || s.sectionName === section) &&
            (!term || [s.fullName, s.email, s.phoneNumber ?? "", s.gradeName, s.sectionName].some(v => v.toLowerCase().includes(term)))
        );
    }, [students, search, grade, section]);

    const clearFilters = () => { setSearch(""); setGrade("ALL"); setSection("ALL"); };
    const hasFilters = Boolean(search.trim() || grade !== "ALL" || section !== "ALL");

    return <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
                <h1 className="text-4xl font-bold text-slate-800">My Students</h1>
                <p className="mt-1 text-slate-500">Students enrolled in the Grades assigned to you.</p>
            </div>
            <button type="button" onClick={load} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60">
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />{loading ? "Refreshing..." : "Refresh"}
            </button>
        </div>

        {loading ? <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft text-brand"><RefreshCw size={22} className="animate-spin" /></div>
                <p className="mt-4 text-sm font-medium text-slate-700">Loading students...</p>
                <p className="mt-1 text-xs text-slate-400">Please wait while we fetch your student records.</p>
            </div>
        </div> : error ? <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-red-200 bg-red-50 px-6 shadow-sm">
            <div className="max-w-md text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-500"><AlertCircle size={24} /></div>
                <h2 className="mt-4 text-base font-semibold text-slate-800">Unable to load students</h2>
                <p className="mt-2 text-sm leading-6 text-red-600">{error}</p>
                <button type="button" onClick={load} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-brand-hover"><RefreshCw size={16}/>Try Again</button>
            </div>
        </div> : <>
            <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-medium uppercase tracking-wide text-slate-400">Academic Year</p><p className="mt-1 text-lg font-semibold text-slate-800">{year?.name ?? "—"}</p></div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-medium uppercase tracking-wide text-slate-400">Grades Assigned</p><p className="mt-1 text-lg font-semibold text-slate-800">{grades.length}</p><p className="mt-1 text-sm text-slate-500">{grades.map(g => g.name).join(", ") || "—"}</p></div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-medium uppercase tracking-wide text-slate-400">Students</p><p className="mt-1 text-lg font-semibold text-slate-800">{students.length}</p></div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
                <div className="flex flex-wrap gap-2">
                    <div className="relative min-w-[220px] flex-1">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, phone..." className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"/>
                    </div>
                    <button type="button" onClick={() => setFiltersOpen(v => !v)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"><Filter size={16}/>Filters<ChevronDown size={16} className={filtersOpen ? "rotate-180 transition" : "transition"}/></button>
                    {hasFilters && <button type="button" onClick={clearFilters} className="rounded-xl px-3 py-2 text-sm font-medium text-brand hover:bg-brand-soft">Clear</button>}
                </div>
                {filtersOpen && <div className="grid gap-3 sm:grid-cols-2">
                    <label className="text-sm font-medium text-slate-600">Grade<select value={grade} onChange={e => { setGrade(e.target.value); setSection("ALL"); }} className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"><option value="ALL">All assigned Grades</option>{grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</select></label>
                    <label className="text-sm font-medium text-slate-600">Section<select value={section} onChange={e => setSection(e.target.value)} className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"><option value="ALL">All Sections</option>{sections.map(s => <option key={s}>{s}</option>)}</select></label>
                </div>}
            </div>

            {filtered.length === 0 ? <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 shadow-sm">
                <div className="max-w-md text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">{hasFilters ? <SearchX size={26}/> : <Users size={26}/>}</div>
                    <h2 className="mt-4 text-base font-semibold text-slate-800">{students.length === 0 ? "No students available" : "No students found"}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{students.length === 0 ? "There are currently no active enrollments in your assigned Grades." : "No students match your current search or filters. Try changing your search or clearing the filters."}</p>
                    {hasFilters && <button type="button" onClick={clearFilters} className="mt-5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50">Clear Search & Filters</button>}
                </div>
            </div> : <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto"><table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50"><tr>{["Student", "Contact", "Grade", "Section", "Enrollment"].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{h}</th>)}</tr></thead>
                    <tbody className="divide-y divide-slate-100">{filtered.map(s => <tr key={s.studentId} className="transition hover:bg-slate-50"><td className="px-4 py-3"><div className="font-medium text-slate-800">{s.fullName}</div><div className="text-xs text-slate-500">{s.email}</div></td><td className="px-4 py-3 text-sm text-slate-600">{[s.countryCode, s.phoneNumber].filter(Boolean).join(" ") || "—"}</td><td className="px-4 py-3 text-sm text-slate-700">{s.gradeName}</td><td className="px-4 py-3 text-sm text-slate-700">{s.sectionName}</td><td className="px-4 py-3"><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">Active</span></td></tr>)}</tbody>
                </table></div>
            </div>}
            {students.length > 0 && <p className="text-sm text-slate-500">Showing {filtered.length} of {students.length} students.</p>}
        </>}
        <ContextualReportButton report="my-class-strength" position="higher"/>
    </div>;
}
