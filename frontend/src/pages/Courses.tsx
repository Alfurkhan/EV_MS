import { useEffect, useState } from "react";
import {
    AlertCircle,
    BookOpen,
    Plus,
    RefreshCw,
} from "lucide-react";

import { useAuth } from "../contexts/AuthContext";

import {
    getAllSubjects,
    getMySubjects,
    type Subject,
} from "../features/courses/services/subjectService";

import AddSubjectModal from "../features/courses/components/AddSubjectModal";
import ManageSubjectModal from "../features/courses/components/ManageSubjectModal";

export default function Courses() {

    const {
        hasRole,
    } = useAuth();

    const isAdmin =
        hasRole("ROLE_ADMIN");

    const isFaculty =
        hasRole("ROLE_FACULTY");


    const [subjects, setSubjects] =
        useState<Subject[]>([]);

    const [selectedSubject, setSelectedSubject] =
        useState<Subject | null>(null);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState<string | null>(null);

    const [showAddModal, setShowAddModal] =
        useState(false);


    const loadSubjects = async () => {

        try {

            setLoading(true);
            setError(null);

            const data =
                isFaculty
                    ? await getMySubjects()
                    : await getAllSubjects();

            setSubjects(data);

        } catch (error: any) {

            console.error(error);

            setError(
                error?.response?.data?.message ||
                "Failed to load subjects."
            );

        } finally {

            setLoading(false);

        }
    };


    useEffect(() => {

        loadSubjects();

    }, [isFaculty]);


    const pageTitle =
        isAdmin
            ? "Subjects"
            : isFaculty
                ? "My Subjects"
                : "Available Subjects";


    const pageDescription =
        isAdmin
            ? "Create and manage subjects for E-Vidyalaya."
            : isFaculty
                ? "View the subjects assigned to you."
                : "View the subjects available in E-Vidyalaya.";


    return (

        <div className="space-y-8">

            {/* HEADER */}

            <div
                className="
                    flex
                    flex-col
                    gap-4
                    sm:flex-row
                    sm:items-center
                    sm:justify-between
                "
            >

                <div>

                    <h1
                        className="
                            text-3xl
                            font-bold
                            text-slate-800
                        "
                    >
                        {pageTitle}
                    </h1>

                    <p
                        className="
                            mt-1
                            text-sm
                            text-slate-500
                        "
                    >
                        {pageDescription}
                    </p>

                </div>


                <div className="flex items-center gap-3">

                    <button
                        type="button"
                        onClick={loadSubjects}
                        disabled={loading}
                        className="
                            inline-flex
                            items-center
                            justify-center
                            gap-2
                            rounded-xl
                            border
                            border-slate-200
                            bg-white
                            px-4
                            py-2.5
                            text-sm
                            font-medium
                            text-slate-700
                            shadow-sm
                            transition
                            hover:border-blue-300
                            hover:bg-blue-50
                            hover:text-blue-700
                            disabled:cursor-not-allowed
                            disabled:opacity-50
                        "
                    >

                        <RefreshCw
                            size={16}
                            className={
                                loading
                                    ? "animate-spin"
                                    : ""
                            }
                        />

                        Refresh

                    </button>


                    {isAdmin && (

                        <button
                            type="button"
                            onClick={() =>
                                setShowAddModal(true)
                            }
                            className="
                                inline-flex
                                items-center
                                justify-center
                                gap-2
                                rounded-xl
                                bg-blue-600
                                px-4
                                py-2.5
                                text-sm
                                font-semibold
                                text-white
                                shadow-sm
                                transition
                                hover:bg-blue-700
                                active:scale-[0.98]
                            "
                        >

                            <Plus size={18} />

                            Add Subject

                        </button>

                    )}

                </div>

            </div>


            {/* ERROR */}

            {error && (

                <div
                    className="
                        flex
                        items-start
                        gap-3
                        rounded-2xl
                        border
                        border-red-200
                        bg-red-50
                        px-5
                        py-4
                        text-red-700
                    "
                >

                    <AlertCircle
                        size={20}
                        className="mt-0.5 shrink-0"
                    />

                    <div>

                        <p className="font-semibold">
                            Unable to load subjects
                        </p>

                        <p className="mt-1 text-sm">
                            {error}
                        </p>

                    </div>

                </div>

            )}


            {/* LOADING */}

            {loading && (

                <div
                    className="
                        grid
                        gap-5
                        md:grid-cols-2
                        lg:grid-cols-3
                    "
                >

                    {[1, 2, 3].map((item) => (

                        <div
                            key={item}
                            className="
                                h-48
                                animate-pulse
                                rounded-2xl
                                bg-slate-200
                            "
                        />

                    ))}

                </div>

            )}


            {/* EMPTY */}

            {!loading &&
                !error &&
                subjects.length === 0 && (

                    <div
                        className="
                            flex
                            min-h-[300px]
                            flex-col
                            items-center
                            justify-center
                            rounded-2xl
                            border
                            border-dashed
                            border-slate-300
                            bg-white
                            px-6
                            text-center
                        "
                    >

                        <div
                            className="
                                flex
                                h-14
                                w-14
                                items-center
                                justify-center
                                rounded-full
                                bg-slate-100
                                text-slate-400
                            "
                        >
                            <BookOpen size={24} />
                        </div>

                        <h2
                            className="
                                mt-4
                                text-lg
                                font-semibold
                                text-slate-800
                            "
                        >
                            No subjects found
                        </h2>

                        <p
                            className="
                                mt-1
                                text-sm
                                text-slate-500
                            "
                        >
                            {isFaculty
                                ? "No subjects have been assigned to you yet."
                                : isAdmin
                                    ? "Create your first subject to get started."
                                    : "No subjects are currently available."
                            }
                        </p>

                    </div>

                )}


            {/* SUBJECTS */}

            {!loading &&
                !error &&
                subjects.length > 0 && (

                    <>
                        {/* =========================
                ADMIN TABLE
            ========================== */}

                        {isAdmin && (

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

                                    <table className="w-full text-left">

                                        <thead
                                            className="
                                    border-b
                                    border-slate-200
                                    bg-slate-50
                                "
                                        >

                                        <tr>

                                            <th
                                                className="
                                            px-6
                                            py-4
                                            text-xs
                                            font-semibold
                                            uppercase
                                            tracking-wide
                                            text-slate-500
                                        "
                                            >
                                                Subject
                                            </th>

                                            <th
                                                className="
                                            px-6
                                            py-4
                                            text-xs
                                            font-semibold
                                            uppercase
                                            tracking-wide
                                            text-slate-500
                                        "
                                            >
                                                Code
                                            </th>

                                            <th
                                                className="
                                            px-6
                                            py-4
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
                                            text-xs
                                            font-semibold
                                            uppercase
                                            tracking-wide
                                            text-slate-500
                                        "
                                            >
                                                Assigned Faculty
                                            </th>

                                            <th
                                                className="
                                            px-6
                                            py-4
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
                                                Actions
                                            </th>

                                        </tr>

                                        </thead>


                                        <tbody className="divide-y divide-slate-100">

                                        {subjects.map((subject) => (

                                            <tr
                                                key={subject.id}
                                                className="
                                            transition
                                            hover:bg-slate-50
                                        "
                                            >

                                                {/* SUBJECT */}

                                                <td className="px-6 py-4">

                                                    <div className="flex items-center gap-3">

                                                        <div
                                                            className="
                                                        flex
                                                        h-10
                                                        w-10
                                                        shrink-0
                                                        items-center
                                                        justify-center
                                                        rounded-xl
                                                        bg-blue-100
                                                        text-blue-600
                                                    "
                                                        >
                                                            <BookOpen size={18} />
                                                        </div>

                                                        <div>

                                                            <p
                                                                className="
                                                            font-semibold
                                                            text-slate-800
                                                        "
                                                            >
                                                                {subject.name}
                                                            </p>

                                                        </div>

                                                    </div>

                                                </td>


                                                {/* CODE */}

                                                <td className="px-6 py-4">

                                            <span
                                                className="
                                                    rounded-lg
                                                    bg-blue-50
                                                    px-3
                                                    py-1.5
                                                    text-sm
                                                    font-medium
                                                    text-blue-700
                                                "
                                            >
                                                {subject.code}
                                            </span>

                                                </td>


                                                {/* DESCRIPTION */}

                                                <td
                                                    className="
                                                max-w-xs
                                                px-6
                                                py-4
                                            "
                                                >

                                                    <p
                                                        className="
                                                    line-clamp-2
                                                    text-sm
                                                    leading-5
                                                    text-slate-500
                                                "
                                                    >
                                                        {subject.description ||
                                                            "No description available."
                                                        }
                                                    </p>

                                                </td>


                                                {/* FACULTY */}

                                                <td className="px-6 py-4">

                                                    {subject.assignedFaculties &&
                                                    subject.assignedFaculties.length > 0 ? (

                                                        <div className="space-y-2">

                                                            {subject.assignedFaculties.map(
                                                                (faculty) => (

                                                                    <div
                                                                        key={faculty.id}
                                                                        className="
                                                                    min-w-[180px]
                                                                "
                                                                    >

                                                                        <p
                                                                            className="
                                                                        text-sm
                                                                        font-semibold
                                                                        text-slate-700
                                                                    "
                                                                        >
                                                                            {faculty.fullName}
                                                                        </p>

                                                                        <p
                                                                            className="
                                                                        max-w-[220px]
                                                                        truncate
                                                                        text-xs
                                                                        text-slate-400
                                                                    "
                                                                        >
                                                                            {faculty.email}
                                                                        </p>

                                                                    </div>

                                                                )
                                                            )}

                                                        </div>

                                                    ) : (

                                                        <span
                                                            className="
                                                        text-sm
                                                        text-slate-400
                                                    "
                                                        >
                                                    Unassigned
                                                </span>

                                                    )}

                                                </td>


                                                {/* STATUS */}

                                                <td className="px-6 py-4">

                                            <span
                                                className={`
                                                    inline-flex
                                                    rounded-full
                                                    px-3
                                                    py-1
                                                    text-xs
                                                    font-semibold
                                                    ${
                                                    subject.active
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-slate-100 text-slate-500"
                                                }
                                                `}
                                            >
                                                {subject.active
                                                    ? "Active"
                                                    : "Inactive"}
                                            </span>

                                                </td>


                                                {/* ACTIONS */}

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
                                                            setSelectedSubject(subject)
                                                        }
                                                        className="
                                                            rounded-lg
                                                            px-3
                                                            py-2
                                                            text-sm
                                                            font-medium
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

                        )}


                        {/* =========================
                FACULTY / STUDENT VIEW
            ========================== */}

                        {!isAdmin && (

                            <div
                                className="
                        grid
                        gap-5
                        md:grid-cols-2
                        lg:grid-cols-3
                    "
                            >

                                {subjects.map((subject) => (

                                    <div
                                        key={subject.id}
                                        className="
                                rounded-2xl
                                border
                                border-slate-200
                                bg-white
                                p-6
                                shadow-sm
                                transition-all
                                duration-200
                                hover:-translate-y-1
                                hover:shadow-lg
                            "
                                    >

                                        <div
                                            className="
                                    flex
                                    items-start
                                    justify-between
                                    gap-4
                                "
                                        >

                                            <div
                                                className="
                                        flex
                                        h-11
                                        w-11
                                        items-center
                                        justify-center
                                        rounded-xl
                                        bg-blue-100
                                        text-blue-600
                                    "
                                            >
                                                <BookOpen size={21} />
                                            </div>

                                            <span
                                                className={`
                                        rounded-full
                                        px-3
                                        py-1
                                        text-xs
                                        font-semibold
                                        ${
                                                    subject.active
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-slate-100 text-slate-500"
                                                }
                                    `}
                                            >
                                    {subject.active
                                        ? "Active"
                                        : "Inactive"}
                                </span>

                                        </div>


                                        <h2
                                            className="
                                    mt-5
                                    text-xl
                                    font-bold
                                    text-slate-800
                                "
                                        >
                                            {subject.name}
                                        </h2>


                                        <p
                                            className="
                                    mt-1
                                    text-sm
                                    font-medium
                                    text-blue-600
                                "
                                        >
                                            {subject.code}
                                        </p>


                                        <p
                                            className="
                                    mt-4
                                    min-h-[72px]
                                    line-clamp-3
                                    text-sm
                                    leading-6
                                    text-slate-500
                                "
                                        >
                                            {subject.description ||
                                                "No description available."
                                            }
                                        </p>

                                    </div>

                                ))}

                            </div>

                        )}

                    </>

                )}


            {/* ADD SUBJECT MODAL */}

            {showAddModal && (

                <AddSubjectModal
                    onClose={() =>
                        setShowAddModal(false)
                    }
                    onCreated={async () => {

                        await loadSubjects();

                    }}
                />

            )}

            {selectedSubject && (

                <ManageSubjectModal
                    subject={selectedSubject}
                    onClose={() =>
                        setSelectedSubject(null)
                    }
                    onUpdated={async () => {

                        const updatedSubjects =
                            await getAllSubjects();

                        setSubjects(updatedSubjects);

                        const updatedSubject =
                            updatedSubjects.find(
                                (item) =>
                                    item.id ===
                                    selectedSubject.id
                            );

                        setSelectedSubject(
                            updatedSubject ?? null
                        );

                    }}
                    onDeleted={async () => {

                        await loadSubjects();

                        setSelectedSubject(null);

                    }}
                />

            )}

        </div>
    );
}