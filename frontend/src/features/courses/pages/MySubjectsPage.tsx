import {
    BookOpen,
    GraduationCap,
    Mail,
    RefreshCw,
    UserRound,
} from "lucide-react";

import { useMemo } from "react";

import {
    useMySubjects,
} from "../hooks/useMySubjects";

import {
    useStudentTimetable,
} from "../../timetable/hooks/useStudentTimetable";


/*
 * ============================================================
 * SUBJECT CARD
 * ============================================================
 */

function SubjectCard({
                         subject,
                     }: {
    subject: {
        id: number;
        name: string;
        code: string;
        description: string | null;
        active: boolean;
        faculty: {
            id: number;
            fullName: string;
            email: string;
        } | null;
    };
}) {

    return (
        <div
            className="
                rounded-2xl
                border
                border-gray-200
                bg-white
                p-5
                shadow-sm
                transition
                hover:-translate-y-0.5
                hover:border-blue-200
                hover:shadow-md
            "
        >

            {/* =================================================
                SUBJECT HEADER
            ================================================= */}

            <div
                className="
                    flex
                    items-start
                    justify-between
                    gap-4
                "
            >

                <div className="flex min-w-0 items-start gap-3">

                    <div
                        className="
                            flex
                            h-11
                            w-11
                            shrink-0
                            items-center
                            justify-center
                            rounded-xl
                            bg-blue-100
                        "
                    >

                        <BookOpen
                            className="
                                h-6
                                w-6
                                text-blue-600
                            "
                        />

                    </div>

                    <div className="min-w-0">

                        <h2
                            className="
                                truncate
                                text-base
                                font-bold
                                text-gray-900
                            "
                        >
                            {subject.name}
                        </h2>

                        <p
                            className="
                                mt-0.5
                                text-xs
                                font-semibold
                                tracking-wide
                                text-blue-600
                            "
                        >
                            {subject.code}
                        </p>

                    </div>

                </div>


                {/* Status */}

                <span
                    className={`
                        shrink-0
                        rounded-full
                        px-2.5
                        py-1
                        text-[10px]
                        font-bold
                        uppercase
                        tracking-wide
                        ${
                        subject.active
                            ? "bg-blue-50 text-blue-700"
                            : "bg-gray-100 text-gray-500"
                    }
                    `}
                >
                    {subject.active ? "Active" : "Inactive"}
                </span>

            </div>


            {/* =================================================
                DESCRIPTION
            ================================================= */}

            <div className="mt-5">

                <p
                    className="
                        text-sm
                        leading-6
                        text-gray-600
                    "
                >
                    {subject.description ||
                        "No description available for this subject."}
                </p>

            </div>


            {/* =================================================
                FACULTY
            ================================================= */}

            <div
                className="
                    mt-5
                    border-t
                    border-gray-100
                    pt-4
                "
            >

                <div
                    className="
                        mb-3
                        flex
                        items-center
                        gap-2
                        text-xs
                        font-semibold
                        uppercase
                        tracking-wide
                        text-gray-400
                    "
                >

                    <UserRound className="h-3.5 w-3.5" />

                    Faculty

                </div>


                {subject.faculty ? (

                    <div
                        className="
                            flex
                            items-start
                            gap-3
                        "
                    >

                        <div
                            className="
                                flex
                                h-8
                                w-8
                                shrink-0
                                items-center
                                justify-center
                                rounded-full
                                bg-gray-100
                            "
                        >

                            <UserRound
                                className="
                                    h-4
                                    w-4
                                    text-gray-500
                                "
                            />

                        </div>

                        <div className="min-w-0">

                            <p
                                className="
                                    text-sm
                                    font-semibold
                                    text-gray-800
                                "
                            >
                                {subject.faculty.fullName}
                            </p>

                            <div
                                className="
                                    mt-0.5
                                    flex
                                    items-center
                                    gap-1.5
                                    text-xs
                                    text-gray-500
                                "
                            >

                                <Mail
                                    className="
                                        h-3
                                        w-3
                                        shrink-0
                                    "
                                />

                                <span className="truncate">
                                    {subject.faculty.email}
                                </span>

                            </div>

                        </div>

                    </div>

                ) : (

                    <div
                        className="
                            flex
                            items-center
                            gap-3
                            rounded-lg
                            bg-gray-50
                            px-3
                            py-3
                        "
                    >

                        <div
                            className="
                                flex
                                h-8
                                w-8
                                shrink-0
                                items-center
                                justify-center
                                rounded-full
                                bg-gray-100
                            "
                        >

                            <UserRound
                                className="
                                    h-4
                                    w-4
                                    text-gray-400
                                "
                            />

                        </div>

                        <p
                            className="
                                text-sm
                                font-medium
                                text-gray-500
                            "
                        >
                            No faculty assigned
                        </p>

                    </div>

                )}

            </div>

        </div>
    );
}


