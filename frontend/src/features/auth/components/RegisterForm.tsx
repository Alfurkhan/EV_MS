import { useEffect, useState } from "react";
import {
    CheckCircle2,
    Clock3,
    MailCheck,
} from "lucide-react";
import toast from "react-hot-toast";

import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";

import {
    registerEmailSchema,
    registerDetailsSchema,
} from "../schema/registerSchema";

import {
    checkEmailExists,
    sendRegistrationOtp,
    verifyRegistrationOtp,
    register as registerUser,
} from "../services/authService";

import TermsAndConditionsModal from "./TermsAndConditionsModal";

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

const RESEND_COOLDOWN_SECONDS = 30;

export default function RegisterForm({
                                         role,
                                         onSuccess,
                                     }: Props) {

    /*
     * ============================================================
     * FORM STATE
     * ============================================================
     */

    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");

    const [otpSent, setOtpSent] = useState(false);
    const [emailVerified, setEmailVerified] = useState(false);

    const [loading, setLoading] = useState(false);

    const [fullName, setFullName] = useState("");
    const [countryCode, setCountryCode] = useState("+91");
    const [phoneNumber, setPhoneNumber] = useState("");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] =
        useState("");

    const [showTermsModal, setShowTermsModal] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);

    const [registrationSuccess, setRegistrationSuccess] =
        useState(false);


    /*
     * ============================================================
     * RESEND OTP STATE
     * ============================================================
     */

    const [resendCooldown, setResendCooldown] =
        useState(0);


    /*
     * ============================================================
     * RESEND OTP COUNTDOWN
     * ============================================================
     */

    useEffect(() => {

        if (resendCooldown <= 0) {
            return;
        }

        const timer = window.setInterval(() => {

            setResendCooldown((current) =>
                current > 0
                    ? current - 1
                    : 0
            );

        }, 1000);

        return () => {
            window.clearInterval(timer);
        };

    }, [resendCooldown]);


    /*
     * ============================================================
     * SEND OTP
     * ============================================================
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

        const normalizedEmail =
            email.trim().toLowerCase();

        try {

            setLoading(true);

            const emailCheck =
                await checkEmailExists({
                    email: normalizedEmail,
                });

            if (emailCheck.userExist) {

                const formattedRole =
                    formatRole(
                        emailCheck.role
                    );

                toast.error(
                    `This email is already registered as ${formattedRole}.`
                );

                return;
            }

            await sendRegistrationOtp({
                email: normalizedEmail,
            });

            setEmail(normalizedEmail);
            setOtp("");
            setOtpSent(true);
            setEmailVerified(false);

            setResendCooldown(
                RESEND_COOLDOWN_SECONDS
            );

            toast.success(
                "Verification code sent to your email."
            );

        } catch (error: any) {

            console.error(error);

            toast.error(
                error?.response?.data?.message ||
                error?.message ||
                "Failed to check email or send verification code."
            );

        } finally {

            setLoading(false);

        }
    };


    /*
     * ============================================================
     * RESEND OTP
     * ============================================================
     */

    const handleResendOtp = async () => {

        if (resendCooldown > 0) {
            return;
        }

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

        const normalizedEmail =
            email.trim().toLowerCase();

        try {

            setLoading(true);

            const emailCheck =
                await checkEmailExists({
                    email: normalizedEmail,
                });

            if (emailCheck.userExist) {

                const formattedRole =
                    formatRole(
                        emailCheck.role
                    );

                toast.error(
                    `This email is already registered as ${formattedRole}.`
                );

                return;
            }

            await sendRegistrationOtp({
                email: normalizedEmail,
            });

            /*
             * The newly generated OTP is now
             * the active verification OTP.
             */
            setOtp("");

            setEmailVerified(false);

            setResendCooldown(
                RESEND_COOLDOWN_SECONDS
            );

            toast.success(
                "A new verification code has been sent."
            );

        } catch (error: any) {

            console.error(error);

            toast.error(
                error?.response?.data?.message ||
                error?.message ||
                "Failed to resend verification code."
            );

        } finally {

            setLoading(false);

        }
    };


    /*
     * ============================================================
     * VERIFY OTP
     * ============================================================
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
                email:
                    email.trim().toLowerCase(),

                otp,
            });

            setEmailVerified(true);

            toast.success(
                "Email verified successfully."
            );

        } catch (error: any) {

            console.error(error);

            setEmailVerified(false);

            toast.error(
                error?.response?.data?.message ||
                error?.response?.data?.errorCode ||
                "Invalid or expired OTP."
            );

        } finally {

            setLoading(false);

        }
    };


    /*
     * ============================================================
     * EMAIL CHANGE
     * ============================================================
     */

    const handleEmailChange = (
        value: string
    ) => {

        setEmail(value);

        setEmailVerified(false);

        setOtpSent(false);
        setOtp("");

        setResendCooldown(0);
    };


    /*
     * ============================================================
     * CREATE ACCOUNT
     * ============================================================
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

        if (!emailVerified) {

            toast.error(
                "Please verify your email before creating your account."
            );

            return;
        }

        if (!termsAccepted) {

            toast.error(
                "Please accept the Terms & Conditions to continue."
            );

            return;
        }

        try {

            setLoading(true);

            await registerUser({

                fullName:
                    fullName.trim(),

                email:
                    email.trim().toLowerCase(),

                countryCode:
                    countryCode.trim(),

                phoneNumber:
                    phoneNumber.trim(),

                password,

                platform:
                    "NONE",

                roleName:
                    roleMap[role],

                termsAccepted,
            });


            /*
             * IMPORTANT:
             *
             * We no longer show a toast here.
             *
             * Registration success will be shown
             * using the in-app success dialog.
             */

            setRegistrationSuccess(true);

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
     * ============================================================
     * REGISTRATION SUCCESS
     * ============================================================
     */

    if (registrationSuccess) {

        return (

            <div
                className="
                    fixed
                    inset-0
                    z-[60]
                    flex
                    items-center
                    justify-center
                    bg-black/40
                    p-4
                    backdrop-blur-sm
                "
            >

                <div
                    className="
                        w-full
                        max-w-md
                        rounded-3xl
                        bg-white
                        p-8
                        text-center
                        shadow-2xl
                    "
                >

                    {/* SUCCESS ICON */}

                    <div
                        className="
                            mx-auto
                            flex
                            h-20
                            w-20
                            items-center
                            justify-center
                            rounded-full
                            bg-green-100
                            text-green-600
                        "
                    >

                        <CheckCircle2
                            size={42}
                            strokeWidth={2}
                        />

                    </div>


                    {/* TITLE */}

                    <h2
                        className="
                            mt-6
                            text-2xl
                            font-bold
                            text-slate-800
                        "
                    >
                        Registration Successful
                    </h2>


                    {/* MESSAGE */}

                    <p
                        className="
                            mx-auto
                            mt-3
                            max-w-sm
                            text-sm
                            leading-6
                            text-slate-500
                        "
                    >
                        Your E-Vidyalaya account has
                        been created successfully.
                        You can now sign in using your
                        registered email and password.
                    </p>


                    {/* EMAIL */}

                    <div
                        className="
                            mt-5
                            flex
                            items-center
                            justify-center
                            gap-2
                            rounded-xl
                            bg-slate-50
                            px-4
                            py-3
                            text-sm
                            text-slate-600
                        "
                    >

                        <MailCheck
                            size={17}
                            className="text-blue-600"
                        />

                        <span className="truncate">
                            {email}
                        </span>

                    </div>


                    {/* GO TO SIGN IN */}

                    <Button
                        type="button"
                        className="mt-6"
                        onClick={() =>
                            onSuccess?.(
                                email.trim().toLowerCase()
                            )
                        }
                    >
                        Go to Sign In
                    </Button>

                </div>

            </div>
        );
    }


    /*
     * ============================================================
     * REGISTRATION FORM
     * ============================================================
     */

    return (

        <div className="space-y-5">

            {/* HEADER */}

            <div>

                <h3
                    className="
                        text-lg
                        font-semibold
                        text-slate-800
                    "
                >
                    Create your account
                </h3>

                <p
                    className="
                        mt-1
                        text-sm
                        text-slate-500
                    "
                >
                    Complete your details to create
                    your E-Vidyalaya account.
                </p>

            </div>


            {/* FULL NAME */}

            <Input
                label="Full Name"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(event) =>
                    setFullName(
                        event.target.value
                    )
                }
            />


            {/* EMAIL */}

            <div>

                <label
                    className="
                        block
                        mb-1.5
                        text-sm
                        font-medium
                        text-slate-700
                    "
                >
                    Email
                </label>

                <div className="flex gap-2">

                    <input
                        type="email"
                        value={email}
                        onChange={(event) =>
                            handleEmailChange(
                                event.target.value
                            )
                        }
                        placeholder="Enter your email"
                        disabled={
                            loading ||
                            emailVerified
                        }
                        className="
                            min-w-0
                            flex-1
                            h-14
                            rounded-xl
                            border
                            border-slate-200
                            bg-white
                            px-4
                            text-sm
                            text-slate-700
                            outline-none
                            transition
                            focus:border-blue-500
                            focus:ring-2
                            focus:ring-blue-100
                            disabled:bg-slate-50
                            disabled:text-slate-500
                        "
                    />


                    {!emailVerified && (

                        <Button
                            type="button"
                            loading={
                                loading
                            }
                            loadingText={
                                otpSent
                                    ? "Sending..."
                                    : "Sending..."
                            }
                            onClick={
                                otpSent
                                    ? handleResendOtp
                                    : handleSendOtp
                            }
                            disabled={
                                loading ||
                                (
                                    otpSent &&
                                    resendCooldown > 0
                                )
                            }
                            className="
                                !w-auto
                                shrink-0
                                px-5
                                text-sm
                            "
                        >
                            {otpSent
                                ? resendCooldown > 0
                                    ? `Resend (${resendCooldown}s)`
                                    : "Resend OTP"
                                : "Send OTP"
                            }
                        </Button>

                    )}

                </div>

            </div>


            {/* OTP */}

            {otpSent && !emailVerified && (

                <div>

                    <label
                        className="
                            block
                            mb-1.5
                            text-sm
                            font-medium
                            text-slate-700
                        "
                    >
                        Verification OTP
                    </label>

                    <div className="flex gap-2">

                        <input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            value={otp}
                            onChange={(event) =>
                                setOtp(
                                    event.target.value.replace(
                                        /\D/g,
                                        ""
                                    )
                                )
                            }
                            placeholder="Enter 6-digit OTP"
                            disabled={loading}
                            className="
                                min-w-0
                                flex-1
                                h-14
                                rounded-xl
                                border
                                border-slate-200
                                bg-white
                                px-4
                                text-sm
                                text-slate-700
                                outline-none
                                tracking-[0.25em]
                                transition
                                focus:border-blue-500
                                focus:ring-2
                                focus:ring-blue-100
                            "
                        />

                        <Button
                            type="button"
                            loading={loading}
                            loadingText="Verifying..."
                            onClick={handleVerifyOtp}
                            className="
                                !w-auto
                                shrink-0
                                px-5
                                text-sm
                            "
                        >
                            Verify
                        </Button>

                    </div>


                    <div
                        className="
                            mt-2
                            flex
                            items-center
                            gap-1.5
                            text-xs
                            text-slate-500
                        "
                    >

                        <Clock3 size={13} />

                        <span>
                            Enter the 6-digit code sent
                            to your email.
                        </span>

                    </div>

                </div>

            )}


            {/* VERIFIED EMAIL */}

            {emailVerified && (

                <div>

                    <div
                        className="
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
                        "
                    >

                        <span
                            className="
                                min-w-0
                                truncate
                                text-sm
                                text-slate-700
                            "
                        >
                            {email}
                        </span>

                        <span
                            className="
                                shrink-0
                                text-xs
                                font-semibold
                                text-green-600
                            "
                        >
                            ✓ Verified
                        </span>

                    </div>


                    <button
                        type="button"
                        disabled={loading}
                        onClick={() => {

                            setEmailVerified(false);
                            setOtpSent(false);
                            setTermsAccepted(false);
                            setOtp("");
                            setResendCooldown(0);

                        }}
                        className="
                            mt-2
                            text-sm
                            font-medium
                            text-blue-600
                            hover:underline
                            disabled:cursor-not-allowed
                            disabled:opacity-50
                        "
                    >
                        Change email
                    </button>

                </div>

            )}


            {/* PHONE */}

            <div>

                <label
                    className="
                        block
                        mb-1.5
                        text-sm
                        font-medium
                        text-slate-700
                    "
                >
                    Phone Number
                </label>

                <div
                    className="
                        flex
                        overflow-hidden
                        rounded-xl
                        border
                        border-slate-200
                        bg-white
                        focus-within:border-blue-500
                        focus-within:ring-2
                        focus-within:ring-blue-100
                    "
                >

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
                        placeholder="10-digit mobile number"
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
                    setPassword(
                        event.target.value
                    )
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

            <p
                className="
                    text-sm
                    text-slate-500
                "
            >
                Creating account as{" "}

                <span
                    className="
                        font-semibold
                        text-blue-600
                    "
                >
                    {role}
                </span>
            </p>


            {/* TERMS */}

            <label
                className="
                    flex
                    cursor-pointer
                    items-start
                    gap-3
                    text-sm
                    text-slate-600
                "
            >

                <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(event) =>
                        setTermsAccepted(
                            event.target.checked
                        )
                    }
                    disabled={loading}
                    className="
                        mt-0.5
                        h-4
                        w-4
                        shrink-0
                        cursor-pointer
                        accent-blue-600
                    "
                />

                <span>

                    I agree to the{" "}

                    <button
                        type="button"
                        onClick={(event) => {
                            event.preventDefault();
                            setShowTermsModal(true);
                        }}
                        className="
                            font-medium
                            text-blue-600
                            hover:underline
                        "
                    >
                        Terms & Conditions
                    </button>

                    {" "}of E-Vidyalaya.

                </span>

            </label>


            {/* CREATE ACCOUNT */}

            <Button
                type="button"
                loading={loading}
                loadingText="Creating Account..."
                onClick={handleRegister}
                disabled={
                    !emailVerified ||
                    !termsAccepted
                }
            >
                Create Account
            </Button>


            {/* TERMS MODAL */}

            {showTermsModal && (

                <TermsAndConditionsModal
                    onAccept={() => {
                        setTermsAccepted(true);
                        setShowTermsModal(false);
                    }}
                    onClose={() => {
                        setShowTermsModal(false);
                    }}
                />

            )}

        </div>
    );


    /*
     * ============================================================
     * ROLE FORMATTING
     * ============================================================
     */

    function formatRole(
        role: string | null | undefined
    ) {

        if (!role) {
            return "another account";
        }

        return role
            .replace(
                /^ROLE_/,
                ""
            )
            .replace(
                /_/g,
                " "
            )
            .toLowerCase()
            .replace(
                /\b\w/g,
                (char) =>
                    char.toUpperCase()
            );
    }
}