import type { ReactNode } from "react";

type Props = {
    children: ReactNode;
};

export default function AuthCard({ children }: Props) {
    return (
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-10">

            {children}

        </div>
    );
}