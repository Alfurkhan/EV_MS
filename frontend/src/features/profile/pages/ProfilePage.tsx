import { useEffect, useState } from "react";

import ProfileCard from "../components/ProfileCard";

import { getProfile } from "../services/profileService";

import type { Profile } from "../types/profile";

export default function ProfilePage() {

    const [profile, setProfile] = useState<Profile | null>(null);

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
        <ProfileCard profile={profile} />
    );
}