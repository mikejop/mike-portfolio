"use client";

import { useState } from "react";
import { useScriptStore } from "../store/useScriptStore";
import { X, FolderPlus, Loader2 } from "lucide-react";

interface CreateRoomModalProps {
    isOpen: boolean;
    onClose: () => void;
    onRoomCreated?: (roomId: string) => void;
}

export function CreateRoomModal({ isOpen, onClose, onRoomCreated }: CreateRoomModalProps) {
    const { createRoom } = useScriptStore();
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || loading) return;

        setLoading(true);
        setError(null);

        try {
            const newRoomId = await createRoom(name.trim());
            setName("");
            if (onRoomCreated) {
                onRoomCreated(newRoomId);
            }
            onClose();
        } catch (err: any) {
            setError(err.message || "Erro ao criar sala de roteiro.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-[#1a1a1a] border border-white/10 w-full max-w-md rounded-[28px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="p-8">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-xl font-black text-white uppercase tracking-wider">Criar Sala de Roteiro</h2>
                            <p className="text-white/40 text-[10px] font-black mt-1 uppercase tracking-widest">
                                Espaço para agrupar roteiros e compartilhar com a sua equipe
                            </p>
                        </div>
                        <button 
                            onClick={onClose}
                            className="p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-1">Nome da Sala</label>
                            <div className="relative">
                                <FolderPlus className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                <input 
                                    type="text" 
                                    required
                                    value={name}
                                    onChange={(e) => {
                                        setName(e.target.value);
                                        setError(null);
                                    }}
                                    placeholder="Ex: Campanha de Lançamento"
                                    className="w-full bg-white/5 border border-white/5 rounded-2xl pl-11 pr-5 py-3.5 text-white placeholder:text-white/10 focus:outline-none focus:border-amber-500/50 focus:bg-white/[0.08] transition-all text-sm font-medium"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-2xl">
                                {error}
                            </div>
                        )}

                        <button 
                            type="submit"
                            disabled={loading || !name.trim()}
                            className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:hover:bg-amber-500 text-black py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Criando Sala...
                                </>
                            ) : (
                                "Criar Sala"
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
