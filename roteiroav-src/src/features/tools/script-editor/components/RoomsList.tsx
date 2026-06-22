"use client";

import { useScriptStore } from "../store/useScriptStore";
import { useAppStore } from "@/store/useAppStore";
import { auth } from "@/lib/firebase";
import { format } from "date-fns";
import { FolderOpen, FolderPlus, Users, Trash2, FolderUp } from "lucide-react";

interface RoomsListProps {
    onOpenCreateRoom: () => void;
}

export function RoomsList({ onOpenCreateRoom }: RoomsListProps) {
    const { 
        rooms, 
        setActiveRoomId, 
        deleteRoom 
    } = useScriptStore();

    const currentUserId = auth.currentUser?.uid;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">
                    Minhas Salas de Roteiro
                </h2>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => document.getElementById('dashboard-import-script-input')?.click()}
                        className="p-2.5 bg-white/5 hover:bg-white/10 text-white border border-white/5 hover:border-white/10 rounded-xl transition-all flex items-center justify-center"
                        title="Importar Roteiro (.roteiroav)"
                    >
                        <FolderUp size={16} className="text-amber-500" />
                    </button>
                    <button
                        onClick={onOpenCreateRoom}
                        className="bg-white/5 hover:bg-white/10 text-white border border-white/5 hover:border-white/10 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                    >
                        <FolderPlus size={14} className="text-amber-500" />
                        Criar Nova Sala
                    </button>
                </div>
            </div>
            
            {rooms.length === 0 ? (
                <div className="bg-[#1a1a1a]/40 border border-white/5 rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-4">
                    <FolderOpen size={40} className="text-white/10" />
                    <div className="max-w-xs space-y-1">
                        <h4 className="text-white/40 font-bold text-xs uppercase tracking-wider">Nenhuma sala criada</h4>
                        <p className="text-white/20 text-[10px] leading-relaxed">
                            Crie uma sala de roteiro para trabalhar de forma organizada e convidar sua equipe.
                        </p>
                    </div>
                    <button 
                        onClick={onOpenCreateRoom}
                        className="bg-amber-500 hover:bg-amber-400 text-black px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-amber-500/10 cursor-pointer"
                    >
                        Criar Primeira Sala
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {rooms.map((room) => {
                        const isRoomOwner = room.createdBy === currentUserId;
                        return (
                            <div
                                key={room.id}
                                onClick={() => setActiveRoomId(room.id)}
                                className="group relative bg-[#1a1a1a]/40 border border-white/5 rounded-2xl p-6 hover:bg-[#222222]/60 hover:border-white/10 transition-all duration-300 cursor-pointer flex flex-col justify-between w-full aspect-[3/2] shadow-lg hover:shadow-2xl hover:-translate-y-1"
                            >
                                <div>
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="bg-amber-500/10 p-2.5 rounded-xl text-amber-500">
                                            <Users size={18} />
                                        </div>
                                        {isRoomOwner && (
                                            <button
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    const { requestConfirm } = useAppStore.getState();
                                                    if (await requestConfirm("Excluir Sala", `Deseja realmente excluir a sala "${room.name}"? Todos os roteiros nela serão excluídos permanentemente.`)) {
                                                        await deleteRoom(room.id);
                                                    }
                                                }}
                                                className="p-1.5 hover:bg-red-500/10 rounded-lg text-white/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                                                title="Excluir Sala"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                    <h3 className="text-white font-bold text-base line-clamp-1 group-hover:text-amber-500 transition-colors">
                                        {room.name}
                                    </h3>
                                    <p className="text-white/40 text-[9px] font-black uppercase tracking-widest mt-1">
                                        {Object.keys(room.members || {}).length} integrante(s)
                                    </p>
                                </div>
                                <div className="text-[9px] text-white/25 border-t border-white/5 pt-2.5 flex justify-between">
                                    <span className="truncate max-w-[120px]">Por: {room.members[room.createdBy]?.displayName || room.createdByEmail.split('@')[0]}</span>
                                    <span>{format(new Date(room.createdAt), "dd/MM/yy")}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
