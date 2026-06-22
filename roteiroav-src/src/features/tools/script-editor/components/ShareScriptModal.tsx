"use client";

import { useState } from "react";
import { useScriptStore } from "../store/useScriptStore";
import { X, UserPlus, Trash2, Loader2, Mail, Shield, UserCheck, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function ShareScriptModal() {
    const { sharingScriptId, scripts, setSharingScriptId, shareScript, unshareScript } = useScriptStore();
    const [email, setEmail] = useState("");
    const [permission, setPermission] = useState<'editor' | 'viewer'>("viewer");
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    if (!sharingScriptId) return null;

    const script = scripts.find(s => s.id === sharingScriptId);
    if (!script) return null;

    const sharedUsers = script.sharedWith ? Object.entries(script.sharedWith) : [];

    const handleShare = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim() || loading) return;

        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            await shareScript(sharingScriptId, email, permission);
            setEmail("");
            setSuccess(true);
            // Hide success badge after 3 seconds
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            setError(err.message || "Erro desconhecido ao compartilhar.");
        } finally {
            setLoading(false);
        }
    };

    const handleUnshare = async (targetUid: string) => {
        if (actionLoading) return;
        setActionLoading(targetUid);
        setError(null);

        try {
            await unshareScript(sharingScriptId, targetUid);
        } catch (err: any) {
            setError(err.message || "Erro ao remover compartilhamento.");
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-[#1a1a1a] border border-white/10 w-full max-w-lg rounded-[28px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="p-8">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-xl font-black text-white uppercase tracking-wider">Compartilhar</h2>
                            <p className="text-white/40 text-[10px] font-black mt-1 uppercase tracking-widest truncate max-w-[320px]">
                                {script.titulo}
                            </p>
                        </div>
                        <button 
                            onClick={() => setSharingScriptId(null)}
                            className="p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Share Form */}
                    <form onSubmit={handleShare} className="space-y-4 mb-8">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-1">E-mail do Colaborador</label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                    <input 
                                        type="email" 
                                        required
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                            setError(null);
                                        }}
                                        placeholder="exemplo@email.com"
                                        className="w-full bg-white/5 border border-white/5 rounded-2xl pl-11 pr-5 py-3.5 text-white placeholder:text-white/10 focus:outline-none focus:border-amber-500/50 focus:bg-white/[0.08] transition-all text-sm font-medium"
                                    />
                                </div>
                                <select 
                                    value={permission}
                                    onChange={(e) => setPermission(e.target.value as 'editor' | 'viewer')}
                                    className="bg-white/5 border border-white/5 rounded-2xl px-4 py-3.5 text-white focus:outline-none focus:border-amber-500/50 text-sm font-medium cursor-pointer [color-scheme:dark]"
                                >
                                    <option value="viewer">Ver</option>
                                    <option value="editor">Editar</option>
                                </select>
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-xs text-red-400 font-medium">
                                <AlertCircle size={16} className="shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {success && (
                            <div className="flex items-center gap-2 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs text-emerald-400 font-medium">
                                <UserCheck size={16} className="shrink-0" />
                                <span>Roteiro compartilhado com sucesso!</span>
                            </div>
                        )}

                        <button 
                            type="submit"
                            disabled={!email.trim() || loading}
                            className="w-full py-4 px-6 rounded-2xl bg-amber-500 text-black font-black uppercase tracking-widest text-[11px] hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-amber-500/20 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <UserPlus size={18} />
                            )}
                            {loading ? "Compartilhando..." : "Compartilhar Acesso"}
                        </button>
                    </form>

                    {/* Shared Users List */}
                    <div className="space-y-3">
                        <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-1">Usuários com Acesso</h3>
                        
                        {sharedUsers.length === 0 ? (
                            <p className="text-white/20 text-xs italic ml-1 font-medium">Nenhum compartilhamento ativo no momento.</p>
                        ) : (
                            <div className="max-h-[200px] overflow-y-auto custom-scrollbar border border-white/5 bg-white/[0.02] rounded-2xl divide-y divide-white/5">
                                {sharedUsers.map(([uid, details]) => (
                                    <div key={uid} className="flex justify-between items-center p-4 hover:bg-white/[0.02] transition-colors">
                                        <div className="min-w-0 pr-4">
                                            <p className="text-white text-xs font-bold truncate">
                                                {details.displayName}
                                            </p>
                                            <p className="text-white/30 text-[10px] truncate font-medium">
                                                {details.email}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                            <span className={cn(
                                                "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border",
                                                details.permission === "editor" 
                                                    ? "bg-amber-500/10 border-amber-500/20 text-amber-500" 
                                                    : "bg-white/5 border-white/10 text-white/40"
                                            )}>
                                                {details.permission === "editor" ? "Editor" : "Leitor"}
                                            </span>
                                            <button 
                                                onClick={() => handleUnshare(uid)}
                                                disabled={actionLoading !== null}
                                                className="p-1.5 hover:bg-red-500/10 rounded-lg text-white/20 hover:text-red-500 transition-all disabled:opacity-40"
                                                title="Remover Acesso"
                                            >
                                                {actionLoading === uid ? (
                                                    <Loader2 size={14} className="animate-spin" />
                                                ) : (
                                                    <Trash2 size={14} />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
