import { useEffect, useState } from "react";
import {
    Check,
    Mail,
    Phone,
    User,
    X,
} from "lucide-react";
import toast from "react-hot-toast";

import {
    updateStudentByAdmin,
} from "../services/studentService";

import type { Student } from "../types/student";

interface EditStudentModalProps {
    open: boolean;
    student: Student | null;
    onClose: () => void;
    onSuccess: () => void;
}

interface FormState {
    fullName: string;
    countryCode: string;
    phoneNumber: string;
}

const initialForm: FormState = {
    fullName: "",
    countryCode: "+91",
    phoneNumber: "",
};

export default function EditStudentModal({
                                             open,
                                             student,
                                             onClose,
                                             onSuccess,
                                         }: EditStudentModalProps) {
    const [form, setForm] =
        useState<FormState>(initialForm);

    const [submitting, setSubmitting] =
        useState(false);

    const [error, setError] =
        useState<string | null>(null);

    useEffect(() => {
        if (!student) {
            setForm(initialForm);
            setError(null);
            return;
        }

        setForm({
            fullName: student.fullName,
            countryCode:
                student.countryCode ?? "+91",
            phoneNumber:
                student.phoneNumber ?? "",
        });

        setError(null);
    }, [student]);

    useEffect(() => {
        if (!open || submitting) {
            return;
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        document.addEventListener(
            "keydown",
            handleKeyDown
        );

        return () => {
            document.removeEventListener(
                "keydown",
                handleKeyDown
            );
        };
    }, [open, submitting, onClose]);

    if (!open || !student) {
        return null;
    }

    const updateField = (
        field: keyof FormState,
        value: string
    ) => {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));

        if (error) {
            setError(null);
        }
    };

    const handlePhoneChange = (value: string) => {
        const digitsOnly = value.replace(/\D/g, "");

        updateField(
            "phoneNumber",
            digitsOnly.slice(0, 10)
        );
    };

    const handleCountryCodeChange = (
        value: string
    ) => {
        let normalized = value.replace(
            /[^\d+]/g,
            ""
        );

        if (normalized.includes("+")) {
            normalized =
                "+" +
                normalized
                    .replace(/\+/g, "")
                    .slice(0, 3);
        } else {
            normalized = normalized.slice(0, 3);
        }

        updateField(
            "countryCode",
            normalized
        );
    };

    const handleSubmit = async (
        event: React.FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        setError(null);

        const fullName =
            form.fullName.trim();

        const countryCode =
            form.countryCode.trim();

        const phoneNumber =
            form.phoneNumber.trim();

        if (fullName.length < 4) {
            setError(
                "Full name must be at least 4 characters long."
            );
            return;
        }

        if (!/^[A-Za-z ]+$/.test(fullName)) {
            setError(
                "Full name can contain only letters and spaces."
            );
            return;
        }

        if (!/^\+\d{1,3}$/.test(countryCode)) {
            setError(
                "Enter a valid country code such as +91."
            );
            return;
        }

        if (!phoneNumber) {
            setError(
                "Phone number is required."
            );
            return;
        }

        if (!/^\d{10}$/.test(phoneNumber)) {
            setError(
                "Phone number must contain exactly 10 digits."
            );
            return;
        }

        try {
            setSubmitting(true);

            await updateStudentByAdmin(
                student.id,
                {
                    fullName,
                    countryCode,
                    phoneNumber,
                }
            );

            toast.success(
                "Student details updated successfully."
            );

            onSuccess();
            onClose();
        } catch (err: any) {
            console.error(
                "Failed to update student:",
                err
            );

            const message =
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                "Failed to update student. Please try again.";

            setError(message);

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
                py-6
                backdrop-blur-sm
            "
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-student-title"
            onMouseDown={(event) => {
                if (
                    event.target ===
                    event.currentTarget &&
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
                onMouseDown={(event) => {
                    event.stopPropagation();
                }}
            >
                {/* HEADER */}

                <div
                    className="
                        flex
                        items-center
                        justify-between
                        border-b
                        border-slate-100
                        px-6
                        py-5
                    "
                >
                    <div>
                        <h2
                            id="edit-student-title"
                            className="
                                text-xl
                                font-semibold
                                text-slate-800
                            "
                        >
                            Edit Student
                        </h2>

                        <p
                            className="
                                mt-1
                                text-sm
                                text-slate-500
                            "
                        >
                            Update the student's personal details.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        aria-label="Close edit student"
                        className="
                            rounded-lg
                            p-2
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

                <form
                    onSubmit={handleSubmit}
                    className="px-6 py-6"
                >
                    <div className="grid gap-5 md:grid-cols-2">
                        {/* FULL NAME */}

                        <div className="md:col-span-2">
                            <label
                                htmlFor="edit-student-name"
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

                            <div
                                className="
                                    flex
                                    items-center
                                    rounded-xl
                                    border
                                    border-slate-200
                                    bg-white
                                    px-3
                                    transition
                                    focus-within:border-blue-500
                                    focus-within:ring-2
                                    focus-within:ring-blue-100
                                "
                            >
                                <User
                                    size={17}
                                    className="shrink-0 text-slate-400"
                                />

                                <input
                                    id="edit-student-name"
                                    type="text"
                                    value={form.fullName}
                                    onChange={(event) =>
                                        updateField(
                                            "fullName",
                                            event.target.value
                                        )
                                    }
                                    disabled={submitting}
                                    autoComplete="name"
                                    className="
                                        min-w-0
                                        flex-1
                                        bg-transparent
                                        px-3
                                        py-3
                                        text-sm
                                        text-slate-700
                                        outline-none
                                        disabled:cursor-not-allowed
                                        disabled:text-slate-400
                                    "
                                />
                            </div>
                        </div>

                        {/* EMAIL */}

                        <div className="md:col-span-2">
                            <label
                                htmlFor="edit-student-email"
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

                            <div
                                className="
                                    flex
                                    items-center
                                    rounded-xl
                                    border
                                    border-slate-200
                                    bg-slate-50
                                    px-3
                                "
                            >
                                <Mail
                                    size={17}
                                    className="shrink-0 text-slate-400"
                                />

                                <input
                                    id="edit-student-email"
                                    type="email"
                                    value={student.email}
                                    readOnly
                                    aria-readonly="true"
                                    className="
                                        min-w-0
                                        flex-1
                                        bg-transparent
                                        px-3
                                        py-3
                                        text-sm
                                        text-slate-500
                                        outline-none
                                    "
                                />
                            </div>

                            <p
                                className="
                                    mt-1.5
                                    text-xs
                                    text-slate-400
                                "
                            >
                                Email cannot be changed from this form.
                            </p>
                        </div>

                        {/* PHONE */}

                        <div className="md:col-span-2">
                            <label
                                htmlFor="edit-student-phone"
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

                            <div
                                className="
                                    flex
                                    overflow-hidden
                                    rounded-xl
                                    border
                                    border-slate-200
                                    bg-white
                                    focus-within:border-blue-500
                                    focus-within:ring-2
                                    focus-within:ring-blue-100
                                "
                            >
                                <div
                                    className="
                                        flex
                                        w-24
                                        shrink-0
                                        items-center
                                        border-r
                                        border-slate-200
                                    "
                                >
                                    <Phone
                                        size={16}
                                        className="
                                            ml-3
                                            shrink-0
                                            text-slate-400
                                        "
                                    />

                                    <input
                                        type="text"
                                        value={
                                            form.countryCode
                                        }
                                        onChange={(event) =>
                                            handleCountryCodeChange(
                                                event.target.value
                                            )
                                        }
                                        placeholder="+91"
                                        disabled={submitting}
                                        aria-label="Country code"
                                        inputMode="tel"
                                        className="
                                            min-w-0
                                            w-full
                                            bg-transparent
                                            px-2
                                            py-3
                                            text-sm
                                            text-slate-700
                                            outline-none
                                            disabled:cursor-not-allowed
                                            disabled:text-slate-400
                                        "
                                    />
                                </div>

                                <input
                                    id="edit-student-phone"
                                    type="tel"
                                    value={form.phoneNumber}
                                    onChange={(event) =>
                                        handlePhoneChange(
                                            event.target.value
                                        )
                                    }
                                    placeholder="10-digit mobile number"
                                    disabled={submitting}
                                    inputMode="numeric"
                                    autoComplete="tel"
                                    maxLength={10}
                                    className="
                                        min-w-0
                                        flex-1
                                        bg-white
                                        px-3
                                        py-3
                                        text-sm
                                        text-slate-700
                                        outline-none
                                        disabled:cursor-not-allowed
                                        disabled:bg-slate-50
                                        disabled:text-slate-400
                                    "
                                />
                            </div>
                        </div>
                    </div>

                    {/* ERROR */}

                    {error && (
                        <div
                            className="
                                mt-5
                                rounded-xl
                                border
                                border-red-200
                                bg-red-50
                                px-4
                                py-3
                                text-sm
                                leading-5
                                text-red-600
                            "
                            role="alert"
                        >
                            {error}
                        </div>
                    )}

                    {/* FOOTER */}

                    <div
                        className="
                            mt-6
                            flex
                            items-center
                            justify-end
                            gap-3
                            border-t
                            border-slate-100
                            pt-5
                        "
                    >
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="
                                rounded-xl
                                border
                                border-slate-300
                                bg-white
                                px-5
                                py-2.5
                                text-sm
                                font-medium
                                text-slate-700
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
                                shadow-sm
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