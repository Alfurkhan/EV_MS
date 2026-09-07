import { useEffect, useState } from "react";
import {
    BookOpen,
    ChevronDown,
    ChevronRight,
    Loader2,
    Plus,
    Trash2,
    X,
} from "lucide-react";
import toast from "react-hot-toast";

import {
    assignSubjectToGrade,
    getAllSubjects,
    getSubjectsForGrade,
    removeSubjectFromGrade,
    type Subject,
} from "../services/subjectService";

import AssignSubjectModal from "./AssignSubjectModal";

interface Grade {
    id: number;
    name: string;
    description?: string | null;
    active: boolean;
}

interface SubjectsSectionProps {
    grades: Grade[];
}

interface RemoveDialogState {
    gradeId: number;
    subject: Subject;
}

export default function SubjectsSection({
                                            grades,
                                        }: SubjectsSectionProps) {
    const [expandedGradeId, setExpandedGradeId] =
        useState<number | null>(null);

    const [subjectsByGrade, setSubjectsByGrade] =
        useState<Record<number, Subject[]>>({});

    const [loadingGradeId, setLoadingGradeId] =
        useState<number | null>(null);

    const [loadingGradeSubjects, setLoadingGradeSubjects] =
        useState(true);

    const [allSubjects, setAllSubjects] =
        useState<Subject[]>([]);

    const [loadingAllSubjects, setLoadingAllSubjects] =
        useState(false);

    const [hasLoadedAllSubjects, setHasLoadedAllSubjects] =
        useState(false);

    const [assigningGradeId, setAssigningGradeId] =
        useState<number | null>(null);

    const [assigning, setAssigning] =
        useState(false);

    const [removeDialog, setRemoveDialog] =
        useState<RemoveDialogState | null>(null);

    const [removing, setRemoving] =
        useState(false);

    /*
     * Load subjects for all Grades.
     *
     * This runs when the Grades available to the Subjects
     * section change. This allows the Subject count to be
     * displayed before a Grade accordion is expanded.
     */
    useEffect(() => {
        let cancelled = false;

        const loadSubjectsForAllGrades = async () => {
            if (grades.length === 0) {
                setSubjectsByGrade({});
                setLoadingGradeSubjects(false);
                return;
            }

            setLoadingGradeSubjects(true);

            try {
                const results = await Promise.all(
                    grades.map(async (grade) => {
                        try {
                            const subjects =
                                await getSubjectsForGrade(
                                    grade.id
                                );

                            return {
                                gradeId: grade.id,
                                subjects,
                            };
                        } catch (error) {
                            console.error(
                                `Failed to load subjects for grade ${grade.id}:`,
                                error
                            );

                            return {
                                gradeId: grade.id,
                                subjects: [],
                            };
                        }
                    })
                );

                if (cancelled) {
                    return;
                }

                const subjectsMap: Record<
                    number,
                    Subject[]
                > = {};

                results.forEach(
                    ({
                        gradeId,
                        subjects,
                    }) => {
                        subjectsMap[gradeId] = subjects;
                    }
                );

                setSubjectsByGrade(subjectsMap);
            } catch (error) {
                if (cancelled) {
                    return;
                }

                console.error(
                    "Failed to load subjects for Grades:",
                    error
                );

                toast.error(
                    "Failed to load Grade subjects."
                );
            } finally {
                if (!cancelled) {
                    setLoadingGradeSubjects(false);
                }
            }
        };

        loadSubjectsForAllGrades();

        return () => {
            cancelled = true;
        };
    }, [grades]);

    /*
     * Load / refresh subjects assigned to a single Grade.
     */
    const loadSubjectsForGrade = async (
        gradeId: number
    ) => {
        try {
            setLoadingGradeId(gradeId);

            const subjects =
                await getSubjectsForGrade(gradeId);

            setSubjectsByGrade((previous) => ({
                ...previous,
                [gradeId]: subjects,
            }));
        } catch (error) {
            console.error(
                "Failed to load subjects for grade:",
                error
            );

            setSubjectsByGrade((previous) => ({
                ...previous,
                [gradeId]: [],
            }));

            toast.error(
                "Failed to load subjects for this Grade."
            );
        } finally {
            setLoadingGradeId(null);
        }
    };

    /*
     * Expand / collapse Grade.
     *
     * Subjects are already preloaded when possible, so
     * expanding a Grade does not unnecessarily fetch them
     * again.
     */
    const handleGradeClick = async (
        gradeId: number
    ) => {
        if (expandedGradeId === gradeId) {
            setExpandedGradeId(null);
            return;
        }

        setExpandedGradeId(gradeId);

        /*
         * If this Grade has not been loaded yet, load it.
         * This also protects against a user clicking an
         * accordion while the initial preload is still running.
         */
        if (!(gradeId in subjectsByGrade)) {
            await loadSubjectsForGrade(gradeId);
        }
    };

    /*
     * Open Assign Subject modal.
     */
    const handleOpenAssignModal = async (
        gradeId: number
    ) => {
        setAssigningGradeId(gradeId);

        if (hasLoadedAllSubjects) {
            return;
        }

        try {
            setLoadingAllSubjects(true);

            const subjects =
                await getAllSubjects();

            setAllSubjects(subjects);
            setHasLoadedAllSubjects(true);
        } catch (error) {
            console.error(
                "Failed to load all subjects:",
                error
            );

            toast.error(
                "Failed to load available subjects."
            );

            setAssigningGradeId(null);
        } finally {
            setLoadingAllSubjects(false);
        }
    };

    /*
     * Assign Subject to Grade.
     */
    const handleAssignSubject = async (
        subjectId: number
    ) => {
        if (assigningGradeId === null) {
            return;
        }

        const gradeId = assigningGradeId;

        try {
            setAssigning(true);

            await assignSubjectToGrade(
                subjectId,
                gradeId
            );

            toast.success(
                "Subject assigned successfully."
            );

            setAssigningGradeId(null);

            /*
             * Refresh the Grade's subjects.
             *
             * This also updates the Subject count in the
             * accordion header immediately.
             */
            await loadSubjectsForGrade(gradeId);
        } catch (error) {
            console.error(
                "Failed to assign subject:",
                error
            );

            toast.error(
                "Failed to assign subject."
            );
        } finally {
            setAssigning(false);
        }
    };

    /*
     * Open remove confirmation.
     */
    const handleRemoveClick = (
        gradeId: number,
        subject: Subject
    ) => {
        setRemoveDialog({
            gradeId,
            subject,
        });
    };

    /*
     * Confirm Subject removal.
     */
    const handleConfirmRemove = async () => {
        if (!removeDialog) {
            return;
        }

        const {
            gradeId,
            subject,
        } = removeDialog;

        try {
            setRemoving(true);

            await removeSubjectFromGrade(
                subject.id,
                gradeId
            );

            toast.success(
                "Subject removed successfully."
            );

            setRemoveDialog(null);

            /*
             * Refresh the Grade's subjects.
             *
             * This also updates the Subject count in the
             * accordion header immediately.
             */
            await loadSubjectsForGrade(gradeId);
        } catch (error) {
            console.error(
                "Failed to remove subject:",
                error
            );

            toast.error(
                "Failed to remove subject."
            );
        } finally {
            setRemoving(false);
        }
    };

    /*
     * No Grades available.
     */
    if (grades.length === 0) {
        return (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-8 text-center">
                <BookOpen className="mx-auto mb-3 h-8 w-8 text-slate-400" />

                <p className="text-sm font-semibold text-slate-700">
                    No grades available
                </p>

                <p className="mt-1 text-xs text-slate-500">
                    Create a Grade first to manage its subjects.
                </p>
            </div>
        );
    }

    return (
        <>
            {/* Subjects / Grade Accordion */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {grades.map((grade, index) => {
                    const isExpanded =
                        expandedGradeId === grade.id;

                    const hasLoadedSubjects =
                        grade.id in subjectsByGrade;

                    const subjects =
                        subjectsByGrade[grade.id] ?? [];

                    const isLoading =
                        loadingGradeId === grade.id;

                    const isAssigningThisGrade =
                        assigningGradeId === grade.id;

                    return (
                        <div
                            key={grade.id}
                            className={
                                index !== grades.length - 1
                                    ? "border-b border-slate-200"
                                    : ""
                            }
                        >
                            {/* ================================================= */}
                            {/* GRADE ACCORDION HEADER */}
                            {/* ================================================= */}
                            <button
                                type="button"
                                onClick={() =>
                                    handleGradeClick(
                                        grade.id
                                    )
                                }
                                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-slate-50"
                            >
                                <div className="flex min-w-0 items-center gap-3">
                                    {/* Grade Icon */}
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                        <BookOpen className="h-4 w-4" />
                                    </div>

                                    {/* Grade Information */}
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-slate-800">
                                            {grade.name}
                                        </p>

                                        <p className="mt-0.5 text-xs text-slate-500">
                                            {isExpanded
                                                ? "Subjects assigned to this Grade"
                                                : "Click to view subjects"}
                                        </p>
                                    </div>
                                </div>

                                {/* Count + Arrow */}
                                <div className="flex shrink-0 items-center gap-3">
                                    <span className="hidden rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 sm:inline-flex">
                                        {!hasLoadedSubjects &&
                                        loadingGradeSubjects ? (
                                            "Loading..."
                                        ) : (
                                            `${subjects.length} ${
    subjects.length ===
    1
        ? "Subject"
        : "Subjects"
}`
                                        )}
                                    </span>

                                    {isExpanded ? (
                                        <ChevronDown className="h-4 w-4 text-slate-500" />
                                    ) : (
                                        <ChevronRight className="h-4 w-4 text-slate-500" />
                                    )}
                                </div>
                            </button>

                            {/* ================================================= */}
                            {/* EXPANDED GRADE */}
                            {/* ================================================= */}
                            {isExpanded && (
                                <div className="border-t border-slate-200 bg-slate-50/60 px-5 py-5">
                                    {/* Expanded Toolbar */}
                                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-800">
                                                Assigned Subjects
                                            </p>

                                            <p className="mt-0.5 text-xs text-slate-500">
                                                Manage subjects assigned
                                                to {grade.name}.
                                            </p>
                                        </div>

                                        {subjects.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleOpenAssignModal(
                                                        grade.id
                                                    )
                                                }
                                                disabled={
                                                    isAssigningThisGrade ||
                                                    loadingAllSubjects
                                                }
                                                className="inline-flex w-fit items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                {isAssigningThisGrade &&
                                                loadingAllSubjects ? (
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                ) : (
                                                    <Plus className="h-3.5 w-3.5" />
                                                )}

                                                Assign Subject
                                            </button>
                                        )}
                                    </div>

                                    {/* ================================================= */}
                                    {/* LOADING */}
                                    {/* ================================================= */}
                                    {isLoading ? (
                                        <div className="flex min-h-[120px] items-center justify-center rounded-xl border border-slate-200 bg-white">
                                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Loading subjects...
                                            </div>
                                        </div>
                                    ) : subjects.length === 0 ? (
                                        /* ================================================= */
                                        /* EMPTY STATE */
                                        /* ================================================= */
                                        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-7 text-center">
                                            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                                                <BookOpen className="h-5 w-5 text-slate-400" />
                                            </div>

                                            <p className="text-sm font-semibold text-slate-700">
                                                No subjects assigned
                                            </p>

                                            <p className="mt-1 text-xs text-slate-500">
                                                Assign a subject to{" "}
                                                {grade.name} to get
                                                started.
                                            </p>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleOpenAssignModal(
                                                        grade.id
                                                    )
                                                }
                                                disabled={
                                                    loadingAllSubjects
                                                }
                                                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <Plus className="h-3.5 w-3.5" />
                                                Assign Subject
                                            </button>
                                        </div>
                                    ) : (
                                        /* ================================================= */
                                        /* SUBJECT TABLE */
                                        /* ================================================= */
                                        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                                            <div className="overflow-x-auto">
                                                <table className="w-full min-w-[650px] text-sm">
                                                    <thead>
                                                    <tr className="border-b border-slate-200 bg-slate-50">
                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">
                                                            Subject
                                                        </th>

                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">
                                                            Code
                                                        </th>

                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">
                                                            Status
                                                        </th>

                                                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">
                                                            Action
                                                        </th>
                                                    </tr>
                                                    </thead>

                                                    <tbody>
                                                    {subjects.map(
                                                        (
                                                            subject
                                                        ) => {
                                                            const isRemoving =
                                                                removing &&
                                                                removeDialog?.subject
                                                                    .id ===
                                                                subject.id;

                                                            return (
                                                                <tr
                                                                    key={
                                                                        subject.id
                                                                    }
                                                                    className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/70"
                                                                >
                                                                    {/* Subject */}
                                                                    <td className="px-4 py-3.5">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                                                                <BookOpen className="h-4 w-4" />
                                                                            </div>

                                                                            <div>
                                                                                <p className="whitespace-nowrap text-sm font-medium text-slate-800">
                                                                                    {
                                                                                        subject.name
                                                                                    }
                                                                                </p>

                                                                                {subject.description && (
                                                                                    <p className="mt-0.5 max-w-[280px] truncate text-xs text-slate-400">
                                                                                        {
                                                                                            subject.description
                                                                                        }
                                                                                    </p>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </td>

                                                                    {/* Code */}
                                                                    <td className="px-4 py-3.5">
                                                                        <span className="whitespace-nowrap text-sm text-slate-500">
                                                                            {
                                                                                subject.code
                                                                            }
                                                                        </span>
                                                                    </td>

                                                                    {/* Status */}
                                                                    <td className="px-4 py-3.5">
                                                                        <span
                                                                            className={
                                                                                subject.active
                                                                                    ? "inline-flex rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700"
                                                                                    : "inline-flex rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700"
                                                                            }
                                                                        >
                                                                            {subject.active
                                                                                ? "Active"
                                                                                : "Inactive"}
                                                                        </span>
                                                                    </td>

                                                                    {/* Action */}
                                                                    <td className="px-4 py-3.5 text-right">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                handleRemoveClick(
                                                                                    grade.id,
                                                                                    subject
                                                                                )
                                                                            }
                                                                            disabled={
                                                                                isRemoving
                                                                            }
                                                                            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                                        >
                                                                            {isRemoving ? (
                                                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                                            ) : (
                                                                                <Trash2 className="h-3.5 w-3.5" />
                                                                            )}

                                                                            Remove
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        }
                                                    )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* ========================================================= */}
            {/* ASSIGN SUBJECT MODAL */}
            {/* ========================================================= */}
            <AssignSubjectModal
                isOpen={assigningGradeId !== null}
                grade={
                    grades.find(
                        (grade) =>
                            grade.id ===
                            assigningGradeId
                    ) ?? null
                }
                subjects={allSubjects}
                assignedSubjectIds={
                    assigningGradeId !== null
                        ? new Set(
                            (
                                subjectsByGrade[
                                    assigningGradeId
                                    ] ?? []
                            ).map(
                                (subject) =>
                                    subject.id
                            )
                        )
                        : new Set<number>()
                }
                loadingSubjects={loadingAllSubjects}
                assigning={assigning}
                onClose={() =>
                    setAssigningGradeId(null)
                }
                onAssign={handleAssignSubject}
            />

            {/* ========================================================= */}
            {/* REMOVE SUBJECT CONFIRMATION */}
            {/* ========================================================= */}
            {removeDialog && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                    {/* Overlay */}
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={() => {
                            if (!removing) {
                                setRemoveDialog(null);
                            }
                        }}
                    />

                    {/* Dialog */}
                    <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
                            <div className="flex items-start gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
                                    <Trash2 className="h-4 w-4" />
                                </div>

                                <div>
                                    <h2 className="text-sm font-semibold text-slate-800">
                                        Remove Subject?
                                    </h2>

                                    <p className="mt-0.5 text-xs text-slate-500">
                                        This will remove the subject
                                        from this Grade.
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setRemoveDialog(null)
                                }
                                disabled={removing}
                                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="px-5 py-5">
                            <p className="text-sm leading-6 text-slate-700">
                                Are you sure you want to remove{" "}
                                <span className="font-semibold text-slate-900">
                                    {removeDialog.subject.name}
                                </span>{" "}
                                from{" "}
                                <span className="font-semibold text-slate-900">
                                    {grades.find(
                                        (grade) =>
                                            grade.id ===
                                            removeDialog.gradeId
                                    )?.name ??
                                        "this Grade"}
                                </span>
                                ?
                            </p>

                            <p className="mt-2 text-xs text-slate-500">
                                The Subject itself will not be deleted.
                                Only the assignment will be removed.
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">
                            <button
                                type="button"
                                onClick={() =>
                                    setRemoveDialog(null)
                                }
                                disabled={removing}
                                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={
                                    handleConfirmRemove
                                }
                                disabled={removing}
                                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {removing && (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                )}

                                {removing
                                    ? "Removing..."
                                    : "Remove"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

