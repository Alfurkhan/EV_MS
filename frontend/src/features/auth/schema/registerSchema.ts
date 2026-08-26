import { z } from "zod";

export const registerEmailSchema = z.object({
    email: z
        .string()
        .email("Please enter a valid email address"),
});

export const registerOtpSchema = z.object({
    otp: z
        .string()
        .regex(/^\d{6}$/, "OTP must be exactly 6 digits"),
});

export const registerDetailsSchema = z
    .object({
        fullName: z
            .string()
            .min(4, "Full name must be at least 4 characters")
            .max(200, "Full name is too long")
            .regex(
                /^[A-Za-z ]+$/,
                "Full name can contain only letters and spaces"
            ),

        countryCode: z
            .string()
            .min(1, "Country code is required")
            .max(10, "Invalid country code"),

        phoneNumber: z
            .string()
            .regex(
                /^\d{10}$/,
                "Please enter a valid 10-digit mobile number."
            ),

        password: z
            .string()
            .min(6, "Password must be at least 6 characters")
            .regex(
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/,
                "Password must include uppercase, lowercase, number and special character"
            ),

        confirmPassword: z
            .string()
            .min(1, "Please confirm your password"),
    })
    .refine(
        (data) => data.password === data.confirmPassword,
        {
            message: "Passwords do not match",
            path: ["confirmPassword"],
        }
    );

export type RegisterDetailsFormData =
    z.infer<typeof registerDetailsSchema>;