import "./index.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

import { AuthProvider } from "./contexts/AuthContext";
import { LayoutProvider } from "./contexts/LayoutContext";

createRoot(document.getElementById("root")!).render(
    <StrictMode>

        <AuthProvider>

            <LayoutProvider>

                <App />

            </LayoutProvider>

        </AuthProvider>

    </StrictMode>
);