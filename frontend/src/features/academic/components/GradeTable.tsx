import {
    CheckCircle2,
    GraduationCap,
    XCircle,
} from "lucide-react";

import type { Grade } from "../services/gradeService";

type Props = {
    grades: Grade[];
    onManage: (grade: Grade) => void;
};


export default function GradeTable({
                                       grades,
                                       onManage,
                                   }: Props) {

    if (grades.length === 0) {

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

                <GraduationCap
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
                    No Grades
                </h3>

                <p
                    className="
                        mt-1
                        text-sm
                        text-slate-400
                    "
                >
                    No grades have been created for
                    this academic year.
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
                            Grade
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
                            Description
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

                    {grades.map((grade) => (

                        <tr
                            key={grade.id}
                            className="
                                    border-b
                                    border-slate-100
                                    last:border-b-0
                                    hover:bg-slate-50/70
                                "
                        >

                            <td
                                className="
                                        px-6
                                        py-4
                                    "
                            >

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

                                        <GraduationCap
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
                                            {grade.name}
                                        </p>

                                        <p
                                            className="
                                                    text-xs
                                                    text-slate-400
                                                "
                                        >
                                            {grade.academicYearName}
                                        </p>

                                    </div>

                                </div>

                            </td>


                            <td
                                className="
                                        max-w-md
                                        px-6
                                        py-4
                                        text-sm
                                        text-slate-600
                                    "
                            >

                                    <span
                                        className="
                                            line-clamp-2
                                        "
                                    >
                                        {grade.description ||
                                            "No description"}
                                    </span>

                            </td>


                            <td className="px-6 py-4">

                                {grade.active ? (

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
                                            grade
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

                    ))}

                    </tbody>

                </table>

            </div>

        </div>
    );
}