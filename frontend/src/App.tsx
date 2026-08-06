import { BrowserRouter, Routes, Route } from "react-router-dom";

import LoginPage from "./features/auth/pages/LoginPage";

import DashboardLayout from "./layouts/DashboardLayout";
import Dashboard from "./pages/Dashboard";

import ProtectedRoute from "./routes/ProtectedRoute";

import Faculty from "./pages/Faculty";
import Attendance from "./pages/Attendance";
import Courses from "./pages/Courses";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import StudentsPage from "./features/students/pages/StudentsPage";

export default function App() {
    return (
        <BrowserRouter>
            <Routes>

                <Route path="/" element={<LoginPage />} />

                <Route
                    element={
                        <ProtectedRoute>
                            <DashboardLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route
                        path="/students"
                        element={<StudentsPage />}
                    />
                    <Route path="/faculty" element={<Faculty />} />
                    <Route path="/attendance" element={<Attendance />} />
                    <Route path="/courses" element={<Courses />} />
                    <Route path="/notifications" element={<Notifications />} />
                    <Route path="/settings" element={<Settings />} />
                </Route>

            </Routes>
        </BrowserRouter>
    );
}