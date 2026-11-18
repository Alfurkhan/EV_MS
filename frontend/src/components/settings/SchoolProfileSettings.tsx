import { useEffect, useRef, useState } from "react";
import { Building2, Camera, ChevronDown, ImagePlus, Loader2, Mail, MapPin, Phone, Save, Trash2, Upload, Globe, X, Info, type LucideIcon } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import { useSchoolBranding } from "../../contexts/SchoolBrandingContext";

type SchoolProfile = {
    name: string;
    tagline: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    logoUrl: string;
};

const emptyProfile: SchoolProfile = {
    name: "",
    tagline: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    logoUrl: "",
};

const MAX_LOGO_SIZE = 2 * 1024 * 1024;
const ACCEPTED_LOGO_TYPES = ["image/png", "image/jpeg", "image/webp"];
const ACCEPTED_LOGO_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp"];

function getErrorMessage(error: any, fallback: string) {
    return error?.response?.data?.message || error?.response?.data?.error || fallback;
}

function Field({
    label,
    value,
    onChange,
    placeholder,
    type = "text",
    icon: Icon,
    multiline = false,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    type?: string;
    icon?: LucideIcon;
    multiline?: boolean;
}) {
    const controlClass = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50";
    return (
        <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
            <span className="relative block">
                {Icon && !multiline && <Icon size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />}
                {multiline ? (
                    <textarea rows={3} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className={controlClass + " resize-y"} />
                ) : (
                    <input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className={controlClass + (Icon ? " pl-10" : "")} />
                )}
            </span>
        </label>
    );
}

