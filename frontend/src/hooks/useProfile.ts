import { useEffect, useState } from "react";
import { getProfile } from "../features/auth/services/profileService";

export function useProfile() {
    const [profile, setProfile] = useState<any>(null);

    useEffect(() => {
        getProfile()
            .then(setProfile)
            .catch(console.error);
    }, []);

    return profile;
}