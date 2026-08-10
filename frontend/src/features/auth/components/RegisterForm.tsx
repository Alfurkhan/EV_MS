import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";

import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";

import {
    registerSchema,
    type RegisterFormData,
} from "../schema/registerSchema";

import { register as registerUser } from "../services/authService";

type Props = {
    role: string;
};

const roleMap: Record<
    string,
    "ROLE_STUDENT" | "ROLE_FACULTY" | "ROLE_ADMIN"
> = {
    Student: "ROLE_STUDENT",
    Faculty: "ROLE_FACULTY",
    Admin: "ROLE_ADMIN",
};

export default function RegisterForm({ role }: Props) {

    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const { login: authLogin } = useAuth();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (data: RegisterFormData) => {

        try {

            setLoading(true);

            const response = await registerUser({
                fullName: data.fullName,
                email: data.email,
                password: data.password,
                platform: "NONE",
                roleName: roleMap[role],
            });

            authLogin(
                response.accessToken,
                response.refreshToken,
                response.roles
            );

            toast.success("Registration Successful!");

            navigate("/dashboard");

        } catch (error: any) {

            console.error(error);

            if (error?.response?.status === 409) {

                toast.error(
                    "An Admin account already exists."
                );

            } else {

                toast.error(
                    error?.response?.data?.errorCode ||
                    error?.response?.data?.message ||
                    error.message ||
                    "Registration failed. Please try again."
                );

            }

        } finally {

            setLoading(false);

        }
    };

    return (

        <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-5"
        >

            {/* Full Name */}

            <Input
                label="Full Name"
                placeholder="Enter your full name"
                {...register("fullName")}
                error={errors.fullName?.message}
            />


            {/* Email */}

            <Input
                label="Email"
                type="email"
                placeholder="Enter your email"
                {...register("email")}
                error={errors.email?.message}
            />


            {/* Password */}

            <Input
                label="Password"
                type="password"
                placeholder="Create a password"
                {...register("password")}
                error={errors.password?.message}
            />


            {/* Confirm Password */}

            <Input
                label="Confirm Password"
                type="password"
                placeholder="Confirm your password"
                {...register("confirmPassword")}
                error={errors.confirmPassword?.message}
            />


            {/* Selected Role */}

            <p className="text-sm text-slate-500">

                Creating account as{" "}

                <span className="font-semibold text-blue-600">
                    {role}
                </span>

            </p>


            {/* Submit */}

            <Button
                type="submit"
                loading={loading}
            >
                Create Account
            </Button>

        </form>

    );
}