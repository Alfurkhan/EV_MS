import { useEffect, useState } from "react";
import {
    CheckCircle2,
    XCircle,
    X,
} from "lucide-react";

type ToastType = "success" | "error";

type Props = {
    type: ToastType;
    message: string;
    onClose: () => void;
};

export default function Toast({
                                  type,
                                  message,
                                  onClose,
                              }: Props) {

    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {

        // Start entrance animation
        setIsVisible(true);

        // Start exit animation after 2.7 seconds
        const hideTimer = setTimeout(() => {
            setIsVisible(false);
        }, 2700);

        // Remove Toast after exit animation
        const closeTimer = setTimeout(() => {
            onClose();
        }, 3000);

        return () => {
            clearTimeout(hideTimer);
            clearTimeout(closeTimer);
        };

    }, [onClose]);

    const isSuccess = type === "success";

    return (

        <div
            className={`
                fixed
                top-6
                right-6
                z-[100]
                w-[360px]
                bg-white
                rounded-2xl
                shadow-2xl
                border
                border-slate-200
                px-4
                py-4
                flex
                items-start
                gap-3
                transition-all
                duration-300
                ease-out
                transform
                ${
                isVisible
                    ? "translate-x-0 opacity-100"
                    : "translate-x-[120%] opacity-0"
            }
            `}
        >

            <div
                className={`
                    p-2
                    rounded-full
                    ${
                    isSuccess
                        ? "bg-green-100 text-green-600"
                        : "bg-red-100 text-red-600"
                }
                `}
            >
                {isSuccess ? (
                    <CheckCircle2 size={22} />
                ) : (
                    <XCircle size={22} />
                )}
            </div>

            <div className="flex-1">

                <p className="font-semibold text-slate-800">
                    {isSuccess
                        ? "Success"
                        : "Something went wrong"}
                </p>

                <p className="text-sm text-slate-500 mt-1">
                    {message}
                </p>

            </div>

            <button
                onClick={onClose}
                className="
                    p-1
                    rounded-lg
                    text-slate-400
                    hover:bg-slate-100
                    hover:text-slate-700
                    transition
                "
            >
                <X size={17} />
            </button>

        </div>

    );
}