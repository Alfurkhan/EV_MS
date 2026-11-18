import { FaGraduationCap } from "react-icons/fa";
import { useSchoolBranding } from "../../contexts/SchoolBrandingContext";

export default function Logo() {
    const { name, tagline, logoSrc } = useSchoolBranding();
    return (
        <div className="flex items-center gap-3">
            {logoSrc ? (
                <img src={logoSrc} alt="" className="h-12 w-12 rounded-xl bg-white object-contain p-1" />
            ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600">
                    <FaGraduationCap className="text-2xl text-white" />
                </div>
            )}
            <div className="min-w-0">
                <h2 className="truncate text-2xl font-bold">{name.trim() || "E-Vidyalaya"}</h2>
                <p className="truncate text-sm text-blue-300">{tagline.trim() || "Smart Education Platform"}</p>
                <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Powered by eVidyalaya</p>
            </div>
        </div>
    );
}
