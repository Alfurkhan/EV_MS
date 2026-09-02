import { useEffect, useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
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

import {
    getSectionsByGrade,
    type Section,
} from "../services/sectionService";

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

    /*
     * ============================================================
     * SECTION STATE
     * ============================================================
     */

    const [sections, setSections] =
        useState<Section[]>([]);

    const [sectionsLoading, setSectionsLoading] =
        useState(false);

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


    /*
     * ============================================================
     * LOAD ACADEMIC YEARS
     * ============================================================
     */

    const loadAcademicYears = async (
        showRefreshState = false
    ) => {

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

            setLoading(false);
            setRefreshing(false);

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

            setSectionsLoading(true);

            const data =
                await getSectionsByGrade(
                    gradeId
                );

            setSections(data);

        } catch (error: any) {

            console.error(error);

            toast.error(
                error?.response?.data?.message ||
                "Unable to load Sections."
            );

        } finally {

            setSectionsLoading(false);

        }
    };


    /*
     * ============================================================
     * INITIAL LOAD
     * ============================================================
     */

    useEffect(() => {

        loadAcademicYears();

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
     * LOAD SECTIONS WHEN SECTION GRADE CHANGES
     * ============================================================
     */

    useEffect(() => {

        if (
            selectedSectionGrade !== null
        ) {

            loadSections(
                selectedSectionGrade.id
            );

        } else {

            setSections([]);

        }

    }, [selectedSectionGrade]);


    return (

        <div className="space-y-6">

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
                        onClick={() =>
                            loadAcademicYears(true)
                        }
                        disabled={
                            loading ||
                            refreshing
                        }
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
                                    ? "animate-spin"
                                    : ""
                            }
                        />

                        Refresh

                    </button>


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

            </div>


            {/* ===================================================== */}
            {/* ACADEMIC YEARS */}
            {/* ===================================================== */}

            <section>

                <div
                    className="
                        mb-4
                        flex
                        items-center
                        justify-between
                    "
                >

                    <div>

                        <h2
                            className="
                                text-xl
                                font-bold
                                text-slate-800
                            "
                        >
                            Academic Years
                        </h2>

                        <p
                            className="
                                mt-1
                                text-sm
                                text-slate-500
                            "
                        >
                            Manage the school's academic years.
                        </p>

                    </div>

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

            </section>


            {/* ===================================================== */}
            {/* GRADES */}
            {/* ===================================================== */}

            <section className="space-y-4">

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

                        <h2
                            className="
                                text-xl
                                font-bold
                                text-slate-800
                            "
                        >
                            Grades
                        </h2>

                        <p
                            className="
                                mt-1
                                text-sm
                                text-slate-500
                            "
                        >
                            Manage grades for the selected
                            academic year.
                        </p>

                    </div>


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

            </section>


            {/* ===================================================== */}
            {/* SECTIONS */}
            {/* ===================================================== */}

            <section className="space-y-4">

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

                        <h2
                            className="
                                text-xl
                                font-bold
                                text-slate-800
                            "
                        >
                            Sections
                        </h2>

                        <p
                            className="
                                mt-1
                                text-sm
                                text-slate-500
                            "
                        >
                            Manage sections for the selected grade.
                        </p>

                    </div>


                    <div
                        className="
                            flex
                            flex-col
                            gap-3
                            sm:flex-row
                            sm:items-center
                        "
                    >

                        {/* ================================================= */}
                        {/* SECTION GRADE SELECTOR */}
                        {/* ================================================= */}

                        <select
                            value={
                                selectedSectionGrade?.id ?? ""
                            }
                            onChange={(event) => {

                                const gradeId =
                                    Number(
                                        event.target.value
                                    );

                                const grade =
                                    grades.find(
                                        (item) =>
                                            item.id ===
                                            gradeId
                                    );

                                setSelectedSectionGrade(
                                    grade ?? null
                                );

                            }}
                            disabled={
                                grades.length === 0
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
                                disabled:cursor-not-allowed
                                disabled:opacity-50
                            "
                        >

                            <option value="">
                                Select Grade
                            </option>

                            {grades.map(
                                (grade) => (

                                    <option
                                        key={
                                            grade.id
                                        }
                                        value={
                                            grade.id
                                        }
                                    >
                                        {grade.name}
                                    </option>

                                )
                            )}

                        </select>


                        {/* ================================================= */}
                        {/* ADD SECTION */}
                        {/* ================================================= */}

                        <button
                            type="button"
                            onClick={() =>
                                setShowAddSectionModal(true)
                            }
                            disabled={
                                selectedSectionGrade ===
                                null
                            }
                            className="
                                inline-flex
                                items-center
                                justify-center
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
                                disabled:cursor-not-allowed
                                disabled:opacity-50
                            "
                        >

                            <Plus size={17} />

                            Add Section

                        </button>

                    </div>

                </div>


                {/* ========================================================= */}
                {/* SECTION CONTENT */}
                {/* ========================================================= */}

                {selectedSectionGrade === null ? (

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

                        <p
                            className="
                                text-sm
                                font-medium
                                text-slate-700
                            "
                        >
                            Select a grade to view its sections.
                        </p>

                        <p
                            className="
                                mt-1
                                text-sm
                                text-slate-500
                            "
                        >
                            Choose a grade from the dropdown above.
                        </p>

                    </div>

                ) : sectionsLoading ? (

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
                            Loading Sections...
                        </p>

                    </div>

                ) : (

                    <SectionTable
                        sections={sections}
                        onManage={(section) => {

                            /*
                             * IMPORTANT:
                             * This opens Manage Section,
                             * NOT Manage Grade.
                             */
                            setSelectedSection(section);

                        }}
                    />

                )}

            </section>


            {/* ===================================================== */}
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
                        onAdded={() => {

                            loadSections(
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

        </div>

    );
}