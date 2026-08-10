import AuthLayout from "../components/AuthLayout";
import AuthCard from "../components/AuthCard";
import RegisterForm from "../components/RegisterForm";

import { useState } from "react";

export default function RegisterPage() {

    const [role, setRole] = useState("Student");

    return (

        <AuthLayout
            mode="signup"
            onModeChange={() => {}}
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
                                Create Account
                            </h2>

                            <p className="text-sm text-slate-500">
                                Join E-Vidyalaya and get started.
                            </p>

                        </div>

                    </div>

                </div>

                <RegisterForm role={role} />

            </AuthCard>

        </AuthLayout>

    );
}