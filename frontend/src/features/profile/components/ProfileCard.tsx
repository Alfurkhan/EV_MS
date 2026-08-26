import type { Profile } from "../types/profile";
import {
    Camera,
    Pencil,
    GraduationCap,
    BadgeCheck,
    UserRound,
} from "lucide-react";

type Props = {
    profile: Profile;
    onEdit: () => void;
};
export default function ProfileCard({
                                        profile,
                                        onEdit,
                                    }: Props) {
    return (

        <div className="bg-white rounded-2xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl">

            {/* Cover */}

            <div className="h-40 bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 relative">

                <button
                    className="
                    absolute
                    right-5
                    bottom-5
                    bg-white/90
                    backdrop-blur-md
                    p-3
                    rounded-full
                    shadow-lg
                    hover:bg-white
                    hover:scale-105
                    transition-all
                    duration-200
                "
                >
                    <Camera size={18} />
                </button>

            </div>

            {/* Profile */}

            <div className="px-8 pb-8">

                <div className="-mt-10 flex items-end gap-6">

                    <div
                        className="
                        w-28
                        h-28
                        rounded-full
                        bg-blue-700
                        border-4
                        border-white
                        flex
                        items-center
                        justify-center
                        text-4xl
                        text-white
                        font-bold
                        shadow-xl
                        ring-4
                        ring-white
                    "
                    >
                        {profile.fullName?.charAt(0).toUpperCase()}
                    </div>

                    <div className="pb-3">

                        <h1 className="text-3xl font-bold">

                            {profile.fullName}

                        </h1>

                        <p className="text-slate-500 mt-1">

                            {profile.email}

                        </p>

                        <div className="flex flex-wrap gap-3 mt-3">

                        <span
                            className="
                                flex
                                items-center
                                gap-2
                                bg-blue-100
                                text-blue-700
                                text-sm
                                px-4
                                py-2
                                rounded-full
                            "
                        >
                            {getRoleIcon(profile.role)}

                            {formatRole(profile.role)}
                        </span>

                            <span
                                className={`
                                    flex
                                    items-center
                                    gap-2
                                    text-sm
                                    px-4
                                    py-2
                                    rounded-full
                                    ${
                                    profile.accountEnabled
                                        ? "bg-green-100 text-green-700"
                                        : "bg-red-100 text-red-700"
                                }
                                    `}
                            >

                                <>
                                    <BadgeCheck size={16} />

                                    {profile.accountEnabled
                                        ? "Active"
                                        : "Disabled"}
                                </>
                            </span>

                        </div>

                        <button
                            onClick={onEdit}
                            className="
                                mt-5
                                inline-flex
                                items-center
                                gap-2
                                border
                                border-slate-300
                                px-5
                                py-2
                                rounded-xl
                                hover:bg-blue-50
                                hover:border-blue-400
                                hover:text-blue-700
                                transition-all
                                duration-200
                            "
                        >
                            <Pencil size={16} />
                            Edit Profile
                        </button>

                    </div>

                </div>

            </div>

        </div>

    );

    function formatRole(
        role: string | null | undefined
    ) {

        if (!role) {
            return "User";
        }

        return role
            .replace(/^ROLE_/, "")
            .replace(/_/g, " ")
            .toLowerCase()
            .replace(
                /\b\w/g,
                (char) => char.toUpperCase()
            );
    }

    function getRoleIcon(
        role: string | null | undefined
    ) {

        if (role === "ROLE_STUDENT") {
            return <GraduationCap size={16} />;
        }

        if (role === "ROLE_FACULTY") {
            return <UserRound size={16} />;
        }

        return <BadgeCheck size={16} />;
    }
}