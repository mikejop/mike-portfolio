"use client";

import { useScriptStore } from "../../store/useScriptStore";
import { AspectRatio } from "../../store/types";
import { Calendar, Monitor, ChevronLeft, Layout, FileText, Clock, FileDown, Share2, Loader2, Shield, Plus, FolderUp, FolderDown } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { exportScriptToPDF } from "../../utils/pdfExport";
import { useAuth } from "@/hooks/useAuth";
import JSZip from "jszip";
import * as Y from "yjs";
import { db } from "@/lib/firebase";
import { doc, writeBatch, collection, getDocs, setDoc, serverTimestamp } from "firebase/firestore";
import { uploadImageToStorage } from "@/lib/storage";
import { ImportReviewModal } from "./ImportReviewModal";
import { ScriptFull } from "../../store/types";

function uint8ArrayToBase64(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

function getActiveWriters(content: any) {
    if (!content) return [];
    const writersMap = new Map<string, { uid: string; displayName: string; initials: string }>();
    content.cenas?.forEach((scene: any) => {
        scene.takes?.forEach((take: any) => {
            if (take.editedBy && take.editedByName) {
                const text = `${take.audio || ""}${take.visual || ""}`.trim();
                if (text.length > 0) {
                    const names = take.editedByName.trim().split(/\s+/);
                    const initials = names.length > 1 
                        ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
                        : `${names[0][0] || ""}${names[0][1] || ""}`.toUpperCase();
                    
                    writersMap.set(take.editedBy, {
                        uid: take.editedBy,
                        displayName: take.editedByName,
                        initials: initials.slice(0, 2)
                    });
                }
            }
        });
    });
    return Array.from(writersMap.values());
}

export function EditorHeader() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { 
        activeScriptId, 
        activeScriptContent, 
        updateScriptContent,
        scripts,
        sharedScripts,
        roomScripts,
        rooms,
        activeRoomId,
        activeScriptVersion,
        canEditActiveScript,
        setSharingScriptId,
        createScriptVersion,
        switchScriptVersion,
        importScriptAsNewVersion,
        roomPresence
    } = useScriptStore();
    const { user, profile } = useAuth();
    const [isExporting, setIsExporting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showVersionDropdown, setShowVersionDropdown] = useState(false);
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [importedContent, setImportedContent] = useState<ScriptFull | null>(null);
    const [importedImages, setImportedImages] = useState<Record<string, Blob>>({});

    if (!activeScriptContent || !activeScriptId) return null;

    const metadata = scripts.find(s => s.id === activeScriptId) || 
                     sharedScripts.find(s => s.id === activeScriptId) ||
                     roomScripts.find(s => s.id === activeScriptId);
                     
    const urlRoomId = searchParams.get("roomId");
    const urlTab = searchParams.get("tab");

    const handleBack = () => {
        const targetRoomId = urlRoomId || metadata?.roomId;
        if (targetRoomId) {
            router.push(`/tools/script-editor?roomId=${targetRoomId}`);
        } else if (urlTab) {
            router.push(`/tools/script-editor?tab=${urlTab}`);
        } else {
            router.push("/tools/script-editor");
        }
    };
                     
    const isOwner = scripts.some(s => s.id === activeScriptId);
    const canEdit = canEditActiveScript();

    // Determine the badge text based on room membership or sharing permissions
    const isRoomScript = !!(metadata?.roomId || urlRoomId);
    let badgeText = "Leitor";
    if (isRoomScript) {
        const targetRoomId = metadata?.roomId || urlRoomId;
        const room = rooms.find(r => r.id === targetRoomId);
        if (room) {
            const isRoomOwner = room.createdBy === user?.uid;
            const member = room.members[user?.uid || ''];
            badgeText = isRoomOwner ? "Dono" : member?.permission === 'editor' ? "Editor" : "Leitor";
        } else {
            // fallback if rooms haven't loaded yet
            badgeText = canEdit ? "Editor" : "Leitor";
        }
    } else {
        const shared = sharedScripts.find(s => s.id === activeScriptId);
        badgeText = shared?.permission === 'editor' ? "Editor" : "Leitor";
    }
    const ratios: AspectRatio[] = ["16:9", "9:16", "5:4", "4:5", "1:1"];

    const versions = metadata?.availableVersions || [1];

    const formatLabel = (v: number | string) => {
        return String(v).includes('.') ? `V${v}` : `V${String(v).padStart(2, '0')}`;
    };

    const handleUpdate = (updates: any) => {
        if (!canEdit) return;
        updateScriptContent(activeScriptId, updates);
    };

    const handleExport = async () => {
        if (!metadata) return;
        setIsExporting(true);
        try {
            const authorName = profile?.displayName || 'Autor Desconhecido';
            await exportScriptToPDF(activeScriptContent, { ...metadata, authorName } as any);
        } finally {
            setIsExporting(false);
        }
    };

    const handleSaveScript = async () => {
        if (!activeScriptContent || !activeScriptId) return;
        setIsSaving(true);
        try {
            const zip = new JSZip();
            
            const writersSet = new Set<string>();
            if (metadata?.ownerEmail) {
                writersSet.add(metadata.ownerEmail.split('@')[0]);
            }
            if (metadata?.contributions) {
                Object.values(metadata.contributions).forEach((c: any) => {
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
                roomId: activeRoomId || null,
                scriptId: activeScriptId,
                exportedAt: new Date().toISOString(),
                writers
            };
            zip.file("manifest.json", JSON.stringify(manifest, null, 2));
            
            console.log("EXPORT CONTENT (EditorHeader):", JSON.stringify(activeScriptContent, null, 2));
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
                    } catch (e) {
                        console.warn(`Could not fetch/zip image for take ${take.id}:`, e);
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

    const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        e.target.value = "";
        
        if (!file.name.endsWith(".roteiroav")) {
            alert("Por favor, selecione apenas arquivos com a extensão .roteiroav");
            return;
        }
        
        try {
            const zip = await JSZip.loadAsync(file);
            
            const manifestFile = zip.file("manifest.json");
            if (!manifestFile) {
                alert("Arquivo inválido: manifest.json não encontrado.");
                return;
            }
            const manifestJson = JSON.parse(await manifestFile.async("text"));
            if (manifestJson.formatVersion !== 1) {
                alert("Versão de formato não suportada.");
                return;
            }
            
            const contentFile = zip.file("content.json");
            if (!contentFile) {
                alert("Arquivo inválido: content.json não encontrado.");
                return;
            }
            const contentJson: ScriptFull = JSON.parse(await contentFile.async("text"));
            console.log("IMPORT CONTENT (EditorHeader):", JSON.stringify(contentJson, null, 2));
            
            const imagesFolder = zip.folder("images");
            const imageMap: Record<string, Blob> = {};
            if (imagesFolder) {
                const files = Object.keys(imagesFolder.files);
                for (const filepath of files) {
                    const zipFile = imagesFolder.file(filepath);
                    if (zipFile && !zipFile.dir) {
                        const filename = filepath.split('/').pop() || '';
                        const parts = filename.split('.');
                        const takeId = parts[0];
                        if (takeId) {
                            const blob = await zipFile.async("blob");
                            imageMap[takeId] = blob;
                        }
                    }
                }
            }
            
            setImportedContent(contentJson);
            setImportedImages(imageMap);
            setImportModalOpen(true);
        } catch (error) {
            console.error("Error reading import file:", error);
            alert("Falha ao ler o arquivo .roteiroav. Certifique-se de que é um arquivo válido.");
        }
    };

    const handleApplyImport = async (finalContent: ScriptFull) => {
        if (!activeScriptId) return;
        
        const updatedCenas = await Promise.all(
            finalContent.cenas.map(async (scene) => {
                const updatedTakes = await Promise.all(
                    scene.takes.map(async (take) => {
                        const localImageBlob = importedImages[take.id];
                        if (localImageBlob) {
                            try {
                                const fileExtension = localImageBlob.type === 'image/jpeg' ? 'jpg' : 'webp';
                                const path = activeRoomId
                                    ? `rooms/${activeRoomId}/roteiros/${activeScriptId}/takes/${take.id}-${Date.now()}.${fileExtension}`
                                    : `users/${user?.uid}/roteiros/${activeScriptId}/takes/${take.id}-${Date.now()}.${fileExtension}`;
                                
                                const downloadUrl = await uploadImageToStorage(path, localImageBlob);
                                return {
                                    ...take,
                                    imagemRef: downloadUrl,
                                    imageUploadedBy: user?.uid,
                                    imageUploadedByName: profile?.displayName || user?.email || 'Autor'
                                };
                            } catch (uploadErr) {
                                console.error(`Failed to upload image for take ${take.id}:`, uploadErr);
                                return take;
                            }
                        }
                        return take;
                    })
                );
                return {
                    ...scene,
                    takes: updatedTakes
                };
            })
        );
        
        const fullyUpdatedContent = {
            ...finalContent,
            cenas: updatedCenas
        };
        
        await importScriptAsNewVersion(fullyUpdatedContent);
        setImportModalOpen(false);
        alert("Roteiro importado com sucesso numa nova versão!");
    };

    const activeWriters = getActiveWriters(activeScriptContent);
    const activeUsers = roomPresence.filter(p => p.activeScriptId === activeScriptId);

    return (
        <header className="sticky top-0 z-30 bg-[#1a1a1a]/80 backdrop-blur-xl border-b border-white/5 px-10 py-6">
            <div className="max-w-[1400px] mx-auto flex flex-col gap-6">
                
                {/* Top Row: Back Navigation, Active Writer Avatars, Aspect Ratios */}
                <div className="flex items-center justify-between">
                    <button 
                        onClick={handleBack}
                        className="group flex items-center gap-3 text-white/40 hover:text-amber-500 transition-all"
                    >
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-amber-500/10 border border-white/10 group-hover:border-amber-500/20 transition-all">
                            <ChevronLeft size={16} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Voltar</span>
                    </button>

                    {/* Real-time Active Users Avatars */}
                    {activeUsers.length > 0 && (
                        <div className="flex items-center gap-3">
                            <div className="flex -space-x-1.5 overflow-hidden items-center" title="Usuários editando este roteiro agora">
                                {activeUsers.map((writer) => {
                                    const colors = [
                                        'bg-rose-500', 'bg-pink-500', 'bg-purple-500', 'bg-violet-500', 
                                        'bg-indigo-500', 'bg-blue-500', 'bg-sky-500', 'bg-cyan-500', 
                                        'bg-teal-500', 'bg-emerald-500', 'bg-green-500', 'bg-amber-500', 'bg-orange-500'
                                    ];
                                    const colorIndex = writer.uid.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
                                    const bgColor = colors[colorIndex];
                                    return (
                                        <div 
                                            key={writer.uid} 
                                            title={writer.displayName}
                                            className={cn(
                                                "inline-flex items-center justify-center h-7 w-7 rounded-full text-[9px] font-bold text-black border border-[#1a1a1a] shadow-md select-none transition-transform hover:scale-110 hover:z-10 cursor-help uppercase",
                                                bgColor
                                            )}
                                        >
                                            {writer.displayName.substring(0, 2)}
                                        </div>
                                    );
                                })}
                            </div>
                            <span className="relative flex h-2 w-2 shrink-0">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                        </div>
                    )}

                    <div className="flex items-center gap-2 p-1 bg-white/5 rounded-2xl border border-white/5">
                        {ratios.map((ratio) => (
                            <button
                                key={ratio}
                                disabled={!canEdit}
                                onClick={() => handleUpdate({ aspectRatio: ratio })}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all flex items-center gap-2",
                                    activeScriptContent.aspectRatio === ratio
                                        ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
                                        : "text-white/30 hover:text-white hover:bg-white/5",
                                    !canEdit && "opacity-50 cursor-not-allowed"
                                )}
                            >
                                <Layout size={12} className={activeScriptContent.aspectRatio === ratio ? "text-black" : "text-white/20"} />
                                {ratio}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Row: Info */}
                <div className="flex items-end justify-between gap-12">
                    <div className="flex-1 space-y-4">
                        <div className="space-y-1">
                            {/* Version and Title Block */}
                            <div className="flex items-center justify-start gap-1">
                                <div className="grid">
                                    {/* Invisible span dictates the exact pixel width of the text */}
                                    <span className="invisible whitespace-pre col-start-1 row-start-1 text-4xl font-black uppercase tracking-tighter min-w-[50px] pointer-events-none">
                                        {activeScriptContent.titulo || 'Nome do Roteiro'}
                                    </span>
                                    {/* Input fills perfectly this defined space */}
                                    <input 
                                        disabled={!canEdit}
                                        value={activeScriptContent.titulo}
                                        onChange={(e) => handleUpdate({ titulo: e.target.value })}
                                        className={cn(
                                            "col-start-1 row-start-1 bg-transparent text-4xl font-black text-white uppercase tracking-tighter focus:outline-none placeholder:text-white/10 w-full",
                                            !canEdit && "cursor-default"
                                        )}
                                        placeholder="Nome do Roteiro"
                                    />
                                </div>

                                {/* Version Badge - click to open dropdown */}
                                <div className="relative flex items-center">
                                    <button
                                        onClick={() => setShowVersionDropdown(!showVersionDropdown)}
                                        className="mt-2 px-2 py-1 rounded text-[10px] font-bold text-white/30 hover:text-white/60 hover:bg-white/5 uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1 select-none"
                                    >
                                        <span>
                                            {formatLabel(activeScriptVersion || 1)}
                                        </span>
                                        <span className="text-[8px] opacity-65">▼</span>
                                    </button>
                                    
                                    {showVersionDropdown && (
                                        <>
                                            <div 
                                                className="fixed inset-0 z-40 cursor-default" 
                                                onClick={() => setShowVersionDropdown(false)} 
                                            />
                                            <div className="absolute left-2 top-full mt-1 w-48 bg-[#1e1e1e]/95 border border-white/10 rounded-xl shadow-2xl z-50 flex flex-col p-1.5 backdrop-blur-md">
                                                <button
                                                    onClick={async () => {
                                                        setShowVersionDropdown(false);
                                                        await createScriptVersion();
                                                    }}
                                                    className="flex items-center gap-2 w-full px-3 py-2 text-xs font-semibold text-left rounded-lg hover:bg-white/10 text-amber-500 hover:text-amber-400 transition-all cursor-pointer"
                                                >
                                                    <Plus size={12} />
                                                    <span>Nova Versão</span>
                                                </button>

                                                {versions.length > 1 && (
                                                    <>
                                                        <div className="h-[1px] bg-white/5 my-1" />
                                                        <div className="px-3 py-1 text-[9px] font-black uppercase tracking-wider text-white/20">
                                                            Versões Anteriores
                                                        </div>
                                                        <div className="max-h-48 overflow-y-auto custom-scrollbar">
                                                            {versions
                                                                .filter(v => v !== activeScriptVersion)
                                                                .reverse()
                                                                .map(v => (
                                                                    <button
                                                                        key={v}
                                                                        onClick={async () => {
                                                                            setShowVersionDropdown(false);
                                                                            await switchScriptVersion(v);
                                                                        }}
                                                                        className="flex items-center justify-between w-full px-3 py-1.5 text-xs text-left rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition-all cursor-pointer"
                                                                    >
                                                                        <span>{formatLabel(v)}</span>
                                                                    </button>
                                                                ))}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                            
                            {/* Editable Briefing */}
                            <div className="flex items-center gap-3 group">
                                <FileText size={14} className="text-white/20 group-focus-within:text-amber-500" />
                                <input 
                                    disabled={!canEdit}
                                    value={activeScriptContent.descricao}
                                    onChange={(e) => handleUpdate({ descricao: e.target.value })}
                                    className={cn(
                                        "flex-1 bg-transparent text-sm text-white/40 font-medium focus:outline-none placeholder:text-white/10 italic",
                                        !canEdit && "cursor-default"
                                    )}
                                    placeholder="Adicione um briefing para este roteiro..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-10">
                        {/* Dates */}
                        <div className="flex items-center gap-8">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Clock size={10} /> Criado em
                                </label>
                                <div className="text-xs text-white/60 font-medium bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                                    {format(new Date(activeScriptContent.criadoEm), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Calendar size={10} /> Entrega
                                </label>
                                <div className="relative group">
                                    <input 
                                        disabled={!canEdit}
                                        type="date"
                                        value={activeScriptContent.entregaEm || ""}
                                        onChange={(e) => handleUpdate({ entregaEm: e.target.value })}
                                        className={cn(
                                            "bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg px-3 py-1.5 text-xs text-white/60 focus:outline-none focus:border-amber-500/50 transition-all cursor-pointer [color-scheme:dark]",
                                            !canEdit && "cursor-default opacity-60"
                                        )}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                            {canEdit && (
                                <>
                                    <button 
                                        className="p-3 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/10 rounded-xl transition-all flex items-center justify-center shrink-0"
                                        title="Importar Roteiro (.roteiroav)"
                                        onClick={() => document.getElementById('import-script-input')?.click()}
                                    >
                                        <FolderUp size={20} />
                                    </button>
                                    <input 
                                        type="file" 
                                        accept=".roteiroav" 
                                        className="hidden" 
                                        id="import-script-input" 
                                        onChange={handleImportFileChange} 
                                    />
                                </>
                            )}
                            <button 
                                className="p-3 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/10 rounded-xl transition-all flex items-center justify-center shrink-0 disabled:opacity-50"
                                title="Salvar Roteiro (.roteiroav)"
                                onClick={handleSaveScript}
                                disabled={isSaving}
                            >
                                {isSaving ? <Loader2 size={20} className="animate-spin" /> : <FolderDown size={20} />}
                            </button>
                            <button 
                                className="p-3 bg-amber-500 rounded-xl text-black hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20 group disabled:opacity-50 disabled:cursor-wait"
                                title="Exportar PDF"
                                onClick={handleExport}
                                disabled={isExporting}
                            >
                                {isExporting ? <Loader2 size={20} className="animate-spin" /> : <FileDown size={20} className="group-hover:scale-110 transition-transform" />}
                            </button>
                            {isOwner ? (
                                <button 
                                    className="p-3 bg-white/5 border border-white/10 rounded-xl text-white/60 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center shrink-0"
                                    title="Compartilhar"
                                    onClick={() => setSharingScriptId(activeScriptId)}
                                >
                                    <Share2 size={20} />
                                </button>
                            ) : (
                                <div className="px-3.5 py-3 bg-white/5 border border-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest text-white/40 flex items-center gap-1.5 select-none shrink-0" title={`Permissão: ${badgeText}`}>
                                    <Shield size={14} className="text-amber-500" />
                                    <span>{badgeText}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {importedContent && (
                <ImportReviewModal
                    isOpen={importModalOpen}
                    onClose={() => {
                        setImportModalOpen(false);
                        setImportedContent(null);
                        setImportedImages({});
                    }}
                    importedContent={importedContent}
                    imageMap={importedImages}
                    onApply={handleApplyImport}
                />
            )}
        </header>
    );
}

