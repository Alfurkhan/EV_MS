import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react";

type User = {
    accessToken: string;
    refreshToken: string;
} | null;

type AuthContextType = {
    user: User;
    login: (accessToken: string, refreshToken: string) => void;
    logout: () => void;
    isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User>(null);

    useEffect(() => {
        const accessToken = localStorage.getItem("accessToken");
        const refreshToken = localStorage.getItem("refreshToken");

        if (accessToken && refreshToken) {
            setUser({
                accessToken,
                refreshToken,
            });
        }
    }, []);

    const login = (accessToken: string, refreshToken: string) => {
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);

        setUser({
            accessToken,
            refreshToken,
        });
    };

    const logout = () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");

        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                login,
                logout,
                isAuthenticated: !!user,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth must be used inside AuthProvider");
    }

    return context;
}