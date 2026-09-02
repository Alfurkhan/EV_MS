import { useState } from "react";
import {
    CheckCircle2,
    Pencil,
    Power,
    Trash2,
    X,
} from "lucide-react";
import toast from "react-hot-toast";

import {
    activateAcademicYear,
    deactivateAcademicYear,
    deleteAcademicYear,
    updateAcademicYear,
    type AcademicYear,
} from "../services/academicYearService";

type Props = {
    academicYear: AcademicYear;
    onClose: () => void;
    onUpdated: () => void | Promise<void>;
    onDeleted: () => void | Promise<void>;
};


function toInputDate(
    value: string
): string {

    return value.substring(0, 10);
}


export default function ManageAcademicYearModal({
                                                    academicYear,
                                                    onClose,
                                                    onUpdated,
                                                    onDeleted,
                                                }: Props) {

    /*
     * ============================================================
     * DRAFT STATE
     * ============================================================
     */

    const [name, setName] =
        useState(academicYear.name);

    const [startDate, setStartDate] =
        useState(
            toInputDate(
                academicYear.startDate
            )
        );

    const [endDate, setEndDate] =
        useState(
            toInputDate(
                academicYear.endDate
            )
        );

    /*
     * IMPORTANT:
     *
     * This is only the temporary status inside
     * the modal. The backend is NOT updated when
     * the Admin clicks Activate/Deactivate.
     */
    const [draftActive, setDraftActive] =
        useState(academicYear.active);


    const [loading, setLoading] =
        useState(false);

    const [showDeleteConfirmation, setShowDeleteConfirmation] =
        useState(false);


    /*
     * ============================================================
     * DETECT PENDING CHANGES
     * ============================================================
     */

    const hasStatusChange =
        draftActive !== academicYear.active;

    const hasNameChange =
        name.trim() !== academicYear.name;

    const hasStartDateChange =
        startDate !==
        toInputDate(
            academicYear.startDate
        );

    const hasEndDateChange =
        endDate !==
        toInputDate(
            academicYear.endDate
        );

    const hasPendingChanges =
        hasStatusChange ||
        hasNameChange ||
        hasStartDateChange ||
        hasEndDateChange;

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

    /*
     * ============================================================
     * SAVE CHANGES
     * ============================================================
     */

    const handleSave = async () => {

        if (!name.trim()) {

            toast.error(
                "Academic year name is required."
            );

            return;
        }

        if (!startDate || !endDate) {

            toast.error(
                "Start date and end date are required."
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


            /*
             * STEP 1
             *
             * Save name and date changes only
             * when something actually changed.
             */

            if (
                hasNameChange ||
                hasStartDateChange ||
                hasEndDateChange
            ) {

                await updateAcademicYear(
                    academicYear.id,
                    {
                        name:
                            name.trim(),

                        startDate,

                        endDate,
                    }
                );

            }


            /*
             * STEP 2
             *
             * Apply status change only when
             * the draft status differs from
             * the original status.
             */

            if (hasStatusChange) {

                if (draftActive) {

                    await activateAcademicYear(
                        academicYear.id
                    );

                } else {

                    await deactivateAcademicYear(
                        academicYear.id
                    );

                }

            }


            /*
             * STEP 3
             *
             * Refresh the Academic Year table.
             */

            await onUpdated();


            /*
             * STEP 4
             *
             * Success message only after
             * everything has been saved.
             */

            toast.success(
                "Academic year changes saved successfully."
            );


            onClose();

        } catch (error: any) {

            console.error(error);

            toast.error(
                error?.response?.data?.message ||
                error?.response?.data?.errorCode ||
                "Failed to save academic year changes."
            );

        } finally {

            setLoading(false);

        }
    };


    /*
     * ============================================================
     * TOGGLE DRAFT STATUS
     * ============================================================
     */

    const handleToggleActive = () => {

        setDraftActive(
            (current) => !current
        );
    };


    /*
     * ============================================================
     * DELETE
     * ============================================================
     */

    const handleDelete = async () => {

        try {

            setLoading(true);

            await deleteAcademicYear(
                academicYear.id
            );

            toast.success(
                "Academic year deleted successfully."
            );

            await onDeleted();

            setShowDeleteConfirmation(false);

            onClose();

        } catch (error: any) {

            console.error(error);

            toast.error(
                error?.response?.data?.message ||
                error?.response?.data?.errorCode ||
                "Failed to delete academic year."
            );

        } finally {

            setLoading(false);

        }
    };


    /*
     * ============================================================
     * RENDER
     * ============================================================
     */

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

                {/* ================================================= */}
                {/* HEADER */}
                {/* ================================================= */}

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

                    <div>

                        <h2
                            className="
                                text-xl
                                font-bold
                                text-slate-800
                            "
                        >
                            Manage Academic Year
                        </h2>

                        <p
                            className="
                                mt-1
                                text-sm
                                text-slate-500
                            "
                        >
                            {academicYear.name}
                        </p>

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


                {/* ================================================= */}
                {/* CONTENT */}
                {/* ================================================= */}

                <div
                    className="
                        min-h-0
                        flex-1
                        overflow-y-auto
                    "
                >

                    <div className="space-y-6 p-6">

                        {/* ================================================= */}
                        {/* STATUS */}
                        {/* ================================================= */}

                        <div
                            className="
                                rounded-xl
                                border
                                border-slate-200
                                bg-slate-50
                                px-4
                                py-4
                            "
                        >

                            <div
                                className="
                                    flex
                                    items-center
                                    justify-between
                                    gap-4
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
                                        className={`
                                            flex
                                            h-10
                                            w-10
                                            shrink-0
                                            items-center
                                            justify-center
                                            rounded-xl
                                            ${
                                            draftActive
                                                ? "bg-green-100 text-green-600"
                                                : "bg-slate-200 text-slate-500"
                                        }
                                        `}
                                    >

                                        <CheckCircle2
                                            size={20}
                                        />

                                    </div>

                                    <div>

                                        <p
                                            className="
                                                text-sm
                                                font-semibold
                                                text-slate-700
                                            "
                                        >
                                            Academic Year Status
                                        </p>

                                        <p
                                            className="
                                                mt-0.5
                                                text-xs
                                                text-slate-400
                                            "
                                        >
                                            {draftActive
                                                ? "Currently active"
                                                : "Currently inactive"
                                            }
                                        </p>

                                    </div>

                                </div>


                                <button
                                    type="button"
                                    onClick={
                                        handleToggleActive
                                    }
                                    disabled={loading}
                                    className="
                                        inline-flex
                                        shrink-0
                                        items-center
                                        gap-2
                                        rounded-xl
                                        border
                                        border-slate-300
                                        bg-white
                                        px-4
                                        py-2.5
                                        text-sm
                                        font-medium
                                        text-slate-700
                                        transition
                                        hover:bg-slate-100
                                        disabled:opacity-50
                                    "
                                >

                                    <Power size={16} />

                                    {draftActive
                                        ? "Deactivate"
                                        : "Activate"
                                    }

                                </button>

                            </div>


                            {hasStatusChange && (

                                <div
                                    className="
                                        mt-3
                                        rounded-lg
                                        border
                                        border-amber-200
                                        bg-amber-50
                                        px-3
                                        py-2
                                    "
                                >

                                    <p
                                        className="
                                            text-xs
                                            font-medium
                                            text-amber-700
                                        "
                                    >
                                        Status change is pending.
                                        Click "Save Changes"
                                        to apply it.
                                    </p>

                                </div>

                            )}

                        </div>


                        {/* ================================================= */}
                        {/* EDIT DETAILS */}
                        {/* ================================================= */}

                        <div>

                            <p
                                className="
                                    text-xs
                                    font-semibold
                                    uppercase
                                    tracking-wide
                                    text-slate-400
                                "
                            >
                                Academic Year Details
                            </p>


                            <div
                                className="
                                    mt-3
                                    space-y-4
                                "
                            >

                                {/* NAME */}

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
                                            disabled:bg-slate-50
                                        "
                                    />

                                </div>


                                {/* START DATE */}

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
                                            disabled:bg-slate-50
                                        "
                                    />

                                </div>


                                {/* END DATE */}

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
                                            disabled:bg-slate-50
                                        "
                                    />

                                </div>

                            </div>

                        </div>


                        {/* ================================================= */}
                        {/* PENDING CHANGES */}
                        {/* ================================================= */}

                        {hasPendingChanges && (

                            <div
                                className="
                                    rounded-xl
                                    border
                                    border-amber-200
                                    bg-amber-50
                                    px-4
                                    py-3
                                "
                            >

                                <p
                                    className="
                                        text-sm
                                        font-semibold
                                        text-amber-700
                                    "
                                >
                                    Unsaved changes
                                </p>

                                <p
                                    className="
                                        mt-1
                                        text-xs
                                        leading-5
                                        text-amber-600
                                    "
                                >
                                    Your changes are temporary
                                    until you click "Save Changes".
                                </p>

                            </div>

                        )}

                    </div>

                </div>


                {/* ================================================= */}
                {/* FOOTER */}
                {/* ================================================= */}

                <div
                    className="
                        flex
                        shrink-0
                        items-center
                        justify-between
                        gap-3
                        border-t
                        border-slate-200
                        bg-slate-50
                        px-6
                        py-4
                    "
                >

                    {/* DELETE */}

                    <button
                        type="button"
                        onClick={() =>
                            setShowDeleteConfirmation(
                                true
                            )
                        }
                        disabled={loading}
                        className="
                            inline-flex
                            items-center
                            gap-2
                            rounded-xl
                            px-4
                            py-2.5
                            text-sm
                            font-medium
                            text-red-600
                            transition
                            hover:bg-red-50
                            disabled:opacity-50
                        "
                    >

                        <Trash2 size={17} />

                        Delete

                    </button>


                    {/* ACTIONS */}

                    <div
                        className="
                            flex
                            items-center
                            gap-3
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


                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={
                                loading ||
                                !hasPendingChanges
                            }
                            className="
                                inline-flex
                                items-center
                                justify-center
                                gap-2
                                rounded-xl
                                bg-blue-600
                                px-5
                                py-2.5
                                text-sm
                                font-semibold
                                text-white
                                transition
                                hover:bg-blue-700
                                active:scale-[0.98]
                                disabled:cursor-not-allowed
                                disabled:opacity-50
                            "
                        >

                            <Pencil size={16} />

                            {loading
                                ? "Saving..."
                                : "Save Changes"
                            }

                        </button>

                    </div>

                </div>

            </div>


            {/* ===================================================== */}
            {/* DELETE CONFIRMATION */}
            {/* ===================================================== */}

            {showDeleteConfirmation && (

                <div
                    className="
                        fixed
                        inset-0
                        z-[60]
                        flex
                        items-center
                        justify-center
                        bg-black/50
                        p-4
                        backdrop-blur-sm
                    "
                >

                    <div
                        className="
                            w-full
                            max-w-sm
                            rounded-2xl
                            bg-white
                            p-6
                            shadow-2xl
                        "
                    >

                        <div
                            className="
                                flex
                                h-12
                                w-12
                                items-center
                                justify-center
                                rounded-full
                                bg-red-100
                                text-red-600
                            "
                        >

                            <Trash2 size={22} />

                        </div>


                        <h3
                            className="
                                mt-4
                                text-lg
                                font-bold
                                text-slate-800
                            "
                        >
                            Delete Academic Year?
                        </h3>


                        <p
                            className="
                                mt-2
                                text-sm
                                leading-6
                                text-slate-500
                            "
                        >
                            Are you sure you want to delete{" "}
                            <span
                                className="
                                    font-semibold
                                    text-slate-700
                                "
                            >
                                "{academicYear.name}"
                            </span>
                            ?
                        </p>


                        <div
                            className="
                                mt-6
                                flex
                                justify-end
                                gap-3
                            "
                        >

                            <button
                                type="button"
                                onClick={() =>
                                    setShowDeleteConfirmation(
                                        false
                                    )
                                }
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
                                    hover:bg-slate-50
                                    disabled:opacity-50
                                "
                            >
                                Cancel
                            </button>


                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={loading}
                                className="
                                    inline-flex
                                    items-center
                                    gap-2
                                    rounded-xl
                                    bg-red-600
                                    px-5
                                    py-2.5
                                    text-sm
                                    font-semibold
                                    text-white
                                    transition
                                    hover:bg-red-700
                                    disabled:opacity-50
                                "
                            >

                                <Trash2 size={16} />

                                {loading
                                    ? "Deleting..."
                                    : "Delete"
                                }

                            </button>

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
}