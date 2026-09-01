import { useEffect, useState } from "react";
import { X } from "lucide-react";
import toast from "react-hot-toast";

import Button from "../../../components/ui/Button";

import {
    assignFaculty,
    createSubject,
    getFaculties,
    type Faculty,
} from "../services/subjectService";

type Props = {
    onClose: () => void;
    onCreated: () => void | Promise<void>;
};

export default function AddSubjectModal({
                                            onClose,
                                            onCreated,
                                        }: Props) {

    const [name, setName] = useState("");

    const [code, setCode] = useState("");

    const [description, setDescription] = useState("");

    const [faculties, setFaculties] =
        useState<Faculty[]>([]);

    const [facultyId, setFacultyId] =
        useState("");

    const [loadingFaculties, setLoadingFaculties] =
        useState(true);

    const [loading, setLoading] =
        useState(false);


    /*
     * LOAD FACULTIES
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
     * CREATE SUBJECT
     */
    const handleSubmit = async () => {

        /*
         * Basic validation
         */

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
             * First create the subject.
             */

            const subject =
                await createSubject({

                    name:
                        name.trim(),

                    code:
                        code.trim(),

                    description:
                        description.trim()
                            ? description.trim()
                            : undefined,

                });


            /*
             * If a Faculty was selected,
             * assign the subject to that Faculty.
             */

            if (facultyId) {

                await assignFaculty(
                    subject.id,
                    Number(facultyId)
                );

            }


            /*
             * Success message.
             */

            toast.success(
                facultyId
                    ? "Subject created and Faculty assigned successfully."
                    : "Subject created successfully."
            );


            /*
             * Notify parent component.
             */

            await onCreated();


            /*
             * Close modal.
             */

            onClose();

        } catch (error: any) {

            console.error(error);

            toast.error(
                error?.response?.data?.message ||
                error?.response?.data?.errorCode ||
                "Failed to create subject."
            );

        } finally {

            setLoading(false);

        }

    };


    return (

        /*
         * OVERLAY
         *
         * The overlay itself can scroll when
         * the viewport is too short.
         */
        <div
            className="
                fixed
                inset-0
                z-50
                overflow-y-auto
                bg-black/40
                p-4
                backdrop-blur-sm
            "
        >

            {/*
             * MODAL
             *
             * max-height keeps it inside the viewport.
             * flex-col allows the middle form section
             * to become independently scrollable.
             */}
            <div
                className="
                    mx-auto
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
                            Add Subject
                        </h2>

                        <p
                            className="
                                mt-1
                                text-sm
                                text-slate-500
                            "
                        >
                            Create a subject and assign it
                            to a Faculty member.
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
                            hover:text-slate-800
                            disabled:cursor-not-allowed
                            disabled:opacity-50
                        "
                    >

                        <X size={20} />

                    </button>

                </div>


                {/* ================================================= */}
                {/* SCROLLABLE FORM AREA */}
                {/* ================================================= */}

                <div
                    className="
                        min-h-0
                        flex-1
                        overflow-y-auto
                    "
                >

                    <div className="space-y-5 p-6">

                        {/* =========================
                            SUBJECT NAME
                        ========================== */}

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
                                placeholder="e.g. Mathematics"
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
                                    disabled:text-slate-400
                                "
                            />

                        </div>


                        {/* =========================
                            SUBJECT CODE
                        ========================== */}

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
                                placeholder="e.g. MAT101"
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
                                    disabled:text-slate-400
                                "
                            />

                        </div>


                        {/* =========================
                            DESCRIPTION
                        ========================== */}

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
                                value={description}
                                onChange={(event) =>
                                    setDescription(
                                        event.target.value
                                    )
                                }
                                placeholder="Enter a short description"
                                rows={4}
                                disabled={loading}
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
                                    disabled:text-slate-400
                                "
                            />

                        </div>


                        {/* =========================
                            ASSIGN FACULTY
                        ========================== */}

                        <div>

                            <label
                                className="
                                    text-sm
                                    font-medium
                                    text-slate-700
                                "
                            >
                                Assign Faculty
                            </label>

                            <select
                                value={facultyId}
                                onChange={(event) =>
                                    setFacultyId(
                                        event.target.value
                                    )
                                }
                                disabled={
                                    loading ||
                                    loadingFaculties
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
                                    disabled:text-slate-400
                                "
                            >

                                <option value="">
                                    {loadingFaculties
                                        ? "Loading Faculty..."
                                        : "No Faculty assigned"
                                    }
                                </option>


                                {faculties.map(
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
                            disabled:cursor-not-allowed
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
                        disabled={
                            loading ||
                            loadingFaculties
                        }
                        className="
                            !w-auto
                            px-5
                            text-sm
                        "
                    >
                        Create Subject
                    </Button>

                </div>

            </div>

        </div>

    );
}