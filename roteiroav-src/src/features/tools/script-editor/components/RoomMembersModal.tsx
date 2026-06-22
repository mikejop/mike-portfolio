"use client";

import { useState, useEffect, useRef } from "react";
import { useScriptStore } from "../store/useScriptStore";
import { X, UserPlus, Trash2, Loader2, Mail, Shield, UserCheck, AlertCircle, Search } from "lucide-react";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { cn } from "@/lib/utils";

interface RoomMembersModalProps {
    roomId: string;
    isOpen: boolean;
    onClose: () => void;
}

interface UserSuggestion {
    uid: string;
    email: string;
    displayName: string;
}

export function RoomMembersModal({ roomId, isOpen, onClose }: RoomMembersModalProps) {
    const { rooms, addMemberToRoom, removeMemberFromRoom } = useScriptStore();
    const [email, setEmail] = useState("");
    const [permission, setPermission] = useState<'editor' | 'viewer'>("viewer");
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Autocomplete state
    const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
    const [searchingUsers, setSearchingUsers] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const room = rooms.find(r => r.id === roomId);
    const currentUserId = auth.currentUser?.uid;

    // Close suggestions dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Query Firestore users for autocomplete
    useEffect(() => {
        if (email.trim().length < 2) {
            setSuggestions([]);
            return;
        }

        const fetchSuggestions = async () => {
            setSearchingUsers(true);
            try {
                const searchText = email.trim().toLowerCase();
                const usersRef = collection(db, "users");
                const q = query(
                    usersRef,
                    where("email", ">=", searchText),
                    where("email", "<=", searchText + "\uf8ff"),
                    limit(5)
                );
                const snap = await getDocs(q);
                const list = snap.docs
                    .map(doc => doc.data() as UserSuggestion)
                    // Don't show already added members or the current user
                    .filter(user => user.uid !== currentUserId && !room?.members[user.uid]);
                setSuggestions(list);
            } catch (err) {
                console.error("Erro ao carregar sugestões:", err);
            } finally {
                setSearchingUsers(false);
            }
        };

        const timer = setTimeout(fetchSuggestions, 300);
        return () => clearTimeout(timer);
    }, [email, room, currentUserId]);

    if (!isOpen || !room) return null;

    const isOwner = room.createdBy === currentUserId;
    const membersList = Object.values(room.members);

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim() || loading) return;

        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            await addMemberToRoom(roomId, email, permission);
            setEmail("");
            setSuggestions([]);
            setShowSuggestions(false);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            setError(err.message || "Erro ao convidar usuário.");
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveMember = async (uid: string) => {
        if (actionLoading) return;
        setActionLoading(uid);
        setError(null);

        try {
            await removeMemberFromRoom(roomId, uid);
        } catch (err: any) {
            setError(err.message || "Erro ao remover membro.");
        } finally {
            setActionLoading(null);
        }
    };

    const handleSuggestionClick = (suggestedEmail: string) => {
        setEmail(suggestedEmail);
        setShowSuggestions(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-[#1a1a1a] border border-white/10 w-full max-w-lg rounded-[28px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="p-8">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-xl font-black text-white uppercase tracking-wider">Membros da Sala</h2>
                            <p className="text-white/40 text-[10px] font-black mt-1 uppercase tracking-widest truncate max-w-[320px]">
                                {room.name}
                            </p>
                        </div>
                        <button 
                            onClick={onClose}
                            className="p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Add Member Form (Only visible to room owner) */}
                    {isOwner ? (
                        <form onSubmit={handleAddMember} className="space-y-4 mb-8">
                            <div className="flex flex-col gap-1.5 relative" ref={containerRef}>
                                <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-1">Adicionar por E-mail</label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                        <input 
                                            type="email" 
                                            required
                                            value={email}
                                            onFocus={() => setShowSuggestions(true)}
                                            onChange={(e) => {
                                                setEmail(e.target.value);
                                                setError(null);
                                                setShowSuggestions(true);
                                            }}
                                            placeholder="exemplo@email.com"
                                            className="w-full bg-white/5 border border-white/5 rounded-2xl pl-11 pr-5 py-3.5 text-white placeholder:text-white/10 focus:outline-none focus:border-amber-500/50 focus:bg-white/[0.08] transition-all text-sm font-medium"
                                        />
                                    </div>
                                    <select 
                                        value={permission}
                                        onChange={(e) => setPermission(e.target.value as 'editor' | 'viewer')}
                                        className="bg-[#242424] border border-white/5 rounded-2xl px-4 py-3.5 text-white text-xs font-black uppercase tracking-wider focus:outline-none focus:border-amber-500/50"
                                    >
                                        <option value="viewer">Leitor</option>
                                        <option value="editor">Editor</option>
                                    </select>

                                    <button 
                                        type="submit"
                                        disabled={loading || !email.trim()}
                                        className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:hover:bg-amber-500 text-black px-6 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/5"
                                    >
                                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                                    </button>
                                </div>

                                {/* Autocomplete Dropdown */}
                                {showSuggestions && (suggestions.length > 0 || searchingUsers) && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-[#222] border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50 divide-y divide-white/5">
                                        {searchingUsers && (
                                            <div className="p-4 flex items-center gap-3 text-xs text-white/40 italic">
                                                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
                                                Buscando usuários cadastrados...
                                            </div>
                                        )}
                                        {suggestions.map((s) => (
                                            <button
                                                key={s.uid}
                                                type="button"
                                                onClick={() => handleSuggestionClick(s.email)}
                                                className="w-full text-left p-4 hover:bg-white/5 transition-colors flex flex-col gap-0.5"
                                            >
                                                <span className="text-xs font-bold text-white">{s.displayName}</span>
                                                <span className="text-[10px] text-white/40">{s.email}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </form>
                    ) : (
                        <div className="bg-white/5 border border-white/5 px-4 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center gap-2 mb-8">
                            <Shield size={14} className="text-amber-500" />
                            Apenas o dono da sala pode gerenciar ou adicionar membros.
                        </div>
                    )}

                    {error && (
                        <div className="mb-6 text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-3.5 rounded-2xl flex items-start gap-2.5">
                            <AlertCircle size={16} className="shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    {success && (
                        <div className="mb-6 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-4 py-3.5 rounded-2xl flex items-center gap-2.5">
                            <UserCheck size={16} className="shrink-0" />
                            <span>Membro adicionado com sucesso!</span>
                        </div>
                    )}

                    {/* Members List */}
                    <div className="space-y-3 max-h-[260px] overflow-y-auto custom-scrollbar pr-1">
                        <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-1 mb-2">Integrantes ({membersList.length})</h3>
                        
                        {membersList.map((member) => {
                            const isMemberOwner = member.uid === room.createdBy;
                            return (
                                <div 
                                    key={member.uid} 
                                    className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-all"
                                >
                                    <div className="flex flex-col min-w-0 pr-3">
                                        <span className="text-xs font-bold text-white truncate">{member.displayName}</span>
                                        <span className="text-[10px] text-white/40 truncate">{member.email}</span>
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0">
                                        {/* Permission Badge */}
                                        <span className={cn(
                                            "text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border",
                                            isMemberOwner 
                                                ? "bg-amber-500/10 border-amber-500/20 text-amber-500"
                                                : member.permission === 'editor'
                                                    ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                                                    : "bg-white/5 border-white/5 text-white/40"
                                        )}>
                                            {isMemberOwner ? "Proprietário" : member.permission === 'editor' ? "Editor" : "Leitor"}
                                        </span>

                                        {/* Remove Button */}
                                        {isOwner && !isMemberOwner && (
                                            <button
                                                onClick={() => handleRemoveMember(member.uid)}
                                                disabled={actionLoading === member.uid}
                                                className="p-2 hover:bg-red-500/10 rounded-xl text-white/20 hover:text-red-400 transition-all"
                                            >
                                                {actionLoading === member.uid ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="w-4 h-4" />
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
