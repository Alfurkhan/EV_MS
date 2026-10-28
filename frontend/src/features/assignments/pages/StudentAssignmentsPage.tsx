import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { CheckCircle2, Clock3, Download, FileUp, Send } from "lucide-react";
import {
    downloadAssignmentAttachment,
    downloadSubmissionAttachment,
    getStudentAssignmentSubmissions,
    getStudentAssignments,
    submitAssignment,
} from "../services/assignmentService";
import type { Assignment, AssignmentSubmission } from "../types/assignment";

export default function StudentAssignmentsPage() {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [responses, setResponses] = useState<Record<number, string>>({});
    const [files, setFiles] = useState<Record<number, File | null>>({});
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState<number | null>(null);

    const refresh = async () => {
        setLoading(true);
        try {
            const [assignmentRows, submissionRows] = await Promise.all([
                getStudentAssignments(),
                getStudentAssignmentSubmissions(),
            ]);
            setAssignments(assignmentRows);
            setSubmissions(submissionRows);
            setResponses((old) => {
                const next = { ...old };
                submissionRows.forEach((row) => {
                    if (next[row.assignmentId] === undefined) next[row.assignmentId] = row.responseText ?? "";
                });
                return next;
            });
        } catch (error: any) {
            toast.error(error?.response?.data?.message ?? "Could not load your assignments.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { void refresh(); }, []);

    const submissionByAssignment = useMemo(
        () => new Map(submissions.map((submission) => [submission.assignmentId, submission])),
        [submissions],
    );

    const submitWork = async (assignment: Assignment) => {
        const responseText = responses[assignment.id] ?? "";
        const file = files[assignment.id] ?? null;
        if (!responseText.trim() && !file) {
            toast.error("Write a response or attach a file before submitting.");
            return;
        }
        setSavingId(assignment.id);
        try {
            await submitAssignment(assignment.id, { responseText }, file);
            setFiles((old) => ({ ...old, [assignment.id]: null }));
            toast.success("Your latest submission has been saved.");
            setSelectedId(null);
            await refresh();
        } catch (error: any) {
            toast.error(error?.response?.data?.message ?? "Could not submit your work. Your written response may have saved before the attachment failed.");
            await refresh();
        } finally {
            setSavingId(null);
        }
    };

    return (
        <div className="mx-auto max-w-5xl space-y-6">
            <header>
                <h1 className="text-3xl font-bold text-slate-800">Assignments</h1>
                <p className="mt-1 text-sm text-slate-500">View work published for your enrolled classes, submit your answers, and check marks and feedback.</p>
            </header>

            <div className="flex flex-wrap gap-3">
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3"><p className="text-xs font-medium text-slate-500">Available</p><p className="text-xl font-bold text-slate-800">{assignments.length}</p></div>
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3"><p className="text-xs font-medium text-slate-500">Submitted</p><p className="text-xl font-bold text-slate-800">{submissions.filter((item) => item.submittedAt).length}</p></div>
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3"><p className="text-xs font-medium text-slate-500">Graded</p><p className="text-xl font-bold text-slate-800">{submissions.filter((item) => item.gradedAt).length}</p></div>
            </div>

            {loading ? <div className="rounded-2xl bg-white p-10 text-center text-sm text-slate-500">Loading assignments…</div> : assignments.length === 0 ? <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center"><CheckCircle2 className="mx-auto text-slate-300" size={32} /><h2 className="mt-3 font-semibold text-slate-800">You’re all caught up</h2><p className="mt-1 text-sm text-slate-500">No assignments have been published for your enrolled classes yet.</p></div> : <div className="space-y-4">
                {assignments.map((assignment) => {
                    const submission = submissionByAssignment.get(assignment.id);
                    const isPastDue = new Date(assignment.dueAt).getTime() < Date.now();
                    const resubmissionClosed = Boolean(submission?.submittedAt && isPastDue);
                    const isOpen = selectedId === assignment.id;
                    return <article key={assignment.id} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                                <h2 className="text-lg font-semibold text-slate-800">{assignment.title}</h2>
                                <p className="mt-1 text-sm text-slate-600">{assignment.subjectName} · Grade {assignment.gradeName}, Section {assignment.sectionName} · {assignment.facultyName}</p>
                                <p className={`mt-1 inline-flex items-center gap-1.5 text-sm ${isPastDue ? "text-amber-700" : "text-slate-500"}`}><Clock3 size={14} /> Due {new Date(assignment.dueAt).toLocaleString()}{isPastDue ? " · Past due" : ""}</p>
                            </div>
                            {submission?.gradedAt ? <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Graded</span> : submission?.submittedAt ? <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">Submitted</span> : <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">Not submitted</span>}
                        </div>
                        <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{assignment.instructions}</p>
                        {assignment.hasAttachment && <button type="button" onClick={() => void downloadAssignmentAttachment(assignment.id, assignment.attachmentName ?? "assignment-attachment").catch(() => toast.error("Could not download the assignment attachment."))} className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800"><Download size={15} /> Download {assignment.attachmentName ?? "assignment attachment"}</button>}

                        {submission && <div className="space-y-2 rounded-xl bg-slate-50 p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-semibold text-slate-700">Your latest submission</p><p className="text-xs text-slate-500">{submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : "Not submitted yet"} {submission.late ? "· Late" : ""}</p></div>
                            <p className="whitespace-pre-wrap text-sm text-slate-700">{submission.responseText || "No written response."}</p>
                            {submission.hasAttachment && <button type="button" onClick={() => void downloadSubmissionAttachment(submission.id, submission.attachmentName ?? "my-submission").catch(() => toast.error("Could not download your submitted file."))} className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600"><FileUp size={14} /> Download your attachment</button>}
                            {submission.gradedAt && <div className="rounded-lg border border-emerald-100 bg-white p-3"><p className="font-semibold text-emerald-800">Marks: {submission.marks} / {submission.maxMarks}</p>{submission.feedback && <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">Feedback: {submission.feedback}</p>}</div>}
                        </div>}

                        {!resubmissionClosed && <div>
                            <button type="button" onClick={() => setSelectedId(isOpen ? null : assignment.id)} className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">{submission?.submittedAt ? "Update submission" : "Submit assignment"}</button>
                            {isOpen && <div className="mt-3 space-y-3 rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
                                <label className="block space-y-1 text-sm font-semibold text-slate-700">Written response
                                    <textarea rows={5} maxLength={20000} value={responses[assignment.id] ?? ""} onChange={(e) => setResponses((old) => ({ ...old, [assignment.id]: e.target.value }))} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" placeholder="Type your answer here…" />
                                </label>
                                <label className="block space-y-1 text-sm font-semibold text-slate-700">Attach your work (optional, maximum 25 MB)
                                    <input type="file" onChange={(e) => setFiles((old) => ({ ...old, [assignment.id]: e.target.files?.[0] ?? null }))} className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5" />
                                </label>
                                {isPastDue && !submission?.submittedAt && <p className="text-xs font-medium text-amber-700">This will be recorded as a late submission.</p>}
                                <div className="flex flex-wrap gap-2"><button type="button" disabled={savingId === assignment.id} onClick={() => void submitWork(assignment)} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"><Send size={15} /> {savingId === assignment.id ? "Submitting…" : "Save submission"}</button><button type="button" onClick={() => setSelectedId(null)} className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700">Cancel</button></div>
                                <p className="text-xs text-slate-500">You can update your latest submission until the due date and time. After that, the existing submission is locked.</p>
                            </div>}
                        </div>}
                        {resubmissionClosed && <p className="text-sm font-medium text-slate-500">Submission is locked because the deadline has passed.</p>}
                    </article>;
                })}
            </div>}
        </div>
    );
}
