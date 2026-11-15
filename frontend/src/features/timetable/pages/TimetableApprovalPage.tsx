import { useEffect, useState } from "react";
import { approveTimetable, getPendingTimetableApprovals, rejectTimetable } from "../services/timetableService";
import type { Timetable } from "../types/timetable";
import toast from "react-hot-toast";

export default function TimetableApprovalPage() {
    const [items,setItems]=useState<Timetable[]>([]);
    const [loading,setLoading]=useState(true);
    const refresh=async()=>{setLoading(true);try{setItems(await getPendingTimetableApprovals());}catch{toast.error("Could not load pending timetables.");}finally{setLoading(false);}};
    useEffect(()=>{void refresh();},[]);
    const approve=async(id:number)=>{try{await approveTimetable(id);toast.success("Timetable approved and published.");await refresh();}catch(error:any){toast.error(error?.response?.data?.message??"Approval failed. Check for timetable conflicts.");}};
    const reject=async(id:number)=>{const reason=window.prompt("Enter the reason for rejection:");if(!reason?.trim())return;try{await rejectTimetable(id,reason.trim());toast.success("Timetable rejected.");await refresh();}catch{toast.error("Could not reject timetable.");}};
    return <div className="mx-auto max-w-6xl space-y-5">
        <header><h1 className="text-2xl font-bold text-slate-900">Timetable Approval Queue</h1><p className="mt-1 text-sm text-slate-600">Review faculty submissions. Approving publishes the timetable to students; rejection requires a reason.</p></header>
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
            {loading?<p className="text-sm text-slate-500">Loading submissions…</p>:items.length===0?<p className="text-sm text-slate-500">There are no pending submissions.</p>:
            <div className="space-y-4">{items.map(item=><article key={item.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-4"><div>
                    <h2 className="font-semibold text-slate-900">{item.subjectName} ({item.subjectCode})</h2>
                    <p className="mt-1 text-sm text-slate-600">{item.facultyName} · Grade {item.gradeName}, Section {item.sectionName}</p>
                    <p className="text-sm text-slate-600">{item.dayOfWeek}, {item.startTime}–{item.endTime} · {item.startDate} to {item.endDate}</p>
                    <p className="text-sm text-slate-600">{item.classType==="ONLINE"?item.meetingLink:item.room}</p>
                    {item.notes&&<p className="mt-1 text-sm text-slate-500">Notes: {item.notes}</p>}
                </div><div className="flex gap-2"><button onClick={()=>void approve(item.id)} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">Approve</button><button onClick={()=>void reject(item.id)} className="rounded-lg border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-700">Reject</button></div></div>
            </article>)}</div>}
        </section>
    </div>;
}
