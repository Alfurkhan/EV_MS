import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
    loading?: boolean;
};

export default function Button({
                                   children,
                                   loading = false,
                                   className = "",
                                   disabled,
                                   ...props
                               }: Props) {
    return (
        <button
            {...props}
            disabled={disabled || loading}
            className={`w-full h-14 rounded-xl bg-blue-700 text-lg text-white font-semibold transition hover:bg-blue-800 active:scale-[0.98] disabled:opacity-60 ${className}`}
        >
            {loading ? "Signing In..." : children}
        </button>
    );
}