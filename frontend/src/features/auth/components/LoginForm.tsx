import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";

import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";

import { loginSchema, type LoginFormData } from "../schema/loginSchema";
import { login } from "../services/authService";

type Props = {
    role: string;
};

export default function LoginForm({ role }: Props) {
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const { login: authLogin } = useAuth();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormData) => {

        try {
            setLoading(true);

            const response = await login(data);

            authLogin(
                response.accessToken,
                response.refreshToken
            );

            toast.success("Login Successful!");

            navigate("/dashboard");

            // We'll navigate to dashboard here later.
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            <p className="mb-6 text-sm text-slate-500">
                Signing in as{" "}
                <span className="font-semibold text-blue-600">
        {role}
    </span>
            </p>

            <Input
                label="Email"
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
                    className="text-sm text-blue-600 hover:underline"
                >
                    Forgot Password?
                </button>
            </div>

            <Button type="submit" loading={loading}>
                Sign In
            </Button>
        </form>
    );
}