/*
 * ============================================================
 * EMPTY STATE
 * ============================================================
 */

function EmptySubjects() {

    return (
        <div
            className="
                flex
                min-h-[350px]
                items-center
                justify-center
                rounded-2xl
                border
                border-dashed
                border-gray-300
                bg-gray-50
                px-6
            "
        >

            <div className="max-w-md text-center">

                <div
                    className="
                        mx-auto
                        mb-4
                        flex
                        h-14
                        w-14
                        items-center
                        justify-center
                        rounded-full
                        bg-blue-50
                    "
                >

                    <BookOpen
                        className="
                            h-7
                            w-7
                            text-blue-500
                        "
                    />

                </div>

                <h2
                    className="
                        text-lg
                        font-semibold
                        text-gray-900
                    "
                >
                    No subjects available
                </h2>

                <p
                    className="
                        mt-2
                        text-sm
                        leading-6
                        text-gray-500
                    "
                >
                    Subjects for your current grade have
                    not been configured yet.
                </p>

            </div>

        </div>
    );
}


/*
 * ============================================================
 * LOADING STATE
 * ============================================================
 */

function SubjectsLoading() {

    return (
        <div
            className="
                grid
                grid-cols-1
                gap-5
                md:grid-cols-2
                xl:grid-cols-3
            "
        >

            {[1, 2, 3].map(
                (item) => (
                    <div
                        key={item}
                        className="
                            h-[300px]
                            animate-pulse
                            rounded-2xl
                            bg-gray-200
                        "
                    />
                )
            )}

        </div>
    );
}


/*
 * ============================================================
 * ERROR STATE
 * ============================================================
 */

function SubjectsError({
                           message,
                           onRetry,
                       }: {
    message: string;
    onRetry: () => void;
}) {

    return (
        <div
            className="
                flex
                min-h-[350px]
                items-center
                justify-center
                rounded-2xl
                border
                border-red-200
                bg-red-50
                px-6
            "
        >

            <div className="max-w-md text-center">

                <div
                    className="
                        mx-auto
                        mb-4
                        flex
                        h-12
                        w-12
                        items-center
                        justify-center
                        rounded-full
                        bg-red-100
                    "
                >

                    <BookOpen
                        className="
                            h-6
                            w-6
                            text-red-600
                        "
                    />

                </div>

                <h2
                    className="
                        text-lg
                        font-semibold
                        text-gray-900
                    "
                >
                    Unable to load subjects
                </h2>

                <p
                    className="
                        mt-2
                        text-sm
                        text-gray-600
                    "
                >
                    {message}
                </p>

                <button
                    type="button"
                    onClick={onRetry}
                    className="
                        mt-5
                        inline-flex
                        items-center
                        gap-2
                        rounded-lg
                        bg-blue-600
                        px-4
                        py-2
                        text-sm
                        font-medium
                        text-white
                        transition
                        hover:bg-blue-700
                    "
                >

                    <RefreshCw className="h-4 w-4" />

                    Try Again

                </button>

            </div>

        </div>
    );
}


/*
 * ============================================================
 * MY SUBJECTS PAGE
 * ============================================================
 */

