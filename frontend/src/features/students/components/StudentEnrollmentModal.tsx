import { useEffect, useState } from "react";
import {
    CalendarDays,
    CheckCircle2,
    GraduationCap,
    Layers3,
    X,
} from "lucide-react";
import toast from "react-hot-toast";

import type { Student } from "../types/student";

import {
    createEnrollment,
    getEnrollmentsByStudent,
    updateEnrollment,
} from "../../academic/services/studentEnrollmentService";

import {
    getAcademicYears,
    type AcademicYear,
} from "../../academic/services/academicYearService";

import {
    getGradesByAcademicYear,
    type Grade,
} from "../../academic/services/gradeService";

import {
    getSectionsByGrade,
    type Section,
} from "../../academic/services/sectionService";

interface StudentEnrollmentModalProps {
    open: boolean;
    student: Student | null;
    onClose: () => void;
    onSuccess: () => void;
}

interface FormState {
    academicYearId: string;
    gradeId: string;
    sectionId: string;
}

const initialForm: FormState = {
    academicYearId: "",
    gradeId: "",
    sectionId: "",
};

export default function StudentEnrollmentModal({
                                                   open,
                                                   student,
                                                   onClose,
                                                   onSuccess,
                                               }: StudentEnrollmentModalProps) {
    const [form, setForm] =
        useState<FormState>(initialForm);

    const [academicYears, setAcademicYears] =
        useState<AcademicYear[]>([]);

    const [grades, setGrades] =
        useState<Grade[]>([]);

    const [sections, setSections] =
        useState<Section[]>([]);

    const [enrollmentId, setEnrollmentId] =
        useState<number | null>(null);

    const [loadingData, setLoadingData] =
        useState(false);

    const [submitting, setSubmitting] =
        useState(false);

    const [error, setError] =
        useState<string | null>(null);

    const [loadingGrades, setLoadingGrades] =
        useState(false);

    const [loadingSections, setLoadingSections] =
        useState(false);

    /*
     * ============================================================
     * LOAD ACADEMIC YEARS + EXISTING ENROLLMENT
     * ============================================================
     */

    useEffect(() => {
        if (!open || !student) {
            return;
        }

        const loadData = async () => {
            try {
                setLoadingData(true);
                setError(null);

                setForm(initialForm);
                setGrades([]);
                setSections([]);
                setEnrollmentId(null);

                const [years, enrollments] =
                    await Promise.all([
                        getAcademicYears(),
                        getEnrollmentsByStudent(
                            student.id
                        ),
                    ]);

                setAcademicYears(years);

                const activeEnrollment =
                    enrollments.find(
                        (enrollment) =>
                            enrollment.active
                    );

                if (activeEnrollment) {
                    setEnrollmentId(
                        activeEnrollment.id
                    );

                    setForm({
                        academicYearId:
                            String(
                                activeEnrollment.academicYearId
                            ),
                        gradeId:
                            String(
                                activeEnrollment.gradeId
                            ),
                        sectionId:
                            String(
                                activeEnrollment.sectionId
                            ),
                    });
                } else {
                    const activeYear =
                        years.find(
                            (year) =>
                                year.active
                        );

                    if (activeYear) {
                        setForm({
                            academicYearId:
                                String(
                                    activeYear.id
                                ),
                            gradeId: "",
                            sectionId: "",
                        });
                    }
                }
            } catch (err) {
                console.error(
                    "Failed to load enrollment data:",
                    err
                );

                setError(
                    "Failed to load enrollment data."
                );
            } finally {
                setLoadingData(false);
            }
        };

        loadData();
    }, [open, student]);

    /*
     * ============================================================
     * ESCAPE KEY
     * ============================================================
     */

    useEffect(() => {
        if (!open || submitting) {
            return;
        }

        const handleKeyDown = (
            event: KeyboardEvent
        ) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        document.addEventListener(
            "keydown",
            handleKeyDown
        );

        return () => {
            document.removeEventListener(
                "keydown",
                handleKeyDown
            );
        };
    }, [open, submitting, onClose]);

    /*
     * ============================================================
     * LOAD GRADES
     * ============================================================
     */

    useEffect(() => {
        if (!form.academicYearId) {
            setGrades([]);
            return;
        }

        const loadGrades = async () => {
            try {
                setLoadingGrades(true);
                setError(null);

                const data =
                    await getGradesByAcademicYear(
                        Number(
                            form.academicYearId
                        )
                    );

                setGrades(data);
            } catch (err) {
                console.error(
                    "Failed to load grades:",
                    err
                );

                setError(
                    "Failed to load grades."
                );
            } finally {
                setLoadingGrades(false);
            }
        };

        loadGrades();
    }, [form.academicYearId]);

    /*
     * ============================================================
     * LOAD SECTIONS
     * ============================================================
     */

    useEffect(() => {
        if (!form.gradeId) {
            setSections([]);
            return;
        }

        const loadSections = async () => {
            try {
                setLoadingSections(true);
                setError(null);

                const data =
                    await getSectionsByGrade(
                        Number(
                            form.gradeId
                        )
                    );

                setSections(data);
            } catch (err) {
                console.error(
                    "Failed to load sections:",
                    err
                );

                setError(
                    "Failed to load sections."
                );
            } finally {
                setLoadingSections(false);
            }
        };

        loadSections();
    }, [form.gradeId]);

    /*
     * ============================================================
     * FIELD UPDATE
     * ============================================================
     */

    const updateField = (
        field: keyof FormState,
        value: string
    ) => {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));

        if (error) {
            setError(null);
        }
    };

    /*
     * ============================================================
     * ACADEMIC YEAR CHANGE
     * ============================================================
     */

    const handleAcademicYearChange = (
        value: string
    ) => {
        setForm({
            academicYearId: value,
            gradeId: "",
            sectionId: "",
        });

        setGrades([]);
        setSections([]);
        setError(null);
    };

    /*
     * ============================================================
     * GRADE CHANGE
     * ============================================================
     */

    const handleGradeChange = (
        value: string
    ) => {
        setForm((current) => ({
            ...current,
            gradeId: value,
            sectionId: "",
        }));

        setSections([]);
        setError(null);
    };

    /*
     * ============================================================
     * SUBMIT
     * ============================================================
     */

    const handleSubmit = async (
        event: React.FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        if (!student) {
            return;
        }

        setError(null);

        if (!form.academicYearId) {
            setError(
                "Please select an academic year."
            );
            return;
        }

        if (!form.gradeId) {
            setError(
                "Please select a grade."
            );
            return;
        }

        if (!form.sectionId) {
            setError(
                "Please select a section."
            );
            return;
        }

        try {
            setSubmitting(true);

            const enrollmentData = {
                studentId: student.id,
                academicYearId:
                    Number(
                        form.academicYearId
                    ),
                gradeId:
                    Number(
                        form.gradeId
                    ),
                sectionId:
                    Number(
                        form.sectionId
                    ),
            };

            if (enrollmentId) {
                await updateEnrollment(
                    enrollmentId,
                    enrollmentData
                );

                toast.success(
                    "Student enrollment updated successfully."
                );
            } else {
                await createEnrollment(
                    enrollmentData
                );

                toast.success(
                    "Student enrollment assigned successfully."
                );
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            console.error(
                "Failed to save enrollment:",
                err
            );

            const message =
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                "Failed to save enrollment. Please try again.";

            setError(message);
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    /*
     * ============================================================
     * CLOSED
     * ============================================================
     */

    if (!open || !student) {
        return null;
    }

    const activeAcademicYear =
        academicYears.find(
            (year) =>
                year.active
        );

    const activeGrades =
        grades.filter(
            (grade) =>
                grade.active
        );

    const activeSections =
        sections.filter(
            (section) =>
                section.active
        );

    const selectedGrade =
        activeGrades.find(
            (grade) =>
                String(grade.id) ===
                form.gradeId
        );

    const selectedSection =
        activeSections.find(
            (section) =>
                String(section.id) ===
                form.sectionId
        );

    return (
        <div
            className="
                fixed
                inset-0
                z-[60]
                flex
                items-center
                justify-center
                overflow-y-auto
                bg-slate-900/40
                px-4
                py-4
                backdrop-blur-sm
            "
            role="dialog"
            aria-modal="true"
            aria-labelledby="student-enrollment-title"
            onMouseDown={(event) => {
                if (
                    event.target ===
                    event.currentTarget &&
                    !submitting
                ) {
                    onClose();
                }
            }}
        >
            <div
                className="
                    flex
                    max-h-[calc(100vh-2rem)]
                    w-full
                    max-w-xl
                    flex-col
                    overflow-hidden
                    rounded-2xl
                    border
                    border-slate-200
                    bg-white
                    shadow-2xl
                "
                onMouseDown={(event) => {
                    event.stopPropagation();
                }}
            >
                {/* HEADER */}

                <div
                    className="
                        flex
                        shrink-0
                        items-center
                        justify-between
                        border-b
                        border-slate-100
                        px-6
                        py-5
                    "
                >
                    <div>
                        <h2
                            id="student-enrollment-title"
                            className="
                                text-xl
                                font-semibold
                                text-slate-800
                            "
                        >
                            {enrollmentId
                                ? "Edit Student Enrollment"
                                : "Assign Student Enrollment"}
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            {student.fullName}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        aria-label="Close student enrollment"
                        className="
                            rounded-lg
                            p-2
                            text-slate-400
                            transition
                            hover:bg-slate-100
                            hover:text-slate-600
                            disabled:cursor-not-allowed
                            disabled:opacity-50
                        "
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* FORM */}

                <form
                    onSubmit={handleSubmit}
                    className="
                        flex
                        min-h-0
                        flex-1
                        flex-col
                    "
                >
                    {/* SCROLLABLE FORM CONTENT */}

                    <div
                        className="
                            min-h-0
                            flex-1
                            overflow-y-auto
                            px-6
                            py-6
                        "
                    >
                        {loadingData ? (
                            <div
                                className="
                                    flex
                                    flex-col
                                    items-center
                                    justify-center
                                    py-12
                                    text-center
                                "
                            >
                                <span
                                    className="
                                        h-8
                                        w-8
                                        animate-spin
                                        rounded-full
                                        border-2
                                        border-blue-100
                                        border-t-blue-600
                                    "
                                />

                                <p className="mt-4 text-sm font-medium text-slate-600">
                                    Loading enrollment details...
                                </p>

                                <p className="mt-1 text-xs text-slate-400">
                                    Please wait while we fetch the student's
                                    academic information.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-5">
                                {/* STUDENT */}

                                <div>
                                    <label
                                        htmlFor="enrollment-student"
                                        className="
                                            mb-1.5
                                            block
                                            text-sm
                                            font-medium
                                            text-slate-700
                                        "
                                    >
                                        Student
                                    </label>

                                    <div
                                        className="
                                            flex
                                            items-center
                                            gap-3
                                            rounded-xl
                                            border
                                            border-slate-200
                                            bg-slate-50
                                            px-3
                                            py-3
                                        "
                                    >
                                        <div
                                            className="
                                                flex
                                                h-9
                                                w-9
                                                shrink-0
                                                items-center
                                                justify-center
                                                rounded-full
                                                bg-blue-100
                                                text-sm
                                                font-semibold
                                                text-blue-600
                                            "
                                        >
                                            {student.fullName
                                                .trim()
                                                .split(/\s+/)
                                                .slice(0, 2)
                                                .map(
                                                    (
                                                        part
                                                    ) =>
                                                        part
                                                            .charAt(
                                                                0
                                                            )
                                                            .toUpperCase()
                                                )
                                                .join("")}
                                        </div>

                                        <div className="min-w-0">
                                            <p
                                                id="enrollment-student"
                                                className="
                                                    truncate
                                                    text-sm
                                                    font-medium
                                                    text-slate-700
                                                "
                                            >
                                                {student.fullName}
                                            </p>

                                            <p className="text-xs text-slate-400">
                                                Student ID: {student.id}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* CURRENT ENROLLMENT */}

                                {enrollmentId && (
                                    <div
                                        className="
                                            flex
                                            items-start
                                            gap-3
                                            rounded-xl
                                            border
                                            border-blue-100
                                            bg-blue-50/60
                                            px-4
                                            py-3
                                        "
                                    >
                                        <CheckCircle2
                                            size={18}
                                            className="
                                                mt-0.5
                                                shrink-0
                                                text-blue-500
                                            "
                                        />

                                        <div>
                                            <p className="text-xs font-semibold text-blue-800">
                                                Current Enrollment
                                            </p>

                                            <p className="mt-1 text-sm text-blue-700">
                                                {student.enrollment
                                                        ?.academicYearName ??
                                                    activeAcademicYear?.name ??
                                                    "Current academic year"}

                                                {student.enrollment
                                                    ?.gradeName
                                                    ? ` • ${student.enrollment.gradeName}`
                                                    : ""}

                                                {student.enrollment
                                                    ?.sectionName
                                                    ? ` • ${student.enrollment.sectionName}`
                                                    : ""}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* ACADEMIC YEAR */}

                                <div>
                                    <label
                                        htmlFor="enrollment-academic-year"
                                        className="
                                            mb-1.5
                                            flex
                                            items-center
                                            gap-2
                                            text-sm
                                            font-medium
                                            text-slate-700
                                        "
                                    >
                                        <CalendarDays
                                            size={16}
                                            className="text-slate-400"
                                        />

                                        Academic Year
                                    </label>

                                    <select
                                        id="enrollment-academic-year"
                                        value={
                                            form.academicYearId
                                        }
                                        onChange={(event) =>
                                            handleAcademicYearChange(
                                                event.target.value
                                            )
                                        }
                                        disabled={
                                            submitting
                                        }
                                        className="
                                            w-full
                                            rounded-xl
                                            border
                                            border-slate-200
                                            bg-white
                                            px-3
                                            py-3
                                            text-sm
                                            text-slate-700
                                            outline-none
                                            transition
                                            focus:border-blue-500
                                            focus:ring-2
                                            focus:ring-blue-100
                                            disabled:cursor-not-allowed
                                            disabled:bg-slate-50
                                        "
                                    >
                                        <option value="">
                                            Select academic year
                                        </option>

                                        {academicYears
                                            .filter(
                                                (year) =>
                                                    year.active
                                            )
                                            .map(
                                                (year) => (
                                                    <option
                                                        key={
                                                            year.id
                                                        }
                                                        value={
                                                            year.id
                                                        }
                                                    >
                                                        {year.name}{" "}
                                                        (Active)
                                                    </option>
                                                )
                                            )}
                                    </select>

                                    {!academicYears.some(
                                        (year) =>
                                            year.active
                                    ) && (
                                        <p className="mt-1.5 text-xs text-amber-600">
                                            No active academic year is available.
                                        </p>
                                    )}
                                </div>

                                {/* GRADE */}

                                <div>
                                    <label
                                        htmlFor="enrollment-grade"
                                        className="
                                            mb-1.5
                                            flex
                                            items-center
                                            gap-2
                                            text-sm
                                            font-medium
                                            text-slate-700
                                        "
                                    >
                                        <GraduationCap
                                            size={16}
                                            className="text-slate-400"
                                        />

                                        Grade
                                    </label>

                                    <select
                                        id="enrollment-grade"
                                        value={form.gradeId}
                                        onChange={(event) =>
                                            handleGradeChange(
                                                event.target.value
                                            )
                                        }
                                        disabled={
                                            submitting ||
                                            loadingGrades ||
                                            !form.academicYearId
                                        }
                                        className="
                                            w-full
                                            rounded-xl
                                            border
                                            border-slate-200
                                            bg-white
                                            px-3
                                            py-3
                                            text-sm
                                            text-slate-700
                                            outline-none
                                            transition
                                            focus:border-blue-500
                                            focus:ring-2
                                            focus:ring-blue-100
                                            disabled:cursor-not-allowed
                                            disabled:bg-slate-50
                                        "
                                    >
                                        <option value="">
                                            {loadingGrades
                                                ? "Loading grades..."
                                                : !form.academicYearId
                                                    ? "Select academic year first"
                                                    : activeGrades.length ===
                                                    0
                                                        ? "No active grades available"
                                                        : "Select grade"}
                                        </option>

                                        {activeGrades.map(
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
                                </div>

                                {/* SECTION */}

                                <div>
                                    <label
                                        htmlFor="enrollment-section"
                                        className="
                                            mb-1.5
                                            flex
                                            items-center
                                            gap-2
                                            text-sm
                                            font-medium
                                            text-slate-700
                                        "
                                    >
                                        <Layers3
                                            size={16}
                                            className="text-slate-400"
                                        />

                                        Section
                                    </label>

                                    <select
                                        id="enrollment-section"
                                        value={
                                            form.sectionId
                                        }
                                        onChange={(event) =>
                                            updateField(
                                                "sectionId",
                                                event.target.value
                                            )
                                        }
                                        disabled={
                                            submitting ||
                                            loadingSections ||
                                            !form.gradeId
                                        }
                                        className="
                                            w-full
                                            rounded-xl
                                            border
                                            border-slate-200
                                            bg-white
                                            px-3
                                            py-3
                                            text-sm
                                            text-slate-700
                                            outline-none
                                            transition
                                            focus:border-blue-500
                                            focus:ring-2
                                            focus:ring-blue-100
                                            disabled:cursor-not-allowed
                                            disabled:bg-slate-50
                                        "
                                    >
                                        <option value="">
                                            {loadingSections
                                                ? "Loading sections..."
                                                : !form.gradeId
                                                    ? "Select grade first"
                                                    : activeSections.length ===
                                                    0
                                                        ? "No active sections available"
                                                        : "Select section"}
                                        </option>

                                        {activeSections.map(
                                            (section) => (
                                                <option
                                                    key={
                                                        section.id
                                                    }
                                                    value={
                                                        section.id
                                                    }
                                                >
                                                    {section.name}
                                                </option>
                                            )
                                        )}
                                    </select>

                                    {selectedGrade &&
                                        activeSections.length ===
                                        0 &&
                                        !loadingSections && (
                                            <p className="mt-1.5 text-xs text-amber-600">
                                                No active sections are available
                                                for {selectedGrade.name}.
                                            </p>
                                        )}
                                </div>

                                {/* SELECTION SUMMARY */}

                                {selectedGrade &&
                                    selectedSection && (
                                        <div
                                            className="
                                                rounded-xl
                                                border
                                                border-slate-100
                                                bg-slate-50
                                                px-4
                                                py-3
                                            "
                                        >
                                            <p className="text-xs font-medium text-slate-400">
                                                Enrollment Summary
                                            </p>

                                            <p className="mt-1 text-sm font-medium text-slate-700">
                                                {academicYears.find(
                                                        (
                                                            year
                                                        ) =>
                                                            String(
                                                                year.id
                                                            ) ===
                                                            form.academicYearId
                                                    )?.name ??
                                                    "Academic year"}{" "}
                                                •{" "}
                                                {selectedGrade.name}{" "}
                                                •{" "}
                                                {
                                                    selectedSection.name
                                                }
                                            </p>
                                        </div>
                                    )}
                            </div>
                        )}

                        {/* ERROR */}

                        {error && (
                            <div
                                className="
                                    mt-5
                                    rounded-xl
                                    border
                                    border-red-200
                                    bg-red-50
                                    px-4
                                    py-3
                                    text-sm
                                    leading-5
                                    text-red-600
                                "
                                role="alert"
                            >
                                {error}
                            </div>
                        )}
                    </div>

                    {/* FOOTER */}

                    <div
                        className="
                            shrink-0
                            flex
                            items-center
                            justify-end
                            gap-3
                            border-t
                            border-slate-100
                            px-6
                            py-5
                        "
                    >
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="
                                rounded-xl
                                border
                                border-slate-300
                                bg-white
                                px-5
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
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={
                                submitting ||
                                loadingData ||
                                loadingGrades ||
                                loadingSections ||
                                !form.academicYearId ||
                                !form.gradeId ||
                                !form.sectionId
                            }
                            className="
                                inline-flex
                                items-center
                                gap-2
                                rounded-xl
                                bg-blue-600
                                px-5
                                py-2.5
                                text-sm
                                font-medium
                                text-white
                                shadow-sm
                                transition
                                hover:bg-blue-700
                                disabled:cursor-not-allowed
                                disabled:opacity-60
                            "
                        >
                            {submitting ? (
                                <>
                                    <span
                                        className="
                                            h-4
                                            w-4
                                            animate-spin
                                            rounded-full
                                            border-2
                                            border-white/40
                                            border-t-white
                                        "
                                    />

                                    Saving...
                                </>
                            ) : enrollmentId ? (
                                <>
                                    <CheckCircle2 size={16} />

                                    Save Changes
                                </>
                            ) : (
                                <>
                                    <GraduationCap size={16} />

                                    Assign Enrollment
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
