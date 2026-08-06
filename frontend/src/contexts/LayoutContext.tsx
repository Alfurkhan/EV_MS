import {
    createContext,
    useContext,
    useState,
    type ReactNode,
} from "react";

type LayoutContextType = {
    sidebarOpen: boolean;
    setSidebarOpen: (value: boolean) => void;
};

const LayoutContext = createContext<LayoutContextType | null>(null);

export function LayoutProvider({
                                   children,
                               }: {
    children: ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(true);

    return (
        <LayoutContext.Provider
            value={{
                sidebarOpen,
                setSidebarOpen,
            }}
        >
            {children}
        </LayoutContext.Provider>
    );
}

export function useLayout() {
    const context = useContext(LayoutContext);

    if (!context) {
        throw new Error(
            "useLayout must be used inside LayoutProvider"
        );
    }

    return context;
}