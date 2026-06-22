"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useScriptStore } from "../store/useScriptStore";
import { AspectRatio } from "../store/types";
import { X, Check, Monitor, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function NewScriptModal() {
    const { setShowNewScriptModal, addScript, createScriptInRoom, activeRoomId, scripts, sharedScripts, roomScripts, activeTab } = useScriptStore();
    const router = useRouter();
    const [titulo, setTitulo] = useState("");
    const [clientName, setClientName] = useState("");
    const [descricao, setDescricao] = useState("");
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>("16:9");
    const [entregaEm, setEntregaEm] = useState("");
    const [loading, setLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const ratios: AspectRatio[] = ["16:9", "9:16", "4:5", "5:4", "3:2", "1:1"];

    const today = new Date().toISOString().split('T')[0];

    // Gather unique client names from existing scripts
    const allScripts = [...(scripts || []), ...(sharedScripts || []), ...(roomScripts || [])];
    const uniqueClients = Array.from(new Set(
        allScripts
            .map(s => s?.clientName?.trim())
            .filter((name): name is string => typeof name === 'string' && name.length > 0)
    )).sort();

    const suggestions = clientName.trim()
        ? uniqueClients.filter(c => c.toLowerCase().includes(clientName.toLowerCase()) && c.toLowerCase() !== clientName.toLowerCase())
        : uniqueClients.slice(0, 5); // show first 5 if empty but focused

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!titulo || !clientName || loading) return;
        
        try {
            setLoading(true);
            const newId = activeRoomId
                ? await createScriptInRoom(activeRoomId, { titulo, clientName, descricao, aspectRatio, entregaEm })
                : await addScript({ titulo, clientName, descricao, aspectRatio, entregaEm });
            
            // Notice: we do not call setShowNewScriptModal(false) here. 
            // It will keep the modal loading spinner active until routing completes.
            
            if (activeRoomId) {
                router.push(`/tools/script-editor?id=${newId}&roomId=${activeRoomId}`);
            } else {
                router.push(`/tools/script-editor?id=${newId}`);
            }
        } catch (error) {
            console.error("Erro ao criar roteiro:", error);
            alert("Erro ao criar roteiro. Por favor, tente novamente.");
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-[#1a1a1a] border border-white/10 w-full max-w-lg rounded-[28px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="p-8">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="text-xl font-black text-white uppercase tracking-wider">Novo Roteiro</h2>
                            <p className="text-white/40 text-xs font-medium mt-1 uppercase tracking-widest">Defina os detalhes iniciais</p>
                        </div>
                        <button 
                            onClick={() => setShowNewScriptModal(false)}
                            className="p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-1">Título do Roteiro</label>
                                    <input 
                                        autoFocus
                                        type="text" 
                                        value={titulo}
                                        onChange={(e) => setTitulo(e.target.value)}
                                        placeholder="Ex: Comercial Verão"
                                        className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-white placeholder:text-white/10 focus:outline-none focus:border-amber-500/50 focus:bg-white/[0.08] transition-all text-sm font-medium"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-1">Data de Entrega</label>
                                    <input 
                                        type="date" 
                                        value={entregaEm}
                                        min={today}
                                        onChange={(e) => setEntregaEm(e.target.value)}
                                        className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-amber-500/50 focus:bg-white/[0.08] transition-all text-sm font-medium [color-scheme:dark]"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5 relative">
                                <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-1">Nome do Cliente</label>
                                <input 
                                    type="text" 
                                    value={clientName}
                                    onChange={(e) => {
                                        setClientName(e.target.value);
                                        setShowSuggestions(true);
                                    }}
                                    onFocus={() => setShowSuggestions(true)}
                                    onBlur={() => {
                                        setTimeout(() => setShowSuggestions(false), 200);
                                    }}
                                    placeholder="Ex: Coca-Cola"
                                    className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-white placeholder:text-white/10 focus:outline-none focus:border-amber-500/50 focus:bg-white/[0.08] transition-all text-sm font-medium"
                                />
                                {showSuggestions && suggestions.length > 0 && (
                                    <div className="absolute left-0 right-0 top-full mt-1 bg-[#222] border border-white/10 rounded-2xl shadow-xl z-50 max-h-48 overflow-y-auto overflow-hidden divide-y divide-white/5 animate-in slide-in-from-top-2 duration-150">
                                        {suggestions.map((client) => (
                                            <button
                                                key={client}
                                                type="button"
                                                onClick={() => {
                                                    setClientName(client);
                                                    setShowSuggestions(false);
                                                }}
                                                className="w-full text-left px-5 py-3 text-sm text-white/80 hover:bg-white/5 hover:text-white transition-colors font-medium"
                                            >
                                                {client}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-1">Briefing Rápido</label>
                                <textarea 
                                    value={descricao}
                                    onChange={(e) => setDescricao(e.target.value)}
                                    placeholder="Descreva brevemente o objetivo..."
                                    rows={3}
                                    className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-white placeholder:text-white/10 focus:outline-none focus:border-amber-500/50 focus:bg-white/[0.08] transition-all text-sm font-medium resize-none"
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-1">Formato do Vídeo</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {ratios.map((ratio) => (
                                        <button
                                            key={ratio}
                                            type="button"
                                            onClick={() => setAspectRatio(ratio)}
                                            className={cn(
                                                "flex items-center justify-center gap-2 py-3 rounded-xl border text-[11px] font-black transition-all",
                                                aspectRatio === ratio
                                                    ? "bg-amber-500/20 border-amber-500/50 text-amber-500"
                                                    : "bg-white/5 border-white/5 text-white/30 hover:bg-white/10 hover:border-white/10 hover:text-white"
                                            )}
                                        >
                                            <Monitor size={14} className={cn(aspectRatio === ratio ? "text-amber-500" : "text-white/20")} />
                                            {ratio}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 flex gap-3">
                            <button 
                                type="button"
                                onClick={() => setShowNewScriptModal(false)}
                                className="flex-1 py-4 px-6 rounded-2xl text-white/40 hover:text-white hover:bg-white/5 font-black uppercase tracking-widest text-[11px] transition-all"
                            >
                                Cancelar
                            </button>
                            <button 
                                type="submit"
                                disabled={!titulo || !clientName || loading}
                                className="flex-1 py-4 px-6 rounded-2xl bg-amber-500 text-black font-black uppercase tracking-widest text-[11px] hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-amber-500/20 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <Loader2 size={18} className="animate-spin" />
                                ) : (
                                    <Check size={18} strokeWidth={3} />
                                )}
                                {loading ? "Criando..." : "Criar Roteiro"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
