import { useEffect, useMemo, useState } from "react";
import {
    CalendarDays,
    Clock3,
    Loader2,
    Plus,
    X,
} from "lucide-react";

import {
    getAcademicYears,
    type AcademicYear,
} from "../../academic/services/academicYearService";

import {
    getGradesByAcademicYear,
    type Grade,
} from "../../academic/services/gradeService";

import {
    getSectionsByGrade,
    type Section,
} from "../../academic/services/sectionService";

import {
    getSubjectsForGrade,
    type Subject,
} from "../../academic/services/subjectService";

import { getFaculties } from "../../faculty/services/facultyService";
import type { Faculty } from "../../faculty/types/faculty";

import {
    createTimetable,
    type TimetableRequest,
} from "../services/timetableService";

import type { ClassType } from "../types/timetable";

interface AddScheduleModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const DAYS = [
    { value: "MONDAY", label: "Monday" },
    { value: "TUESDAY", label: "Tuesday" },
    { value: "WEDNESDAY", label: "Wednesday" },
    { value: "THURSDAY", label: "Thursday" },
    { value: "FRIDAY", label: "Friday" },
    { value: "SATURDAY", label: "Saturday" },
    { value: "SUNDAY", label: "Sunday" },
];

export default function AddScheduleModal({
                                             open,
                                             onClose,
                                             onSuccess,
                                         }: AddScheduleModalProps) {
    const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
    const [grades, setGrades] = useState<Grade[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [faculties, setFaculties] = useState<Faculty[]>([]);

    const [academicYearId, setAcademicYearId] = useState("");
    const [gradeId, setGradeId] = useState("");
    const [sectionId, setSectionId] = useState("");
    const [subjectId, setSubjectId] = useState("");
    const [facultyId, setFacultyId] = useState("");

    const [dayOfWeek, setDayOfWeek] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");

    const [classType, setClassType] =
        useState<ClassType>("OFFLINE");

    const [room, setRoom] = useState("");
    const [meetingLink, setMeetingLink] = useState("");
    const [notes, setNotes] = useState("");

    const [loadingInitialData, setLoadingInitialData] = useState(false);
    const [loadingGrades, setLoadingGrades] = useState(false);
    const [loadingSections, setLoadingSections] = useState(false);
    const [loadingSubjects, setLoadingSubjects] = useState(false);

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /*
     * Load Academic Years and Faculty when the modal opens.
     */
    useEffect(() => {
        if (!open) {
            return;
        }

        const loadInitialData = async () => {
            try {
                setLoadingInitialData(true);
                setError(null);

                const [years, facultyData] = await Promise.all([
                    getAcademicYears(),
                    getFaculties(),
                ]);

                setAcademicYears(years);
                setFaculties(facultyData);

                /*
                 * Automatically select the active academic year
                 * when one exists.
                 */
                const activeYear = years.find((year) => year.active);

                if (activeYear) {
                    setAcademicYearId(String(activeYear.id));
                }
            } catch (err) {
                console.error(
                    "Failed to load schedule form data:",
                    err
                );

                setError(
                    "Failed to load the schedule form. Please try again."
                );
            } finally {
                setLoadingInitialData(false);
            }
        };

        void loadInitialData();
    }, [open]);

    /*
     * Load Grades whenever Academic Year changes.
     */
    useEffect(() => {
        if (!academicYearId) {
            setGrades([]);
            setGradeId("");
            setSections([]);
            setSectionId("");
            setSubjects([]);
            setSubjectId("");
            setFacultyId("");
            return;
        }

        const loadGrades = async () => {
            try {
                setLoadingGrades(true);
                setError(null);

                const data = await getGradesByAcademicYear(
                    Number(academicYearId)
                );

                setGrades(data);
            } catch (err) {
                console.error(
                    "Failed to load grades:",
                    err
                );

                setGrades([]);
                setError(
                    "Failed to load grades for the selected academic year."
                );
            } finally {
                setLoadingGrades(false);
            }
        };

        void loadGrades();

        setGradeId("");
        setSectionId("");
        setSubjectId("");
        setFacultyId("");
        setSections([]);
        setSubjects([]);
    }, [academicYearId]);

    /*
     * Load Sections whenever Grade changes.
     */
    useEffect(() => {
        if (!gradeId) {
            setSections([]);
            setSectionId("");
            setSubjects([]);
            setSubjectId("");
            setFacultyId("");
            return;
        }

        const loadSections = async () => {
            try {
                setLoadingSections(true);
                setError(null);

                const data = await getSectionsByGrade(
                    Number(gradeId)
                );

                setSections(data);
            } catch (err) {
                console.error(
                    "Failed to load sections:",
                    err
                );

                setSections([]);
                setError(
                    "Failed to load sections for the selected grade."
                );
            } finally {
                setLoadingSections(false);
            }
        };

        void loadSections();

        setSectionId("");
        setSubjectId("");
        setFacultyId("");
        setSubjects([]);
    }, [gradeId]);

    /*
     * Load Subjects assigned to the selected Grade.
     */
    useEffect(() => {
        if (!gradeId) {
            setSubjects([]);
            setSubjectId("");
            setFacultyId("");
            return;
        }

        const loadSubjects = async () => {
            try {
                setLoadingSubjects(true);
                setError(null);

                const data = await getSubjectsForGrade(
                    Number(gradeId)
                );

                setSubjects(data);
            } catch (err) {
                console.error(
                    "Failed to load subjects:",
                    err
                );

                setSubjects([]);
                setError(
                    "Failed to load subjects for the selected grade."
                );
            } finally {
                setLoadingSubjects(false);
            }
        };

        void loadSubjects();

        setSubjectId("");
        setFacultyId("");
    }, [gradeId]);

    /*
     * Faculty list is filtered based on the selected Subject.
     *
     * The Subject API already returns assignedFaculties,
     * so we use that relationship instead of making
     * another Faculty API request.
     */
    const availableFaculties = useMemo(() => {
        if (!subjectId) {
            return [];
        }

        const selectedSubject = subjects.find(
            (subject) => subject.id === Number(subjectId)
        );

        if (!selectedSubject?.assignedFaculties) {
            return [];
        }

        const assignedFacultyIds = new Set(
            selectedSubject.assignedFaculties.map(
                (faculty) => faculty.id
            )
        );

        return faculties.filter((faculty) =>
            assignedFacultyIds.has(faculty.id)
        );
    }, [subjectId, subjects, faculties]);

    /*
     * Extract a useful backend error message.
     */
    const getErrorMessage = (err: unknown): string => {
        if (
            typeof err === "object" &&
            err !== null &&
            "response" in err
        ) {
            const response = (
                err as {
                    response?: {
                        data?: {
                            message?: string;
                        };
                    };
                }
            ).response;

            if (response?.data?.message) {
                return response.data.message;
            }
        }

        if (err instanceof Error) {
            return err.message;
        }

        return "Failed to create schedule. Please try again.";
    };

    const validateForm = (): string | null => {
        if (!academicYearId) {
            return "Please select an academic year.";
        }

        if (!gradeId) {
            return "Please select a grade.";
        }

        if (!sectionId) {
            return "Please select a section.";
        }

        if (!subjectId) {
            return "Please select a subject.";
        }

        if (!facultyId) {
            return "Please select a faculty member.";
        }

        if (!dayOfWeek) {
            return "Please select a day.";
        }

        if (!startDate) {
            return "Please select a start date.";
        }

        if (!endDate) {
            return "Please select an end date.";
        }

        if (endDate < startDate) {
            return "End date must be on or after start date.";
        }

        if (!startTime) {
            return "Please select a start time.";
        }

        if (!endTime) {
            return "Please select an end time.";
        }

        if (startTime >= endTime) {
            return "End time must be later than start time.";
        }

        if (!classType) {
            return "Please select a class type.";
        }

        if (classType === "OFFLINE") {
            if (!room.trim()) {
                return "Room is required for an offline class.";
            }

            if (meetingLink.trim()) {
                return "Meeting link should not be provided for an offline class.";
            }
        }

        if (classType === "ONLINE") {
            if (!meetingLink.trim()) {
                return "Meeting link is required for an online class.";
            }

            if (room.trim()) {
                return "Room should not be provided for an online class.";
            }

            try {
                const url = new URL(meetingLink.trim());

                if (!["http:", "https:"].includes(url.protocol)) {
                    return "Meeting link must start with http:// or https://.";
                }
            } catch {
                return "Please enter a valid meeting link.";
            }
        }

        if (room.trim().length > 100) {
            return "Room cannot exceed 100 characters.";
        }

        if (meetingLink.trim().length > 500) {
            return "Meeting link cannot exceed 500 characters.";
        }

        if (notes.trim().length > 500) {
            return "Notes cannot exceed 500 characters.";
        }

        return null;
    };

    const resetForm = () => {
        setAcademicYearId("");
        setGradeId("");
        setSectionId("");
        setSubjectId("");
        setFacultyId("");

        setDayOfWeek("");
        setStartDate("");
        setEndDate("");
        setStartTime("");
        setEndTime("");

        setClassType("OFFLINE");

        setRoom("");
        setMeetingLink("");
        setNotes("");

        setGrades([]);
        setSections([]);
        setSubjects([]);

        setError(null);
    };

    const handleClose = () => {
        if (saving) {
            return;
        }

        resetForm();
        onClose();
    };

    const handleCreate = async () => {
        const validationError = validateForm();

        if (validationError) {
            setError(validationError);
            return;
        }

        try {
            setSaving(true);
            setError(null);

            const data: TimetableRequest = {
                academicYearId: Number(academicYearId),
                gradeId: Number(gradeId),
                sectionId: Number(sectionId),
                subjectId: Number(subjectId),
                facultyId: Number(facultyId),
                dayOfWeek,
                startDate,
                endDate,
                startTime,
                endTime,
                classType,
                room:
                    classType === "OFFLINE"
                        ? room.trim()
                        : undefined,
                meetingLink:
                    classType === "ONLINE"
                        ? meetingLink.trim()
                        : undefined,
                notes: notes.trim() || undefined,
                active: true,
            };

            await createTimetable(data);

            resetForm();
            onSuccess();
        } catch (err) {
            console.error(
                "Failed to create timetable:",
                err
            );

            setError(getErrorMessage(err));
        } finally {
            setSaving(false);
        }
    };

    if (!open) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4 py-6">
            <div
                className="absolute inset-0"
                onClick={handleClose}
            />

            <div className="relative z-10 flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50">
                                <CalendarDays
                                    size={20}
                                    className="text-indigo-600"
                                />
                            </div>

                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Add Schedule
                                </h2>

                                <p className="text-sm text-gray-500">
                                    Create a new timetable entry
                                </p>
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={saving}
                        className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5">
                    {loadingInitialData ? (
                        <div className="flex min-h-[300px] items-center justify-center">
                            <div className="flex flex-col items-center gap-3">
                                <Loader2
                                    size={28}
                                    className="animate-spin text-indigo-600"
                                />

                                <p className="text-sm text-gray-500">
                                    Loading schedule form...
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Error */}
                            {error && (
                                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                    {error}
                                </div>
                            )}

                            {/* Academic Structure */}
                            <section>
                                <div className="mb-3">
                                    <h3 className="text-sm font-semibold text-gray-900">
                                        Academic Structure
                                    </h3>

                                    <p className="text-xs text-gray-500">
                                        Choose where this class belongs.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    {/* Academic Year */}
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                            Academic Year
                                            <span className="text-red-500">
                                                {" "}
                                                *
                                            </span>
                                        </label>

                                        <select
                                            value={academicYearId}
                                            onChange={(e) =>
                                                setAcademicYearId(
                                                    e.target.value
                                                )
                                            }
                                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                        >
                                            <option value="">
                                                Select academic year
                                            </option>

                                            {academicYears.map(
                                                (year) => (
                                                    <option
                                                        key={year.id}
                                                        value={year.id}
                                                    >
                                                        {year.name}
                                                        {year.active
                                                            ? " (Active)"
                                                            : ""}
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    </div>

                                    {/* Grade */}
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                            Grade
                                            <span className="text-red-500">
                                                {" "}
                                                *
                                            </span>
                                        </label>

                                        <select
                                            value={gradeId}
                                            onChange={(e) =>
                                                setGradeId(
                                                    e.target.value
                                                )
                                            }
                                            disabled={
                                                !academicYearId ||
                                                loadingGrades
                                            }
                                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
                                        >
                                            <option value="">
                                                {loadingGrades
                                                    ? "Loading grades..."
                                                    : "Select grade"}
                                            </option>

                                            {grades.map(
                                                (grade) => (
                                                    <option
                                                        key={grade.id}
                                                        value={grade.id}
                                                    >
                                                        {grade.name}
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    </div>

                                    {/* Section */}
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                            Section
                                            <span className="text-red-500">
                                                {" "}
                                                *
                                            </span>
                                        </label>

                                        <select
                                            value={sectionId}
                                            onChange={(e) =>
                                                setSectionId(
                                                    e.target.value
                                                )
                                            }
                                            disabled={
                                                !gradeId ||
                                                loadingSections
                                            }
                                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
                                        >
                                            <option value="">
                                                {loadingSections
                                                    ? "Loading sections..."
                                                    : "Select section"}
                                            </option>

                                            {sections.map(
                                                (section) => (
                                                    <option
                                                        key={section.id}
                                                        value={section.id}
                                                    >
                                                        {section.name}
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    </div>

                                    {/* Subject */}
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                            Subject
                                            <span className="text-red-500">
                                                {" "}
                                                *
                                            </span>
                                        </label>

                                        <select
                                            value={subjectId}
                                            onChange={(e) =>
                                                setSubjectId(
                                                    e.target.value
                                                )
                                            }
                                            disabled={
                                                !gradeId ||
                                                loadingSubjects
                                            }
                                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
                                        >
                                            <option value="">
                                                {loadingSubjects
                                                    ? "Loading subjects..."
                                                    : "Select subject"}
                                            </option>

                                            {subjects.map(
                                                (subject) => (
                                                    <option
                                                        key={subject.id}
                                                        value={subject.id}
                                                    >
                                                        {subject.name} (
                                                        {
                                                            subject.code
                                                        }
                                                        )
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    </div>

                                    {/* Faculty */}
                                    <div className="md:col-span-2">
                                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                            Faculty
                                            <span className="text-red-500">
                                                {" "}
                                                *
                                            </span>
                                        </label>

                                        <select
                                            value={facultyId}
                                            onChange={(e) =>
                                                setFacultyId(
                                                    e.target.value
                                                )
                                            }
                                            disabled={
                                                !subjectId ||
                                                availableFaculties.length ===
                                                0
                                            }
                                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
                                        >
                                            <option value="">
                                                {!subjectId
                                                    ? "Select a subject first"
                                                    : availableFaculties.length ===
                                                    0
                                                        ? "No faculty assigned to this subject"
                                                        : "Select faculty"}
                                            </option>

                                            {availableFaculties.map(
                                                (faculty) => (
                                                    <option
                                                        key={faculty.id}
                                                        value={faculty.id}
                                                    >
                                                        {
                                                            faculty.fullName
                                                        }{" "}
                                                        —{" "}
                                                        {
                                                            faculty.email
                                                        }
                                                    </option>
                                                )
                                            )}
                                        </select>

                                        {subjectId &&
                                            availableFaculties.length ===
                                            0 && (
                                                <p className="mt-1.5 text-xs text-amber-600">
                                                    No faculty members are
                                                    assigned to this subject.
                                                    Assign a faculty member
                                                    to the subject first.
                                                </p>
                                            )}
                                    </div>
                                </div>
                            </section>

                            {/* Schedule */}
                            <section>
                                <div className="mb-3">
                                    <h3 className="text-sm font-semibold text-gray-900">
                                        Schedule
                                    </h3>

                                    <p className="text-xs text-gray-500">
                                        Set the recurring date range, weekly
                                        day, and class timing.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    {/* Start Date */}
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                            Start Date
                                            <span className="text-red-500">
                                                {" "}
                                                *
                                            </span>
                                        </label>

                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) =>
                                                setStartDate(
                                                    e.target.value
                                                )
                                            }
                                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                        />
                                    </div>

                                    {/* End Date */}
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                            End Date
                                            <span className="text-red-500">
                                                {" "}
                                                *
                                            </span>
                                        </label>

                                        <input
                                            type="date"
                                            value={endDate}
                                            min={startDate || undefined}
                                            onChange={(e) =>
                                                setEndDate(
                                                    e.target.value
                                                )
                                            }
                                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                        />
                                    </div>

                                    {/* Day */}
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                            Day
                                            <span className="text-red-500">
                                                {" "}
                                                *
                                            </span>
                                        </label>

                                        <select
                                            value={dayOfWeek}
                                            onChange={(e) =>
                                                setDayOfWeek(
                                                    e.target.value
                                                )
                                            }
                                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                        >
                                            <option value="">
                                                Select day
                                            </option>

                                            {DAYS.map(
                                                (day) => (
                                                    <option
                                                        key={day.value}
                                                        value={day.value}
                                                    >
                                                        {day.label}
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    </div>

                                    {/* Class Type */}
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                            Class Type
                                            <span className="text-red-500">
                                                {" "}
                                                *
                                            </span>
                                        </label>

                                        <select
                                            value={classType}
                                            onChange={(e) => {
                                                const value =
                                                    e.target
                                                        .value as ClassType;

                                                setClassType(value);

                                                /*
                                                 * Clear the field that is
                                                 * not valid for the selected
                                                 * class type.
                                                 */
                                                if (value === "ONLINE") {
                                                    setRoom("");
                                                } else {
                                                    setMeetingLink("");
                                                }
                                            }}
                                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                        >
                                            <option value="OFFLINE">
                                                Offline
                                            </option>
                                            <option value="ONLINE">
                                                Online
                                            </option>
                                        </select>
                                    </div>

                                    {/* Start Time */}
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                            Start Time
                                            <span className="text-red-500">
                                                {" "}
                                                *
                                            </span>
                                        </label>

                                        <div className="relative">
                                            <Clock3
                                                size={16}
                                                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                            />

                                            <input
                                                type="time"
                                                value={startTime}
                                                onChange={(e) =>
                                                    setStartTime(
                                                        e.target.value
                                                    )
                                                }
                                                className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                            />
                                        </div>
                                    </div>

                                    {/* End Time */}
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                            End Time
                                            <span className="text-red-500">
                                                {" "}
                                                *
                                            </span>
                                        </label>

                                        <div className="relative">
                                            <Clock3
                                                size={16}
                                                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                            />

                                            <input
                                                type="time"
                                                value={endTime}
                                                onChange={(e) =>
                                                    setEndTime(
                                                        e.target.value
                                                    )
                                                }
                                                className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Additional Information */}
                            <section>
                                <div className="mb-3">
                                    <h3 className="text-sm font-semibold text-gray-900">
                                        Additional Information
                                    </h3>

                                    <p className="text-xs text-gray-500">
                                        Provide the location or meeting link
                                        based on the class type.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    {/* Room - Offline */}
                                    {classType === "OFFLINE" && (
                                        <div>
                                            <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                                Room
                                                <span className="text-red-500">
                                                    {" "}
                                                    *
                                                </span>
                                            </label>

                                            <input
                                                type="text"
                                                value={room}
                                                onChange={(e) =>
                                                    setRoom(
                                                        e.target.value
                                                    )
                                                }
                                                maxLength={100}
                                                placeholder="e.g. Room 102"
                                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                            />

                                            <div className="mt-1 text-right text-xs text-gray-400">
                                                {room.length}/100
                                            </div>
                                        </div>
                                    )}

                                    {/* Meeting Link - Online */}
                                    {classType === "ONLINE" && (
                                        <div>
                                            <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                                Meeting Link
                                                <span className="text-red-500">
                                                    {" "}
                                                    *
                                                </span>
                                            </label>

                                            <input
                                                type="url"
                                                value={meetingLink}
                                                onChange={(e) =>
                                                    setMeetingLink(
                                                        e.target.value
                                                    )
                                                }
                                                maxLength={500}
                                                placeholder="e.g. https://meet.google.com/..."
                                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                            />

                                            <div className="mt-1 text-right text-xs text-gray-400">
                                                {meetingLink.length}/500
                                            </div>
                                        </div>
                                    )}

                                    {/* Notes */}
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                                            Notes
                                        </label>

                                        <textarea
                                            value={notes}
                                            onChange={(e) =>
                                                setNotes(
                                                    e.target.value
                                                )
                                            }
                                            maxLength={500}
                                            rows={3}
                                            placeholder="Optional notes about this schedule..."
                                            className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                        />

                                        <div className="mt-1 text-right text-xs text-gray-400">
                                            {notes.length}/500
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={saving}
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={handleCreate}
                        disabled={
                            saving ||
                            loadingInitialData ||
                            loadingGrades ||
                            loadingSections ||
                            loadingSubjects
                        }
                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {saving ? (
                            <>
                                <Loader2
                                    size={16}
                                    className="animate-spin"
                                />
                                Creating...
                            </>
                        ) : (
                            <>
                                <Plus size={16} />
                                Create Schedule
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}