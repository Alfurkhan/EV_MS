interface StudentFiltersProps {
    grade: string;
    section: string;
    enrollmentStatus: string;
    accountStatus: string;

    grades: string[];
    sections: string[];

    onGradeChange: (value: string) => void;
    onSectionChange: (value: string) => void;
    onEnrollmentStatusChange: (value: string) => void;
    onAccountStatusChange: (value: string) => void;

    onClear: () => void;
}

export default function StudentFilters({
                                           grade,
                                           section,
                                           enrollmentStatus,
                                           accountStatus,
                                           grades,
                                           sections,
                                           onGradeChange,
                                           onSectionChange,
                                           onEnrollmentStatusChange,
                                           onAccountStatusChange,
                                           onClear,
                                       }: StudentFiltersProps) {
    const hasActiveFilters =
        grade !== "" ||
        section !== "" ||
        enrollmentStatus !== "" ||
        accountStatus !== "";

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-end gap-3">
                {/* Grade */}
                <div className="min-w-[160px] flex-1">
                    <label
                        htmlFor="student-grade-filter"
                        className="mb-1.5 block text-xs font-medium text-slate-500"
                    >
                        Grade
                    </label>

                    <select
                        id="student-grade-filter"
                        value={grade}
                        onChange={(event) => onGradeChange(event.target.value)}
                        className="
                            w-full
                            rounded-xl
                            border border-slate-200
                            bg-white
                            px-3.5
                            py-2.5
                            text-sm
                            text-slate-700
                            outline-none
                            transition
                            focus:border-blue-400
                            focus:ring-2
                            focus:ring-blue-100
                        "
                    >
                        <option value="">All Grades</option>

                        {grades.map((item) => (
                            <option key={item} value={item}>
                                {item}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Section */}
                <div className="min-w-[160px] flex-1">
                    <label
                        htmlFor="student-section-filter"
                        className="mb-1.5 block text-xs font-medium text-slate-500"
                    >
                        Section
                    </label>

                    <select
                        id="student-section-filter"
                        value={section}
                        onChange={(event) =>
                            onSectionChange(event.target.value)
                        }
                        className="
                            w-full
                            rounded-xl
                            border border-slate-200
                            bg-white
                            px-3.5
                            py-2.5
                            text-sm
                            text-slate-700
                            outline-none
                            transition
                            focus:border-blue-400
                            focus:ring-2
                            focus:ring-blue-100
                        "
                    >
                        <option value="">All Sections</option>

                        {sections.map((item) => (
                            <option key={item} value={item}>
                                {item}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Enrollment Status */}
                <div className="min-w-[170px] flex-1">
                    <label
                        htmlFor="student-enrollment-status-filter"
                        className="mb-1.5 block text-xs font-medium text-slate-500"
                    >
                        Enrollment Status
                    </label>

                    <select
                        id="student-enrollment-status-filter"
                        value={enrollmentStatus}
                        onChange={(event) =>
                            onEnrollmentStatusChange(event.target.value)
                        }
                        className="
                            w-full
                            rounded-xl
                            border border-slate-200
                            bg-white
                            px-3.5
                            py-2.5
                            text-sm
                            text-slate-700
                            outline-none
                            transition
                            focus:border-blue-400
                            focus:ring-2
                            focus:ring-blue-100
                        "
                    >
                        <option value="">All Enrollment Status</option>
                        <option value="ENROLLED">Enrolled</option>
                        <option value="NOT_ENROLLED">Not Enrolled</option>
                    </select>
                </div>

                {/* Account Status */}
                <div className="min-w-[160px] flex-1">
                    <label
                        htmlFor="student-account-status-filter"
                        className="mb-1.5 block text-xs font-medium text-slate-500"
                    >
                        Account Status
                    </label>

                    <select
                        id="student-account-status-filter"
                        value={accountStatus}
                        onChange={(event) =>
                            onAccountStatusChange(event.target.value)
                        }
                        className="
                            w-full
                            rounded-xl
                            border border-slate-200
                            bg-white
                            px-3.5
                            py-2.5
                            text-sm
                            text-slate-700
                            outline-none
                            transition
                            focus:border-blue-400
                            focus:ring-2
                            focus:ring-blue-100
                        "
                    >
                        <option value="">All Account Status</option>
                        <option value="ACTIVE">Active</option>
                        <option value="DISABLED">Disabled</option>
                        <option value="LOCKED">Locked</option>
                    </select>
                </div>

                {/* Clear */}
                {hasActiveFilters && (
                    <button
                        type="button"
                        onClick={onClear}
                        className="
                            rounded-xl
                            border border-slate-200
                            bg-white
                            px-4
                            py-2.5
                            text-sm
                            font-medium
                            text-slate-600
                            transition
                            hover:bg-slate-50
                            hover:text-slate-800
                        "
                    >
                        Clear Filters
                    </button>
                )}
            </div>
        </div>
    );
}