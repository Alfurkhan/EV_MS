import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Search, Users, Filter, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import { getActiveAcademicYear, type AcademicYear } from "../../academic/services/academicYearService";
import { getMyStudents, type FacultyStudent } from "../services/myStudentsService";
import ContextualReportButton from "../../reports/components/ContextualReportButton";

export default function MyStudentsPage() {
    const [year, setYear] = useState<AcademicYear | null>(null);
    const [students, setStudents] = useState<FacultyStudent[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [grade, setGrade] = useState("ALL");
    const [section, setSection] = useState("ALL");
    const [filtersOpen, setFiltersOpen] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const activeYear = await getActiveAcademicYear();
            setYear(activeYear);
            setStudents(await getMyStudents({ academicYearId: activeYear.id }));
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Unable to load your students.");
        } finally { setLoading(false); }
    };
    useEffect(() => { void load(); }, []);

    const grades = useMemo(() => [...new Map(students.map(s => [s.gradeId, {id:s.gradeId,name:s.gradeName}])).values()].sort((a,b)=>a.name.localeCompare(b.name)), [students]);
    const sections = useMemo(() => [...new Set(students.filter(s => grade === "ALL" || String(s.gradeId) === grade).map(s=>s.sectionName))].sort(), [students, grade]);
    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        return students.filter(s =>
            (grade === "ALL" || String(s.gradeId) === grade) &&
            (section === "ALL" || s.sectionName === section) &&
            (!term || [s.fullName,s.email,s.phoneNumber ?? "",s.gradeName,s.sectionName].some(v=>v.toLowerCase().includes(term)))
        );
    }, [students, search, grade, section]);

    const clearFilters = () => { setSearch(""); setGrade("ALL"); setSection("ALL"); };
    return <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h1 className="text-2xl font-bold text-slate-900">My Students</h1><p className="mt-1 text-sm text-slate-500">Students enrolled in the Grades assigned to you.</p></div>
            <button onClick={load} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-60"><RefreshCw size={16} className={loading?"animate-spin":""}/> Refresh</button>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border bg-white p-4"><p className="text-xs font-medium text-slate-500">Academic Year</p><p className="mt-1 font-semibold">{year?.name ?? "—"}</p></div>
            <div className="rounded-xl border bg-white p-4"><p className="text-xs font-medium text-slate-500">Grades Assigned</p><p className="mt-1 font-semibold">{grades.length}</p><p className="text-xs text-slate-500">{grades.map(g=>g.name).join(", ") || "—"}</p></div>
            <div className="rounded-xl border bg-white p-4"><p className="text-xs font-medium text-slate-500">Students</p><p className="mt-1 font-semibold">{students.length}</p></div>
        </div>
        <div className="rounded-xl border bg-white p-4 space-y-3">
            <div className="flex flex-wrap gap-2">
                <div className="relative min-w-[220px] flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, email, phone…" className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-brand"/></div>
                <button onClick={()=>setFiltersOpen(v=>!v)} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"><Filter size={16}/> Filters <ChevronDown size={16} className={filtersOpen?"rotate-180":""}/></button>
                {(search || grade!=="ALL" || section!=="ALL") && <button onClick={clearFilters} className="px-3 py-2 text-sm text-brand">Clear</button>}
            </div>
            {filtersOpen && <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm text-slate-600">Grade<select value={grade} onChange={e=>{setGrade(e.target.value);setSection("ALL");}} className="mt-1 block w-full rounded-lg border px-3 py-2"><option value="ALL">All authorized Grades</option>{grades.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</select></label>
                <label className="text-sm text-slate-600">Section<select value={section} onChange={e=>setSection(e.target.value)} className="mt-1 block w-full rounded-lg border px-3 py-2"><option value="ALL">All Sections</option>{sections.map(s=><option key={s}>{s}</option>)}</select></label>
            </div>}
        </div>
        <div className="overflow-hidden rounded-xl border bg-white">
            {loading ? <div className="py-14 text-center text-sm text-slate-500"><RefreshCw className="mx-auto mb-2 animate-spin"/>Loading students…</div> : filtered.length===0 ? <div className="py-14 text-center"><Users className="mx-auto mb-2 text-slate-400"/><p className="font-medium text-slate-700">{students.length===0?"No students in your assigned Grades":"No students match your filters"}</p><p className="mt-1 text-sm text-slate-500">{students.length===0?"Students will appear when active enrollments exist for your authorized Grades.":"Try clearing the filters or search."}</p></div> :
            <div className="overflow-x-auto"><table className="min-w-full divide-y"><thead className="bg-slate-50"><tr>{["Student","Contact","Grade","Section","Enrollment"].map(h=><th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">{h}</th>)}</tr></thead><tbody className="divide-y">{filtered.map(s=><tr key={s.studentId} className="hover:bg-slate-50"><td className="px-4 py-3"><div className="font-medium text-slate-800">{s.fullName}</div><div className="text-xs text-slate-500">{s.email}</div></td><td className="px-4 py-3 text-sm text-slate-600">{[s.countryCode,s.phoneNumber].filter(Boolean).join(" ")||"—"}</td><td className="px-4 py-3 text-sm">{s.gradeName}</td><td className="px-4 py-3 text-sm">{s.sectionName}</td><td className="px-4 py-3"><span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">Active</span></td></tr>)}</tbody></table></div>}
        </div>
        {!loading && students.length>0 && <p className="text-sm text-slate-500">Showing {filtered.length} of {students.length} students.</p>}
        <ContextualReportButton report="my-class-strength" position="higher"/>
    </div>;
}
