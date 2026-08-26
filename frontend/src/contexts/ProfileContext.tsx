import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react";

import { getProfile } from "../features/auth/services/profileService";
import { useAuth } from "./AuthContext";

type Profile = {
    id: number;
    fullName: string;
    email: string;
    countryCode: string | null;
    phoneNumber: string | null;
    createdAt: string;
    updatedAt: string;
    lastLoginAt: string;
    accountEnabled: boolean;

    termPolicyViewed: boolean;
};

type ProfileContextType = {
    profile: Profile | null;
    loading: boolean;
    refreshProfile: () => Promise<void>;
};

const ProfileContext = createContext<ProfileContextType | null>(null);

export function ProfileProvider({
                                    children,
                                }: {
    children: ReactNode;
}) {

    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    const { isAuthenticated, loading: authLoading } = useAuth();


    const refreshProfile = async () => {

        if (!isAuthenticated) {
            setProfile(null);
            setLoading(false);
            return;
        }

        try {

            setLoading(true);

            const data = await getProfile();

            setProfile(data);

        } catch (error) {

            console.error(error);

            setProfile(null);

        } finally {

            setLoading(false);

        }
    };


    useEffect(() => {

        // Wait until AuthProvider finishes
        // checking localStorage.
        if (authLoading) {
            return;
        }

        // Only request profile when authenticated.
        if (isAuthenticated) {
            refreshProfile();
        } else {
            setProfile(null);
            setLoading(false);
        }

    }, [isAuthenticated, authLoading]);


    return (
        <ProfileContext.Provider
            value={{
                profile,
                loading,
                refreshProfile,
            }}
        >
            {children}
        </ProfileContext.Provider>
    );
}


export function useProfile() {

    const context = useContext(ProfileContext);

    if (!context) {
        throw new Error(
            "useProfile must be used inside ProfileProvider"
        );
    }

    return context;
}