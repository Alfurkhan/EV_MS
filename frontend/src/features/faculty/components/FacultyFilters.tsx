interface FacultyFiltersProps {
    accountStatus: string;
    onAccountStatusChange: (value: string) => void;
    onClear: () => void;
}

export default function FacultyFilters({
                                           accountStatus,
                                           onAccountStatusChange,
                                           onClear,
                                       }: FacultyFiltersProps) {
    const hasFilters = accountStatus !== "ALL";

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-[220px] flex-1">
                    <label className="mb-1.5 block text-xs font-medium text-slate-500">
                        Account Status
                    </label>

                    <select
                        value={accountStatus}
                        onChange={(event) =>
                            onAccountStatusChange(event.target.value)
                        }
                        className="
                            w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5
                            text-sm text-slate-700 outline-none transition
                            focus:border-blue-400 focus:ring-2 focus:ring-blue-100
                        "
                    >
                        <option value="ALL">All Account Status</option>
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="DISABLED">DISABLED</option>
                        <option value="LOCKED">LOCKED</option>
                    </select>
                </div>

                {hasFilters && (
                    <button
                        type="button"
                        onClick={onClear}
                        className="
                            self-end rounded-xl border border-slate-200 bg-white px-4 py-2.5
                            text-sm font-medium text-slate-600 transition
                            hover:bg-slate-50 hover:text-slate-800
                        "
                    >
                        Clear Filters
                    </button>
                )}
            </div>
        </div>
    );
}