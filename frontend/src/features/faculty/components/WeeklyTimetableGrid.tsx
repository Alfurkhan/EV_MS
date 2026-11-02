import { useNavigate } from "react-router-dom";
import { BookOpen, CalendarDays, CheckCircle2, Clock3, ExternalLink, Monitor, PlayCircle, Square, ClipboardCheck } from "lucide-react";
import type { FacultyClass } from "../types/facultyClass";

interface Props {
    classes: FacultyClass[];
    actionLoading: number | null;
    onStart: (item: FacultyClass) => void;
    onEnd: (item: FacultyClass) => void;
}

const DAYS = [
    ["MONDAY", "Monday"], ["TUESDAY", "Tuesday"], ["WEDNESDAY", "Wednesday"],
    ["THURSDAY", "Thursday"], ["FRIDAY", "Friday"], ["SATURDAY", "Saturday"], ["SUNDAY", "Sunday"],
];

function timeLabel(value: string) {
    const [hours, minutes] = value.split(":").map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function dateLabel(value: string) {
    return new Date(value + "T00:00:00").toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
}

function ClassTile({ item, today, busy, onStart, onEnd }: {
    item: FacultyClass; today: string; busy: boolean;
    onStart: (item: FacultyClass) => void; onEnd: (item: FacultyClass) => void;
}) {
    const navigate = useNavigate();
    const currentDay = DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1][0];
    const canStart = item.dayOfWeek === currentDay && today >= item.startDate && today <= item.endDate && item.status === "NOT_STARTED";
    const live = item.status === "IN_PROGRESS";
    const done = item.status === "COMPLETED";
    const online = item.classType === "ONLINE";

    return <article className={`flex h-[300px] min-h-[300px] flex-col rounded-xl border p-3 shadow-sm transition hover:shadow-md ${live ? "border-red-200 bg-red-50/70" : done ? "border-emerald-200 bg-emerald-50/60" : canStart ? "border-blue-300 bg-blue-50/70" : "border-slate-200 bg-white"}`}>
        <div className="flex min-h-[54px] items-start justify-between gap-2">
            <div className="min-w-0">
                <h3 className="line-clamp-2 min-h-[40px] break-words text-sm font-bold leading-5 text-slate-800">{item.subjectName}</h3>
                <p className="mt-1 min-h-[16px] whitespace-nowrap text-xs leading-4 text-slate-600">{item.gradeName} · Section {item.sectionName}</p>
            </div>
            {live ? <span className="rounded-full bg-red-100 px-2 py-1 text-[10px] font-semibold text-red-700">Live</span> : done ? <CheckCircle2 size={15} className="text-emerald-600" /> : canStart ? <span className="rounded-full bg-blue-100 px-2 py-1 text-[10px] font-semibold text-blue-700">Today</span> : null}
        </div>
        <div className="mt-2 grid grid-rows-[20px_20px_20px_32px] gap-1.5 text-xs text-slate-600">
            <p className="flex items-center gap-1.5 whitespace-nowrap font-semibold leading-5 text-slate-700"><Clock3 size={13} className="shrink-0"/><span className="whitespace-nowrap">{timeLabel(item.scheduledStartTime)} – {timeLabel(item.scheduledEndTime)}</span></p>
            <p className="flex items-center gap-1.5 truncate leading-5"><BookOpen size={13} className="shrink-0"/><span className="truncate">{item.subjectCode}</span></p>
            <p className="flex items-center gap-1.5 truncate leading-5"><Monitor size={13} className="shrink-0"/><span className="truncate">{online ? "Online class" : item.room || "Room not assigned"}</span></p>
            <p className="flex items-start gap-1.5 overflow-hidden text-[11px] leading-4 text-slate-500"><CalendarDays size={12} className="mt-0.5 shrink-0"/><span className="line-clamp-2">{dateLabel(item.startDate)} – {dateLabel(item.endDate)}</span></p>
        </div>
        <div className="mt-1 min-h-[18px]">{online && item.meetingLink && <a href={item.meetingLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:underline"><ExternalLink size={12}/> Meeting link</a>}</div>
        <div className="mt-1 min-h-[18px] text-[11px] leading-4 text-slate-500">{item.notes ? <p className="line-clamp-2" title={item.notes}>{item.notes}</p> : null}</div>
        <div className="mt-auto">
        {live && <div className="mt-3 flex flex-col gap-2">
            <button type="button" onClick={() => navigate(`/attendance?sessionId=${item.sessionId}`)} className="inline-flex items-center justify-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"><ClipboardCheck size={13}/> Attendance</button>
            <button type="button" disabled={busy} onClick={() => onEnd(item)} className="inline-flex items-center justify-center gap-1 rounded-lg bg-red-600 px-2 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"><Square size={12}/> End Class</button>
        </div>}
        {canStart && <button type="button" disabled={busy} onClick={() => onStart(item)} className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-2 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"><PlayCircle size={14}/> Start Class</button>}
        </div>
    </article>;
}

export default function WeeklyTimetableGrid({ classes, actionLoading, onStart, onEnd }: Props) {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
    const todayKey = DAYS[now.getDay() === 0 ? 6 : now.getDay()-1][0];
    const slots = [...new Set(classes.map(item => item.scheduledStartTime.slice(0,5)))].sort();

    return <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <header className="flex flex-col gap-1 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div><h2 className="font-bold text-slate-800">Weekly teaching timetable</h2><p className="text-sm text-slate-500">Approved classes organized by weekday and start time.</p></div>
            <span className="text-xs font-medium text-slate-500">{classes.length} assigned {classes.length === 1 ? "class" : "classes"}</span>
        </header>
        <div className="overflow-x-auto"><div className="min-w-[1660px]">
            <div className="grid grid-cols-[76px_repeat(7,minmax(226px,1fr))] border-b border-slate-200 bg-slate-50">
                <div className="flex items-center justify-center border-r border-slate-200 px-2 py-4 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Time</div>
                {DAYS.map(([key,label]) => {
                    const count = classes.filter(item => item.dayOfWeek === key).length;
                    return <div key={key} className={`border-r border-slate-200 px-2 py-3 text-center last:border-r-0 ${key === todayKey ? "bg-blue-50" : ""}`}>
                        <p className={`text-xs font-bold ${key === todayKey ? "text-blue-700" : "text-slate-700"}`}>{label}</p>
                        <p className="mt-1 text-[10px] text-slate-400">{count ? `${count} ${count === 1 ? "class" : "classes"}` : "No classes"}</p>
                    </div>;
                })}
            </div>
            {slots.length === 0 ? <div className="p-12 text-center text-sm text-slate-500">No scheduled time slots found.</div> : slots.map(slot => <div key={slot} className="grid grid-cols-[76px_repeat(7,minmax(0,1fr))] border-b border-slate-100 last:border-b-0">
                <div className="flex items-start justify-center border-r border-slate-200 bg-slate-50 px-1 py-4 text-center text-xs font-semibold text-slate-500">{timeLabel(slot)} – {timeLabel(classes.filter(item => item.scheduledStartTime.slice(0,5) === slot).map(item => item.scheduledEndTime).sort().slice(-1)[0] || slot)}</div>
                {DAYS.map(([key]) => {
                    const items = classes.filter(item => item.dayOfWeek === key && item.scheduledStartTime.slice(0,5) === slot).sort((a,b) => a.scheduledStartTime.localeCompare(b.scheduledStartTime));
                    return <div key={key} className={`min-h-28 border-r border-slate-100 p-2 last:border-r-0 ${key === todayKey ? "bg-blue-50/30" : ""}`}>
                        <div className="space-y-2">{items.map(item => <ClassTile key={item.timetableId} item={item} today={today} busy={actionLoading === item.timetableId || (item.sessionId !== null && actionLoading === item.sessionId)} onStart={onStart} onEnd={onEnd}/>)}</div>
                    </div>;
                })}
            </div>)}
        </div></div>
        <footer className="flex flex-wrap items-center gap-4 border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-blue-200"/> Today's eligible class</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-red-200"/> In progress</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-200"/> Completed</span>
            <span className="ml-auto text-slate-400">Scroll horizontally to view all weekdays</span>
        </footer>
    </section>;
}
