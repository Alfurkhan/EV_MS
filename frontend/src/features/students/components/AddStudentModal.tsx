import { useEffect, useState } from "react";
import { Eye, EyeOff, X } from "lucide-react";
import toast from "react-hot-toast";

import {
    createStudentByAdmin,
    type AdminStudentRequest,
} from "../services/studentService";

import {
    getAcademicYears,
    getActiveAcademicYear,
    type AcademicYear,
} from "../../academic/services/academicYearService";

import {
    getGradesByAcademicYear,
    type Grade,
} from "../../academic/services/gradeService";

import {
    getSectionsByGrade,
    type Section,
} from "../../academic/services/sectionService";

import {
    createEnrollment,
} from "../../academic/services/studentEnrollmentService";

interface AddStudentModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

type FormData = {
    fullName: string;
    email: string;
    countryCode: string;
    phoneNumber: string;
    password: string;
    confirmPassword: string;
    academicYearId: string;
    gradeId: string;
    sectionId: string;
};

const initialForm: FormData = {
    fullName: "",
    email: "",
    countryCode: "+91",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    academicYearId: "",
    gradeId: "",
    sectionId: "",
};

export default function AddStudentModal({
                                            open,
                                            onClose,
                                            onSuccess,
                                        }: AddStudentModalProps) {

    const [form, setForm] =
        useState<FormData>(initialForm);

    const [academicYears, setAcademicYears] =
        useState<AcademicYear[]>([]);

    const [grades, setGrades] =
        useState<Grade[]>([]);

    const [sections, setSections] =
        useState<Section[]>([]);

    const [loadingYears, setLoadingYears] =
        useState(false);

    const [loadingGrades, setLoadingGrades] =
        useState(false);

    const [loadingSections, setLoadingSections] =
        useState(false);

    const [submitting, setSubmitting] =
        useState(false);

    const [error, setError] =
        useState<string | null>(null);

    const [showPassword, setShowPassword] =
        useState(false);

    const [showConfirmPassword, setShowConfirmPassword] =
        useState(false);

    /*
     * ========================================================
     * LOAD ACADEMIC YEARS
     * ========================================================
     */

    useEffect(() => {

        if (!open) {
            return;
        }

        const loadAcademicYears = async () => {

            try {

                setLoadingYears(true);
                setError(null);

                const [
                    years,
                    activeYear,
                ] = await Promise.all([
                    getAcademicYears(),
                    getActiveAcademicYear(),
                ]);

                setAcademicYears(years);

                setForm((current) => ({
                    ...current,
                    academicYearId:
                        current.academicYearId ||
                        String(activeYear.id),
                }));

            } catch (err) {

                console.error(
                    "Failed to load academic years:",
                    err
                );

                setError(
                    "Failed to load academic years."
                );

            } finally {

                setLoadingYears(false);
            }
        };

        loadAcademicYears();

    }, [open]);

    /*
     * ========================================================
     * LOAD GRADES WHEN ACADEMIC YEAR CHANGES
     * ========================================================
     */

    useEffect(() => {

        if (!form.academicYearId) {

            setGrades([]);
            setSections([]);

            return;
        }

        const loadGrades = async () => {

            try {

                setLoadingGrades(true);

                setGrades([]);
                setSections([]);

                setForm((current) => ({
                    ...current,
                    gradeId: "",
                    sectionId: "",
                }));

                const result =
                    await getGradesByAcademicYear(
                        Number(form.academicYearId)
                    );

                setGrades(
                    result.filter(
                        (grade) => grade.active
                    )
                );

            } catch (err) {

                console.error(
                    "Failed to load grades:",
                    err
                );

                setError(
                    "Failed to load grades."
                );

            } finally {

                setLoadingGrades(false);
            }
        };

        loadGrades();

    }, [form.academicYearId]);

    /*
     * ========================================================
     * LOAD SECTIONS WHEN GRADE CHANGES
     * ========================================================
     */

    useEffect(() => {

        if (!form.gradeId) {

            setSections([]);

            return;
        }

        const loadSections = async () => {

            try {

                setLoadingSections(true);

                setSections([]);

                setForm((current) => ({
                    ...current,
                    sectionId: "",
                }));

                const result =
                    await getSectionsByGrade(
                        Number(form.gradeId)
                    );

                setSections(
                    result.filter(
                        (section) => section.active
                    )
                );

            } catch (err) {

                console.error(
                    "Failed to load sections:",
                    err
                );

                setError(
                    "Failed to load sections."
                );

            } finally {

                setLoadingSections(false);
            }
        };

        loadSections();

    }, [form.gradeId]);

    /*
     * ========================================================
     * FORM HELPERS
     * ========================================================
     */

    const updateField = (
        field: keyof FormData,
        value: string
    ) => {

        setForm((current) => ({
            ...current,
            [field]: value,
        }));

        setError(null);
    };

    /*
     * ========================================================
     * VALIDATION
     * ========================================================
     */

    const validateForm = (): string | null => {

        if (form.fullName.trim().length < 4) {
            return "Full name must be at least 4 characters.";
        }

        if (!/^[A-Za-z ]+$/.test(form.fullName.trim())) {
            return "Full name can contain only letters and spaces.";
        }

        if (!form.email.trim()) {
            return "Email is required.";
        }

        if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                form.email.trim()
            )
        ) {
            return "Please enter a valid email address.";
        }

        if (!form.countryCode.trim()) {
            return "Country code is required.";
        }

        if (!form.phoneNumber.trim()) {
            return "Phone number is required.";
        }

        if (!/^\d{10}$/.test(form.phoneNumber.trim())) {
            return "Phone number must contain exactly 10 digits.";
        }

        if (
            !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/.test(
                form.password
            )
        ) {
            return "Password must be at least 6 characters and include uppercase, lowercase, number and symbol.";
        }

        if (form.password !== form.confirmPassword) {
            return "Passwords do not match.";
        }

        if (!form.academicYearId) {
            return "Please select an academic year.";
        }

        if (!form.gradeId) {
            return "Please select a grade.";
        }

        if (!form.sectionId) {
            return "Please select a section.";
        }

        return null;
    };

    /*
     * ========================================================
     * SUBMIT
     * ========================================================
     */

    const handleSubmit = async (
        event: React.FormEvent<HTMLFormElement>
    ) => {

        event.preventDefault();

        const validationError =
            validateForm();

        if (validationError) {

            setError(validationError);

            return;
        }

        try {

            setSubmitting(true);
            setError(null);

            /*
             * -----------------------------------------------
             * 1. CREATE STUDENT USER
             * -----------------------------------------------
             */

            const studentRequest: AdminStudentRequest = {
                fullName: form.fullName.trim(),
                email: form.email.trim(),
                password: form.password,
                countryCode: form.countryCode.trim(),
                phoneNumber: form.phoneNumber.trim(),
            };

            const student =
                await createStudentByAdmin(
                    studentRequest
                );

            /*
             * -----------------------------------------------
             * 2. CREATE ACADEMIC ENROLLMENT
             * -----------------------------------------------
             */

            await createEnrollment({
                studentId: student.id,
                academicYearId:
                    Number(form.academicYearId),
                gradeId:
                    Number(form.gradeId),
                sectionId:
                    Number(form.sectionId),
            });

            toast.success(
                "Student created and enrolled successfully."
            );

            /*
             * -----------------------------------------------
             * 3. RESET + CLOSE
             * -----------------------------------------------
             */

            setForm(initialForm);

            setGrades([]);
            setSections([]);

            setShowPassword(false);
            setShowConfirmPassword(false);

            onSuccess();

            onClose();

        } catch (err: any) {

            console.error(
                "Failed to create student:",
                err
            );

            const backendMessage =
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                err?.response?.data;

            setError(
                typeof backendMessage === "string"
                    ? backendMessage
                    : "Failed to create student. Please try again."
            );

            const message =
                typeof backendMessage === "string"
                    ? backendMessage
                    : "Failed to create student. Please try again.";

            setError(message);

            toast.error(message);

        } finally {

            setSubmitting(false);
        }
    };

    /*
     * ========================================================
     * CLOSE
     * ========================================================
     */

    const handleClose = () => {

        if (submitting) {
            return;
        }

        setForm(initialForm);
        setGrades([]);
        setSections([]);

        setError(null);

        setShowPassword(false);
        setShowConfirmPassword(false);

        onClose();
    };

    if (!open) {
        return null;
    }

    /*
     * ========================================================
     * UI
     * ========================================================
     */

    return (
        <div
            className="
                fixed inset-0 z-50
                flex items-center justify-center
                bg-slate-900/40
                p-4
                backdrop-blur-sm
            "
        >

            <div
                className="
                    flex
                    max-h-[92vh]
                    w-full
                    max-w-3xl
                    flex-col
                    overflow-hidden
                    rounded-2xl
                    bg-white
                    shadow-2xl
                "
            >

                {/* =================================================
                    HEADER
                ================================================== */}

                <div
                    className="
                        flex
                        items-center
                        justify-between
                        border-b
                        border-slate-200
                        px-6
                        py-5
                    "
                >

                    <div>
                        <h2 className="text-xl font-semibold text-slate-800">
                            Add Student
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Create a student account and assign
                            their academic details.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={submitting}
                        aria-label="Close"
                        className="
                            rounded-lg
                            p-2
                            text-slate-400
                            transition
                            hover:bg-slate-100
                            hover:text-slate-700
                            disabled:cursor-not-allowed
                            disabled:opacity-50
                        "
                    >
                        <X size={20} />
                    </button>

                </div>

                {/* =================================================
                    FORM
                ================================================== */}

                <form
                    onSubmit={handleSubmit}
                    className="overflow-y-auto"
                >

                    <div className="space-y-7 px-6 py-6">

                        {/* =================================================
                            PERSONAL INFORMATION
                        ================================================== */}

                        <section>

                            <div className="mb-4">
                                <h3 className="text-sm font-semibold text-slate-800">
                                    Personal Information
                                </h3>

                                <p className="mt-1 text-xs text-slate-400">
                                    Basic information for the student account.
                                </p>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">

                                {/* Full Name */}

                                <div className="md:col-span-2">

                                    <label
                                        htmlFor="student-full-name"
                                        className="mb-1.5 block text-sm font-medium text-slate-700"
                                    >
                                        Full Name
                                    </label>

                                    <input
                                        id="student-full-name"
                                        type="text"
                                        value={form.fullName}
                                        onChange={(event) =>
                                            updateField(
                                                "fullName",
                                                event.target.value
                                            )
                                        }
                                        placeholder="Enter student's full name"
                                        disabled={submitting}
                                        className="
                                            w-full
                                            rounded-xl
                                            border
                                            border-slate-200
                                            bg-white
                                            px-4
                                            py-3
                                            text-sm
                                            text-slate-700
                                            outline-none
                                            transition
                                            placeholder:text-slate-400
                                            focus:border-blue-400
                                            focus:ring-2
                                            focus:ring-blue-100
                                            disabled:bg-slate-50
                                        "
                                    />

                                </div>

                                {/* Email */}

                                <div>

                                    <label
                                        htmlFor="student-email"
                                        className="mb-1.5 block text-sm font-medium text-slate-700"
                                    >
                                        Email
                                    </label>

                                    <input
                                        id="student-email"
                                        type="email"
                                        value={form.email}
                                        onChange={(event) =>
                                            updateField(
                                                "email",
                                                event.target.value
                                            )
                                        }
                                        placeholder="student@example.com"
                                        disabled={submitting}
                                        className="
                                            w-full
                                            rounded-xl
                                            border
                                            border-slate-200
                                            bg-white
                                            px-4
                                            py-3
                                            text-sm
                                            text-slate-700
                                            outline-none
                                            transition
                                            placeholder:text-slate-400
                                            focus:border-blue-400
                                            focus:ring-2
                                            focus:ring-blue-100
                                            disabled:bg-slate-50
                                        "
                                    />

                                </div>


                                {/* PHONE */}

                                <div className="md:col-span-2">

                                    <label
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

                                        <input
                                            type="text"
                                            value={form.countryCode}
                                            onChange={(event) =>
                                                updateField(
                                                    "countryCode",
                                                    event.target.value
                                                )
                                            }
                                            placeholder="+91"
                                            disabled={submitting}
                                            className="
                                                w-20
                                                shrink-0
                                                border-r
                                                border-slate-200
                                                bg-white
                                                px-3
                                                py-3
                                                text-sm
                                                text-slate-700
                                                outline-none
                                                disabled:bg-slate-50
                                            "
                                        />

                                        <input
                                            type="tel"
                                            value={form.phoneNumber}
                                            onChange={(event) =>
                                                updateField(
                                                    "phoneNumber",
                                                    event.target.value
                                                )
                                            }
                                            placeholder="10-digit mobile number"
                                            disabled={submitting}
                                            className="
                                                min-w-0
                                                flex-1
                                                bg-white
                                                px-3
                                                py-3
                                                text-sm
                                                text-slate-700
                                                outline-none
                                                disabled:bg-slate-50
                                            "
                                        />

                                    </div>

                                </div>

                            </div>

                        </section>

                        {/* =================================================
                            ACCOUNT SECURITY
                        ================================================== */}

                        <section>

                            <div className="mb-4">
                                <h3 className="text-sm font-semibold text-slate-800">
                                    Account Security
                                </h3>

                                <p className="mt-1 text-xs text-slate-400">
                                    Set the initial password for the student.
                                </p>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">

                                {/* Password */}

                                <div>

                                    <label
                                        htmlFor="student-password"
                                        className="mb-1.5 block text-sm font-medium text-slate-700"
                                    >
                                        Password
                                    </label>

                                    <div className="relative">

                                        <input
                                            id="student-password"
                                            type={
                                                showPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            value={form.password}
                                            onChange={(event) =>
                                                updateField(
                                                    "password",
                                                    event.target.value
                                                )
                                            }
                                            placeholder="Create password"
                                            disabled={submitting}
                                            className="
                                                w-full
                                                rounded-xl
                                                border
                                                border-slate-200
                                                bg-white
                                                px-4
                                                py-3
                                                pr-11
                                                text-sm
                                                text-slate-700
                                                outline-none
                                                transition
                                                placeholder:text-slate-400
                                                focus:border-blue-400
                                                focus:ring-2
                                                focus:ring-blue-100
                                                disabled:bg-slate-50
                                            "
                                        />

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowPassword(
                                                    (value) => !value
                                                )
                                            }
                                            className="
                                                absolute
                                                right-3
                                                top-1/2
                                                -translate-y-1/2
                                                rounded-lg
                                                p-1.5
                                                text-slate-400
                                                hover:bg-slate-100
                                                hover:text-slate-600
                                            "
                                            aria-label={
                                                showPassword
                                                    ? "Hide password"
                                                    : "Show password"
                                            }
                                        >
                                            {showPassword ? (
                                                <EyeOff size={18} />
                                            ) : (
                                                <Eye size={18} />
                                            )}
                                        </button>

                                    </div>

                                </div>

                                {/* Confirm Password */}

                                <div>

                                    <label
                                        htmlFor="student-confirm-password"
                                        className="mb-1.5 block text-sm font-medium text-slate-700"
                                    >
                                        Confirm Password
                                    </label>

                                    <div className="relative">

                                        <input
                                            id="student-confirm-password"
                                            type={
                                                showConfirmPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            value={form.confirmPassword}
                                            onChange={(event) =>
                                                updateField(
                                                    "confirmPassword",
                                                    event.target.value
                                                )
                                            }
                                            placeholder="Confirm password"
                                            disabled={submitting}
                                            className="
                                                w-full
                                                rounded-xl
                                                border
                                                border-slate-200
                                                bg-white
                                                px-4
                                                py-3
                                                pr-11
                                                text-sm
                                                text-slate-700
                                                outline-none
                                                transition
                                                placeholder:text-slate-400
                                                focus:border-blue-400
                                                focus:ring-2
                                                focus:ring-blue-100
                                                disabled:bg-slate-50
                                            "
                                        />

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowConfirmPassword(
                                                    (value) => !value
                                                )
                                            }
                                            className="
                                                absolute
                                                right-3
                                                top-1/2
                                                -translate-y-1/2
                                                rounded-lg
                                                p-1.5
                                                text-slate-400
                                                hover:bg-slate-100
                                                hover:text-slate-600
                                            "
                                            aria-label={
                                                showConfirmPassword
                                                    ? "Hide password"
                                                    : "Show password"
                                            }
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

                            <p className="mt-3 text-xs text-slate-400">
                                Password must contain uppercase, lowercase,
                                number and symbol.
                            </p>

                        </section>

                        {/* =================================================
                            ACADEMIC INFORMATION
                        ================================================== */}

                        <section>

                            <div className="mb-4">
                                <h3 className="text-sm font-semibold text-slate-800">
                                    Academic Information
                                </h3>

                                <p className="mt-1 text-xs text-slate-400">
                                    Assign the student's academic year,
                                    grade and section.
                                </p>
                            </div>

                            <div className="grid gap-4 md:grid-cols-3">

                                {/* Academic Year */}

                                <div>

                                    <label
                                        htmlFor="student-academic-year"
                                        className="mb-1.5 block text-sm font-medium text-slate-700"
                                    >
                                        Academic Year
                                    </label>

                                    <select
                                        id="student-academic-year"
                                        value={form.academicYearId}
                                        onChange={(event) =>
                                            updateField(
                                                "academicYearId",
                                                event.target.value
                                            )
                                        }
                                        disabled={
                                            submitting ||
                                            loadingYears
                                        }
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
                                            focus:border-blue-400
                                            focus:ring-2
                                            focus:ring-blue-100
                                            disabled:bg-slate-50
                                        "
                                    >

                                        <option value="">
                                            {loadingYears
                                                ? "Loading..."
                                                : "Select year"}
                                        </option>

                                        {academicYears.map(
                                            (year) => (
                                                <option
                                                    key={year.id}
                                                    value={year.id}
                                                >
                                                    {year.name}
                                                    {year.active
                                                        ? " (Active)"
                                                        : ""}
                                                </option>
                                            )
                                        )}

                                    </select>

                                </div>

                                {/* Grade */}

                                <div>

                                    <label
                                        htmlFor="student-grade"
                                        className="mb-1.5 block text-sm font-medium text-slate-700"
                                    >
                                        Grade
                                    </label>

                                    <select
                                        id="student-grade"
                                        value={form.gradeId}
                                        onChange={(event) =>
                                            updateField(
                                                "gradeId",
                                                event.target.value
                                            )
                                        }
                                        disabled={
                                            submitting ||
                                            loadingGrades ||
                                            !form.academicYearId
                                        }
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
                                            focus:border-blue-400
                                            focus:ring-2
                                            focus:ring-blue-100
                                            disabled:bg-slate-50
                                        "
                                    >

                                        <option value="">
                                            {loadingGrades
                                                ? "Loading..."
                                                : "Select grade"}
                                        </option>

                                        {grades.map(
                                            (grade) => (
                                                <option
                                                    key={grade.id}
                                                    value={grade.id}
                                                >
                                                    {grade.name}
                                                </option>
                                            )
                                        )}

                                    </select>

                                </div>

                                {/* Section */}

                                <div>

                                    <label
                                        htmlFor="student-section"
                                        className="mb-1.5 block text-sm font-medium text-slate-700"
                                    >
                                        Section
                                    </label>

                                    <select
                                        id="student-section"
                                        value={form.sectionId}
                                        onChange={(event) =>
                                            updateField(
                                                "sectionId",
                                                event.target.value
                                            )
                                        }
                                        disabled={
                                            submitting ||
                                            loadingSections ||
                                            !form.gradeId
                                        }
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
                                            focus:border-blue-400
                                            focus:ring-2
                                            focus:ring-blue-100
                                            disabled:bg-slate-50
                                        "
                                    >

                                        <option value="">
                                            {loadingSections
                                                ? "Loading..."
                                                : "Select section"}
                                        </option>

                                        {sections.map(
                                            (section) => (
                                                <option
                                                    key={section.id}
                                                    value={section.id}
                                                >
                                                    {section.name}
                                                </option>
                                            )
                                        )}

                                    </select>

                                </div>

                            </div>

                        </section>

                        {/* =================================================
                            ERROR
                        ================================================== */}

                        {error && (
                            <div
                                className="
                                    rounded-xl
                                    border
                                    border-red-200
                                    bg-red-50
                                    px-4
                                    py-3
                                "
                            >
                                <p className="text-sm text-red-600">
                                    {error}
                                </p>
                            </div>
                        )}

                    </div>

                    {/* =================================================
                        FOOTER
                    ================================================== */}

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
                            onClick={handleClose}
                            disabled={submitting}
                            className="
                                rounded-xl
                                border
                                border-slate-200
                                bg-white
                                px-5
                                py-2.5
                                text-sm
                                font-medium
                                text-slate-600
                                transition
                                hover:bg-slate-100
                                disabled:cursor-not-allowed
                                disabled:opacity-50
                            "
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={
                                submitting ||
                                loadingYears ||
                                loadingGrades ||
                                loadingSections
                            }
                            className="
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
                            {submitting
                                ? "Creating..."
                                : "Create Student"}
                        </button>

                    </div>

                </form>

            </div>

        </div>
    );
}