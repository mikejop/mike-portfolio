"use client";

import { useState } from "react";
import { Copy, Trash2, Clock, Calendar, FileText, Monitor, Share2, FolderDown, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useScriptStore } from "../store/useScriptStore";
import { useAppStore } from "@/store/useAppStore";
import { ScriptMetadata, AspectRatio } from "../store/types";
import { cn } from "@/lib/utils";
import { auth } from "@/lib/firebase";
import JSZip from "jszip";
import { DuplicateScriptModal } from "./DuplicateScriptModal";

const formatDateSafe = (dateVal: any, formatStr: string): string => {
    if (!dateVal) return "n/a";
    try {
        const d = new Date(dateVal);
        if (isNaN(d.getTime())) return "n/a";
        return format(d, formatStr, { locale: ptBR });
    } catch (error) {
        return "n/a";
    }
};

interface ScriptCardProps {
    script: ScriptMetadata;
    onClick: () => void;
}

export function ScriptCard({ script, onClick }: ScriptCardProps) {
    const { duplicateScript, deleteScript, setSharingScriptId, rooms, fetchScriptContent } = useScriptStore();
    const { requestConfirm, isProjectSidebarOpen } = useAppStore();
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDuplicateModal, setShowDuplicateModal] = useState(false);

    const userId = auth.currentUser?.uid;
    const isRoomScript = !!script.roomId;
    
    let isShared = false;
    let canEdit = true;
    let badgeText = "";
    
    if (isRoomScript) {
        const room = rooms.find(r => r.id === script.roomId);
        if (room) {
            const isOwner = room.createdBy === userId;
            const member = room.members[userId || ''];
            canEdit = isOwner || member?.permission === 'editor';
            badgeText = isOwner ? "Dono" : member?.permission === 'editor' ? "Editor" : "Leitor";
        } else {
            canEdit = false;
        }
    } else {
        isShared = !!(script.ownerId && script.ownerId !== userId);
        canEdit = !isShared || script.permission === 'editor';
        badgeText = script.permission === 'editor' ? "Editor" : "Leitor";
    }

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const title = isShared ? "Remover Acesso" : "Excluir Roteiro";
        const message = isShared 
            ? `Deseja realmente remover seu acesso ao roteiro "${script.titulo}"?`
            : `Deseja realmente excluir "${script.titulo}"? Esta ação não pode ser desfeita.`;

        if (await requestConfirm(title, message)) {
            setIsDeleting(true);
            try {
                await deleteScript(script.id);
            } catch (err: any) {
                console.error("Erro ao excluir roteiro:", err);
                alert(err.message || "Erro ao excluir roteiro.");
                setIsDeleting(false);
            }
        }
    };

    const handleDuplicate = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowDuplicateModal(true);
    };

    const handleShare = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSharingScriptId(script.id);
    };

    const handleSaveScript = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isSaving) return;
        setIsSaving(true);
        try {
            const activeScriptContent = await fetchScriptContent(script);
            const zip = new JSZip();
            
            const writersSet = new Set<string>();
            if (script.ownerEmail) {
                writersSet.add(script.ownerEmail.split('@')[0]);
            }
            if (script.contributions) {
                Object.values(script.contributions).forEach((c: any) => {
                    if (c.displayName) writersSet.add(c.displayName);
                });
            }
            activeScriptContent.cenas?.forEach((scene: any) => {
                scene.takes?.forEach((take: any) => {
                    if (take.editedByName) writersSet.add(take.editedByName);
                    if (take.audioAuthors) {
                        take.audioAuthors.forEach((a: string) => {
                            if (a) writersSet.add(a);
                        });
                    }
                    if (take.visualAuthors) {
                        take.visualAuthors.forEach((a: string) => {
                            if (a) writersSet.add(a);
                        });
                    }
                });
            });
            const writers = Array.from(writersSet);

            const manifest = {
                formatVersion: 1,
                roomId: script.roomId || null,
                scriptId: script.id,
                exportedAt: new Date().toISOString(),
                writers
            };
            zip.file("manifest.json", JSON.stringify(manifest, null, 2));
            
            console.log("EXPORT CONTENT (ScriptCard):", JSON.stringify(activeScriptContent, null, 2));
            zip.file("content.json", JSON.stringify(activeScriptContent, null, 2));
            
            const imagesFolder = zip.folder("images");
            if (imagesFolder) {
                const takesWithImages = activeScriptContent.cenas.flatMap(c => c.takes).filter(t => t.imagemRef);
                for (const take of takesWithImages) {
                    try {
                        const response = await fetch(take.imagemRef);
                        if (response.ok) {
                            const blob = await response.blob();
                            const contentType = blob.type;
                            let ext = 'webp';
                            if (contentType === 'image/jpeg') ext = 'jpg';
                            else if (contentType === 'image/png') ext = 'png';
                            
                            imagesFolder.file(`${take.id}.${ext}`, blob);
                        }
                    } catch (err) {
                        console.warn(`Could not fetch/zip image for take ${take.id}:`, err);
                    }
                }
            }
            
            const zipBlob = await zip.generateAsync({ type: "blob" });
            const url = URL.createObjectURL(zipBlob);
            const a = document.createElement("a");
            a.href = url;
            const sanitizedTitle = (activeScriptContent.titulo || "roteiro").toLowerCase().replace(/[^a-z0-9]+/g, "_");
            a.download = `${sanitizedTitle}.roteiroav`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error exporting script:", error);
            alert("Erro ao exportar o roteiro.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div 
            onClick={isDeleting ? undefined : onClick}
            className={cn(
                "group relative bg-[#1a1a1a]/40 border rounded-2xl p-3.5 sm:p-4.5 transition-all duration-300 flex flex-col w-full shadow-lg overflow-hidden",
                isProjectSidebarOpen ? "aspect-[2/3]" : "aspect-[3/2]",
                isDeleting
                    ? "border-red-500/20 opacity-60 cursor-not-allowed"
                    : "border-white/5 hover:bg-[#222222]/60 hover:border-white/10 cursor-pointer hover:shadow-2xl hover:-translate-y-1"
            )}
        >
            {/* Deleting overlay + progress bar */}
            {isDeleting && (
                <>
                    <div className="absolute inset-0 bg-red-950/20 rounded-2xl z-10 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/5 z-20 overflow-hidden rounded-b-2xl">
                        <div
                            className="h-full bg-gradient-to-r from-amber-500 via-red-500 to-amber-500 animate-[delete-bar_1.2s_ease-in-out_infinite]"
                            style={{ width: '45%' }}
                        />
                    </div>
                    <div className="absolute inset-x-0 bottom-2 flex justify-center z-20 pointer-events-none">
                        <span className="text-[9px] font-black uppercase tracking-[0.25em] text-red-400/80 animate-pulse">
                            {isShared ? 'Removendo acesso...' : 'Excluindo...'}
                        </span>
                    </div>
                </>
            )}
            {/* Header */}
            <div className="flex justify-between items-start mb-2 gap-2">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div className="bg-amber-500/10 p-2 rounded-xl shrink-0">
                        <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                        <h3 className={cn(
                            "text-white font-bold leading-tight group-hover:text-amber-500 transition-colors break-words",
                            isProjectSidebarOpen ? "text-base sm:text-lg md:text-xl" : "text-sm sm:text-base"
                        )}>
                            {script.titulo || "Sem título"}
                        </h3>
                        {/* Share/Room Badge */}
                        {(isShared || isRoomScript) && (
                            <div className="flex mt-0.5">
                                <div className={cn(
                                    "px-1.5 py-0.5 rounded text-[7px] sm:text-[8px] font-black uppercase tracking-widest border transition-all truncate shrink-0",
                                    badgeText === "Leitor"
                                        ? "bg-white/5 border-white/10 text-white/40"
                                        : "bg-amber-500/10 border-amber-500/20 text-amber-500"
                                )}>
                                    {isRoomScript ? `Sala: ${badgeText}` : badgeText}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Client Badge */}
                {script.clientName && (
                    <div className="bg-white/5 px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-white/20 border border-white/5 transition-colors group-hover:text-amber-500/30 truncate max-w-[30%] shrink-0">
                        {script.clientName}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-h-0 flex flex-col justify-center">
                <p className="text-white/40 text-[10px] sm:text-xs line-clamp-2 mb-1.5 leading-relaxed font-medium">
                    {script.descricao || "Sem briefing definido..."}
                </p>
            </div>
            {/* Script stats */}
            <div className="grid grid-cols-3 gap-1.5 py-1.5 border-t border-b border-white/5 my-2 text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-white/40">
                <div className="flex flex-col items-center justify-center p-1 bg-white/[0.01] rounded-lg">
                    <span className="text-amber-500 font-bold text-[10px] sm:text-xs leading-none mb-0.5">{script.totalCenas || 0}</span>
                    <span>Cenas</span>
                </div>
                <div className="flex flex-col items-center justify-center p-1 bg-white/[0.01] rounded-lg">
                    <span className="text-amber-500 font-bold text-[10px] sm:text-xs leading-none mb-0.5">{script.totalTakes || 0}</span>
                    <span>Takes</span>
                </div>
                <div className="flex flex-col items-center justify-center p-1 bg-white/[0.01] rounded-lg">
                    <span className="text-amber-500 font-bold text-[10px] sm:text-xs leading-none mb-0.5">{script.totalWords || 0}</span>
                    <span>Palavras</span>
                </div>
            </div>

            {/* Footer / Meta */}
            <div className="space-y-1.5 pt-2 border-t border-white/5">
                <div className="flex items-center justify-between text-[9px] sm:text-[10px] font-black uppercase tracking-widest">
                    <div className="flex items-center gap-1.5 text-white/20">
                        <Monitor size={10} className="text-amber-500/50" />
                        <span>{script.aspectRatio}</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 text-[9px] sm:text-[10px] text-white/30">
                        <Calendar size={10} className="shrink-0" />
                        <span className="truncate">
                            {formatDateSafe(script.criadoEm, "dd MMM yy")}
                        </span>
                    </div>
                    <div className="relative flex items-center justify-end overflow-hidden h-5">
                        {/* Date - slides down on hover */}
                        <div className="flex items-center gap-2 text-[9px] sm:text-[10px] text-white/30 transition-all duration-300 group-hover:translate-y-5">
                            <Clock size={10} className="shrink-0" />
                            <span className="truncate">
                                Mod. {formatDateSafe(script.atualizadoEm, "dd/MM")}
                            </span>
                        </div>
                        
                        {/* Actions - slides up from below on hover */}
                        <div className="absolute inset-0 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-5 group-hover:translate-y-0">
                            <button 
                                onClick={handleSaveScript}
                                disabled={isSaving}
                                className="p-1 hover:bg-white/10 rounded-lg text-white/40 hover:text-amber-500 transition-colors disabled:opacity-50 flex items-center justify-center"
                                title="Salvar Roteiro (.roteiroav)"
                            >
                                {isSaving ? (
                                    <Loader2 size={12} className="animate-spin text-amber-500" />
                                ) : (
                                    <FolderDown size={12} />
                                )}
                            </button>
                            {!isShared && !isRoomScript && (
                                <button 
                                    onClick={handleShare}
                                    className="p-1 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-colors"
                                    title="Compartilhar"
                                >
                                    <Share2 size={12} />
                                </button>
                            )}
                            {canEdit && (
                                <button 
                                    onClick={handleDuplicate}
                                    className="p-1 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-colors"
                                    title="Duplicar"
                                >
                                    <Copy size={12} />
                                </button>
                            )}
                            {(canEdit || isShared) && (
                                <button 
                                    onClick={handleDelete}
                                    className="p-1 hover:bg-red-500/10 rounded-lg text-white/40 hover:text-red-500 transition-colors"
                                    title={isShared ? "Remover Acesso" : "Excluir"}
                                >
                                    <Trash2 size={12} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <DuplicateScriptModal 
                script={script} 
                isOpen={showDuplicateModal} 
                onClose={() => setShowDuplicateModal(false)} 
            />
        </div>
    );
}
