import "./index.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

import { AuthProvider } from "./contexts/AuthContext";
import { LayoutProvider } from "./contexts/LayoutContext";
import { ProfileProvider } from "./contexts/ProfileContext";
import { SchoolBrandingProvider } from "./contexts/SchoolBrandingContext";
import { ThemeProvider } from "./contexts/ThemeContext";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <AuthProvider>
            <ThemeProvider>
                <ProfileProvider>
                    <SchoolBrandingProvider>
                        <LayoutProvider>
                            <App />
                        </LayoutProvider>
                    </SchoolBrandingProvider>
                </ProfileProvider>
            </ThemeProvider>
        </AuthProvider>
    </StrictMode>,
);
