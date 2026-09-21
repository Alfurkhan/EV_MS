import { useMemo, useState } from "react";
import {
    AlertCircle,
    RefreshCw,
    SearchX,
} from "lucide-react";

import { useFaculty } from "../hooks/useFaculty";
import FacultySearch from "../components/FacultySearch";
import FacultyFilters from "../components/FacultyFilters";
import FacultyTable from "../components/FacultyTable";
import AddFacultyModal from "../components/AddFacultyModal";
import EditFacultyModal from "../components/EditFacultyModal";
import FacultyDetailsModal from "../components/FacultyDetailsModal";

import type { Faculty } from "../types/faculty";

export default function FacultyPage() {
    const {
        faculties,
        loading,
        error,
        refresh,
    } = useFaculty();

    const [search, setSearch] = useState("");
    const [accountStatus, setAccountStatus] = useState("ALL");

    const [addFacultyOpen, setAddFacultyOpen] =
        useState(false);

    const [selectedFaculty, setSelectedFaculty] =
        useState<Faculty | null>(null);

    const [editFaculty, setEditFaculty] =
        useState<Faculty | null>(null);

    const filteredFaculties = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();

        return faculties.filter((faculty) => {
            const matchesSearch =
                !normalizedSearch ||
                faculty.fullName
                    .toLowerCase()
                    .includes(normalizedSearch) ||
                faculty.email
                    .toLowerCase()
                    .includes(normalizedSearch) ||
                (faculty.phoneNumber ?? "")
                    .toLowerCase()
                    .includes(normalizedSearch);

            let matchesAccountStatus = true;

            if (accountStatus === "ACTIVE") {
                matchesAccountStatus =
                    faculty.accountEnabled &&
                    !faculty.accountLocked;
            }

            if (accountStatus === "DISABLED") {
                matchesAccountStatus =
                    !faculty.accountEnabled;
            }

            if (accountStatus === "LOCKED") {
                matchesAccountStatus =
                    faculty.accountLocked;
            }

            return (
                matchesSearch &&
                matchesAccountStatus
            );
        });
    }, [faculties, search, accountStatus]);

    const handleClearFilters = () => {
        setAccountStatus("ALL");
    };

    const handleRefresh = async () => {
        await refresh();
    };

    return (
        <div className="space-y-6">
            {/* HEADER */}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-4xl font-bold text-slate-800">
                        Faculty
                    </h1>

                    <p className="mt-1 text-slate-500">
                        Manage all faculty members
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={handleRefresh}
                        disabled={loading}
                        className="
                            inline-flex
                            items-center
                            gap-2
                            rounded-xl
                            border
                            border-slate-200
                            bg-white
                            px-4
                            py-2.5
                            text-sm
                            font-medium
                            text-slate-600
                            shadow-sm
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

                        Refresh
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            setAddFacultyOpen(true)
                        }
                        className="
                            inline-flex
                            items-center
                            gap-2
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
                        <span className="text-lg leading-none">
                            +
                        </span>

                        Add Faculty
                    </button>
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
                        p-4
                        text-red-700
                    "
                >
                    <AlertCircle
                        size={20}
                        className="mt-0.5 shrink-0"
                    />

                    <div>
                        <p className="font-medium">
                            Unable to load faculty
                        </p>

                        <p className="mt-1 text-sm text-red-600">
                            {error}
                        </p>
                    </div>
                </div>
            )}

            {/* LOADING */}

            {loading && !faculties.length ? (
                <div
                    className="
                        flex
                        items-center
                        justify-center
                        rounded-2xl
                        border
                        border-slate-200
                        bg-white
                        px-6
                        py-16
                        shadow-sm
                    "
                >
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                        <RefreshCw
                            size={18}
                            className="animate-spin text-blue-500"
                        />

                        Loading faculty...
                    </div>
                </div>
            ) : (
                <>
                    {/* SEARCH */}

                    <FacultySearch
                        value={search}
                        onChange={setSearch}
                    />

                    {/* FILTERS */}

                    <FacultyFilters
                        accountStatus={accountStatus}
                        onAccountStatusChange={
                            setAccountStatus
                        }
                        onClear={handleClearFilters}
                    />

                    {/* EMPTY SEARCH RESULT */}

                    {filteredFaculties.length === 0 &&
                    (search || accountStatus !== "ALL") ? (
                        <div
                            className="
                                rounded-2xl
                                border
                                border-slate-200
                                bg-white
                                px-6
                                py-16
                                text-center
                                shadow-sm
                            "
                        >
                            <div
                                className="
                                    mx-auto
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
                                <SearchX size={24} />
                            </div>

                            <h2 className="mt-4 text-base font-semibold text-slate-800">
                                No faculty found
                            </h2>

                            <p className="mt-1 text-sm text-slate-400">
                                Try changing your search or filters.
                            </p>
                        </div>
                    ) : (
                        <FacultyTable
                            faculties={filteredFaculties}
                            onViewDetails={
                                setSelectedFaculty
                            }
                            onEditFaculty={
                                setEditFaculty
                            }
                            onSuccess={refresh}
                        />
                    )}
                </>
            )}

            {/* MODALS */}

            <AddFacultyModal
                open={addFacultyOpen}
                onClose={() =>
                    setAddFacultyOpen(false)
                }
                onSuccess={refresh}
            />

            <FacultyDetailsModal
                faculty={selectedFaculty}
                onClose={() =>
                    setSelectedFaculty(null)
                }
            />

            <EditFacultyModal
                faculty={editFaculty}
                onClose={() =>
                    setEditFaculty(null)
                }
                onSuccess={refresh}
            />
        </div>
    );
}