import { useEffect, useState } from "react";
import { FileChartColumn, FileSpreadsheet, FileText, Eye, RefreshCw, X } from "lucide-react";
import toast from "react-hot-toast";
import ContextualReportButton from "./ContextualReportButton";
import { getAdminAssessments } from "../../assessments/services/adminAssessmentService";
import type { AdminAssessmentItem } from "../../assessments/types/adminAssessment";
import { previewAcademicPerformanceReport, downloadAcademicPerformanceReport, type ReportData } from "../services/reportService";
import api from "../../../api/axios";

export default function AcademicPerformanceReportButton() {
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState<AdminAssessmentItem[]>([]);
    const [assessmentId, setAssessmentId] = useState("");
    const [data, setData] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState<"pdf" | "xlsx" | null>(null);

    useEffect(() => {
        if (!open) return;
        getAdminAssessments().then(setItems).catch(() => toast.error("Unable to load assessments."));
    }, [open]);

    const preview = async () => {
        if (!assessmentId) { toast.error("Select an assessment first."); return; }
        setLoading(true); setData(null);
        try { setData(await previewAcademicPerformanceReport(Number(assessmentId))); }
        catch (error: any) { toast.error(error?.response?.data?.message || "Unable to generate academic performance report."); }
        finally { setLoading(false); }
    };

    const exportFile = async (format: "pdf" | "xlsx") => {
        const selected = items.find(item => item.id === Number(assessmentId));
        setExporting(format);
        try {
            const stem = ["Academic-Performance", selected?.title, selected?.gradeName, selected?.sectionName, selected?.subjectName]
                .filter(Boolean).join("_").replace(/[^a-zA-Z0-9-_]+/g, "-").replace(/-+/g, "-");
            await downloadAcademicPerformanceReport(Number(assessmentId), format, stem);
            toast.success(`Report downloaded as ${format.toUpperCase()}.`);
        } catch (error: any) { toast.error(error?.response?.data?.message || "Unable to export report."); }
        finally { setExporting(null); }
    };

    return <>
        <button type="button" aria-label="Generate report" title="Academic Performance Report"
            onClick={() => setOpen(true)}
            className="fixed bottom-8 right-8 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-white text-brand shadow-lg transition hover:scale-110 hover:bg-brand-soft focus:outline-none focus:ring-4 focus:ring-brand/20">
            <FileChartColumn size={24} strokeWidth={2.2}/>
        </button>
        {open && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-3 sm:p-6" onClick={event => { if(event.target===event.currentTarget) setOpen(false); }}>
            <section role="dialog" aria-modal="true" aria-labelledby="academic-performance-title" className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
                <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                    <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand"><FileChartColumn size={20}/></span><div><h2 id="academic-performance-title" className="font-semibold text-slate-900">Academic Performance Report</h2><p className="text-xs text-slate-500">Preview and export student performance for an assessment</p></div></div>
                    <button type="button" onClick={()=>setOpen(false)} aria-label="Close report dialog" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={20}/></button>
                </header>
                <div className="space-y-4 overflow-y-auto p-5">
                    <label className="block"><span className="mb-1.5 block text-sm font-medium text-slate-700">Assessment</span>
                        <select value={assessmentId} onChange={e=>{setAssessmentId(e.target.value);setData(null);}} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand">
                            <option value="">Select assessment</option>
                            {items.map(a=><option key={a.id} value={a.id}>{a.title} · {a.subjectName} · {a.gradeName} {a.sectionName} · {a.status}{a.resultsPublished?" · Results Published":""}</option>)}
                        </select>
                    </label>
                    {assessmentId && <div className="rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-500">The report covers the selected assessment and its enrolled class. Unpublished marks are not presented as official results.</div>}
                    <div className="flex justify-end"><button type="button" onClick={()=>void preview()} disabled={loading||!assessmentId} className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-60">{loading?<RefreshCw size={16} className="animate-spin"/>:<Eye size={16}/>} {loading?"Generating preview…":"Generate Preview"}</button></div>
                    {data && <div className="overflow-hidden rounded-xl border border-slate-200">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
                            <div className="flex items-center gap-3">{data.school.logoUrl&&<img src={`${api.defaults.baseURL??"/api"}${data.school.logoUrl}`} alt="" className="h-11 w-11 rounded-lg object-contain"/>}<div><p className="font-semibold" style={{color:data.school.primaryColor}}>{data.school.name}</p><h3 className="font-medium text-slate-900">{data.reportTitle}</h3><p className="text-xs text-slate-500">{data.academicYear??""} · {data.generatedAt}</p></div></div>
                            <div className="flex gap-2"><button type="button" onClick={()=>void exportFile("pdf")} disabled={!!exporting} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50">{exporting==="pdf"?<RefreshCw size={15} className="animate-spin"/>:<FileText size={15}/>} PDF</button><button type="button" onClick={()=>void exportFile("xlsx")} disabled={!!exporting} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50">{exporting==="xlsx"?<RefreshCw size={15} className="animate-spin"/>:<FileSpreadsheet size={15}/>} Excel</button></div>
                        </div>
                        {data.school.tagline&&<p className="px-4 pt-3 text-sm text-slate-500">{data.school.tagline}</p>}
                        {data.summary?.length>0&&<div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-4">{data.summary.map(m=><div key={m.label} className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-medium text-slate-500">{m.label}</p><p className="mt-1 text-lg font-semibold text-slate-800">{m.value}</p></div>)}</div>}
                        <div className="max-h-[48vh] overflow-auto"><table className="min-w-full divide-y divide-slate-200 text-sm"><thead className="sticky top-0 z-10" style={{backgroundColor:data.school.primaryColor}}><tr>{data.columns.map(col=><th key={col} className="whitespace-nowrap px-4 py-3 text-left font-semibold text-white">{col}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{data.rows.map((row,i)=><tr key={i} className={i%2?"bg-slate-50":"bg-white"}>{data.columns.map((col,j)=><td key={col} className="whitespace-nowrap px-4 py-3 text-slate-700">{row[j]??""}</td>)}</tr>)}{data.rows.length===0&&<tr><td colSpan={data.columns.length} className="px-6 py-10 text-center text-slate-500">No students found for this assessment's class.</td></tr>}</tbody></table></div>
                        <div className="border-t border-slate-200 px-4 py-3 text-xs text-slate-500" style={{borderTopColor:data.school.accentColor}}>{data.rows.length} student record(s) · Preview only</div>
                    </div>}
                </div>
            </section>
        </div>}
    </>;
}
