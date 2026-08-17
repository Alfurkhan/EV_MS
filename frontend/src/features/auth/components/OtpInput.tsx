import {
    useEffect,
    useRef,
} from "react";

type Props = {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
};

export default function OtpInput({
                                     value,
                                     onChange,
                                     disabled = false,
                                 }: Props) {

    const inputsRef =
        useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {

        if (value.length === 0) {
            inputsRef.current[0]?.focus();
        }

    }, [value]);

    const handleChange = (
        index: number,
        inputValue: string
    ) => {

        const digit =
            inputValue.replace(/\D/g, "").slice(-1);

        const digits = value.split("");

        digits[index] = digit;

        const newValue = digits
            .join("")
            .slice(0, 6);

        onChange(newValue);

        if (digit && index < 5) {
            inputsRef.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (
        index: number,
        event: React.KeyboardEvent<HTMLInputElement>
    ) => {

        if (
            event.key === "Backspace" &&
            !value[index] &&
            index > 0
        ) {
            inputsRef.current[index - 1]?.focus();
        }

    };

    const handlePaste = (
        event: React.ClipboardEvent<HTMLInputElement>
    ) => {

        event.preventDefault();

        const pasted =
            event.clipboardData
                .getData("text")
                .replace(/\D/g, "")
                .slice(0, 6);

        onChange(pasted);

        const nextIndex =
            Math.min(pasted.length, 5);

        inputsRef.current[nextIndex]?.focus();
    };

    return (

        <div className="flex justify-between gap-2">

            {Array.from({ length: 6 }).map((_, index) => (

                <input
                    key={index}
                    ref={(element) => {
                        inputsRef.current[index] =
                            element;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={value[index] || ""}
                    disabled={disabled}
                    onChange={(event) =>
                        handleChange(
                            index,
                            event.target.value
                        )
                    }
                    onKeyDown={(event) =>
                        handleKeyDown(
                            index,
                            event
                        )
                    }
                    onPaste={handlePaste}
                    className="
                        w-12
                        h-14
                        rounded-xl
                        border
                        border-slate-200
                        bg-white
                        text-center
                        text-xl
                        font-semibold
                        text-slate-800
                        outline-none
                        transition
                        focus:border-blue-500
                        focus:ring-2
                        focus:ring-blue-100
                        disabled:bg-slate-100
                    "
                />

            ))}

        </div>
    );
}