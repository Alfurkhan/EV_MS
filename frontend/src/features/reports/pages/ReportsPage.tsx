import { useEffect, useMemo, useState } from "react";
import { FileSpreadsheet, FileText, GraduationCap, Users, RefreshCw, Download, Eye, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../../api/axios";
import { useAuth } from "../../../contexts/AuthContext";
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

type ReportKind = "student-roster" | "faculty-directory" | "my-class-strength";

const REPORTS: {
    id: ReportKind;
    title: string;
    description: string;
    icon: typeof Users;
    admin: boolean;
    faculty: boolean;
}[] = [
    {
        id: "student-roster",
        title: "Student Strength & Roster",
        description: "Enrollment list organized by academic year, grade, and section.",
        icon: Users,
        admin: true,
        faculty: true,
    },
    {
        id: "faculty-directory",
        title: "Faculty Directory",
        description: "Faculty contact details, assigned subjects, and account status.",
        icon: GraduationCap,
        admin: true,
        faculty: false,
    },
    {
        id: "my-class-strength",
        title: "My Class Strength",
        description: "Student counts for your assigned classes and sections.",
        icon: Users,
        admin: false,
        faculty: true,
    },
];

export default function ReportsPage() {
    const { hasRole } = useAuth();
    const isAdmin = hasRole("ROLE_ADMIN");
    const isFaculty = hasRole("ROLE_FACULTY");
    const availableReports = REPORTS.filter((report) => (isAdmin && report.admin) || (isFaculty && report.faculty));

    const [selectedReport, setSelectedReport] = useState<ReportKind>("student-roster");
    const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
    const [grades, setGrades] = useState<Grade[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [filters, setFilters] = useState<ReportFilters>({});
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState<"pdf" | "xlsx" | null>(null);

    const selectedReportMeta = availableReports.find((report) => report.id === selectedReport);

    useEffect(() => {
        if (!availableReports.some((report) => report.id === selectedReport)) {
            setSelectedReport(availableReports[0]?.id ?? "student-roster");
        }
    }, [availableReports, selectedReport]);

    useEffect(() => {
        getAcademicYears()
            .then((years) => {
                setAcademicYears(years);
                const active = years.find((year) => year.active) ?? years[0];
                if (active) setFilters((current) => ({ ...current, academicYearId: current.academicYearId ?? active.id }));
            })
            .catch(() => toast.error("Unable to load academic years."));
    }, []);

    useEffect(() => {
        if (!isAdmin || !filters.academicYearId) {
            setGrades([]);
            return;
        }
        getGradesByAcademicYear(filters.academicYearId)
            .then(setGrades)
            .catch(() => toast.error("Unable to load grades."));
    }, [isAdmin, filters.academicYearId]);

    useEffect(() => {
        if (!isAdmin || !filters.gradeId) {
            setSections([]);
            return;
        }
        getSectionsByGrade(filters.gradeId)
            .then(setSections)
            .catch(() => toast.error("Unable to load sections."));
    }, [isAdmin, filters.gradeId]);

    const effectiveFilters = useMemo(() => ({
        ...(filters.academicYearId ? { academicYearId: filters.academicYearId } : {}),
        ...(isAdmin && filters.gradeId ? { gradeId: filters.gradeId } : {}),
        ...(isAdmin && filters.sectionId ? { sectionId: filters.sectionId } : {}),
    }), [filters, isAdmin]);

    const loadPreview = async () => {
        setLoading(true);
        try {
            const result = selectedReport === "student-roster"
                ? await previewStudentRoster(effectiveFilters)
                : selectedReport === "faculty-directory"
                    ? await previewFacultyDirectory()
                    : await previewMyClassStrength(filters.academicYearId);
            setReportData(result);
        } catch (error: any) {
            setReportData(null);
            toast.error(error?.response?.data?.message || "Unable to generate report preview.");
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async (format: "pdf" | "xlsx") => {
        setExporting(format);
        try {
            await downloadReport(selectedReport, format, effectiveFilters);
            toast.success(`Report downloaded as ${format.toUpperCase()}.`);
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Unable to download report.");
        } finally {
            setExporting(null);
        }
    };

    const chooseReport = (kind: ReportKind) => {
        setSelectedReport(kind);
        setReportData(null);
        if (kind === "faculty-directory") setFilters({});
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900">Reports & Documents</h1>
                    <p className="mt-1 text-sm text-slate-500">Preview and export school reports using your authorized data.</p>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
                    <FileText size={17} className="text-brand" />
                    PDF and Excel exports
                </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {availableReports.map((report) => {
                    const Icon = report.icon;
                    const active = selectedReport === report.id;
                    return (
                        <button
                            key={report.id}
                            type="button"
                            onClick={() => chooseReport(report.id)}
                            className={`rounded-2xl border bg-white p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${active ? "border-brand ring-1 ring-brand/20" : "border-slate-200"}`}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
                                    <Icon size={20} />
                                </span>
                                <ChevronRight size={18} className={active ? "text-brand" : "text-slate-400"} />
                            </div>
                            <h2 className="mt-3 font-semibold text-slate-900">{report.title}</h2>
                            <p className="mt-1 text-sm leading-5 text-slate-500">{report.description}</p>
                        </button>
                    );
                })}
            </div>

            {selectedReportMeta && (
                <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div className="flex-1">
                            <h2 className="text-lg font-semibold text-slate-900">{selectedReportMeta.title}</h2>
                            <p className="mt-1 text-sm text-slate-500">Configure the filters, then generate a preview before exporting.</p>
                            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {(selectedReport === "student-roster" || selectedReport === "my-class-strength") && (
                                    <label className="block">
                                        <span className="mb-1.5 block text-sm font-medium text-slate-700">Academic Year</span>
                                        <select
                                            value={filters.academicYearId ?? ""}
                                            onChange={(event) => setFilters((current) => ({ ...current, academicYearId: event.target.value ? Number(event.target.value) : undefined, gradeId: undefined, sectionId: undefined }))}
                                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand"
                                        >
                                            <option value="">Active / default academic year</option>
                                            {academicYears.map((year) => <option key={year.id} value={year.id}>{year.name}{year.active ? " (Active)" : ""}</option>)}
                                        </select>
                                    </label>
                                )}
                                {isAdmin && selectedReport === "student-roster" && (
                                    <>
                                        <label className="block">
                                            <span className="mb-1.5 block text-sm font-medium text-slate-700">Grade</span>
                                            <select
                                                value={filters.gradeId ?? ""}
                                                onChange={(event) => setFilters((current) => ({ ...current, gradeId: event.target.value ? Number(event.target.value) : undefined, sectionId: undefined }))}
                                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand"
                                            >
                                                <option value="">All grades</option>
                                                {grades.map((grade) => <option key={grade.id} value={grade.id}>{grade.name}</option>)}
                                            </select>
                                        </label>
                                        <label className="block">
                                            <span className="mb-1.5 block text-sm font-medium text-slate-700">Section</span>
                                            <select
                                                value={filters.sectionId ?? ""}
                                                disabled={!filters.gradeId}
                                                onChange={(event) => setFilters((current) => ({ ...current, sectionId: event.target.value ? Number(event.target.value) : undefined }))}
                                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand disabled:bg-slate-50"
                                            >
                                                <option value="">All sections</option>
                                                {sections.map((section) => <option key={section.id} value={section.id}>{section.name}</option>)}
                                            </select>
                                        </label>
                                    </>
                                )}
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={loadPreview}
                            disabled={loading}
                            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-hover disabled:opacity-60"
                        >
                            {loading ? <RefreshCw size={16} className="animate-spin" /> : <Eye size={16} />}
                            {loading ? "Generating…" : "Generate Preview"}
                        </button>
                    </div>
                </section>
            )}

            {reportData && (
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                            {reportData.school.logoUrl && <img src={`${api.defaults.baseURL ?? "/api"}${reportData.school.logoUrl}`} alt="" className="h-12 w-12 rounded-lg object-contain" />}
                            <div className="min-w-0">
                                <p className="font-semibold" style={{ color: reportData.school.primaryColor }}>{reportData.school.name}</p>
                                <h3 className="font-medium text-slate-900">{reportData.reportTitle}</h3>
                                <p className="text-xs text-slate-500">Generated {reportData.generatedAt}{reportData.academicYear ? ` · ${reportData.academicYear}` : ""}</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button type="button" onClick={() => handleExport("pdf")} disabled={!!exporting} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50">
                                {exporting === "pdf" ? <RefreshCw size={15} className="animate-spin" /> : <Download size={15} />}
                                PDF
                            </button>
                            <button type="button" onClick={() => handleExport("xlsx")} disabled={!!exporting} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50">
                                {exporting === "xlsx" ? <RefreshCw size={15} className="animate-spin" /> : <FileSpreadsheet size={15} />}
                                Excel
                            </button>
                        </div>
                    </div>
                    {reportData.school.tagline && <div className="px-4 pt-3 text-sm text-slate-500">{reportData.school.tagline}</div>}
                    <div className="max-h-[65vh] overflow-auto">
                        <table className="min-w-full divide-y divide-slate-200 text-sm">
                            <thead className="sticky top-0 z-10" style={{ backgroundColor: reportData.school.primaryColor }}>
                                <tr>{reportData.columns.map((column) => <th key={column} className="whitespace-nowrap px-4 py-3 text-left font-semibold text-white">{column}</th>)}</tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {reportData.rows.map((row, index) => (
                                    <tr key={index} className={index % 2 ? "bg-slate-50" : "bg-white"}>
                                        {reportData.columns.map((column, colIndex) => <td key={column} className="whitespace-nowrap px-4 py-3 text-slate-700">{row[colIndex] ?? ""}</td>)}
                                    </tr>
                                ))}
                                {reportData.rows.length === 0 && <tr><td colSpan={reportData.columns.length} className="px-6 py-12 text-center text-slate-500">No records match the selected filters.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                    <div className="border-t border-slate-200 px-4 py-3 text-xs text-slate-500" style={{ borderTopColor: reportData.school.accentColor }}>
                        {reportData.rows.length} record{reportData.rows.length === 1 ? "" : "s"} · Preview only
                    </div>
                </section>
            )}
        </div>
    );
}
