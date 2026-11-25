import { FaGraduationCap } from "react-icons/fa";

export default function Logo() {
    return (
        <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600">
                <FaGraduationCap className="text-2xl text-white" />
            </div>
            <div className="min-w-0">
                <h2 className="truncate text-2xl font-bold">eVidyalaya</h2>
                <p className="truncate text-sm text-blue-300">Smart Education Platform</p>
            </div>
        </div>
    );
}
