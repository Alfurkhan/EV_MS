import { useEffect, useState } from "react";
import {
    BookOpen,
    Loader2,
    X,
} from "lucide-react";

import type { Subject } from "../services/subjectService";

interface Grade {
    id: number;
    name: string;
}

interface AssignSubjectModalProps {
    isOpen: boolean;
    grade: Grade | null;
    subjects: Subject[];
    assignedSubjectIds: Set<number>;
    loadingSubjects: boolean;
    assigning: boolean;
    onClose: () => void;
    onAssign: (subjectId: number) => Promise<void>;
}

export default function AssignSubjectModal({
                                               isOpen,
                                               grade,
                                               subjects,
                                               assignedSubjectIds,
                                               loadingSubjects,
                                               assigning,
                                               onClose,
                                               onAssign,
                                           }: AssignSubjectModalProps) {
    const [selectedSubjectId, setSelectedSubjectId] =
        useState("");

    useEffect(() => {
        if (!isOpen) {
            setSelectedSubjectId("");
        }
    }, [isOpen]);

    if (!isOpen || !grade) {
        return null;
    }

    const availableSubjects = subjects.filter(
        (subject) =>
            subject.active &&
            !assignedSubjectIds.has(subject.id)
    );

    const handleSubmit = async (
        event: React.FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        if (!selectedSubjectId) {
            return;
        }

        await onAssign(
            Number(selectedSubjectId)
        );
    };

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            {/* ===================================================== */}
            {/* BACKDROP */}
            {/* ===================================================== */}
            <div
                className="absolute inset-0 bg-black/40"
                onClick={() => {
                    if (!assigning) {
                        onClose();
                    }
                }}
            />

            {/* ===================================================== */}
            {/* MODAL */}
            {/* ===================================================== */}
            <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                {/* ================================================= */}
                {/* HEADER */}
                {/* ================================================= */}
                <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
                    <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                            <BookOpen className="h-4 w-4" />
                        </div>

                        <div>
                            <h2 className="text-sm font-semibold text-slate-800">
                                Assign Subject
                            </h2>

                            <p className="mt-0.5 text-xs text-slate-500">
                                Add a subject to{" "}
                                <span className="font-medium text-slate-700">
                                    {grade.name}
                                </span>
                                .
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={assigning}
                        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* ================================================= */}
                {/* FORM */}
                {/* ================================================= */}
                <form
                    onSubmit={handleSubmit}
                    className="px-5 py-5"
                >
                    <div className="space-y-5">
                        {/* Grade */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700">
                                Grade
                            </label>

                            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-700">
                                {grade.name}
                            </div>
                        </div>

                        {/* Subject */}
                        <div className="space-y-1.5">
                            <label
                                htmlFor="subject"
                                className="text-xs font-semibold text-slate-700"
                            >
                                Subject
                            </label>

                            {loadingSubjects ? (
                                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-500">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Loading subjects...
                                </div>
                            ) : availableSubjects.length === 0 ? (
                                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3.5 py-3 text-sm text-slate-500">
                                    All active subjects are already
                                    assigned to this Grade.
                                </div>
                            ) : (
                                <select
                                    id="subject"
                                    value={
                                        selectedSubjectId
                                    }
                                    onChange={(event) =>
                                        setSelectedSubjectId(
                                            event.target.value
                                        )
                                    }
                                    disabled={assigning}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="">
                                        Select a subject
                                    </option>

                                    {availableSubjects.map(
                                        (subject) => (
                                            <option
                                                key={
                                                    subject.id
                                                }
                                                value={
                                                    subject.id
                                                }
                                            >
                                                {subject.name} (
                                                {
                                                    subject.code
                                                })
                                            </option>
                                        )
                                    )}
                                </select>
                            )}
                        </div>
                    </div>

                    {/* ================================================= */}
                    {/* ACTIONS */}
                    {/* ================================================= */}
                    <div className="mt-6 flex justify-end gap-2 border-t border-slate-200 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={assigning}
                            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={
                                assigning ||
                                loadingSubjects ||
                                !selectedSubjectId ||
                                availableSubjects.length === 0
                            }
                            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {assigning && (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            )}

                            {assigning
                                ? "Assigning..."
                                : "Assign Subject"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}