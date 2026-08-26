import { useState } from "react";
import toast from "react-hot-toast";

import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";

import {
    sendForgotPasswordOtp,
    verifyForgotPasswordOtp,
    resetPassword,
} from "../services/authService";

type Props = {
    email?: string;
    onClose: () => void;
    onSuccess: () => void;
};

type Step = "email" | "otp" | "password";

export default function ForgotPasswordModal({
                                                email = "",
                                                onClose,
                                                onSuccess,
                                            }: Props) {

    const [step, setStep] = useState<Step>(
        email ? "otp" : "email"
    );

    const [userEmail, setUserEmail] =
        useState(email);

    const [otp, setOtp] =
        useState("");

    const [token, setToken] =
        useState("");

    const [newPassword, setNewPassword] =
        useState("");

    const [confirmPassword, setConfirmPassword] =
        useState("");

    const [loading, setLoading] =
        useState(false);


    // ========================================
    // Send OTP
    // ========================================

    const handleSendOtp = async () => {

        if (!userEmail.trim()) {

            toast.error("Please enter your email.");

            return;
        }

        try {

            setLoading(true);

            await sendForgotPasswordOtp({
                email: userEmail.trim(),
            });

            toast.success(
                "OTP sent to your email."
            );

            setStep("otp");

        } catch (error: any) {

            console.error(error);

            toast.error(
                error?.response?.data?.message ||
                error?.message ||
                "Failed to send OTP."
            );

        } finally {

            setLoading(false);

        }
    };


    // ========================================
    // Verify OTP
    // ========================================

    const handleVerifyOtp = async () => {

        if (!otp.trim()) {

            toast.error("Please enter the OTP.");

            return;
        }

        if (!/^\d{6}$/.test(otp.trim())) {

            toast.error(
                "OTP must contain exactly 6 digits."
            );

            return;
        }

        try {

            setLoading(true);

            const response =
                await verifyForgotPasswordOtp({
                    email: userEmail.trim(),
                    otp: otp.trim(),
                });

            /*
             * AuthController returns the reset token
             * directly as the response body.
             */
            setToken(response);

            toast.success(
                "OTP verified successfully."
            );

            setStep("password");

        } catch (error: any) {

            console.error(error);

            toast.error(
                error?.response?.data?.message ||
                error?.message ||
                "Invalid or expired OTP."
            );

        } finally {

            setLoading(false);

        }
    };


    // ========================================
    // Reset Password
    // ========================================

    const handleResetPassword = async () => {

        if (!newPassword) {

            toast.error(
                "Please enter your new password."
            );

            return;
        }

        if (newPassword.length < 6) {

            toast.error(
                "Password must be at least 6 characters."
            );

            return;
        }

        if (newPassword !== confirmPassword) {

            toast.error(
                "Passwords do not match."
            );

            return;
        }

        if (!token) {

            toast.error(
                "Password reset session is invalid."
            );

            return;
        }

        try {

            setLoading(true);

            await resetPassword({
                token,
                newPassword,
            });

            toast.success(
                "Password reset successfully!"
            );

            onSuccess();

        } catch (error: any) {

            console.error(error);

            toast.error(
                error?.response?.data?.message ||
                error?.message ||
                "Failed to reset password."
            );

        } finally {

            setLoading(false);

        }
    };


    // ========================================
    // Modal
    // ========================================

    return (
        <div
            className="
                fixed
                inset-0
                z-50
                flex
                items-center
                justify-center
                bg-black/50
                p-4
            "
        >

            <div
                className="
                    w-full
                    max-w-md
                    rounded-2xl
                    bg-white
                    p-6
                    shadow-xl
                "
            >

                {/* Header */}

                <div className="mb-6">

                    <div className="flex items-center justify-between">

                        <h2 className="text-2xl font-bold text-slate-800">
                            Reset Password
                        </h2>

                        <button
                            type="button"
                            onClick={onClose}
                            className="
                                text-xl
                                text-slate-400
                                transition
                                hover:text-slate-700
                            "
                            aria-label="Close"
                        >
                            ×
                        </button>

                    </div>

                    <p className="mt-2 text-sm text-slate-500">
                        Reset your E-Vidyalaya password
                        securely using your registered email.
                    </p>

                </div>


                {/* ================================== */}
                {/* STEP 1 — EMAIL */}
                {/* ================================== */}

                {step === "email" && (

                    <div className="space-y-5">

                        <Input
                            label="Email"
                            type="email"
                            placeholder="Enter your registered email"
                            value={userEmail}
                            onChange={(event) =>
                                setUserEmail(
                                    event.target.value
                                )
                            }
                        />

                        <Button
                            type="button"
                            loading={loading}
                            onClick={handleSendOtp}
                        >
                            Send OTP
                        </Button>

                    </div>
                )}


                {/* ================================== */}
                {/* STEP 2 — OTP */}
                {/* ================================== */}

                {step === "otp" && (

                    <div className="space-y-5">

                        <div>
                            <p className="text-sm text-slate-500">
                                We sent a 6-digit OTP to:
                            </p>

                            <p className="mt-1 font-semibold text-slate-800">
                                {userEmail}
                            </p>
                        </div>

                        <Input
                            label="OTP"
                            type="text"
                            placeholder="Enter 6-digit OTP"
                            value={otp}
                            maxLength={6}
                            onChange={(event) =>
                                setOtp(
                                    event.target.value.replace(
                                        /\D/g,
                                        ""
                                    )
                                )
                            }
                        />

                        <Button
                            type="button"
                            loading={loading}
                            onClick={handleVerifyOtp}
                        >
                            Verify OTP
                        </Button>

                        <button
                            type="button"
                            onClick={() =>
                                setStep("email")
                            }
                            className="
                                w-full
                                text-sm
                                text-blue-600
                                hover:underline
                            "
                        >
                            Change Email
                        </button>

                    </div>
                )}


                {/* ================================== */}
                {/* STEP 3 — NEW PASSWORD */}
                {/* ================================== */}

                {step === "password" && (

                    <div className="space-y-5">

                        <p className="text-sm text-green-600">
                            OTP verified successfully.
                            You can now create a new password.
                        </p>

                        <Input
                            label="New Password"
                            type="password"
                            placeholder="Enter new password"
                            value={newPassword}
                            onChange={(event) =>
                                setNewPassword(
                                    event.target.value
                                )
                            }
                        />

                        <Input
                            label="Confirm Password"
                            type="password"
                            placeholder="Confirm new password"
                            value={confirmPassword}
                            onChange={(event) =>
                                setConfirmPassword(
                                    event.target.value
                                )
                            }
                        />

                        <Button
                            type="button"
                            loading={loading}
                            onClick={handleResetPassword}
                        >
                            Reset Password
                        </Button>

                    </div>
                )}

            </div>

        </div>
    );
}