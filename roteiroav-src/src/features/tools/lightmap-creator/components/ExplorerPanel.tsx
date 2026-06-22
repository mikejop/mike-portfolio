"use client"

import { useState, useMemo } from "react";
import { useLightMapStore } from "../store/useLightMapStore";
import { X, Layers, GripVertical, Edit2, Hammer } from "lucide-react";

import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

export function ExplorerView() {
    const { objects, walls, selection, setSelection, reorderObjectByIdx, renameObject } = useLightMapStore();
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const items = useMemo(() => [...objects], [objects]);
    const reverseOrder = useMemo(() => [...items].reverse(), [items]);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = items.findIndex(o => o.id === active.id);
            const newIndex = items.findIndex(o => o.id === over.id);
            reorderObjectByIdx(oldIndex, newIndex);
        }
    };

    return (
        <div className="p-2 space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
            <div className="space-y-1">
                <DndContext 
                    sensors={sensors} 
                    collisionDetection={closestCenter} 
                    onDragEnd={handleDragEnd}
                    modifiers={[restrictToVerticalAxis]}
                >
                    <SortableContext items={reverseOrder.map(o => o.id)} strategy={verticalListSortingStrategy}>
                        {reverseOrder.map((item) => (
                            <ExplorerItem 
                                key={item.id} 
                                item={item} 
                                selected={selection.includes(item.id)}
                                onSelect={() => setSelection([item.id])}
                                onRename={(name: string) => renameObject(item.id, name)}
                            />
                        ))}
                    </SortableContext>
                </DndContext>
            </div>

            {walls.length > 0 && (
                <div className="space-y-1">
                    <h5 className="px-3 text-[9px] uppercase font-bold text-[#444] tracking-widest pb-1">Walls</h5>
                    {walls.map((w: any) => (
                        <div 
                            key={w.id} 
                            onClick={() => setSelection([w.id])}
                            className={`px-3 py-2 rounded-lg flex items-center gap-3 cursor-pointer text-xs transition-colors ${selection.includes(w.id) ? 'bg-[var(--macos-selected)] text-white shadow-lg' : 'hover:bg-white/5 text-[var(--macos-text-secondary)]'}`}
                        >
                            <Hammer className="w-3.5 h-3.5 opacity-50" />
                            <span>Wall Layer</span>
                        </div>
                    ))}
                </div>
            )}

            {!objects.length && !walls.length && (
                <div className="py-12 text-center">
                    <Layers className="w-8 h-8 text-[#222] mx-auto mb-2" />
                    <p className="text-[10px] text-[#444] uppercase tracking-widest">Empty Scene</p>
                </div>
            )}
        </div>
    );
}

function ExplorerItem({ item, selected, onSelect, onRename }: any) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : undefined,
    };

    const [isEditing, setIsEditing] = useState(false);
    const [tempName, setTempName] = useState(item.label || item.subtype);

    const handleRename = () => {
        onRename(tempName);
        setIsEditing(false);
    };

    return (
        <div 
            ref={setNodeRef}
            style={style}
            onClick={onSelect}
            className={`group px-2 py-2 rounded-lg flex items-center gap-2 cursor-pointer transition-all ${selected ? 'bg-[var(--macos-selected)]/10 border border-[var(--macos-selected)]/30 text-[var(--macos-selected)]' : 'hover:bg-white/5 text-[var(--macos-text-secondary)] border border-transparent'} ${isDragging ? 'opacity-50 ring-2 ring-[var(--macos-selected)]' : ''}`}
        >
            <div 
                {...attributes} {...listeners}
                className="cursor-grab active:cursor-grabbing text-[#444] hover:text-[#888] transition-colors"
            >
                <GripVertical className="w-3.5 h-3.5" />
            </div>

            <div className="flex-1 min-w-0">
                {isEditing ? (
                    <input 
                        autoFocus
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        onBlur={handleRename}
                        onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                        className="bg-black/40 border border-[var(--macos-selected)]/50 rounded px-1.5 py-0.5 w-full text-xs font-mono outline-none text-white"
                        onClick={(e) => e.stopPropagation()}
                    />
                ) : (
                    <span className="truncate text-[11px] font-medium tracking-tight block">
                        {item.label || item.subtype.charAt(0).toUpperCase() + item.subtype.slice(1)}
                    </span>
                )}
            </div>

            {!isEditing && (
                <button 
                    onClick={(e) => { e.stopPropagation(); setIsEditing(true); setTempName(item.label || item.subtype); }} 
                    className="p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:text-white"
                >
                    <Edit2 className="w-3 h-3" />
                </button>
            )}
        </div>
    );
}
