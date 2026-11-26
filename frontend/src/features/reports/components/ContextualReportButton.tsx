import { useEffect, useRef, useState } from "react";
import { FileChartColumn, FileSpreadsheet, FileText, Eye, RefreshCw, X } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../../api/axios";
import { getAcademicYears, type AcademicYear } from "../../academic/services/academicYearService";
import { getGradesByAcademicYear, type Grade } from "../../academic/services/gradeService";
import { getSectionsByGrade, type Section } from "../../academic/services/sectionService";
import { getAllSubjects, type Subject } from "../../academic/services/subjectService";
import {
    downloadReport,
    previewFacultyDirectory,
    previewMyClassStrength,
    previewStudentRoster,
    previewAttendanceReport,
    getFacultyReportScope,
    type FacultyReportScopeOption,
    type ReportData,
    type ReportFilters,
} from "../services/reportService";

export type ContextReportKind = "student-roster" | "faculty-directory" | "my-class-strength" | "attendance";

type Props = { report: ContextReportKind };

const reportTitles: Record<ContextReportKind, string> = {
    "student-roster": "Student Strength & Roster",
    "faculty-directory": "Faculty Directory",
    "my-class-strength": "My Class Strength",
    "attendance": "Attendance Report",
};

export default function ContextualReportButton({ report }: Props) {
    const [open, setOpen] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
    const [grades, setGrades] = useState<Grade[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [facultyScope, setFacultyScope] = useState<FacultyReportScopeOption[]>([]);
    const [isFacultyScope, setIsFacultyScope] = useState(false);
    const [filters, setFilters] = useState<ReportFilters>({ accountStatus: "all" });
    const [data, setData] = useState<ReportData | null>(null);
    const [previewStale, setPreviewStale] = useState(false);
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState<"pdf" | "xlsx" | null>(null);
    const previewRequestRef = useRef(0);

    const updateReportFilters = (updater: (current: ReportFilters) => ReportFilters) => {
        previewRequestRef.current += 1;
        setData(null);
        setPreviewStale(true);
        setLoading(false);
        setFilters(updater);
    };

    useEffect(() => {
        const showButton = () => {
            setIsVisible(true);
            if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
            hideTimerRef.current = setTimeout(() => setIsVisible(false), 4000);
        };
        window.addEventListener("mousemove", showButton);
        return () => {
            window.removeEventListener("mousemove", showButton);
            if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        };
    }, []);

    useEffect(() => {
        if (!open) return;
        if (report === "faculty-directory") {
            getAllSubjects().then(setSubjects).catch(() => toast.error("Unable to load subjects."));
            return;
        }
        getAcademicYears().then((years) => {
            setAcademicYears(years);
            const active = years.find((year) => year.active) ?? years[0];
            setFilters((current) => ({ ...current, academicYearId: current.academicYearId ?? active?.id,
                ...(report === "attendance" && !current.startDate && active ? { startDate: active.startDate, endDate: active.endDate, status: "ALL" } : {}) }));
        }).catch(() => toast.error("Unable to load academic years."));
    }, [open, report]);

    useEffect(() => {
        if (!open || !filters.academicYearId || !["student-roster", "attendance", "my-class-strength"].includes(report)) {
            setFacultyScope([]);
            setIsFacultyScope(false);
            return;
        }
        let cancelled = false;
        getFacultyReportScope(filters.academicYearId, report).then((scope) => {
            if (cancelled) return;
            setFacultyScope(scope);
            setIsFacultyScope(true);
            const uniqueGrades = [...new Map(scope.map(item => [item.gradeId, item])).values()];
            if (uniqueGrades.length === 1) {
                setFilters(current => ({ ...current, gradeId: uniqueGrades[0].gradeId, sectionId: undefined }));
            } else {
                setFilters(current => ({ ...current, gradeId: current.gradeId && uniqueGrades.some(g => g.gradeId === current.gradeId) ? current.gradeId : undefined, sectionId: undefined }));
            }
        }).catch((error: any) => {
            if (cancelled) return;
            if (error?.response?.status === 403) {
                setIsFacultyScope(false);
                setFacultyScope([]);
            } else {
                toast.error("Unable to load your assigned report classes.");
            }
        });
        return () => { cancelled = true; };
    }, [open, report, filters.academicYearId]);

    useEffect(() => {
        if (!open || !["student-roster", "attendance", "my-class-strength"].includes(report) || !filters.academicYearId) {
            setGrades([]);
            return;
        }
        getGradesByAcademicYear(filters.academicYearId).then(allGrades => {
            setGrades(isFacultyScope ? allGrades.filter(grade => facultyScope.some(scope => scope.gradeId === grade.id)) : allGrades);
        }).catch(() => toast.error("Unable to load grades."));
    }, [open, report, filters.academicYearId, isFacultyScope, facultyScope]);

    useEffect(() => {
        if (!open || !["student-roster", "attendance", "my-class-strength"].includes(report) || !filters.gradeId) {
            setSections([]);
            return;
        }
        getSectionsByGrade(filters.gradeId).then(allSections => {
            setSections(isFacultyScope ? allSections.filter(section => facultyScope.some(scope => scope.gradeId === filters.gradeId && scope.sectionId === section.id)) : allSections);
        }).catch(() => toast.error("Unable to load sections."));
    }, [open, report, filters.gradeId, isFacultyScope, facultyScope]);

    const preview = async () => {
        const requestId = ++previewRequestRef.current;
        setLoading(true);
        try {
            const result = report === "student-roster"
                ? await previewStudentRoster(filters)
                : report === "faculty-directory"
                    ? await previewFacultyDirectory(filters)
                    : report === "attendance"
                        ? await previewAttendanceReport(filters)
                        : await previewMyClassStrength(filters);
            if (requestId === previewRequestRef.current) {
                setData(result);
                setPreviewStale(false);
            }
        } catch (error: any) {
            if (requestId === previewRequestRef.current) {
                setData(null);
                toast.error(error?.response?.data?.message || "Unable to generate report preview.");
            }
        } finally {
            if (requestId === previewRequestRef.current) setLoading(false);
        }
    };

    const exportFile = async (format: "pdf" | "xlsx") => {
        setExporting(format);
        try {
            const facultyTag = data?.preparedBy ? ["Faculty", data.preparedBy] : undefined;
            const assignedGradeNames = [...new Set(facultyScope.map(scope => scope.gradeName))];
            const gradeTag = filters.gradeId ? grades.find(g => g.id === filters.gradeId)?.name
                : isFacultyScope ? assignedGradeNames.join("-") || "Assigned-Grades" : "All-Grades";
            const dateTag = (value?: string) => value ? value.split("-").reverse().join("-") : undefined;
            const stem = report === "student-roster"
                ? ["Student-Roster", academicYears.find(y => y.id === filters.academicYearId)?.name, facultyTag, gradeTag, filters.sectionId ? sections.find(s => s.id === filters.sectionId)?.name : undefined].filter(Boolean).join("_")
                : report === "faculty-directory"
                    ? ["Faculty-Directory", filters.subjectId ? subjects.find(s => s.id === filters.subjectId)?.name : "All-Subjects", filters.accountStatus && filters.accountStatus !== "all" ? filters.accountStatus : undefined].filter(Boolean).join("_")
                    : report === "attendance"
                    ? ["Attendance", academicYears.find(y => y.id === filters.academicYearId)?.name, facultyTag, gradeTag, filters.sectionId ? sections.find(s => s.id === filters.sectionId)?.name : undefined, dateTag(filters.startDate), dateTag(filters.endDate), filters.status !== "ALL" ? filters.status : undefined].filter(Boolean).join("_")
                    : ["My-Class-Strength", academicYears.find(y => y.id === filters.academicYearId)?.name, facultyTag, gradeTag, filters.sectionId ? sections.find(s => s.id === filters.sectionId)?.name : undefined].filter(Boolean).join("_");
            const safeStem = stem.replace(/[^a-zA-Z0-9-_]+/g, "-").replace(/-+/g, "-");
            await downloadReport(report, format, filters, safeStem);
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
                className={`fixed bottom-8 right-8 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-white text-brand shadow-lg transition-all duration-300 ease-out hover:scale-110 hover:bg-brand-soft focus:outline-none focus:ring-4 focus:ring-brand/20 focus-visible:opacity-100 focus-visible:pointer-events-auto ${isVisible ? "translate-y-0 scale-100 opacity-100" : "pointer-events-none translate-y-4 scale-75 opacity-0"}`}
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
                            {report === "faculty-directory" && <div className="grid gap-3 sm:grid-cols-2">
                                <label className="block"><span className="mb-1.5 block text-sm font-medium text-slate-700">Subject</span>
                                    <select value={filters.subjectId ?? ""} onChange={event => updateReportFilters(current => ({...current, subjectId: event.target.value ? Number(event.target.value) : undefined}))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand">
                                        <option value="">All subjects</option>{subjects.map(subject => <option key={subject.id} value={subject.id}>{subject.name} ({subject.code})</option>)}
                                    </select></label>
                                <label className="block"><span className="mb-1.5 block text-sm font-medium text-slate-700">Account status</span>
                                    <select value={filters.accountStatus ?? "all"} onChange={event => updateReportFilters(current => ({...current, accountStatus: event.target.value}))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand">
                                        <option value="all">All accounts</option><option value="enabled">Enabled only</option><option value="disabled">Disabled only</option>
                                    </select></label>
                            </div>}
                            {report !== "faculty-directory" && (
                                <div className={"grid gap-3 sm:grid-cols-2 " + (["student-roster", "attendance", "my-class-strength"].includes(report) ? "lg:grid-cols-3" : "")}>
                                    <label className="block">
                                        <span className="mb-1.5 block text-sm font-medium text-slate-700">Academic Year</span>
                                        <select value={filters.academicYearId ?? ""} onChange={(event) => { const selectedYear = academicYears.find(year => year.id === Number(event.target.value)) ?? academicYears.find(year => year.active) ?? academicYears[0]; updateReportFilters((current) => ({ ...current, academicYearId: event.target.value ? Number(event.target.value) : undefined, gradeId: undefined, sectionId: undefined, ...(report === "attendance" ? { startDate: selectedYear?.startDate, endDate: selectedYear?.endDate } : {}) })); }} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand">
                                            <option value="">Active / default academic year</option>
                                            {academicYears.map((year) => <option key={year.id} value={year.id}>{year.name}{year.active ? " (Active)" : ""}</option>)}
                                        </select>
                                    </label>
                                    {["student-roster", "attendance", "my-class-strength"].includes(report) && <>
                                        <label className="block">
                                            <span className="mb-1.5 block text-sm font-medium text-slate-700">Grade</span>
                                            <select value={filters.gradeId ?? ""} disabled={isFacultyScope && grades.length === 1} onChange={(event) => updateReportFilters((current) => ({ ...current, gradeId: event.target.value ? Number(event.target.value) : undefined, sectionId: undefined }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand disabled:bg-slate-50 disabled:text-slate-600">
                                                {isFacultyScope ? <option value="">All assigned grades</option> : <option value="">All grades</option>}
                                                {grades.map((grade) => <option key={grade.id} value={grade.id}>{grade.name}</option>)}
                                            </select>
                                        </label>
                                        <label className="block">
                                            <span className="mb-1.5 block text-sm font-medium text-slate-700">Section</span>
                                            <select value={filters.sectionId ?? ""} disabled={!filters.gradeId} onChange={(event) => updateReportFilters((current) => ({ ...current, sectionId: event.target.value ? Number(event.target.value) : undefined }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand disabled:bg-slate-50">
                                                <option value="">{isFacultyScope ? "All assigned sections" : "All sections"}</option>
                                                {sections.map((section) => <option key={section.id} value={section.id}>{section.name}</option>)}
                                            </select>
                                        </label>
                                    </>}
                                </div>
                            )}

                            {report === "attendance" && <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                <label className="block"><span className="mb-1.5 block text-sm font-medium text-slate-700">Start Date</span><input type="date" value={filters.startDate ?? ""} onChange={event => updateReportFilters(current => ({...current, startDate: event.target.value || undefined}))} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand" min={academicYears.find(year => year.id === filters.academicYearId)?.startDate} max={academicYears.find(year => year.id === filters.academicYearId)?.endDate} /></label>
                                <label className="block"><span className="mb-1.5 block text-sm font-medium text-slate-700">End Date</span><input type="date" value={filters.endDate ?? ""} onChange={event => updateReportFilters(current => ({...current, endDate: event.target.value || undefined}))} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand" min={academicYears.find(year => year.id === filters.academicYearId)?.startDate} max={academicYears.find(year => year.id === filters.academicYearId)?.endDate} /></label>
                                <label className="block"><span className="mb-1.5 block text-sm font-medium text-slate-700">Student Status</span><select value={filters.status ?? "ALL"} onChange={event => updateReportFilters(current => ({...current, status: event.target.value}))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand"><option value="ALL">All statuses</option><option value="PRESENT">Present</option><option value="ABSENT">Absent</option><option value="LATE">Late</option><option value="EXCUSED">Excused</option><option value="UNMARKED">Unmarked</option></select></label>
                            </div>}

                            <div className="flex justify-end">
                                <button type="button" onClick={preview} disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-hover disabled:opacity-60">
                                    {loading ? <RefreshCw size={16} className="animate-spin" /> : <Eye size={16} />}
                                    {loading ? "Generating preview…" : "Generate Preview"}
                                </button>
                            </div>

                            {previewStale && !data && <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Filters changed. Generate a new preview to view the updated report.</div>}
                            {data && <div className="overflow-hidden rounded-xl border border-slate-200">
                                <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex min-w-0 items-center gap-3">
                                        {data.school.logoUrl && <img src={`${api.defaults.baseURL ?? "/api"}${data.school.logoUrl}`} alt="" className="h-11 w-11 rounded-lg object-contain" />}
                                        <div className="min-w-0">
                                            <p className="font-semibold" style={{ color: data.school.primaryColor }}>{data.school.name}</p>
                                            <h3 className="font-medium text-slate-900">{data.reportTitle}</h3>
                                            <p className="text-xs text-slate-500">Generated {data.generatedAt}{data.academicYear ? ` · ${data.academicYear}` : ""}</p>
                                            {data.preparedBy && <p className="text-xs font-medium text-slate-600">Report prepared by: {data.preparedBy} (Faculty)</p>}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button type="button" onClick={() => exportFile("pdf")} disabled={!!exporting} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50">{exporting === "pdf" ? <RefreshCw size={15} className="animate-spin" /> : <FileText size={15} />} PDF</button>
                                        <button type="button" onClick={() => exportFile("xlsx")} disabled={!!exporting} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50">{exporting === "xlsx" ? <RefreshCw size={15} className="animate-spin" /> : <FileSpreadsheet size={15} />} Excel</button>
                                    </div>
                                </div>
                                {data.school.tagline && <p className="px-4 pt-3 text-sm text-slate-500">{data.school.tagline}</p>}
                                {data.summary && data.summary.length > 0 && <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-5">
                                    {data.summary.map(metric => <div key={metric.label} className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-medium text-slate-500">{metric.label}</p><p className="mt-1 text-lg font-semibold text-slate-800">{metric.value}</p></div>)}
                                </div>}
                                <div className="max-h-[48vh] overflow-auto">
                                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                                        <thead className="sticky top-0 z-10" style={{ backgroundColor: data.school.primaryColor }}>
                                            <tr>{data.columns.map((column) => <th key={column} className="whitespace-nowrap px-4 py-3 text-left font-semibold text-white">{column}</th>)}</tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {data.rows.map((row, index) => <tr key={index} className={data.columns.includes("Attendance Flag") && row[data.columns.indexOf("Attendance Flag")] === "Low Attendance" ? "bg-red-50" : data.columns.includes("Attendance Flag") && row[data.columns.indexOf("Attendance Flag")] === "Incomplete" ? "bg-amber-50" : index % 2 ? "bg-slate-50" : "bg-white"}>{data.columns.map((column, colIndex) => <td key={column} className={/^(student|faculty|faculty name)$/i.test(column.trim()) ? "min-w-[160px] max-w-[280px] whitespace-normal break-words px-4 py-3 text-slate-700" : "whitespace-nowrap px-4 py-3 text-slate-700"}>{row[colIndex] ?? ""}</td>)}</tr>)}
                                            {data.rows.length === 0 && <tr><td colSpan={data.columns.length} className="px-6 py-12 text-center text-slate-500">No records match the selected filters.</td></tr>}
                                        </tbody>
                                    </table>
                                </div>
                                {data.sections?.map(section => <div key={section.title} className="mt-4 overflow-hidden rounded-xl border border-slate-200">
                                    <div className="border-b border-slate-200 bg-slate-50 px-4 py-3"><h4 className="font-semibold text-slate-800">{section.title}</h4><p className="text-xs text-slate-500">{section.rows.length} record{section.rows.length === 1 ? "" : "s"}</p></div>
                                    <div className="max-h-[40vh] overflow-auto"><table className="min-w-full divide-y divide-slate-200 text-sm"><thead className="sticky top-0 z-10" style={{backgroundColor: data.school.primaryColor}}><tr>{section.columns.map(column => <th key={column} className="whitespace-nowrap px-3 py-2 text-left font-semibold text-white">{column}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{section.rows.map((row,index)=><tr key={index} className={index%2?"bg-slate-50":"bg-white"}>{section.columns.map((column,colIndex)=><td key={column} className={/^(student|faculty|faculty name)$/i.test(column.trim()) ? "min-w-[160px] max-w-[280px] whitespace-normal break-words px-3 py-2 text-slate-700" : "whitespace-nowrap px-3 py-2 text-slate-700"}>{row[colIndex] ?? ""}</td>)}</tr>)}{section.rows.length===0 && <tr><td colSpan={section.columns.length} className="px-5 py-8 text-center text-slate-500">{report === "my-class-strength" ? "No student records found." : "No session records found."}</td></tr>}</tbody></table></div>
                                </div>)}
                                <div className="border-t border-slate-200 px-4 py-3 text-xs text-slate-500" style={{ borderTopColor: data.school.accentColor }}>{data.rows.length} record{data.rows.length === 1 ? "" : "s"} · Preview only{report === "attendance" ? " · Student status filter does not limit the session audit" : ""}</div>
                            </div>}
                        </div>
                    </section>
                </div>
            )}
        </>
    );
}
