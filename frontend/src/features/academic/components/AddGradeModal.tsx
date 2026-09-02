import { useState } from "react";
import { GraduationCap, X } from "lucide-react";
import toast from "react-hot-toast";

import Button from "../../../components/ui/Button";

import {
    createGrade,
} from "../services/gradeService";

type Props = {
    academicYearId: number;
    academicYearName: string;
    onClose: () => void;
    onCreated: () => void | Promise<void>;
};

export default function AddGradeModal({
                                          academicYearId,
                                          academicYearName,
                                          onClose,
                                          onCreated,
                                      }: Props) {

    const [name, setName] =
        useState("");

    const [description, setDescription] =
        useState("");

    const [loading, setLoading] =
        useState(false);


    const handleSubmit = async () => {

        if (!name.trim()) {

            toast.error(
                "Grade name is required."
            );

            return;
        }


        try {

            setLoading(true);

            await createGrade({
                academicYearId,
                name: name.trim(),
                description:
                    description.trim(),
            });

            await onCreated();

            toast.success(
                "Grade created successfully."
            );

            onClose();

        } catch (error: any) {

            console.error(error);

            toast.error(
                error?.response?.data?.message ||
                error?.response?.data?.errorCode ||
                "Failed to create grade."
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
                            <GraduationCap size={20} />
                        </div>

                        <div>

                            <h2
                                className="
                                    text-xl
                                    font-bold
                                    text-slate-800
                                "
                            >
                                Add Grade
                            </h2>

                            <p
                                className="
                                    mt-1
                                    text-sm
                                    text-slate-500
                                "
                            >
                                Add a grade to {academicYearName}.
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

                        {/* ACADEMIC YEAR */}

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

                            <div
                                className="
                                    mt-2
                                    rounded-xl
                                    border
                                    border-slate-200
                                    bg-slate-50
                                    px-4
                                    py-3
                                    text-sm
                                    font-medium
                                    text-slate-600
                                "
                            >
                                {academicYearName}
                            </div>

                            <p
                                className="
                                    mt-1.5
                                    text-xs
                                    text-slate-400
                                "
                            >
                                This grade will belong to the
                                selected academic year.
                            </p>

                        </div>


                        {/* GRADE NAME */}

                        <div>

                            <label
                                className="
                                    text-sm
                                    font-medium
                                    text-slate-700
                                "
                            >
                                Grade Name
                            </label>

                            <input
                                type="text"
                                value={name}
                                onChange={(event) =>
                                    setName(
                                        event.target.value
                                    )
                                }
                                placeholder="e.g. Grade 10"
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
                        Create Grade
                    </Button>

                </div>

            </div>

        </div>
    );
}