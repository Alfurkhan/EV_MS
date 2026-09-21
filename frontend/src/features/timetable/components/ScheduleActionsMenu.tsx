import {
    CheckCircle2,
    Eye,
    MoreVertical,
    Pencil,
    Trash2,
    XCircle,
} from "lucide-react";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface ScheduleActionsMenuProps {
    active: boolean;
    onView: () => void;
    onEdit: () => void;
    onToggleStatus: () => void;
    onDelete: () => void;
}

export default function ScheduleActionsMenu({
    active,
    onView,
    onEdit,
    onToggleStatus,
    onDelete,
}: ScheduleActionsMenuProps) {
    const [open, setOpen] = useState(false);

    const buttonRef = useRef<HTMLButtonElement | null>(null);
    const menuRef = useRef<HTMLDivElement | null>(null);

    const [position, setPosition] = useState({
        top: 0,
        left: 0,
    });

    const updatePosition = () => {
        if (!buttonRef.current) {
            return;
        }

        const rect =
            buttonRef.current.getBoundingClientRect();

        const menuWidth = 190;
        const menuHeight = 210;
        const spacing = 8;

        let left =
            rect.right - menuWidth;

        let top =
            rect.bottom + spacing;

        /*
         * Keep the menu inside the viewport.
         */
        if (left < 8) {
            left = 8;
        }

        if (
            left + menuWidth >
            window.innerWidth - 8
        ) {
            left =
                window.innerWidth -
                menuWidth -
                8;
        }

        /*
         * If there isn't enough space below,
         * open the menu above the button.
         */
        if (
            top + menuHeight >
            window.innerHeight - 8
        ) {
            top =
                rect.top -
                menuHeight -
                spacing;
        }

        if (top < 8) {
            top = 8;
        }

        setPosition({
            top,
            left,
        });
    };

    useEffect(() => {
        if (!open) {
            return;
        }

        updatePosition();

        const handleResize = () => {
            updatePosition();
        };

        const handleScroll = () => {
            updatePosition();
        };

        const handleOutsideClick = (
            event: MouseEvent
        ) => {
            const target =
                event.target as Node;

            if (
                buttonRef.current?.contains(
                    target
                )
            ) {
                return;
            }

            if (
                menuRef.current?.contains(
                    target
                )
            ) {
                return;
            }

            setOpen(false);
        };

        window.addEventListener(
            "resize",
            handleResize
        );

        window.addEventListener(
            "scroll",
            handleScroll,
            true
        );

        document.addEventListener(
            "mousedown",
            handleOutsideClick
        );

        return () => {
            window.removeEventListener(
                "resize",
                handleResize
            );

            window.removeEventListener(
                "scroll",
                handleScroll,
                true
            );

            document.removeEventListener(
                "mousedown",
                handleOutsideClick
            );
        };
    }, [open]);

    const closeMenu = () => {
        setOpen(false);
    };

    const handleAction = (
        action: () => void
    ) => {
        closeMenu();
        action();
    };

    return (
        <>
            <button
                ref={buttonRef}
                type="button"
                onClick={() => {
                    setOpen((current) => !current);
                }}
                className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border transition ${
    open
        ? "border-indigo-200 bg-indigo-50 text-indigo-600"
        : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700"
}`}
                aria-label="Schedule actions"
                aria-expanded={open}
            >
                <MoreVertical size={18} />
            </button>

            {open &&
                createPortal(
                    <div
                        ref={menuRef}
                        className="fixed z-[100] w-[190px] overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl"
                        style={{
                            top: position.top,
                            left: position.left,
                        }}
                    >
                        {/* View */}
                        <button
                            type="button"
                            onClick={() =>
                                handleAction(
                                    onView
                                )
                            }
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                            <Eye
                                size={16}
                                className="text-indigo-600"
                            />

                            <span>
                                View
                            </span>
                        </button>

                        {/* Edit */}
                        <button
                            type="button"
                            onClick={() =>
                                handleAction(
                                    onEdit
                                )
                            }
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                            <Pencil
                                size={16}
                                className="text-slate-500"
                            />

                            <span>
                                Edit
                            </span>
                        </button>

                        <div className="my-1 border-t border-slate-100" />

                        {/* Enable / Disable */}
                        <button
                            type="button"
                            onClick={() =>
                                handleAction(
                                    onToggleStatus
                                )
                            }
                            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${
    active
        ? "text-amber-700 hover:bg-amber-50"
        : "text-emerald-700 hover:bg-emerald-50"
}`}
                        >
                            {active ? (
                                <XCircle
                                    size={16}
                                />
                            ) : (
                                <CheckCircle2
                                    size={16}
                                />
                            )}

                            <span>
                                {active
                                    ? "Disable"
                                    : "Enable"}
                            </span>
                        </button>

                        {/* Delete */}
                        <button
                            type="button"
                            onClick={() =>
                                handleAction(
                                    onDelete
                                )
                            }
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
                        >
                            <Trash2
                                size={16}
                            />

                            <span>
                                Delete
                            </span>
                        </button>
                    </div>,
                    document.body
                )}
        </>
    );
}
