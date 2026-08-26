import {
    useState,
    type InputHTMLAttributes,
    type ReactNode,
} from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
    label?: string;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
    error?: string;
};

function EyeIcon() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-5 w-5"
            aria-hidden="true"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 12s3.75-6.75 9.75-6.75S21.75 12 21.75 12s-3.75 6.75-9.75 6.75S2.25 12 2.25 12Z"
            />

            <circle
                cx="12"
                cy="12"
                r="2.75"
            />
        </svg>
    );
}

function EyeOffIcon() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-5 w-5"
            aria-hidden="true"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 3.75 20.25 20.25"
            />

            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.58 5.42A10.65 10.65 0 0 1 12 5.25c6 0 9.75 6.75 9.75 6.75a18.8 18.8 0 0 1-3.04 3.77M6.1 6.1C3.65 7.7 2.25 12 2.25 12s3.75 6.75 9.75 6.75c1.42 0 2.69-.3 3.82-.78"
            />

            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.88 9.88a3 3 0 0 0 4.24 4.24"
            />
        </svg>
    );
}

export default function Input({
                                  label,
                                  leftIcon,
                                  rightIcon,
                                  error,
                                  className = "",
                                  type,
                                  ...props
                              }: Props) {

    const [showPassword, setShowPassword] =
        useState(false);

    const isPasswordField =
        type === "password";

    const inputType =
        isPasswordField && showPassword
            ? "text"
            : type;

    return (
        <div className="space-y-2">

            {label && (
                <label className="text-sm font-medium text-slate-700">
                    {label}
                </label>
            )}

            <div
                className="
                    flex
                    h-14
                    items-center
                    rounded-xl
                    border
                    bg-white
                    px-5
                    transition
                    focus-within:ring-2
                    focus-within:ring-blue-500
                "
            >

                {leftIcon && (
                    <span className="mr-3 text-slate-400">
                        {leftIcon}
                    </span>
                )}

                <input
                    {...props}
                    type={inputType}
                    className={`
                        flex-1
                        bg-transparent
                        outline-none
                        ${className}
                    `}
                />

                {isPasswordField ? (

                    <button
                        type="button"
                        onClick={() =>
                            setShowPassword(
                                (previous) => !previous
                            )
                        }
                        className="
                            ml-3
                            flex
                            h-8
                            w-8
                            items-center
                            justify-center
                            rounded-lg
                            text-slate-400
                            transition
                            hover:bg-slate-100
                            hover:text-slate-600
                            focus:outline-none
                            focus:ring-2
                            focus:ring-blue-500
                        "
                        aria-label={
                            showPassword
                                ? "Hide password"
                                : "Show password"
                        }
                        title={
                            showPassword
                                ? "Hide password"
                                : "Show password"
                        }
                    >
                        {showPassword
                            ? <EyeOffIcon />
                            : <EyeIcon />
                        }
                    </button>

                ) : (

                    rightIcon && (
                        <span className="ml-3">
                            {rightIcon}
                        </span>
                    )
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