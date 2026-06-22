"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useScriptStore } from "../store/useScriptStore";
import { X, Copy, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScriptMetadata } from "../store/types";

interface DuplicateScriptModalProps {
    script: ScriptMetadata;
    isOpen: boolean;
    onClose: () => void;
}

export function DuplicateScriptModal({ script, isOpen, onClose }: DuplicateScriptModalProps) {
    const { duplicateScript } = useScriptStore();
    const [titulo, setTitulo] = useState(`${script.titulo} - Cópia`);
    const [loading, setLoading] = useState(false);

    if (!isOpen || typeof document === "undefined") return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedTitle = titulo.trim();
        if (!trimmedTitle || loading) return;

        try {
            setLoading(true);
            await duplicateScript(script.id, trimmedTitle);
            onClose();
        } catch (error: any) {
            console.error("Erro ao duplicar roteiro:", error);
            alert(error.message || "Erro ao duplicar roteiro. Por favor, tente novamente.");
            setLoading(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="bg-[#1a1a1a] border border-white/10 w-full max-w-md rounded-[28px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="p-8">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-xl font-black text-white uppercase tracking-wider font-sans">Duplicar Roteiro</h2>
                            <p className="text-white/40 text-xs font-medium mt-1 uppercase tracking-widest font-sans">Escolha o nome da cópia</p>
                        </div>
                        <button 
                            type="button"
                            onClick={onClose}
                            className="p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-colors cursor-pointer"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-1.5 font-sans">
                                <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-1">Título do Roteiro Duplicado</label>
                                <input 
                                    autoFocus
                                    type="text" 
                                    value={titulo}
                                    onChange={(e) => setTitulo(e.target.value)}
                                    placeholder="Ex: Comercial Verão - Cópia"
                                    className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-white placeholder:text-white/10 focus:outline-none focus:border-amber-500/50 focus:bg-white/[0.08] transition-all text-sm font-medium"
                                />
                            </div>
                        </div>

                        <div className="pt-4 flex gap-3 font-sans">
                            <button 
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-4 px-6 rounded-2xl text-white/40 hover:text-white hover:bg-white/5 font-black uppercase tracking-widest text-[11px] transition-all cursor-pointer"
                            >
                                Cancelar
                            </button>
                            <button 
                                type="submit"
                                disabled={!titulo.trim() || loading}
                                className="flex-1 py-4 px-6 rounded-2xl bg-amber-500 text-black font-black uppercase tracking-widest text-[11px] hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
                            >
                                {loading ? (
                                    <Loader2 size={18} className="animate-spin" />
                                ) : (
                                    <Copy size={18} />
                                )}
                                {loading ? "Duplicando..." : "Duplicar"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>,
        document.body
    );
}
