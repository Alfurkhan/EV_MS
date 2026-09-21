import { BrowserRouter, Routes, Route } from "react-router-dom";

import { Toaster } from "react-hot-toast";

import LoginPage from "./features/auth/pages/LoginPage";

import DashboardLayout from "./layouts/DashboardLayout";
import Dashboard from "./pages/Dashboard";

import ProtectedRoute from "./routes/ProtectedRoute";
import RoleProtectedRoute from "./routes/RoleProtectedRoute";

import FacultyPage from "./features/faculty/pages/FacultyPage";
import Attendance from "./pages/Attendance";
import Courses from "./pages/Courses";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import StudentsPage from "./features/students/pages/StudentsPage";
import ProfilePage from "./features/profile/pages/ProfilePage";

import UnauthorizedPage from "./pages/UnauthorizedPage";

import AcademicManagementPage
    from "./features/academic/pages/AcademicManagementPage";

import TimetablePage from "./features/timetable/pages/TimetablePage";
import StudentTimetablePage
    from "./features/timetable/pages/StudentTimetablePage";

import MySubjectsPage
    from "./features/courses/pages/MySubjectsPage";

import MyClassesPage from "./features/faculty/pages/MyClassesPage";

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
                                <FacultyPage />
                            </RoleProtectedRoute>
                        }
                    />

                    {/* Admin and Faculty */}
                    <Route
                        path="/courses"
                        element={
                            <RoleProtectedRoute
                                allowedRoles={[
                                    "ROLE_FACULTY",
                                    "ROLE_ADMIN",
                                ]}
                            >
                                <Courses />
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
                        path="/timetable"
                        element={
                            <RoleProtectedRoute allowedRoles={["ROLE_ADMIN"]}>
                                <TimetablePage />
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

                    {/* Faculty only */}
                    <Route
                        path="/my-classes"
                        element={
                            <RoleProtectedRoute
                                allowedRoles={["ROLE_FACULTY"]}
                            >
                                <MyClassesPage />
                            </RoleProtectedRoute>
                        }
                    />

                    {/* Student only */}
                    <Route
                        path="/my-timetable"
                        element={
                            <RoleProtectedRoute
                                allowedRoles={["ROLE_STUDENT"]}
                            >
                                <StudentTimetablePage />
                            </RoleProtectedRoute>
                        }
                    />

                    <Route
                        path="/my-subjects"
                        element={
                            <RoleProtectedRoute
                                allowedRoles={["ROLE_STUDENT"]}
                            >
                                <MySubjectsPage />
                            </RoleProtectedRoute>
                        }
                    />
                </Route>

            </Routes>
        </BrowserRouter>
            
        </>
    );
}