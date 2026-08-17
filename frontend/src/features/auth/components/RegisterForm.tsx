import { useState } from "react";
import toast from "react-hot-toast";

import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";

import OtpInput from "./OtpInput";

import {
    registerEmailSchema,
    registerDetailsSchema,
} from "../schema/registerSchema";

import {
    sendRegistrationOtp,
    verifyRegistrationOtp,
    register as registerUser,
} from "../services/authService";

type Props = {
    role: string;
    onSuccess?: (email: string) => void;
};

const roleMap: Record<
    string,
    "ROLE_STUDENT" | "ROLE_FACULTY" | "ROLE_ADMIN"
> = {
    Student: "ROLE_STUDENT",
    Faculty: "ROLE_FACULTY",
    Admin: "ROLE_ADMIN",
};

type Step =
    | "email"
    | "otp"
    | "details"
    | "success";

export default function RegisterForm({
                                         role,
                                         onSuccess,
                                     }: Props) {

    const [step, setStep] =
        useState<Step>("email");

    const [email, setEmail] =
        useState("");

    const [otp, setOtp] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    const [fullName, setFullName] =
        useState("");

    const [countryCode, setCountryCode] =
        useState("+91");

    const [phoneNumber, setPhoneNumber] =
        useState("");

    const [password, setPassword] =
        useState("");

    const [confirmPassword, setConfirmPassword] =
        useState("");

    /*
     * STEP 1
     * Send registration OTP
     */
    const handleSendOtp = async () => {

        const result =
            registerEmailSchema.safeParse({
                email,
            });

        if (!result.success) {

            toast.error(
                result.error.issues[0].message
            );

            return;
        }

        try {

            setLoading(true);

            await sendRegistrationOtp({
                email: email.trim().toLowerCase(),
            });

            toast.success(
                "Verification code sent to your email."
            );

            setStep("otp");

        } catch (error: any) {

            console.error(error);

            toast.error(
                error?.response?.data?.errorCode ||
                error?.response?.data?.message ||
                "Failed to send verification code."
            );

        } finally {

            setLoading(false);

        }
    };


    /*
     * STEP 2
     * Verify OTP
     */
    const handleVerifyOtp = async () => {

        if (!/^\d{6}$/.test(otp)) {

            toast.error(
                "Please enter the 6-digit OTP."
            );

            return;
        }

        try {

            setLoading(true);

            await verifyRegistrationOtp({
                email: email.trim().toLowerCase(),
                otp,
            });

            toast.success(
                "Email verified successfully."
            );

            setStep("details");

        } catch (error: any) {

            console.error(error);

            toast.error(
                error?.response?.data?.errorCode ||
                error?.response?.data?.message ||
                "Invalid or expired OTP."
            );

        } finally {

            setLoading(false);

        }
    };


    /*
     * STEP 3
     * Create account
     */
    const handleRegister = async () => {

        const result =
            registerDetailsSchema.safeParse({
                fullName,
                countryCode,
                phoneNumber,
                password,
                confirmPassword,
            });

        if (!result.success) {

            toast.error(
                result.error.issues[0].message
            );

            return;
        }

        try {

            setLoading(true);

            await registerUser({
                fullName: fullName.trim(),
                email: email.trim().toLowerCase(),
                countryCode: countryCode.trim(),
                phoneNumber: phoneNumber.trim(),
                password,
                platform: "NONE",
                roleName: roleMap[role],
            });

            toast.success(
                "Registration successful!"
            );

            setStep("success");

            onSuccess?.(email);

        } catch (error: any) {

            console.error(error);

            toast.error(
                error?.response?.data?.errorCode ||
                error?.response?.data?.message ||
                "Registration failed. Please try again."
            );

        } finally {

            setLoading(false);

        }
    };


    /*
     * EMAIL STEP
     */
    if (step === "email") {

        return (

            <div className="space-y-5">

                <div>

                    <h3 className="
                        text-lg
                        font-semibold
                        text-slate-800
                    ">
                        Verify your email
                    </h3>

                    <p className="
                        mt-1
                        text-sm
                        text-slate-500
                    ">
                        We'll send a 6-digit verification
                        code to your email.
                    </p>

                </div>

                <Input
                    label="Email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(event) =>
                        setEmail(event.target.value)
                    }
                />

                <p className="
                    text-sm
                    text-slate-500
                ">
                    Creating account as{" "}

                    <span className="
                        font-semibold
                        text-blue-600
                    ">
                        {role}
                    </span>
                </p>

                <Button
                    type="button"
                    loading={loading}
                    loadingText="Sending OTP..."
                    onClick={handleSendOtp}
                >
                    Send Verification Code
                </Button>

            </div>
        );
    }


    /*
     * OTP STEP
     */
    if (step === "otp") {

        return (

            <div className="space-y-5">

                <div>

                    <h3 className="
                        text-lg
                        font-semibold
                        text-slate-800
                    ">
                        Verify your email
                    </h3>

                    <p className="
                        mt-1
                        text-sm
                        text-slate-500
                    ">
                        Enter the 6-digit code sent to
                    </p>

                    <p className="
                        mt-1
                        font-medium
                        text-blue-600
                        break-all
                    ">
                        {email}
                    </p>

                </div>

                <OtpInput
                    value={otp}
                    onChange={setOtp}
                    disabled={loading}
                />

                <Button
                    type="button"
                    loading={loading}
                    loadingText="Verifying..."
                    onClick={handleVerifyOtp}
                >
                    Verify Email
                </Button>

                <button
                    type="button"
                    disabled={loading}
                    onClick={() => {
                        setOtp("");
                        setStep("email");
                    }}
                    className="
                        w-full
                        text-sm
                        text-slate-500
                        hover:text-blue-600
                    "
                >
                    Change email
                </button>

            </div>
        );
    }


    /*
     * DETAILS STEP
     */
    if (step === "details") {

        return (

            <div className="space-y-5">

                <div>

                    <h3 className="
                        text-lg
                        font-semibold
                        text-slate-800
                    ">
                        Create your account
                    </h3>

                    <p className="
                        mt-1
                        text-sm
                        text-slate-500
                    ">
                        Your email has been verified.
                    </p>

                </div>


                {/* FULL NAME */}

                <Input
                    label="Full Name"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(event) =>
                        setFullName(event.target.value)
                    }
                />


                {/* VERIFIED EMAIL */}

                <div>

                    <label className="
                        block
                        mb-1.5
                        text-sm
                        font-medium
                        text-slate-700
                    ">
                        Email
                    </label>

                    <div className="
                        flex
                        items-center
                        justify-between
                        gap-3
                        rounded-xl
                        border
                        border-green-200
                        bg-green-50
                        px-4
                        py-3
                    ">

                        <span className="
                            text-sm
                            text-slate-700
                            truncate
                        ">
                            {email}
                        </span>

                        <span className="
                            shrink-0
                            text-xs
                            font-semibold
                            text-green-600
                        ">
                            ✓ Verified
                        </span>

                    </div>

                </div>


                {/* PHONE */}

                <div>

                    <label className="
                        block
                        mb-1.5
                        text-sm
                        font-medium
                        text-slate-700
                    ">
                        Phone Number
                    </label>

                    <div className="
                        flex
                        rounded-xl
                        border
                        border-slate-200
                        bg-white
                        overflow-hidden
                        focus-within:border-blue-500
                        focus-within:ring-2
                        focus-within:ring-blue-100
                    ">

                        <input
                            type="text"
                            value={countryCode}
                            onChange={(event) =>
                                setCountryCode(
                                    event.target.value
                                )
                            }
                            placeholder="+91"
                            className="
                                w-20
                                shrink-0
                                border-r
                                border-slate-200
                                px-3
                                py-3
                                text-sm
                                text-slate-700
                                outline-none
                            "
                        />

                        <input
                            type="tel"
                            value={phoneNumber}
                            onChange={(event) =>
                                setPhoneNumber(
                                    event.target.value
                                )
                            }
                            placeholder="Phone number"
                            className="
                                min-w-0
                                flex-1
                                px-3
                                py-3
                                text-sm
                                text-slate-700
                                outline-none
                            "
                        />

                    </div>

                </div>


                {/* PASSWORD */}

                <Input
                    label="Password"
                    type="password"
                    placeholder="Create a password"
                    value={password}
                    onChange={(event) =>
                        setPassword(event.target.value)
                    }
                />


                {/* CONFIRM PASSWORD */}

                <Input
                    label="Confirm Password"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(event) =>
                        setConfirmPassword(
                            event.target.value
                        )
                    }
                />


                {/* ROLE */}

                <p className="
                    text-sm
                    text-slate-500
                ">
                    Creating account as{" "}

                    <span className="
                        font-semibold
                        text-blue-600
                    ">
                        {role}
                    </span>
                </p>


                <Button
                    type="button"
                    loading={loading}
                    loadingText="Creating Account..."
                    onClick={handleRegister}
                >
                    Create Account
                </Button>

            </div>
        );
    }


    /*
     * SUCCESS STEP
     */
    return (

        <div className="
            py-6
            text-center
        ">

            <div className="
                mx-auto
                mb-5
                flex
                h-16
                w-16
                items-center
                justify-center
                rounded-full
                bg-green-100
                text-3xl
                text-green-600
            ">
                ✓
            </div>

            <h3 className="
                text-xl
                font-bold
                text-slate-800
            ">
                Account Created!
            </h3>

            <p className="
                mt-2
                text-sm
                leading-6
                text-slate-500
            ">
                Your E-Vidyalaya account has been
                successfully created.
                You can now sign in using your
                verified email and password.
            </p>

            <Button
                type="button"
                className="mt-6"
                onClick={() =>
                    onSuccess?.(email)
                }
            >
                Go to Sign In
            </Button>

        </div>
    );
}