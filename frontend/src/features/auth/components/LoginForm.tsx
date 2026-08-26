import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";

import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";

import { loginSchema, type LoginFormData } from "../schema/loginSchema";
import { login } from "../services/authService";
import ForgotPasswordModal from "./ForgotPasswordModal";

type Props = {
    role: string;
    defaultEmail?: string;
};

export default function LoginForm({
                                      role,
                                      defaultEmail = "",
                                  }: Props) {

    const [loading, setLoading] = useState(false);

    const [showForgotPassword, setShowForgotPassword] =
        useState(false);

    const navigate = useNavigate();

    const { login: authLogin } = useAuth();

    const roleMap: Record<
        string,
        "ROLE_STUDENT" | "ROLE_FACULTY" | "ROLE_ADMIN"
    > = {
        Student: "ROLE_STUDENT",
        Faculty: "ROLE_FACULTY",
        Admin: "ROLE_ADMIN",
    };

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            userName: defaultEmail,
            password: "",
        },
    });

    useEffect(() => {
        reset({
            userName: defaultEmail,
            password: "",
        });
    }, [defaultEmail, reset]);

    const onSubmit = async (data: LoginFormData) => {

        try {

            setLoading(true);

            const response = await login({
                ...data,
                roleName: roleMap[role],
            });

            authLogin(
                response.accessToken,
                response.refreshToken,
                response.roles
            );

            toast.success("Login Successful!");

            navigate("/dashboard");

        } catch (error: any) {

            console.error(error);

            toast.error(
                error?.response?.data?.message ||
                error.message ||
                "Something went wrong"
            );

        } finally {

            setLoading(false);
        }
    };

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-5"
        >

            <p className="mb-6 text-sm text-slate-500">
                Signing in as{" "}
                <span className="font-semibold text-blue-600">
                    {role}
                </span>
            </p>

            <Input
                label="Email"
                type="email"
                placeholder="Enter your email"
                {...register("userName")}
                error={errors.userName?.message}
            />

            <Input
                label="Password"
                type="password"
                placeholder="Enter your password"
                {...register("password")}
                error={errors.password?.message}
            />

            <div className="text-right">
                <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-blue-600 hover:underline"
                >
                    Forgot Password?
                </button>
            </div>

            <Button
                type="submit"
                loading={loading}
            >
                Sign In
            </Button>

            {showForgotPassword && (
                <ForgotPasswordModal
                    email=""
                    onClose={() =>
                        setShowForgotPassword(false)
                    }
                    onSuccess={() => {
                        setShowForgotPassword(false);

                        toast.success(
                            "You can now sign in with your new password."
                        );
                    }}
                />
            )}

        </form>
    );
}