export default function MySubjectsPage() {

    const {
        subjects,
        loading,
        error,
        refresh,
    } = useMySubjects();


    /*
     * Reuse the student timetable endpoint to obtain:
     *
     * Grade
     * Section
     * Academic Year
     */

    const {
        timetable,
    } = useStudentTimetable();


    const academicDetails =
        timetable[0];


    const subjectCount =
        subjects.length;


    /*
     * Count unique faculties actually teaching
     * the student's subjects.
     */
    const facultyCount =
        useMemo(() => {

            const facultyIds =
                new Set<number>();

            for (const subject of subjects) {

                if (subject.faculty) {
                    facultyIds.add(
                        subject.faculty.id
                    );
                }

            }

            return facultyIds.size;

        }, [subjects]);


    /*
     * ========================================================
     * LOADING
     * ========================================================
     */

    if (loading) {

        return (
            <div className="space-y-6">

                <div
                    className="
                        h-36
                        animate-pulse
                        rounded-2xl
                        bg-gray-200
                    "
                />

                <SubjectsLoading />

            </div>
        );
    }


    /*
     * ========================================================
     * ERROR
     * ========================================================
     */

    if (error) {

        return (
            <div className="space-y-6">

                <div
                    className="
                        rounded-2xl
                        border
                        border-gray-200
                        bg-white
                        p-6
                        shadow-sm
                    "
                >

                    <div className="flex items-center gap-3">

                        <div
                            className="
                                flex
                                h-11
                                w-11
                                items-center
                                justify-center
                                rounded-xl
                                bg-blue-100
                            "
                        >

                            <BookOpen
                                className="
                                    h-6
                                    w-6
                                    text-blue-600
                                "
                            />

                        </div>

                        <div>

                            <h1
                                className="
                                    text-2xl
                                    font-bold
                                    text-gray-900
                                "
                            >
                                My Subjects
                            </h1>

                            <p
                                className="
                                    mt-0.5
                                    text-sm
                                    text-gray-500
                                "
                            >
                                Your subjects for the current
                                academic year
                            </p>

                        </div>

                    </div>

                </div>

                <SubjectsError
                    message={error}
                    onRetry={() => void refresh()}
                />

            </div>
        );
    }


    /*
     * ========================================================
     * MAIN UI
     * ========================================================
     */

    return (
        <div className="space-y-6">

            {/* =================================================
                HEADER
            ================================================= */}

            <div
                className="
                    rounded-2xl
                    border
                    border-gray-200
                    bg-white
                    p-6
                    shadow-sm
                "
            >

                <div
                    className="
                        flex
                        flex-col
                        gap-5
                        lg:flex-row
                        lg:items-center
                        lg:justify-between
                    "
                >

                    {/* Title */}

                    <div>

                        <div className="flex items-center gap-3">

                            <div
                                className="
                                    flex
                                    h-11
                                    w-11
                                    shrink-0
                                    items-center
                                    justify-center
                                    rounded-xl
                                    bg-blue-100
                                "
                            >

                                <BookOpen
                                    className="
                                        h-6
                                        w-6
                                        text-blue-600
                                    "
                                />

                            </div>

                            <div>

                                <h1
                                    className="
                                        text-2xl
                                        font-bold
                                        text-gray-900
                                    "
                                >
                                    My Subjects
                                </h1>

                                <p
                                    className="
                                        mt-0.5
                                        text-sm
                                        text-gray-500
                                    "
                                >
                                    Your subjects for the current
                                    academic year
                                </p>

                            </div>

                        </div>

                    </div>


                    {/* Academic details */}

                    {academicDetails && (
                        <div
                            className="
                                flex
                                flex-wrap
                                gap-3
                            "
                        >

                            <div
                                className="
                                    flex
                                    items-center
                                    gap-2
                                    rounded-lg
                                    border
                                    border-gray-200
                                    bg-gray-50
                                    px-3
                                    py-2
                                    text-sm
                                "
                            >

                                <GraduationCap
                                    className="
                                        h-4
                                        w-4
                                        text-gray-500
                                    "
                                />

                                <span
                                    className="
                                        font-medium
                                        text-gray-700
                                    "
                                >
                                    {academicDetails.gradeName}
                                </span>

                            </div>


                            <div
                                className="
                                    rounded-lg
                                    border
                                    border-gray-200
                                    bg-gray-50
                                    px-3
                                    py-2
                                    text-sm
                                "
                            >

                                <span className="text-gray-500">
                                    Section
                                </span>{" "}

                                <span
                                    className="
                                        font-semibold
                                        text-gray-700
                                    "
                                >
                                    {academicDetails.sectionName}
                                </span>

                            </div>


                            <div
                                className="
                                    rounded-lg
                                    border
                                    border-gray-200
                                    bg-gray-50
                                    px-3
                                    py-2
                                    text-sm
                                "
                            >

                                <span className="text-gray-500">
                                    Year
                                </span>{" "}

                                <span
                                    className="
                                        font-semibold
                                        text-gray-700
                                    "
                                >
                                    {academicDetails.academicYearName}
                                </span>

                            </div>

                        </div>
                    )}


                    {/* Refresh */}

                    <button
                        type="button"
                        onClick={() =>
                            void refresh()
                        }
                        className="
                            inline-flex
                            shrink-0
                            items-center
                            justify-center
                            gap-2
                            rounded-lg
                            border
                            border-gray-300
                            px-4
                            py-2
                            text-sm
                            font-medium
                            text-gray-700
                            transition
                            hover:bg-gray-50
                        "
                    >

                        <RefreshCw className="h-4 w-4" />

                        Refresh

                    </button>

                </div>

            </div>


            {/* =================================================
                SUMMARY
            ================================================= */}

            <div
                className="
                    grid
                    grid-cols-1
                    gap-4
                    sm:grid-cols-2
                "
            >

                <div
                    className="
                        rounded-xl
                        border
                        border-gray-200
                        bg-white
                        p-4
                        shadow-sm
                    "
                >

                    <div className="flex items-center gap-3">

                        <div
                            className="
                                flex
                                h-10
                                w-10
                                items-center
                                justify-center
                                rounded-lg
                                bg-blue-50
                            "
                        >

                            <BookOpen
                                className="
                                    h-5
                                    w-5
                                    text-blue-600
                                "
                            />

                        </div>

                        <div>

                            <p
                                className="
                                    text-xs
                                    font-medium
                                    uppercase
                                    tracking-wide
                                    text-gray-400
                                "
                            >
                                My Subjects
                            </p>

                            <p
                                className="
                                    text-xl
                                    font-bold
                                    text-gray-900
                                "
                            >
                                {subjectCount}
                            </p>

                        </div>

                    </div>

                </div>


                <div
                    className="
                        rounded-xl
                        border
                        border-gray-200
                        bg-white
                        p-4
                        shadow-sm
                    "
                >

                    <div className="flex items-center gap-3">

                        <div
                            className="
                                flex
                                h-10
                                w-10
                                items-center
                                justify-center
                                rounded-lg
                                bg-blue-50
                            "
                        >

                            <UserRound
                                className="
                                    h-5
                                    w-5
                                    text-blue-600
                                "
                            />

                        </div>

                        <div>

                            <p
                                className="
                                    text-xs
                                    font-medium
                                    uppercase
                                    tracking-wide
                                    text-gray-400
                                "
                            >
                                Faculty
                            </p>

                            <p
                                className="
                                    text-xl
                                    font-bold
                                    text-gray-900
                                "
                            >
                                {facultyCount}
                            </p>

                        </div>

                    </div>

                </div>

            </div>


            {/* =================================================
                SUBJECTS
            ================================================= */}

            {subjects.length === 0
                ? (
                    <EmptySubjects />
                )
                : (
                    <div
                        className="
                            grid
                            grid-cols-1
                            gap-5
                            md:grid-cols-2
                            xl:grid-cols-3
                        "
                    >

                        {subjects.map(
                            (subject) => (
                                <SubjectCard
                                    key={subject.id}
                                    subject={subject}
                                />
                            )
                        )}

                    </div>
                )}

        </div>
    );
}