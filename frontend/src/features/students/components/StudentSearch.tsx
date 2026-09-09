import { Search, X } from "lucide-react";

interface StudentSearchProps {
    value: string;
    onChange: (value: string) => void;
}

export default function StudentSearch({
                                          value,
                                          onChange,
                                      }: StudentSearchProps) {
    return (
        <div className="relative w-full">
            <Search
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
                type="text"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder="Search students by name, email, phone, grade or section..."
                className="
                    w-full
                    rounded-xl
                    border border-slate-200
                    bg-white
                    py-3
                    pl-11
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

            {value && (
                <button
                    type="button"
                    onClick={() => onChange("")}
                    aria-label="Clear search"
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
                    <X size={17} />
                </button>
            )}
        </div>
    );
}