import {
    AlertTriangle,
    Loader2,
    Trash2,
    X,
} from "lucide-react";

import { useState } from "react";

import {
    deleteTimetable,
} from "../services/timetableService";

import type { Timetable } from "../types/timetable";

interface DeleteScheduleModalProps {
    open: boolean;
    timetable: Timetable | null;
    onClose: () => void;
    onSuccess: () => void;
}

export default function DeleteScheduleModal({
                                                open,
                                                timetable,
                                                onClose,
                                                onSuccess,
                                            }: DeleteScheduleModalProps) {
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!open || !timetable) {
        return null;
    }

    const getErrorMessage = (err: unknown): string => {
        if (
            typeof err === "object" &&
            err !== null &&
            "response" in err
        ) {
            const response = (
                err as {
                    response?: {
                        data?: {
                            message?: string;
                        };
                    };
                }
            ).response;

            if (response?.data?.message) {
                return response.data.message;
            }
        }

        if (err instanceof Error) {
            return err.message;
        }

        return "Failed to delete schedule. Please try again.";
    };

    const handleDelete = async () => {
        try {
            setDeleting(true);
            setError(null);

            await deleteTimetable(timetable.id);

            onSuccess();
        } catch (err) {
            console.error(
                "Failed to delete timetable:",
                err
            );

            setError(getErrorMessage(err));
        } finally {
            setDeleting(false);
        }
    };

    const handleClose = () => {
        if (deleting) {
            return;
        }

        setError(null);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 px-4 py-6">
            {/* Backdrop */}
            <div
    className="absolute inset-0"
    onClick={handleClose}
    />

    {/* Modal */}
    <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
    <div className="flex items-center gap-3">
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
    <Trash2 size={20} />
    </div>

    <div>
    <h2 className="text-base font-semibold text-slate-900">
        Delete Schedule
    </h2>

    <p className="text-xs text-slate-500">
        This action cannot be undone.
    </p>
    </div>
    </div>

    <button
    type="button"
    onClick={handleClose}
    disabled={deleting}
    className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
    aria-label="Close"
    >
    <X size={19} />
    </button>
    </div>

    {/* Body */}
    <div className="px-5 py-5">
        {/* Warning */}
        <div className="mb-4 flex gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
    <AlertTriangle
        size={19}
    className="mt-0.5 shrink-0 text-red-600"
    />

    <p className="text-sm leading-5 text-red-700">
        Are you sure you want to permanently delete
        this timetable schedule?
        </p>
        </div>

        {/* Schedule summary */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
    <div className="space-y-2.5">
    <div className="flex items-center justify-between gap-4">
    <span className="text-xs font-medium text-slate-500">
        Subject
        </span>

        <span className="text-right text-sm font-semibold text-slate-800">
        {timetable.subjectName}
        </span>
        </div>

        <div className="flex items-center justify-between gap-4">
    <span className="text-xs font-medium text-slate-500">
        Class
        </span>

        <span className="text-right text-sm text-slate-700">
        {timetable.gradeName} — Section{" "}
    {timetable.sectionName}
    </span>
    </div>

    <div className="flex items-center justify-between gap-4">
    <span className="text-xs font-medium text-slate-500">
        Faculty
        </span>

        <span className="text-right text-sm text-slate-700">
        {timetable.facultyName}
        </span>
        </div>

        <div className="flex items-center justify-between gap-4">
    <span className="text-xs font-medium text-slate-500">
        Schedule
    </span>

            <span className="text-right text-sm text-slate-700">
        {timetable.dayOfWeek}{" "}
                {timetable.startTime.slice(0, 5)}
                {" – "}
                {timetable.endTime.slice(0, 5)}
    </span>
        </div>

        <div className="flex items-center justify-between gap-4">
    <span className="text-xs font-medium text-slate-500">
        Date Range
    </span>

            <span className="text-right text-sm text-slate-700">
        {timetable.startDate}{" "}
                {" – "}
                {timetable.endDate}
    </span>
        </div>

        <div className="flex items-center justify-between gap-4">
    <span className="text-xs font-medium text-slate-500">
        Class Type
    </span>

            <span className="text-right text-sm text-slate-700">
        {timetable.classType === "ONLINE"
            ? "Online"
            : "Offline"}
    </span>
        </div>

        <div className="flex items-center justify-between gap-4">
    <span className="text-xs font-medium text-slate-500">
        {timetable.classType === "ONLINE"
            ? "Meeting Link"
            : "Room"}
    </span>

            <span className="max-w-[220px] truncate text-right text-sm text-slate-700">
        {timetable.classType === "ONLINE"
            ? timetable.meetingLink || "—"
            : timetable.room || "—"}
    </span>
        </div>
        </div>
        </div>

    {/* Error */}
    {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
            </div>
    )}
    </div>

    {/* Footer */}
    <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4">
    <button
        type="button"
    onClick={handleClose}
    disabled={deleting}
    className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
        Cancel
        </button>

        <button
    type="button"
    onClick={() => void handleDelete()}
    disabled={deleting}
    className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
        {deleting ? (
                    <>
                        <Loader2
                            size={16}
                className="animate-spin"
                    />
                    Deleting...
                </>
) : (
        <>
            <Trash2 size={16} />
    Delete Schedule
    </>
)}
    </button>
    </div>
    </div>
    </div>
);
}