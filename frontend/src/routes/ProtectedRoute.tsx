import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

type Role =
    | "ROLE_STUDENT"
    | "ROLE_FACULTY"
    | "ROLE_ADMIN";

type Props = {
    children: React.ReactNode;
    requiredRoles?: Role[];
};

export default function ProtectedRoute({
                                           children,
                                           requiredRoles,
                                       }: Props) {

    const {
        isAuthenticated,
        loading,
        hasRole,
    } = useAuth();


    // Wait until authentication state is restored
    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                Loading...
            </div>
        );
    }


    // User is not logged in
    if (!isAuthenticated) {
        return (
            <Navigate
                to="/"
                replace
            />
        );
    }


    // User is logged in but doesn't have
    // any of the required roles
    if (
        requiredRoles &&
        requiredRoles.length > 0 &&
        !requiredRoles.some((role) => hasRole(role))
    ) {
        return (
            <Navigate
                to="/unauthorized"
                replace
            />
        );
    }


    return <>{children}</>;
}