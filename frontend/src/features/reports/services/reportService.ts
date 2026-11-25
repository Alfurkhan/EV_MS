import api from "../../../api/axios";

export type ReportData = {
    reportTitle: string;
    generatedAt: string;
    academicYear: string | null;
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
};

export type ReportFilters = {
    academicYearId?: number;
    gradeId?: number;
    sectionId?: number;
    subjectId?: number;
    accountStatus?: string;
};

function queryParams(filters: ReportFilters) {
    return Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value !== undefined && value !== null),
    );
}

export async function previewStudentRoster(filters: ReportFilters): Promise<ReportData> {
    const { data } = await api.get<ReportData>("/reports/student-roster", { params: queryParams(filters) });
    return data;
}

export async function previewFacultyDirectory(filters: ReportFilters = {}): Promise<ReportData> {
    const { data } = await api.get<ReportData>("/reports/faculty-directory", { params: queryParams(filters) });
    return data;}

export async function previewMyClassStrength(academicYearId?: number): Promise<ReportData> {
    const { data } = await api.get<ReportData>("/reports/my-class-strength", {
        params: queryParams({ academicYearId }),
    });
    return data;
}

export async function downloadReport(
    report: "student-roster" | "faculty-directory" | "my-class-strength",
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
    anchor.download = `${filenameStem || report}-report.${format}`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(blobUrl);
}
