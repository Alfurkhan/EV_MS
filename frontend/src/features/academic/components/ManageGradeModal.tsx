import { useEffect, useState } from "react";
import { X, Pencil, Trash2, Power } from "lucide-react";
import { toast } from "react-hot-toast";

import {
    updateGrade,
    activateGrade,
    deactivateGrade,
    deleteGrade,
    type Grade,
} from "../services/gradeService";

interface ManageGradeModalProps {
    grade: Grade;
    onClose: () => void;
    onUpdated: () => void;
}

export default function ManageGradeModal({
                                             grade,
                                             onClose,
                                             onUpdated,
                                         }: ManageGradeModalProps) {
    const [name, setName] = useState(grade.name);
    const [description, setDescription] = useState(
        grade.description ?? ""
    );
    const [draftActive, setDraftActive] = useState(grade.active);

    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        setName(grade.name);
        setDescription(grade.description ?? "");
        setDraftActive(grade.active);
    }, [grade]);

    const hasChanges =
        name.trim() !== grade.name ||
        description !== (grade.description ?? "") ||
        draftActive !== grade.active;

    const handleSave = async () => {
        if (!name.trim()) {
            toast.error("Grade name is required.");
            return;
        }

        if (!hasChanges) {
            return;
        }

        setSaving(true);

        try {
            const detailsChanged =
                name.trim() !== grade.name ||
                description !== (grade.description ?? "");

            if (detailsChanged) {
                await updateGrade(grade.id, {
                    academicYearId: grade.academicYearId,
                    name: name.trim(),
                    description: description.trim(),
                });
            }

            if (draftActive !== grade.active) {
                if (draftActive) {
                    await activateGrade(grade.id);
                } else {
                    await deactivateGrade(grade.id);
                }
            }

            toast.success("Grade updated successfully.");

            onUpdated();
            onClose();
        } catch (error: any) {
            console.error("Failed to update grade:", error);

            /*
             * Handle duplicate grade names explicitly.
             *
             * The backend already validates that a grade name
             * must be unique within the same academic year.
             * If that validation fails, show the backend message
             * instead of the generic "Failed to update grade."
             */
            const errorCode =
                error?.response?.data?.code;

            const errorMessage =
                error?.response?.data?.message;

            if (
                errorCode === "GRADE_ALREADY_EXISTS" ||
                errorMessage?.toLowerCase().includes("already exists") ||
                errorMessage?.toLowerCase().includes("duplicate")
            ) {
                toast.error(
                    `Grade "${name.trim()}" already exists for the selected academic year.`
                );
            } else {
                toast.error(
                    errorMessage ||
                    "Failed to update grade."
                );
            }
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);

        try {
            await deleteGrade(grade.id);

            toast.success("Grade deleted successfully.");

            onUpdated();
            onClose();
        } catch (error: any) {
            console.error("Failed to delete grade:", error);

            toast.error(
                error?.response?.data?.message ||
                "Failed to delete grade."
            );
        } finally {
            setDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 px-4 py-6">
            <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">
                            Manage Grade
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Edit grade information and status
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving || deleting}
                        className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-6">

                    {/* Grade Information */}
                    <div>
                        <h3 className="mb-4 text-sm font-semibold text-slate-800">
                            Grade Information
                        </h3>

                        <div className="space-y-4">

                            {/* Academic Year */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Academic Year
                                </label>

                                <input
                                    type="text"
                                    value={grade.academicYearName}
                                    disabled
                                    className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm text-slate-500"
                                />
                            </div>

                            {/* Grade Name */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Grade Name
                                </label>

                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) =>
                                        setName(e.target.value)
                                    }
                                    disabled={saving || deleting}
                                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                                    placeholder="Enter grade name"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Description
                                </label>

                                <textarea
                                    value={description}
                                    onChange={(e) =>
                                        setDescription(e.target.value)
                                    }
                                    disabled={saving || deleting}
                                    rows={4}
                                    className="w-full resize-none rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                                    placeholder="Enter grade description"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Status */}
                    <div>
                        <h3 className="mb-4 text-sm font-semibold text-slate-800">
                            Status
                        </h3>

                        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                            <div>
                                <p className="text-sm font-medium text-slate-800">
                                    Grade Status
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                    {draftActive
                                        ? "This grade is currently active."
                                        : "This grade is currently inactive."}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setDraftActive(!draftActive)
                                }
                                disabled={saving || deleting}
                                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                    draftActive
                                        ? "bg-red-50 text-red-600 hover:bg-red-100"
                                        : "bg-green-50 text-green-600 hover:bg-green-100"
                                }`}
                            >
                                <Power size={16} />

                                {draftActive
                                    ? "Deactivate"
                                    : "Activate"}
                            </button>
                        </div>
                    </div>

                    {/* Delete */}
                    <div className="border-t border-slate-200 pt-5">
                        <button
                            type="button"
                            onClick={() =>
                                setShowDeleteConfirm(true)
                            }
                            disabled={saving || deleting}
                            className="flex items-center gap-2 text-sm font-medium text-red-600 transition hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Trash2 size={17} />

                            Delete Grade
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving || deleting}
                        className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={
                            !hasChanges ||
                            saving ||
                            deleting
                        }
                        className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Pencil size={16} />

                        {saving
                            ? "Saving..."
                            : "Save Changes"}
                    </button>
                </div>
            </div>

            {/* Delete Confirmation */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">

                        <h3 className="text-lg font-semibold text-slate-900">
                            Delete Grade?
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-slate-600">
                            Are you sure you want to delete{" "}
                            <span className="font-semibold text-slate-900">
                                {grade.name}
                            </span>
                            ? This action cannot be undone.
                        </p>

                        <div className="mt-6 flex justify-end gap-3">

                            <button
                                type="button"
                                onClick={() =>
                                    setShowDeleteConfirm(false)
                                }
                                disabled={deleting}
                                className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={deleting}
                                className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {deleting
                                    ? "Deleting..."
                                    : "Delete Grade"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}