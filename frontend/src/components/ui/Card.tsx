import type { ReactNode } from "react";

interface CardProps {
    children: ReactNode;
}

export default function Card({ children }: CardProps) {
    return (
        <div
            className="
        rounded-2xl
        border
        border-slate-700
        bg-slate-900/70
        p-8
        shadow-2xl
        backdrop-blur-md
      "
        >
            {children}
        </div>
    );
}