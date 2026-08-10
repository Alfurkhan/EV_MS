import { useState } from "react";
import {
    User,
    Phone,
    Globe,
    Mail,
    X,
    Save,
} from "lucide-react";

import type { Profile } from "../types/profile";
import { updateProfile } from "../../auth/services/profileService";

type Props = {
    profile: Profile;
    onClose: () => void;
    onUpdated?: (profile: Profile) => void;
    onError?: (message: string) => void;
};

export default function EditProfileModal({
                                             profile,
                                             onClose,
                                             onUpdated,
                                             onError,
                                         }: Props) {

    const [fullName, setFullName] = useState(profile.fullName);

    const [countryCode, setCountryCode] = useState(
        profile.countryCode ?? ""
    );

    const [phoneNumber, setPhoneNumber] = useState(
        profile.phoneNumber ?? ""
    );

    const [loading, setLoading] = useState(false);

    const [errors, setErrors] = useState<{
        fullName?: string;
        countryCode?: string;
        phoneNumber?: string;
    }>({});

    const hasChanges =
        fullName !== profile.fullName ||
        countryCode !== (profile.countryCode ?? "") ||
        phoneNumber !== (profile.phoneNumber ?? "");

    const handleSave = async () => {

        const newErrors: {
            fullName?: string;
            countryCode?: string;
            phoneNumber?: string;
        } = {};

        if (!fullName.trim()) {
            newErrors.fullName = "Full name is required.";
        }

        if (countryCode && !/^\+\d{1,4}$/.test(countryCode)) {
            newErrors.countryCode =
                "Enter a valid country code, for example +91.";
        }

        if (phoneNumber && !/^\d{7,15}$/.test(phoneNumber)) {
            newErrors.phoneNumber =
                "Enter a valid phone number.";
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            return;
        }

        try {

            setLoading(true);

            const updatedProfile = await updateProfile({
                fullName: fullName.trim(),
                countryCode: countryCode.trim(),
                phoneNumber: phoneNumber.trim(),
            });

            onUpdated?.(updatedProfile);

            onClose();

        } catch (error) {

            console.error(error);

            onError?.("Failed to update your profile. Please try again.");

        } finally {

            setLoading(false);

        }
    };

    return (

        <div
            className="
                fixed
                inset-0
                bg-black/40
                backdrop-blur-sm
                flex
                items-center
                justify-center
                z-50
                p-4
            "
        >

            <div
                className="
                    bg-white
                    w-full
                    max-w-lg
                    rounded-2xl
                    shadow-2xl
                    overflow-hidden
                "
            >

                {/* Header */}

                <div
                    className="
                        flex
                        items-center
                        justify-between
                        px-6
                        py-5
                        border-b
                    "
                >

                    <div>

                        <h2 className="text-xl font-bold text-slate-800">
                            Edit Profile
                        </h2>

                        <p className="text-sm text-slate-500 mt-1">
                            Update your personal information
                        </p>

                    </div>

                    <button
                        onClick={onClose}
                        className="
                            p-2
                            rounded-lg
                            text-slate-500
                            hover:bg-slate-100
                            hover:text-slate-800
                            transition
                        "
                    >
                        <X size={20} />
                    </button>

                </div>

                {/* Form */}

                <div className="p-6 space-y-6">

                    {/* Full Name */}

                    <div>

                        <label className="text-sm font-medium text-slate-700">
                            Full Name
                        </label>

                        <div className="relative mt-2">

                            <User
                                size={18}
                                className="
                                    absolute
                                    left-3
                                    top-1/2
                                    -translate-y-1/2
                                    text-slate-400
                                "
                            />

                            <input
                                value={fullName}
                                onChange={(e) =>
                                    setFullName(e.target.value)
                                }
                                className="
                                    w-full
                                    border
                                    border-slate-300
                                    rounded-xl
                                    pl-10
                                    pr-4
                                    py-3
                                    outline-none
                                    focus:border-blue-500
                                    focus:ring-2
                                    focus:ring-blue-100
                                    transition
                                "
                            />

                        </div>

                        {errors.fullName && (
                            <p className="text-sm text-red-500 mt-2">
                                {errors.fullName}
                            </p>
                        )}

                    </div>

                    {/* Email */}

                    <div>

                        <label className="text-sm font-medium text-slate-700">
                            Email
                        </label>

                        <div className="relative mt-2">

                            <Mail
                                size={18}
                                className="
                                    absolute
                                    left-3
                                    top-1/2
                                    -translate-y-1/2
                                    text-slate-400
                                "
                            />

                            <input
                                value={profile.email}
                                disabled
                                className="
                                    w-full
                                    bg-slate-100
                                    border
                                    border-slate-200
                                    rounded-xl
                                    pl-10
                                    pr-4
                                    py-3
                                    text-slate-500
                                    cursor-not-allowed
                                "
                            />

                        </div>

                        <p className="text-xs text-slate-400 mt-2">
                            Email changes will require verification.
                        </p>

                    </div>

                    {/* Contact */}

                    <div>

                        <h3 className="text-sm font-semibold text-slate-800 mb-3">
                            Contact Information
                        </h3>

                        <div className="grid grid-cols-3 gap-3">

                            {/* Country Code */}

                            <div>

                                <label className="text-xs text-slate-500">
                                    Country Code
                                </label>

                                <div className="relative mt-1">

                                    <Globe
                                        size={16}
                                        className="
                                            absolute
                                            left-3
                                            top-1/2
                                            -translate-y-1/2
                                            text-slate-400
                                        "
                                    />

                                    <input
                                        type="text"
                                        value={countryCode}
                                        onChange={(e) =>
                                            setCountryCode(
                                                e.target.value
                                            )
                                        }
                                        className="
                                            w-full
                                            border
                                            border-slate-300
                                            rounded-xl
                                            pl-9
                                            pr-2
                                            py-3
                                            outline-none
                                            focus:border-blue-500
                                            focus:ring-2
                                            focus:ring-blue-100
                                        "
                                    />

                                </div>

                                {errors.countryCode && (
                                    <p className="text-sm text-red-500 mt-2">
                                        {errors.countryCode}
                                    </p>
                                )}

                            </div>

                            {/* Phone */}

                            <div className="col-span-2">

                                <label className="text-xs text-slate-500">
                                    Phone Number
                                </label>

                                <div className="relative mt-1">

                                    <Phone
                                        size={16}
                                        className="
                                            absolute
                                            left-3
                                            top-1/2
                                            -translate-y-1/2
                                            text-slate-400
                                        "
                                    />

                                    <input
                                        type="tel"
                                        value={phoneNumber}
                                        onChange={(e) =>
                                            setPhoneNumber(
                                                e.target.value
                                            )
                                        }
                                        className="
                                            w-full
                                            border
                                            border-slate-300
                                            rounded-xl
                                            pl-9
                                            pr-3
                                            py-3
                                            outline-none
                                            focus:border-blue-500
                                            focus:ring-2
                                            focus:ring-blue-100
                                        "
                                    />

                                </div>

                                {errors.phoneNumber && (
                                    <p className="text-sm text-red-500 mt-2">
                                        {errors.phoneNumber}
                                    </p>
                                )}

                            </div>

                        </div>

                    </div>

                </div>

                {/* Footer */}

                <div
                    className="
                        flex
                        justify-end
                        gap-3
                        px-6
                        py-4
                        bg-slate-50
                        border-t
                    "
                >

                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="
                            px-5
                            py-2.5
                            rounded-xl
                            border
                            border-slate-300
                            text-slate-700
                            hover:bg-white
                            transition
                        "
                    >
                        Cancel
                    </button>

                    <button
                        onClick={handleSave}
                        disabled={loading || !hasChanges}
                        className="
                            flex
                            items-center
                            gap-2
                            px-5
                            py-2.5
                            rounded-xl
                            bg-blue-600
                            text-white
                            hover:bg-blue-700
                            active:scale-[0.98]
                            disabled:opacity-50
                            disabled:cursor-not-allowed
                            transition
                        "
                    >

                        <Save size={17} />

                        {loading
                            ? "Saving..."
                            : "Save Changes"}

                    </button>

                </div>

            </div>

        </div>

    );
}