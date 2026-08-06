import type { InputHTMLAttributes, ReactNode } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
    label?: string;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
    error?: string;
};

export default function Input({
                                  label,
                                  leftIcon,
                                  rightIcon,
                                  error,
                                  className = "",
                                  ...props
                              }: Props) {
    return (
        <div className="space-y-2">
            {label && (
                <label className="text-sm font-medium text-slate-700">
                    {label}
                </label>
            )}

            <div className="flex items-center h-14 rounded-xl border bg-white px-5 focus-within:ring-2 focus-within:ring-blue-500">
                {leftIcon && (
                    <span className="mr-3 text-slate-400">
                        {leftIcon}
                    </span>
                )}

                <input
                    {...props}
                    className={`flex-1 bg-transparent outline-none ${className}`}
                />

                {rightIcon && (
                    <span className="ml-3">
                        {rightIcon}
                    </span>
                )}
            </div>

            {error && (
                <p className="mt-1 text-sm text-red-500">
                    {error}
                </p>
            )}
        </div>
    );
}