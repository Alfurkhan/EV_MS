import {
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from "react";

import { createPortal } from "react-dom";

import {
    Eye,
    Pencil,
    Power,
    Lock,
    Unlock,
    Trash2,
    AlertTriangle,
    X,
} from "lucide-react";

import toast from "react-hot-toast";

import type { Faculty } from "../types/faculty";

import {
    disableFaculty,
    enableFaculty,
    lockFaculty,
    unlockFaculty,
    deleteFaculty,
} from "../services/facultyService";

interface FacultyActionsMenuProps {
    faculty: Faculty;
    onViewDetails: (faculty: Faculty) => void;
    onEditFaculty: (faculty: Faculty) => void;
    onSuccess: () => void;
}

type MenuPosition = {
    top: number;
    left: number;
};

export default function FacultyActionsMenu({
                                               faculty,
                                               onViewDetails,
                                               onEditFaculty,
                                               onSuccess,
                                           }: FacultyActionsMenuProps) {
    const [open, setOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const [menuPosition, setMenuPosition] =
        useState<MenuPosition | null>(null);

    const buttonRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const calculateMenuPosition = () => {
        const button = buttonRef.current;
        const menu = menuRef.current;

        if (!button || !menu) {
            return;
        }

        const buttonRect = button.getBoundingClientRect();
        const menuRect = menu.getBoundingClientRect();

        const spacing = 8;

        const spaceBelow =
            window.innerHeight - buttonRect.bottom;

        const spaceAbove = buttonRect.top;

        const shouldOpenAbove =
            spaceBelow < menuRect.height + spacing &&
            spaceAbove >= menuRect.height + spacing;

        let top = shouldOpenAbove
            ? buttonRect.top - menuRect.height - spacing
            : buttonRect.bottom + spacing;

        let left = buttonRect.right - menuRect.width;

        /*
         * Keep the menu inside the viewport horizontally.
         */

        const horizontalPadding = 8;

        if (left < horizontalPadding) {
            left = horizontalPadding;
        }

        if (
            left + menuRect.width >
            window.innerWidth - horizontalPadding
        ) {
            left =
                window.innerWidth -
                menuRect.width -
                horizontalPadding;
        }

        /*
         * Final vertical safety check.
         */

        if (top < horizontalPadding) {
            top = horizontalPadding;
        }

        if (
            top + menuRect.height >
            window.innerHeight - horizontalPadding
        ) {
            top =
                window.innerHeight -
                menuRect.height -
                horizontalPadding;
        }

        setMenuPosition({
            top,
            left,
        });
    };

    useLayoutEffect(() => {
        if (!open) {
            setMenuPosition(null);
            return;
        }

        calculateMenuPosition();
    }, [open]);

    useEffect(() => {
        if (!open) {
            return;
        }

        const handleViewportChange = () => {
            calculateMenuPosition();
        };

        window.addEventListener(
            "resize",
            handleViewportChange
        );

        window.addEventListener(
            "scroll",
            handleViewportChange,
            true
        );

        return () => {
            window.removeEventListener(
                "resize",
                handleViewportChange
            );

            window.removeEventListener(
                "scroll",
                handleViewportChange,
                true
            );
        };
    }, [open]);

    useEffect(() => {
        if (!open) {
            return;
        }

        const handleClickOutside = (
            event: MouseEvent
        ) => {
            const target = event.target as Node;

            if (
                buttonRef.current?.contains(target) ||
                menuRef.current?.contains(target)
            ) {
                return;
            }

            setOpen(false);
        };

        document.addEventListener(
            "mousedown",
            handleClickOutside
        );

        return () => {
            document.removeEventListener(
                "mousedown",
                handleClickOutside
            );
        };
    }, [open]);

    const handleViewDetails = () => {
        setOpen(false);
        onViewDetails(faculty);
    };

    const handleEditFaculty = () => {
        setOpen(false);
        onEditFaculty(faculty);
    };

    const handleToggleAccountStatus = async () => {
        if (submitting) {
            return;
        }

        try {
            setSubmitting(true);
            setOpen(false);

            if (faculty.accountEnabled) {
                await disableFaculty(faculty.id);

                toast.success(
                    "Faculty account disabled successfully."
                );
            } else {
                await enableFaculty(faculty.id);

                toast.success(
                    "Faculty account enabled successfully."
                );
            }

            onSuccess();
        } catch (err: any) {
            const message =
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                "Failed to update faculty account status.";

            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleLockStatus = async () => {
        if (submitting) {
            return;
        }

        try {
            setSubmitting(true);
            setOpen(false);

            if (faculty.accountLocked) {
                await unlockFaculty(faculty.id);

                toast.success(
                    "Faculty account unlocked successfully."
                );
            } else {
                await lockFaculty(faculty.id);

                toast.success(
                    "Faculty account locked successfully."
                );
            }

            onSuccess();
        } catch (err: any) {
            const message =
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                "Failed to update faculty lock status.";

            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteClick = () => {
        if (submitting) {
            return;
        }

        setOpen(false);
        setDeleteDialogOpen(true);
    };

    const handleDeleteFaculty = async () => {
        if (submitting) {
            return;
        }

        try {
            setSubmitting(true);

            await deleteFaculty(faculty.id);

            setDeleteDialogOpen(false);

            toast.success(
                "Faculty deleted successfully."
            );

            onSuccess();
        } catch (err: any) {
            const message =
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                "Failed to delete faculty.";

            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleCloseDeleteDialog = () => {
        if (submitting) {
            return;
        }

        setDeleteDialogOpen(false);
    };

    const actionMenu = open && (
        <div
            ref={menuRef}
            className="
                fixed
                z-[100]
                w-52
                origin-top-right
                rounded-xl
                border
                border-slate-200
                bg-white
                py-1.5
                shadow-xl
            "
            style={{
                top: menuPosition?.top ?? -9999,
                left: menuPosition?.left ?? -9999,
                visibility: menuPosition
                    ? "visible"
                    : "hidden",
            }}
        >
            {/* VIEW DETAILS */}

            <button
                type="button"
                onClick={handleViewDetails}
                className="
                    flex
                    w-full
                    items-center
                    gap-3
                    px-4
                    py-2.5
                    text-left
                    text-sm
                    text-slate-700
                    transition
                    hover:bg-slate-50
                "
            >
                <Eye
                    size={17}
                    className="text-slate-400"
                />

                View Details
            </button>

            {/* EDIT FACULTY */}

            <button
                type="button"
                onClick={handleEditFaculty}
                className="
                    flex
                    w-full
                    items-center
                    gap-3
                    px-4
                    py-2.5
                    text-left
                    text-sm
                    text-slate-700
                    transition
                    hover:bg-slate-50
                "
            >
                <Pencil
                    size={17}
                    className="text-slate-400"
                />

                Edit Faculty
            </button>

            {/* ACCOUNT STATUS */}

            <button
                type="button"
                onClick={handleToggleAccountStatus}
                disabled={submitting}
                className="
                    flex
                    w-full
                    items-center
                    gap-3
                    px-4
                    py-2.5
                    text-left
                    text-sm
                    transition
                    hover:bg-slate-50
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                "
            >
                <Power
                    size={17}
                    className={
                        faculty.accountEnabled
                            ? "text-red-400"
                            : "text-emerald-500"
                    }
                />

                {faculty.accountEnabled
                    ? "Disable Faculty"
                    : "Enable Faculty"}
            </button>

            {/* LOCK / UNLOCK */}

            <button
                type="button"
                onClick={handleToggleLockStatus}
                disabled={submitting}
                className="
                    flex
                    w-full
                    items-center
                    gap-3
                    px-3
                    py-2
                    text-sm
                    text-slate-700
                    transition
                    hover:bg-slate-50
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                "
            >
                {faculty.accountLocked ? (
                    <>
                        <Unlock
                            size={17}
                            className="text-emerald-500"
                        />

                        Unlock Faculty
                    </>
                ) : (
                    <>
                        <Lock
                            size={17}
                            className="text-amber-500"
                        />

                        Lock Faculty
                    </>
                )}
            </button>

            {/* SEPARATOR */}

            <div className="my-1 border-t border-slate-100" />

            {/* DELETE */}

            <button
                type="button"
                onClick={handleDeleteClick}
                disabled={submitting}
                className="
                    flex
                    w-full
                    items-center
                    gap-3
                    px-4
                    py-2.5
                    text-left
                    text-sm
                    text-red-500
                    transition
                    hover:bg-red-50
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                "
            >
                <Trash2 size={17} />

                Delete Faculty
            </button>
        </div>
    );

    return (
        <>
            {/* ACTION BUTTON */}

            <div className="relative inline-block text-left">
                <button
                    ref={buttonRef}
                    type="button"
                    onClick={() =>
                        setOpen((current) => !current)
                    }
                    aria-label={`Actions for ${faculty.fullName}`}
                    aria-expanded={open}
                    disabled={submitting}
                    className="
                        rounded-lg
                        px-3
                        py-2
                        text-slate-400
                        transition
                        hover:bg-slate-100
                        hover:text-slate-700
                        disabled:cursor-not-allowed
                        disabled:opacity-50
                    "
                >
                    <span className="text-lg leading-none">
                        ⋮
                    </span>
                </button>
            </div>

            {/* PORTAL ACTION MENU */}

            {createPortal(
                actionMenu,
                document.body
            )}

            {/* DELETE CONFIRMATION DIALOG */}

            {deleteDialogOpen && (
                <div
                    className="
                        fixed
                        inset-0
                        z-[110]
                        flex
                        items-center
                        justify-center
                        bg-slate-900/40
                        px-4
                    "
                    onMouseDown={(event) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            handleCloseDeleteDialog();
                        }
                    }}
                >
                    <div
                        className="
                            w-full
                            max-w-md
                            rounded-2xl
                            border
                            border-slate-200
                            bg-white
                            p-6
                            shadow-2xl
                        "
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="delete-faculty-title"
                    >
                        {/* HEADER */}

                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3">
                                <div
                                    className="
                                        flex
                                        h-11
                                        w-11
                                        shrink-0
                                        items-center
                                        justify-center
                                        rounded-full
                                        bg-red-50
                                        text-red-500
                                    "
                                >
                                    <AlertTriangle size={21} />
                                </div>

                                <div>
                                    <h2
                                        id="delete-faculty-title"
                                        className="
                                            text-base
                                            font-semibold
                                            text-slate-800
                                        "
                                    >
                                        Delete Faculty
                                    </h2>

                                    <p className="mt-1 text-sm text-slate-500">
                                        This action will remove the faculty
                                        member from normal application use.
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={
                                    handleCloseDeleteDialog
                                }
                                disabled={submitting}
                                aria-label="Close delete dialog"
                                className="
                                    rounded-lg
                                    p-1.5
                                    text-slate-400
                                    transition
                                    hover:bg-slate-100
                                    hover:text-slate-600
                                    disabled:cursor-not-allowed
                                    disabled:opacity-50
                                "
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* FACULTY INFO */}

                        <div
                            className="
                                mt-5
                                rounded-xl
                                border
                                border-slate-100
                                bg-slate-50
                                px-4
                                py-3
                            "
                        >
                            <p className="font-medium text-slate-800">
                                {faculty.fullName}
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                                {faculty.email}
                            </p>
                        </div>

                        {/* WARNING */}

                        <p className="mt-4 text-sm leading-6 text-slate-600">
                            The faculty member will no longer appear in the
                            faculty list or be able to access the application.
                            Historical records will be preserved.
                        </p>

                        {/* ACTIONS */}

                        <div
                            className="
                                mt-6
                                flex
                                items-center
                                justify-end
                                gap-3
                            "
                        >
                            <button
                                type="button"
                                onClick={
                                    handleCloseDeleteDialog
                                }
                                disabled={submitting}
                                className="
                                    rounded-xl
                                    border
                                    border-slate-200
                                    bg-white
                                    px-4
                                    py-2.5
                                    text-sm
                                    font-medium
                                    text-slate-600
                                    transition
                                    hover:bg-slate-50
                                    disabled:cursor-not-allowed
                                    disabled:opacity-50
                                "
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={
                                    handleDeleteFaculty
                                }
                                disabled={submitting}
                                className="
                                    inline-flex
                                    items-center
                                    gap-2
                                    rounded-xl
                                    bg-red-500
                                    px-4
                                    py-2.5
                                    text-sm
                                    font-medium
                                    text-white
                                    transition
                                    hover:bg-red-600
                                    disabled:cursor-not-allowed
                                    disabled:opacity-60
                                "
                            >
                                <Trash2 size={16} />

                                {submitting
                                    ? "Deleting..."
                                    : "Delete Faculty"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}