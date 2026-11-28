import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Search, X, MoreVertical, Eye, Users, SearchX, AlertCircle, Phone, Mail, GraduationCap } from "lucide-react";
import { getActiveAcademicYear, type AcademicYear } from "../../academic/services/academicYearService";
import { getMyStudents, type FacultyStudent } from "../services/myStudentsService";
import ContextualReportButton from "../../reports/components/ContextualReportButton";
import toast from "react-hot-toast";
import { getFacultyReportScope, type FacultyReportScopeOption } from "../../reports/services/reportService";

function initials(name: string) {
    return name.trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase() ?? "").join("");
}

export default function MyStudentsPage() {
    const [year, setYear] = useState<AcademicYear | null>(null);
    const [students, setStudents] = useState<FacultyStudent[]>([]);
    const [facultyScope, setFacultyScope] = useState<FacultyReportScopeOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [gradeId, setGradeId] = useState("");
    const [sectionId, setSectionId] = useState("");
    const [actionStudent, setActionStudent] = useState<number | null>(null);
    const [detailsStudent, setDetailsStudent] = useState<FacultyStudent | null>(null);

    const load = async (showSuccessToast = false) => {
        setLoading(true);
        setError(null);
        try {
            const activeYear = await getActiveAcademicYear();
            setYear(activeYear);
            const [roster, scope] = await Promise.all([
                getMyStudents({ academicYearId: activeYear.id }),
                getFacultyReportScope(activeYear.id, "my-class-strength"),
            ]);
            setStudents(roster);
            setFacultyScope(scope);
            if (showSuccessToast) toast.success("Student roster refreshed successfully.");
        } catch (err: any) {
            const message = err?.response?.data?.message || err?.response?.data?.error || err?.message || "Unable to load your students. Please try again.";
            setError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => { void load(); }, []);

    const grades = useMemo(() => [...new Map(facultyScope.map(item => [item.gradeId, { id: item.gradeId, name: item.gradeName }])).values()].sort((a, b) => a.name.localeCompare(b.name)), [facultyScope]);
    const sections = useMemo(() => [...new Map(facultyScope.filter(item => !gradeId || String(item.gradeId) === gradeId).map(item => [item.sectionId, { id: item.sectionId, name: item.sectionName }])).values()].sort((a, b) => a.name.localeCompare(b.name)), [facultyScope, gradeId]);
    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        return students.filter(s =>
            (!gradeId || String(s.gradeId) === gradeId) &&
            (!sectionId || String(s.sectionId) === sectionId) &&
            (!term || [s.fullName, s.email, s.phoneNumber ?? "", s.gradeName, s.sectionName, String(s.studentId)].some(v => v.toLowerCase().includes(term)))
        );
    }, [students, search, gradeId, sectionId]);

    const clearFilters = () => { setSearch(""); setGradeId(""); setSectionId(""); };
    const hasFilters = Boolean(search.trim() || gradeId || sectionId);

    return <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
                <h1 className="text-4xl font-bold text-slate-800">My Students</h1>
                <p className="mt-1 text-slate-500">Students enrolled in the Grades assigned to you</p>
            </div>
            <button type="button" onClick={() => void load(true)} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60">
                <RefreshCw size={16} className={loading ? "animate-spin" : ""}/>{loading ? "Refreshing..." : "Refresh"}
            </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Current Academic Year</p>
            <p className="mt-1 text-lg font-semibold text-slate-800">{year?.name ?? "No active academic year"}</p>
        </div>

        <div className="relative w-full">
            <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search students by name, email, phone, grade or section..." className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-11 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20"/>
            {search && <button type="button" onClick={() => setSearch("")} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"><X size={17}/></button>}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-end gap-3">
                <div className="min-w-[160px] flex-1">
                    <label className="mb-1.5 block text-xs font-medium text-slate-500" htmlFor="faculty-student-grade">Grade</label>
                    <select id="faculty-student-grade" value={gradeId} onChange={e => { setGradeId(e.target.value); setSectionId(""); }} className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20">
                        <option value="">All Grades</option>{grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                </div>
                <div className="min-w-[160px] flex-1">
                    <label className="mb-1.5 block text-xs font-medium text-slate-500" htmlFor="faculty-student-section">Section</label>
                    <select id="faculty-student-section" value={sectionId} onChange={e => setSectionId(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20">
                        <option value="">All Sections</option>{sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
                {hasFilters && <button type="button" onClick={clearFilters} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-800">Clear Filters</button>}
            </div>
        </div>

        {loading ? <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft text-brand"><RefreshCw size={22} className="animate-spin"/></div><p className="mt-4 text-sm font-medium text-slate-700">Loading students...</p><p className="mt-1 text-xs text-slate-400">Please wait while we fetch your student records.</p></div></div>
        : error ? <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-red-200 bg-red-50 px-6 shadow-sm"><div className="max-w-md text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-500"><AlertCircle size={24}/></div><h2 className="mt-4 text-base font-semibold text-slate-800">Unable to load students</h2><p className="mt-2 text-sm leading-6 text-red-600">{error}</p><button type="button" onClick={() => void load()} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-brand-hover"><RefreshCw size={16}/>Try Again</button></div></div>
        : <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-4"><div><h2 className="font-semibold text-slate-800">Students</h2><p className="mt-1 text-sm text-slate-500">{filtered.length} student{filtered.length === 1 ? "" : "s"} found</p></div></div>
            {filtered.length === 0 ? <div className="px-6 py-14 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">{hasFilters ? <SearchX size={25}/> : <Users size={25}/>}</div><p className="mt-4 text-sm font-medium text-slate-700">{students.length === 0 ? "No students available" : "No students found"}</p><p className="mt-1 text-sm text-slate-400">{students.length === 0 ? "There are currently no active enrollments in your assigned Grades." : "Try changing your search or filters."}</p>{hasFilters && <button type="button" onClick={clearFilters} className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50">Clear Search & Filters</button>}</div>
            : <div className="overflow-x-auto"><table className="w-full min-w-[1000px] text-left">
                <thead className="border-b border-slate-200 bg-slate-50"><tr>
                    {["Student","Email","Phone","Grade","Section","Status"].map(h => <th key={h} className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{h}</th>)}
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
                </tr></thead>
                <tbody>{filtered.map(s => <tr key={s.studentId} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50">
                    <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-semibold text-brand">{initials(s.fullName)}</div><div className="min-w-0"><p className="truncate font-medium text-slate-800">{s.fullName}</p><p className="mt-0.5 text-xs text-slate-400">ID: {s.studentId}</p></div></div></td>
                    <td className="px-6 py-4"><p className="max-w-[240px] truncate text-sm text-slate-600">{s.email || "—"}</p></td>
                    <td className="px-6 py-4"><p className="text-sm text-slate-600">{s.phoneNumber ? `${s.countryCode ?? ""} ${s.phoneNumber}`.trim() : "—"}</p></td>
                    <td className="px-6 py-4"><p className="text-sm font-medium text-slate-700">{s.gradeName || "—"}</p></td>
                    <td className="px-6 py-4"><p className="text-sm text-slate-600">{s.sectionName || "—"}</p></td>
                    <td className="px-6 py-4"><span className="inline-flex rounded-full bg-brand-soft px-3 py-1 text-xs font-medium text-brand">Enrolled</span></td>
                    <td className="px-6 py-4 text-right"><div className="relative inline-block"><button type="button" aria-label={`Actions for ${s.fullName}`} onClick={() => setActionStudent(current => current === s.studentId ? null : s.studentId)} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"><MoreVertical size={18}/></button>{actionStudent === s.studentId && <><button aria-label="Close actions menu" className="fixed inset-0 z-10 cursor-default" onClick={() => setActionStudent(null)}/><div className="absolute right-0 z-20 mt-1 w-44 rounded-xl border border-slate-200 bg-white py-1 text-left shadow-lg"><button type="button" onClick={() => {setDetailsStudent(s); setActionStudent(null);}} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"><Eye size={16}/>View Details</button></div></>}</div></td>
                </tr>)}</tbody>
            </table></div>}
        </div>}

        {detailsStudent && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" onMouseDown={e => {if(e.target === e.currentTarget) setDetailsStudent(null);}}>
            <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl">
                <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5"><div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft text-base font-semibold text-brand">{initials(detailsStudent.fullName)}</div><div><h2 className="font-semibold text-slate-800">{detailsStudent.fullName}</h2><p className="text-xs text-slate-400">Student ID: {detailsStudent.studentId}</p></div></div><button type="button" onClick={() => setDetailsStudent(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"><X size={18}/></button></div>
                <div className="space-y-4 px-6 py-5"><div className="flex items-center gap-3 text-sm text-slate-600"><Mail size={17} className="text-slate-400"/><span>{detailsStudent.email || "No email available"}</span></div><div className="flex items-center gap-3 text-sm text-slate-600"><Phone size={17} className="text-slate-400"/><span>{detailsStudent.phoneNumber ? `${detailsStudent.countryCode ?? ""} ${detailsStudent.phoneNumber}`.trim() : "No phone available"}</span></div><div className="flex items-center gap-3 text-sm text-slate-600"><GraduationCap size={17} className="text-slate-400"/><span>{detailsStudent.gradeName} · Section {detailsStudent.sectionName}</span></div><div className="flex items-center gap-3 text-sm"><span className="inline-flex rounded-full bg-brand-soft px-3 py-1 text-xs font-medium text-brand">Active Enrollment</span></div></div>
                <div className="flex justify-end border-t border-slate-200 px-6 py-4"><button type="button" onClick={() => setDetailsStudent(null)} className="rounded-xl bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-hover">Close</button></div>
            </div>
        </div>}
        <ContextualReportButton report="my-class-strength" position="higher"/>
    </div>;
}
