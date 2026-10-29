import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
    ArrowLeft, BarChart3, BookOpen, BookOpenCheck, ClipboardList, Download,
    Eye, FileUp, PlusCircle, RefreshCw, Save, Send, Trash2, X,
} from "lucide-react";
import { getAcademicYears, type AcademicYear } from "../../academic/services/academicYearService";
import { getGradesByAcademicYear, type Grade } from "../../academic/services/gradeService";
import { getSectionsByGrade, type Section } from "../../academic/services/sectionService";
import { getMySubjects, type Subject } from "../../courses/services/subjectService";
import {
    createAssignmentDraft,
    deleteAssignmentDraft,
    downloadAssignmentAttachment,
    downloadSubmissionAttachment,
    getAssignmentReport,
    getAssignmentSubmissions,
    getFacultyAssignments,
    gradeAssignmentSubmission,
    publishAssignment,
    updateAssignmentDraft,
    uploadAssignmentAttachment,
    viewAssignmentAttachment,
    viewSubmissionAttachment,
} from "../services/assignmentService";
import type { Assignment, AssignmentRequest, AssignmentSubmission } from "../types/assignment";
import type { AssignmentReport } from "../services/assignmentService";

type FacultyView = "subjects" | "subject" | "assignments";
type FormErrors = Partial<Record<keyof AssignmentRequest, string>>;

const blankForm: AssignmentRequest = {
    title: "",
    instructions: "",
    academicYearId: 0,
    gradeId: 0,
    sectionId: 0,
    subjectId: 0,
    dueAt: "",
};

const fieldClass = (invalid?: boolean) =>
    `w-full rounded-lg border px-3 py-2.5 text-sm font-normal outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 ${invalid ? "border-rose-400 bg-rose-50/40" : "border-slate-300"}`;

