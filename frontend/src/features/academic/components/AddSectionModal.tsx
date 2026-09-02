import { useState } from "react";
import { X, Plus } from "lucide-react";
import { toast } from "react-hot-toast";

import {
    createSection,
    type SectionRequest,
} from "../services/sectionService";

import type { Grade } from "../services/gradeService";

interface AddSectionModalProps {
    grade: Grade;
    onClose: () => void;
    onAdded: () => void;
}

export default function AddSectionModal({
                                            grade,
                                            onClose,
                                            onAdded,
                                        }: AddSectionModalProps) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [saving, setSaving] = useState(false);

    const handleSubmit = async () => {
        const trimmedName = name.trim();

        if (!trimmedName) {
            toast.error("Section name is required.");
            return;
        }

        setSaving(true);

        try {
            const data: SectionRequest = {
                gradeId: grade.id,
                name: trimmedName,
                description: description.trim(),
            };

            await createSection(data);

            toast.success("Section added successfully.");

            onAdded();
            onClose();
        } catch (error: any) {
            console.error("Failed to add section:", error);

            const errorCode =
                error?.response?.data?.code;

            const errorMessage =
                error?.response?.data?.message;

            if (
                errorCode === "SECTION_ALREADY_EXISTS" ||
                errorMessage
                    ?.toLowerCase()
                    .includes("already exists") ||
                errorMessage
                    ?.toLowerCase()
                    .includes("duplicate")
            ) {
                toast.error(
                    `Section "${trimmedName}" already exists for ${grade.name} in the selected academic year.`
                );
            } else {
                toast.error(
                    errorMessage ||
                    "Failed to add section."
                );
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
        <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">

            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
    <div>
        <h2 className="text-lg font-semibold text-slate-900">
        Add Section
    </h2>

    <p className="mt-1 text-sm text-slate-500">
        Create a new section for this grade
    </p>
    </div>

    <button
    type="button"
    onClick={onClose}
    disabled={saving}
    className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
    <X size={20} />
    </button>
    </div>

    {/* Content */}
    <div className="space-y-6 px-6 py-6">

    {/* Academic Context */}
    <div>
    <h3 className="mb-4 text-sm font-semibold text-slate-800">
        Academic Information
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

    {/* Grade */}
    <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
        Grade
        </label>

        <input
    type="text"
    value={grade.name}
    disabled
    className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm text-slate-500"
        />
        </div>
        </div>
        </div>

    {/* Section Information */}
    <div>
        <h3 className="mb-4 text-sm font-semibold text-slate-800">
        Section Information
    </h3>

    <div className="space-y-4">

    {/* Section Name */}
    <div>
    <label className="mb-1.5 block text-sm font-medium text-slate-700">
        Section Name
    </label>

    <input
    type="text"
    value={name}
    onChange={(e) =>
    setName(e.target.value)
}
    disabled={saving}
    autoFocus
    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
    placeholder="Enter section name"
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
    disabled={saving}
    rows={4}
    className="w-full resize-none rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
    placeholder="Enter section description"
        />
        </div>
        </div>
        </div>
        </div>

    {/* Footer */}
    <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
    <button
        type="button"
    onClick={onClose}
    disabled={saving}
    className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
        Cancel
        </button>

        <button
    type="button"
    onClick={handleSubmit}
    disabled={saving}
    className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
    <Plus size={16} />

    {saving
        ? "Adding..."
        : "Add Section"}
    </button>
    </div>
    </div>
    </div>
);
}