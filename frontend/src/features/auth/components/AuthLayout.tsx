import type { ReactNode } from "react";
import Logo from "../../../components/common/Logo";
import {
    GraduationCap,
    BookOpen,
    Users,
    BrainCircuit,
} from "lucide-react";

type Props = {
    children: ReactNode;
};

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

export default function AuthLayout({ children }: Props) {
    return (
        <div className="min-h-screen grid lg:grid-cols-5">

            {/* LEFT */}

            <div className="lg:col-span-3 bg-gradient-to-br from-blue-700 via-indigo-700 to-slate-900 text-white flex flex-col justify-between p-16">

                <div>

                    <Logo />

                    <h1 className="mt-16 text-6xl font-bold leading-tight">
                        Welcome to
                        <br />
                        E-Vidyalaya
                    </h1>

                    <p className="mt-8 text-xl text-blue-100 max-w-xl leading-9">
                        Smart School Management Platform built for
                        Students, Faculty and Administrators.
                    </p>

                </div>

                <div className="grid grid-cols-2 gap-6">

                    {features.map((feature) => {

                        const Icon = feature.icon;

                        return (

                            <div
                                key={feature.title}
                                className="rounded-2xl bg-white/10 backdrop-blur-md p-5"
                            >
                                <Icon className="mb-3 text-blue-300" size={28} />

                                <h3 className="font-semibold text-lg">
                                    {feature.title}
                                </h3>

                                <p className="text-blue-100 text-sm mt-2">
                                    {feature.description}
                                </p>

                            </div>

                        );

                    })}

                </div>

            </div>

            {/* RIGHT */}

            <div className="lg:col-span-2 bg-slate-50 flex items-center justify-center p-10">

                {children}

            </div>

        </div>
    );
}