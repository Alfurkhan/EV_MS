import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    CalendarDays,
    Clock3,
    DoorOpen,
    GraduationCap,
    RefreshCw,
    UserRound,
    BookOpen,
    Video,
    MapPin,
} from "lucide-react";

import { useStudentTimetable } from "../hooks/useStudentTimetable";

import type {
    StudentTimetableDay,
    StudentTimetableEntry,
} from "../types/studentTimetable";


/*
 * ============================================================
 * CONSTANTS
 * ============================================================
 */

const DAYS: StudentTimetableDay[] = [
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
    "SUNDAY",
];


/*
 * ============================================================
 * HELPERS
 * ============================================================
 */

function formatDay(
    day: StudentTimetableDay
): string {
    return (
        day.charAt(0) +
        day.slice(1).toLowerCase()
    );
}


function getToday(): StudentTimetableDay {

    const dayIndex = new Date().getDay();

    /*
     * JavaScript:
     *
     * 0 = Sunday
     * 1 = Monday
     * 2 = Tuesday
     * ...
     * 6 = Saturday
     */

    const dayMap: Record<
        number,
        StudentTimetableDay
    > = {
        0: "SUNDAY",
        1: "MONDAY",
        2: "TUESDAY",
        3: "WEDNESDAY",
        4: "THURSDAY",
        5: "FRIDAY",
        6: "SATURDAY",
    };

    return dayMap[dayIndex];
}


function formatTime(
    time: string
): string {

    const [
        hoursString,
        minutesString,
    ] = time.split(":");

    const hours = Number(hoursString);
    const minutes = Number(minutesString);

    const period =
        hours >= 12
            ? "PM"
            : "AM";

    const displayHour =
        hours % 12 || 12;

    return `${displayHour}:${minutes
        .toString()
        .padStart(2, "0")} ${period}`;
}


function formatTimeRange(
    startTime: string,
    endTime: string
): string {

    return `${formatTime(startTime)} – ${formatTime(endTime)}`;
}

function formatDateRange(
    startDate: string,
    endDate: string
): string {

    const start =
        new Date(`${startDate}T00:00:00`);

    const end =
        new Date(`${endDate}T00:00:00`);

    const formatDate = (date: Date) =>
        date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });

    return `${formatDate(start)} – ${formatDate(end)}`;
}


/*
 * ============================================================
 * CLASS CARD
 * ============================================================
 */

