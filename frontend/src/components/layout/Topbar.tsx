import { Menu } from "lucide-react";
import { useLayout } from "../../contexts/LayoutContext";
import {
    Search,
    Bell,
    UserCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";


export default function Topbar() {
    const navigate = useNavigate();

    const { sidebarOpen, setSidebarOpen } = useLayout();

    return (
        <header className="bg-white h-20 px-8 flex items-center justify-between shadow-sm">

            <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="mr-5 p-2 rounded-lg hover:bg-slate-100 transition"
            >
                <Menu size={24} />
            </button>

            <div>

                <h2 className="text-2xl font-bold">
                    Dashboard
                </h2>

                <p className="text-slate-500">
                    Welcome back 👋
                </p>

            </div>

            <div className="flex items-center gap-6">

                <div className="flex items-center bg-slate-100 rounded-xl px-4 h-11">

                    <Search size={18} />

                    <input
                        placeholder="Search..."
                        className="bg-transparent outline-none ml-3"
                    />

                </div>

                <Bell
                    className="cursor-pointer"
                    size={22}
                />

                <UserCircle
                    size={36}
                    className="text-blue-600 cursor-pointer hover:scale-110 transition"
                    onClick={() => navigate("/profile")}
                />

            </div>

        </header>
    );
}