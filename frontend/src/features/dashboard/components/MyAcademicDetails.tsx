import { useEffect, useState } from "react";
import {
    getMyActiveEnrollment,
    type StudentEnrollment,
} from "../../academic/services/studentEnrollmentService";

export default function MyAcademicDetails() {
    const [enrollment, setEnrollment] =
        useState<StudentEnrollment | null>(null);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadAcademicDetails() {
            try {
                setLoading(true);
                setError(null);

                const data = await getMyActiveEnrollment();

                setEnrollment(data);
            } catch (err) {
                console.error(
                    "Failed to load academic details:",
                    err
                );

                setError(
                    "Unable to load your academic details."
                );
            } finally {
                setLoading(false);
            }
        }

        loadAcademicDetails();
    }, []);

    if (loading) {
        return (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">
                    My Academic Details
                </h2>

                <p className="mt-4 text-sm text-slate-500">
                    Loading your academic details...
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">
                    My Academic Details
                </h2>

                <p className="mt-4 text-sm text-red-500">
                    {error}
                </p>
            </div>
        );
    }

    if (!enrollment) {
        return (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">
                    My Academic Details
                </h2>

                <p className="mt-4 text-sm text-slate-500">
                    No active enrollment found.
                </p>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                        My Academic Details
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Your current academic information
                    </p>
                </div>

                <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                        enrollment.active
                            ? "bg-green-100 text-green-700"
                            : "bg-slate-100 text-slate-600"
                    }`}
                >
                    {enrollment.active
                        ? "Active"
                        : "Inactive"}
                </span>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">

                <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Academic Year
                    </p>

                    <p className="mt-2 text-base font-semibold text-slate-900">
                        {enrollment.academicYearName}
                    </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Grade
                    </p>

                    <p className="mt-2 text-base font-semibold text-slate-900">
                        {enrollment.gradeName}
                    </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Section
                    </p>

                    <p className="mt-2 text-base font-semibold text-slate-900">
                        {enrollment.sectionName}
                    </p>
                </div>

            </div>
        </div>
    );
}