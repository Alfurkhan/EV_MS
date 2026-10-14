import { useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";

import { useAuth } from "../../../contexts/AuthContext";

type AccountImportButtonProps = {
    onClick: () => void;
};

export default function AccountImportButton({
                                                onClick,
                                            }: AccountImportButtonProps) {
    const { hasRole } = useAuth();

    const [isVisible, setIsVisible] = useState(false);

    const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
        null
    );

    const isAdmin = hasRole("ROLE_ADMIN");

    useEffect(() => {
        if (!isAdmin) {
            return;
        }

        const showButton = () => {
            setIsVisible(true);

            if (hideTimerRef.current) {
                clearTimeout(hideTimerRef.current);
            }

            hideTimerRef.current = setTimeout(() => {
                setIsVisible(false);
            }, 4000);
        };

        window.addEventListener("mousemove", showButton);

        return () => {
            window.removeEventListener("mousemove", showButton);

            if (hideTimerRef.current) {
                clearTimeout(hideTimerRef.current);
            }
        };
    }, [isAdmin]);

    if (!isAdmin) {
        return null;
    }

    return (
        <button
            type="button"
            onClick={onClick}
            aria-label="Add accounts"
            title="Add accounts"
            className={`
        fixed bottom-8 right-8 z-50
        flex h-14 w-14 items-center justify-center
        rounded-full
        bg-white text-blue-600
        shadow-lg
        transition-all duration-300 ease-out
        hover:scale-110 hover:bg-blue-50
        focus:outline-none
        focus:ring-4 focus:ring-blue-200
        ${
                isVisible
                    ? "translate-y-0 scale-100 opacity-100"
                    : "pointer-events-none translate-y-4 scale-75 opacity-0"
            }
    `}
        >
            <Plus size={28} strokeWidth={2.5} />
        </button>
    );
}