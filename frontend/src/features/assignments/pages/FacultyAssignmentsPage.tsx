import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import toast from "react-hot-toast";
import { BookOpenCheck, ClipboardList, Download, FileUp, RefreshCw, Save, Send, Trash2 } from "lucide-react";
import { getAcademicYears, type AcademicYear } from "../../academic/services/academicYearService";
import { getGradesByAcademicYear, type Grade } from "../../academic/services/gradeService";
import { getSectionsByGrade, type Section } from "../../academic/services/sectionService";
import { getMySubjects, type Subject } from "../../courses/services/subjectService";
import {
    createAssignmentDraft,
    deleteAssignmentDraft,
    downloadAssignmentAttachment,
    downloadSubmissionAttachment,
    getAssignmentSubmissions,
    getFacultyAssignments,
    gradeAssignmentSubmission,
    publishAssignment,
    updateAssignmentDraft,
    uploadAssignmentAttachment,
} from "../services/assignmentService";
import type { Assignment, AssignmentRequest, AssignmentSubmission } from "../types/assignment";

const blankForm: AssignmentRequest = {
    title: "",
    instructions: "",
    academicYearId: 0,
    gradeId: 0,
    sectionId: 0,
    subjectId: 0,
    dueAt: "",
};

export default function FacultyAssignmentsPage() {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
    const [grades, setGrades] = useState<Grade[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [form, setForm] = useState<AssignmentRequest>(blankForm);
    const [file, setFile] = useState<File | null>(null);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
    const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
    const [gradeValues, setGradeValues] = useState<Record<number, { marks: string; maxMarks: string; feedback: string }>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const refresh = async () => {
        setLoading(true);
        try {
            setAssignments(await getFacultyAssignments());
        } catch (error: any) {
            toast.error(error?.response?.data?.message ?? "Could not load assignments.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void refresh();
        Promise.all([getAcademicYears(), getMySubjects()])
            .then(([years, subjectList]) => {
                setAcademicYears(years.filter((year) => year.active));
                setSubjects(subjectList.filter((subject) => subject.active));
            })
            .catch(() => toast.error("Could not load academic years or assigned subjects."));
    }, []);

    const chooseYear = async (value: string) => {
        const id = Number(value);
        setForm((old) => ({ ...old, academicYearId: id, gradeId: 0, sectionId: 0 }));
        setGrades([]);
        setSections([]);
        if (!id) return;
        try {
            setGrades((await getGradesByAcademicYear(id)).filter((grade) => grade.active));
        } catch {
            toast.error("Could not load grades.");
        }
    };

    const chooseGrade = async (value: string) => {
        const id = Number(value);
        setForm((old) => ({ ...old, gradeId: id, sectionId: 0 }));
        setSections([]);
        if (!id) return;
        try {
            setSections((await getSectionsByGrade(id)).filter((section) => section.active));
        } catch {
            toast.error("Could not load sections.");
        }
    };

    const resetForm = () => {
        setForm(blankForm);
        setFile(null);
        setEditingId(null);
        setGrades([]);
        setSections([]);
    };

    const saveDraft = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSaving(true);
        try {
            let saved: Assignment;
            if (editingId === null) {
                saved = await createAssignmentDraft(form);
            } else {
                saved = await updateAssignmentDraft(editingId, form);
            }
            if (file) {
                saved = await uploadAssignmentAttachment(saved.id, file);
            }
            toast.success(editingId === null ? "Assignment draft saved." : "Assignment draft updated.");
            resetForm();
            await refresh();
        } catch (error: any) {
            toast.error(error?.response?.data?.message ?? "Could not save the assignment. Check that the class is assigned to you in an approved timetable.");
        } finally {
            setSaving(false);
        }
    };

    const edit = async (assignment: Assignment) => {
        setEditingId(assignment.id);
        setSelectedAssignment(null);
        setForm({
            title: assignment.title,
            instructions: assignment.instructions,
            academicYearId: assignment.academicYearId,
            gradeId: assignment.gradeId,
            sectionId: assignment.sectionId,
            subjectId: assignment.subjectId,
            dueAt: assignment.dueAt.slice(0, 16),
        });
        setFile(null);
        try {
            setGrades((await getGradesByAcademicYear(assignment.academicYearId)).filter((grade) => grade.active));
            setSections((await getSectionsByGrade(assignment.gradeId)).filter((section) => section.active));
        } catch {
            toast.error("Assignment loaded, but grade or section options could not be refreshed.");
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const publish = async (assignment: Assignment) => {
        try {
            await publishAssignment(assignment.id);
            toast.success("Assignment published to the enrolled students.");
            await refresh();
        } catch (error: any) {
            toast.error(error?.response?.data?.message ?? "Could not publish this assignment.");
        }
    };

    const remove = async (assignment: Assignment) => {
        if (!window.confirm(`Delete draft "${assignment.title}"?`)) return;
        try {
            await deleteAssignmentDraft(assignment.id);
            toast.success("Draft deleted.");
            await refresh();
        } catch (error: any) {
            toast.error(error?.response?.data?.message ?? "Could not delete this draft.");
        }
    };

    const openSubmissions = async (assignment: Assignment) => {
        setSelectedAssignment(assignment);
        try {
            const rows = await getAssignmentSubmissions(assignment.id);
            setSubmissions(rows);
            setGradeValues(Object.fromEntries(rows.map((row) => [row.id, {
                marks: row.marks == null ? "" : String(row.marks),
                maxMarks: row.maxMarks == null ? "100" : String(row.maxMarks),
                feedback: row.feedback ?? "",
            }])));
        } catch (error: any) {
            toast.error(error?.response?.data?.message ?? "Could not load submissions.");
        }
    };

    const saveGrade = async (submission: AssignmentSubmission) => {
        const value = gradeValues[submission.id];
        const marks = Number(value?.marks);
        const maxMarks = Number(value?.maxMarks);
        if (!Number.isFinite(marks) || !Number.isFinite(maxMarks) || marks < 0 || maxMarks <= 0 || marks > maxMarks) {
            toast.error("Enter valid marks, with marks no greater than the maximum.");
            return;
        }
        try {
            await gradeAssignmentSubmission(submission.id, { marks, maxMarks, feedback: value.feedback });
            toast.success("Grade and feedback saved.");
            if (selectedAssignment) await openSubmissions(selectedAssignment);
            await refresh();
        } catch (error: any) {
            toast.error(error?.response?.data?.message ?? "Could not save the grade.");
        }
    };

    return (
        <div className="mx-auto max-w-6xl space-y-6">
            <header className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Assignments</h1>
                    <p className="mt-1 text-sm text-slate-500">Create drafts, publish work to your classes, and review student submissions.</p>
                </div>
                <button type="button" onClick={() => void refresh()} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">
                    <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
                </button>
            </header>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800"><Save size={18} /> {editingId ? "Edit assignment draft" : "Create assignment"}</h2>
                <form onSubmit={saveDraft} className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <label className="space-y-1 text-sm font-medium text-slate-700">Assignment title
                        <input required maxLength={200} className="w-full rounded-lg border border-slate-300 px-3 py-2 font-normal outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                    </label>
                    <label className="space-y-1 text-sm font-medium text-slate-700">Due date and time
                        <input required type="datetime-local" className="w-full rounded-lg border border-slate-300 px-3 py-2 font-normal outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" value={form.dueAt} onChange={(e) => setForm({ ...form, dueAt: e.target.value })} />
                    </label>
                    <label className="space-y-1 text-sm font-medium text-slate-700">Academic year
                        <select required className="w-full rounded-lg border border-slate-300 px-3 py-2 font-normal" value={form.academicYearId || ""} onChange={(e) => void chooseYear(e.target.value)}>
                            <option value="">Select academic year</option>{academicYears.map((year) => <option key={year.id} value={year.id}>{year.name}</option>)}
                        </select>
                    </label>
                    <label className="space-y-1 text-sm font-medium text-slate-700">Grade
                        <select required disabled={!form.academicYearId} className="w-full rounded-lg border border-slate-300 px-3 py-2 font-normal disabled:bg-slate-100" value={form.gradeId || ""} onChange={(e) => void chooseGrade(e.target.value)}>
                            <option value="">Select grade</option>{grades.map((grade) => <option key={grade.id} value={grade.id}>{grade.name}</option>)}
                        </select>
                    </label>
                    <label className="space-y-1 text-sm font-medium text-slate-700">Section
                        <select required disabled={!form.gradeId} className="w-full rounded-lg border border-slate-300 px-3 py-2 font-normal disabled:bg-slate-100" value={form.sectionId || ""} onChange={(e) => setForm({ ...form, sectionId: Number(e.target.value) })}>
                            <option value="">Select section</option>{sections.map((section) => <option key={section.id} value={section.id}>{section.name}</option>)}
                        </select>
                    </label>
                    <label className="space-y-1 text-sm font-medium text-slate-700">Assigned subject
                        <select required className="w-full rounded-lg border border-slate-300 px-3 py-2 font-normal" value={form.subjectId || ""} onChange={(e) => setForm({ ...form, subjectId: Number(e.target.value) })}>
                            <option value="">Select subject</option>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name} ({subject.code})</option>)}
                        </select>
                    </label>
                    <label className="space-y-1 text-sm font-medium text-slate-700 md:col-span-2">Instructions
                        <textarea required maxLength={20000} rows={4} className="w-full rounded-lg border border-slate-300 px-3 py-2 font-normal outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} placeholder="Explain the task, expected format, and submission requirements." />
                    </label>
                    <label className="space-y-1 text-sm font-medium text-slate-700 md:col-span-2">Attachment (optional, maximum 25 MB)
                        <input type="file" className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                    </label>
                    <div className="flex flex-wrap gap-2 md:col-span-2">
                        <button disabled={saving} type="submit" className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"><Save size={16} /> {saving ? "Saving…" : editingId ? "Update draft" : "Save draft"}</button>
                        {editingId && <button type="button" onClick={resetForm} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700">Cancel edit</button>}
                    </div>
                </form>
                <p className="mt-3 text-xs text-slate-500">Only classes assigned to you in an approved timetable can be selected. Saving keeps the assignment private until you publish it.</p>
            </section>

            <section className="space-y-3">
                <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-800"><ClipboardList size={20} /> Your assignments</h2>
                {loading ? <p className="rounded-xl bg-white p-8 text-center text-sm text-slate-500">Loading assignments…</p> : assignments.length === 0 ? <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">No assignments yet. Create a draft above to get started.</p> : assignments.map((assignment) => (
                    <article key={assignment.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-semibold text-slate-800">{assignment.title}</h3><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${assignment.status === "PUBLISHED" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{assignment.status}</span></div>
                                <p className="mt-1 text-sm text-slate-600">{assignment.subjectName} · Grade {assignment.gradeName}, Section {assignment.sectionName}</p>
                                <p className="mt-1 text-sm text-slate-500">Due {new Date(assignment.dueAt).toLocaleString()} · {assignment.submissionCount} submission(s)</p>
                                <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{assignment.instructions}</p>
                                {assignment.hasAttachment && <button type="button" onClick={() => void downloadAssignmentAttachment(assignment.id, assignment.attachmentName ?? "assignment-attachment").catch(() => toast.error("Could not download the attachment."))} className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800"><Download size={15} /> {assignment.attachmentName ?? "Download attachment"}</button>}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {assignment.status === "DRAFT" && <>
                                    <button type="button" onClick={() => edit(assignment)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Edit</button>
                                    <button type="button" onClick={() => void publish(assignment)} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"><Send size={14} /> Publish</button>
                                    <button type="button" onClick={() => void remove(assignment)} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50"><Trash2 size={14} /> Delete</button>
                                </>}
                                {assignment.status === "PUBLISHED" && <button type="button" onClick={() => void openSubmissions(assignment)} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"><BookOpenCheck size={15} /> Review submissions</button>}
                            </div>
                        </div>
                    </article>
                ))}
            </section>

            {selectedAssignment && <section className="space-y-3 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-semibold text-slate-800">Submissions: {selectedAssignment.title}</h2><p className="text-sm text-slate-500">Review student work, assign marks, and provide feedback.</p></div><button type="button" onClick={() => setSelectedAssignment(null)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700">Close</button></div>
                {submissions.length === 0 ? <p className="rounded-xl bg-white p-6 text-sm text-slate-500">No student submissions yet.</p> : submissions.map((submission) => {
                    const value = gradeValues[submission.id] ?? { marks: "", maxMarks: "100", feedback: "" };
                    return <article key={submission.id} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
                        <div className="flex flex-wrap justify-between gap-2"><div><h3 className="font-semibold text-slate-800">{submission.studentName}</h3><p className="text-xs text-slate-500">{submission.studentEmail} · Submitted {submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : "—"}</p></div><div className="flex gap-2"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${submission.late ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>{submission.late ? "Late" : "On time"}</span>{submission.gradedAt && <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">Graded</span>}</div></div>
                        <p className="whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{submission.responseText || "No written response."}</p>
                        {submission.hasAttachment && <button type="button" onClick={() => void downloadSubmissionAttachment(submission.id, submission.attachmentName ?? "student-attachment").catch(() => toast.error("Could not download the student's attachment."))} className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600"><FileUp size={15} /> Download {submission.attachmentName ?? "attachment"}</button>}
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <label className="text-xs font-semibold text-slate-600">Marks earned<input type="number" min="0" step="0.01" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal" value={value.marks} onChange={(e) => setGradeValues((old) => ({ ...old, [submission.id]: { ...value, marks: e.target.value } }))} /></label>
                            <label className="text-xs font-semibold text-slate-600">Maximum marks<input type="number" min="0.01" step="0.01" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal" value={value.maxMarks} onChange={(e) => setGradeValues((old) => ({ ...old, [submission.id]: { ...value, maxMarks: e.target.value } }))} /></label>
                            <label className="text-xs font-semibold text-slate-600">Feedback<input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal" value={value.feedback} onChange={(e) => setGradeValues((old) => ({ ...old, [submission.id]: { ...value, feedback: e.target.value } }))} placeholder="Optional feedback" /></label>
                        </div>
                        <button type="button" onClick={() => void saveGrade(submission)} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Save grade and feedback</button>
                    </article>;
                })}
            </section>}
        </div>
    );
}
