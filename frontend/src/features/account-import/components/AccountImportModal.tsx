
import { useRef, useState } from "react";
import axios from "axios";
import { FileSpreadsheet, Upload, X } from "lucide-react";
import api from "../../../api/axios";

type AccountImportModalProps = {
    onClose: () => void;
};

type ValidationResult = {
    valid: boolean;
    studentsToCreate: number;
    facultyToCreate: number;
    totalToCreate: number;
};

type ImportResult = {
    studentsCreated: number;
    facultyCreated: number;
    totalCreated: number;
    errors: string[];
};

export default function AccountImportModal({
                                               onClose,
                                           }: AccountImportModalProps) {
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [fileError, setFileError] = useState("");
    const [isImporting, setIsImporting] = useState(false);
    const [importResult, setImportResult] = useState<ImportResult | null>(null);
    const [validationResult, setValidationResult] =
        useState<ValidationResult | null>(null);
    const [importError, setImportError] = useState("");
    const [importErrorCode, setImportErrorCode] = useState("");
    const [errorStage, setErrorStage] = useState<"validation" | "import">(
        "validation"
    );

    const handleFileChange = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0];

        setFileError("");
        setImportError("");
        setImportErrorCode("");
        setImportResult(null);
        setValidationResult(null);

        if (!file) {
            setSelectedFile(null);
            return;
        }

        if (!file.name.toLowerCase().endsWith(".xlsx")) {
            setSelectedFile(null);
            setFileError("Please select an Excel (.xlsx) file.");
            event.target.value = "";
            return;
        }

        setSelectedFile(file);
    };

    const handleChooseFile = () => {
        fileInputRef.current?.click();
    };

    const handleValidateAndPreview = async () => {
        if (!selectedFile || isImporting) return;

        setIsImporting(true);
        setImportError("");
        setImportErrorCode("");
        setErrorStage("validation");
        setImportResult(null);
        setValidationResult(null);

        try {
            const formData = new FormData();
            formData.append("file", selectedFile);

            // Use the shared API instance so the JWT interceptor attaches
            // the admin access token to this request.
            const response = await api.post<ValidationResult>(
                "/admin/test-accounts/validate",
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            setValidationResult(response.data);
        } catch (error: unknown) {
            console.error("Account validation failed:", error);

            setErrorStage("validation");

            if (axios.isAxiosError(error)) {
                setImportErrorCode(
                    error.response?.data?.errorCode ?? ""
                );

                setImportError(
                    error.response?.data?.message ||
                    "We couldn't validate this Excel file. Please check the file and try again."
                );
            } else {
                setImportErrorCode("");
                setImportError(
                    "An unexpected error occurred while validating the Excel file."
                );
            }
        } finally {
            setIsImporting(false);
        }
    };

    const handleImportAccounts = async () => {
        if (!selectedFile || !validationResult || isImporting) return;

        setIsImporting(true);
        setImportError("");
        setImportErrorCode("");
        setErrorStage("import");

        try {
            const formData = new FormData();
            formData.append("file", selectedFile);

            // Use the same authenticated API instance for importing.
            const response = await api.post<ImportResult>(
                "/admin/test-accounts/import",
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            setImportResult(response.data);
            setValidationResult(null);
        } catch (error: unknown) {
            console.error("Account import failed:", error);

            setErrorStage("import");

            if (axios.isAxiosError(error)) {
                setImportErrorCode(
                    error.response?.data?.errorCode ?? ""
                );

                setImportError(
                    error.response?.data?.message ||
                    "We couldn't import the accounts. Please try again."
                );
            } else {
                setImportErrorCode("");
                setImportError(
                    "An unexpected error occurred while importing accounts."
                );
            }
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 px-4 py-4 sm:items-center">
            {/* Modal panel */}
            <div className="flex max-h-[calc(100dvh-2rem)] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
                {/* Header */}
                <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-6 py-4 sm:px-8 sm:py-5">
                    <div>
                        <h2 className="text-2xl font-semibold text-slate-900">
                            Add Accounts
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Import student and faculty accounts from an Excel
                            file.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isImporting}
                        className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Close"
                    >
                        <X size={22} />
                    </button>
                </div>

                {/* Scrollable content */}
                <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 sm:px-8 sm:py-6">
                    {/* Upload area */}
                    {!importResult && (
                        <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center transition hover:border-blue-400 hover:bg-blue-50/30">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                                <FileSpreadsheet size={28} />
                            </div>

                            <h3 className="mt-4 text-lg font-semibold text-slate-800">
                                Upload Excel File
                            </h3>

                            <p className="mt-2 text-sm text-slate-500">
                                Select the account import workbook containing
                                Students and Faculties sheets.
                            </p>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx"
                                onChange={handleFileChange}
                                className="hidden"
                            />

                            <button
                                type="button"
                                onClick={handleChooseFile}
                                disabled={isImporting}
                                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white transition hover:bg-blue-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <Upload size={18} />
                                Choose Excel File
                            </button>

                            <p className="mt-3 text-xs text-slate-400">
                                Only .xlsx files are supported.
                            </p>
                        </div>
                    )}

                    {/* Selected file */}
                    {selectedFile && !importResult && (
                        <div className="mt-4 flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
                            <FileSpreadsheet
                                size={22}
                                className="shrink-0 text-blue-600"
                            />

                            <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-slate-800">
                                    {selectedFile.name}
                                </p>

                                <p className="text-xs text-slate-500">
                                    {(selectedFile.size / 1024).toFixed(1)} KB
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Validation preview */}
                    {validationResult && !importResult && (
                        <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4 sm:p-5">
                            <h3 className="text-lg font-semibold text-blue-900">
                                Validation Successful
                            </h3>

                            <p className="mt-1 text-sm text-blue-700">
                                No accounts have been created yet. Review the
                                counts below.
                            </p>

                            <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
                                <div className="rounded-lg bg-white p-3 text-center">
                                    <p className="text-xl font-bold text-blue-700 sm:text-2xl">
                                        {validationResult.studentsToCreate}
                                    </p>
                                    <p className="text-xs text-slate-600">
                                        Students
                                    </p>
                                </div>

                                <div className="rounded-lg bg-white p-3 text-center">
                                    <p className="text-xl font-bold text-purple-700 sm:text-2xl">
                                        {validationResult.facultyToCreate}
                                    </p>
                                    <p className="text-xs text-slate-600">
                                        Faculty
                                    </p>
                                </div>

                                <div className="rounded-lg bg-white p-3 text-center">
                                    <p className="text-xl font-bold text-green-700 sm:text-2xl">
                                        {validationResult.totalToCreate}
                                    </p>
                                    <p className="text-xs text-slate-600">
                                        Total
                                    </p>
                                </div>
                            </div>

                            <p className="mt-3 text-sm font-medium text-slate-700">
                                Continue only if these numbers look correct.
                            </p>
                        </div>
                    )}

                    {/* Loading status */}
                    {isImporting && (
                        <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-4 text-center">
                            <p className="text-sm font-medium text-blue-700">
                                {errorStage === "import" && validationResult
                                    ? "Importing accounts..."
                                    : "Validating Excel file..."}
                            </p>

                            <p className="mt-1 text-xs text-blue-500">
                                Please wait. Do not close this window.
                            </p>
                        </div>
                    )}

                    {/* File validation error */}
                    {fileError && (
                        <p className="mt-4 text-sm font-medium text-red-600">
                            {fileError}
                        </p>
                    )}

                    {/* Backend error */}
                    {importError && (
                        <div
                            role="alert"
                            className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-4"
                        >
                            <p className="text-sm font-semibold text-red-700">
                                {importErrorCode === "ACCOUNT_ALREADY_EXISTS"
                                    ? "Account already exists"
                                    : errorStage === "import"
                                        ? "Import failed"
                                        : "Validation failed"}
                            </p>

                            <p className="mt-1 text-sm text-red-600">
                                {importError}
                            </p>

                            {importErrorCode === "ACCOUNT_ALREADY_EXISTS" && (
                                <p className="mt-2 text-sm text-red-700">
                                    Please use a workbook containing accounts
                                    that have not already been imported. No
                                    accounts were created by this failed
                                    validation.
                                </p>
                            )}
                        </div>
                    )}

                    {/* Import result */}
                    {importResult && (
                        <div className="rounded-2xl border border-green-200 bg-green-50 p-5 sm:p-6">
                            <div className="text-center">
                                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
                                    <span className="text-2xl">✓</span>
                                </div>

                                <h3 className="mt-4 text-lg font-semibold text-green-800">
                                    Accounts Created Successfully
                                </h3>

                                <p className="mt-1 text-sm text-green-600">
                                    The Excel import completed successfully.
                                </p>
                            </div>

                            <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
                                <div className="rounded-xl bg-white p-3 text-center shadow-sm sm:p-4">
                                    <p className="text-xl font-bold text-blue-700 sm:text-2xl">
                                        {importResult.studentsCreated}
                                    </p>
                                    <p className="mt-1 text-xs font-medium text-slate-500">
                                        Students
                                    </p>
                                </div>

                                <div className="rounded-xl bg-white p-3 text-center shadow-sm sm:p-4">
                                    <p className="text-xl font-bold text-purple-700 sm:text-2xl">
                                        {importResult.facultyCreated}
                                    </p>
                                    <p className="mt-1 text-xs font-medium text-slate-500">
                                        Faculty
                                    </p>
                                </div>

                                <div className="rounded-xl bg-white p-3 text-center shadow-sm sm:p-4">
                                    <p className="text-xl font-bold text-green-700 sm:text-2xl">
                                        {importResult.totalCreated}
                                    </p>
                                    <p className="mt-1 text-xs font-medium text-slate-500">
                                        Total
                                    </p>
                                </div>
                            </div>

                            {importResult.errors.length > 0 && (
                                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4">
                                    <p className="text-sm font-semibold text-red-700">
                                        Errors
                                    </p>

                                    <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto text-sm text-red-600">
                                        {importResult.errors.map(
                                            (error, index) => (
                                                <li key={index}>
                                                    • {error}
                                                </li>
                                            )
                                        )}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Fixed footer */}
                <div className="flex shrink-0 justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4 sm:px-8 sm:py-5">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isImporting}
                        className="rounded-xl border border-slate-300 px-4 py-3 font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 sm:px-5"
                    >
                        {importResult ? "Close" : "Cancel"}
                    </button>

                    {!importResult && !validationResult && (
                        <button
                            type="button"
                            onClick={handleValidateAndPreview}
                            disabled={!selectedFile || isImporting}
                            className="rounded-xl bg-blue-700 px-4 py-3 font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-40 sm:px-5"
                        >
                            {isImporting
                                ? "Validating..."
                                : "Validate & Preview"}
                        </button>
                    )}

                    {validationResult && !importResult && (
                        <button
                            type="button"
                            onClick={handleImportAccounts}
                            disabled={isImporting}
                            className="rounded-xl bg-green-700 px-4 py-3 font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-40 sm:px-5"
                        >
                            {isImporting
                                ? "Importing..."
                                : "Import Accounts"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
