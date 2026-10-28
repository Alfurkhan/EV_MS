import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ClipboardList, Download, RefreshCw } from "lucide-react";
import { downloadAssignmentAttachment, getAdminAssignments } from "../services/assignmentService";
import type { Assignment } from "../types/assignment";

export default function AdminAssignmentsPage() {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);

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

    return (
        <div className="mx-auto max-w-6xl space-y-6">
            <header className="flex flex-wrap items-center justify-between gap-3">
                <div><h1 className="text-3xl font-bold text-slate-800">Assignment Oversight</h1><p className="mt-1 text-sm text-slate-500">Review assignment records, publication status, deadlines, and submission counts across the school.</p></div>
                <button type="button" onClick={() => void refresh()} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"><RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh</button>
            </header>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs font-medium text-slate-500">Total assignments</p><p className="mt-1 text-2xl font-bold text-slate-800">{assignments.length}</p></div>
                <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs font-medium text-slate-500">Published</p><p className="mt-1 text-2xl font-bold text-emerald-700">{assignments.filter((item) => item.status === "PUBLISHED").length}</p></div>
                <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs font-medium text-slate-500">Drafts</p><p className="mt-1 text-2xl font-bold text-amber-700">{assignments.filter((item) => item.status === "DRAFT").length}</p></div>
            </div>
            {loading ? <div className="rounded-2xl bg-white p-10 text-center text-sm text-slate-500">Loading assignment records…</div> : assignments.length === 0 ? <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center"><ClipboardList className="mx-auto text-slate-300" size={32} /><h2 className="mt-3 font-semibold text-slate-800">No assignments recorded</h2><p className="mt-1 text-sm text-slate-500">Faculty assignment records will appear here.</p></div> : <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto"><table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Assignment</th><th className="px-4 py-3">Faculty</th><th className="px-4 py-3">Class / Subject</th><th className="px-4 py-3">Due</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Submissions</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">{assignments.map((assignment) => <tr key={assignment.id} className="align-top hover:bg-slate-50/70">
                        <td className="px-4 py-4"><p className="font-semibold text-slate-800">{assignment.title}</p><p className="mt-1 line-clamp-2 max-w-xs text-xs text-slate-500">{assignment.instructions}</p>{assignment.hasAttachment && <button type="button" onClick={() => void downloadAssignmentAttachment(assignment.id, assignment.attachmentName ?? "assignment-attachment").catch(() => toast.error("Could not download attachment."))} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600"><Download size={13} /> {assignment.attachmentName ?? "Attachment"}</button>}</td>
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
