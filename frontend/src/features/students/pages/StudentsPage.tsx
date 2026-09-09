import {
    RefreshCw,
    SearchX,
    Users,
    AlertCircle,
} from "lucide-react";
import { useMemo, useState } from "react";

import {
    useStudents,
    type StudentWithEnrollment,
} from "../hooks/useStudents";
import StudentSearch from "../components/StudentSearch";
import StudentFilters from "../components/StudentFilters";
import StudentTable from "../components/StudentTable";
import AddStudentModal from "../components/AddStudentModal";
import StudentDetailsModal from "../components/StudentDetailsModal";

import EditStudentModal from "../components/EditStudentModal";
import StudentEnrollmentModal from "../components/StudentEnrollmentModal";

export default function StudentsPage() {
    const {
        students,
        academicYear,
        loading,
        error,
        refresh,
    } = useStudents();

    const [search, setSearch] = useState("");
    const [gradeFilter, setGradeFilter] = useState("");
    const [sectionFilter, setSectionFilter] = useState("");
    const [enrollmentStatus, setEnrollmentStatus] = useState("");
    const [accountStatus, setAccountStatus] = useState("");

    const [addStudentOpen, setAddStudentOpen] =
        useState(false);

    const [selectedStudent, setSelectedStudent] =
        useState<StudentWithEnrollment | null>(null);

    const [editStudent, setEditStudent] =
        useState<StudentWithEnrollment | null>(null);

    const [enrollmentStudent, setEnrollmentStudent] =
        useState<StudentWithEnrollment | null>(null);

    /*
     * ========================================================
     * FILTER OPTIONS
     * ========================================================
     */

    const grades = useMemo(() => {
        return Array.from(
            new Set(
                students
                    .map(
                        (student) =>
                            student.enrollment?.gradeName
                    )
                    .filter(
                        (grade): grade is string =>
                            Boolean(grade)
                    )
            )
        ).sort();
    }, [students]);

    const sections = useMemo(() => {
        return Array.from(
            new Set(
                students
                    .map(
                        (student) =>
                            student.enrollment?.sectionName
                    )
                    .filter(
                        (section): section is string =>
                            Boolean(section)
                    )
            )
        ).sort();
    }, [students]);

    const handleViewDetails = (
        student: StudentWithEnrollment
    ) => {
        setSelectedStudent(student);
    };

    const handleEditStudent = (
        student: StudentWithEnrollment
    ) => {
        setEditStudent(student);
    };

    const handleAssignEnrollment = (
        student: StudentWithEnrollment
    ) => {
        setEnrollmentStudent(student);
    };

    /*
     * ========================================================
     * FILTER STUDENTS
     * ========================================================
     */

    const filteredStudents = useMemo(() => {
        const normalizedSearch =
            search.trim().toLowerCase();

        return students.filter((student) => {
            /*
             * Search
             */

            const phone =
                `${student.countryCode ?? ""} ${
                    student.phoneNumber ?? ""
                }`
                    .trim()
                    .toLowerCase();

            const grade =
                student.enrollment?.gradeName
                    ?.toLowerCase() ?? "";

            const section =
                student.enrollment?.sectionName
                    ?.toLowerCase() ?? "";

            const matchesSearch =
                normalizedSearch === "" ||
                student.fullName
                    .toLowerCase()
                    .includes(normalizedSearch) ||
                student.email
                    .toLowerCase()
                    .includes(normalizedSearch) ||
                phone.includes(normalizedSearch) ||
                grade.includes(normalizedSearch) ||
                section.includes(normalizedSearch);

            if (!matchesSearch) {
                return false;
            }

            /*
             * Grade
             */

            if (
                gradeFilter &&
                student.enrollment?.gradeName !==
                gradeFilter
            ) {
                return false;
            }

            /*
             * Section
             */

            if (
                sectionFilter &&
                student.enrollment?.sectionName !==
                sectionFilter
            ) {
                return false;
            }

            /*
             * Enrollment Status
             */

            if (enrollmentStatus === "ENROLLED") {
                if (!student.enrollment?.active) {
                    return false;
                }
            } else if (
                enrollmentStatus === "NOT_ENROLLED"
            ) {
                if (student.enrollment?.active) {
                    return false;
                }
            }

            /*
             * Account Status
             */

            if (accountStatus === "ACTIVE") {
                if (
                    !student.accountEnabled ||
                    student.accountLocked
                ) {
                    return false;
                }
            } else if (
                accountStatus === "DISABLED"
            ) {
                if (student.accountEnabled) {
                    return false;
                }
            } else if (
                accountStatus === "LOCKED"
            ) {
                if (!student.accountLocked) {
                    return false;
                }
            }

            return true;
        });
    }, [
        students,
        search,
        gradeFilter,
        sectionFilter,
        enrollmentStatus,
        accountStatus,
    ]);

    /*
     * ========================================================
     * FILTER STATE
     * ========================================================
     */

    const hasActiveFilters =
        Boolean(
            search.trim() ||
            gradeFilter ||
            sectionFilter ||
            enrollmentStatus ||
            accountStatus
        );

    /*
     * ========================================================
     * CLEAR FILTERS
     * ========================================================
     */

    const clearFilters = () => {
        setSearch("");
        setGradeFilter("");
        setSectionFilter("");
        setEnrollmentStatus("");
        setAccountStatus("");
    };

    /*
     * ========================================================
     * LOADING
     * ========================================================
     */

    if (loading) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-4xl font-bold text-slate-800">
                        Students
                    </h1>

                    <p className="mt-1 text-slate-500">
                        Manage all students
                    </p>
                </div>

                <div className="
                    flex
                    min-h-[320px]
                    items-center
                    justify-center
                    rounded-2xl
                    border
                    border-slate-200
                    bg-white
                    shadow-sm
                ">
                    <div className="text-center">
                        <div className="
                            mx-auto
                            flex
                            h-12
                            w-12
                            items-center
                            justify-center
                            rounded-full
                            bg-blue-50
                            text-blue-600
                        ">
                            <RefreshCw
                                size={22}
                                className="animate-spin"
                            />
                        </div>

                        <p className="
                            mt-4
                            text-sm
                            font-medium
                            text-slate-700
                        ">
                            Loading students...
                        </p>

                        <p className="
                            mt-1
                            text-xs
                            text-slate-400
                        ">
                            Please wait while we fetch the
                            student records.
                        </p>
                    </div>
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
            <div className="space-y-6">
                <div>
                    <h1 className="text-4xl font-bold text-slate-800">
                        Students
                    </h1>

                    <p className="mt-1 text-slate-500">
                        Manage all students
                    </p>
                </div>

                <div className="
                    flex
                    min-h-[320px]
                    items-center
                    justify-center
                    rounded-2xl
                    border
                    border-red-200
                    bg-red-50
                    px-6
                    shadow-sm
                ">
                    <div className="max-w-md text-center">
                        <div className="
                            mx-auto
                            flex
                            h-12
                            w-12
                            items-center
                            justify-center
                            rounded-full
                            bg-red-100
                            text-red-500
                        ">
                            <AlertCircle size={24} />
                        </div>

                        <h2 className="
                            mt-4
                            text-base
                            font-semibold
                            text-slate-800
                        ">
                            Unable to load students
                        </h2>

                        <p className="
                            mt-2
                            text-sm
                            leading-6
                            text-red-600
                        ">
                            {error}
                        </p>

                        <button
                            type="button"
                            onClick={refresh}
                            className="
                                mt-5
                                inline-flex
                                items-center
                                gap-2
                                rounded-xl
                                bg-blue-600
                                px-5
                                py-2.5
                                text-sm
                                font-medium
                                text-white
                                shadow-sm
                                transition
                                hover:bg-blue-700
                            "
                        >
                            <RefreshCw size={16} />
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    /*
     * ========================================================
     * PAGE
     * ========================================================
     */

    return (
        <div className="space-y-6">

            {/* ==================================================
                PAGE HEADER
            =================================================== */}

            <div className="
                flex
                items-start
                justify-between
                gap-4
            ">
                <div>
                    <h1 className="text-4xl font-bold text-slate-800">
                        Students
                    </h1>

                    <p className="mt-1 text-slate-500">
                        Manage all students
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={refresh}
                        disabled={loading}
                        className="
                            inline-flex
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
                            hover:bg-slate-50
                            disabled:cursor-not-allowed
                            disabled:opacity-60
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

                        {loading
                            ? "Refreshing..."
                            : "Refresh"}
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            setAddStudentOpen(true)
                        }
                        className="
                            rounded-xl
                            bg-blue-600
                            px-4
                            py-2.5
                            text-sm
                            font-medium
                            text-white
                            shadow-sm
                            transition
                            hover:bg-blue-700
                        "
                    >
                        + Add Student
                    </button>
                </div>
            </div>

            {/* ==================================================
                CURRENT ACADEMIC YEAR
            =================================================== */}

            <div className="
                rounded-2xl
                border
                border-slate-200
                bg-white
                p-5
                shadow-sm
            ">
                <p className="
                    text-xs
                    font-medium
                    uppercase
                    tracking-wide
                    text-slate-400
                ">
                    Current Academic Year
                </p>

                <p className="
                    mt-1
                    text-lg
                    font-semibold
                    text-slate-800
                ">
                    {academicYear?.name ??
                        "No active academic year"}
                </p>
            </div>

            {/* ==================================================
                SEARCH
            =================================================== */}

            <StudentSearch
                value={search}
                onChange={setSearch}
            />

            {/* ==================================================
                FILTERS
            =================================================== */}

            <StudentFilters
                grade={gradeFilter}
                section={sectionFilter}
                enrollmentStatus={enrollmentStatus}
                accountStatus={accountStatus}
                grades={grades}
                sections={sections}
                onGradeChange={setGradeFilter}
                onSectionChange={setSectionFilter}
                onEnrollmentStatusChange={
                    setEnrollmentStatus
                }
                onAccountStatusChange={
                    setAccountStatus
                }
                onClear={clearFilters}
            />

            {/* ==================================================
                EMPTY STATE
            =================================================== */}

            {filteredStudents.length === 0 ? (
                <div className="
                    flex
                    min-h-[300px]
                    items-center
                    justify-center
                    rounded-2xl
                    border
                    border-slate-200
                    bg-white
                    px-6
                    shadow-sm
                ">
                    <div className="max-w-md text-center">
                        <div className="
                            mx-auto
                            flex
                            h-14
                            w-14
                            items-center
                            justify-center
                            rounded-full
                            bg-slate-100
                            text-slate-400
                        ">
                            {hasActiveFilters ? (
                                <SearchX size={26} />
                            ) : (
                                <Users size={26} />
                            )}
                        </div>

                        <h2 className="
                            mt-4
                            text-base
                            font-semibold
                            text-slate-800
                        ">
                            {hasActiveFilters
                                ? "No students found"
                                : "No students available"}
                        </h2>

                        <p className="
                            mt-2
                            text-sm
                            leading-6
                            text-slate-500
                        ">
                            {hasActiveFilters
                                ? "No students match your current search or filters. Try changing your search or clearing the filters."
                                : "There are currently no student accounts available to manage."}
                        </p>

                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="
                                    mt-5
                                    rounded-xl
                                    border
                                    border-slate-200
                                    bg-white
                                    px-4
                                    py-2.5
                                    text-sm
                                    font-medium
                                    text-slate-700
                                    transition
                                    hover:bg-slate-50
                                "
                            >
                                Clear Search & Filters
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                /* ==================================================
                   TABLE
                =================================================== */

                <StudentTable
                    students={filteredStudents}
                    onViewDetails={handleViewDetails}
                    onEditStudent={handleEditStudent}
                    onAssignEnrollment={
                        handleAssignEnrollment
                    }
                    onSuccess={refresh}
                />
            )}

            {/* ==================================================
                ADD STUDENT MODAL
            =================================================== */}

            <AddStudentModal
                open={addStudentOpen}
                onClose={() =>
                    setAddStudentOpen(false)
                }
                onSuccess={refresh}
            />

            {/* ==================================================
                STUDENT DETAILS MODAL
            =================================================== */}

            <StudentDetailsModal
                open={selectedStudent !== null}
                student={selectedStudent}
                onClose={() =>
                    setSelectedStudent(null)
                }
            />

            {/* ==================================================
                EDIT STUDENT MODAL
            =================================================== */}

            <EditStudentModal
                open={editStudent !== null}
                student={editStudent}
                onClose={() =>
                    setEditStudent(null)
                }
                onSuccess={refresh}
            />

            {/* ==================================================
                ENROLLMENT MODAL
            =================================================== */}

            <StudentEnrollmentModal
                open={enrollmentStudent !== null}
                student={enrollmentStudent}
                onClose={() =>
                    setEnrollmentStudent(null)
                }
                onSuccess={refresh}
            />
        </div>
    );
}