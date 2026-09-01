import { useEffect, useState } from "react";
import {
    Pencil,
    Trash2,
    UserPlus,
    UserMinus,
    X,
} from "lucide-react";
import toast from "react-hot-toast";

import {
    assignFaculty,
    deleteSubject,
    getFaculties,
    removeFaculty,
    updateSubject,
    type Faculty,
    type Subject,
} from "../services/subjectService";

type Props = {
    subject: Subject;
    onClose: () => void;
    onUpdated: () => void | Promise<void>;
    onDeleted: () => void | Promise<void>;
};

export default function ManageSubjectModal({
                                               subject,
                                               onClose,
                                               onUpdated,
                                               onDeleted,
                                           }: Props) {

    /*
     * ============================================================
     * SUBJECT EDIT STATE
     * ============================================================
     */

    const [name, setName] = useState(
        subject.name
    );

    const [code, setCode] = useState(
        subject.code
    );

    const [description, setDescription] = useState(
        subject.description ?? ""
    );

    const [active, setActive] = useState(
        subject.active
    );


    /*
     * ============================================================
     * FACULTY STATE
     * ============================================================
     *
     * draftFaculties:
     * The Faculty list currently shown inside the modal.
     *
     * facultiesToAdd:
     * Faculty IDs that should be assigned only after
     * Save Changes is clicked.
     *
     * facultiesToRemove:
     * Faculty IDs that should be removed only after
     * Save Changes is clicked.
     */

    const [faculties, setFaculties] =
        useState<Faculty[]>([]);

    const [draftFaculties, setDraftFaculties] =
        useState<Faculty[]>(
            subject.assignedFaculties ?? []
        );

    const [facultiesToAdd, setFacultiesToAdd] =
        useState<number[]>([]);

    const [facultiesToRemove, setFacultiesToRemove] =
        useState<number[]>([]);

    const [selectedFacultyId, setSelectedFacultyId] =
        useState("");


    /*
     * ============================================================
     * LOADING STATE
     * ============================================================
     */

    const [loadingFaculties, setLoadingFaculties] =
        useState(true);

    const [loading, setLoading] =
        useState(false);

    const [deleteLoading, setDeleteLoading] =
        useState(false);

    const [showDeleteConfirmation, setShowDeleteConfirmation] =
        useState(false);


    /*
     * ============================================================
     * LOAD FACULTIES
     * ============================================================
     */

    useEffect(() => {

        const loadFaculties = async () => {

            try {

                setLoadingFaculties(true);

                const data =
                    await getFaculties();

                setFaculties(data);

            } catch (error: any) {

                console.error(error);

                toast.error(
                    error?.response?.data?.message ||
                    "Failed to load Faculty members."
                );

            } finally {

                setLoadingFaculties(false);

            }

        };

        loadFaculties();

    }, []);


    /*
     * ============================================================
     * ASSIGN FACULTY - DRAFT ONLY
     * ============================================================
     */

    const handleAssignFaculty = () => {

        if (!selectedFacultyId) {

            toast.error(
                "Please select a Faculty member."
            );

            return;
        }

        const facultyId =
            Number(selectedFacultyId);

        const selectedFaculty =
            faculties.find(
                (faculty) =>
                    faculty.id === facultyId
            );

        if (!selectedFaculty) {

            toast.error(
                "Selected Faculty could not be found."
            );

            return;
        }


        /*
         * Already displayed in the draft.
         */

        if (
            draftFaculties.some(
                (faculty) =>
                    faculty.id === facultyId
            )
        ) {

            toast.error(
                "This Faculty is already assigned to the subject."
            );

            setSelectedFacultyId("");

            return;
        }


        /*
         * Add Faculty to the temporary
         * draft list.
         */

        setDraftFaculties(
            (current) => [
                ...current,
                selectedFaculty,
            ]
        );


        /*
         * If this Faculty was previously
         * marked for removal, cancel that
         * pending removal.
         */

        setFacultiesToRemove(
            (current) =>
                current.filter(
                    (id) =>
                        id !== facultyId
                )
        );


        /*
         * Only add to facultiesToAdd when
         * the Faculty wasn't originally assigned.
         */

        const originallyAssigned =
            subject.assignedFaculties.some(
                (faculty) =>
                    faculty.id === facultyId
            );

        if (!originallyAssigned) {

            setFacultiesToAdd(
                (current) =>
                    current.includes(facultyId)
                        ? current
                        : [
                            ...current,
                            facultyId,
                        ]
            );

        }

        setSelectedFacultyId("");

    };


    /*
     * ============================================================
     * REMOVE FACULTY - DRAFT ONLY
     * ============================================================
     */

    const handleRemoveFaculty = (
        facultyId: number
    ) => {

        /*
         * Remove from the visible draft.
         */

        setDraftFaculties(
            (current) =>
                current.filter(
                    (faculty) =>
                        faculty.id !== facultyId
                )
        );


        /*
         * If this Faculty was newly added
         * during the current edit session,
         * simply cancel that pending addition.
         */

        setFacultiesToAdd(
            (current) =>
                current.filter(
                    (id) =>
                        id !== facultyId
                )
        );


        /*
         * If this Faculty existed before the
         * modal opened, mark it for removal.
         */

        const originallyAssigned =
            subject.assignedFaculties.some(
                (faculty) =>
                    faculty.id === facultyId
            );

        if (originallyAssigned) {

            setFacultiesToRemove(
                (current) =>
                    current.includes(facultyId)
                        ? current
                        : [
                            ...current,
                            facultyId,
                        ]
            );

        }
        
    };


    /*
     * ============================================================
     * SAVE ALL CHANGES
     * ============================================================
     */

    const handleSaveChanges = async () => {

        if (!name.trim()) {

            toast.error(
                "Subject name is required."
            );

            return;
        }

        if (!code.trim()) {

            toast.error(
                "Subject code is required."
            );

            return;
        }

        try {

            setLoading(true);


            /*
             * STEP 1
             * Update subject information.
             */

            await updateSubject(
                subject.id,
                {
                    name:
                        name.trim(),

                    code:
                        code.trim(),

                    description:
                        description.trim() ||
                        undefined,

                    active,
                }
            );


            /*
             * STEP 2
             * Process pending Faculty additions.
             */

            for (
                const facultyId
                of facultiesToAdd
                ) {

                await assignFaculty(
                    subject.id,
                    facultyId
                );

            }


            /*
             * STEP 3
             * Process pending Faculty removals.
             */

            for (
                const facultyId
                of facultiesToRemove
                ) {

                await removeFaculty(
                    subject.id,
                    facultyId
                );

            }


            /*
             * STEP 4
             * Refresh parent table.
             */

            await onUpdated();


            toast.success(
                "Subject changes saved successfully."
            );


            onClose();

        } catch (error: any) {

            console.error(error);

            toast.error(
                error?.response?.data?.message ||
                error?.response?.data?.errorCode ||
                "Failed to save subject changes."
            );

        } finally {

            setLoading(false);

        }
    };


    /*
     * ============================================================
     * DELETE SUBJECT
     * ============================================================
     */

    const handleDeleteSubject = async () => {

        try {

            setDeleteLoading(true);

            await deleteSubject(
                subject.id
            );

            toast.success(
                "Subject deleted successfully."
            );

            await onDeleted();

            setShowDeleteConfirmation(false);

            onClose();

        } catch (error: any) {

            console.error(error);

            toast.error(
                error?.response?.data?.message ||
                error?.response?.data?.errorCode ||
                "Failed to delete subject."
            );

        } finally {

            setDeleteLoading(false);

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
                            Manage Subject
                        </h2>

                        <p
                            className="
                                mt-1
                                text-sm
                                text-slate-500
                            "
                        >
                            {subject.name}
                            {" • "}
                            {subject.code}
                        </p>

                    </div>


                    <button
                        type="button"
                        onClick={onClose}
                        disabled={
                            loading ||
                            deleteLoading
                        }
                        className="
                            rounded-lg
                            p-2
                            text-slate-500
                            transition
                            hover:bg-slate-100
                            hover:text-slate-800
                            disabled:cursor-not-allowed
                            disabled:opacity-50
                        "
                    >

                        <X size={20} />

                    </button>

                </div>


                {/* ================================================= */}
                {/* SCROLLABLE CONTENT */}
                {/* ================================================= */}

                <div
                    className="
                        min-h-0
                        flex-1
                        overflow-y-auto
                    "
                >

                    <div
                        className="
                            space-y-6
                            p-6
                        "
                    >

                        {/* ================================================= */}
                        {/* SUBJECT INFORMATION */}
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
                                Subject Information
                            </p>


                            <div className="mt-3 space-y-4">

                                {/* SUBJECT NAME */}

                                <div>

                                    <label
                                        className="
                                            text-sm
                                            font-medium
                                            text-slate-700
                                        "
                                    >
                                        Subject Name
                                    </label>

                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(event) =>
                                            setName(
                                                event.target.value
                                            )
                                        }
                                        disabled={
                                            loading ||
                                            deleteLoading
                                        }
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


                                {/* SUBJECT CODE */}

                                <div>

                                    <label
                                        className="
                                            text-sm
                                            font-medium
                                            text-slate-700
                                        "
                                    >
                                        Subject Code
                                    </label>

                                    <input
                                        type="text"
                                        value={code}
                                        onChange={(event) =>
                                            setCode(
                                                event.target.value
                                            )
                                        }
                                        disabled={
                                            loading ||
                                            deleteLoading
                                        }
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


                                {/* DESCRIPTION */}

                                <div>

                                    <label
                                        className="
                                            text-sm
                                            font-medium
                                            text-slate-700
                                        "
                                    >
                                        Description
                                    </label>

                                    <textarea
                                        rows={4}
                                        value={description}
                                        onChange={(event) =>
                                            setDescription(
                                                event.target.value
                                            )
                                        }
                                        disabled={
                                            loading ||
                                            deleteLoading
                                        }
                                        className="
                                            mt-2
                                            w-full
                                            resize-none
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


                                {/* STATUS */}

                                <div>

                                    <label
                                        className="
                                            text-sm
                                            font-medium
                                            text-slate-700
                                        "
                                    >
                                        Status
                                    </label>

                                    <select
                                        value={
                                            active
                                                ? "ACTIVE"
                                                : "INACTIVE"
                                        }
                                        onChange={(event) =>
                                            setActive(
                                                event.target.value ===
                                                "ACTIVE"
                                            )
                                        }
                                        disabled={
                                            loading ||
                                            deleteLoading
                                        }
                                        className="
                                            mt-2
                                            w-full
                                            rounded-xl
                                            border
                                            border-slate-300
                                            bg-white
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
                                    >

                                        <option value="ACTIVE">
                                            Active
                                        </option>

                                        <option value="INACTIVE">
                                            Inactive
                                        </option>

                                    </select>

                                </div>

                            </div>

                        </div>


                        {/* ================================================= */}
                        {/* ASSIGNED FACULTY */}
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
                                Assigned Faculty
                            </p>


                            {draftFaculties.length > 0 ? (

                                <div className="mt-3 space-y-2">

                                    {draftFaculties.map(
                                        (faculty) => (

                                            <div
                                                key={faculty.id}
                                                className="
                                                    flex
                                                    items-center
                                                    justify-between
                                                    gap-3
                                                    rounded-xl
                                                    border
                                                    border-slate-200
                                                    bg-white
                                                    px-4
                                                    py-3
                                                "
                                            >

                                                <div className="min-w-0">

                                                    <p
                                                        className="
                                                            truncate
                                                            text-sm
                                                            font-semibold
                                                            text-slate-700
                                                        "
                                                    >
                                                        {faculty.fullName}
                                                    </p>

                                                    <p
                                                        className="
                                                            truncate
                                                            text-xs
                                                            text-slate-400
                                                        "
                                                    >
                                                        {faculty.email}
                                                    </p>

                                                </div>


                                                <button
                                                    type="button"
                                                    disabled={
                                                        loading ||
                                                        deleteLoading
                                                    }
                                                    onClick={() =>
                                                        handleRemoveFaculty(
                                                            faculty.id
                                                        )
                                                    }
                                                    className="
                                                        shrink-0
                                                        rounded-lg
                                                        p-2
                                                        text-red-500
                                                        transition
                                                        hover:bg-red-50
                                                        disabled:cursor-not-allowed
                                                        disabled:opacity-50
                                                    "
                                                    title="Remove Faculty"
                                                >

                                                    <UserMinus
                                                        size={17}
                                                    />

                                                </button>

                                            </div>

                                        )
                                    )}

                                </div>

                            ) : (

                                <div
                                    className="
                                        mt-3
                                        rounded-xl
                                        border
                                        border-dashed
                                        border-slate-300
                                        px-4
                                        py-4
                                        text-center
                                    "
                                >

                                    <p
                                        className="
                                            text-sm
                                            text-slate-400
                                        "
                                    >
                                        No Faculty assigned
                                    </p>

                                </div>

                            )}

                        </div>


                        {/* ================================================= */}
                        {/* ASSIGN FACULTY */}
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
                                Assign Faculty
                            </p>


                            <div className="mt-3 flex gap-2">

                                <select
                                    value={
                                        selectedFacultyId
                                    }
                                    onChange={(event) =>
                                        setSelectedFacultyId(
                                            event.target.value
                                        )
                                    }
                                    disabled={
                                        loading ||
                                        deleteLoading ||
                                        loadingFaculties
                                    }
                                    className="
                                        min-w-0
                                        flex-1
                                        rounded-xl
                                        border
                                        border-slate-300
                                        bg-white
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
                                >

                                    <option value="">
                                        {loadingFaculties
                                            ? "Loading Faculty..."
                                            : "Select Faculty"
                                        }
                                    </option>


                                    {faculties
                                        .filter(
                                            (faculty) =>
                                                !draftFaculties.some(
                                                    (assigned) =>
                                                        assigned.id ===
                                                        faculty.id
                                                )
                                        )
                                        .map(
                                            (faculty) => (

                                                <option
                                                    key={
                                                        faculty.id
                                                    }
                                                    value={
                                                        faculty.id
                                                    }
                                                >
                                                    {
                                                        faculty.fullName
                                                    }
                                                    {" — "}
                                                    {
                                                        faculty.email
                                                    }
                                                </option>

                                            )
                                        )}

                                </select>


                                <button
                                    type="button"
                                    onClick={
                                        handleAssignFaculty
                                    }
                                    disabled={
                                        loading ||
                                        deleteLoading ||
                                        loadingFaculties ||
                                        !selectedFacultyId
                                    }
                                    className="
                                        inline-flex
                                        shrink-0
                                        items-center
                                        gap-2
                                        rounded-xl
                                        bg-blue-600
                                        px-4
                                        py-3
                                        text-sm
                                        font-semibold
                                        text-white
                                        transition
                                        hover:bg-blue-700
                                        disabled:cursor-not-allowed
                                        disabled:opacity-50
                                    "
                                >

                                    <UserPlus size={17} />

                                    Assign

                                </button>

                            </div>


                            {(facultiesToAdd.length > 0 ||
                                facultiesToRemove.length > 0) && (

                                <p
                                    className="
                                        mt-2
                                        text-xs
                                        text-amber-600
                                    "
                                >
                                    Faculty changes are pending.
                                    Click "Save Changes" to apply them.
                                </p>

                            )}

                        </div>

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
                            setShowDeleteConfirmation(true)
                        }
                        disabled={
                            loading ||
                            deleteLoading
                        }
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
                            disabled:cursor-not-allowed
                            disabled:opacity-50
                        "
                    >

                        <Trash2 size={17} />

                        Delete Subject

                    </button>


                    {/* ACTIONS */}

                    <div className="flex items-center gap-3">

                        <button
                            type="button"
                            onClick={onClose}
                            disabled={
                                loading ||
                                deleteLoading
                            }
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
                                disabled:cursor-not-allowed
                                disabled:opacity-50
                            "
                        >
                            Cancel
                        </button>


                        <button
                            type="button"
                            onClick={
                                handleSaveChanges
                            }
                            disabled={
                                loading ||
                                deleteLoading
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
                            Delete Subject?
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
                            <span className="font-semibold text-slate-700">
                                "{subject.name}"
                            </span>
                            ? This action cannot be undone.
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
                                disabled={deleteLoading}
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
                                    disabled:cursor-not-allowed
                                    disabled:opacity-50
                                "
                            >
                                Cancel
                            </button>


                            <button
                                type="button"
                                onClick={
                                    handleDeleteSubject
                                }
                                disabled={deleteLoading}
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
                                    disabled:cursor-not-allowed
                                    disabled:opacity-50
                                "
                            >

                                <Trash2 size={16} />

                                {deleteLoading
                                    ? "Deleting..."
                                    : "Delete Subject"
                                }

                            </button>

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
}