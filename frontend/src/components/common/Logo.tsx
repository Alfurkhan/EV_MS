import { FaGraduationCap } from "react-icons/fa";

export default function Logo() {
    return (
        <div className="flex items-center gap-3">

            <div className="bg-blue-600 w-12 h-12 rounded-xl flex items-center justify-center">

                <FaGraduationCap className="text-white text-2xl"/>

            </div>

            <div>

                <h2 className="text-2xl font-bold">
                    E-Vidyalaya
                </h2>

                <p className="text-blue-300 text-sm">
                    Smart Education Platform
                </p>

            </div>

        </div>
    );
}