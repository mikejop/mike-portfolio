import { create } from 'zustand';

// Constants
export const PX_PER_METER = 60;
export const GRID_SIZE = 0.5;
export const SNAP_GRID = 0.25;
export const SNAP_ANGLE_TOL = 10;
export const MAX_UNDO = 50;

// Types
export interface Point { 
    x: number; 
    y: number;
    hIn?: { x: number; y: number };
    hOut?: { x: number; y: number };
}
export type Viewport = { x: number; y: number; zoom: number };

export interface BaseObject {
    id: string;
    type: 'prop' | 'character' | 'camera' | 'light';
    subtype: string;
    x: number;
    y: number;
    rotation?: number;
    width?: number;       // in meters
    height?: number;      // in meters
    color?: string;
    label?: string;
    borderRadius?: number; // 0 to 1 (relative to size) or absolute? User says 0-200px. I'll use meters.
    texture?: string | null;
    opacity?: number;
    fill?: string;
    properties?: any;
}

export interface WallOpening {
    id: string;
    type: 'door' | 'window';
    segmentIndex: number;
    t: number; // 0 to 1 position along the segment
    width: number;
    flipSide?: boolean;
    flipSwing?: boolean;
}

export interface Wall {
    id: string;
    points: Point[];
    thickness: number;
    height: number;
    color: string;
    isSpline?: boolean;
    openings: WallOpening[];
}

interface LightMapState {
    objects: BaseObject[];
    walls: Wall[];
    viewport: Viewport;
    tool: string;
    selection: string[];
    wallDrawing: { points: Point[]; active: boolean; openings?: WallOpening[]; id?: string; color?: string; thickness?: number; height?: number; isSpline?: boolean } | null;
    gridVisible: boolean;
    snapEnabled: boolean;
    radialMenu: { visible: boolean; x: number; y: number };
    addMenuOpen: boolean;
    projectName: string;
    modified: boolean;
    canvasDimensions: { w: number; h: number };
    svgRef: React.RefObject<SVGSVGElement | null>;

    // Actions
    setProjectName: (name: string) => void;
    setTool: (tool: string) => void;
    setViewport: (v: Viewport | ((prev: Viewport) => Viewport)) => void;
    setCanvasDimensions: (w: number, h: number) => void;
    setSelection: (ids: string[]) => void;
    toggleGrid: () => void;
    toggleSnap: () => void;
    
    // Core Actions
    addObject: (obj: BaseObject) => void;
    updateObject: (id: string, updates: Partial<BaseObject>) => void;
    updateWall: (id: string, updates: Partial<Wall>) => void;
    deleteSelected: () => void;
    duplicateSelected: () => void;
    
    addWallOpening: (wallId: string, segmentIndex: number, t: number, type: 'door' | 'window') => void;
    updateWallOpening: (wallId: string, openingId: string, updates: Partial<WallOpening>) => void;
    deleteWallOpening: (wallId: string, openingId: string) => void;
    
    // Wall Actions
    startWallMode: () => void;
    addWallPoint: (pt: Point) => void;
    popWallPoint: () => void;
    endWallMode: () => void;
    resumeWallDrawing: (wallId: string, atStart: boolean) => void;
    splitWallSegment: (wallId: string, segmentIndex: number, splitT: number, newPt: Point) => void;
    updateWallPoint: (wallId: string, pointIdx: number, data: Partial<Point>) => void;
    toggleWallSpline: (wallId: string, force?: boolean) => void;

    // Hierarchy Actions
    reorderObject: (id: string, direction: 'up' | 'down') => void;
    reorderObjectByIdx: (oldIdx: number, newIdx: number) => void;
    renameObject: (id: string, name: string) => void;
    
    // Drag Actions
    moveObjects: (deltaX: number, deltaY: number) => void;
    
    // Viewport
    fitToScreen: () => void;
    
    // Undo/Redo
    undoStack: string[];
    redoStack: string[];
    saveState: () => void;
    undo: () => void;
    redo: () => void;
    
    // File
    loadState: (data: any) => void;
    clearBoard: () => void;
}

