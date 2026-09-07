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

    const toggleSection = (
        section: AcademicSection
    ) => {
        setOpenSection((current) =>
            current === section
                ? null
                : section
        );
    };

    useEffect(() => {
        if (openSection !== "sections" || grades.length === 0) return;

        const preloadSections = async () => {
            try {
                const results = await Promise.all(
                    grades.map(async (grade) => {
                        const data = await getSectionsByGrade(grade.id);
                        return [grade.id, data] as const;
                    })
                );

                setSectionsByGrade(Object.fromEntries(results));
            } catch (error: any) {
                console.error(error);
                toast.error(
                    error?.response?.data?.message ||
                    "Unable to load Sections."
                );
            }
        };

        preloadSections();
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
                                   }: {
        section: AcademicSection;
        icon: ReactNode;
        title: string;
        description: string;
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

                <ChevronDown
                    size={20}
                    className={`
                        shrink-0
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
                        <div className="mb-4 flex justify-end">
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

                        ) : (

                            <AcademicYearTable
                                academicYears={
                                    academicYears
                                }
                                onManage={(
                                    academicYear
                                ) =>
                                    setSelectedAcademicYear(
                                        academicYear
                                    )
                                }
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
                })}

                {openSection === "grades" && (
                    <div className="border-t border-slate-200 p-4 sm:p-5">
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

                                <select
                                    value={
                                        selectedAcademicYearId ?? ""
                                    }
                                    onChange={(event) => {

                                        const value =
                                            Number(
                                                event.target.value
                                            );

                                        setSelectedAcademicYearId(
                                            value
                                        );

                                    }}
                                    disabled={
                                        academicYears.length === 0
                                    }
                                    className="
                                rounded-xl
                                border
                                border-slate-300
                                bg-white
                                px-4
                                py-2.5
                                text-sm
                                font-medium
                                text-slate-700
                                outline-none
                                transition
                                focus:border-blue-500
                                focus:ring-2
                                focus:ring-blue-100
                            "
                                >

                                    {academicYears.map(
                                        (academicYear) => (

                                            <option
                                                key={
                                                    academicYear.id
                                                }
                                                value={
                                                    academicYear.id
                                                }
                                            >
                                                {academicYear.name}
                                                {academicYear.active
                                                    ? " (Active)"
                                                    : ""
                                                }
                                            </option>

                                        )
                                    )}

                                </select>


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

                            ) : (

                                <GradeTable
                                    grades={grades}
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

                            ) : (

                                grades.map((grade) => {

                                    const isOpen =
                                        openSectionGradeId === grade.id;

                                    const gradeSections =
                                        sectionsByGrade[grade.id] ?? [];

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
                                                            : `${gradeSections.length} ${
                                                                gradeSections.length === 1
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
                                                                gradeSections
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
                        <SubjectsSection grades={grades} />
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
                })}

                {openSection === "enrollments" && (
                    <div className="border-t border-slate-200 p-4 sm:p-5">
                        <div className="mb-4 flex justify-end">
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

                        ) : (

                            <StudentEnrollmentTable
                                enrollments={enrollments}
                                onManage={(enrollment) => {

                                    setSelectedEnrollment(
                                        enrollment
                                    );

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