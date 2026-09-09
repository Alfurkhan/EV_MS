import { useEffect, useState } from "react";
import { Plus, UserRound, X } from "lucide-react";
import toast from "react-hot-toast";

import {
    getAcademicYears,
    type AcademicYear,
} from "../services/academicYearService";

import {
    getGradesByAcademicYear,
    type Grade,
} from "../services/gradeService";

import {
    getSectionsByGrade,
    type Section,
} from "../services/sectionService";

import {
    createEnrollment,
} from "../services/studentEnrollmentService";

import {
    getStudents,
    type StudentUser,
} from "../../students/services/studentService";


interface AddStudentEnrollmentModalProps {
    onClose: () => void;
    onAdded: () => void | Promise<void>;
}


export default function AddStudentEnrollmentModal({
    onClose,
    onAdded,
}: AddStudentEnrollmentModalProps) {

    /* --------------------------------------------------
       DATA
    -------------------------------------------------- */

    const [students, setStudents] =
        useState<StudentUser[]>([]);

    const [academicYears, setAcademicYears] =
        useState<AcademicYear[]>([]);

    const [grades, setGrades] =
        useState<Grade[]>([]);

    const [sections, setSections] =
        useState<Section[]>([]);


    /* --------------------------------------------------
       SELECTIONS
    -------------------------------------------------- */

    const [studentId, setStudentId] =
        useState<number | "">("");

    const [academicYearId, setAcademicYearId] =
        useState<number | "">("");

    const [gradeId, setGradeId] =
        useState<number | "">("");

    const [sectionId, setSectionId] =
        useState<number | "">("");


    /* --------------------------------------------------
       UI STATE
    -------------------------------------------------- */

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);


    /* --------------------------------------------------
       LOAD INITIAL DATA
    -------------------------------------------------- */

    useEffect(() => {

        const loadInitialData = async () => {

            try {

                setLoading(true);

                const [
                    studentsData,
                    academicYearsData,
                ] = await Promise.all([
                    getStudents(),
                    getAcademicYears(),
                ]);


                setStudents(studentsData);


                setAcademicYears(
                    academicYearsData.filter(
                        (academicYear: AcademicYear) =>
                            academicYear.active
                    )
                );

            } catch (error: any) {

                console.error(
                    "Failed to load enrollment data:",
                    error
                );

                toast.error(
                    error?.response?.data?.message ||
                    "Failed to load enrollment data."
                );

            } finally {

                setLoading(false);

            }
        };


        loadInitialData();

    }, []);


    /* --------------------------------------------------
       LOAD GRADES WHEN ACADEMIC YEAR CHANGES
    -------------------------------------------------- */

    useEffect(() => {

        if (academicYearId === "") {

            setGrades([]);
            setGradeId("");

            setSections([]);
            setSectionId("");

            return;
        }


        const loadGrades = async () => {

            try {

                const data =
                    await getGradesByAcademicYear(
                        academicYearId
                    );


                setGrades(
                    data.filter(
                        (grade) => grade.active
                    )
                );

            } catch (error: any) {

                console.error(
                    "Failed to load grades:",
                    error
                );

                toast.error(
                    error?.response?.data?.message ||
                    "Failed to load grades."
                );

                setGrades([]);

            }

        };


        loadGrades();

    }, [academicYearId]);


    /* --------------------------------------------------
       LOAD SECTIONS WHEN GRADE CHANGES
    -------------------------------------------------- */

    useEffect(() => {

        if (gradeId === "") {

            setSections([]);
            setSectionId("");

            return;
        }


        const loadSections = async () => {

            try {

                const data =
                    await getSectionsByGrade(
                        gradeId
                    );


                setSections(
                    data.filter(
                        (section) =>
                            section.active
                    )
                );

            } catch (error: any) {

                console.error(
                    "Failed to load sections:",
                    error
                );

                toast.error(
                    error?.response?.data?.message ||
                    "Failed to load sections."
                );

                setSections([]);

            }

        };


        loadSections();

    }, [gradeId]);


    /* --------------------------------------------------
       HANDLERS
    -------------------------------------------------- */

    const handleAcademicYearChange = (
        value: string
    ) => {

        setAcademicYearId(
            value === ""
                ? ""
                : Number(value)
        );

        setGradeId("");
        setGrades([]);

        setSectionId("");
        setSections([]);

    };


    const handleGradeChange = (
        value: string
    ) => {

        setGradeId(
            value === ""
                ? ""
                : Number(value)
        );

        setSectionId("");
        setSections([]);

    };


    const handleSubmit = async () => {

        if (studentId === "") {

            toast.error(
                "Please select a student."
            );

            return;
        }


        if (academicYearId === "") {

            toast.error(
                "Please select an academic year."
            );

            return;
        }


        if (gradeId === "") {

            toast.error(
                "Please select a grade."
            );

            return;
        }


        if (sectionId === "") {

            toast.error(
                "Please select a section."
            );

            return;
        }


        try {

            setSaving(true);

            await createEnrollment({
                studentId,
                academicYearId,
                gradeId,
                sectionId,
            });


            await onAdded();


            toast.success(
                "Student enrolled successfully."
            );


            onClose();

        } catch (error: any) {

            console.error(
                "Failed to create enrollment:",
                error
            );

            toast.error(
                error?.response?.data?.message ||
                error?.response?.data?.errorCode ||
                "Failed to enroll student."
            );

        } finally {

            setSaving(false);

        }
    };


    /* --------------------------------------------------
       SELECTED STUDENT
    -------------------------------------------------- */

    const selectedStudent =
        students.find(
            (student) =>
                student.id === studentId
        );


    /* --------------------------------------------------
       RENDER
    -------------------------------------------------- */

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
                            <UserRound size={20} />
                        </div>

                        <div>

                            <h2
                                className="
                                    text-xl
                                    font-bold
                                    text-slate-800
                                "
                            >
                                Add Student Enrollment
                            </h2>

                            <p
                                className="
                                    mt-1
                                    text-sm
                                    text-slate-500
                                "
                            >
                                Enroll a student into an academic section.
                            </p>

                        </div>

                    </div>


                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="
                            rounded-lg
                            p-2
                            text-slate-500
                            transition
                            hover:bg-slate-100
                            hover:text-slate-700
                            disabled:cursor-not-allowed
                            disabled:opacity-50
                        "
                    >
                        <X size={20} />
                    </button>

                </div>


                {/* CONTENT */}

                <div
                    className="
                        min-h-0
                        flex-1
                        overflow-y-auto
                    "
                >

                    {loading ? (

                        <div
                            className="
                                flex
                                items-center
                                justify-center
                                px-6
                                py-16
                            "
                        >

                            <p
                                className="
                                    text-sm
                                    text-slate-500
                                "
                            >
                                Loading enrollment information...
                            </p>

                        </div>

                    ) : (

                        <div
                            className="
                                space-y-6
                                px-6
                                py-6
                            "
                        >

                            {/* STUDENT INFORMATION */}

                            <div>

                                <h3
                                    className="
                                        mb-4
                                        text-sm
                                        font-semibold
                                        text-slate-800
                                    "
                                >
                                    Student Information
                                </h3>


                                <div
                                    className="
                                        space-y-4
                                    "
                                >

                                    {/* STUDENT */}

                                    <div>

                                        <label
                                            className="
                                                mb-1.5
                                                block
                                                text-sm
                                                font-medium
                                                text-slate-700
                                            "
                                        >
                                            Student
                                        </label>


                                        <select
                                            value={studentId}
                                            onChange={(event) =>
                                                setStudentId(
                                                    event.target.value === ""
                                                        ? ""
                                                        : Number(
                                                            event.target.value
                                                        )
                                                )
                                            }
                                            disabled={saving}
                                            className="
                                                w-full
                                                rounded-xl
                                                border
                                                border-slate-300
                                                bg-white
                                                px-4
                                                py-2.5
                                                text-sm
                                                text-slate-900
                                                outline-none
                                                transition
                                                focus:border-blue-500
                                                focus:ring-2
                                                focus:ring-blue-100
                                                disabled:cursor-not-allowed
                                                disabled:bg-slate-100
                                            "
                                        >

                                            <option value="">
                                                Select a student
                                            </option>


                                            {students.map(
                                                (student) => (
                                                    <option
                                                        key={student.id}
                                                        value={student.id}
                                                    >
                                                        {student.fullName}
                                                        {" — "}
                                                        {student.email}
                                                    </option>
                                                )
                                            )}

                                        </select>

                                    </div>


                                    {/* EMAIL PREVIEW */}

                                    {selectedStudent && (

                                        <div>

                                            <label
                                                className="
                                                    mb-1.5
                                                    block
                                                    text-sm
                                                    font-medium
                                                    text-slate-700
                                                "
                                            >
                                                Email
                                            </label>


                                            <div
                                                className="
                                                    rounded-xl
                                                    border
                                                    border-slate-200
                                                    bg-slate-100
                                                    px-4
                                                    py-2.5
                                                    text-sm
                                                    text-slate-500
                                                "
                                            >
                                                {selectedStudent.email}
                                            </div>

                                        </div>

                                    )}

                                </div>

                            </div>


                            {/* ACADEMIC INFORMATION */}

                            <div>

                                <h3
                                    className="
                                        mb-4
                                        text-sm
                                        font-semibold
                                        text-slate-800
                                    "
                                >
                                    Academic Information
                                </h3>


                                <div
                                    className="
                                        space-y-4
                                    "
                                >

                                    {/* ACADEMIC YEAR */}

                                    <div>

                                        <label
                                            className="
                                                mb-1.5
                                                block
                                                text-sm
                                                font-medium
                                                text-slate-700
                                            "
                                        >
                                            Academic Year
                                        </label>


                                        <select
                                            value={academicYearId}
                                            onChange={(event) =>
                                                handleAcademicYearChange(
                                                    event.target.value
                                                )
                                            }
                                            disabled={saving}
                                            className="
                                                w-full
                                                rounded-xl
                                                border
                                                border-slate-300
                                                bg-white
                                                px-4
                                                py-2.5
                                                text-sm
                                                text-slate-900
                                                outline-none
                                                transition
                                                focus:border-blue-500
                                                focus:ring-2
                                                focus:ring-blue-100
                                                disabled:cursor-not-allowed
                                                disabled:bg-slate-100
                                            "
                                        >

                                            <option value="">
                                                Select an academic year
                                            </option>


                                            {academicYears.map(
                                                (academicYear) => (
                                                    <option
                                                        key={academicYear.id}
                                                        value={academicYear.id}
                                                    >
                                                        {academicYear.name}
                                                    </option>
                                                )
                                            )}

                                        </select>

                                    </div>


                                    {/* GRADE */}

                                    <div>

                                        <label
                                            className="
                                                mb-1.5
                                                block
                                                text-sm
                                                font-medium
                                                text-slate-700
                                            "
                                        >
                                            Grade
                                        </label>


                                        <select
                                            value={gradeId}
                                            onChange={(event) =>
                                                handleGradeChange(
                                                    event.target.value
                                                )
                                            }
                                            disabled={
                                                saving ||
                                                academicYearId === "" ||
                                                grades.length === 0
                                            }
                                            className="
                                                w-full
                                                rounded-xl
                                                border
                                                border-slate-300
                                                bg-white
                                                px-4
                                                py-2.5
                                                text-sm
                                                text-slate-900
                                                outline-none
                                                transition
                                                focus:border-blue-500
                                                focus:ring-2
                                                focus:ring-blue-100
                                                disabled:cursor-not-allowed
                                                disabled:bg-slate-100
                                            "
                                        >

                                            <option value="">
                                                {academicYearId === ""
                                                    ? "Select academic year first"
                                                    : grades.length === 0
                                                        ? "No active grades available"
                                                        : "Select a grade"}
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


                                    {/* SECTION */}

                                    <div>

                                        <label
                                            className="
                                                mb-1.5
                                                block
                                                text-sm
                                                font-medium
                                                text-slate-700
                                            "
                                        >
                                            Section
                                        </label>


                                        <select
                                            value={sectionId}
                                            onChange={(event) =>
                                                setSectionId(
                                                    event.target.value === ""
                                                        ? ""
                                                        : Number(
                                                            event.target.value
                                                        )
                                                )
                                            }
                                            disabled={
                                                saving ||
                                                gradeId === "" ||
                                                sections.length === 0
                                            }
                                            className="
                                                w-full
                                                rounded-xl
                                                border
                                                border-slate-300
                                                bg-white
                                                px-4
                                                py-2.5
                                                text-sm
                                                text-slate-900
                                                outline-none
                                                transition
                                                focus:border-blue-500
                                                focus:ring-2
                                                focus:ring-blue-100
                                                disabled:cursor-not-allowed
                                                disabled:bg-slate-100
                                            "
                                        >

                                            <option value="">
                                                {gradeId === ""
                                                    ? "Select grade first"
                                                    : sections.length === 0
                                                        ? "No active sections available"
                                                        : "Select a section"}
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

                                </div>

                            </div>

                        </div>

                    )}

                </div>


                {/* FOOTER */}

                <div
                    className="
                        flex
                        shrink-0
                        items-center
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
                        disabled={saving}
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
                        onClick={handleSubmit}
                        disabled={loading || saving}
                        className="
                            flex
                            items-center
                            gap-2
                            rounded-xl
                            bg-blue-600
                            px-5
                            py-2.5
                            text-sm
                            font-medium
                            text-white
                            transition
                            hover:bg-blue-700
                            disabled:cursor-not-allowed
                            disabled:opacity-50
                        "
                    >

                        <Plus size={16} />

                        {saving
                            ? "Enrolling..."
                            : "Enroll Student"}

                    </button>

                </div>

            </div>

        </div>
    );
}
