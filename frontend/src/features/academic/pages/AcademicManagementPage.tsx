import { useEffect, useState, type ReactNode } from "react";
import {
    BookOpen,
    CalendarDays,
    ChevronDown,
    GraduationCap,
    PanelsTopLeft,
    Plus,
    RefreshCw,
    Users,
} from "lucide-react";
import toast from "react-hot-toast";

import AcademicYearTable from "../components/AcademicYearTable";
import AddAcademicYearModal from "../components/AddAcademicYearModal";
import ManageAcademicYearModal from "../components/ManageAcademicYearModal";

import {
    getAcademicYears,
    type AcademicYear,
} from "../services/academicYearService";

import GradeTable from "../components/GradeTable";

import {
    getGradesByAcademicYear,
    type Grade,
} from "../services/gradeService";

import AddGradeModal from "../components/AddGradeModal";
import ManageGradeModal from "../components/ManageGradeModal";

import SectionTable from "../components/SectionTable";
import AddSectionModal from "../components/AddSectionModal";
import ManageSectionModal from "../components/ManageSectionModal";

import StudentEnrollmentTable from "../components/StudentEnrollmentTable";
import ManageStudentEnrollmentModal from "../components/ManageStudentEnrollmentModal";

import {
    getSectionsByGrade,
    type Section,
} from "../services/sectionService";

import {
    getAllEnrollments,
    type StudentEnrollment,
} from "../services/studentEnrollmentService";

import AddStudentEnrollmentModal from "../components/AddStudentEnrollmentModal";
import SubjectsSection from "../components/SubjectsSection";
import AcademicFilterToolbar from "../components/AcademicFilterToolbar";

