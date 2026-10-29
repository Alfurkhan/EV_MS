import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { ClipboardList, Download, Eye, RefreshCw, Search, X } from "lucide-react";
import {
    downloadAssignmentAttachment,
    getAdminAssignments,
    viewAssignmentAttachment,
} from "../services/assignmentService";
import type { Assignment } from "../types/assignment";

export default function AdminAssignmentsPage() {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [subjectFilter, setSubjectFilter] = useState("");
    const [gradeFilter, setGradeFilter] = useState("");
    const [sectionFilter, setSectionFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    const refresh = async () => {
        setLoading(true);
        try {
            setAssignments(await getAdminAssignments());
        } catch (error: any) {
            toast.error(error?.response?.data?.message ?? "Could not load assignment records.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { void refresh(); }, []);

    const subjects = useMemo(
        () => [...new Set(assignments.map((item) => item.subjectName))].sort((a, b) => a.localeCompare(b)),
        [assignments],
    );
    const grades = useMemo(
        () => [...new Set(assignments.map((item) => item.gradeName))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
        [assignments],
    );
    const sections = useMemo(
        () => [...new Set(assignments.filter((item) => !gradeFilter || item.gradeName === gradeFilter).map((item) => item.sectionName))].sort(),
        [assignments, gradeFilter],
    );

    const filteredAssignments = useMemo(() => {
        const query = search.trim().toLocaleLowerCase();
        return assignments.filter((item) => {
            const matchesSearch = !query || [
                item.title, item.instructions, item.subjectName, item.subjectCode,
                item.facultyName, item.gradeName, item.sectionName, item.academicYearName,
            ].some((value) => value?.toLocaleLowerCase().includes(query));
            return matchesSearch
                && (!subjectFilter || item.subjectName === subjectFilter)
                && (!gradeFilter || item.gradeName === gradeFilter)
                && (!sectionFilter || item.sectionName === sectionFilter)
                && (!statusFilter || item.status === statusFilter);
        });
    }, [assignments, search, subjectFilter, gradeFilter, sectionFilter, statusFilter]);

    const clearFilters = () => {
        setSearch("");
        setSubjectFilter("");
        setGradeFilter("");
        setSectionFilter("");
        setStatusFilter("");
    };

    const hasFilters = Boolean(search || subjectFilter || gradeFilter || sectionFilter || statusFilter);

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <header className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Assignment Oversight</h1>
                    <p className="mt-1 text-sm text-slate-500">Search and monitor assignment records, class targets, deadlines, and submissions across the school.</p>
                </div>
                <button type="button" onClick={() => void refresh()} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">
                    <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
                </button>
            </header>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs font-medium text-slate-500">Total assignments</p><p className="mt-1 text-2xl font-bold text-slate-800">{assignments.length}</p></div>
                <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs font-medium text-slate-500">Published</p><p className="mt-1 text-2xl font-bold text-emerald-700">{assignments.filter((item) => item.status === "PUBLISHED").length}</p></div>
                <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs font-medium text-slate-500">Drafts</p><p className="mt-1 text-2xl font-bold text-amber-700">{assignments.filter((item) => item.status === "DRAFT").length}</p></div>
            </div>

            <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2"><Search size={18} className="text-slate-500" /><h2 className="font-semibold text-slate-800">Find assignments</h2></div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <label className="space-y-1 text-xs font-semibold text-slate-600 xl:col-span-2">Search assignment, subject, or faculty
                        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="e.g. Mathematics, Chapter 3, or faculty name" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-normal outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" />
                    </label>
                    <label className="space-y-1 text-xs font-semibold text-slate-600">Subject
                        <select value={subjectFilter} onChange={(event) => setSubjectFilter(event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal">
                            <option value="">All subjects</option>{subjects.map((subject) => <option key={subject} value={subject}>{subject}</option>)}
                        </select>
                    </label>
                    <label className="space-y-1 text-xs font-semibold text-slate-600">Grade / class
                        <select value={gradeFilter} onChange={(event) => { setGradeFilter(event.target.value); setSectionFilter(""); }} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal">
                            <option value="">All classes</option>{grades.map((grade) => <option key={grade} value={grade}>Grade {grade}</option>)}
                        </select>
                    </label>
                    <label className="space-y-1 text-xs font-semibold text-slate-600">Section
                        <select value={sectionFilter} onChange={(event) => setSectionFilter(event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal">
                            <option value="">All sections</option>{sections.map((section) => <option key={section} value={section}>Section {section}</option>)}
                        </select>
                    </label>
                    <label className="space-y-1 text-xs font-semibold text-slate-600">Publication status
                        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal">
                            <option value="">All statuses</option><option value="PUBLISHED">Published</option><option value="DRAFT">Draft</option>
                        </select>
                    </label>
                    <div className="flex items-end justify-between gap-3">
                        <p className="pb-2 text-xs text-slate-500">Showing {filteredAssignments.length} of {assignments.length}</p>
                        {hasFilters && <button type="button" onClick={clearFilters} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"><X size={14} /> Clear filters</button>}
                    </div>
                </div>
            </section>

            {loading ? <div className="rounded-2xl bg-white p-10 text-center text-sm text-slate-500">Loading assignment records…</div>
                : filteredAssignments.length === 0 ? <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center"><ClipboardList className="mx-auto text-slate-300" size={32} /><h2 className="mt-3 font-semibold text-slate-800">{assignments.length ? "No matching assignments" : "No assignments recorded"}</h2><p className="mt-1 text-sm text-slate-500">{assignments.length ? "Try changing your search or clearing one or more filters." : "Faculty assignment records will appear here."}</p>{hasFilters && <button type="button" onClick={clearFilters} className="mt-4 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Clear filters</button>}</div>
                : <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="overflow-x-auto"><table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Assignment</th><th className="px-4 py-3">Faculty</th><th className="px-4 py-3">Class / Subject</th><th className="px-4 py-3">Due</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Submissions</th></tr></thead>
                        <tbody className="divide-y divide-slate-100">{filteredAssignments.map((assignment) => <tr key={assignment.id} className="align-top hover:bg-slate-50/70">
                            <td className="px-4 py-4"><p className="font-semibold text-slate-800">{assignment.title}</p><p className="mt-1 line-clamp-2 max-w-xs text-xs text-slate-500">{assignment.instructions}</p>{assignment.hasAttachment && <div className="mt-2 flex flex-wrap gap-3"><button type="button" onClick={() => void viewAssignmentAttachment(assignment.id).catch((error: any) => toast.error(error?.message ?? "Could not preview attachment."))} className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600"><Eye size={13} /> View</button><button type="button" onClick={() => void downloadAssignmentAttachment(assignment.id, assignment.attachmentName ?? "assignment-attachment").catch(() => toast.error("Could not download attachment."))} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600"><Download size={13} /> Download</button></div>}</td>
                            <td className="px-4 py-4 text-slate-700">{assignment.facultyName}</td>
                            <td className="px-4 py-4 text-slate-700">{assignment.subjectName}<p className="mt-1 text-xs text-slate-500">Grade {assignment.gradeName}, Section {assignment.sectionName}</p><p className="text-xs text-slate-500">{assignment.academicYearName}</p></td>
                            <td className="whitespace-nowrap px-4 py-4 text-slate-600">{new Date(assignment.dueAt).toLocaleString()}</td>
                            <td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${assignment.status === "PUBLISHED" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{assignment.status}</span></td>
                            <td className="px-4 py-4 font-semibold tabular-nums text-slate-700">{assignment.submissionCount}</td>
                        </tr>)}</tbody>
                    </table></div>
                </div>}
        </div>
    );
}