export default function FacultyAssignmentsPage() {
    const [view, setView] = useState<FacultyView>("subjects");
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
    const [grades, setGrades] = useState<Grade[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
    const [form, setForm] = useState<AssignmentRequest>(blankForm);
    const [errors, setErrors] = useState<FormErrors>({});
    const [file, setFile] = useState<File | null>(null);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
    const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
    const [gradeValues, setGradeValues] = useState<Record<number, { marks: string; maxMarks: string; feedback: string }>>({});
    const [report, setReport] = useState<AssignmentReport | null>(null);
    const [reportForId, setReportForId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [panelLoading, setPanelLoading] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);

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
            .catch((error: any) => toast.error(error?.response?.data?.message ?? "Could not load academic years or assigned subjects."));
    }, []);

    const selectedSubject = subjects.find((subject) => subject.id === selectedSubjectId) ?? null;
    const subjectAssignments = useMemo(
        () => assignments.filter((assignment) => assignment.subjectId === selectedSubjectId),
        [assignments, selectedSubjectId],
    );

    const chooseYear = async (value: string) => {
        const id = Number(value);
        setForm((old) => ({ ...old, academicYearId: id, gradeId: 0, sectionId: 0 }));
        setErrors((old) => ({ ...old, academicYearId: undefined, gradeId: undefined, sectionId: undefined }));
        setGrades([]);
        setSections([]);
        if (!id) return;
        try {
            setGrades((await getGradesByAcademicYear(id)).filter((grade) => grade.active));
        } catch {
            toast.error("Could not load grades for this academic year.");
        }
    };

    const chooseGrade = async (value: string) => {
        const id = Number(value);
        setForm((old) => ({ ...old, gradeId: id, sectionId: 0 }));
        setErrors((old) => ({ ...old, gradeId: undefined, sectionId: undefined }));
        setSections([]);
        if (!id) return;
        try {
            setSections((await getSectionsByGrade(id)).filter((section) => section.active));
        } catch {
            toast.error("Could not load sections for this grade.");
        }
    };

    const resetForm = () => {
        setForm({ ...blankForm, subjectId: selectedSubjectId ?? 0 });
        setFile(null);
        setEditingId(null);
        setErrors({});
        setGrades([]);
        setSections([]);
        setShowForm(false);
    };

    const openCreate = () => {
        setEditingId(null);
        setForm({ ...blankForm, subjectId: selectedSubjectId ?? 0 });
        setErrors({});
        setFile(null);
        setGrades([]);
        setSections([]);
        setShowForm(true);
    };

    const save = async (publishAfterSave: boolean) => {
        const nextErrors: FormErrors = {};
        if (!form.title.trim()) nextErrors.title = "Enter an assignment title.";
        if (!form.instructions.trim()) nextErrors.instructions = "Add instructions so students know what to do.";
        if (!form.academicYearId) nextErrors.academicYearId = "Select an academic year.";
        if (!form.gradeId) nextErrors.gradeId = "Select a grade.";
        if (!form.sectionId) nextErrors.sectionId = "Select a section.";
        if (!form.subjectId) nextErrors.subjectId = "Select an assigned subject.";
        if (!form.dueAt || Number.isNaN(new Date(form.dueAt).getTime())) nextErrors.dueAt = "Choose a valid due date and time.";
        if (file && file.size > 25 * 1024 * 1024) {
            toast.error("The assignment attachment must be 25 MB or smaller.");
            return;
        }
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length) {
            toast.error("Please correct the highlighted fields before continuing.");
            formRef.current?.reportValidity();
            return;
        }

        setSaving(true);
        try {
            let saved: Assignment;
            if (editingId === null) saved = await createAssignmentDraft(form);
            else saved = await updateAssignmentDraft(editingId, form);
            if (file) saved = await uploadAssignmentAttachment(saved.id, file);
            if (publishAfterSave && saved.status === "DRAFT") {
                await publishAssignment(saved.id);
                toast.success("Assignment published successfully. Students in the selected class can now see it.");
            } else {
                toast.success(editingId === null ? "Assignment draft saved successfully." : "Assignment draft updated successfully.");
            }
            resetForm();
            await refresh();
        } catch (error: any) {
            toast.error(error?.response?.data?.message ?? "Could not save the assignment. Check the selected class and your approved timetable.");
        } finally {
            setSaving(false);
        }
    };

    const edit = async (assignment: Assignment) => {
        if (assignment.status !== "DRAFT") {
            toast.error("Only draft assignments can be edited.");
            return;
        }
        setSelectedSubjectId(assignment.subjectId);
        setView("subject");
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
        setErrors({});
        setFile(null);
        setShowForm(true);
        try {
            setGrades((await getGradesByAcademicYear(assignment.academicYearId)).filter((grade) => grade.active));
            setSections((await getSectionsByGrade(assignment.gradeId)).filter((section) => section.active));
        } catch {
            toast.error("Assignment details loaded, but grade or section options could not be refreshed.");
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const publish = async (assignment: Assignment) => {
        try {
            await publishAssignment(assignment.id);
            toast.success("Assignment published to enrolled students.");
            await refresh();
        } catch (error: any) {
            toast.error(error?.response?.data?.message ?? "Could not publish this assignment.");
        }
    };

    const remove = async (assignment: Assignment) => {
        const warning = assignment.status === "PUBLISHED"
            ? `Delete "${assignment.title}"? This removes it from student and admin views and permanently deletes its submissions and grades.`
            : `Delete draft "${assignment.title}"?`;
        if (!window.confirm(warning)) return;
        try {
            await deleteAssignmentDraft(assignment.id);
            toast.success("Assignment deleted successfully.");
            if (selectedAssignment?.id === assignment.id) setSelectedAssignment(null);
            if (reportForId === assignment.id) { setReportForId(null); setReport(null); }
            await refresh();
        } catch (error: any) {
            toast.error(error?.response?.data?.message ?? "Could not delete this assignment.");
        }
    };

    const openSubmissions = async (assignment: Assignment) => {
        setSelectedAssignment(assignment);
        setReportForId(null);
        setReport(null);
        setPanelLoading(true);
        setSubmissions([]);
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
            setSelectedAssignment(null);
        } finally {
            setPanelLoading(false);
        }
    };

    const openReport = async (assignment: Assignment) => {
        setSelectedAssignment(null);
        setReportForId(assignment.id);
        setReport(null);
        setPanelLoading(true);
        try {
            setReport(await getAssignmentReport(assignment.id));
        } catch (error: any) {
            toast.error(error?.response?.data?.message ?? "Could not load the submission report.");
            setReportForId(null);
        } finally {
            setPanelLoading(false);
        }
    };

    const saveGrade = async (submission: AssignmentSubmission) => {
        const value = gradeValues[submission.id];
        const marks = Number(value?.marks);
        const maxMarks = Number(value?.maxMarks);
        if (value?.marks === "" || !Number.isFinite(marks) || !Number.isFinite(maxMarks) || marks < 0 || maxMarks <= 0 || marks > maxMarks) {
            toast.error("Enter valid marks, with marks between zero and the maximum.");
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

    const renderAssignment = (assignment: Assignment) => (
        <article key={assignment.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-semibold text-slate-800">{assignment.title}</h3><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${assignment.status === "PUBLISHED" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{assignment.status}</span></div>
                    <p className="mt-1 text-sm text-slate-600">Grade {assignment.gradeName}, Section {assignment.sectionName} · {assignment.academicYearName}</p>
                    <p className="mt-1 text-sm text-slate-500">Due {new Date(assignment.dueAt).toLocaleString()} · {assignment.submissionCount} submission(s)</p>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{assignment.instructions}</p>
                    {assignment.hasAttachment && <div className="mt-3 flex flex-wrap gap-4"><button type="button" onClick={() => void viewAssignmentAttachment(assignment.id).catch((error: any) => toast.error(error?.message ?? "Could not preview attachment."))} className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600"><Eye size={15} /> View attachment</button><button type="button" onClick={() => void downloadAssignmentAttachment(assignment.id, assignment.attachmentName ?? "assignment-attachment").catch(() => toast.error("Could not download attachment."))} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600"><Download size={15} /> Download</button></div>}
                </div>
                <div className="flex flex-wrap gap-2 lg:max-w-xs lg:justify-end">
                    {assignment.status === "DRAFT" && <><button type="button" onClick={() => void edit(assignment)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Edit</button><button type="button" onClick={() => void publish(assignment)} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"><Send size={14} /> Publish</button></>}
                    {assignment.status === "PUBLISHED" && <><button type="button" onClick={() => void openSubmissions(assignment)} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"><BookOpenCheck size={15} /> Review submissions</button><button type="button" onClick={() => void openReport(assignment)} className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"><BarChart3 size={15} /> Report</button></>}
                    <button type="button" onClick={() => void remove(assignment)} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50"><Trash2 size={14} /> Delete</button>
                </div>
            </div>
        </article>
    );

    return (
        <div className="mx-auto max-w-7xl space-y-6">
            <header className="flex flex-wrap items-center justify-between gap-3">
                <div><h1 className="text-3xl font-bold text-slate-800">Assignments</h1><p className="mt-1 text-sm text-slate-500">Create work by subject, publish it to your classes, and track student progress.</p></div>
                <button type="button" onClick={() => void refresh()} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"><RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh</button>
            </header>

            <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
                <button type="button" onClick={() => { setView("subjects"); setSelectedSubjectId(null); setShowForm(false); setSelectedAssignment(null); setReportForId(null); }} className={`rounded-lg px-4 py-2.5 text-sm font-semibold ${view !== "assignments" ? "bg-indigo-600 text-white" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}>My Subjects</button>
                <button type="button" onClick={() => { setView("assignments"); setShowForm(false); setSelectedAssignment(null); setReportForId(null); }} className={`rounded-lg px-4 py-2.5 text-sm font-semibold ${view === "assignments" ? "bg-indigo-600 text-white" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}>Your Assignments</button>
            </div>

            {view === "subjects" && <>
                <div><h2 className="text-xl font-semibold text-slate-800">My Subjects</h2><p className="mt-1 text-sm text-slate-500">Choose a subject to create assignments and review its existing work.</p></div>
                {loading ? <div className="rounded-2xl bg-white p-10 text-center text-sm text-slate-500">Loading your subjects…</div>
                    : subjects.length === 0 ? <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center"><BookOpen className="mx-auto text-slate-300" size={34} /><h3 className="mt-3 font-semibold text-slate-800">No assigned subjects found</h3><p className="mt-1 text-sm text-slate-500">Subjects assigned to you through the school timetable will appear here.</p></div>
                    : <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">{subjects.map((subject) => {
                        const count = assignments.filter((assignment) => assignment.subjectId === subject.id).length;
                        return <button key={subject.id} type="button" onClick={() => { setSelectedSubjectId(subject.id); setView("subject"); setShowForm(false); setSelectedAssignment(null); setReportForId(null); }} className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-200">
                            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><BookOpen size={22} /></span><h3 className="mt-4 text-lg font-semibold text-slate-800">{subject.name}</h3><p className="mt-1 text-xs font-semibold uppercase tracking-wide text-indigo-600">{subject.code}</p><p className="mt-3 text-sm text-slate-500">{count} {count === 1 ? "assignment" : "assignments"} created</p><p className="mt-4 border-t border-slate-100 pt-3 text-sm font-semibold text-indigo-600">Open subject →</p>
                        </button>;
                    })}</div>}
            </>}

            {view === "subject" && selectedSubject && <>
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5">
                    <div><button type="button" onClick={() => { setView("subjects"); setSelectedSubjectId(null); setShowForm(false); }} className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-indigo-700"><ArrowLeft size={15} /> All subjects</button><p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">{selectedSubject.code}</p><h2 className="mt-1 text-2xl font-bold text-slate-800">{selectedSubject.name}</h2><p className="mt-1 text-sm text-slate-600">Manage assignments for this subject.</p></div>
                    {!showForm && <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"><PlusCircle size={16} /> Create assignment</button>}
                </div>

                {showForm && <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between gap-3"><h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800"><Save size={18} /> {editingId ? "Edit assignment draft" : "Create assignment"}</h3><button type="button" onClick={resetForm} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Close assignment form"><X size={18} /></button></div>
                    <form ref={formRef} onSubmit={(event) => event.preventDefault()} className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <label className="space-y-1 text-sm font-medium text-slate-700">Assignment title
                            <input required maxLength={200} aria-invalid={Boolean(errors.title)} className={fieldClass(Boolean(errors.title))} value={form.title} onChange={(event) => { setForm({ ...form, title: event.target.value }); setErrors((old) => ({ ...old, title: undefined })); }} placeholder="e.g. Chapter 4 exercises" />
                            {errors.title && <span className="block text-xs font-medium text-rose-600">{errors.title}</span>}
                        </label>
                        <label className="space-y-1 text-sm font-medium text-slate-700">Due date and time
                            <input required type="datetime-local" aria-invalid={Boolean(errors.dueAt)} className={fieldClass(Boolean(errors.dueAt))} value={form.dueAt} onChange={(event) => { setForm({ ...form, dueAt: event.target.value }); setErrors((old) => ({ ...old, dueAt: undefined })); }} />
                            {errors.dueAt && <span className="block text-xs font-medium text-rose-600">{errors.dueAt}</span>}
                            <span className="block text-xs font-normal text-slate-500">Students can update a submission until this deadline.</span>
                        </label>
                        <label className="space-y-1 text-sm font-medium text-slate-700">Academic year
                            <select required aria-invalid={Boolean(errors.academicYearId)} className={fieldClass(Boolean(errors.academicYearId))} value={form.academicYearId || ""} onChange={(event) => void chooseYear(event.target.value)}><option value="">Select academic year</option>{academicYears.map((year) => <option key={year.id} value={year.id}>{year.name}</option>)}</select>
                            {errors.academicYearId && <span className="block text-xs font-medium text-rose-600">{errors.academicYearId}</span>}
                        </label>
                        <label className="space-y-1 text-sm font-medium text-slate-700">Grade
                            <select required disabled={!form.academicYearId} aria-invalid={Boolean(errors.gradeId)} className={fieldClass(Boolean(errors.gradeId)) + " disabled:bg-slate-100"} value={form.gradeId || ""} onChange={(event) => void chooseGrade(event.target.value)}><option value="">Select grade</option>{grades.map((grade) => <option key={grade.id} value={grade.id}>{grade.name}</option>)}</select>
                            {errors.gradeId && <span className="block text-xs font-medium text-rose-600">{errors.gradeId}</span>}
                        </label>
                        <label className="space-y-1 text-sm font-medium text-slate-700">Section
                            <select required disabled={!form.gradeId} aria-invalid={Boolean(errors.sectionId)} className={fieldClass(Boolean(errors.sectionId)) + " disabled:bg-slate-100"} value={form.sectionId || ""} onChange={(event) => { setForm({ ...form, sectionId: Number(event.target.value) }); setErrors((old) => ({ ...old, sectionId: undefined })); }}><option value="">Select section</option>{sections.map((section) => <option key={section.id} value={section.id}>{section.name}</option>)}</select>
                            {errors.sectionId && <span className="block text-xs font-medium text-rose-600">{errors.sectionId}</span>}
                        </label>
                        <label className="space-y-1 text-sm font-medium text-slate-700">Assigned subject
                            <select required disabled={selectedSubjectId !== null} aria-invalid={Boolean(errors.subjectId)} className={fieldClass(Boolean(errors.subjectId)) + " disabled:bg-slate-100"} value={form.subjectId || ""} onChange={(event) => { setForm({ ...form, subjectId: Number(event.target.value) }); setErrors((old) => ({ ...old, subjectId: undefined })); }}><option value="">Select subject</option>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name} ({subject.code})</option>)}</select>
                            {selectedSubjectId !== null && <span className="block text-xs font-normal text-slate-500">Subject is fixed to the one you selected.</span>}
                            {errors.subjectId && <span className="block text-xs font-medium text-rose-600">{errors.subjectId}</span>}
                        </label>
                        <label className="space-y-1 text-sm font-medium text-slate-700 md:col-span-2">Instructions
                            <textarea required maxLength={20000} rows={4} aria-invalid={Boolean(errors.instructions)} className={fieldClass(Boolean(errors.instructions))} value={form.instructions} onChange={(event) => { setForm({ ...form, instructions: event.target.value }); setErrors((old) => ({ ...old, instructions: undefined })); }} placeholder="Explain the task, expected format, and submission requirements." />
                            {errors.instructions && <span className="block text-xs font-medium text-rose-600">{errors.instructions}</span>}
                        </label>
                        <label className="space-y-1 text-sm font-medium text-slate-700 md:col-span-2">Attachment (optional, maximum 25 MB)
                            <input type="file" className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5" onChange={(event) => { const picked = event.target.files?.[0] ?? null; if (picked && picked.size > 25 * 1024 * 1024) { setFile(null); toast.error("Choose a file no larger than 25 MB."); event.target.value = ""; return; } setFile(picked); }} />
                            <span className="block text-xs font-normal text-slate-500">Optional. Add a worksheet, PDF, or other instructions for your students.</span>
                        </label>
                    </form>
                    <div className="mt-4 flex flex-wrap gap-2">
                        <button disabled={saving} type="button" onClick={() => void save(false)} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"><Save size={16} /> {saving ? "Saving…" : editingId ? "Update draft" : "Save draft"}</button>
                        <button disabled={saving} type="button" onClick={() => void save(true)} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"><Send size={16} /> {saving ? "Saving…" : "Publish assignment"}</button>
                        <button type="button" onClick={resetForm} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
                    </div>
                    <p className="mt-3 text-xs text-slate-500">Only classes assigned to you in an approved timetable can be selected. Publishing makes this assignment visible to students actively enrolled in the selected class.</p>
                </section>}

                {!loading && subjectAssignments.length === 0 && !showForm ? <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center"><ClipboardList className="mx-auto text-slate-300" size={36} /><h3 className="mt-3 font-semibold text-slate-800">No assignments have been created yet</h3><p className="mt-1 text-sm text-slate-500">Create the first assignment for {selectedSubject.name} when you’re ready.</p><button type="button" onClick={openCreate} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"><PlusCircle size={16} /> Create assignment</button></div>
                    : loading ? <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500">Loading assignments…</div>
                    : !showForm && <section className="space-y-3"><h3 className="text-lg font-semibold text-slate-800">Assignments for {selectedSubject.name}</h3>{subjectAssignments.map(renderAssignment)}</section>}
            </>}

            {view === "assignments" && <section className="space-y-4">
                <div><h2 className="text-xl font-semibold text-slate-800">Your Assignments</h2><p className="mt-1 text-sm text-slate-500">Manage drafts, publish work, review submissions, and monitor class progress.</p></div>
                {loading ? <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500">Loading assignments…</div>
                    : assignments.length === 0 ? <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center"><ClipboardList className="mx-auto text-slate-300" size={36} /><h3 className="mt-3 font-semibold text-slate-800">No assignments have been created yet</h3><p className="mt-1 text-sm text-slate-500">Open My Subjects to create your first assignment.</p><button type="button" onClick={() => setView("subjects")} className="mt-4 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white">Browse my subjects</button></div>
                    : <div className="space-y-3">{assignments.map(renderAssignment)}</div>}
            </section>}

            {reportForId !== null && <section className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="flex items-center gap-2 text-xl font-semibold text-slate-800"><BarChart3 size={20} /> Submission report</h2><p className="mt-1 text-sm text-slate-500">{assignments.find((item) => item.id === reportForId)?.title ?? "Assignment progress"}</p></div><button type="button" onClick={() => { setReportForId(null); setReport(null); }} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700">Close</button></div>
                {panelLoading ? <p className="mt-4 rounded-xl bg-white p-6 text-sm text-slate-500">Calculating class progress…</p>
                    : report && <><div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3"><div className="rounded-xl bg-white p-4"><p className="text-xs text-slate-500">Students in class</p><p className="mt-1 text-2xl font-bold text-slate-800">{report.totalStudents}</p></div><div className="rounded-xl bg-white p-4"><p className="text-xs text-slate-500">Submitted</p><p className="mt-1 text-2xl font-bold text-emerald-700">{report.submittedCount}</p></div><div className="rounded-xl bg-white p-4"><p className="text-xs text-slate-500">Pending</p><p className="mt-1 text-2xl font-bold text-amber-700">{report.pendingCount}</p></div></div><div className="mt-4 rounded-xl bg-white p-4"><div className="mb-2 flex items-center justify-between text-sm"><span className="font-semibold text-slate-700">Submission rate</span><span className="font-bold text-indigo-700">{report.submissionRate}%</span></div><div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${Math.min(100, report.submissionRate)}%` }} /></div><p className="mt-2 text-xs text-slate-500">Counts are based on active student enrollments in this assignment’s academic year, grade, and section.</p></div></>}
            </section>}

            {selectedAssignment && <section className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-semibold text-slate-800">Review submissions: {selectedAssignment.title}</h2><p className="text-sm text-slate-500">Review the student work, assign marks, and provide feedback.</p></div><button type="button" onClick={() => setSelectedAssignment(null)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700">Close</button></div>
                <div className="mt-4 max-h-[70vh] space-y-3 overflow-y-auto pr-1">
                    {panelLoading ? <p className="rounded-xl bg-white p-6 text-sm text-slate-500">Loading submissions…</p>
                        : submissions.length === 0 ? <p className="rounded-xl bg-white p-6 text-center text-sm text-slate-500">No student submissions yet. The review panel will list each submission when students turn in their work.</p>
                        : submissions.map((submission) => {
                            const value = gradeValues[submission.id] ?? { marks: "", maxMarks: "100", feedback: "" };
                            return <article key={submission.id} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
                                <div className="flex flex-wrap justify-between gap-2"><div><h3 className="font-semibold text-slate-800">{submission.studentName}</h3><p className="text-xs text-slate-500">{submission.studentEmail} · Submitted {submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : "—"}</p></div><div className="flex gap-2"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${submission.late ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>{submission.late ? "Late" : "On time"}</span>{submission.gradedAt && <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">Graded</span>}</div></div>
                                <p className="whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{submission.responseText || "No written response."}</p>
                                {submission.hasAttachment && <div className="flex flex-wrap gap-4"><button type="button" onClick={() => void viewSubmissionAttachment(submission.id).catch((error: any) => toast.error(error?.message ?? "Could not preview the student's attachment."))} className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600"><Eye size={15} /> View attachment</button><button type="button" onClick={() => void downloadSubmissionAttachment(submission.id, submission.attachmentName ?? "student-attachment").catch(() => toast.error("Could not download the student's attachment."))} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600"><FileUp size={15} /> Download</button></div>}
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                    <label className="text-xs font-semibold text-slate-600">Marks earned<input type="number" min="0" step="0.01" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal" value={value.marks} onChange={(event) => setGradeValues((old) => ({ ...old, [submission.id]: { ...value, marks: event.target.value } }))} /></label>
                                    <label className="text-xs font-semibold text-slate-600">Maximum marks<input type="number" min="0.01" step="0.01" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal" value={value.maxMarks} onChange={(event) => setGradeValues((old) => ({ ...old, [submission.id]: { ...value, maxMarks: event.target.value } }))} /></label>
                                    <label className="text-xs font-semibold text-slate-600">Feedback<input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal" value={value.feedback} onChange={(event) => setGradeValues((old) => ({ ...old, [submission.id]: { ...value, feedback: event.target.value } }))} placeholder="Optional feedback" /></label>
                                </div>
                                <button type="button" onClick={() => void saveGrade(submission)} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Save grade and feedback</button>
                            </article>;
                        })}
                </div>
            </section>}
        </div>
    );
}
