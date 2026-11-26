import api from "../../../api/axios";

export type ReportMetric = { label: string; value: string };
export type ReportSection = { title: string; columns: string[]; rows: string[][] };

export type ReportData = {
    reportTitle: string;
    generatedAt: string;
    academicYear: string | null;
    preparedBy?: string | null;
    school: {
        name: string;
        tagline: string;
        address: string;
        phone: string;
        email: string;
        website: string;
        logoUrl: string;
        primaryColor: string;
        accentColor: string;
    };
    columns: string[];
    rows: string[][];
    summary?: ReportMetric[];
    sections?: ReportSection[];
};

export type FacultyReportScopeOption = {
    gradeId: number;
    gradeName: string;
    sectionId: number;
    sectionName: string;
};

export type ReportFilters = {
    academicYearId?: number;
    gradeId?: number;
    sectionId?: number;
    subjectId?: number;
    accountStatus?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
    reportKind?: string;
};

function queryParams(filters: ReportFilters) {
    return Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value !== undefined && value !== null),
    );
}

export async function previewAttendanceReport(filters: ReportFilters): Promise<ReportData> {
    const { data } = await api.get<ReportData>("/reports/attendance", { params: queryParams(filters) });
    return data;
}

export async function previewStudentRoster(filters: ReportFilters): Promise<ReportData> {
    const { data } = await api.get<ReportData>("/reports/student-roster", { params: queryParams(filters) });
    return data;
}

export async function previewFacultyDirectory(filters: ReportFilters = {}): Promise<ReportData> {
    const { data } = await api.get<ReportData>("/reports/faculty-directory", { params: queryParams(filters) });
    return data;}

export async function getFacultyReportScope(academicYearId?: number, reportKind?: string): Promise<FacultyReportScopeOption[]> {
    const { data } = await api.get<FacultyReportScopeOption[]>("/reports/my-class-scope", {
        params: queryParams({ academicYearId, reportKind }),
    });
    return data;
}

export async function previewMyClassStrength(filters: ReportFilters = {}): Promise<ReportData> {
    const { data } = await api.get<ReportData>("/reports/my-class-strength", {
        params: queryParams(filters),
    });
    return data;
}

export async function previewAcademicPerformanceReport(assessmentId: number): Promise<ReportData> {
    const { data } = await api.get<ReportData>(`/reports/academic-performance/${assessmentId}`);
    return data;
}

export async function downloadAcademicPerformanceReport(assessmentId: number, format: "pdf" | "xlsx", filenameStem?: string): Promise<void> {
    const { data } = await api.get<Blob>(`/reports/academic-performance/${assessmentId}/export`, {
        params: { format }, responseType: "blob",
    });
    const blobUrl = URL.createObjectURL(data);
    const anchor = document.createElement("a");
    anchor.href = blobUrl;
    anchor.download = filenameStem ? `${filenameStem}.${format}` : `academic-performance-report.${format}`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(blobUrl);
}

export async function downloadReport(
    report: "student-roster" | "faculty-directory" | "my-class-strength" | "attendance",
    format: "pdf" | "xlsx",
    filters: ReportFilters = {},
    filenameStem?: string,
): Promise<void> {
    const { data } = await api.get<Blob>(`/reports/${report}/export`, {
        params: { ...queryParams(filters), format },
        responseType: "blob",
    });
    const blobUrl = URL.createObjectURL(data);
    const anchor = document.createElement("a");
    anchor.href = blobUrl;
    anchor.download = filenameStem ? `${filenameStem}.${format}` : `${report}-report.${format}`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(blobUrl);
}