export default function AcademicManagementPage() {

    const [academicYears, setAcademicYears] =
        useState<AcademicYear[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [showAddModal, setShowAddModal] =
        useState(false);

    const [selectedAcademicYear, setSelectedAcademicYear] =
        useState<AcademicYear | null>(null);

    const [selectedAcademicYearId, setSelectedAcademicYearId] =
        useState<number | null>(null);

    const [grades, setGrades] =
        useState<Grade[]>([]);

    const [gradesLoading, setGradesLoading] =
        useState(false);

    const [showAddGradeModal, setShowAddGradeModal] =
        useState(false);

    /*
     * selectedGrade is ONLY used for the Manage Grade modal.
     */
    const [selectedGrade, setSelectedGrade] =
        useState<Grade | null>(null);

    const [showAddEnrollmentModal, setShowAddEnrollmentModal] =
        useState(false);

    /*
     * ============================================================
     * SECTION STATE
     * ============================================================
     */

    const [showAddSectionModal, setShowAddSectionModal] =
        useState(false);

    const [selectedSection, setSelectedSection] =
        useState<Section | null>(null);

    /*
     * selectedSectionGrade is ONLY used for the Sections area.
     *
     * This must remain separate from selectedGrade.
     */
    const [selectedSectionGrade, setSelectedSectionGrade] =
        useState<Grade | null>(null);

    const [sectionsByGrade, setSectionsByGrade] =
        useState<Record<number, Section[]>>({});

    const [openSectionGradeId, setOpenSectionGradeId] =
        useState<number | null>(null);

    const [sectionGradeLoadingId, setSectionGradeLoadingId] =
        useState<number | null>(null);

    /*
 * ============================================================
 * STUDENT ENROLLMENT STATE
 * ============================================================
 */

    const [enrollments, setEnrollments] =
        useState<StudentEnrollment[]>([]);

    const [enrollmentsLoading, setEnrollmentsLoading] =
        useState(false);

    const [selectedEnrollment, setSelectedEnrollment] =
        useState<StudentEnrollment | null>(null);

    type StatusFilter = "all" | "active" | "inactive";

    const [academicYearSearch, setAcademicYearSearch] = useState("");
    const [academicYearStatus, setAcademicYearStatus] = useState<StatusFilter>("all");
    const [gradeSearch, setGradeSearch] = useState("");
    const [gradeStatus, setGradeStatus] = useState<StatusFilter>("all");
    const [sectionSearch, setSectionSearch] = useState("");
    const [sectionGradeFilter, setSectionGradeFilter] = useState("all");
    const [sectionStatus, setSectionStatus] = useState<StatusFilter>("all");
    const [enrollmentSearch, setEnrollmentSearch] = useState("");
    const [enrollmentGradeFilter, setEnrollmentGradeFilter] = useState("all");
    const [enrollmentSectionFilter, setEnrollmentSectionFilter] = useState("all");
    const [enrollmentStatus, setEnrollmentStatus] = useState<StatusFilter>("all");
    const [subjectsFilterResetKey, setSubjectsFilterResetKey] = useState(0);
    const [sectionsPreloading, setSectionsPreloading] = useState(false);

    const activeGradeCount = grades.filter((grade) => grade.active).length;

    const filteredAcademicYears = academicYears.filter((academicYear) => {
        const query = academicYearSearch.trim().toLowerCase();
        const matchesSearch = !query || academicYear.name.toLowerCase().includes(query);
        const matchesStatus = academicYearStatus === "all" ||
            (academicYearStatus === "active" ? academicYear.active : !academicYear.active);
        return matchesSearch && matchesStatus;
    });

    const filteredGrades = grades.filter((grade) => {
        const query = gradeSearch.trim().toLowerCase();
        const matchesSearch = !query || grade.name.toLowerCase().includes(query) ||
            (grade.description ?? "").toLowerCase().includes(query);
        const matchesStatus = gradeStatus === "all" ||
            (gradeStatus === "active" ? grade.active : !grade.active);
        return matchesSearch && matchesStatus;
    });

    const matchesSection = (section: Section) => {
        const query = sectionSearch.trim().toLowerCase();
        const matchesSearch = !query || section.name.toLowerCase().includes(query) ||
            section.gradeName.toLowerCase().includes(query) ||
            (section.description ?? "").toLowerCase().includes(query);
        const matchesStatus = sectionStatus === "all" ||
            (sectionStatus === "active" ? section.active : !section.active);
        return matchesSearch && matchesStatus;
    };

    const filteredSectionGrades = grades.filter((grade) => {
        if (sectionGradeFilter !== "all" && grade.id !== Number(sectionGradeFilter)) return false;
        const query = sectionSearch.trim().toLowerCase();
        const gradeMatchesSearch = !query || grade.name.toLowerCase().includes(query);
        const gradeSections = sectionsByGrade[grade.id] ?? [];
        const hasLoadedSections = Object.prototype.hasOwnProperty.call(sectionsByGrade, grade.id);
        const hasMatchingSection = gradeSections.some(matchesSection);
        const matchesStatus = sectionStatus === "all" || !hasLoadedSections || hasMatchingSection;
        return (gradeMatchesSearch || hasMatchingSection || !hasLoadedSections) && matchesStatus;
    });

    const filteredEnrollments = enrollments.filter((enrollment) => {
        const query = enrollmentSearch.trim().toLowerCase();
        const matchesContext = selectedAcademicYearId === null ||
            enrollment.academicYearId === selectedAcademicYearId;
        const matchesSearch = !query ||
            enrollment.studentName.toLowerCase().includes(query) ||
            enrollment.studentEmail.toLowerCase().includes(query) ||
            String(enrollment.studentId).includes(query) ||
            enrollment.academicYearName.toLowerCase().includes(query) ||
            enrollment.gradeName.toLowerCase().includes(query) ||
            enrollment.sectionName.toLowerCase().includes(query);
        const matchesGrade = enrollmentGradeFilter === "all" ||
            enrollment.gradeId === Number(enrollmentGradeFilter);
        const matchesSection = enrollmentSectionFilter === "all" ||
            enrollment.sectionId === Number(enrollmentSectionFilter);
        const matchesStatus = enrollmentStatus === "all" ||
            (enrollmentStatus === "active" ? enrollment.active : !enrollment.active);
        return matchesContext && matchesSearch && matchesGrade && matchesSection && matchesStatus;
    });

    const enrollmentSectionOptions = Array.from(
        new Map(
            grades
                .filter((grade) => enrollmentGradeFilter === "all" ||
                    grade.id === Number(enrollmentGradeFilter))
                .flatMap((grade) =>
                    (sectionsByGrade[grade.id] ?? [])
                        .filter((section) => selectedAcademicYearId === null ||
                            section.academicYearId === selectedAcademicYearId)
                        .map((section) => [
                            section.id,
                            {
                                id: section.id,
                                name: section.name,
                                label: enrollmentGradeFilter === "all"
                                    ? `${grade.name} · ${section.name}`
                                    : section.name,
                            },
                        ] as const)
                )
        ).values()
    );

    /*
     * ============================================================
     * LOAD ACADEMIC YEARS
     * ============================================================
     */

    const loadAcademicYears = async (
        showRefreshState = false
    ) => {

        const refreshStartTime = Date.now();

        try {

            if (showRefreshState) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            const data =
                await getAcademicYears();

            setAcademicYears(data);

            const activeYear =
                data.find(
                    (academicYear) =>
                        academicYear.active
                );

            if (activeYear) {

                setSelectedAcademicYearId(
                    (current) =>
                        current ?? activeYear.id
                );

            } else if (data.length > 0) {

                setSelectedAcademicYearId(
                    (current) =>
                        current ?? data[0].id
                );
            }

        } catch (error: any) {

            console.error(error);

            toast.error(
                error?.response?.data?.message ||
                "Unable to load Academic Years."
            );

        } finally {

            if (showRefreshState) {

                const elapsed =
                    Date.now() - refreshStartTime;

                const minimumRefreshTime = 500;

                const remainingTime =
                    Math.max(
                        0,
                        minimumRefreshTime - elapsed
                    );

                setTimeout(() => {
                    setRefreshing(false);
                }, remainingTime);

            } else {

                setLoading(false);

            }
        }
    };


    /*
     * ============================================================
     * LOAD GRADES
     * ============================================================
     */

    const loadGrades = async (
        academicYearId: number
    ) => {

        try {

            setGradesLoading(true);

            const data =
                await getGradesByAcademicYear(
                    academicYearId
                );

            setGrades(data);

            /*
             * The currently selected Section Grade may belong
             * to the previous Academic Year.
             *
             * Clear it whenever the Grade list changes.
             */
            setSelectedSectionGrade(null);

        } catch (error: any) {

            console.error(error);

            toast.error(
                error?.response?.data?.message ||
                "Unable to load Grades."
            );

        } finally {

            setGradesLoading(false);

        }
    };


    /*
     * ============================================================
     * LOAD SECTIONS
     * ============================================================
     */

    const loadSections = async (
        gradeId: number
    ) => {

        try {

            setSectionGradeLoadingId(gradeId);

            const data =
                await getSectionsByGrade(
                    gradeId
                );

            setSectionsByGrade((current) => ({
                ...current,
                [gradeId]: data,
            }));


        } catch (error: any) {

            console.error(error);

            toast.error(
                error?.response?.data?.message ||
                "Unable to load Sections."
            );

        } finally {

            setSectionGradeLoadingId(null);

        }
    };

    /*
 * ============================================================
 * LOAD STUDENT ENROLLMENTS
 * ============================================================
 */

    const loadEnrollments = async () => {

        try {

            setEnrollmentsLoading(true);

            const data =
                await getAllEnrollments();

            setEnrollments(data);

        } catch (error: any) {

            console.error(error);

            toast.error(
                error?.response?.data?.message ||
                "Unable to load Student Enrollments."
            );

        } finally {

            setEnrollmentsLoading(false);

        }
    };

    /*
     * ============================================================
     * INITIAL LOAD
     * ============================================================
     */

    useEffect(() => {

        loadAcademicYears();
        loadEnrollments();

    }, []);


    /*
     * ============================================================
     * LOAD GRADES WHEN ACADEMIC YEAR CHANGES
     * ============================================================
     */

    useEffect(() => {

        if (
            selectedAcademicYearId !== null
        ) {

            loadGrades(
                selectedAcademicYearId
            );

        }

    }, [selectedAcademicYearId]);


    /*
     * ============================================================
     * ACADEMIC MANAGEMENT ACCORDION STATE
     * ============================================================
     */

    type AcademicSection =
        | "academicYears"
        | "grades"
        | "sections"
        | "subjects"
        | "enrollments";

    const [openSection, setOpenSection] =
        useState<AcademicSection | null>(null);

    const resetSectionFilters = (section: AcademicSection) => {
        switch (section) {
            case "academicYears":
                setAcademicYearSearch("");
                setAcademicYearStatus("all");
                break;
            case "grades":
                setGradeSearch("");
                setGradeStatus("all");
                break;
            case "sections":
                setSectionSearch("");
                setSectionGradeFilter("all");
                setSectionStatus("all");
                break;
            case "subjects":
                setSubjectsFilterResetKey((current) => current + 1);
                break;
            case "enrollments":
                setEnrollmentSearch("");
                setEnrollmentGradeFilter("all");
                setEnrollmentSectionFilter("all");
                setEnrollmentStatus("all");
                break;
        }
    };

    const toggleSection = (section: AcademicSection) => {
        if (openSection === section) {
            resetSectionFilters(section);
            setOpenSection(null);
            return;
        }

        if (openSection !== null) {
            resetSectionFilters(openSection);
        }

        setOpenSection(section);
    };

    useEffect(() => {
        if (
            (openSection !== "sections" && openSection !== "enrollments") ||
            grades.length === 0
        ) return;

        let cancelled = false;

        const preloadSections = async () => {
            setSectionsPreloading(true);
            try {
                const results = await Promise.all(
                    grades.map(async (grade) => {
                        const data = await getSectionsByGrade(grade.id);
                        return [grade.id, data] as const;
                    })
                );

                if (!cancelled) {
                    setSectionsByGrade((current) => ({
                        ...current,
                        ...Object.fromEntries(results),
                    }));
                }
            } catch (error: any) {
                if (!cancelled) {
                    console.error(error);
                    toast.error(
                        error?.response?.data?.message ||
                        "Unable to load Sections."
                    );
                }
            } finally {
                if (!cancelled) {
                    setSectionsPreloading(false);
                }
            }
        };

        preloadSections();

        return () => {
            cancelled = true;
        };
    }, [openSection, grades]);

    const refreshAllData = async () => {

        const refreshStartTime = Date.now();

        try {

            setRefreshing(true);

            setSelectedSectionGrade(null);
            setSelectedSection(null);
            setSectionsByGrade({});
            setOpenSectionGradeId(null);

            const [
                academicYearData,
                enrollmentData,
            ] = await Promise.all([
                getAcademicYears(),
                getAllEnrollments(),
            ]);

            setAcademicYears(academicYearData);
            setEnrollments(enrollmentData);

            const refreshedAcademicYearId =
                selectedAcademicYearId !== null &&
                academicYearData.some(
                    (academicYear) =>
                        academicYear.id === selectedAcademicYearId
                )
                    ? selectedAcademicYearId
                    : (
                        academicYearData.find(
                            (academicYear) =>
                                academicYear.active
                        )?.id ??
                        academicYearData[0]?.id ??
                        null
                    );

            setSelectedAcademicYearId(
                refreshedAcademicYearId
            );

            if (refreshedAcademicYearId !== null) {

                setGradesLoading(true);

                try {

                    const gradeData =
                        await getGradesByAcademicYear(
                            refreshedAcademicYearId
                        );

                    setGrades(gradeData);

                } finally {

                    setGradesLoading(false);

                }

            } else {

                setGrades([]);

            }

        } catch (error: any) {

            console.error(error);

            toast.error(
                error?.response?.data?.message ||
                "Unable to refresh Academic Management."
            );

        } finally {

            const elapsed =
                Date.now() - refreshStartTime;

            const minimumRefreshTime = 500;

            const remainingTime =
                Math.max(
                    0,
                    minimumRefreshTime - elapsed
                );

            setTimeout(() => {
                setRefreshing(false);
            }, remainingTime);
        }
    };

    const renderAccordionHeader = ({
                                       section,
                                       icon,
                                       title,
                                       description,
                                       count,
                                   }: {
        section: AcademicSection;
        icon: ReactNode;
        title: string;
        description: string;
        count?: string;
    }) => {
        const isOpen =
            openSection === section;

        return (
            <button
                type="button"
                onClick={() =>
                    toggleSection(section)
                }
                aria-expanded={isOpen}
                className="
                    flex
                    w-full
                    items-center
                    justify-between
                    gap-4
                    px-5
                    py-4
                    text-left
                    transition
                    hover:bg-slate-50
                "
            >
                <div
                    className="
                        flex
                        min-w-0
                        items-center
                        gap-3
                    "
                >
                    <div
                        className="
                            flex
                            h-10
                            w-10
                            shrink-0
                            items-center
                            justify-center
                            rounded-xl
                            bg-blue-50
                            text-blue-600
                        "
                    >
                        {icon}
                    </div>

                    <div className="min-w-0">
                        <h2
                            className="
                                text-base
                                font-semibold
                                text-slate-800
                            "
                        >
                            {title}
                        </h2>

                        <p
                            className="
                                mt-0.5
                                truncate
                                text-sm
                                text-slate-500
                            "
                        >
                            {description}
                        </p>
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                    {count && (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                            {count}
                        </span>
                    )}
                    <ChevronDown
                        size={20}
                        className={`
                            text-slate-400
                            transition-transform
                            duration-200
                            ${
                            isOpen
                                ? "rotate-180"
                                : ""
                        }
                        `}
                    />
                </div>
            </button>
        );
    };


    return (

        <div
            className={`space-y-6 ${
                refreshing
                    ? "animate-pulse"
                    : ""
            }`}
        >


            {/* ===================================================== */}
            {/* PAGE HEADER */}
            {/* ===================================================== */}

            <div
                className="
                    flex
                    flex-col
                    gap-4
                    sm:flex-row
                    sm:items-center
                    sm:justify-between
                "
            >

                <div>

                    <h1
                        className="
                            text-4xl
                            font-bold
                            text-slate-800
                        "
                    >
                        Academic Management
                    </h1>

                    <p
                        className="
                            mt-1
                            text-slate-500
                        "
                    >
                        Manage academic years, grades,
                        sections and student enrollments.
                    </p>

                </div>


                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={refreshAllData}
                        disabled={loading || refreshing}
                        className="
            inline-flex
            items-center
            gap-2
            rounded-xl
            border
            border-slate-300
            bg-white
            px-4
            py-2.5
            text-sm
            font-medium
            text-slate-700
            transition
            hover:bg-slate-50
            disabled:cursor-not-allowed
            disabled:opacity-50
        "
                    >
                        <RefreshCw
                            size={16}
                            className={
                                refreshing
                                    ? "animate-pulse"
                                    : ""
                            }
                        />
                        Refresh
                    </button>
                </div>

            </div>


            {/* ===================================================== */}
            {/* GLOBAL ACADEMIC YEAR CONTEXT */}
            {/* ===================================================== */}

            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm font-semibold text-slate-800">Academic Year Context</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                        Scope Grades, Sections, Subjects and Student Enrollments to an academic year.
                    </p>
                </div>
                <select
                    value={selectedAcademicYearId ?? ""}
                    onChange={(event) => {
                        const value = event.target.value;
                        setSelectedAcademicYearId(value ? Number(value) : null);
                        setEnrollmentGradeFilter("all");
                        setEnrollmentSectionFilter("all");
                        setSectionGradeFilter("all");
                        setSectionsByGrade({});
                        setOpenSectionGradeId(null);
                        setSelectedSectionGrade(null);
                        setEnrollmentSectionFilter("all");
                    }}
                    disabled={academicYears.length === 0}
                    aria-label="Academic year context"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-64"
                >
                    {academicYears.map((academicYear) => (
                        <option key={academicYear.id} value={academicYear.id}>
                            {academicYear.name}{academicYear.active ? " (Active)" : ""}
                        </option>
                    ))}
                </select>
            </div>

            {/* ===================================================== */}
            {/* ACADEMIC YEARS */}
            {/* ===================================================== */}

            <section
                className="
                    overflow-hidden
                    rounded-2xl
                    border
                    border-slate-200
                    bg-white
                    shadow-sm
                "
            >
                {renderAccordionHeader({
                    section: "academicYears",
                    icon: <CalendarDays size={20} />,
                    title: "Academic Years",
                    description: "Manage the school's academic years.",
                })}

                {openSection === "academicYears" && (
                    <div className="border-t border-slate-200 p-4 sm:p-5">
                        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <AcademicFilterToolbar
                                searchValue={academicYearSearch}
                                onSearchChange={setAcademicYearSearch}
                                placeholder="Search academic years..."
                                onReset={() => {
                                    setAcademicYearSearch("");
                                    setAcademicYearStatus("all");
                                }}
                                activeFilters={[
                                    ...(academicYearSearch.trim() ? [{
                                        key: "search",
                                        label: `Search: ${academicYearSearch.trim()}`,
                                        onRemove: () => setAcademicYearSearch(""),
                                    }] : []),
                                    ...(academicYearStatus !== "all" ? [{
                                        key: "status",
                                        label: academicYearStatus === "active" ? "Active" : "Inactive",
                                        onRemove: () => setAcademicYearStatus("all"),
                                    }] : []),
                                ]}
                            >
                                <label className="flex min-w-40 flex-col gap-1 text-xs font-medium text-slate-600">
                                    Status
                                    <select
                                        value={academicYearStatus}
                                        onChange={(event) => setAcademicYearStatus(event.target.value as StatusFilter)}
                                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-700 outline-none focus:border-blue-500"
                                    >
                                        <option value="all">All statuses</option>
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </label>
                            </AcademicFilterToolbar>
                            <button
                                type="button"
                                onClick={() =>
                                    setShowAddModal(true)
                                }
                                className="
                                    inline-flex
                                    items-center
                                    gap-2
                                    rounded-xl
                                    bg-blue-600
                                    px-4
                                    py-2.5
                                    text-sm
                                    font-semibold
                                    text-white
                                    transition
                                    hover:bg-blue-700
                                    active:scale-[0.98]
                                "
                            >
                                <Plus size={17} />
                                Add Academic Year
                            </button>
                        </div>

                        {loading ? (

                            <div
                                className="
                            rounded-2xl
                            border
                            border-slate-200
                            bg-white
                            px-6
                            py-12
                            text-center
                            shadow-sm
                        "
                            >

                                <div
                                    className="
                                mx-auto
                                h-8
                                w-8
                                animate-spin
                                rounded-full
                                border-2
                                border-slate-200
                                border-t-blue-600
                            "
                                />

                                <p
                                    className="
                                mt-4
                                text-sm
                                text-slate-500
                            "
                                >
                                    Loading Academic Years...
                                </p>

                            </div>

                        ) : filteredAcademicYears.length === 0 && academicYears.length > 0 ? (
                            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
                                <p className="text-sm font-semibold text-slate-700">No academic years match your search or filters.</p>
                                <p className="mt-1 text-xs text-slate-500">Try a different year name or status.</p>
                            </div>
                        ) : (
                            <AcademicYearTable
                                academicYears={filteredAcademicYears}
                                onManage={(academicYear) => setSelectedAcademicYear(academicYear)}
                            />
                        )}


                    </div>
                )}
            </section>

            {/* ===================================================== */}
            {/* GRADES */}
            {/* ===================================================== */}

            <section
                className="
                    overflow-hidden
                    rounded-2xl
                    border
                    border-slate-200
                    bg-white
                    shadow-sm
                "
            >
                {renderAccordionHeader({
                    section: "grades",
                    icon: <GraduationCap size={20} />,
                    title: "Grades",
                    description: "Manage grades for the selected academic year.",
                    count: gradesLoading ? "Loading..." : `${activeGradeCount} Active ${activeGradeCount === 1 ? "Grade" : "Grades"}`,
                })}

                {openSection === "grades" && (
                    <div className="border-t border-slate-200 p-4 sm:p-5">
                        <div className="mb-4">
                            <AcademicFilterToolbar
                                searchValue={gradeSearch}
                                onSearchChange={setGradeSearch}
                                placeholder="Search grades..."
                                onReset={() => {
                                    setGradeSearch("");
                                    setGradeStatus("all");
                                }}
                                activeFilters={[
                                    ...(gradeSearch.trim() ? [{
                                        key: "search",
                                        label: `Search: ${gradeSearch.trim()}`,
                                        onRemove: () => setGradeSearch(""),
                                    }] : []),
                                    ...(gradeStatus !== "all" ? [{
                                        key: "status",
                                        label: gradeStatus === "active" ? "Active" : "Inactive",
                                        onRemove: () => setGradeStatus("all"),
                                    }] : []),
                                ]}
                            >
                                <label className="flex min-w-40 flex-col gap-1 text-xs font-medium text-slate-600">
                                    Status
                                    <select
                                        value={gradeStatus}
                                        onChange={(event) => setGradeStatus(event.target.value as StatusFilter)}
                                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-700 outline-none focus:border-blue-500"
                                    >
                                        <option value="all">All statuses</option>
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </label>
                            </AcademicFilterToolbar>
                        </div>
                        <div
                            className="
                                flex
                                items-center
                                justify-between
                                gap-3
                            "
                        >
                            <div
                                className="
                            flex
                            items-center
                            gap-3
                        "
                            >




                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowAddGradeModal(true)
                                    }
                                    disabled={
                                        selectedAcademicYearId ===
                                        null
                                    }
                                    className="
                                inline-flex
                                items-center
                                gap-2
                                rounded-xl
                                bg-blue-600
                                px-4
                                py-2.5
                                text-sm
                                font-semibold
                                text-white
                                transition
                                hover:bg-blue-700
                                disabled:cursor-not-allowed
                                disabled:opacity-50
                            "
                                >

                                    <Plus size={17} />

                                    Add Grade

                                </button>

                            </div>
                        </div>

                        <div className="mt-4">

                            {gradesLoading ? (

                                <div
                                    className="
                            rounded-2xl
                            border
                            border-slate-200
                            bg-white
                            px-6
                            py-12
                            text-center
                            shadow-sm
                        "
                                >

                                    <div
                                        className="
                                mx-auto
                                h-8
                                w-8
                                animate-spin
                                rounded-full
                                border-2
                                border-slate-200
                                border-t-blue-600
                            "
                                    />

                                    <p
                                        className="
                                mt-4
                                text-sm
                                text-slate-500
                            "
                                    >
                                        Loading Grades...
                                    </p>

                                </div>

                            ) : filteredGrades.length === 0 && grades.length > 0 ? (
                                <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
                                    <p className="text-sm font-semibold text-slate-700">No grades match your search or filters.</p>
                                    <p className="mt-1 text-xs text-slate-500">Try adjusting the search term or clearing the filters.</p>
                                </div>
                            ) : (
                                <GradeTable
                                    grades={filteredGrades}
                                    onManage={(grade) => {
                                        /*
                                         * IMPORTANT:
                                         * This is ONLY for Manage Grade.
                                         */
                                        setSelectedGrade(grade);
                                    }}
                                />
                            )}

                        </div>

                    </div>
                )}
            </section>

            {/* ===================================================== */}
            {/* SECTIONS */}
            {/* ===================================================== */}

            <section
                className="
                    overflow-hidden
                    rounded-2xl
                    border
                    border-slate-200
                    bg-white
                    shadow-sm
                "
            >
                {renderAccordionHeader({
                    section: "sections",
                    icon: <PanelsTopLeft size={20} />,
                    title: "Sections",
                    description: "Manage sections for each grade.",
                })}

                {openSection === "sections" && (
                    <div className="border-t border-slate-200 p-4 sm:p-5">
                        <div className="mb-4">
                            <AcademicFilterToolbar
                                searchValue={sectionSearch}
                                onSearchChange={setSectionSearch}
                                placeholder="Search grades or sections..."
                                onReset={() => {
                                    setSectionSearch("");
                                    setSectionGradeFilter("all");
                                    setSectionStatus("all");
                                }}
                                activeFilters={[
                                    ...(sectionSearch.trim() ? [{
                                        key: "search",
                                        label: `Search: ${sectionSearch.trim()}`,
                                        onRemove: () => setSectionSearch(""),
                                    }] : []),
                                    ...(sectionGradeFilter !== "all" ? [{
                                        key: "grade",
                                        label: `Grade: ${grades.find((grade) => grade.id === Number(sectionGradeFilter))?.name ?? "Selected"}`,
                                        onRemove: () => setSectionGradeFilter("all"),
                                    }] : []),
                                    ...(sectionStatus !== "all" ? [{
                                        key: "status",
                                        label: sectionStatus === "active" ? "Active sections" : "Inactive sections",
                                        onRemove: () => setSectionStatus("all"),
                                    }] : []),
                                ]}
                            >
                                <label className="flex min-w-40 flex-col gap-1 text-xs font-medium text-slate-600">
                                    Grade
                                    <select
                                        value={sectionGradeFilter}
                                        onChange={(event) => setSectionGradeFilter(event.target.value)}
                                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-700 outline-none focus:border-blue-500"
                                    >
                                        <option value="all">All grades</option>
                                        {grades.map((grade) => (
                                            <option key={grade.id} value={grade.id}>{grade.name}</option>
                                        ))}
                                    </select>
                                </label>
                                <label className="flex min-w-40 flex-col gap-1 text-xs font-medium text-slate-600">
                                    Section status
                                    <select
                                        value={sectionStatus}
                                        onChange={(event) => setSectionStatus(event.target.value as StatusFilter)}
                                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-700 outline-none focus:border-blue-500"
                                    >
                                        <option value="all">All statuses</option>
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </label>
                            </AcademicFilterToolbar>
                        </div>

                        <div className="space-y-3">

                            {grades.length === 0 ? (

                                <div
                                    className="
                                        rounded-2xl
                                        border
                                        border-slate-200
                                        bg-white
                                        px-6
                                        py-12
                                        text-center
                                        shadow-sm
                                    "
                                >
                                    <p className="text-sm font-medium text-slate-700">
                                        No grades available.
                                    </p>

                                    <p className="mt-1 text-sm text-slate-500">
                                        Add a grade to manage its sections.
                                    </p>
                                </div>

                            ) : filteredSectionGrades.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
                                    <p className="text-sm font-semibold text-slate-700">No sections match your search or filters.</p>
                                    <p className="mt-1 text-xs text-slate-500">Try another grade, section name or status.</p>
                                </div>
                            ) : (

                                filteredSectionGrades.map((grade) => {

                                    const isOpen =
                                        openSectionGradeId === grade.id;

                                    const gradeSections =
                                        sectionsByGrade[grade.id] ?? [];

                                    const filteredGradeSections =
                                        gradeSections.filter(matchesSection);

                                    const hasLoadedSections =
                                        Object.prototype.hasOwnProperty.call(
                                            sectionsByGrade,
                                            grade.id
                                        );

                                    const isLoading =
                                        sectionGradeLoadingId === grade.id;

                                    return (
                                        <div
                                            key={grade.id}
                                            className="
                                                overflow-hidden
                                                rounded-xl
                                                border
                                                border-slate-200
                                                bg-white
                                            "
                                        >

                                            <button
                                                type="button"
                                                onClick={async () => {

                                                    const nextOpenState =
                                                        isOpen
                                                            ? null
                                                            : grade.id;

                                                    setOpenSectionGradeId(
                                                        nextOpenState
                                                    );

                                                    if (nextOpenState === null) {
                                                        return;
                                                    }

                                                    setSelectedSectionGrade(
                                                        grade
                                                    );

                                                    if (
                                                        !hasLoadedSections
                                                    ) {
                                                        await loadSections(
                                                            grade.id
                                                        );
                                                    } else {
                                                    }
                                                }}
                                                className="
                                                    flex
                                                    w-full
                                                    items-center
                                                    justify-between
                                                    gap-4
                                                    px-4
                                                    py-3
                                                    text-left
                                                    transition
                                                    hover:bg-slate-50
                                                "
                                                aria-expanded={isOpen}
                                            >

                                                <div className="flex min-w-0 items-center gap-3">

                                                    <div
                                                        className="
                                                            flex
                                                            h-9
                                                            w-9
                                                            shrink-0
                                                            items-center
                                                            justify-center
                                                            rounded-lg
                                                            bg-blue-50
                                                            text-blue-600
                                                        "
                                                    >
                                                        <GraduationCap size={18} />
                                                    </div>

                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-slate-800">
                                                            {grade.name}
                                                        </p>

                                                        <p className="mt-0.5 text-xs text-slate-500">
                                                            Manage sections for this grade
                                                        </p>
                                                    </div>

                                                </div>

                                                <div className="flex shrink-0 items-center gap-3">

                                                    <span
                                                        className="
                                                            rounded-full
                                                            bg-slate-100
                                                            px-2.5
                                                            py-1
                                                            text-xs
                                                            font-medium
                                                            text-slate-600
                                                        "
                                                    >
                                                        {!hasLoadedSections && isLoading
                                                            ? "Loading..."
                                                            : `${filteredGradeSections.length} ${
                                                                filteredGradeSections.length === 1
                                                                    ? "Section"
                                                                    : "Sections"
                                                            }`}
                                                    </span>

                                                    <ChevronDown
                                                        size={18}
                                                        className={`
                                                            text-slate-400
                                                            transition-transform
                                                            duration-200
                                                            ${
                                                            isOpen
                                                                ? "rotate-180"
                                                                : ""
                                                        }
                                                        `}
                                                    />

                                                </div>

                                            </button>

                                            {isOpen && (
                                                <div
                                                    className="
                                                        border-t
                                                        border-slate-200
                                                        bg-slate-50/40
                                                        p-4
                                                    "
                                                >

                                                    <div className="mb-4 flex justify-end">

                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedSectionGrade(
                                                                    grade
                                                                );
                                                                setShowAddSectionModal(
                                                                    true
                                                                );
                                                            }}
                                                            className="
                                                                inline-flex
                                                                items-center
                                                                gap-2
                                                                rounded-xl
                                                                bg-blue-600
                                                                px-4
                                                                py-2.5
                                                                text-sm
                                                                font-semibold
                                                                text-white
                                                                transition
                                                                hover:bg-blue-700
                                                                active:scale-[0.98]
                                                            "
                                                        >
                                                            <Plus size={17} />
                                                            Add Section
                                                        </button>

                                                    </div>

                                                    {isLoading ? (

                                                        <div
                                                            className="
                                                                rounded-2xl
                                                                border
                                                                border-slate-200
                                                                bg-white
                                                                px-6
                                                                py-12
                                                                text-center
                                                                shadow-sm
                                                            "
                                                        >

                                                            <div
                                                                className="
                                                                    mx-auto
                                                                    h-8
                                                                    w-8
                                                                    animate-spin
                                                                    rounded-full
                                                                    border-2
                                                                    border-slate-200
                                                                    border-t-blue-600
                                                                "
                                                            />

                                                            <p className="mt-4 text-sm text-slate-500">
                                                                Loading Sections...
                                                            </p>

                                                        </div>

                                                    ) : (

                                                        <SectionTable
                                                            sections={
                                                                filteredGradeSections
                                                            }
                                                            onManage={(section) => {
                                                                setSelectedSection(
                                                                    section
                                                                );
                                                                setSelectedSectionGrade(
                                                                    grade
                                                                );
                                                            }}
                                                        />

                                                    )}

                                                </div>
                                            )}

                                        </div>
                                    );
                                })

                            )}

                        </div>

                    </div>
                )}

            </section>

            {/* ===================================================== */}
            {/* SUBJECTS */}
            {/* ===================================================== */}

            <section
                className="
                    overflow-hidden
                    rounded-2xl
                    border
                    border-slate-200
                    bg-white
                    shadow-sm
                "
            >
                {renderAccordionHeader({
                    section: "subjects",
                    icon: <BookOpen size={20} />,
                    title: "Subjects",
                    description: "Manage subjects assigned to each grade.",
                })}

                {openSection === "subjects" && (
                    <div className="border-t border-slate-200 p-4 sm:p-5">
                        <SubjectsSection
                            grades={grades}
                            filterResetKey={subjectsFilterResetKey}
                        />
                    </div>
                )}
            </section>

            {/* ===================================================== */}
            {/* STUDENT ENROLLMENTS */}
            {/* ===================================================== */}

            <section
                className="
                    overflow-hidden
                    rounded-2xl
                    border
                    border-slate-200
                    bg-white
                    shadow-sm
                "
            >
                {renderAccordionHeader({
                    section: "enrollments",
                    icon: <Users size={20} />,
                    title: "Student Enrollments",
                    description: "Manage students enrolled in academic years, grades, and sections.",
                    count: enrollmentsLoading
                        ? "Loading..."
                        : `${filteredEnrollments.length} ${filteredEnrollments.length === 1 ? "Student" : "Students"}`,
                })}

                {openSection === "enrollments" && (
                    <div className="border-t border-slate-200 p-4 sm:p-5">
                        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <AcademicFilterToolbar
                                searchValue={enrollmentSearch}
                                onSearchChange={setEnrollmentSearch}
                                placeholder="Search by student name, ID or email..."
                                onReset={() => {
                                    setEnrollmentSearch("");
                                    setEnrollmentGradeFilter("all");
                                    setEnrollmentSectionFilter("all");
                                    setEnrollmentStatus("all");
                                }}
                                activeFilters={[
                                    ...(enrollmentSearch.trim() ? [{
                                        key: "search",
                                        label: `Search: ${enrollmentSearch.trim()}`,
                                        onRemove: () => setEnrollmentSearch(""),
                                    }] : []),
                                    ...(enrollmentGradeFilter !== "all" ? [{
                                        key: "grade",
                                        label: `Grade: ${grades.find((grade) => grade.id === Number(enrollmentGradeFilter))?.name ?? "Selected"}`,
                                        onRemove: () => {
                                            setEnrollmentGradeFilter("all");
                                            setEnrollmentSectionFilter("all");
                                        },
                                    }] : []),
                                    ...(enrollmentSectionFilter !== "all" ? [{
                                        key: "section",
                                        label: `Section: ${enrollmentSectionOptions.find((section) => section.id === Number(enrollmentSectionFilter))?.label ?? "Selected"}`,
                                        onRemove: () => setEnrollmentSectionFilter("all"),
                                    }] : []),
                                    ...(enrollmentStatus !== "all" ? [{
                                        key: "status",
                                        label: enrollmentStatus === "active" ? "Active enrollments" : "Inactive enrollments",
                                        onRemove: () => setEnrollmentStatus("all"),
                                    }] : []),
                                ]}
                            >
                                <label className="flex min-w-40 flex-col gap-1 text-xs font-medium text-slate-600">
                                    Grade
                                    <select
                                        value={enrollmentGradeFilter}
                                        onChange={(event) => {
                                            setEnrollmentGradeFilter(event.target.value);
                                            setEnrollmentSectionFilter("all");
                                        }}
                                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-700 outline-none focus:border-blue-500"
                                    >
                                        <option value="all">All grades</option>
                                        {grades.map((grade) => (
                                            <option key={grade.id} value={grade.id}>{grade.name}</option>
                                        ))}
                                    </select>
                                </label>
                                <label className="flex min-w-40 flex-col gap-1 text-xs font-medium text-slate-600">
                                    Section
                                    <select
                                        value={enrollmentSectionFilter}
                                        onChange={(event) => setEnrollmentSectionFilter(event.target.value)}
                                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-700 outline-none focus:border-blue-500"
                                    >
                                        <option value="all">All sections</option>
                                        {enrollmentSectionOptions.map((section) => (
                                            <option key={section.id} value={section.id}>{section.label}</option>
                                        ))}
                                    </select>
                                </label>
                                <label className="flex min-w-40 flex-col gap-1 text-xs font-medium text-slate-600">
                                    Enrollment status
                                    <select
                                        value={enrollmentStatus}
                                        onChange={(event) => setEnrollmentStatus(event.target.value as StatusFilter)}
                                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-700 outline-none focus:border-blue-500"
                                    >
                                        <option value="all">All statuses</option>
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </label>
                            </AcademicFilterToolbar>
                            <button
                                type="button"
                                onClick={() => setShowAddEnrollmentModal(true)}
                                className="
                            inline-flex
                            items-center
                            gap-2
                            rounded-xl
                            bg-blue-600
                            px-4
                            py-2.5
                            text-sm
                            font-medium
                            text-white
                            transition
                            hover:bg-blue-700
                        "
                            >
                                + Add Student Enrollment
                            </button>

                        </div>

                        {/* ================================================= */}
                        {/* ENROLLMENT CONTENT */}
                        {/* ================================================= */}

                        {enrollmentsLoading ? (

                            <div
                                className="
                            rounded-2xl
                            border
                            border-slate-200
                            bg-white
                            px-6
                            py-12
                            text-center
                            shadow-sm
                        "
                            >

                                <div
                                    className="
                                mx-auto
                                h-8
                                w-8
                                animate-spin
                                rounded-full
                                border-2
                                border-slate-200
                                border-t-blue-600
                            "
                                />

                                <p
                                    className="
                                mt-4
                                text-sm
                                text-slate-500
                            "
                                >
                                    Loading Student Enrollments...
                                </p>

                            </div>

                        ) : filteredEnrollments.length === 0 && enrollments.length > 0 ? (
                            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
                                <p className="text-sm font-semibold text-slate-700">No student enrollments match your search or filters.</p>
                                <p className="mt-1 text-xs text-slate-500">Try changing the academic year, grade, section or status.</p>
                            </div>
                        ) : (
                            <StudentEnrollmentTable
                                enrollments={filteredEnrollments}
                                onManage={(enrollment) => {
                                    setSelectedEnrollment(enrollment);
                                }}
                            />
                        )}


                    </div>
                )}
            </section>

            {/* ADD ACADEMIC YEAR MODAL */}
            {/* ===================================================== */}

            {showAddModal && (

                <AddAcademicYearModal
                    onClose={() =>
                        setShowAddModal(false)
                    }
                    onCreated={() =>
                        loadAcademicYears()
                    }
                />

            )}


            {/* ===================================================== */}
            {/* MANAGE ACADEMIC YEAR MODAL */}
            {/* ===================================================== */}

            {selectedAcademicYear && (

                <ManageAcademicYearModal
                    academicYear={
                        selectedAcademicYear
                    }
                    onClose={() =>
                        setSelectedAcademicYear(
                            null
                        )
                    }
                    onUpdated={() =>
                        loadAcademicYears()
                    }
                    onDeleted={() =>
                        loadAcademicYears()
                    }
                />

            )}


            {/* ===================================================== */}
            {/* ADD GRADE MODAL */}
            {/* ===================================================== */}

            {showAddGradeModal &&
                selectedAcademicYearId !== null && (

                    <AddGradeModal
                        academicYearId={
                            selectedAcademicYearId
                        }
                        academicYearName={
                            academicYears.find(
                                (academicYear) =>
                                    academicYear.id ===
                                    selectedAcademicYearId
                            )?.name ?? ""
                        }
                        onClose={() =>
                            setShowAddGradeModal(
                                false
                            )
                        }
                        onCreated={() =>
                            loadGrades(
                                selectedAcademicYearId
                            )
                        }
                    />

                )}


            {/* ===================================================== */}
            {/* MANAGE GRADE MODAL */}
            {/* ===================================================== */}

            {selectedGrade && (

                <ManageGradeModal
                    grade={selectedGrade}
                    onClose={() =>
                        setSelectedGrade(null)
                    }
                    onUpdated={() => {

                        if (
                            selectedAcademicYearId !== null
                        ) {

                            loadGrades(
                                selectedAcademicYearId
                            );

                        }

                    }}
                />

            )}


            {/* ===================================================== */}
            {/* ADD SECTION MODAL */}
            {/* ===================================================== */}

            {showAddSectionModal &&
                selectedSectionGrade !== null && (

                    <AddSectionModal
                        grade={
                            selectedSectionGrade
                        }
                        onClose={() =>
                            setShowAddSectionModal(
                                false
                            )
                        }
                        onAdded={async () => {

                            await loadSections(
                                selectedSectionGrade.id
                            );

                        }}
                    />

                )}


            {/* ===================================================== */}
            {/* MANAGE SECTION MODAL */}
            {/* ===================================================== */}

            {selectedSection && (

                <ManageSectionModal
                    section={
                        selectedSection
                    }
                    onClose={() =>
                        setSelectedSection(null)
                    }
                    onUpdated={() => {

                        if (
                            selectedSectionGrade !== null
                        ) {

                            loadSections(
                                selectedSectionGrade.id
                            );

                        }

                    }}
                />

            )}

            {/* ===================================================== */}
            {/* MANAGE STUDENT ENROLLMENT MODAL */}
            {/* ===================================================== */}

            {selectedEnrollment && (

                <ManageStudentEnrollmentModal
                    enrollment={
                        selectedEnrollment
                    }
                    onClose={() =>
                        setSelectedEnrollment(
                            null
                        )
                    }
                    onUpdated={() =>
                        loadEnrollments()
                    }
                />

            )}

            {showAddEnrollmentModal && (
                <AddStudentEnrollmentModal
                    onClose={() => setShowAddEnrollmentModal(false)}
                    onAdded={loadEnrollments}
                />
            )}

        </div>

    );
}