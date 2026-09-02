import { CalendarDays, CheckCircle2, XCircle } from "lucide-react";

import type { AcademicYear } from "../services/academicYearService";

type Props = {
    academicYears: AcademicYear[];
    onManage: (academicYear: AcademicYear) => void;
};


function formatDate(value: string): string {

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
        }
    );
}


export default function AcademicYearTable({
                                              academicYears,
                                              onManage,
                                          }: Props) {

    if (academicYears.length === 0) {

        return (
            <div
                className="
                    rounded-2xl
                    border
                    border-slate-200
                    bg-white
                    px-6
                    py-12
                    text-center
                    shadow-sm
                "
            >

                <CalendarDays
                    size={40}
                    className="
                        mx-auto
                        text-slate-300
                    "
                />

                <h3
                    className="
                        mt-4
                        text-lg
                        font-semibold
                        text-slate-700
                    "
                >
                    No Academic Years
                </h3>

                <p
                    className="
                        mt-1
                        text-sm
                        text-slate-400
                    "
                >
                    Create an academic year to get started.
                </p>

            </div>
        );
    }


    return (

        <div
            className="
                overflow-hidden
                rounded-2xl
                border
                border-slate-200
                bg-white
                shadow-sm
            "
        >

            <div className="overflow-x-auto">

                <table className="w-full">

                    <thead>

                    <tr
                        className="
                                border-b
                                border-slate-200
                                bg-slate-50
                            "
                    >

                        <th
                            className="
                                    px-6
                                    py-4
                                    text-left
                                    text-xs
                                    font-semibold
                                    uppercase
                                    tracking-wide
                                    text-slate-500
                                "
                        >
                            Academic Year
                        </th>

                        <th
                            className="
                                    px-6
                                    py-4
                                    text-left
                                    text-xs
                                    font-semibold
                                    uppercase
                                    tracking-wide
                                    text-slate-500
                                "
                        >
                            Start Date
                        </th>

                        <th
                            className="
                                    px-6
                                    py-4
                                    text-left
                                    text-xs
                                    font-semibold
                                    uppercase
                                    tracking-wide
                                    text-slate-500
                                "
                        >
                            End Date
                        </th>

                        <th
                            className="
                                    px-6
                                    py-4
                                    text-left
                                    text-xs
                                    font-semibold
                                    uppercase
                                    tracking-wide
                                    text-slate-500
                                "
                        >
                            Status
                        </th>

                        <th
                            className="
                                    px-6
                                    py-4
                                    text-right
                                    text-xs
                                    font-semibold
                                    uppercase
                                    tracking-wide
                                    text-slate-500
                                "
                        >
                            Action
                        </th>

                    </tr>

                    </thead>


                    <tbody>

                    {academicYears.map(
                        (academicYear) => (

                            <tr
                                key={academicYear.id}
                                className="
                                        border-b
                                        border-slate-100
                                        last:border-b-0
                                        hover:bg-slate-50/70
                                    "
                            >

                                <td className="px-6 py-4">

                                    <div
                                        className="
                                                flex
                                                items-center
                                                gap-3
                                            "
                                    >

                                        <div
                                            className="
                                                    flex
                                                    h-10
                                                    w-10
                                                    shrink-0
                                                    items-center
                                                    justify-center
                                                    rounded-xl
                                                    bg-blue-50
                                                    text-blue-600
                                                "
                                        >

                                            <CalendarDays
                                                size={19}
                                            />

                                        </div>

                                        <div>

                                            <p
                                                className="
                                                        text-sm
                                                        font-semibold
                                                        text-slate-800
                                                    "
                                            >
                                                {academicYear.name}
                                            </p>

                                            <p
                                                className="
                                                        text-xs
                                                        text-slate-400
                                                    "
                                            >
                                                Academic Year
                                            </p>

                                        </div>

                                    </div>

                                </td>


                                <td
                                    className="
                                            px-6
                                            py-4
                                            text-sm
                                            text-slate-600
                                        "
                                >
                                    {formatDate(
                                        academicYear.startDate
                                    )}
                                </td>


                                <td
                                    className="
                                            px-6
                                            py-4
                                            text-sm
                                            text-slate-600
                                        "
                                >
                                    {formatDate(
                                        academicYear.endDate
                                    )}
                                </td>


                                <td className="px-6 py-4">

                                    {academicYear.active ? (

                                        <span
                                            className="
                                                    inline-flex
                                                    items-center
                                                    gap-1.5
                                                    rounded-full
                                                    bg-green-50
                                                    px-3
                                                    py-1.5
                                                    text-xs
                                                    font-semibold
                                                    text-green-600
                                                "
                                        >

                                                <CheckCircle2
                                                    size={14}
                                                />

                                                Active

                                            </span>

                                    ) : (

                                        <span
                                            className="
                                                    inline-flex
                                                    items-center
                                                    gap-1.5
                                                    rounded-full
                                                    bg-slate-100
                                                    px-3
                                                    py-1.5
                                                    text-xs
                                                    font-semibold
                                                    text-slate-500
                                                "
                                        >

                                                <XCircle
                                                    size={14}
                                                />

                                                Inactive

                                            </span>

                                    )}

                                </td>


                                <td
                                    className="
                                            px-6
                                            py-4
                                            text-right
                                        "
                                >

                                    <button
                                        type="button"
                                        onClick={() =>
                                            onManage(
                                                academicYear
                                            )
                                        }
                                        className="
                                                rounded-lg
                                                px-4
                                                py-2
                                                text-sm
                                                font-semibold
                                                text-blue-600
                                                transition
                                                hover:bg-blue-50
                                            "
                                    >
                                        Manage
                                    </button>

                                </td>

                            </tr>

                        )
                    )}

                    </tbody>

                </table>

            </div>

        </div>
    );
}