export const useLightMapStore = create<LightMapState>((set, get) => ({
    objects: [],
    walls: [],
    viewport: { x: 300, y: 300, zoom: 4 },
    tool: 'select',
    selection: [],
    wallDrawing: null,
    gridVisible: true,
    snapEnabled: true,
    radialMenu: { visible: false, x: 100, y: 100 },
    addMenuOpen: false,
    projectName: 'Untitled Scene',
    modified: false,
    canvasDimensions: { w: 800, h: 600 },
    undoStack: [],
    redoStack: [],
    svgRef: { current: null },

    setProjectName: (name) => set({ projectName: name }),
    setTool: (tool) => {
        const { tool: currentTool, endWallMode } = get();
        if (currentTool === 'wall' && tool !== 'wall') endWallMode();
        set({ tool });
        if (tool === 'wall') get().startWallMode();
    },
    setViewport: (v) => set((state) => ({ viewport: typeof v === 'function' ? v(state.viewport) : v })),
    setCanvasDimensions: (w, h) => set({ canvasDimensions: { w, h } }),
    setSelection: (ids) => set({ selection: ids }),
    toggleGrid: () => set((s) => ({ gridVisible: !s.gridVisible })),
    toggleSnap: () => set((s) => ({ snapEnabled: !s.snapEnabled })),

    saveState: () => set((state) => {
        const snapshot = JSON.stringify({ objects: state.objects, walls: state.walls });
        const stack = [...state.undoStack, snapshot];
        if (stack.length > MAX_UNDO) stack.shift();
        return { undoStack: stack, redoStack: [], modified: true };
    }),

    undo: () => set((state) => {
        if (!state.undoStack.length) return state;
        const current = JSON.stringify({ objects: state.objects, walls: state.walls });
        const prev = JSON.parse(state.undoStack[state.undoStack.length - 1]);
        return {
            undoStack: state.undoStack.slice(0, -1),
            redoStack: [...state.redoStack, current],
            objects: prev.objects,
            walls: prev.walls,
            selection: []
        };
    }),

    redo: () => set((state) => {
        if (!state.redoStack.length) return state;
        const current = JSON.stringify({ objects: state.objects, walls: state.walls });
        const next = JSON.parse(state.redoStack[state.redoStack.length - 1]);
        return {
            redoStack: state.redoStack.slice(0, -1),
            undoStack: [...state.undoStack, current],
            objects: next.objects,
            walls: next.walls,
            selection: []
        };
    }),

    addObject: (obj) => {
        get().saveState();
        set((s) => ({ objects: [...s.objects, obj], selection: [obj.id] }));
    },

    updateObject: (id, updates) => set((s) => ({
        objects: s.objects.map(o => o.id === id ? { ...o, ...updates } : o)
    })),

    updateWall: (id, updates) => set((s) => ({
        walls: s.walls.map(w => w.id === id ? { ...w, ...updates } : w)
    })),

    deleteSelected: () => {
        const { selection } = get();
        if (!selection.length) return;
        get().saveState();
        set((s) => ({
            objects: s.objects.filter(o => !selection.includes(o.id)),
            walls: s.walls.filter(w => !selection.includes(w.id)),
            selection: []
        }));
    },

    duplicateSelected: () => {
        const { selection, objects, walls } = get();
        if (!selection.length) return;
        get().saveState();
        
        const newSel: string[] = [];
        const newObjs = [...objects];
        const newWalls = [...walls];
        
        const genId = () => 'd' + Math.random().toString(36).substr(2, 9);
        
        selection.forEach(id => {
            const obj = objects.find(o => o.id === id);
            if (obj) {
                const dup = { ...JSON.parse(JSON.stringify(obj)), id: genId(), x: obj.x + 0.5, y: obj.y + 0.5 };
                newObjs.push(dup);
                newSel.push(dup.id);
            }
            const wall = walls.find(w => w.id === id);
            if (wall) {
                const dup = { ...JSON.parse(JSON.stringify(wall)), id: genId() };
                dup.points = dup.points.map((p: Point) => ({ x: p.x + 0.5, y: p.y + 0.5 }));
                newWalls.push(dup);
                newSel.push(dup.id);
            }
        });
        
        set({ objects: newObjs, walls: newWalls, selection: newSel });
    },

    startWallMode: () => set({ wallDrawing: { points: [], active: false } }),
    
    addWallPoint: (pt) => set((s) => {
        if (!s.wallDrawing) return s;
        return { wallDrawing: { points: [...s.wallDrawing.points, pt], active: true } };
    }),
    
    popWallPoint: () => set((s) => {
        if (!s.wallDrawing || !s.wallDrawing.points.length) return s;
        const pts = s.wallDrawing.points.slice(0, -1);
        return { wallDrawing: { points: pts, active: pts.length > 0 } };
    }),

    endWallMode: () => {
        const { wallDrawing } = get();
        if (wallDrawing && wallDrawing.points.length >= 2) {
            get().saveState();
            const genId = () => 'w' + Math.random().toString(36).substr(2, 9);
            const w: Wall = { 
                id: wallDrawing.id || genId(), 
                points: [...wallDrawing.points], 
                thickness: wallDrawing.thickness || 0.15, 
                height: wallDrawing.height || 2.8, 
                color: wallDrawing.color || '#3a3d4a', 
                openings: wallDrawing.openings || [] 
            };
            set((s) => ({ walls: [...s.walls, w] }));
        }
        set({ wallDrawing: null });
    },

    resumeWallDrawing: (wallId, atStart) => {
        const state = get();
        const wall = state.walls.find(w => w.id === wallId);
        if (!wall) return;
        state.saveState();
        
        let pts = [...wall.points];
        let ops = [...(wall.openings || [])];
        if (atStart) {
            pts.reverse();
            const numSegs = pts.length - 1;
            ops = ops.map(op => ({
                ...op,
                segmentIndex: numSegs - 1 - op.segmentIndex,
                t: 1 - op.t
            }));
        }
        set({
            walls: state.walls.filter(w => w.id !== wallId),
            wallDrawing: { 
                points: pts, 
                active: true, 
                openings: ops, 
                id: wall.id, 
                color: wall.color, 
                thickness: wall.thickness, 
                height: wall.height 
            },
            tool: 'wall'
        });
    },

    splitWallSegment: (wallId, segmentIndex, splitT, newPt) => {
        const state = get();
        const wall = state.walls.find(w => w.id === wallId);
        if (!wall) return;
        state.saveState();
        
        const newPts = [...wall.points];
        newPts.splice(segmentIndex + 1, 0, newPt);
        
        const newOps = (wall.openings || []).map(op => {
            if (op.segmentIndex < segmentIndex) return op;
            if (op.segmentIndex > segmentIndex) return { ...op, segmentIndex: op.segmentIndex + 1 };
            if (op.t < splitT) {
                return { ...op, t: op.t / splitT };
            } else {
                return { ...op, segmentIndex: segmentIndex + 1, t: (op.t - splitT) / (1 - splitT) };
            }
        });
        
        set({
            walls: state.walls.map(w => w.id === wallId ? { ...w, points: newPts, openings: newOps } : w)
        });
    },

    updateWallPoint: (wallId, pointIdx, data) => {
        const state = get();
        const wall = state.walls.find(w => w.id === wallId);
        if (!wall) return;
        state.saveState();

        const newPts = [...wall.points];
        newPts[pointIdx] = { ...newPts[pointIdx], ...data };
        
        set({
            walls: state.walls.map(w => w.id === wallId ? { ...w, points: newPts } : w)
        });
    },

    toggleWallSpline: (wallId, force) => {
        const state = get();
        const wall = state.walls.find(w => w.id === wallId);
        if (!wall) return;

        const isSpline = force !== undefined ? force : !wall.isSpline;
        if (isSpline === wall.isSpline) return;

        state.saveState();
        const newPts = wall.points.map((pt, i, arr) => {
            if (!isSpline) return { x: pt.x, y: pt.y }; // Strip handles
            if (pt.hIn && pt.hOut) return pt;

            // Generate default handles (1/3rd of the way to neighbors)
            const prev = arr[i - 1] || pt;
            const next = arr[i + 1] || pt;

            let inX = pt.x, inY = pt.y, outX = pt.x, outY = pt.y;
            
            if (i > 0) {
                inX = pt.x - (pt.x - prev.x) * 0.2;
                inY = pt.y - (pt.y - prev.y) * 0.2;
            }
            if (i < arr.length - 1) {
                outX = pt.x + (next.x - pt.x) * 0.2;
                outY = pt.y + (next.y - pt.y) * 0.2;
            }
            // For endpoints with only one neighbor, mirror the existing vector
            if (i === 0 && arr.length > 1) {
                inX = pt.x - (next.x - pt.x) * 0.2;
                inY = pt.y - (next.y - pt.y) * 0.2;
            }
            if (i === arr.length - 1 && arr.length > 1) {
                outX = pt.x + (pt.x - prev.x) * 0.2;
                outY = pt.y + (pt.y - prev.y) * 0.2;
            }

            return { ...pt, hIn: { x: inX, y: inY }, hOut: { x: outX, y: outY } };
        });

        set({
            walls: state.walls.map(w => w.id === wallId ? { ...w, isSpline, points: newPts } : w)
        });
    },

    addWallOpening: (wallId, segmentIndex, t, type) => {
        get().saveState();
        const genId = () => 'op' + Math.random().toString(36).substr(2, 9);
        const opening: WallOpening = { id: genId(), type, segmentIndex, t, width: type === 'door' ? 0.9 : 1.2 };
        set((s) => ({
            walls: s.walls.map(w => w.id === wallId ? { ...w, openings: [...w.openings, opening] } : w)
        }));
    },

    updateWallOpening: (wallId, openingId, updates) => set((s) => ({
        walls: s.walls.map(w => w.id === wallId ? {
            ...w,
            openings: w.openings.map(op => op.id === openingId ? { ...op, ...updates } : op)
        } : w)
    })),

    deleteWallOpening: (wallId, openingId) => {
        get().saveState();
        set((s) => ({
            walls: s.walls.map(w => w.id === wallId ? {
                ...w,
                openings: w.openings.filter(op => op.id !== openingId)
            } : w)
        }));
    },

    // Hierarchy Actions
    reorderObject: (id, direction) => set((s) => {
        const objs = [...s.objects];
        const idx = objs.findIndex(o => o.id === id);
        if (idx === -1) return s;
        const newIdx = direction === 'up' ? idx + 1 : idx - 1;
        if (newIdx < 0 || newIdx >= objs.length) return s;
        const temp = objs[idx];
        objs[idx] = objs[newIdx];
        objs[newIdx] = temp;
        return { objects: objs };
    }),

    reorderObjectByIdx: (oldIdx, newIdx) => set((s) => {
        const objs = [...s.objects];
        const [moved] = objs.splice(oldIdx, 1);
        objs.splice(newIdx, 0, moved);
        return { objects: objs, modified: true };
    }),

    renameObject: (id, name) => set((s) => ({
        objects: s.objects.map(o => o.id === id ? { ...o, label: name } : o)
    })),

    moveObjects: (dx, dy) => set((s) => {
        const sel = s.selection;
        return {
            objects: s.objects.map(o => sel.includes(o.id) ? { ...o, x: o.x + dx, y: o.y + dy } : o),
            walls: s.walls.map(w => sel.includes(w.id) ? { ...w, points: w.points.map(p => ({ x: p.x + dx, y: p.y + dy })) } : w),
            modified: true
        };
    }),

    fitToScreen: () => {
        const { objects, walls, selection, canvasDimensions } = get();
        const canvasWidth = canvasDimensions.w;
        const canvasHeight = canvasDimensions.h;

        let targets = selection.length > 0 
            ? objects.filter(o => selection.includes(o.id)) 
            : objects;
        
        // Include walls in calculation
        const wallTargets = selection.length > 0
            ? walls.filter(w => selection.includes(w.id))
            : walls;

        if (targets.length === 0 && wallTargets.length === 0) return;

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        targets.forEach(o => {
            const w = (o.width || 0.5) / 2;
            const h = (o.height || 0.5) / 2;
            minX = Math.min(minX, o.x - w);
            minY = Math.min(minY, o.y - h);
            maxX = Math.max(maxX, o.x + w);
            maxY = Math.max(maxY, o.y + h);
        });

        wallTargets.forEach(w => {
            w.points.forEach(p => {
                minX = Math.min(minX, p.x);
                minY = Math.min(minY, p.y);
                maxX = Math.max(maxX, p.x);
                maxY = Math.max(maxY, p.y);
            });
        });

        const pad = 1.2; // 20% padding
        const bW = (maxX - minX) || 1;
        const bH = (maxY - minY) || 1;
        
        const zoomX = canvasWidth / (bW * PX_PER_METER * pad);
        const zoomY = canvasHeight / (bH * PX_PER_METER * pad);
        const newZoom = Math.max(0.1, Math.min(5, Math.min(zoomX, zoomY)));

        set({
            viewport: {
                zoom: newZoom,
                x: canvasWidth / 2 - (minX + bW / 2) * PX_PER_METER * newZoom,
                y: canvasHeight / 2 - (minY + bH / 2) * PX_PER_METER * newZoom
            }
        });
    },

    loadState: (data) => set({
        objects: data.objects || [],
        walls: data.walls || [],
        viewport: data.viewport || { x: 300, y: 300, zoom: 4 },
        projectName: data.projectName || data.meta?.name || 'Imported',
        selection: [],
        undoStack: [],
        redoStack: [],
        radialMenu: { visible: false, x: 50, y: 50 },
        addMenuOpen: false
    }),

    clearBoard: () => set({
        objects: [],
        walls: [],
        selection: [],
        wallDrawing: null,
        undoStack: [],
        redoStack: [],
        tool: 'select',
        projectName: 'Untitled Scene',
        modified: false
    })
}));
