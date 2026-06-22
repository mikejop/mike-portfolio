"use client";

import { useState } from "react";
import { X, Loader2, FileText, AlertTriangle, Image as ImageIcon } from "lucide-react";
import { ScriptFull } from "../../store/types";
import { cn } from "@/lib/utils";

interface ImportReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    importedContent: ScriptFull;
    imageMap: Record<string, Blob>;
    onApply: (finalContent: ScriptFull) => Promise<void>;
    isNewImport?: boolean;
}

export function ImportReviewModal({
    isOpen,
    onClose,
    importedContent,
    imageMap,
    onApply,
    isNewImport = false
}: ImportReviewModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const totalCenas = importedContent.cenas.length;
    const totalTakes = importedContent.cenas.reduce((acc, c) => acc + (c.takes?.length || 0), 0);
    const totalImages = Object.keys(imageMap).length;

    const handleSubmit = async () => {
        if (loading) return;
        setLoading(true);
        setError(null);
        try {
            await onApply(importedContent);
            onClose();
        } catch (err: any) {
            console.error("Error applying import:", err);
            setError(err.message || "Erro ao aplicar a importação do roteiro.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-[#1a1a1a] border border-white/10 w-full max-w-2xl rounded-[28px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[85vh]">
                
                {/* Header */}
                <div className="p-8 pb-4 flex justify-between items-center border-b border-white/5">
                    <div>
                        <h2 className="text-xl font-black text-white uppercase tracking-wider">Revisar Importação</h2>
                        <p className="text-white/40 text-[10px] font-black mt-1 uppercase tracking-widest">
                            Confirme os dados do roteiro importado antes de aplicá-lo
                        </p>
                    </div>
                    <button 
                        onClick={onClose}
                        disabled={loading}
                        className="p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-colors disabled:opacity-50"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 py-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
                    {/* General Metadata */}
                    <div className="bg-white/5 rounded-2xl p-5 border border-white/5 space-y-3">
                        <div className="flex items-start gap-3">
                            <FileText className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                            <div className="space-y-1">
                                <h3 className="text-sm font-bold text-white leading-none">{importedContent.titulo || "Roteiro Sem Título"}</h3>
                                <p className="text-xs text-white/50">{importedContent.descricao || "Sem descrição..."}</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-4 pt-2 border-t border-white/5 text-[10px] font-black uppercase tracking-wider text-white/40">
                            <div>Formato: <span className="text-white font-bold">{importedContent.aspectRatio || "16:9"}</span></div>
                            <div>Cenas: <span className="text-white font-bold">{totalCenas}</span></div>
                            <div>Tomadas: <span className="text-white font-bold">{totalTakes}</span></div>
                            <div className="flex items-center gap-1">
                                <ImageIcon size={10} className="text-amber-500" />
                                Imagens do Arquivo: <span className="text-white font-bold">{totalImages}</span>
                            </div>
                        </div>
                    </div>

                    {/* Alert */}
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex gap-3 text-amber-400">
                        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <h4 className="text-xs font-black uppercase tracking-wider">Atenção!</h4>
                            <p className="text-[11px] leading-relaxed text-white/70">
                                {isNewImport ? (
                                    <span>Ao criar este roteiro, ele será importado como um <strong>novo roteiro</strong> em seu painel. As imagens correspondentes serão salvas automaticamente na nuvem.</span>
                                ) : (
                                    <span>Ao aplicar este roteiro, o conteúdo atual deste editor será <strong>totalmente substituído</strong>. As imagens correspondentes serão enviadas ao armazenamento em nuvem de forma automática.</span>
                                )}
                            </p>
                        </div>
                    </div>

                    {/* Preview list */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-1">Pré-visualização da Estrutura</h4>
                        <div className="max-h-[30vh] overflow-y-auto pr-2 custom-scrollbar border border-white/5 rounded-2xl bg-[#121212]/50 p-4 space-y-4">
                            {importedContent.cenas.map((cena, sIdx) => (
                                <div key={cena.id || sIdx} className="space-y-2 border-b border-white/5 pb-3 last:border-0 last:pb-0">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-black text-white uppercase tracking-wider">
                                            Cena {sIdx + 1}: {cena.titulo}
                                        </span>
                                        <span className="text-[9px] font-bold text-white/30 uppercase">
                                            {cena.takes?.length || 0} tomadas
                                        </span>
                                    </div>
                                    <div className="space-y-1.5 pl-3 border-l border-white/10">
                                        {cena.takes?.slice(0, 3).map((take, tIdx) => (
                                            <div key={take.id || tIdx} className="text-[10px] text-white/40 flex justify-between gap-4">
                                                <span className="truncate max-w-[200px]">
                                                    Audio: <span className="text-white/60">{take.audio ? (take.audio.length > 50 ? take.audio.substring(0, 50) + "..." : take.audio) : "(vazio)"}</span>
                                                </span>
                                                <span className="truncate max-w-[200px]">
                                                    Visual: <span className="text-white/60">{take.visual ? (take.visual.length > 50 ? take.visual.substring(0, 50) + "..." : take.visual) : "(vazio)"}</span>
                                                </span>
                                            </div>
                                        ))}
                                        {cena.takes && cena.takes.length > 3 && (
                                            <div className="text-[9px] text-white/20 italic pl-1">
                                                + {cena.takes.length - 3} tomadas omitidas no preview...
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {error && (
                        <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-2xl">
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-8 pt-4 border-t border-white/5 flex gap-4 bg-[#121212]/30">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 bg-white/5 hover:bg-white/10 text-white border border-white/5 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                {isNewImport ? "Criando Roteiro..." : "Aplicando Roteiro..."}
                            </>
                        ) : (
                            isNewImport ? "Criar Roteiro" : "Aplicar Roteiro"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
