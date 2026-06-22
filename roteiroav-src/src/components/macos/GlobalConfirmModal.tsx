"use client";

import { useAppStore } from "@/store/useAppStore";
import { AlertCircle, AlertTriangle } from "lucide-react";

export function GlobalConfirmModal() {
    const { confirmDialog } = useAppStore();

    if (!confirmDialog?.show) return null;

    return (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300 rounded-[inherit]">
            <div className="w-full max-w-sm bg-card rounded-2xl shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-300 relative">
                <div className="p-8 text-center flex flex-col items-center justify-center min-h-[220px]">
                    <div className="space-y-6">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${confirmDialog.isDangerous ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                            {confirmDialog.isDangerous ? (
                                <AlertTriangle size={28} />
                            ) : (
                                <AlertCircle size={28} />
                            )}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-foreground mb-2">{confirmDialog.title}</h2>
                            <p className="text-muted-foreground text-sm">
                                {confirmDialog.message}
                            </p>
                        </div>
                        <div className="flex items-center gap-3 pt-4">
                            <button
                                onClick={confirmDialog.onCancel}
                                className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-bold text-muted-foreground hover:bg-accent transition-all"
                            >
                                {confirmDialog.cancelText}
                            </button>
                            <button
                                onClick={confirmDialog.onConfirm}
                                className={`flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-bold transition-all shadow-lg ${
                                    confirmDialog.isDangerous 
                                    ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' 
                                    : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'
                                }`}
                            >
                                {confirmDialog.confirmText}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
