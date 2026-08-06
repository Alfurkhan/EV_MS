import AuthLayout from "../components/AuthLayout";
import AuthCard from "../components/AuthCard";
import LoginForm from "../components/LoginForm";
import { useState } from "react";
import RoleSelector from "../components/RoleSelector";

export default function LoginPage() {
    const [role, setRole] = useState("Student");
    return (
        <AuthLayout>

            <AuthCard>

                <h2 className="text-3xl font-bold">
                    Welcome Back 👋
                </h2>

                <p className="text-slate-500 mt-2 mb-8">
                    Sign in to continue to E-Vidyalaya.
                </p>

                <RoleSelector
                    role={role}
                    onChange={setRole}
                />

                <LoginForm role={role} />

            </AuthCard>

        </AuthLayout>
    );
}