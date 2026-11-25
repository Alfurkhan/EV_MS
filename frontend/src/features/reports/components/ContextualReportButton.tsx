import { useEffect, useState } from "react";
import { FileChartColumn, FileSpreadsheet, FileText, Eye, RefreshCw, X } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../../api/axios";
import { getAcademicYears, type AcademicYear } from "../../academic/services/academicYearService";
import { getGradesByAcademicYear, type Grade } from "../../academic/services/gradeService";
import { getSectionsByGrade, type Section } from "../../academic/services/sectionService";
import {
    downloadReport,
    previewFacultyDirectory,
    previewMyClassStrength,
    previewStudentRoster,
    type ReportData,
    type ReportFilters,
} from "../services/reportService";

export type ContextReportKind = "student-roster" | "faculty-directory" | "my-class-strength";

type Props = { report: ContextReportKind };

const reportTitles: Record<ContextReportKind, string> = {
    "student-roster": "Student Strength & Roster",
    "faculty-directory": "Faculty Directory",
    "my-class-strength": "My Class Strength",
};

export default function ContextualReportButton({ report }: Props) {
    const [open, setOpen] = useState(false);
    const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
    const [grades, setGrades] = useState<Grade[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [filters, setFilters] = useState<ReportFilters>({});
    const [data, setData] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState<"pdf" | "xlsx" | null>(null);

    useEffect(() => {
        if (!open || report === "faculty-directory") return;
        getAcademicYears().then((years) => {
            setAcademicYears(years);
            const active = years.find((year) => year.active) ?? years[0];
            setFilters((current) => ({ ...current, academicYearId: current.academicYearId ?? active?.id }));
        }).catch(() => toast.error("Unable to load academic years."));
    }, [open, report]);

    useEffect(() => {
        if (!open || report !== "student-roster" || !filters.academicYearId) {
            setGrades([]);
            return;
        }
        getGradesByAcademicYear(filters.academicYearId).then(setGrades)
            .catch(() => toast.error("Unable to load grades."));
    }, [open, report, filters.academicYearId]);

    useEffect(() => {
        if (!open || report !== "student-roster" || !filters.gradeId) {
            setSections([]);
            return;
        }
        getSectionsByGrade(filters.gradeId).then(setSections)
            .catch(() => toast.error("Unable to load sections."));
    }, [open, report, filters.gradeId]);

    const preview = async () => {
        setLoading(true);
        try {
            const result = report === "student-roster"
                ? await previewStudentRoster(filters)
                : report === "faculty-directory"
                    ? await previewFacultyDirectory()
                    : await previewMyClassStrength(filters.academicYearId);
            setData(result);
        } catch (error: any) {
            setData(null);
            toast.error(error?.response?.data?.message || "Unable to generate report preview.");
        } finally {
            setLoading(false);
        }
    };

    const exportFile = async (format: "pdf" | "xlsx") => {
        setExporting(format);
        try {
            await downloadReport(report, format, filters);
            toast.success(`Report downloaded as ${format.toUpperCase()}.`);
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Unable to download report.");
        } finally {
            setExporting(null);
        }
    };

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                aria-label="Generate report"
                title="Generate report"
                className="fixed bottom-8 right-8 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-lg transition hover:scale-110 hover:bg-brand-hover focus:outline-none focus:ring-4 focus:ring-brand/20"
            >
                <FileChartColumn size={24} strokeWidth={2.2} />
            </button>

            {open && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-3 sm:p-6" onClick={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
                    <section role="dialog" aria-modal="true" aria-labelledby="context-report-title" className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
                        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                            <div className="flex items-center gap-3">
                                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand"><FileChartColumn size={20} /></span>
                                <div>
                                    <h2 id="context-report-title" className="font-semibold text-slate-900">{reportTitles[report]}</h2>
                                    <p className="text-xs text-slate-500">Preview and export the report for this page</p>
                                </div>
                            </div>
                            <button type="button" onClick={() => setOpen(false)} aria-label="Close report dialog" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={20} /></button>
                        </header>

                        <div className="space-y-4 overflow-y-auto p-5">
                            {report !== "faculty-directory" && (
                                <div className={"grid gap-3 sm:grid-cols-2 " + (report === "student-roster" ? "lg:grid-cols-3" : "")}>
                                    <label className="block">
                                        <span className="mb-1.5 block text-sm font-medium text-slate-700">Academic Year</span>
                                        <select value={filters.academicYearId ?? ""} onChange={(event) => setFilters((current) => ({ ...current, academicYearId: event.target.value ? Number(event.target.value) : undefined, gradeId: undefined, sectionId: undefined }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand">
                                            <option value="">Active / default academic year</option>
                                            {academicYears.map((year) => <option key={year.id} value={year.id}>{year.name}{year.active ? " (Active)" : ""}</option>)}
                                        </select>
                                    </label>
                                    {report === "student-roster" && <>
                                        <label className="block">
                                            <span className="mb-1.5 block text-sm font-medium text-slate-700">Grade</span>
                                            <select value={filters.gradeId ?? ""} onChange={(event) => setFilters((current) => ({ ...current, gradeId: event.target.value ? Number(event.target.value) : undefined, sectionId: undefined }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand">
                                                <option value="">All grades</option>
                                                {grades.map((grade) => <option key={grade.id} value={grade.id}>{grade.name}</option>)}
                                            </select>
                                        </label>
                                        <label className="block">
                                            <span className="mb-1.5 block text-sm font-medium text-slate-700">Section</span>
                                            <select value={filters.sectionId ?? ""} disabled={!filters.gradeId} onChange={(event) => setFilters((current) => ({ ...current, sectionId: event.target.value ? Number(event.target.value) : undefined }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand disabled:bg-slate-50">
                                                <option value="">All sections</option>
                                                {sections.map((section) => <option key={section.id} value={section.id}>{section.name}</option>)}
                                            </select>
                                        </label>
                                    </>}
                                </div>
                            )}

                            <div className="flex justify-end">
                                <button type="button" onClick={preview} disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-hover disabled:opacity-60">
                                    {loading ? <RefreshCw size={16} className="animate-spin" /> : <Eye size={16} />}
                                    {loading ? "Generating preview…" : "Generate Preview"}
                                </button>
                            </div>

                            {data && <div className="overflow-hidden rounded-xl border border-slate-200">
                                <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex min-w-0 items-center gap-3">
                                        {data.school.logoUrl && <img src={`${api.defaults.baseURL ?? "/api"}${data.school.logoUrl}`} alt="" className="h-11 w-11 rounded-lg object-contain" />}
                                        <div className="min-w-0">
                                            <p className="font-semibold" style={{ color: data.school.primaryColor }}>{data.school.name}</p>
                                            <h3 className="font-medium text-slate-900">{data.reportTitle}</h3>
                                            <p className="text-xs text-slate-500">Generated {data.generatedAt}{data.academicYear ? ` · ${data.academicYear}` : ""}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button type="button" onClick={() => exportFile("pdf")} disabled={!!exporting} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50">{exporting === "pdf" ? <RefreshCw size={15} className="animate-spin" /> : <FileText size={15} />} PDF</button>
                                        <button type="button" onClick={() => exportFile("xlsx")} disabled={!!exporting} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50">{exporting === "xlsx" ? <RefreshCw size={15} className="animate-spin" /> : <FileSpreadsheet size={15} />} Excel</button>
                                    </div>
                                </div>
                                {data.school.tagline && <p className="px-4 pt-3 text-sm text-slate-500">{data.school.tagline}</p>}
                                <div className="max-h-[48vh] overflow-auto">
                                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                                        <thead className="sticky top-0 z-10" style={{ backgroundColor: data.school.primaryColor }}>
                                            <tr>{data.columns.map((column) => <th key={column} className="whitespace-nowrap px-4 py-3 text-left font-semibold text-white">{column}</th>)}</tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {data.rows.map((row, index) => <tr key={index} className={index % 2 ? "bg-slate-50" : "bg-white"}>{data.columns.map((column, colIndex) => <td key={column} className="whitespace-nowrap px-4 py-3 text-slate-700">{row[colIndex] ?? ""}</td>)}</tr>)}
                                            {data.rows.length === 0 && <tr><td colSpan={data.columns.length} className="px-6 py-12 text-center text-slate-500">No records match the selected filters.</td></tr>}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="border-t border-slate-200 px-4 py-3 text-xs text-slate-500" style={{ borderTopColor: data.school.accentColor }}>{data.rows.length} record{data.rows.length === 1 ? "" : "s"} · Preview only</div>
                            </div>}
                        </div>
                    </section>
                </div>
            )}
        </>
    );
}
