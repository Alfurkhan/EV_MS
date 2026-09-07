import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import type { StudentEnrollment } from "../services/studentEnrollmentService";
import {
    activateEnrollment,
    deactivateEnrollment,
    deleteEnrollment,
    updateEnrollment,
} from "../services/studentEnrollmentService";

import {
    getGradesByAcademicYear,
    type Grade,
} from "../services/gradeService";

import {
    getSectionsByGrade,
    type Section,
} from "../services/sectionService";

interface ManageStudentEnrollmentModalProps {
    enrollment: StudentEnrollment;
    onClose: () => void;
    onUpdated: () => void;
}

export default function ManageStudentEnrollmentModal({
                                                         enrollment,
                                                         onClose,
                                                         onUpdated,
                                                     }: ManageStudentEnrollmentModalProps) {
    const [active, setActive] = useState(enrollment.active);

    const [selectedGradeId, setSelectedGradeId] = useState(
        String(enrollment.gradeId)
    );

    const [selectedSectionId, setSelectedSectionId] = useState(
        String(enrollment.sectionId)
    );

    const [grades, setGrades] = useState<Grade[]>([]);
    const [sections, setSections] = useState<Section[]>([]);

    const [loadingOptions, setLoadingOptions] = useState(false);
    const [loadingSections, setLoadingSections] = useState(false);
    const [loading, setLoading] = useState(false);

    const [showDeleteConfirmation, setShowDeleteConfirmation] =
        useState(false);

    /*
     * Load active grades for this enrollment's academic year.
     */
    useEffect(() => {
        const loadGrades = async () => {
            try {
                setLoadingOptions(true);

                const data = await getGradesByAcademicYear(
                    enrollment.academicYearId
                );

                setGrades(data.filter((grade) => grade.active));
            } catch (error: any) {
                console.error("Failed to load grades:", error);

                toast.error(
                    error?.response?.data?.message ||
                    "Unable to load grades."
                );
            } finally {
                setLoadingOptions(false);
            }
        };

        loadGrades();
    }, [enrollment.academicYearId]);

    /*
     * Load active sections for the initially selected grade.
     */
    useEffect(() => {
        const loadSections = async () => {
            if (!selectedGradeId) {
                setSections([]);
                return;
            }

            try {
                setLoadingSections(true);

                const data = await getSectionsByGrade(
                    Number(selectedGradeId)
                );

                setSections(data.filter((section) => section.active));
            } catch (error: any) {
                console.error("Failed to load sections:", error);

                toast.error(
                    error?.response?.data?.message ||
                    "Unable to load sections."
                );
            } finally {
                setLoadingSections(false);
            }
        };

        loadSections();
    }, [selectedGradeId]);

    /*
     * When Grade changes:
     * 1. Update selected grade.
     * 2. Clear the old section.
     * 3. Load sections belonging to the new grade.
     */
    const handleGradeChange = async (gradeId: string) => {
        setSelectedGradeId(gradeId);
        setSelectedSectionId("");

        if (!gradeId) {
            setSections([]);
            return;
        }

        try {
            setLoadingSections(true);

            const data = await getSectionsByGrade(Number(gradeId));

            setSections(data.filter((section) => section.active));
        } catch (error: any) {
            console.error("Failed to load sections:", error);

            toast.error(
                error?.response?.data?.message ||
                "Unable to load sections."
            );

            setSections([]);
        } finally {
            setLoadingSections(false);
        }
    };

    const handleSave = async () => {
        const gradeChanged =
            Number(selectedGradeId) !== enrollment.gradeId;

        const sectionChanged =
            Number(selectedSectionId) !== enrollment.sectionId;

        const statusChanged =
            active !== enrollment.active;

        /*
         * Make sure a Grade is selected.
         */
        if (!selectedGradeId) {
            toast.error("Please select a grade.");
            return;
        }

        /*
         * Make sure a Section is selected.
         */
        if (!selectedSectionId) {
            toast.error("Please select a section.");
            return;
        }

        /*
         * Nothing changed.
         */
        if (!gradeChanged && !sectionChanged && !statusChanged) {
            onClose();
            return;
        }

        try {
            setLoading(true);

            /*
             * Update Grade / Section if either changed.
             *
             * The backend endpoint currently accepts the existing
             * StudentEnrollmentRequest, so we send the complete
             * enrollment information. The backend only uses the
             * Grade and Section values for this update operation.
             */
            if (gradeChanged || sectionChanged) {
                await updateEnrollment(enrollment.id, {
                    studentId: enrollment.studentId,
                    academicYearId: enrollment.academicYearId,
                    gradeId: Number(selectedGradeId),
                    sectionId: Number(selectedSectionId),
                });
            }

            /*
             * Update status if it changed.
             */
            if (statusChanged) {
                if (active) {
                    await activateEnrollment(enrollment.id);
                } else {
                    await deactivateEnrollment(enrollment.id);
                }
            }

            /*
             * Show one clean success message instead of multiple
             * messages when several fields were changed together.
             */
            if (gradeChanged || sectionChanged) {
                toast.success("Student enrollment updated successfully.");
            } else if (active) {
                toast.success("Student enrollment activated successfully.");
            } else {
                toast.success("Student enrollment deactivated successfully.");
            }

            onUpdated();
            onClose();
        } catch (error: any) {
            console.error("Failed to update enrollment:", error);

            toast.error(
                error?.response?.data?.message ||
                "Unable to update student enrollment."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        try {
            setLoading(true);

            await deleteEnrollment(enrollment.id);

            toast.success("Student enrollment deleted successfully.");

            onUpdated();
            onClose();
        } catch (error: any) {
            console.error("Failed to delete enrollment:", error);

            toast.error(
                error?.response?.data?.message ||
                "Unable to delete student enrollment."
            );
        } finally {
            setLoading(false);
            setShowDeleteConfirmation(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 px-4 py-6">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">

                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">
                            Manage Enrollment
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            View and manage this student's enrollment.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="text-2xl leading-none text-slate-400 transition hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        ×
                    </button>
                </div>

                {/* Content */}
                <div className="max-h-[70vh] overflow-y-auto px-6 py-6">
                    <div className="space-y-5">

                        {/* Student */}
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Student
                            </p>

                            <p className="mt-1 text-sm font-semibold text-slate-900">
                                {enrollment.studentName}
                            </p>

                            <p className="mt-1 text-sm text-slate-600">
                                {enrollment.studentEmail}
                            </p>
                        </div>

                        {/* Academic Year */}
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Academic Year
                            </p>

                            <p className="mt-1 text-sm text-slate-700">
                                {enrollment.academicYearName}
                            </p>
                        </div>

                        {/* Grade */}
                        <div>
                            <label
                                htmlFor="manage-enrollment-grade"
                                className="text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >
                                Grade
                            </label>

                            <select
                                id="manage-enrollment-grade"
                                value={selectedGradeId}
                                onChange={(event) =>
                                    handleGradeChange(event.target.value)
                                }
                                disabled={loading || loadingOptions}
                                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                            >
                                <option value="">
                                    {loadingOptions
                                        ? "Loading grades..."
                                        : "Select grade"}
                                </option>

                                {grades.map((grade) => (
                                    <option
                                        key={grade.id}
                                        value={grade.id}
                                    >
                                        {grade.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Section */}
                        <div>
                            <label
                                htmlFor="manage-enrollment-section"
                                className="text-xs font-semibold uppercase tracking-wide text-slate-500"
                            >
                                Section
                            </label>

                            <select
                                id="manage-enrollment-section"
                                value={selectedSectionId}
                                onChange={(event) =>
                                    setSelectedSectionId(event.target.value)
                                }
                                disabled={
                                    loading ||
                                    loadingSections ||
                                    !selectedGradeId
                                }
                                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                            >
                                <option value="">
                                    {loadingSections
                                        ? "Loading sections..."
                                        : !selectedGradeId
                                            ? "Select a grade first"
                                            : "Select section"}
                                </option>

                                {sections.map((section) => (
                                    <option
                                        key={section.id}
                                        value={section.id}
                                    >
                                        {section.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Status */}
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Status
                            </p>

                            <button
                                type="button"
                                onClick={() => setActive(!active)}
                                disabled={loading}
                                className={`mt-2 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                    active
                                        ? "bg-red-50 text-red-600 hover:bg-red-100"
                                        : "bg-green-50 text-green-600 hover:bg-green-100"
                                }`}
                            >
                                {/* Power Icon */}
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    className="h-4 w-4"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 3v9"
                                    />

                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M18.36 6.64a9 9 0 1 1-12.73 0"
                                    />
                                </svg>

                                {active ? "Deactivate" : "Activate"}
                            </button>

                            <p className="mt-2 text-xs text-slate-500">
                                Current status:{" "}
                                <span className="font-medium text-slate-700">
                                    {active ? "Active" : "Inactive"}
                                </span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
                    <button
                        type="button"
                        onClick={() => setShowDeleteConfirmation(true)}
                        disabled={loading}
                        className="text-sm font-medium text-red-600 transition hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Delete
                    </button>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={loading}
                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading ? "Saving..." : "Save"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation */}
            {showDeleteConfirmation && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                        <h3 className="text-lg font-semibold text-slate-900">
                            Delete Enrollment?
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-slate-600">
                            Are you sure you want to delete the enrollment for{" "}
                            <span className="font-semibold text-slate-900">
                                {enrollment.studentName}
                            </span>
                            ?
                        </p>

                        <p className="mt-2 text-sm text-red-600">
                            This action cannot be undone.
                        </p>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() =>
                                    setShowDeleteConfirmation(false)
                                }
                                disabled={loading}
                                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={loading}
                                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {loading ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}