import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
    loading?: boolean;
    loadingText?: string;
};

export default function Button({
    children,
    loading = false,
    loadingText = "Signing In...",
    className = "",
    disabled,
    ...props
}: Props) {
    return (
        <button
            {...props}
            disabled={disabled || loading}
            className={`w-full h-14 rounded-xl bg-brand text-lg text-white font-semibold transition hover:bg-brand-hover active:scale-[0.98] disabled:opacity-60 ${className}`}
        >
            {loading ? loadingText : children}
        </button>
    );
}
