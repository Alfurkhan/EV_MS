import { AlertTriangle, X } from "lucide-react";

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    destructive?: boolean;
    busy?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmDialog({ open, title, message, confirmLabel = "Confirm", cancelLabel = "Cancel", destructive = false, busy = false, onConfirm, onCancel }: ConfirmDialogProps) {
    if (!open) return null;
    return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4" role="presentation">
        <section role="alertdialog" aria-modal="true" aria-labelledby="confirm-dialog-title" aria-describedby="confirm-dialog-message" className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-start gap-3">
                <span className={`rounded-full p-2 ${destructive ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"}`}><AlertTriangle size={20}/></span>
                <div className="min-w-0 flex-1"><h2 id="confirm-dialog-title" className="font-semibold text-slate-900">{title}</h2><p id="confirm-dialog-message" className="mt-2 text-sm leading-6 text-slate-600">{message}</p></div>
                <button type="button" onClick={onCancel} disabled={busy} aria-label="Close confirmation" className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 disabled:opacity-40"><X size={18}/></button>
            </div>
            <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={onCancel} disabled={busy} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50">{cancelLabel}</button><button type="button" onClick={onConfirm} disabled={busy} className={`rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${destructive ? "bg-rose-600 hover:bg-rose-700" : "bg-indigo-600 hover:bg-indigo-700"}`}>{busy ? "Please wait…" : confirmLabel}</button></div>
        </section>
    </div>;
}
