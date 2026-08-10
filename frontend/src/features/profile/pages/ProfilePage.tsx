import Toast from "../../../components/common/Toast";
import EditProfileModal from "../components/EditProfileModal";
import { useEffect, useState } from "react";

import ProfileCard from "../components/ProfileCard";
import ProfileInfo from "../components/ProfileInfo";

import { getProfile } from "../services/profileService";

import type { Profile } from "../types/profile";

export default function ProfilePage() {

    const [profile, setProfile] = useState<Profile | null>(null);

    const [open, setOpen] = useState(false);

    const [toast, setToast] = useState<{
        type: "success" | "error";
        message: string;
    } | null>(null);

    useEffect(() => {

        getProfile()
            .then(setProfile)
            .catch(console.error);

    }, []);

    if (!profile) {

        return (
            <div className="text-center mt-20">
                Loading Profile...
            </div>
        );

    }

    return (

        <div className="max-w-5xl mx-auto">

            <ProfileCard
                profile={profile}
                onEdit={() => setOpen(true)}
            />

            <ProfileInfo
                profile={profile}
            />

            {open && (

                <EditProfileModal
                    profile={profile}
                    onClose={() => setOpen(false)}
                    onUpdated={(updatedProfile) => {

                        setProfile((currentProfile) => ({
                            ...currentProfile,
                            ...updatedProfile,
                        }));

                        setToast({
                            type: "success",
                            message: "Your profile information has been saved.",
                        });

                    }}
                    onError={(message) => {

                        setToast({
                            type: "error",
                            message,
                        });

                    }}
                />

            )}

            {toast && (
                <Toast
                    type={toast.type}
                    message={toast.message}
                    onClose={() => setToast(null)}
                />
            )}

        </div>

    );

}