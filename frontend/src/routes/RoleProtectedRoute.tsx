import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

type Role =
    | "ROLE_STUDENT"
    | "ROLE_FACULTY"
    | "ROLE_ADMIN";

type Props = {
    children: React.ReactNode;
    allowedRoles: Role[];
};

export default function RoleProtectedRoute({
                                               children,
                                               allowedRoles,
                                           }: Props) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                Loading...
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/" replace />;
    }

    const hasPermission = user.roles.some((role) =>
        allowedRoles.includes(role)
    );

    if (!hasPermission) {
        return <Navigate to="/unauthorized" replace />;
    }

    return <>{children}</>;
}