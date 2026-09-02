import { useState } from "react";
import { X, CalendarPlus } from "lucide-react";
import toast from "react-hot-toast";

import Button from "../../../components/ui/Button";

import {
    createAcademicYear,
} from "../services/academicYearService";

type Props = {
    onClose: () => void;
    onCreated: () => void | Promise<void>;
};


export default function AddAcademicYearModal({
                                                 onClose,
                                                 onCreated,
                                             }: Props) {

    const [name, setName] = useState("");

    const [startDate, setStartDate] = useState("");

    const [endDate, setEndDate] = useState("");

    const [loading, setLoading] = useState(false);

    const getAcademicYearParts = (
        value: string
    ): {
        startYear: number;
        endYear: number;
    } | null => {

        const match =
            value.trim().match(
                /^(\d{4})-(\d{4})$/
            );

        if (!match) {
            return null;
        }

        const startYear =
            Number(match[1]);

        const endYear =
            Number(match[2]);

        if (endYear !== startYear + 1) {
            return null;
        }

        return {
            startYear,
            endYear,
        };
    };

    const handleSubmit = async () => {

        if (!name.trim()) {

            toast.error(
                "Academic year name is required."
            );

            return;
        }

        if (!startDate) {

            toast.error(
                "Start date is required."
            );

            return;
        }

        if (!endDate) {

            toast.error(
                "End date is required."
            );

            return;
        }

        if (
            new Date(endDate) <=
            new Date(startDate)
        ) {

            toast.error(
                "End date must be after start date."
            );

            return;
        }

        const academicYearParts =
            getAcademicYearParts(name);

        if (!academicYearParts) {

            toast.error(
                "Academic year must be in YYYY-YYYY format with consecutive years."
            );

            return;
        }

        const startDateYear =
            Number(startDate.substring(0, 4));

        const endDateYear =
            Number(endDate.substring(0, 4));

        if (
            startDateYear !==
            academicYearParts.startYear
        ) {

            toast.error(
                "The Start date year doesn't match the academic year range."
            );

            return;
        }

        if (
            endDateYear !==
            academicYearParts.endYear
        ) {

            toast.error(
                "The End date year doesn't match the academic year range."
            );

            return;
        }

        try {

            setLoading(true);

            await createAcademicYear({
                name: name.trim(),
                startDate,
                endDate,
            });

            toast.success(
                "Academic year created successfully."
            );

            await onCreated();

            onClose();

        } catch (error: any) {

            console.error(error);

            toast.error(
                error?.response?.data?.message ||
                error?.response?.data?.errorCode ||
                "Failed to create academic year."
            );

        } finally {

            setLoading(false);

        }
    };


    return (

        <div
            className="
                fixed
                inset-0
                z-50
                flex
                items-center
                justify-center
                overflow-y-auto
                bg-black/40
                p-4
                backdrop-blur-sm
            "
        >

            <div
                className="
                    my-6
                    flex
                    w-full
                    max-w-lg
                    max-h-[calc(100vh-3rem)]
                    flex-col
                    overflow-hidden
                    rounded-2xl
                    bg-white
                    shadow-2xl
                "
            >

                {/* HEADER */}

                <div
                    className="
                        flex
                        shrink-0
                        items-center
                        justify-between
                        border-b
                        border-slate-200
                        px-6
                        py-5
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
                                items-center
                                justify-center
                                rounded-xl
                                bg-blue-50
                                text-blue-600
                            "
                        >

                            <CalendarPlus
                                size={20}
                            />

                        </div>

                        <div>

                            <h2
                                className="
                                    text-xl
                                    font-bold
                                    text-slate-800
                                "
                            >
                                Add Academic Year
                            </h2>

                            <p
                                className="
                                    mt-1
                                    text-sm
                                    text-slate-500
                                "
                            >
                                Create a new academic year.
                            </p>

                        </div>

                    </div>


                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="
                            rounded-lg
                            p-2
                            text-slate-500
                            transition
                            hover:bg-slate-100
                            disabled:opacity-50
                        "
                    >

                        <X size={20} />

                    </button>

                </div>


                {/* FORM */}

                <div
                    className="
                        min-h-0
                        flex-1
                        overflow-y-auto
                    "
                >

                    <div className="space-y-5 p-6">

                        <div>

                            <label
                                className="
                                    text-sm
                                    font-medium
                                    text-slate-700
                                "
                            >
                                Academic Year
                            </label>

                            <input
                                type="text"
                                value={name}
                                onChange={(event) =>
                                    setName(
                                        event.target.value
                                    )
                                }
                                placeholder="e.g. 2027-2028"
                                disabled={loading}
                                className="
                                    mt-2
                                    w-full
                                    rounded-xl
                                    border
                                    border-slate-300
                                    px-4
                                    py-3
                                    text-sm
                                    text-slate-700
                                    outline-none
                                    transition
                                    focus:border-blue-500
                                    focus:ring-2
                                    focus:ring-blue-100
                                "
                            />

                        </div>


                        <div>

                            <label
                                className="
                                    text-sm
                                    font-medium
                                    text-slate-700
                                "
                            >
                                Start Date
                            </label>

                            <input
                                type="date"
                                value={startDate}
                                min={
                                    getAcademicYearParts(name)
                                        ? `${getAcademicYearParts(name)!.startYear}-01-01`
                                        : undefined
                                }
                                max={
                                    getAcademicYearParts(name)
                                        ? `${getAcademicYearParts(name)!.startYear}-12-31`
                                        : undefined
                                }
                                onChange={(event) =>
                                    setStartDate(
                                        event.target.value
                                    )
                                }
                                disabled={loading}
                                className="
                                    mt-2
                                    w-full
                                    rounded-xl
                                    border
                                    border-slate-300
                                    px-4
                                    py-3
                                    text-sm
                                    text-slate-700
                                    outline-none
                                    transition
                                    focus:border-blue-500
                                    focus:ring-2
                                    focus:ring-blue-100
                                "
                            />

                        </div>


                        <div>

                            <label
                                className="
                                    text-sm
                                    font-medium
                                    text-slate-700
                                "
                            >
                                End Date
                            </label>

                            <input
                                type="date"
                                value={endDate}
                                min={
                                    getAcademicYearParts(name)
                                        ? `${getAcademicYearParts(name)!.endYear}-01-01`
                                        : undefined
                                }
                                max={
                                    getAcademicYearParts(name)
                                        ? `${getAcademicYearParts(name)!.endYear}-12-31`
                                        : undefined
                                }
                                onChange={(event) =>
                                    setEndDate(
                                        event.target.value
                                    )
                                }
                                disabled={loading}
                                className="
                                    mt-2
                                    w-full
                                    rounded-xl
                                    border
                                    border-slate-300
                                    px-4
                                    py-3
                                    text-sm
                                    text-slate-700
                                    outline-none
                                    transition
                                    focus:border-blue-500
                                    focus:ring-2
                                    focus:ring-blue-100
                                "
                            />

                        </div>

                    </div>

                </div>


                {/* FOOTER */}

                <div
                    className="
                        flex
                        shrink-0
                        justify-end
                        gap-3
                        border-t
                        border-slate-200
                        bg-slate-50
                        px-6
                        py-4
                    "
                >

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="
                            rounded-xl
                            border
                            border-slate-300
                            px-5
                            py-2.5
                            text-sm
                            font-medium
                            text-slate-700
                            transition
                            hover:bg-white
                            disabled:opacity-50
                        "
                    >
                        Cancel
                    </button>


                    <Button
                        type="button"
                        loading={loading}
                        loadingText="Creating..."
                        onClick={handleSubmit}
                        className="
                            !w-auto
                            px-5
                            text-sm
                        "
                    >
                        Create Academic Year
                    </Button>

                </div>

            </div>

        </div>
    );
}