"use client";

import { useScriptStore, isLockAtivo } from "../../store/useScriptStore";
import { AutoResizeTextarea } from "./AutoResizeTextarea";
import { CollaborativeEditor } from "./CollaborativeEditor";
import { Scene, Take, FieldLock } from "../../types/domain";
import { 
    Image as ImageIcon, 
    Camera, 
    Trash2, 
    X, 
    Loader2, 
    ChevronUp, 
    ChevronDown, 
    Settings2, 
    RotateCcw,
    FlipHorizontal,
    FlipVertical,
    Move,
    Maximize2,
    Check,
    GripVertical,
    AlertTriangle
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { uploadImageToStorage } from "@/lib/storage";
import { auth } from "@/lib/firebase";
import { useCachedImage } from "@/hooks/useCachedImage";



async function compressImage(file: File, maxSizeBytes: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Max resolution constraint (e.g. max 1920px width/height)
                const maxDim = 1920;
                if (width > maxDim || height > maxDim) {
                    if (width > height) {
                        height = Math.round((height * maxDim) / width);
                        width = maxDim;
                    } else {
                        width = Math.round((width * maxDim) / height);
                        height = maxDim;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error("Canvas context is not available"));
                    return;
                }
                ctx.drawImage(img, 0, 0, width, height);

                let quality = 0.8;
                
                const attemptCompression = (q: number) => {
                    canvas.toBlob((blob) => {
                        if (!blob) {
                            reject(new Error("Canvas toBlob failed"));
                            return;
                        }
                        if (blob.size <= maxSizeBytes || q <= 0.1) {
                            resolve(blob);
                        } else {
                            attemptCompression(q - 0.1);
                        }
                    }, 'image/webp', q);
                };

                attemptCompression(quality);
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
}

interface TakeItemProps {
    scene: Scene;
    take: Take;
    isLastTake: boolean;
    sceneIndex: number;
}

export function TakeItem({ scene, take, isLastTake, sceneIndex }: TakeItemProps) {
    const { 
        activeScriptId, 
        activeScriptContent, 
        activeRoomId,
        updateTake, 
        updateTakeLocalOnly,
        removeTake,
        addTake,
        moveTake,
        canEditActiveScript,
        adquirirLock,
        liberarLock,
        refreshLock
    } = useScriptStore();
    const canEdit = canEditActiveScript();
    const takeIndexInScene = scene.takes.findIndex((t: Take) => t.id === take.id);
    const displayIndex = takeIndexInScene !== -1 ? takeIndexInScene + 1 : take.ordem;
    const [uploading, setUploading] = useState(false);
    const [showControls, setShowControls] = useState(false);
    const [showZoom, setShowZoom] = useState(false);
    const [showHint, setShowHint] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [errorModal, setErrorModal] = useState<{ title: string; message: string } | null>(null);
    const [isAudioFocused, setIsAudioFocused] = useState(false);
    const [isVisualFocused, setIsVisualFocused] = useState(false);

    const currentUserId = auth.currentUser?.uid;
    const isAudioLockedByOther = !!(activeRoomId && take.audioLock && isLockAtivo(take.audioLock) && take.audioLock.userId !== currentUserId);
    const isAudioLockedByMe = !!(activeRoomId && take.audioLock && isLockAtivo(take.audioLock) && take.audioLock.userId === currentUserId);

    const isVisualLockedByOther = !!(activeRoomId && take.visualLock && isLockAtivo(take.visualLock) && take.visualLock.userId !== currentUserId);
    const isVisualLockedByMe = !!(activeRoomId && take.visualLock && isLockAtivo(take.visualLock) && take.visualLock.userId === currentUserId);

    const isRowLockedByOther = isAudioLockedByOther || isVisualLockedByOther;

    const cachedImageRef = useCachedImage(take.imagemRef);

    // Dnd-kit sortable hook
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging: isSorting
    } = useSortable({ 
        id: take.id,
        disabled: !canEdit || isRowLockedByOther,
        data: {
            type: 'Take',
            take,
            sceneId: scene.id
        }
    });

    const sortingStyle = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isSorting ? 50 : undefined,
        opacity: isSorting ? 0.5 : 1,
    };

    useEffect(() => {
        if (showControls) {
            setShowHint(true);
            const timer = setTimeout(() => setShowHint(false), 2000);
            return () => clearTimeout(timer);
        } else {
            setShowHint(false);
        }
    }, [showControls]);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const dragStartPos = useRef({ x: 0, y: 0, imgX: 0, imgY: 0 });

    const handleUpdate = (updates: Partial<Take>) => {
        updateTake(scene.id, take.id, updates);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !activeScriptId) return;

        const userId = auth.currentUser?.uid;
        const displayName = auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || 'Autor';
        if (!userId) {
            setErrorModal({ title: "Não Autenticado", message: "Faça login para enviar imagens." });
            return;
        }

        // Validation
        const maxSize = 1 * 1024 * 1024; // 1MB
        const fileExtension = 'webp'; // Always WebP
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

        if (!allowedMimeTypes.includes(file.type)) {
            setErrorModal({
                title: "Formato não suportado",
                message: "Formatos aceitos: JPG, JPEG, PNG, WEBP ou GIF."
            });
            return;
        }

        try {
            setUploading(true);
            let fileToUpload: Blob;

            try {
                // Unconditionally compress/convert to WebP
                fileToUpload = await compressImage(file, maxSize);
            } catch (compressionError) {
                console.error("Compression error:", compressionError);
                setErrorModal({
                    title: "Erro ao processar imagem",
                    message: "Não foi possível processar a imagem. Tente outro arquivo."
                });
                setUploading(false);
                return;
            }

            const path = activeRoomId
                ? `rooms/${activeRoomId}/roteiros/${activeScriptId}/takes/${take.id}-${Date.now()}.${fileExtension}`
                : `users/${userId}/roteiros/${activeScriptId}/takes/${take.id}-${Date.now()}.${fileExtension}`;
            
            const downloadUrl = await uploadImageToStorage(path, fileToUpload);
            handleUpdate({ 
                imagemRef: downloadUrl,
                imageUploadedBy: userId,
                imageUploadedByName: displayName
            });
        } catch (error) {
            console.error("Upload error:", error);
            setErrorModal({
                title: "Erro no Upload",
                message: "Não foi possível enviar a imagem. Verifique sua conexão e tente novamente."
            });
        } finally {
            setUploading(false);
            // Reset file input so the same file can be re-selected if needed
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleRemoveImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        handleUpdate({ 
            imagemRef: "",
            imageScale: 1,
            imageX: 0,
            imageY: 0,
            flipX: false,
            flipY: false
        });
        setShowControls(false);
        setShowZoom(false);
    };

    // Image Positioning Drag Logic (internal to the frame)
    const onMouseDown = (e: React.MouseEvent) => {
        if (!showControls || !take.imagemRef) return;
        
        setIsDragging(true);
        dragStartPos.current = {
            x: e.clientX,
            y: e.clientY,
            imgX: take.imageX || 0,
            imgY: take.imageY || 0
        };
    };

    useEffect(() => {
        const onMouseMove = (e: MouseEvent) => {
            if (!isDragging || !containerRef.current) return;

            const dx = e.clientX - dragStartPos.current.x;
            const dy = e.clientY - dragStartPos.current.y;

            const { width, height } = containerRef.current.getBoundingClientRect();
            
            const scale = take.imageScale || 1;

            const newX = dragStartPos.current.imgX + (dx / width) * 100;
            const newY = dragStartPos.current.imgY + (dy / height) * 100;

            handleUpdate({ 
                imageX: Math.round(newX * 10) / 10, 
                imageY: Math.round(newY * 10) / 10 
            });
        };

        const onMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
    }, [isDragging, take.imageX, take.imageY, take.imageScale]);

    const handleAudioKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Tab' && !e.shiftKey) {
            e.preventDefault();
            const visualEl = document.getElementById(`visual-${take.id}`);
            visualEl?.focus();
        }
    };

    const handleVisualKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Tab' && !e.shiftKey) {
            e.preventDefault();
            const currentIdx = scene.takes.findIndex((t: Take) => t.id === take.id);
            if (currentIdx !== -1 && currentIdx < scene.takes.length - 1) {
                const nextTakeId = scene.takes[currentIdx + 1].id;
                const nextAudioEl = document.getElementById(`audio-${nextTakeId}`);
                nextAudioEl?.focus();
            } else {
                // Last take in this scene. Let's check if there is a next scene in the script
                const sceneIdx = activeScriptContent?.cenas.findIndex(c => c.id === scene.id) ?? -1;
                const nextScene = (sceneIdx !== -1 && activeScriptContent) 
                    ? activeScriptContent.cenas[sceneIdx + 1] 
                    : null;
                
                if (nextScene && nextScene.takes && nextScene.takes.length > 0) {
                    // Go to the audio of the first take of the next scene
                    const nextTakeId = nextScene.takes[0].id;
                    const nextAudioEl = document.getElementById(`audio-${nextTakeId}`);
                    nextAudioEl?.focus();
                } else {
                    // No next scene/take exists. Create a new take in the current scene.
                    addTake(scene.id);
                }
            }
        }
    };

    const ratio = activeScriptContent?.aspectRatio || "16:9";
    const aspectRatioValue = ratio.replace(":", "/");

    const scale = take.imageScale || 1;
    const x = take.imageX || 0;
    const y = take.imageY || 0;
    const fx = take.flipX ? -1 : 1;
    const fy = take.flipY ? -1 : 1;

    const transformStyle = {
        transform: `translate(${x}%, ${y}%) scale(${scale}) scaleX(${fx}) scaleY(${fy})`,
    };

    const resetTransforms = (e: React.MouseEvent) => {
        e.stopPropagation();
        handleUpdate({
            imageScale: 1,
            imageX: 0,
            imageY: 0,
            flipX: false,
            flipY: false
        });
    };

    const renderField = (
        field: 'audio' | 'visual',
        value: string,
        isLockedByOther: boolean,
        isFocused: boolean,
        onFocus: () => void,
        onBlur: () => void,
        onKeyDown: (e: any) => void
    ) => {
        const fieldName = `${field}-${take.id}`;
        const lock = take[`${field}Lock` as keyof Take] as FieldLock | null | undefined;
        const placeholder = isLockedByOther 
            ? `${lock?.userName || 'Colaborador'} está editando...` 
            : canEdit 
                ? (field === 'audio' ? "Escreva a narração ou diálogo..." : "Descreva a ação ou enquadramento...") 
                : (field === 'audio' ? "Sem narração registrada..." : "Sem enquadramento registrado...");
        
        const cssClasses = cn(
            "text-white text-sm placeholder:text-white/5",
            field === 'visual' && "text-white/90 font-medium"
        );

        if (activeRoomId && activeScriptId) {
            const collectionPath = `salasRoteiro/${activeRoomId}/roteiros/${activeScriptId}/linhas_yjs/${take.id}/campos/${field}`;
            
            return (
                <CollaborativeEditor
                    collectionPath={collectionPath}
                    value={value}
                    disabled={!canEdit || isLockedByOther}
                    id={fieldName}
                    placeholder={placeholder}
                    className={cssClasses}
                    onUpdate={(plainText) => {
                        const lockVal = take[`${field}Lock` as keyof Take];
                        const isLockedByMe = !activeRoomId || (lockVal && isLockAtivo(lockVal) && (lockVal as FieldLock).userId === currentUserId);
                        if (isLockedByMe) {
                            handleUpdate({ [field]: plainText });
                            if (activeRoomId) refreshLock(take.id, field);
                        } else {
                            // Update local store only for remote updates to keep PDF/ZIP/totalWords calculations in sync
                            updateTakeLocalOnly(scene.id, take.id, { [field]: plainText });
                        }
                    }}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    onKeyDown={onKeyDown}
                />
            );
        } else {
            return (
                <AutoResizeTextarea
                    disabled={!canEdit || isLockedByOther}
                    id={fieldName}
                    value={value}
                    onChange={(e) => {
                        handleUpdate({ [field]: e.target.value });
                        if (activeRoomId) refreshLock(take.id, field);
                    }}
                    onKeyDown={onKeyDown}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    placeholder={placeholder}
                    className={cssClasses}
                />
            );
        }
    };

    return (
        <div 
            ref={setNodeRef}
            style={sortingStyle}
            className="group flex border-b border-white/5 bg-white/[0.03] hover:bg-white/[0.06] transition-colors relative"
        >
            {/* Drag Handle Column */}
            <div 
                {...(canEdit && !isRowLockedByOther ? attributes : {})}
                {...(canEdit && !isRowLockedByOther ? listeners : {})}
                className={cn(
                    "w-[60px] flex flex-col items-center pt-3 pb-2 border-r border-white/5 bg-white/[0.05] select-none gap-1 group/grip",
                    canEdit && !isRowLockedByOther ? "cursor-grab active:cursor-grabbing" : "cursor-not-allowed opacity-40"
                )}
                title={isRowLockedByOther ? "Reordenação desabilitada pois uma das colunas está bloqueada por outro usuário." : undefined}
            >
                {canEdit && !isRowLockedByOther && <GripVertical size={14} className="text-white/5 group-hover/grip:text-amber-500/50 transition-colors" />}
                <span className="text-sm font-black text-white/50 group-hover/grip:text-white transition-colors">
                    {sceneIndex + 1}.{displayIndex}
                </span>
                {canEdit && !isRowLockedByOther && (
                    <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                            onClick={(e) => { e.stopPropagation(); moveTake(scene.id, take.id, 'up'); }}
                            className="p-0.5 text-white/10 hover:text-amber-500 transition-all"
                            title="Mover para cima"
                        >
                            <ChevronUp size={12} />
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); moveTake(scene.id, take.id, 'down'); }}
                            className="p-0.5 text-white/10 hover:text-amber-500 transition-all"
                            title="Mover para baixo"
                        >
                            <ChevronDown size={12} />
                        </button>
                    </div>
                )}
            </div>

            {/* Audio Column */}
            <div 
                onClick={() => {
                    if (!isAudioLockedByOther) {
                        document.getElementById(`audio-${take.id}`)?.focus();
                    }
                }}
                className={cn(
                    "flex-[0.35] p-4 border-r border-white/5 relative transition-all duration-300 cursor-text",
                    isAudioLockedByOther && "bg-rose-500/5 ring-1 ring-rose-500/30",
                    isAudioLockedByMe && "bg-amber-500/5 ring-1 ring-amber-500/30"
                )}
            >
                {renderField(
                    'audio',
                    take.audio,
                    isAudioLockedByOther,
                    isAudioFocused,
                    () => {
                        setIsAudioFocused(true);
                        if (activeRoomId) adquirirLock(take.id, 'audio');
                    },
                    () => {
                        setIsAudioFocused(false);
                        if (activeRoomId) liberarLock(take.id, 'audio');
                    },
                    handleAudioKeyDown
                )}
                {isAudioLockedByOther && (
                    <div className="absolute bottom-1 right-2 flex items-center gap-1 text-[9px] font-semibold text-rose-400 bg-rose-950/80 px-1.5 py-0.5 rounded border border-rose-500/20 select-none pointer-events-none animate-pulse">
                        <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                        <span>{take.audioLock?.userName || 'Colaborador'} está editando...</span>
                    </div>
                )}
                {isAudioLockedByMe && (
                    <div className="absolute bottom-1 right-2 flex items-center gap-1 text-[9px] font-semibold text-amber-400 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-500/20 select-none pointer-events-none">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                        <span>Sua edição...</span>
                    </div>
                )}
            </div>

            {/* Visual Column */}
            <div 
                onClick={() => {
                    if (!isVisualLockedByOther) {
                        document.getElementById(`visual-${take.id}`)?.focus();
                    }
                }}
                className={cn(
                    "flex-[0.35] p-4 border-r border-white/5 relative transition-all duration-300 cursor-text",
                    isVisualLockedByOther && "bg-rose-500/5 ring-1 ring-rose-500/30",
                    isVisualLockedByMe && "bg-amber-500/5 ring-1 ring-amber-500/30"
                )}
            >
                {renderField(
                    'visual',
                    take.visual,
                    isVisualLockedByOther,
                    isVisualFocused,
                    () => {
                        setIsVisualFocused(true);
                        if (activeRoomId) adquirirLock(take.id, 'visual');
                    },
                    () => {
                        setIsVisualFocused(false);
                        if (activeRoomId) liberarLock(take.id, 'visual');
                    },
                    handleVisualKeyDown
                )}
                {isVisualLockedByOther && (
                    <div className="absolute bottom-1 right-2 flex items-center gap-1 text-[9px] font-semibold text-rose-400 bg-rose-950/80 px-1.5 py-0.5 rounded border border-rose-500/20 select-none pointer-events-none animate-pulse">
                        <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                        <span>{take.visualLock?.userName || 'Colaborador'} está editando...</span>
                    </div>
                )}
                {isVisualLockedByMe && (
                    <div className="absolute bottom-1 right-2 flex items-center gap-1 text-[9px] font-semibold text-amber-400 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-500/20 select-none pointer-events-none">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                        <span>Sua edição...</span>
                    </div>
                )}
            </div>

            {/* Image Column */}
            <div className="flex-[0.3] p-4 relative min-h-[160px] sm:min-h-[200px] border-l border-white/0 group-hover:border-white/5 transition-colors">
                {/* Editor Overlays */}
                {take.imagemRef && canEdit && (
                    <>
                        <div className={cn(
                            "absolute top-2 left-0 right-0 transition-all flex items-center justify-center z-40",
                            showControls ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
                        )}>
                            <div className="flex items-center gap-1 p-1 bg-black/80 backdrop-blur-md rounded-xl border border-white/10 shadow-2xl">
                                <button onClick={(e) => { e.stopPropagation(); setShowZoom(!showZoom); }} className={cn("p-1.5 rounded-lg transition-all", showZoom ? "bg-amber-500/20 text-amber-500" : "text-white/40 hover:text-white")} title="Ajustar Zoom"><Maximize2 size={14} /></button>
                                <div className="w-px h-4 bg-white/10 mx-1" />
                                <button onClick={() => handleUpdate({ flipX: !take.flipX })} className={cn("p-1.5 rounded-lg transition-all", take.flipX ? "bg-amber-500/20 text-amber-500" : "text-white/40 hover:text-white")} title="Inverter Horizontal"><FlipHorizontal size={14} /></button>
                                <button onClick={() => handleUpdate({ flipY: !take.flipY })} className={cn("p-1.5 rounded-lg transition-all", take.flipY ? "bg-amber-500/20 text-amber-500" : "text-white/40 hover:text-white")} title="Inverter Vertical"><FlipVertical size={14} /></button>
                                <button onClick={resetTransforms} className="p-1.5 text-white/40 hover:text-white transition-all" title="Resetar"><RotateCcw size={14} /></button>
                                <div className="w-px h-4 bg-white/10 mx-1" />
                                <button onClick={() => { setShowControls(false); setShowZoom(false); }} className="p-1.5 bg-amber-500 rounded-lg text-black hover:bg-amber-400 transition-all font-black text-[9px] uppercase px-3"><Check size={14} /></button>
                            </div>
                        </div>

                        <div className={cn(
                            "absolute top-12 left-0 right-0 transition-all flex items-center justify-center z-40",
                            showControls && showZoom ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
                        )}>
                            <div className="flex items-center gap-3 px-4 py-2 bg-black/80 backdrop-blur-md rounded-xl border border-white/10 shadow-2xl min-w-[200px]">
                                <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">Zoom</span>
                                <input type="range" min="1" max="4" step="0.1" value={scale} onChange={(e) => handleUpdate({ imageScale: parseFloat(e.target.value) })} onMouseDown={(e) => e.stopPropagation()} className="flex-1 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-500" />
                                <span className="text-[9px] font-mono text-amber-500 w-8 text-right px-1">{scale.toFixed(1)}x</span>
                            </div>
                        </div>

                        <div className={cn(
                            "absolute inset-0 flex items-center justify-center pointer-events-none z-30 transition-opacity duration-1000",
                            showHint && !isDragging ? "opacity-100" : "opacity-0"
                        )}>
                            <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-3 shadow-2xl">
                                <Move size={14} className="text-amber-500" />
                                <span className="text-[10px] font-black text-white uppercase tracking-widest">Arraste para mover</span>
                            </div>
                        </div>

                        <div className={cn(
                            "absolute top-4 left-4 flex flex-col gap-1 transition-opacity z-20",
                            showControls ? "opacity-0 pointer-events-none" : "opacity-0 group-hover:opacity-100"
                        )}>
                            <button onClick={() => setShowControls(true)} className="p-2 rounded-xl bg-black/60 backdrop-blur-sm border border-white/10 text-white/40 hover:text-white hover:border-amber-500/50 transition-all" title="Configurar Imagem"><Settings2 size={16} /></button>
                            <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded-xl bg-black/60 backdrop-blur-sm border border-white/10 text-white/40 hover:text-white hover:border-amber-500/50 transition-all" title="Trocar Imagem"><Camera size={16} /></button>
                        </div>

                        <button 
                            onClick={handleRemoveImage}
                            className={cn(
                                "absolute bottom-4 right-4 w-8 h-8 rounded-xl bg-black/60 backdrop-blur-sm text-white/40 hover:text-white hover:bg-red-500 flex items-center justify-center transition-all border border-white/10 shadow-xl z-20",
                                showControls ? "opacity-0 pointer-events-none" : "opacity-0 group-hover:opacity-100"
                            )}
                            title="Excluir Imagem"
                        >
                            <X size={14} />
                        </button>
                    </>
                )}

                <div className="absolute inset-4 flex items-center justify-center pointer-events-none">
                    <div 
                        ref={containerRef}
                        onMouseDown={canEdit ? onMouseDown : undefined}
                        className={cn(
                            "relative rounded-xl overflow-hidden group/img transition-all border border-white/5 bg-[#0a0a0a] shadow-xl pointer-events-auto",
                            !take.imagemRef ? (canEdit ? "bg-white/5 cursor-pointer" : "bg-white/5 cursor-default") : showControls ? "cursor-move" : "bg-black",
                            isDragging && "scale-[0.98] border-amber-500/50 shadow-amber-500/10"
                        )}
                        style={{ 
                            aspectRatio: "3/2",
                            height: '100%',
                            maxHeight: '100%',
                            width: 'auto',
                            maxWidth: '100%'
                        }}
                    >
                        {uploading ? (
                            <div className="absolute inset-0 flex items-center justify-center text-amber-500/30">
                                <Loader2 className="animate-spin" />
                            </div>
                        ) : take.imagemRef ? (
                            <div className="w-full h-full relative overflow-hidden select-none">
                                {/* Wrap in a sizing layer that matches container to keep % transforms accurate */}
                                <div className="w-full h-full relative flex items-center justify-center" style={transformStyle}>
                                    <img 
                                        src={cachedImageRef} 
                                        alt="Referência" 
                                        className={cn(
                                            "w-full h-full object-contain transition-opacity duration-500 pointer-events-none",
                                            showControls && "opacity-80"
                                        )}
                                    />
                                </div>
                            </div>
                        ) : canEdit ? (
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute inset-0 flex flex-col items-center justify-center gap-1 opacity-30 cursor-pointer hover:opacity-100 transition-all"
                            >
                                <ImageIcon size={18} className="text-white/20 group-hover/img:text-amber-500/50 transition-colors" />
                                <span className="text-[8px] font-black uppercase tracking-widest text-white/20">Ref {ratio}</span>
                            </div>
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 opacity-20 cursor-default">
                                <ImageIcon size={18} className="text-white/20" />
                                <span className="text-[8px] font-black uppercase tracking-widest text-white/20">Sem imagem</span>
                            </div>
                        )}
                    </div>
                </div>

                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImageUpload} 
                    accept=".jpg,.jpeg,.png,.webp,.gif" 
                    className="hidden" 
                />

                {canEdit && !isRowLockedByOther && (
                    <button 
                        onClick={() => removeTake(scene.id, take.id)}
                        className="absolute top-4 right-4 p-2 opacity-0 group-hover:opacity-100 text-white/5 hover:text-red-500 transition-all shrink-0 z-10 bg-black/40 backdrop-blur-sm rounded-lg border border-white/5"
                        title="Remover Take"
                    >
                        <Trash2 size={14} />
                    </button>
                )}
            </div>

            {/* Error Modal */}
            {errorModal && (
                <div 
                    className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
                    onClick={() => setErrorModal(null)}
                >
                    <div 
                        className="w-full max-w-sm bg-[#1a1a1a] rounded-2xl shadow-2xl border border-white/10 overflow-hidden animate-in zoom-in-95 duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-8 text-center flex flex-col items-center justify-center min-h-[200px]">
                            <div className="space-y-5">
                                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto bg-amber-500/10">
                                    <AlertTriangle size={28} className="text-amber-500" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white mb-2">{errorModal.title}</h2>
                                    <p className="text-white/50 text-sm leading-relaxed">
                                        {errorModal.message}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setErrorModal(null)}
                                    className="w-full px-4 py-2.5 rounded-xl bg-amber-500 text-black text-sm font-bold hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20"
                                >
                                    Entendi
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