export default function SchoolProfileSettings() {
    const [profile, setProfile] = useState<SchoolProfile>(emptyProfile);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [logoBusy, setLogoBusy] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [localPreview, setLocalPreview] = useState("");
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [logoTipOpen, setLogoTipOpen] = useState(false);
    const { refreshBranding } = useSchoolBranding();
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        let active = true;
        api.get<Record<string, string>>("/admin/settings")
            .then(({ data }) => {
                if (!active) return;
                setProfile({
                    name: data["school.name"] || "",
                    tagline: data["school.tagline"] || "",
                    address: data["school.address"] || "",
                    phone: data["school.phone"] || "",
                    email: data["school.email"] || "",
                    website: data["school.website"] || "",
                    logoUrl: data["school.logoUrl"] || "",
                });
            })
            .catch((error) => toast.error(getErrorMessage(error, "Unable to load school profile.")))
            .finally(() => active && setLoading(false));
        return () => { active = false; };
    }, []);

    useEffect(() => {
        if (!selectedFile) {
            setLocalPreview("");
            return;
        }
        const url = URL.createObjectURL(selectedFile);
        setLocalPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [selectedFile]);

    const update = (key: keyof SchoolProfile, value: string) => {
        setProfile((current) => ({ ...current, [key]: value }));
    };

    const handleFileSelection = (file?: File) => {
        if (!file) return;
        const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
        if (!ACCEPTED_LOGO_EXTENSIONS.includes(extension) || (file.type && !ACCEPTED_LOGO_TYPES.includes(file.type))) {
            toast.error("Unsupported file format. Please upload a PNG, JPG or WebP image.");
            return;
        }
        if (file.size > MAX_LOGO_SIZE) {
            toast.error("Logo must be 2 MB or smaller.");
            return;
        }
        setSelectedFile(file);
    };

    const uploadLogo = async () => {
        if (!selectedFile) return;
        const formData = new FormData();
        formData.append("file", selectedFile);
        setLogoBusy(true);
        try {
            const { data } = await api.post<{ logoUrl: string }>("/admin/settings/logo", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setProfile((current) => ({ ...current, logoUrl: data.logoUrl }));
            setSelectedFile(null);
            await refreshBranding();
            toast.success("School logo uploaded successfully.");
        } catch (error: any) {
            const detail = String(error?.response?.data?.detail || error?.response?.data?.message || error?.response?.data?.error || "");
            if (/does not match its image format|invalid image|unsupported image|image format/i.test(detail)) {
                toast.error("The selected file content does not match its extension. Please upload a valid PNG, JPG or WebP image.");
            } else if (error?.response?.status === 413) {
                toast.error("The logo is too large. Please choose an image up to 2 MB.");
            } else {
                toast.error(getErrorMessage(error, "Unable to upload the school logo. Please try again."));
            }
        } finally {
            setLogoBusy(false);
        }
    };

    const removeLogo = async () => {
        setLogoBusy(true);
        try {
            await api.delete("/admin/settings/logo");
            setProfile((current) => ({ ...current, logoUrl: "" }));
            setSelectedFile(null);
            await refreshBranding();
            toast.success("School logo removed successfully.");
        } catch (error) {
            toast.error(getErrorMessage(error, "Unable to remove the school logo. Please try again."));
        } finally {
            setLogoBusy(false);
        }
    };

    const saveProfile = async () => {
        if (!profile.name.trim()) {
            toast.error("Please enter the school name.");
            return;
        }
        if (profile.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email.trim())) {
            toast.error("Enter a valid official email address.");
            return;
        }
        if (profile.website.trim() && !/^https?:\/\/.+$/i.test(profile.website.trim())) {
            toast.error("Website must begin with http:// or https://.");
            return;
        }

        const settings = {
            "school.name": profile.name.trim(),
            "school.tagline": profile.tagline.trim(),
            "school.address": profile.address.trim(),
            "school.phone": profile.phone.trim(),
            "school.email": profile.email.trim(),
            "school.website": profile.website.trim(),
        };
        setSaving(true);
        try {
            await api.put("/admin/settings", { settings });
            await refreshBranding();
            toast.success("School profile details saved successfully.");
        } catch (error) {
            toast.error(getErrorMessage(error, "Unable to save school profile details. Please try again."));
        } finally {
            setSaving(false);
        }
    };

    const apiBaseUrl = (api.defaults.baseURL || "/api").replace(/\/$/, "");
    const logoPreview = localPreview || (profile.logoUrl ? `${apiBaseUrl}${profile.logoUrl}` : "");

    if (loading) {
        return (
            <div className="flex min-h-72 items-center justify-center">
                <Loader2 className="animate-spin text-blue-600" size={25} />
                <span className="ml-3 text-sm text-slate-500">Loading school profile...</span>
            </div>
        );
    }

    return (
        <div className="space-y-7 pt-6">
            <section className="space-y-6">
                <div className="space-y-5">
                    <div>
                        <h3 className="text-base font-semibold text-slate-900">School information</h3>
                        <p className="mt-1 text-sm text-slate-500">These details represent your institution across the platform.</p>
                    </div>
                    <div className="grid gap-5 sm:grid-cols-2">
                        <Field label="School name" value={profile.name} onChange={(v) => update("name", v)} placeholder="Enter school name" icon={Building2} />
                        <Field label="Tagline" value={profile.tagline} onChange={(v) => update("tagline", v)} placeholder="A short line about your school" />
                        <div className="sm:col-span-2">
                            <Field label="School address" value={profile.address} onChange={(v) => update("address", v)} placeholder="Full school address" icon={MapPin} multiline />
                        </div>
                        <Field label="Contact number" value={profile.phone} onChange={(v) => update("phone", v)} placeholder="Official phone number" icon={Phone} />
                        <Field label="Official email" value={profile.email} onChange={(v) => update("email", v)} placeholder="office@school.edu" type="email" icon={Mail} />
                        <div className="sm:col-span-2">
                            <Field label="Website" value={profile.website} onChange={(v) => update("website", v)} placeholder="https://www.school.edu" icon={Globe} />
                        </div>
                    </div>
                </div>

            </section>

            <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                <div className="mb-4">
                    <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-slate-900">School logo</h3>
                        <div className="relative" onMouseEnter={() => setLogoTipOpen(true)} onMouseLeave={() => setLogoTipOpen(false)}>
                            <button type="button" aria-label="Logo upload requirements" aria-expanded={logoTipOpen} onClick={() => setLogoTipOpen(true)} className="inline-flex size-6 items-center justify-center rounded-full text-slate-400 transition hover:bg-blue-50 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200">
                                <Info size={15} />
                            </button>
                            <div className={"absolute left-1/2 top-8 z-20 w-64 -translate-x-1/2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs leading-5 text-slate-600 shadow-lg transition-all duration-200 ease-out " + (logoTipOpen ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1 opacity-0")}>
                                <p className="font-semibold text-slate-800">Supported logo files</p>
                                <p className="mt-1">PNG, JPG, JPEG or WebP</p>
                                <p>Maximum file size: 2 MB</p>
                                <p className="mt-1 text-slate-400">Use a valid image file with matching file content and extension.</p>
                            </div>
                        </div>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">Upload the logo used to identify your institution.</p>
                </div>
                <div className="flex min-h-40 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-5">
                        {logoPreview ? (
                            <img src={logoPreview} alt="School logo preview" className="max-h-32 max-w-full object-contain" />
                        ) : (
                            <div className="text-center">
                                <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><ImagePlus size={22} /></div>
                                <p className="text-sm font-medium text-slate-700">No logo uploaded</p>
                                <p className="mt-1 text-xs text-slate-400">Your school logo will appear here</p>
                            </div>
                        )}
                    </div>
                    {selectedFile && <p className="mt-2 truncate text-xs text-slate-500">{selectedFile.name}</p>}
                    <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => { handleFileSelection(event.target.files?.[0]); event.target.value = ""; }} />
                    <div className="mt-4 flex flex-wrap gap-2">
                        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={logoBusy} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-50">
                            {profile.logoUrl || selectedFile ? <Camera size={16} /> : <Upload size={16} />}
                            {profile.logoUrl || selectedFile ? "Choose another" : "Choose logo"}
                        </button>
                        {selectedFile ? (
                            <>
                                <button type="button" onClick={uploadLogo} disabled={logoBusy} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50">
                                    {logoBusy ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />} Upload
                                </button>
                                <button type="button" onClick={() => setSelectedFile(null)} disabled={logoBusy} aria-label="Cancel selected logo" className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-500 transition hover:bg-slate-100 disabled:opacity-50">
                                    <X size={16} />
                                </button>
                            </>
                        ) : profile.logoUrl ? (
                            <button type="button" onClick={removeLogo} disabled={logoBusy} aria-label="Remove school logo" className="inline-flex items-center justify-center rounded-xl border border-red-100 bg-white px-3 py-2.5 text-red-600 transition hover:bg-red-50 disabled:opacity-50">
                                {logoBusy ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                            </button>
                        ) : null}
                    </div>
                    <p className="mt-3 text-xs leading-5 text-slate-400">PNG, JPG or WebP · Maximum size 2 MB</p>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <button type="button" onClick={() => setIsPreviewOpen((open) => !open)} aria-expanded={isPreviewOpen} className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition hover:bg-slate-50 sm:px-6">
                    <span>
                        <span className="block text-sm font-semibold text-slate-900">Identity preview</span>
                        <span className="mt-0.5 block text-xs text-slate-500">Preview the school identity alongside eVidyalaya</span>
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">
                        {isPreviewOpen ? "Hide preview" : "Preview"}
                        <ChevronDown size={16} className={isPreviewOpen ? "rotate-180 transition-transform" : "transition-transform"} />
                    </span>
                </button>
                {isPreviewOpen && (
                    <div className="border-t border-slate-100 p-5 sm:p-6">
                        <div className="flex flex-wrap items-center gap-4 rounded-xl bg-slate-50 p-4">
                            <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white">
                                {logoPreview ? <img src={logoPreview} alt="" className="h-full w-full object-contain p-1" /> : <Building2 size={25} className="text-slate-300" />}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate font-semibold text-slate-900">{profile.name.trim() || "Your school name"}</p>
                                <p className="mt-0.5 truncate text-sm text-slate-500">{profile.tagline.trim() || "Your school tagline"}</p>
                            </div>
                            <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
                                <div className="flex size-9 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white">EV</div>
                                <div><p className="text-sm font-semibold text-slate-700">eVidyalaya</p><p className="text-xs text-slate-400">School ERP</p></div>
                            </div>
                        </div>
                        <p className="mt-3 text-xs text-slate-400">eVidyalaya remains the platform identity; your school identity is displayed alongside it.</p>
                    </div>
                )}
            </section>

            <div className="flex justify-end border-t border-slate-100 pt-5">
                <button type="button" onClick={saveProfile} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
                    {saving ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />}
                    {saving ? "Saving..." : "Save school profile"}
                </button>
            </div>
        </div>
    );
}
