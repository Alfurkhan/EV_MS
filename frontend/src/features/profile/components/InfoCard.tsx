import type { ReactNode } from "react";

type Props = {
    icon: ReactNode;
    label: string;
    value: string;
};

export default function InfoCard({
                                     icon,
                                     label,
                                     value,
                                 }: Props) {

    return (
        <div
            className="
                bg-white
                rounded-2xl
                border
                border-slate-200
                p-5
                shadow-sm
                transition-all
                duration-200
                hover:shadow-md
                hover:border-blue-200
            "
        >

            <div className="flex items-center gap-3 mb-3">

                <div
                    className="
                        w-10
                        h-10
                        rounded-xl
                        bg-blue-50
                        text-blue-600
                        flex
                        items-center
                        justify-center
                    "
                >
                    {icon}
                </div>

                <span className="text-sm font-medium text-slate-500">
                    {label}
                </span>

            </div>

            <p
                className="
                    text-lg
                    font-semibold
                    text-slate-800
                    break-words
                "
            >
                {value}
            </p>

        </div>
    );
}