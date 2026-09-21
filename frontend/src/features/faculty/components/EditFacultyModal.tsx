import { useEffect, useState } from "react";
import { Check, Mail, Phone, User, X } from "lucide-react";
import toast from "react-hot-toast";

import {
    updateFacultyByAdmin,
} from "../services/facultyService";
import type { Faculty } from "../types/faculty";

interface EditFacultyModalProps {
    faculty: Faculty | null;
    onClose: () => void;
    onSuccess: () => void;
}

export default function EditFacultyModal({
                                             faculty,
                                             onClose,
                                             onSuccess,
                                         }: EditFacultyModalProps) {
    const [fullName, setFullName] = useState("");
    const [countryCode, setCountryCode] = useState("+91");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const open = faculty !== null;

    useEffect(() => {
        if (!faculty) {
            return;
        }

        setFullName(faculty.fullName ?? "");
        setCountryCode(faculty.countryCode ?? "+91");
        setPhoneNumber(faculty.phoneNumber ?? "");
        setSubmitting(false);
    }, [faculty]);

    useEffect(() => {
        if (!open) {
            return;
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape" && !submitting) {
                onClose();
            }
        };

        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [open, submitting, onClose]);

    if (!faculty) {
        return null;
    }

    const validateForm = (): boolean => {
        const trimmedFullName = fullName.trim();
        const trimmedCountryCode = countryCode.trim();
        const trimmedPhoneNumber = phoneNumber.trim();

        if (trimmedFullName.length < 4) {
            toast.error("Full name must be at least 4 characters long.");
            return false;
        }

        if (!/^[A-Za-z ]+$/.test(trimmedFullName)) {
            toast.error("Full name can contain only letters and spaces.");
            return false;
        }

        if (!/^\+\d{1,3}$/.test(trimmedCountryCode)) {
            toast.error(
                "Country code must start with + and contain 1 to 3 digits."
            );
            return false;
        }

        if (!/^\d{10}$/.test(trimmedPhoneNumber)) {
            toast.error("Phone number must contain exactly 10 digits.");
            return false;
        }

        return true;
    };

    const handleSubmit = async (
        event: React.FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        if (submitting) {
            return;
        }

        if (!validateForm()) {
            return;
        }

        try {
            setSubmitting(true);

            await updateFacultyByAdmin(faculty.id, {
                fullName: fullName.trim(),
                countryCode: countryCode.trim(),
                phoneNumber: phoneNumber.trim(),
            });

            toast.success("Faculty updated successfully.");

            onSuccess();
            onClose();
        } catch (err: any) {
            const message =
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                "Failed to update faculty.";

            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div
            className="
                fixed
                inset-0
                z-[60]
                flex
                items-center
                justify-center
                bg-slate-900/40
                px-4
                backdrop-blur-sm
            "
            onMouseDown={(event) => {
                if (
                    event.target === event.currentTarget &&
                    !submitting
                ) {
                    onClose();
                }
            }}
        >
            <div
                className="
                    w-full
                    max-w-xl
                    overflow-hidden
                    rounded-2xl
                    border
                    border-slate-200
                    bg-white
                    shadow-2xl
                "
                role="dialog"
                aria-modal="true"
                aria-labelledby="edit-faculty-title"
            >
                {/* HEADER */}

                <div
                    className="
                        flex
                        items-start
                        justify-between
                        gap-4
                        border-b
                        border-slate-200
                        px-6
                        py-5
                    "
                >
                    <div>
                        <h2
                            id="edit-faculty-title"
                            className="text-xl font-semibold text-slate-800"
                        >
                            Edit Faculty
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Update the faculty member's profile information.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        aria-label="Close edit faculty modal"
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
                        <X size={20} />
                    </button>
                </div>

                {/* FORM */}

                <form onSubmit={handleSubmit}>
                    <div className="space-y-5 px-6 py-6">
                        {/* FULL NAME */}

                        <div>
                            <label
                                htmlFor="edit-faculty-full-name"
                                className="
                                    mb-1.5
                                    block
                                    text-sm
                                    font-medium
                                    text-slate-700
                                "
                            >
                                Full Name
                            </label>

                            <div className="relative">
                                <User
                                    size={17}
                                    className="
                                        pointer-events-none
                                        absolute
                                        left-3.5
                                        top-1/2
                                        -translate-y-1/2
                                        text-slate-400
                                    "
                                />

                                <input
                                    id="edit-faculty-full-name"
                                    type="text"
                                    value={fullName}
                                    onChange={(event) =>
                                        setFullName(event.target.value)
                                    }
                                    className="
                                        w-full
                                        rounded-xl
                                        border
                                        border-slate-200
                                        bg-white
                                        py-3
                                        pl-10
                                        pr-3.5
                                        text-sm
                                        text-slate-700
                                        outline-none
                                        transition
                                        focus:border-blue-400
                                        focus:ring-2
                                        focus:ring-blue-100
                                    "
                                />
                            </div>
                        </div>

                        {/* EMAIL */}

                        <div>
                            <label
                                htmlFor="edit-faculty-email"
                                className="
                                    mb-1.5
                                    block
                                    text-sm
                                    font-medium
                                    text-slate-700
                                "
                            >
                                Email
                            </label>

                            <div className="relative">
                                <Mail
                                    size={17}
                                    className="
                                        pointer-events-none
                                        absolute
                                        left-3.5
                                        top-1/2
                                        -translate-y-1/2
                                        text-slate-400
                                    "
                                />

                                <input
                                    id="edit-faculty-email"
                                    type="email"
                                    value={faculty.email}
                                    readOnly
                                    className="
                                        w-full
                                        rounded-xl
                                        border
                                        border-slate-200
                                        bg-slate-50
                                        py-3
                                        pl-10
                                        pr-3.5
                                        text-sm
                                        text-slate-500
                                        outline-none
                                    "
                                />
                            </div>

                            <p className="mt-1.5 text-xs text-slate-400">
                                Email address cannot be changed.
                            </p>
                        </div>

                        {/* PHONE */}

                        <div>
                            <label
                                htmlFor="edit-faculty-phone"
                                className="
                                    mb-1.5
                                    block
                                    text-sm
                                    font-medium
                                    text-slate-700
                                "
                            >
                                Phone Number
                            </label>

                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={countryCode}
                                    onChange={(event) =>
                                        setCountryCode(event.target.value)
                                    }
                                    placeholder="+91"
                                    maxLength={4}
                                    className="
                                        w-24
                                        rounded-xl
                                        border
                                        border-slate-200
                                        bg-white
                                        px-3.5
                                        py-3
                                        text-sm
                                        text-slate-700
                                        outline-none
                                        transition
                                        focus:border-blue-400
                                        focus:ring-2
                                        focus:ring-blue-100
                                    "
                                />

                                <div className="relative min-w-0 flex-1">
                                    <Phone
                                        size={17}
                                        className="
                                            pointer-events-none
                                            absolute
                                            left-3.5
                                            top-1/2
                                            -translate-y-1/2
                                            text-slate-400
                                        "
                                    />

                                    <input
                                        id="edit-faculty-phone"
                                        type="tel"
                                        inputMode="numeric"
                                        value={phoneNumber}
                                        onChange={(event) =>
                                            setPhoneNumber(
                                                event.target.value
                                                    .replace(/\D/g, "")
                                                    .slice(0, 10)
                                            )
                                        }
                                        placeholder="10-digit phone number"
                                        className="
                                            w-full
                                            rounded-xl
                                            border
                                            border-slate-200
                                            bg-white
                                            py-3
                                            pl-10
                                            pr-3.5
                                            text-sm
                                            text-slate-700
                                            outline-none
                                            transition
                                            placeholder:text-slate-400
                                            focus:border-blue-400
                                            focus:ring-2
                                            focus:ring-blue-100
                                        "
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* FOOTER */}

                    <div
                        className="
                            flex
                            items-center
                            justify-end
                            gap-3
                            border-t
                            border-slate-200
                            bg-slate-50
                            px-6
                            py-4
                        "
                    >
                        <button
                            type="button"
                            onClick={onClose}
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
                            type="submit"
                            disabled={submitting}
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
                            ) : (
                                <>
                                    <Check size={16} />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}