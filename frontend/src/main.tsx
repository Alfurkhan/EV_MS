import "./index.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

import { AuthProvider } from "./contexts/AuthContext";
import { LayoutProvider } from "./contexts/LayoutContext";
import { ProfileProvider } from "./contexts/ProfileContext";

createRoot(document.getElementById("root")!).render(
    <StrictMode>

        <AuthProvider>

            <ProfileProvider>

                <LayoutProvider>

                    <App />

                </LayoutProvider>

            </ProfileProvider>

        </AuthProvider>

    </StrictMode>
);