import { Link } from "react-router-dom";
import { User, Settings, LogOut } from "lucide-react";

import { useProfile } from "../../contexts/ProfileContext";
import { useAuth } from "../../contexts/AuthContext";

type Props = {
    onClose: () => void;
};

export default function UserMenu({ onClose }: Props) {
    const { profile } = useProfile();
    const { logout } = useAuth();

    return (
        <div className="absolute right-0 mt-3 w-72 rounded-2xl bg-white shadow-xl border border-slate-200 overflow-hidden z-50">

            {/* User Info */}
            <div className="px-5 py-4 border-b">

                <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-lg font-bold mb-3">
                    {profile?.fullName?.charAt(0).toUpperCase()}
                </div>

                <h3 className="font-semibold text-slate-800">
                    {profile?.fullName}
                </h3>

                <p className="text-sm text-slate-500">
                    {profile?.email}
                </p>

            </div>

            {/* Menu */}

            <Link
                to="/profile"
                onClick={onClose}
                className="flex items-center gap-3 px-5 py-3 hover:bg-slate-100 transition"
            >
                <User size={18} />
                View Profile
            </Link>

            <Link
                to="/settings"
                onClick={onClose}
                className="flex items-center gap-3 px-5 py-3 hover:bg-slate-100 transition"
            >
                <Settings size={18} />
                Settings
            </Link>

            <button
                onClick={() => {
                    onClose();
                    logout();
                }}
                className="w-full flex items-center gap-3 px-5 py-3 text-red-600 hover:bg-red-50 transition"
            >
                <LogOut size={18} />
                Logout
            </button>

        </div>
    );
}