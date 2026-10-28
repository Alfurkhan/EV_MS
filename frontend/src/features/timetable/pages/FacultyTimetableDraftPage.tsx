import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { createTimetableDraft, getMyTimetableDrafts, submitTimetableForApproval, updateFacultyDraft } from "../services/timetableService";
import type { Timetable } from "../types/timetable";
import type { TimetableRequest } from "../services/timetableService";
import toast from "react-hot-toast";
import { getAcademicYears, type AcademicYear } from "../../academic/services/academicYearService";
import { getGradesByAcademicYear, type Grade } from "../../academic/services/gradeService";
import { getSectionsByGrade, type Section } from "../../academic/services/sectionService";
import { getMySubjects, type Subject } from "../../courses/services/subjectService";

const initial: TimetableRequest = {
    academicYearId: 0, gradeId: 0, sectionId: 0, subjectId: 0, facultyId: 0,
    dayOfWeek: "MONDAY", startDate: "", endDate: "", startTime: "", endTime: "",
    classType: "OFFLINE", room: ""
};

export default function FacultyTimetableDraftPage({ view, onViewChange }: { view: "create" | "drafts"; onViewChange: (view: "create" | "drafts") => void }) {
    const [form, setForm] = useState<TimetableRequest>(initial);
    const [items, setItems] = useState<Timetable[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [editingId, setEditingId] = useState<number | null>(null);
    const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
    const [grades, setGrades] = useState<Grade[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [lookupsLoading, setLookupsLoading] = useState(true);

    const refresh = async () => {
        setLoading(true);
        try { setItems(await getMyTimetableDrafts()); }
        catch { toast.error("Could not load your timetable drafts."); }
        finally { setLoading(false); }
    };
    useEffect(() => { void refresh(); }, []);

    useEffect(() => {
        let cancelled = false;
        const loadLookups = async () => {
            setLookupsLoading(true);
            try {
                const [yearResults, subjectResults] = await Promise.all([
                    getAcademicYears(),
                    getMySubjects()
                ]);
                if (cancelled) return;
                setAcademicYears(yearResults.filter(item => item.active));
                setSubjects(subjectResults.filter(item => item.active));
            } catch {
                if (!cancelled) toast.error("Could not load academic years or your assigned subjects.");
            } finally {
                if (!cancelled) setLookupsLoading(false);
            }
        };
        void loadLookups();
        return () => { cancelled = true; };
    }, []);

    const selectAcademicYear = async (value: string) => {
        const academicYearId = Number(value);
        setForm(old => ({ ...old, academicYearId, gradeId: 0, sectionId: 0 }));
        setGrades([]);
        setSections([]);
        if (!academicYearId) return;
        try {
            const results = await getGradesByAcademicYear(academicYearId);
            setGrades(results.filter(item => item.active));
        } catch {
            toast.error("Could not load grades for that academic year.");
        }
    };

    const selectGrade = async (value: string) => {
        const gradeId = Number(value);
        setForm(old => ({ ...old, gradeId, sectionId: 0 }));
        setSections([]);
        if (!gradeId) return;
        try {
            const results = await getSectionsByGrade(gradeId);
            setSections(results.filter(item => item.active));
        } catch {
            toast.error("Could not load sections for that grade.");
        }
    };

    const update = (key: keyof TimetableRequest, value: string) => {
        setForm(old => ({ ...old, [key]: ["academicYearId","gradeId","sectionId","subjectId"].includes(key) ? Number(value) : value }));
    };

    const validateForm = () => {
        const errors: Record<string, string> = {};
        if (!form.academicYearId) errors.academicYearId = "Choose an academic year.";
        if (!form.gradeId) errors.gradeId = "Choose a grade.";
        if (!form.sectionId) errors.sectionId = "Choose a section.";
        if (!form.subjectId) errors.subjectId = "Choose one of your assigned subjects.";
        if (!form.startDate) errors.startDate = "Choose a start date.";
        if (!form.endDate) errors.endDate = "Choose an end date.";
        else if (form.startDate && form.endDate < form.startDate) errors.endDate = "End date must be on or after the start date.";
        if (!form.startTime) errors.startTime = "Choose a start time.";
        if (!form.endTime) errors.endTime = "Choose an end time.";
        else if (form.startTime && form.endTime <= form.startTime) errors.endTime = "End time must be later than start time.";
        if (form.classType === "OFFLINE" && !form.room?.trim()) errors.room = "Enter the classroom or room number.";
        if (form.classType === "ONLINE") {
            if (!form.meetingLink?.trim()) errors.meetingLink = "Enter the online meeting link.";
            else {
                try { new URL(form.meetingLink); } catch { errors.meetingLink = "Enter a valid meeting URL, including https://."; }
            }
        }
        setFieldErrors(errors);
        if (Object.keys(errors).length > 0) toast.error("Please fix the highlighted fields before continuing.");
        return Object.keys(errors).length === 0;
    };

    const saveDraft = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!validateForm()) return;
        setSaving(true);
        try {
            if (editingId !== null) {
                await updateFacultyDraft(editingId, form);
                toast.success("Draft updated.");
            } else {
                await createTimetableDraft(form);
                toast.success("Draft saved. It is not visible to students.");
            }
            setEditingId(null);
            setForm(initial);
            await refresh();
        } catch (error: any) {
            toast.error(error?.response?.data?.message ?? "Could not save draft. Check the IDs and schedule details.");
        } finally { setSaving(false); }
    };

    const scheduleNow = async () => {
        if (!validateForm()) return;
        setSaving(true);
        try {
            if (editingId !== null) {
                await updateFacultyDraft(editingId, form);
                await submitTimetableForApproval(editingId);
            } else {
                const created = await createTimetableDraft(form);
                try {
                    await submitTimetableForApproval(created.id);
                } catch (error: any) {
                    toast.error(error?.response?.data?.message ?? "Your draft was saved, but submission failed. Open View Drafts and try submitting again.");
                    await refresh();
                    return;
                }
            }
            toast.success("Class scheduled and submitted to the administrator for approval.");
            setEditingId(null);
            setForm(initial);
            setFieldErrors({});
            await refresh();
            onViewChange("drafts");
        } catch (error: any) {
            toast.error(error?.response?.data?.message ?? "Could not schedule this class. Check the schedule details and try again.");
        } finally { setSaving(false); }
    };

    const editDraft = async (item: Timetable) => {
        setFieldErrors({});
        setEditingId(item.id);
        onViewChange("create");
        setForm({ academicYearId: item.academicYearId, gradeId: item.gradeId, sectionId: item.sectionId, subjectId: item.subjectId, facultyId: item.facultyId, dayOfWeek: item.dayOfWeek, startDate: item.startDate, endDate: item.endDate, startTime: item.startTime, endTime: item.endTime, classType: item.classType, room: item.room ?? "", meetingLink: item.meetingLink ?? "", notes: item.notes ?? "", active: false });
        try {
            const gradeResults = await getGradesByAcademicYear(item.academicYearId);
            setGrades(gradeResults.filter(option => option.active));
            const sectionResults = await getSectionsByGrade(item.gradeId);
            setSections(sectionResults.filter(option => option.active));
        } catch {
            toast.error("Draft loaded, but grade or section options could not be refreshed.");
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const submit = async (id: number) => {
        try {
            await submitTimetableForApproval(id);
            toast.success("Submitted to the administrator for approval.");
            await refresh();
        } catch { toast.error("Could not submit this timetable."); }
    };

    const field = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";
    const errorText = (key: string) => fieldErrors[key] ? <span className="block text-xs font-normal text-rose-600">{fieldErrors[key]}</span> : null;
    return <div className="mx-auto max-w-5xl space-y-6">
        {view === "create" && <form noValidate onSubmit={saveDraft} className="grid grid-cols-1 gap-4 rounded-2xl border-0 bg-white p-6 shadow-sm sm:grid-cols-2 lg:grid-cols-3">
            <label className="space-y-1 text-sm font-medium text-slate-700">Academic year
                <select className={field} required disabled={lookupsLoading} value={form.academicYearId || ""} onChange={e => void selectAcademicYear(e.target.value)}>
                    <option value="">Select academic year</option>
                    {academicYears.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
                {errorText("academicYearId")}
            </label>
            <label className="space-y-1 text-sm font-medium text-slate-700">Grade
                <select className={field} required disabled={!form.academicYearId || grades.length === 0} value={form.gradeId || ""} onChange={e => void selectGrade(e.target.value)}>
                    <option value="">Select grade</option>
                    {grades.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
                {errorText("gradeId")}
            </label>
            <label className="space-y-1 text-sm font-medium text-slate-700">Section
                <select className={field} required disabled={!form.gradeId || sections.length === 0} value={form.sectionId || ""} onChange={e => update("sectionId", e.target.value)}>
                    <option value="">Select section</option>
                    {sections.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
                {errorText("sectionId")}
            </label>
            <label className="space-y-1 text-sm font-medium text-slate-700">Assigned subject
                <select className={field} required disabled={lookupsLoading || subjects.length === 0} value={form.subjectId || ""} onChange={e => update("subjectId", e.target.value)}>
                    <option value="">Select subject</option>
                    {subjects.map(item => <option key={item.id} value={item.id}>{item.name} ({item.code})</option>)}
                </select>
                {subjects.length === 0 && !lookupsLoading && <span className="block text-xs font-normal text-amber-700">No active subjects are assigned to your faculty account.</span>}
                {errorText("subjectId")}
            </label>
            <label className="space-y-1 text-sm font-medium text-slate-700">Day
                <select className={field} value={form.dayOfWeek} onChange={e=>update("dayOfWeek",e.target.value)}>
                    {["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY"].map(day=><option key={day}>{day}</option>)}
                </select>
            </label>
            <label className="space-y-1 text-sm font-medium text-slate-700">Class type
                <select className={field} value={form.classType} onChange={e=>setForm(old=>({...old,classType:e.target.value as "ONLINE"|"OFFLINE",room:"",meetingLink:""}))}>
                    <option value="OFFLINE">Offline</option><option value="ONLINE">Online</option>
                </select>
            </label>
            <label className="space-y-1 text-sm font-medium text-slate-700">Start date
                <input className={field} type="date" required aria-invalid={Boolean(fieldErrors.startDate)} value={form.startDate} onChange={e=>{update("startDate",e.target.value);setFieldErrors(old=>({...old,startDate:"",endDate:""}));}} />
                {errorText("startDate")}
            </label>
            <label className="space-y-1 text-sm font-medium text-slate-700">End date
                <input className={field} type="date" required aria-invalid={Boolean(fieldErrors.endDate)} value={form.endDate} onChange={e=>{update("endDate",e.target.value);setFieldErrors(old=>({...old,endDate:""}));}} />
                {errorText("endDate")}
            </label>
            <label className="space-y-1 text-sm font-medium text-slate-700">Start time
                <input className={field} type="time" required aria-invalid={Boolean(fieldErrors.startTime)} value={form.startTime} onChange={e=>{update("startTime",e.target.value);setFieldErrors(old=>({...old,startTime:"",endTime:""}));}} />
                {errorText("startTime")}
            </label>
            <label className="space-y-1 text-sm font-medium text-slate-700">End time
                <input className={field} type="time" required aria-invalid={Boolean(fieldErrors.endTime)} value={form.endTime} onChange={e=>{update("endTime",e.target.value);setFieldErrors(old=>({...old,endTime:""}));}} />
                {errorText("endTime")}
            </label>
            {form.classType === "OFFLINE" ? <label className="space-y-1 text-sm font-medium text-slate-700">Room
                <input className={field} required aria-invalid={Boolean(fieldErrors.room)} value={form.room ?? ""} onChange={e=>{update("room",e.target.value);setFieldErrors(old=>({...old,room:""}));}} />
                {errorText("room")}
            </label> : <label className="space-y-1 text-sm font-medium text-slate-700">Meeting link
                <input className={field} type="url" required aria-invalid={Boolean(fieldErrors.meetingLink)} value={form.meetingLink ?? ""} onChange={e=>{update("meetingLink",e.target.value);setFieldErrors(old=>({...old,meetingLink:""}));}} />
                {errorText("meetingLink")}
            </label>}
            <label className="space-y-1 text-sm font-medium text-slate-700 sm:col-span-2">Notes (optional)
                <input className={field} value={form.notes ?? ""} onChange={e=>update("notes",e.target.value)} />
            </label>
            <div className="flex flex-wrap items-end gap-3 sm:col-span-2 lg:col-span-3">
                <button type="button" disabled={saving} onClick={() => void scheduleNow()} className="rounded-lg bg-emerald-600 px-5 py-2.5 font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">
                    {saving ? "Processing…" : editingId !== null ? "Update & submit" : "Schedule now"}
                </button>
                <button type="submit" disabled={saving} className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">
                    {saving ? "Saving…" : editingId !== null ? "Update draft" : "Save draft"}
                </button>
                {editingId !== null && <button type="button" className="rounded-lg border px-4 py-2.5 text-sm font-semibold text-slate-700" onClick={() => { setEditingId(null); setForm(initial); }}>
                    Cancel edit
                </button>}
            </div>
        </form>}
        {view === "drafts" && <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">Drafts and approval status</h2>
            {loading ? <p className="text-sm text-slate-500">Loading your drafts…</p> : items.length === 0 ? <div className="py-12 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400"><span className="text-2xl">＋</span></div>
                <h3 className="mt-4 text-base font-semibold text-slate-800">No class drafts yet</h3>
                <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">You haven’t created or scheduled any classes yet. Start by creating a class draft, then submit it to the administrator for approval.</p>
                <button type="button" onClick={() => onViewChange("create")} className="mt-5 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">Schedule a Class</button>
            </div> :
                <div className="space-y-3">{items.map(item=><div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
                    <div><p className="font-semibold text-slate-900">{item.subjectName} · {item.dayOfWeek}</p><p className="text-sm text-slate-600">Grade {item.gradeName}, Section {item.sectionName} · {item.startTime}–{item.endTime}</p><p className="text-xs text-slate-500">Status: {item.status}</p>{item.notes && <p className="mt-1 max-w-xl whitespace-pre-wrap text-sm text-amber-700">Notes / feedback: {item.notes}</p>}</div>
                    {(item.status === "DRAFT" || item.status === "REJECTED") && <div className="flex gap-2"><button onClick={()=>editDraft(item)} className="rounded-lg border px-4 py-2 text-sm font-semibold text-slate-700">Edit</button><button onClick={()=>void submit(item.id)} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">Submit for approval</button></div>}
                </div>)}</div>}
        </section>}
    </div>;
}
