import { BrowserRouter, Routes, Route } from "react-router-dom";

import { Toaster } from "react-hot-toast";

import LoginPage from "./features/auth/pages/LoginPage";

import DashboardLayout from "./layouts/DashboardLayout";
import Dashboard from "./pages/Dashboard";

import ProtectedRoute from "./routes/ProtectedRoute";
import RoleProtectedRoute from "./routes/RoleProtectedRoute";

import Faculty from "./pages/Faculty";
import Attendance from "./pages/Attendance";
import Courses from "./pages/Courses";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import StudentsPage from "./features/students/pages/StudentsPage";
import ProfilePage from "./features/profile/pages/ProfilePage";

import UnauthorizedPage from "./pages/UnauthorizedPage";

import AcademicManagementPage
    from "./features/academic/pages/AcademicManagementPage";

export default function App() {
    return (
        <>
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 4000,
                }}
            />
        <BrowserRouter>
            <Routes>

                <Route path="/" element={<LoginPage />} />

                <Route
                    path="/unauthorized"
                    element={<UnauthorizedPage />}
                />

                <Route
                    element={
                        <ProtectedRoute>
                            <DashboardLayout />
                        </ProtectedRoute>
                    }
                >
                    {/* Everyone */}
                    <Route
                        path="/dashboard"
                        element={<Dashboard />}
                    />

                    <Route
                        path="/profile"
                        element={<ProfilePage />}
                    />

                    <Route
                        path="/courses"
                        element={<Courses />}
                    />

                    <Route
                        path="/notifications"
                        element={<Notifications />}
                    />

                    {/* Student + Faculty + Admin */}
                    <Route
                        path="/attendance"
                        element={
                            <RoleProtectedRoute
                                allowedRoles={[
                                    "ROLE_STUDENT",
                                    "ROLE_FACULTY",
                                    "ROLE_ADMIN",
                                ]}
                            >
                                <Attendance />
                            </RoleProtectedRoute>
                        }
                    />

                    {/* Admin only */}
                    <Route
                        path="/students"
                        element={
                            <RoleProtectedRoute
                                allowedRoles={["ROLE_ADMIN"]}
                            >
                                <StudentsPage />
                            </RoleProtectedRoute>
                        }
                    />

                    <Route
                        path="/faculty"
                        element={
                            <RoleProtectedRoute
                                allowedRoles={["ROLE_ADMIN"]}
                            >
                                <Faculty />
                            </RoleProtectedRoute>
                        }
                    />

                    <Route
                        path="/academic-management"
                        element={
                            <RoleProtectedRoute
                                allowedRoles={["ROLE_ADMIN"]}
                            >
                                <AcademicManagementPage />
                            </RoleProtectedRoute>
                        }
                    />

                    <Route
                        path="/settings"
                        element={
                            <RoleProtectedRoute
                                allowedRoles={["ROLE_ADMIN"]}
                            >
                                <Settings />
                            </RoleProtectedRoute>
                        }
                    />
                </Route>

            </Routes>
        </BrowserRouter>
            
        </>
    );
}