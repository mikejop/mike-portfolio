"use client";

import { useScriptStore, isLockAtivo } from "../../store/useScriptStore";
import { TakeItem } from "./TakeItem";
import { Edit2, GripVertical, Table as TableIcon, Layers, Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { auth } from "@/lib/firebase";
import { Scene, Take } from "../../types/domain";

interface SceneItemProps {
    scene: Scene;
    isLastScene: boolean;
    sceneIndex: number;
}

export function SceneItem({ scene, isLastScene, sceneIndex }: SceneItemProps) {
    const { updateScene, addTake, addSceneAfter, removeScene, moveScene, activeScriptContent, activeRoomId, canEditActiveScript } = useScriptStore();
    const [isEditing, setIsEditing] = useState(false);

    const canEdit = canEditActiveScript();
    const canDeleteScene = (activeScriptContent?.cenas.length || 0) > 1;

    const totalWords = scene.takes.reduce((sum, take) => {
        const audioWords = take.audio ? take.audio.trim().split(/\s+/).filter(Boolean).length : 0;
        const visualWords = take.visual ? take.visual.trim().split(/\s+/).filter(Boolean).length : 0;
        return sum + audioWords + visualWords;
    }, 0);

    const currentUserId = auth.currentUser?.uid;
    const isAnyTakeLockedByOther = scene.takes.some((take: Take) => {
        const isAudioLocked = activeRoomId && take.audioLock && isLockAtivo(take.audioLock) && take.audioLock.userId !== currentUserId;
        const isVisualLocked = activeRoomId && take.visualLock && isLockAtivo(take.visualLock) && take.visualLock.userId !== currentUserId;
        return isAudioLocked || isVisualLocked;
    });

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging: isSorting
    } = useSortable({
        id: scene.id,
        disabled: !canEdit || isAnyTakeLockedByOther,
        data: {
            type: 'Scene',
            scene
        }
    });

    const sortingStyle = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isSorting ? 50 : undefined,
        opacity: isSorting ? 0.5 : 1,
    };

    return (
        <div 
            ref={setNodeRef}
            style={sortingStyle}
            className="mb-6"
        >
            <div className="rounded-[24px] overflow-hidden border border-white/5 bg-white/[0.04]">
                {/* Scene Header */}
                <div className="flex items-center gap-4 bg-white/5 px-6 py-4 border-b border-white/5 group">
                    <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 font-black">
                            {sceneIndex + 1}
                        </div>
                        
                        {isEditing && canEdit ? (
                            <input 
                                autoFocus
                                value={scene.titulo}
                                onChange={(e) => updateScene(scene.id, e.target.value)}
                                onBlur={() => setIsEditing(false)}
                                onKeyDown={(e) => e.key === 'Enter' && setIsEditing(false)}
                                className="flex-1 bg-transparent text-xs font-black text-white/60 uppercase tracking-[0.2em] focus:outline-none"
                            />
                        ) : (
                            <h4 
                                onClick={() => canEdit && setIsEditing(true)}
                                className={cn(
                                    "text-xs font-black text-white/45 uppercase tracking-[0.2em] flex items-center gap-3",
                                    canEdit ? "cursor-pointer hover:text-white" : "cursor-default text-white/30"
                                )}
                            >
                                {scene.titulo}
                                {canEdit && <Edit2 size={12} className="opacity-0 group-hover:opacity-100 transition-all text-amber-500" />}
                            </h4>
                        )}
                    </div>
                    
                    {canEdit && (
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                            <button
                                onClick={() => moveScene(scene.id, 'up')}
                                className="p-2 hover:bg-white/5 rounded-lg text-white/20 hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none"
                                title={isAnyTakeLockedByOther ? "Mover desabilitado: uma tomada está bloqueada" : "Mover Cena Para Cima"}
                                disabled={sceneIndex === 0 || isAnyTakeLockedByOther}
                            >
                                <ChevronUp size={14} />
                            </button>
                            <button
                                onClick={() => moveScene(scene.id, 'down')}
                                className="p-2 hover:bg-white/5 rounded-lg text-white/20 hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none"
                                title={isAnyTakeLockedByOther ? "Mover desabilitado: uma tomada está bloqueada" : "Mover Cena Para Baixo"}
                                disabled={sceneIndex === (activeScriptContent?.cenas.length || 1) - 1 || isAnyTakeLockedByOther}
                            >
                                <ChevronDown size={14} />
                            </button>
                            {canDeleteScene && (
                                <button 
                                    onClick={() => removeScene(scene.id)}
                                    className="p-2 hover:bg-red-500/10 rounded-lg text-white/20 hover:text-red-500 transition-all disabled:opacity-30 disabled:pointer-events-none"
                                    title={isAnyTakeLockedByOther ? "Remover desabilitado: uma tomada está bloqueada" : "Remover Cena"}
                                    disabled={isAnyTakeLockedByOther}
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}
                            <div
                                {...(canEdit && !isAnyTakeLockedByOther ? attributes : {})}
                                {...(canEdit && !isAnyTakeLockedByOther ? listeners : {})}
                                className={cn(
                                    "p-2 rounded-lg text-white/20 hover:text-white transition-all flex items-center justify-center",
                                    canEdit && !isAnyTakeLockedByOther ? "cursor-grab active:cursor-grabbing" : "cursor-not-allowed opacity-30"
                                )}
                                title={isAnyTakeLockedByOther ? "Reordenação desabilitada pois uma tomada está bloqueada" : "Arrastar para reordenar a cena"}
                            >
                                <GripVertical size={16} className="text-white/10" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Column Headers - Sticky within this scene block */}
                <div className="flex bg-[#1c1c1c] border-b border-white/5 sticky top-0 z-20">
                    <div className="w-[60px] py-3 border-r border-white/5 flex items-center justify-center font-black text-white/40 text-[10px] tracking-widest">
                        #
                    </div>
                    <div className="flex-[0.35] py-3 px-6 border-r border-white/5 flex items-center gap-3">
                        <TableIcon size={12} className="text-amber-500/50" />
                        <span className="font-black text-white/40 text-[10px] uppercase tracking-widest">Áudio / Narração</span>
                    </div>
                    <div className="flex-[0.35] py-3 px-6 border-r border-white/5 flex items-center gap-3">
                        <Layers size={12} className="text-amber-500/50" />
                        <span className="font-black text-white/40 text-[10px] uppercase tracking-widest">Visual / Ação</span>
                    </div>
                    <div className="flex-[0.3] py-3 px-6 flex items-center gap-3">
                        <Layers size={12} className="text-amber-500/50" />
                        <span className="font-black text-white/40 text-[10px] uppercase tracking-widest">Imagem de Referência</span>
                    </div>
                </div>

                {/* Takes */}
                <SortableContext 
                    id={scene.id}
                    items={scene.takes.map((t: Take) => t.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="flex flex-col">
                        {scene.takes.map((take: Take, idx: number) => (
                            <TakeItem 
                                key={take.id} 
                                scene={scene} 
                                sceneIndex={sceneIndex}
                                take={take} 
                                isLastTake={idx === scene.takes.length - 1}
                            />
                        ))}
                    </div>
                </SortableContext>
                <div className="flex justify-between items-center bg-white/[0.01] px-6 py-3 border-t border-white/5 text-[9px] font-black uppercase tracking-widest text-white/30">
                    <div className="flex items-center gap-1.5">
                        <span>Cena {sceneIndex + 1}</span>
                        <span className="w-1 h-1 rounded-full bg-white/10" />
                        <span>{scene.takes.length} {scene.takes.length === 1 ? 'Take' : 'Takes'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span>Palavras:</span>
                        <span className="text-amber-500 font-bold text-xs">{totalWords}</span>
                    </div>
                </div>
            </div>

            {/* Per-Scene Action Buttons */}
            {canEdit && (
                <div className="flex items-center gap-3 mt-3 ml-4">
                    <button 
                        onClick={() => addTake(scene.id)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 text-[9px] font-black text-white/30 hover:text-white transition-all uppercase tracking-widest"
                    >
                        <Plus size={12} className="text-amber-500/70" />
                        Take
                    </button>
                    <button 
                        onClick={() => addSceneAfter(scene.id)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 text-[9px] font-black text-white/30 hover:text-white transition-all uppercase tracking-widest"
                    >
                        <Plus size={12} className="text-amber-500/70" />
                        Cena
                    </button>
                </div>
            )}
        </div>
    );
}
