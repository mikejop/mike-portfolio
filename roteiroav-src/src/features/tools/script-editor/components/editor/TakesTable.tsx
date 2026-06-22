"use client";

import { useScriptStore } from "../../store/useScriptStore";
import { SceneItem } from "./SceneItem";
import { 
    DndContext, 
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragOverlay,
    defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import { 
    verticalListSortingStrategy, 
    SortableContext 
} from '@dnd-kit/sortable';
import { useState } from "react";

export function TakesTable() {
    const { activeScriptContent, moveTakeToPosition, moveSceneToPosition } = useScriptStore();
    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Press and drag
            },
        })
    );

    if (!activeScriptContent) return null;

    const handleDragStart = (event: any) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        if (activeId === overId) return;

        const activeType = active.data.current?.type;

        if (activeType === 'Scene') {
            const sceneId = activeId;
            let toIndex = activeScriptContent.cenas.findIndex(s => s.id === overId);
            if (toIndex === -1) {
                // If dropped over a take, find the scene it belongs to
                toIndex = activeScriptContent.cenas.findIndex(scene => 
                    scene.takes.some(t => t.id === overId)
                );
            }

            if (toIndex !== -1) {
                moveSceneToPosition(sceneId, toIndex);
            }
            return;
        }

        const takeId = activeId;

        // Find source scene
        let fromSceneId = "";
        activeScriptContent.cenas.forEach(scene => {
            if (scene.takes.find(t => t.id === takeId)) {
                fromSceneId = scene.id;
            }
        });

        // Find target scene and index
        let toSceneId = "";
        let newIndex = -1;

        // check if dropped over a take
        activeScriptContent.cenas.forEach(scene => {
            const idx = scene.takes.findIndex(t => t.id === overId);
            if (idx !== -1) {
                toSceneId = scene.id;
                newIndex = idx;
            }
        });

        // If not found, maybe dropped over a scene header/footer ID?
        if (toSceneId === "") {
            // Scene items should have an ID for dnd-kit too if we want to drop into "empty" scenes
            const targetScene = activeScriptContent.cenas.find(s => s.id === overId);
            if (targetScene) {
                toSceneId = targetScene.id;
                newIndex = targetScene.takes.length;
            }
        }

        if (fromSceneId && toSceneId && newIndex !== -1) {
            moveTakeToPosition(takeId, fromSceneId, toSceneId, newIndex);
        }
    };

    return (
        <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="pb-20">
                <SortableContext 
                    id="scenes-list"
                    items={activeScriptContent.cenas.map(s => s.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {activeScriptContent.cenas.map((scene, idx) => (
                        <SceneItem 
                            key={scene.id} 
                            scene={scene} 
                            sceneIndex={idx}
                            isLastScene={idx === activeScriptContent.cenas.length - 1}
                        />
                    ))}
                </SortableContext>
            </div>
        </DndContext>
    );
}
