import { useState } from "react";

import AuthLayout from "../components/AuthLayout";
import AuthCard from "../components/AuthCard";
import LoginForm from "../components/LoginForm";
import RegisterForm from "../components/RegisterForm";

export default function LoginPage() {

    const [mode, setMode] = useState<
        "signin" | "signup" | null
    >(null);

    const [role, setRole] = useState("Student");

    const [registeredEmail, setRegisteredEmail] =
        useState("");

    const handleRegistrationSuccess = (email: string) => {

        setRegisteredEmail(email);

        setMode("signin");
    };

    return (

        <AuthLayout
            mode={mode}
            onModeChange={setMode}
            role={role}
            onRoleChange={setRole}
        >

            <AuthCard>

                <div className="mb-8">

                    <div className="flex items-center gap-3">

                        <div
                            className="
                                w-10
                                h-10
                                rounded-xl
                                bg-blue-100
                                text-blue-600
                                flex
                                items-center
                                justify-center
                            "
                        >
                            <span className="text-lg font-bold">
                                EV
                            </span>
                        </div>

                        <div>

                            <h2 className="text-2xl font-bold text-slate-800">
                                {mode === "signin"
                                    ? "Welcome Back"
                                    : "Create Account"}
                            </h2>

                            <p className="text-sm text-slate-500">
                                {mode === "signin"
                                    ? "Sign in to continue to E-Vidyalaya."
                                    : "Join E-Vidyalaya and get started."}
                            </p>

                        </div>

                    </div>

                </div>

                {mode === "signin" && (
                    <LoginForm
                        role={role}
                        defaultEmail={registeredEmail}
                    />
                )}

                {mode === "signup" && (
                    <RegisterForm
                        role={role}
                        onSuccess={handleRegistrationSuccess}
                    />
                )}

            </AuthCard>

        </AuthLayout>
    );
}