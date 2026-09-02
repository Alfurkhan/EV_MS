import { useState } from "react";
import type { StudentEnrollment } from "../services/studentEnrollmentService";
import {
    activateEnrollment,
    deactivateEnrollment,
    deleteEnrollment,
} from "../services/studentEnrollmentService";

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
    const [loading, setLoading] = useState(false);
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

    const handleSave = async () => {
        if (active === enrollment.active) {
            onClose();
            return;
        }

        try {
            setLoading(true);

            if (active) {
                await activateEnrollment(enrollment.id);
            } else {
                await deactivateEnrollment(enrollment.id);
            }

            onUpdated();
            onClose();
        } catch (error) {
            console.error("Failed to update enrollment:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        try {
            setLoading(true);

            await deleteEnrollment(enrollment.id);

            onUpdated();
            onClose();
        } catch (error) {
            console.error("Failed to delete enrollment:", error);
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
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Grade
                            </p>

                            <p className="mt-1 text-sm text-slate-700">
                                {enrollment.gradeName}
                            </p>
                        </div>

                        {/* Section */}
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Section
                            </p>

                            <p className="mt-1 text-sm text-slate-700">
                                {enrollment.sectionName}
                            </p>
                        </div>

                        {/* Status */}
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Status
                            </p>

                            <label className="mt-2 flex cursor-pointer items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={active}
                                    onChange={(event) =>
                                        setActive(event.target.checked)
                                    }
                                    disabled={loading}
                                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />

                                <span className="text-sm font-medium text-slate-700">
                                    {active ? "Active" : "Inactive"}
                                </span>
                            </label>
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
                                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
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