function TimetableClassCard({
                                entry,
                            }: {
    entry: StudentTimetableEntry;
}) {

    return (
        <div
            className="
                rounded-xl
                border border-gray-200
                bg-white
                p-4
                shadow-sm
                transition
                hover:-translate-y-0.5
                hover:border-blue-200
                hover:shadow-md
            "
        >

            {/* Time */}

            <div
                className="
                    mb-3
                    rounded-lg
                    bg-blue-50
                    px-3
                    py-2
                "
            >

                <div
                    className="
                        flex
                        items-center
                        gap-2
                        text-sm
                        font-semibold
                        text-blue-700
                    "
                >

                    <Clock3 className="h-4 w-4 shrink-0" />

                    <span className="whitespace-nowrap">
                        {formatTimeRange(
                            entry.startTime,
                            entry.endTime
                        )}
                    </span>

                </div>

            </div>


            {/* Subject */}

            <div className="mb-2 flex items-start gap-2">

                <BookOpen
                    className="
                        mt-0.5
                        h-5
                        w-5
                        shrink-0
                        text-blue-600
                    "
                />

                <div className="min-w-0">

                    <h3
                        className="
                            text-sm
                            font-bold
                            leading-5
                            text-gray-900
                        "
                    >
                        {entry.subjectName}
                    </h3>

                    <p
                        className="
                            mt-0.5
                            text-xs
                            font-medium
                            text-gray-500
                        "
                    >
                        {entry.subjectCode}
                    </p>

                </div>

            </div>


            {/* Faculty */}

            <div
                className="
                    mt-3
                    flex
                    items-center
                    gap-2
                    text-sm
                    text-gray-600
                "
            >

                <UserRound
                    className="
                        h-4
                        w-4
                        shrink-0
                        text-gray-400
                    "
                />

                <span className="truncate">
                    {entry.facultyName}
                </span>

            </div>


            {/* Room */}

            {/* Date Range */}

            <div
                className="
        mt-3
        flex
        items-center
        gap-2
        text-xs
        text-gray-500
    "
            >
                <CalendarDays
                    className="
            h-4
            w-4
            shrink-0
            text-gray-400
        "
                />

                <span>
        {formatDateRange(
            entry.startDate,
            entry.endDate
        )}
    </span>
            </div>


            {/* Class Type */}

            <div className="mt-3 flex items-center gap-2">

                {entry.classType === "ONLINE" ? (
                    <>
                        <Video
                            className="
                    h-4
                    w-4
                    shrink-0
                    text-green-600
                "
                        />

                        <span
                            className="
                    rounded-full
                    bg-green-100
                    px-2
                    py-0.5
                    text-xs
                    font-semibold
                    text-green-700
                "
                        >
                Online
            </span>
                    </>
                ) : (
                    <>
                        <MapPin
                            className="
                    h-4
                    w-4
                    shrink-0
                    text-gray-400
                "
                        />

                        <span
                            className="
                    rounded-full
                    bg-gray-100
                    px-2
                    py-0.5
                    text-xs
                    font-semibold
                    text-gray-700
                "
                        >
                Offline
            </span>
                    </>
                )}

            </div>


            {/* Location / Meeting Link */}

            {entry.classType === "ONLINE" ? (
                entry.meetingLink ? (
                    <a
                        href={entry.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                        className="
                mt-3
                inline-flex
                items-center
                gap-2
                text-sm
                font-semibold
                text-blue-600
                hover:text-blue-700
                hover:underline
            "
                    >
                        <Video className="h-4 w-4" />

                        Join Online Class
                    </a>
                ) : (
                    <p
                        className="
                mt-3
                text-xs
                text-gray-400
            "
                    >
                        Meeting link not available
                    </p>
                )
            ) : (
                entry.room && (
                    <div
                        className="
                mt-3
                flex
                items-center
                gap-2
                text-sm
                text-gray-600
            "
                    >
                        <DoorOpen
                            className="
                    h-4
                    w-4
                    shrink-0
                    text-gray-400
                "
                        />

                        <span className="truncate">
                {entry.room}
            </span>
                    </div>
                )
            )}

        </div>
    );
}


/*
 * ============================================================
 * EMPTY DAY
 * ============================================================
 */

function EmptyDay() {

    return (
        <div
            className="
                flex
                min-h-[120px]
                items-center
                justify-center
                rounded-xl
                border
                border-dashed
                border-gray-200
                bg-gray-50
                px-4
                text-center
            "
        >

            <div>

                <CalendarDays
                    className="
                        mx-auto
                        mb-2
                        h-6
                        w-6
                        text-gray-300
                    "
                />

                <p
                    className="
                        text-sm
                        font-medium
                        text-gray-400
                    "
                >
                    No classes yet
                </p>

            </div>

        </div>
    );
}


/*
 * ============================================================
 * STUDENT TIMETABLE PAGE
 * ============================================================
 */

export default function StudentTimetablePage() {

    const {
        timetable,
        loading,
        error,
        refresh,
    } = useStudentTimetable();


    /*
     * ========================================================
     * TODAY
     * ========================================================
     */

    const today =
        useMemo(
            () => getToday(),
            []
        );


    /*
     * ========================================================
     * SELECTED DAY
     * ========================================================
     */

    const [
        selectedDay,
        setSelectedDay,
    ] = useState<StudentTimetableDay>(
        today
    );


    /*
     * ========================================================
     * AVAILABLE DAYS
     *
     * Used only by the mobile day selector.
     * ========================================================
     */

    const visibleDays =
        useMemo(() => {

            const daysWithClasses =
                new Set(
                    timetable.map(
                        (entry) =>
                            entry.dayOfWeek
                    )
                );

            return DAYS.filter(
                (day) =>
                    daysWithClasses.has(day)
            );

        }, [timetable]);


    /*
     * ========================================================
     * KEEP SELECTED DAY VALID
     *
     * If today's day has classes, mobile will open on today.
     *
     * If today has no classes, it falls back to the first
     * available day.
     * ========================================================
     */

    useEffect(() => {

        if (visibleDays.length === 0) {
            return;
        }

        if (
            visibleDays.includes(today)
        ) {
            setSelectedDay(today);
            return;
        }

        if (
            !visibleDays.includes(selectedDay)
        ) {
            setSelectedDay(
                visibleDays[0]
            );
        }

    }, [
        visibleDays,
        today,
        selectedDay,
    ]);


    /*
     * ========================================================
     * GROUP BY DAY
     * ========================================================
     */

    const timetableByDay =
        useMemo(() => {

            const grouped =
                {} as Record<
                    StudentTimetableDay,
                    StudentTimetableEntry[]
                >;

            for (const day of DAYS) {

                grouped[day] =
                    timetable
                        .filter(
                            (entry) =>
                                entry.dayOfWeek === day
                        )
                        .sort(
                            (a, b) =>
                                a.startTime.localeCompare(
                                    b.startTime
                                )
                        );
            }

            return grouped;

        }, [timetable]);


    /*
     * ========================================================
     * ACADEMIC DETAILS
     * ========================================================
     */

    const academicDetails =
        timetable[0];


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
                        h-32
                        animate-pulse
                        rounded-2xl
                        bg-gray-200
                    "
                />

                <div
                    className="
                        grid
                        grid-cols-1
                        gap-4
                        md:grid-cols-2
                        xl:grid-cols-3
                    "
                >

                    {[1, 2, 3, 4, 5, 6].map(
                        (item) => (
                            <div
                                key={item}
                                className="
                                    h-44
                                    animate-pulse
                                    rounded-xl
                                    bg-gray-200
                                "
                            />
                        )
                    )}

                </div>

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
            <div
                className="
                    flex
                    min-h-[400px]
                    items-center
                    justify-center
                "
            >

                <div
                    className="
                        max-w-md
                        text-center
                    "
                >

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

                        <CalendarDays
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
                        Unable to load timetable
                    </h2>

                    <p
                        className="
                            mt-2
                            text-sm
                            text-gray-500
                        "
                    >
                        {error}
                    </p>

                    <button
                        type="button"
                        onClick={() =>
                            void refresh()
                        }
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
     * ========================================================
     * EMPTY TIMETABLE
     * ========================================================
     */

    if (timetable.length === 0) {

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

                            <div className="flex items-center gap-2">

                                <CalendarDays
                                    className="
                                        h-6
                                        w-6
                                        text-blue-600
                                    "
                                />

                                <h1
                                    className="
                                        text-xl
                                        font-bold
                                        text-gray-900
                                    "
                                >
                                    My Timetable
                                </h1>

                            </div>

                            <p
                                className="
                                    mt-1
                                    text-sm
                                    text-gray-500
                                "
                            >
                                Your class schedule will appear here.
                            </p>

                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                void refresh()
                            }
                            className="
                                inline-flex
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
                    "
                >

                    <div className="text-center">

                        <CalendarDays
                            className="
                                mx-auto
                                mb-4
                                h-12
                                w-12
                                text-gray-400
                            "
                        />

                        <h2
                            className="
                                text-lg
                                font-semibold
                                text-gray-800
                            "
                        >
                            No timetable available
                        </h2>

                        <p
                            className="
                                mt-2
                                max-w-md
                                text-sm
                                text-gray-500
                            "
                        >
                            Your timetable has not been configured
                            for the current academic year yet.
                        </p>

                    </div>

                </div>

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
                                    items-center
                                    justify-center
                                    rounded-xl
                                    bg-blue-100
                                "
                            >

                                <CalendarDays
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
                                    My Timetable
                                </h1>

                                <p
                                    className="
                                        mt-0.5
                                        text-sm
                                        text-gray-500
                                    "
                                >
                                    Your weekly class schedule
                                </p>

                            </div>

                        </div>

                    </div>


                    {/* Academic information */}

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
                MOBILE DAY SELECTOR
            ================================================= */}

            <div className="lg:hidden">

                <div
                    className="
                        mb-3
                        flex
                        gap-2
                        overflow-x-auto
                        pb-1
                    "
                >

                    {visibleDays.map(
                        (day) => {

                            const isToday =
                                day === today;

                            return (
                                <button
                                    key={day}
                                    type="button"
                                    onClick={() =>
                                        setSelectedDay(day)
                                    }
                                    className={[
                                        "shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition",
                                        selectedDay === day
                                            ? "bg-blue-600 text-white shadow-sm"
                                            : isToday
                                                ? "border border-blue-200 bg-blue-50 text-blue-700"
                                                : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
                                    ].join(" ")}
                                >

                                    {formatDay(day)}

                                    {isToday && (
                                        <span
                                            className="
                                                ml-1.5
                                                text-[10px]
                                                font-bold
                                                uppercase
                                            "
                                        >
                                            Today
                                        </span>
                                    )}

                                </button>
                            );
                        }
                    )}

                </div>


                <div className="space-y-4">

                    {timetableByDay[selectedDay]?.length > 0
                        ? timetableByDay[selectedDay].map(
                            (entry) => (
                                <TimetableClassCard
                                    key={entry.id}
                                    entry={entry}
                                />
                            )
                        )
                        : <EmptyDay />
                    }

                </div>

            </div>


            {/* =================================================
                DESKTOP HORIZONTAL WEEKLY TIMETABLE
            ================================================= */}

            <div className="hidden lg:block">

                <div
                    className="
                        overflow-x-auto
                        rounded-2xl
                        border
                        border-gray-200
                        bg-gray-50
                        p-4
                        shadow-sm
                    "
                >

                    <div
                        className="
                            flex
                            min-w-max
                            gap-4
                            pb-2
                        "
                    >

                        {DAYS
                            .filter(
                                (day) =>
                                    day !== "SUNDAY"
                            )
                            .map(
                                (day) => {

                                    const isToday =
                                        day === today;

                                    return (
                                        <div
                                            key={day}
                                            className="
                                            w-[280px]
                                            shrink-0
                                        "
                                        >

                                            {/* Day Header */}

                                            <div
                                                className={[
                                                    "mb-3 rounded-xl border px-4 py-3 transition",
                                                    isToday
                                                        ? "border-blue-300 bg-blue-100 shadow-sm"
                                                        : "border-blue-100 bg-blue-50",
                                                ].join(" ")}
                                            >

                                                <div
                                                    className="
                                                    flex
                                                    items-center
                                                    justify-between
                                                    gap-2
                                                "
                                                >

                                                    <h2
                                                        className="
                                                        text-sm
                                                        font-bold
                                                        uppercase
                                                        tracking-wide
                                                        text-blue-700
                                                    "
                                                    >
                                                        {formatDay(day)}
                                                    </h2>

                                                    {isToday && (
                                                        <span
                                                            className="
                                                            rounded-full
                                                            bg-blue-600
                                                            px-2
                                                            py-0.5
                                                            text-[10px]
                                                            font-bold
                                                            uppercase
                                                            tracking-wide
                                                            text-white
                                                        "
                                                        >
                                                        Today
                                                    </span>
                                                    )}

                                                </div>

                                            </div>


                                            {/* Classes */}

                                            <div className="space-y-3">

                                                {timetableByDay[day]?.length > 0
                                                    ? timetableByDay[day].map(
                                                        (entry) => (
                                                            <TimetableClassCard
                                                                key={entry.id}
                                                                entry={entry}
                                                            />
                                                        )
                                                    )
                                                    : <EmptyDay />
                                                }

                                            </div>

                                        </div>
                                    );
                                }
                            )}

                    </div>

                </div>

            </div>

        </div>
    );
}