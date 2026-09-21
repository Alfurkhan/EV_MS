import { useEffect, useState } from "react";
import { Eye, EyeOff, X } from "lucide-react";
import toast from "react-hot-toast";

import {
    createFacultyByAdmin,
    type AdminFacultyRequest,
} from "../services/facultyService";

interface AddFacultyModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function AddFacultyModal({
                                            open,
                                            onClose,
                                            onSuccess,
                                        }: AddFacultyModalProps) {
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [countryCode, setCountryCode] = useState("+91");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!open) {
            return;
        }

        setFullName("");
        setEmail("");
        setCountryCode("+91");
        setPhoneNumber("");
        setPassword("");
        setConfirmPassword("");
        setShowPassword(false);
        setShowConfirmPassword(false);
        setSubmitting(false);
    }, [open]);

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

    if (!open) {
        return null;
    }

    const validateForm = (): boolean => {
        const trimmedFullName = fullName.trim();

        if (trimmedFullName.length < 4) {
            toast.error("Full name must be at least 4 characters long.");
            return false;
        }

        if (!/^[A-Za-z ]+$/.test(trimmedFullName)) {
            toast.error("Full name can contain only letters and spaces.");
            return false;
        }

        if (!email.trim()) {
            toast.error("Email is required.");
            return false;
        }

        if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                email.trim()
            )
        ) {
            toast.error("Please enter a valid email address.");
            return false;
        }

        if (!countryCode.trim()) {
            toast.error("Country code is required.");
            return false;
        }

        if (!/^\+\d{1,3}$/.test(countryCode.trim())) {
            toast.error(
                "Country code must start with + and contain 1 to 3 digits."
            );
            return false;
        }

        if (!/^\d{10}$/.test(phoneNumber.trim())) {
            toast.error("Phone number must contain exactly 10 digits.");
            return false;
        }

        if (
            !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/.test(
                password
            )
        ) {
            toast.error(
                "Password must be at least 6 characters and include uppercase, lowercase, number, and symbol."
            );
            return false;
        }

        if (password !== confirmPassword) {
            toast.error("Passwords do not match.");
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

        const data: AdminFacultyRequest = {
            fullName: fullName.trim(),
            email: email.trim(),
            password,
            countryCode: countryCode.trim(),
            phoneNumber: phoneNumber.trim(),
        };

        try {
            setSubmitting(true);

            await createFacultyByAdmin(data);

            toast.success(
                "Faculty created successfully."
            );

            onSuccess();
            onClose();
        } catch (err: any) {
            const message =
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                "Failed to create faculty.";

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
                z-50
                flex
                items-center
                justify-center
                bg-slate-900/40
                px-4
                py-6
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
                    flex
                    max-h-[92vh]
                    w-full
                    max-w-2xl
                    flex-col
                    overflow-hidden
                    rounded-2xl
                    border
                    border-slate-200
                    bg-white
                    shadow-2xl
                "
                role="dialog"
                aria-modal="true"
                aria-labelledby="add-faculty-title"
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
                            id="add-faculty-title"
                            className="text-xl font-semibold text-slate-800"
                        >
                            Add Faculty
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Create a new faculty account.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        aria-label="Close add faculty modal"
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

                <form
                    onSubmit={handleSubmit}
                    className="overflow-y-auto"
                >
                    <div className="space-y-6 px-6 py-6">
                        {/* PERSONAL INFORMATION */}

                        <section>
                            <div className="mb-4">
                                <h3 className="text-sm font-semibold text-slate-800">
                                    Personal Information
                                </h3>

                                <p className="mt-1 text-xs text-slate-400">
                                    Basic information for the faculty member.
                                </p>
                            </div>

                            <div className="space-y-4">
                                {/* FULL NAME */}

                                <div>
                                    <label
                                        htmlFor="faculty-full-name"
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

                                    <input
                                        id="faculty-full-name"
                                        type="text"
                                        value={fullName}
                                        onChange={(event) =>
                                            setFullName(event.target.value)
                                        }
                                        placeholder="Enter full name"
                                        autoFocus
                                        className="
                                            w-full
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
                                            placeholder:text-slate-400
                                            focus:border-blue-400
                                            focus:ring-2
                                            focus:ring-blue-100
                                        "
                                    />
                                </div>

                                {/* EMAIL */}

                                <div>
                                    <label
                                        htmlFor="faculty-email"
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

                                    <input
                                        id="faculty-email"
                                        type="email"
                                        value={email}
                                        onChange={(event) =>
                                            setEmail(event.target.value)
                                        }
                                        placeholder="faculty@example.com"
                                        className="
                                            w-full
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
                                            placeholder:text-slate-400
                                            focus:border-blue-400
                                            focus:ring-2
                                            focus:ring-blue-100
                                        "
                                    />
                                </div>

                                {/* PHONE */}

                                <div>
                                    <label
                                        htmlFor="faculty-phone"
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
                                                setCountryCode(
                                                    event.target.value
                                                )
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
                                                placeholder:text-slate-400
                                                focus:border-blue-400
                                                focus:ring-2
                                                focus:ring-blue-100
                                            "
                                        />

                                        <input
                                            id="faculty-phone"
                                            type="tel"
                                            inputMode="numeric"
                                            value={phoneNumber}
                                            onChange={(event) =>
                                                setPhoneNumber(
                                                    event.target.value.replace(
                                                        /\D/g,
                                                        ""
                                                    ).slice(0, 10)
                                                )
                                            }
                                            placeholder="10-digit phone number"
                                            className="
                                                min-w-0
                                                flex-1
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
                                                placeholder:text-slate-400
                                                focus:border-blue-400
                                                focus:ring-2
                                                focus:ring-blue-100
                                            "
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* ACCOUNT SECURITY */}

                        <section>
                            <div className="mb-4">
                                <h3 className="text-sm font-semibold text-slate-800">
                                    Account Security
                                </h3>

                                <p className="mt-1 text-xs text-slate-400">
                                    Set the initial password for the faculty account.
                                </p>
                            </div>

                            <div className="space-y-4">
                                {/* PASSWORD */}

                                <div>
                                    <label
                                        htmlFor="faculty-password"
                                        className="
                                            mb-1.5
                                            block
                                            text-sm
                                            font-medium
                                            text-slate-700
                                        "
                                    >
                                        Password
                                    </label>

                                    <div className="relative">
                                        <input
                                            id="faculty-password"
                                            type={
                                                showPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            value={password}
                                            onChange={(event) =>
                                                setPassword(
                                                    event.target.value
                                                )
                                            }
                                            placeholder="Enter password"
                                            className="
                                                w-full
                                                rounded-xl
                                                border
                                                border-slate-200
                                                bg-white
                                                py-3
                                                pl-3.5
                                                pr-11
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

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowPassword(
                                                    (current) => !current
                                                )
                                            }
                                            aria-label={
                                                showPassword
                                                    ? "Hide password"
                                                    : "Show password"
                                            }
                                            className="
                                                absolute
                                                right-3
                                                top-1/2
                                                -translate-y-1/2
                                                rounded-lg
                                                p-1.5
                                                text-slate-400
                                                transition
                                                hover:bg-slate-100
                                                hover:text-slate-600
                                            "
                                        >
                                            {showPassword ? (
                                                <EyeOff size={18} />
                                            ) : (
                                                <Eye size={18} />
                                            )}
                                        </button>
                                    </div>

                                    <p className="mt-1.5 text-xs text-slate-400">
                                        Minimum 6 characters with uppercase,
                                        lowercase, number, and symbol.
                                    </p>
                                </div>

                                {/* CONFIRM PASSWORD */}

                                <div>
                                    <label
                                        htmlFor="faculty-confirm-password"
                                        className="
                                            mb-1.5
                                            block
                                            text-sm
                                            font-medium
                                            text-slate-700
                                        "
                                    >
                                        Confirm Password
                                    </label>

                                    <div className="relative">
                                        <input
                                            id="faculty-confirm-password"
                                            type={
                                                showConfirmPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            value={confirmPassword}
                                            onChange={(event) =>
                                                setConfirmPassword(
                                                    event.target.value
                                                )
                                            }
                                            placeholder="Confirm password"
                                            className="
                                                w-full
                                                rounded-xl
                                                border
                                                border-slate-200
                                                bg-white
                                                py-3
                                                pl-3.5
                                                pr-11
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

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowConfirmPassword(
                                                    (current) => !current
                                                )
                                            }
                                            aria-label={
                                                showConfirmPassword
                                                    ? "Hide confirm password"
                                                    : "Show confirm password"
                                            }
                                            className="
                                                absolute
                                                right-3
                                                top-1/2
                                                -translate-y-1/2
                                                rounded-lg
                                                p-1.5
                                                text-slate-400
                                                transition
                                                hover:bg-slate-100
                                                hover:text-slate-600
                                            "
                                        >
                                            {showConfirmPassword ? (
                                                <EyeOff size={18} />
                                            ) : (
                                                <Eye size={18} />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </section>
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
                                    Creating...
                                </>
                            ) : (
                                "Create Faculty"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}