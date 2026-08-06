import type { ReactNode } from "react";
import Logo from "../components/common/Logo.tsx";
import { theme } from "../theme.ts";

interface AuthLayoutProps {
    title: string;
    subtitle: string;
    children: ReactNode;
}

export default function AuthLayout({
                                       title,
                                       subtitle,
                                       children,
                                   }: AuthLayoutProps) {
    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                background: theme.colors.background,
                padding: "24px",
            }}
        >
            <div
                style={{
                    width: "100%",
                    maxWidth: "450px",
                }}
            >
                <Logo />

                <div
                    style={{
                        marginTop: "40px",
                        background: theme.colors.surface,
                        borderRadius: theme.radius.lg,
                        border: `1px solid ${theme.colors.border}`,
                        boxShadow: theme.shadow.card,
                        padding: "36px",
                    }}
                >
                    <h2
                        style={{
                            color: theme.colors.text,
                            marginBottom: "8px",
                            textAlign: "center",
                        }}
                    >
                        {title}
                    </h2>

                    <p
                        style={{
                            color: theme.colors.secondaryText,
                            textAlign: "center",
                            marginBottom: "28px",
                        }}
                    >
                        {subtitle}
                    </p>

                    {children}
                </div>
            </div>
        </div>
    );
}