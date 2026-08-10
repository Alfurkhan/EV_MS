import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

import Logo from "../../../components/common/Logo";

import {
    GraduationCap,
    BookOpen,
    Users,
    BrainCircuit,
    LogIn,
    UserPlus,
    Check,
} from "lucide-react";

type AuthMode = "signin" | "signup" | null;

type Props = {
    children: ReactNode;
    mode: AuthMode;
    onModeChange: (mode: AuthMode) => void;
    role: string;
    onRoleChange: (role: string) => void;
};

const roles = [
    "Student",
    "Faculty",
    "Admin",
];

const features = [
    {
        icon: GraduationCap,
        title: "Student Management",
        description: "Manage students with ease",
    },
    {
        icon: Users,
        title: "Faculty Portal",
        description: "Teacher and staff management",
    },
    {
        icon: BookOpen,
        title: "Courses & Attendance",
        description: "Everything in one place",
    },
    {
        icon: BrainCircuit,
        title: "AI Assistant",
        description: "Coming Soon",
    },
];

export default function AuthLayout({
                                       children,
                                       mode,
                                       onModeChange,
                                       role,
                                       onRoleChange,
                                   }: Props) {

    const [roleMenuOpen, setRoleMenuOpen] = useState(false);

    const authControlsRef =
        useRef<HTMLDivElement>(null);

    const authSelected = mode !== null;

    /*
     * Close role selector when clicking outside
     */
    useEffect(() => {

        const handleOutsideClick = (event: MouseEvent) => {

            if (
                authControlsRef.current &&
                !authControlsRef.current.contains(
                    event.target as Node
                )
            ) {
                setRoleMenuOpen(false);
            }

        };

        document.addEventListener(
            "mousedown",
            handleOutsideClick
        );

        return () => {
            document.removeEventListener(
                "mousedown",
                handleOutsideClick
            );
        };

    }, []);

    const handleModeChange = (nextMode: AuthMode) => {

        if (mode === nextMode) {

            setRoleMenuOpen(
                (current) => !current
            );

            return;
        }

        onModeChange(nextMode);

        setRoleMenuOpen(true);
    };

    const handleRoleChange = (selectedRole: string) => {

        onRoleChange(selectedRole);

        setRoleMenuOpen(false);
    };

    return (

        <div
            className="
                h-screen
                w-full
                overflow-hidden
                bg-slate-50
            "
        >

            {/* ================================================= */}
            {/* HEADER */}
            {/* ================================================= */}

            <header
                className="
                    h-20
                    w-full
                    bg-white
                    border-b
                    border-slate-200
                    flex
                    items-center
                    justify-between
                    px-8
                    lg:px-12
                    relative
                    z-50
                "
            >

                {/* BRAND */}

                <div className="flex items-center">

                    <Logo />

                </div>


                {/* AUTH CONTROLS */}

                <div
                    ref={authControlsRef}
                    className="
                        relative
                        flex
                        items-center
                        gap-3
                    "
                >

                    {/* ========================================= */}
                    {/* MOVING ACTIVE BACKGROUND */}
                    {/* ========================================= */}

                    {authSelected && (

                        <div
                            className={`
                                absolute
                                left-0
                                top-0
                                w-[116px]
                                h-[44px]
                                rounded-xl
                                bg-blue-600
                                shadow-lg
                                shadow-blue-600/20
                                pointer-events-none
                                transition-transform
                                duration-300
                                ease-[cubic-bezier(0.22,1,0.36,1)]

                                ${
                                mode === "signup"
                                    ? "translate-x-[128px]"
                                    : "translate-x-0"
                            }
                            `}
                        />

                    )}


                    {/* ========================================= */}
                    {/* SIGN IN */}
                    {/* ========================================= */}

                    <button
                        type="button"
                        onClick={() =>
                            handleModeChange("signin")
                        }
                        className={`
                            relative
                            z-10
                            inline-flex
                            items-center
                            justify-center
                            gap-2
                            w-[116px]
                            h-[44px]
                            rounded-xl
                            font-medium
                            transition-all
                            duration-200
                            ease-out

                            ${
                            mode === "signin"
                                ? "text-white"
                                : "bg-white text-blue-600 shadow-md shadow-blue-600/15 hover:scale-[1.04] hover:shadow-lg"
                        }
                        `}
                    >

                        <LogIn size={17} />

                        Sign In

                    </button>


                    {/* ========================================= */}
                    {/* SIGN UP */}
                    {/* ========================================= */}

                    <button
                        type="button"
                        onClick={() =>
                            handleModeChange("signup")
                        }
                        className={`
                            relative
                            z-10
                            inline-flex
                            items-center
                            justify-center
                            gap-2
                            w-[116px]
                            h-[44px]
                            rounded-xl
                            font-medium
                            transition-all
                            duration-200
                            ease-out

                            ${
                            mode === "signup"
                                ? "text-white"
                                : "bg-white text-blue-600 shadow-md shadow-blue-600/15 hover:scale-[1.04] hover:shadow-lg"
                        }
                        `}
                    >

                        <UserPlus size={17} />

                        Sign Up

                    </button>


                    {/* ========================================= */}
                    {/* ROLE SELECTOR */}
                    {/* ========================================= */}

                    <div
                        className={`
                            absolute
                            top-[56px]
                            w-52
                            bg-white
                            border
                            border-slate-200
                            rounded-2xl
                            shadow-2xl
                            p-2
                            origin-top

                            transition-all
                            duration-300
                            ease-out

                            ${mode === "signup"
                            ? "right-0"
                            : "left-0"
                        }

                            ${
                            roleMenuOpen && authSelected
                                ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
                                : "opacity-0 -translate-y-2 scale-95 pointer-events-none"
                        }
                        `}
                    >

                        <p
                            className="
                                px-3
                                py-2
                                text-xs
                                font-semibold
                                uppercase
                                tracking-wide
                                text-slate-400
                            "
                        >
                            Continue As
                        </p>


                        {roles.map((item) => (

                            <button
                                key={item}
                                type="button"
                                onClick={() =>
                                    handleRoleChange(item)
                                }
                                className={`
                                    w-full
                                    flex
                                    items-center
                                    justify-between
                                    px-3
                                    py-2.5
                                    rounded-xl
                                    text-sm
                                    font-medium
                                    transition-all
                                    duration-200

                                    ${
                                    role === item
                                        ? "bg-blue-50 text-blue-600"
                                        : "text-slate-600 hover:bg-slate-50"
                                }
                                `}
                            >

                                <span>
                                    {item}
                                </span>

                                {role === item && (
                                    <Check size={16} />
                                )}

                            </button>

                        ))}

                    </div>

                </div>

            </header>


            {/* ================================================= */}
            {/* AUTH STAGE */}
            {/* ================================================= */}

            <main
                className="
                    relative
                    w-full
                    h-[calc(100vh-5rem)]
                    overflow-hidden
                "
            >

                {/* ================================================= */}
                {/* HERO */}
                {/* ================================================= */}

                <section
                    className={`
                        absolute
                        inset-y-0
                        left-0
                        z-10

                        bg-gradient-to-br
                        from-blue-700
                        via-indigo-700
                        to-slate-900

                        text-white

                        overflow-hidden

                        transition-[width]
                        duration-700
                        ease-[cubic-bezier(0.22,1,0.36,1)]

                        ${
                        authSelected
                            ? "w-[60%]"
                            : "w-full"
                    }
                    `}
                >

                    {/* HERO SCROLL AREA */}

                    <div
                        className="
                            h-full
                            overflow-y-auto
                            overflow-x-hidden
                            scrollbar-thin
                            scrollbar-thumb-white/20
                            scrollbar-track-transparent
                        "
                    >

                        {/* CENTERED HERO CONTENT */}

                        <div
                            className="
                                min-h-full
                                w-full
                                flex
                                items-center
                                justify-center
                                px-8
                                py-12
                                lg:px-16
                            "
                        >

                            <div
                                className="
                                    w-full
                                    max-w-5xl
                                "
                            >

                                {/* ================================= */}
                                {/* HERO TEXT */}
                                {/* ================================= */}

                                <div className="text-center">

                                    <h1
                                        className="
                                            text-5xl
                                            lg:text-7xl
                                            font-bold
                                            leading-tight
                                        "
                                    >
                                        Welcome to
                                        <br />
                                        E-Vidyalaya
                                    </h1>


                                    <p
                                        className="
                                            mt-6
                                            mx-auto
                                            text-lg
                                            lg:text-xl
                                            text-blue-100
                                            max-w-3xl
                                            leading-8
                                        "
                                    >
                                        Smart School Management
                                        Platform built for Students,
                                        Faculty and Administrators.
                                    </p>

                                </div>


                                {/* ================================= */}
                                {/* FEATURE CARDS */}
                                {/* ================================= */}

                                <div
                                    className="
                                        grid
                                        grid-cols-1
                                        sm:grid-cols-2
                                        gap-5
                                        mt-12
                                        pb-8
                                    "
                                >

                                    {features.map((feature) => {

                                        const Icon = feature.icon;

                                        return (

                                            <div
                                                key={feature.title}
                                                className="
                                                    group
                                                    min-h-[150px]
                                                    rounded-2xl
                                                    bg-white/[0.08]
                                                    backdrop-blur-xl
                                                    border
                                                    border-white/[0.12]
                                                    p-6

                                                    shadow-lg
                                                    shadow-black/5

                                                    transition-all
                                                    duration-300
                                                    ease-out

                                                    hover:-translate-y-1
                                                    hover:bg-white/[0.12]
                                                    hover:border-white/[0.2]
                                                    hover:shadow-xl
                                                    hover:shadow-black/10
                                                "
                                            >

                                                <div
                                                    className="
                                                        mb-5
                                                        w-11
                                                        h-11
                                                        rounded-xl
                                                        bg-white/10
                                                        border
                                                        border-white/10
                                                        flex
                                                        items-center
                                                        justify-center

                                                        transition-all
                                                        duration-300

                                                        group-hover:bg-white/15
                                                        group-hover:scale-105
                                                    "
                                                >
                                                    <Icon
                                                        className="text-blue-300"
                                                        size={24}
                                                    />
                                                </div>

                                                <h3
                                                    className="
                                                        font-semibold
                                                        text-base
                                                        lg:text-lg
                                                        text-white
                                                        tracking-tight
                                                    "
                                                >
                                                    {feature.title}
                                                </h3>

                                                <p
                                                    className="
                                                        text-blue-100/80
                                                        text-sm
                                                        mt-2
                                                        leading-6
                                                    "
                                                >
                                                    {feature.description}
                                                </p>
                                            </div>

                                        );

                                    })}

                                </div>

                            </div>

                        </div>

                    </div>

                </section>


                {/* ================================================= */}
                {/* AUTH PANEL */}
                {/* ================================================= */}

                <section
                    className={`
                        absolute
                        inset-y-0
                        right-0
                        z-20

                        w-[40%]

                        bg-slate-50

                        flex
                        items-center
                        justify-center

                        p-6
                        lg:p-10

                        transform

                        transition-transform
                        duration-700
                        ease-[cubic-bezier(0.22,1,0.36,1)]

                        ${
                        authSelected
                            ? "translate-x-0"
                            : "translate-x-full"
                    }
                    `}
                >

                    <div
                        className="
                            w-full
                            max-w-md
                        "
                    >

                        {children}

                    </div>

                </section>

            </main>

        </div>
    );
}