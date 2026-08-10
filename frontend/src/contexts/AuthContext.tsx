import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react";

type Role =
    | "ROLE_STUDENT"
    | "ROLE_FACULTY"
    | "ROLE_ADMIN";

type User = {
    accessToken: string;
    refreshToken: string;
    roles: Role[];
} | null;

type AuthContextType = {
    user: User;

    login: (
        accessToken: string,
        refreshToken: string,
        roles: Role[]
    ) => void;

    logout: () => void;

    hasRole: (role: Role) => boolean;

    isAuthenticated: boolean;
    loading: boolean;
};

const AuthContext =
    createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({
                                 children,
                             }: {
    children: ReactNode;
}) {

    const [user, setUser] = useState<User>(null);

    const [loading, setLoading] = useState(true);


    /*
     * Restore authentication state
     * after refreshing the browser.
     */
    useEffect(() => {

        const accessToken =
            localStorage.getItem("accessToken");

        const refreshToken =
            localStorage.getItem("refreshToken");

        const storedRoles =
            localStorage.getItem("roles");


        if (
            accessToken &&
            refreshToken &&
            storedRoles
        ) {

            try {

                const roles: Role[] =
                    JSON.parse(storedRoles);

                setUser({
                    accessToken,
                    refreshToken,
                    roles,
                });

            } catch (error) {

                console.error(
                    "Failed to restore user roles:",
                    error
                );

                localStorage.removeItem("roles");

            }

        }

        setLoading(false);

    }, []);


    /*
     * Store authentication information
     * after successful login/register.
     */
    const login = (
        accessToken: string,
        refreshToken: string,
        roles: Role[]
    ) => {

        localStorage.setItem(
            "accessToken",
            accessToken
        );

        localStorage.setItem(
            "refreshToken",
            refreshToken
        );

        localStorage.setItem(
            "roles",
            JSON.stringify(roles)
        );


        setUser({
            accessToken,
            refreshToken,
            roles,
        });

    };


    /*
     * Logout
     */
    const logout = () => {

        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("roles");

        setUser(null);

    };


    /*
     * Check whether the authenticated
     * user has a specific role.
     */
    const hasRole = (role: Role): boolean => {

        return user?.roles.includes(role) ?? false;

    };


    return (

        <AuthContext.Provider
            value={{
                user,
                login,
                logout,
                hasRole,
                loading,
                isAuthenticated: !!user,
            }}
        >

            {children}

        </AuthContext.Provider>

    );

}


export function useAuth() {

    const context =
        useContext(AuthContext);


    if (!context) {

        throw new Error(
            "useAuth must be used inside AuthProvider"
        );

    }


    return context;

}