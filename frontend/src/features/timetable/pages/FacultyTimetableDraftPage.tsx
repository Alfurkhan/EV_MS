import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { createTimetableDraft, getMyTimetableDrafts, submitTimetableForApproval, updateFacultyDraft } from "../services/timetableService";
import type { Timetable } from "../types/timetable";
import type { TimetableRequest } from "../services/timetableService";
import toast from "react-hot-toast";

const initial: TimetableRequest = {
    academicYearId: 0, gradeId: 0, sectionId: 0, subjectId: 0, facultyId: 0,
    dayOfWeek: "MONDAY", startDate: "", endDate: "", startTime: "", endTime: "",
    classType: "OFFLINE", room: ""
};

export default function FacultyTimetableDraftPage() {
    const [form, setForm] = useState<TimetableRequest>(initial);
    const [items, setItems] = useState<Timetable[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const refresh = async () => {
        setLoading(true);
        try { setItems(await getMyTimetableDrafts()); }
        catch { toast.error("Could not load your timetable drafts."); }
        finally { setLoading(false); }
    };
    useEffect(() => { void refresh(); }, []);

    const update = (key: keyof TimetableRequest, value: string) => {
        setForm(old => ({ ...old, [key]: ["academicYearId","gradeId","sectionId","subjectId"].includes(key) ? Number(value) : value }));
    };

    const saveDraft = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSaving(true);
        try {
            await createTimetableDraft(form);
            toast.success("Draft saved. It is not visible to students.");
            setForm(initial);
            await refresh();
        } catch (error: any) {
            toast.error(error?.response?.data?.message ?? "Could not save draft. Check the IDs and schedule details.");
        } finally { setSaving(false); }
    };

    const editDraft = (item: Timetable) => {\n        setEditingId(item.id);\n        setForm({ academicYearId: item.academicYearId, gradeId: item.gradeId, sectionId: item.sectionId, subjectId: item.subjectId, facultyId: item.facultyId, dayOfWeek: item.dayOfWeek, startDate: item.startDate, endDate: item.endDate, startTime: item.startTime, endTime: item.endTime, classType: item.classType, room: item.room ?? "", meetingLink: item.meetingLink ?? "", notes: item.notes ?? "", active: false });\n        window.scrollTo({ top: 0, behavior: "smooth" });\n    };\n\n    const submit = async (id: number) => {
        try {
            await submitTimetableForApproval(id);
            toast.success("Submitted to the administrator for approval.");
            await refresh();
        } catch { toast.error("Could not submit this timetable."); }
    };

    const field = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm";
    return <div className="mx-auto max-w-5xl space-y-6">
        <header><h1 className="text-2xl font-bold text-slate-900">My Timetable Drafts</h1>
            <p className="mt-1 text-sm text-slate-600">Save a draft first, then submit it for admin approval. Drafts are not published to students.</p></header>
        <form onSubmit={saveDraft} className="grid grid-cols-1 gap-4 rounded-2xl border bg-white p-6 shadow-sm sm:grid-cols-2 lg:grid-cols-3">
            {([["academicYearId","Academic year ID"],["gradeId","Grade ID"],["sectionId","Section ID"],["subjectId","Subject ID"]] as const).map(([key,label]) =>
                <label key={key} className="space-y-1 text-sm font-medium text-slate-700">{label}
                    <input className={field} type="number" min="1" required value={form[key] || ""} onChange={e=>update(key,e.target.value)} />
                </label>)}
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
                <input className={field} type="date" required value={form.startDate} onChange={e=>update("startDate",e.target.value)} />
            </label>
            <label className="space-y-1 text-sm font-medium text-slate-700">End date
                <input className={field} type="date" required value={form.endDate} onChange={e=>update("endDate",e.target.value)} />
            </label>
            <label className="space-y-1 text-sm font-medium text-slate-700">Start time
                <input className={field} type="time" required value={form.startTime} onChange={e=>update("startTime",e.target.value)} />
            </label>
            <label className="space-y-1 text-sm font-medium text-slate-700">End time
                <input className={field} type="time" required value={form.endTime} onChange={e=>update("endTime",e.target.value)} />
            </label>
            {form.classType === "OFFLINE" ? <label className="space-y-1 text-sm font-medium text-slate-700">Room
                <input className={field} required value={form.room ?? ""} onChange={e=>update("room",e.target.value)} />
            </label> : <label className="space-y-1 text-sm font-medium text-slate-700">Meeting link
                <input className={field} type="url" required value={form.meetingLink ?? ""} onChange={e=>update("meetingLink",e.target.value)} />
            </label>}
            <label className="space-y-1 text-sm font-medium text-slate-700 sm:col-span-2">Notes (optional)
                <input className={field} value={form.notes ?? ""} onChange={e=>update("notes",e.target.value)} />
            </label>
            <div className="flex items-end"><button disabled={saving} className="rounded-lg bg-indigo-600 px-5 py-2.5 font-semibold text-white disabled:opacity-60">{saving ? "Saving…" : editingId !== null ? "Update draft" : "Save draft"} {editingId !== null && <span className="ml-2 cursor-pointer text-sm underline" onClick={() => { setEditingId(null); setForm(initial); }}>Cancel edit</span>}</button></div>
        </form>
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">Your drafts</h2>
            {loading ? <p className="text-sm text-slate-500">Loading…</p> : items.length === 0 ? <p className="text-sm text-slate-500">No drafts yet.</p> :
                <div className="space-y-3">{items.map(item=><div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
                    <div><p className="font-semibold text-slate-900">{item.subjectName} · {item.dayOfWeek}</p><p className="text-sm text-slate-600">Grade {item.gradeName}, Section {item.sectionName} · {item.startTime}–{item.endTime}</p><p className="text-xs text-slate-500">{item.status}</p></div>
                    <div className="flex gap-2"><button onClick={()=>editDraft(item)} className="rounded-lg border px-4 py-2 text-sm font-semibold text-slate-700">Edit</button><button onClick={()=>void submit(item.id)} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">Submit for approval</button></div>
                </div>)}</div>}
        </section>
    </div>;
}
