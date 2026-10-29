import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { ArrowLeft, BookOpen, CheckCircle2, Clock3, Download, Eye, FileUp, Send } from "lucide-react";
import { getMyStudentSubjects, type StudentSubject } from "../../courses/services/subjectService";
import {
    downloadAssignmentAttachment,
    downloadSubmissionAttachment,
    getStudentAssignmentSubmissions,
    getStudentAssignments,
    submitAssignment,
    viewAssignmentAttachment,
    viewSubmissionAttachment,
} from "../services/assignmentService";
import type { Assignment, AssignmentSubmission } from "../types/assignment";

export default function StudentAssignmentsPage() {
    const [subjects, setSubjects] = useState<StudentSubject[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
    const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
    const [responses, setResponses] = useState<Record<number, string>>({});
    const [files, setFiles] = useState<Record<number, File | null>>({});
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState<number | null>(null);

    const refresh = async () => {
        setLoading(true);
        try {
            const [subjectRows, assignmentRows, submissionRows] = await Promise.all([
                getMyStudentSubjects(),
                getStudentAssignments(),
                getStudentAssignmentSubmissions(),
            ]);
            setSubjects(subjectRows.filter((subject) => subject.active));
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
            toast.error(error?.response?.data?.message ?? "Could not load your subjects and assignments.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { void refresh(); }, []);

    const selectedSubject = subjects.find((subject) => subject.id === selectedSubjectId) ?? null;
    const subjectAssignments = useMemo(
        () => assignments.filter((assignment) => assignment.subjectId === selectedSubjectId),
        [assignments, selectedSubjectId],
    );
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
        if (file && file.size > 25 * 1024 * 1024) {
            toast.error("Your attachment must be 25 MB or smaller.");
            return;
        }
        setSavingId(assignment.id);
        try {
            await submitAssignment(assignment.id, { responseText }, file);
            setFiles((old) => ({ ...old, [assignment.id]: null }));
            toast.success("Your submission has been saved successfully.");
            setSelectedId(null);
            await refresh();
        } catch (error: any) {
            toast.error(error?.response?.data?.message ?? "Could not submit your work. Please check your response and try again.");
            await refresh();
        } finally {
            setSavingId(null);
        }
    };

    return (
        <div className="mx-auto max-w-6xl space-y-6">
            <header className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">My Assignments</h1>
                    <p className="mt-1 text-sm text-slate-500">Choose a subject to see your work, deadlines, submissions, and feedback.</p>
                </div>
                {selectedSubject && <button type="button" onClick={() => { setSelectedSubjectId(null); setSelectedId(null); }} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"><ArrowLeft size={16} /> All subjects</button>}
            </header>

            {!selectedSubject && <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs font-medium text-slate-500">Enrolled subjects</p><p className="mt-1 text-2xl font-bold text-slate-800">{subjects.length}</p></div>
                    <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs font-medium text-slate-500">Pending work</p><p className="mt-1 text-2xl font-bold text-amber-700">{assignments.filter((item) => !submissionByAssignment.get(item.id)?.submittedAt).length}</p></div>
                    <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs font-medium text-slate-500">Graded</p><p className="mt-1 text-2xl font-bold text-emerald-700">{submissions.filter((item) => item.gradedAt).length}</p></div>
                </div>
                {loading ? <div className="rounded-2xl bg-white p-10 text-center text-sm text-slate-500">Loading your subjects…</div>
                    : subjects.length === 0 ? <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center"><BookOpen className="mx-auto text-slate-300" size={34} /><h2 className="mt-3 font-semibold text-slate-800">No enrolled subjects found</h2><p className="mt-1 text-sm text-slate-500">Your active enrolled subjects will appear here once your enrollment is set up.</p></div>
                    : <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {subjects.map((subject) => {
                            const count = assignments.filter((assignment) => assignment.subjectId === subject.id).length;
                            const pending = assignments.filter((assignment) => assignment.subjectId === subject.id && !submissionByAssignment.get(assignment.id)?.submittedAt).length;
                            return <button key={subject.id} type="button" onClick={() => setSelectedSubjectId(subject.id)} className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-200">
                                <div className="flex items-start justify-between gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><BookOpen size={22} /></span><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{count} {count === 1 ? "assignment" : "assignments"}</span></div>
                                <h2 className="mt-4 text-lg font-semibold text-slate-800">{subject.name}</h2>
                                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-indigo-600">{subject.code}</p>
                                <p className="mt-3 text-sm text-slate-500">Faculty: {subject.faculty?.fullName ?? "Not assigned yet"}</p>
                                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3"><span className={pending ? "text-sm font-medium text-amber-700" : "text-sm font-medium text-emerald-700"}>{pending ? `${pending} pending` : "No pending work"}</span><span className="text-sm font-semibold text-indigo-600">View assignments →</span></div>
                            </button>;
                        })}
                    </section>}
            </>}

            {selectedSubject && <section className="space-y-4">
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">{selectedSubject.code}</p>
                    <h2 className="mt-1 text-2xl font-bold text-slate-800">{selectedSubject.name}</h2>
                    <p className="mt-1 text-sm text-slate-600">Faculty: {selectedSubject.faculty?.fullName ?? "Not assigned yet"}</p>
                </div>
                {loading ? <div className="rounded-2xl bg-white p-10 text-center text-sm text-slate-500">Loading assignments…</div>
                    : subjectAssignments.length === 0 ? <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center"><CheckCircle2 className="mx-auto text-slate-300" size={36} /><h3 className="mt-3 font-semibold text-slate-800">No assignments have been posted yet</h3><p className="mt-1 text-sm text-slate-500">When your faculty publishes an assignment for this subject, it will appear here.</p></div>
                    : <div className="space-y-4">
                        {subjectAssignments.map((assignment) => {
                            const submission = submissionByAssignment.get(assignment.id);
                            const isPastDue = new Date(assignment.dueAt).getTime() < Date.now();
                            const resubmissionClosed = Boolean(submission?.submittedAt && isPastDue);
                            const isOpen = selectedId === assignment.id;
                            return <article key={assignment.id} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        <h3 className="text-lg font-semibold text-slate-800">{assignment.title}</h3>
                                        <p className="mt-1 text-sm text-slate-600">Grade {assignment.gradeName}, Section {assignment.sectionName} · {assignment.facultyName}</p>
                                        <p className={`mt-1 inline-flex items-center gap-1.5 text-sm ${isPastDue ? "text-amber-700" : "text-slate-500"}`}><Clock3 size={14} /> Due {new Date(assignment.dueAt).toLocaleString()}{isPastDue ? " · Past due" : ""}</p>
                                    </div>
                                    {submission?.gradedAt ? <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Graded</span> : submission?.submittedAt ? <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">Submitted</span> : <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">Pending submission</span>}
                                </div>
                                <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{assignment.instructions}</p>
                                {assignment.hasAttachment && <div className="flex flex-wrap gap-4"><button type="button" onClick={() => void viewAssignmentAttachment(assignment.id).catch((error: any) => toast.error(error?.message ?? "Could not preview the assignment attachment."))} className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800"><Eye size={15} /> View attachment</button><button type="button" onClick={() => void downloadAssignmentAttachment(assignment.id, assignment.attachmentName ?? "assignment-attachment").catch(() => toast.error("Could not download the assignment attachment."))} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600"><Download size={15} /> Download</button></div>}

                                {submission && <div className="space-y-2 rounded-xl bg-slate-50 p-4">
                                    <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-semibold text-slate-700">Your latest submission</p><p className="text-xs text-slate-500">{submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : "Not submitted yet"} {submission.late ? "· Late" : ""}</p></div>
                                    <p className="whitespace-pre-wrap text-sm text-slate-700">{submission.responseText || "No written response."}</p>
                                    {submission.hasAttachment && <div className="flex flex-wrap gap-4"><button type="button" onClick={() => void viewSubmissionAttachment(submission.id).catch((error: any) => toast.error(error?.message ?? "Could not preview your submitted file."))} className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600"><Eye size={14} /> View your attachment</button><button type="button" onClick={() => void downloadSubmissionAttachment(submission.id, submission.attachmentName ?? "my-submission").catch(() => toast.error("Could not download your submitted file."))} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600"><FileUp size={14} /> Download</button></div>}
                                    {submission.gradedAt && <div className="rounded-lg border border-emerald-100 bg-white p-3"><p className="font-semibold text-emerald-800">Marks: {submission.marks} / {submission.maxMarks}</p>{submission.feedback && <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">Feedback: {submission.feedback}</p>}</div>}
                                </div>}

                                {!resubmissionClosed && <div>
                                    <button type="button" onClick={() => setSelectedId(isOpen ? null : assignment.id)} className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">{submission?.submittedAt ? "Update submission" : "Submit assignment"}</button>
                                    {isOpen && <div className="mt-3 space-y-3 rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
                                        <label className="block space-y-1 text-sm font-semibold text-slate-700">Written response
                                            <textarea rows={5} maxLength={20000} value={responses[assignment.id] ?? ""} onChange={(event) => setResponses((old) => ({ ...old, [assignment.id]: event.target.value }))} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" placeholder="Type your answer here…" />
                                            <span className="block text-xs font-normal text-slate-500">You can write up to 20,000 characters. A file can be attached instead of a written response.</span>
                                        </label>
                                        <label className="block space-y-1 text-sm font-semibold text-slate-700">Attach your work (optional, maximum 25 MB)
                                            <input type="file" onChange={(event) => setFiles((old) => ({ ...old, [assignment.id]: event.target.files?.[0] ?? null }))} className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5" />
                                            <span className="block text-xs font-normal text-slate-500">Accepted file types depend on the file you upload; make sure your work is readable.</span>
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
            </section>}
        </div>
    );
}
