"use client"

import React, { useRef, useEffect, useState } from "react";
import { useLightMapStore, PX_PER_METER, GRID_SIZE, SNAP_GRID, SNAP_ANGLE_TOL, Point } from "../store/useLightMapStore";
import { CATALOG, generateId } from "../utils/catalog";
import { hexToRgba, kelvinToHex, mToStr, fovFromFocal } from "../utils/catalog";


export function SvgCanvas() {
    const store = useLightMapStore();
    const wrapRef = useRef<HTMLDivElement>(null);
    const [dim, setDim] = useState({ w: 800, h: 600 });

    // Local Drag State (to avoid massive re-renders on every pixel move in Zustand if possible, 
    // but for simplicity we will dispatch to store for now since it's an MVP)
    const [drag, setDrag] = useState<any>(null);
    const [pan, setPan] = useState<any>(null);
    const [previewPoint, setPreviewPoint] = useState<Point | null>(null);

    const setCanvasDimensions = useLightMapStore(s => s.setCanvasDimensions);

    useEffect(() => {
        const resize = () => {
            if (wrapRef.current) {
                const w = wrapRef.current.clientWidth;
                const h = wrapRef.current.clientHeight;
                setDim(prev => (prev.w === w && prev.h === h) ? prev : { w, h });
            }
        };
        resize();
        window.addEventListener("resize", resize);
        return () => window.removeEventListener("resize", resize);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                const state = useLightMapStore.getState();
                if (state.tool === 'wall' && state.wallDrawing && state.wallDrawing.points.length > 0) {
                    state.endWallMode();
                    state.setTool('select');
                }
            }
            if (e.key.toLowerCase() === 'p') {
                useLightMapStore.getState().setTool('add-point');
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Sync dimensions to global store
    useEffect(() => {
        setCanvasDimensions(dim.w, dim.h);
    }, [dim.w, dim.h, setCanvasDimensions]);

    // --- Math & Transforms ---
    const worldToScreen = (wx: number, wy: number) => ({
        x: wx * PX_PER_METER * store.viewport.zoom + store.viewport.x,
        y: wy * PX_PER_METER * store.viewport.zoom + store.viewport.y
    });

    const screenToWorld = (sx: number, sy: number) => {
        if (!wrapRef.current) return { x: 0, y: 0 };
        const r = wrapRef.current.getBoundingClientRect();
        return {
            x: (sx - r.left - store.viewport.x) / (store.viewport.zoom * PX_PER_METER),
            y: (sy - r.top - store.viewport.y) / (store.viewport.zoom * PX_PER_METER)
        };
    };

    const snapWorld = (v: number) => store.snapEnabled ? Math.round(v / SNAP_GRID) * SNAP_GRID : v;

    // --- Hit Testing ---
    const dist = (a: Point, b: Point) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
    const pointToSegDist = (p: Point, a: Point, b: Point) => {
        const dx = b.x - a.x, dy = b.y - a.y;
        const lenSq = dx * dx + dy * dy;
        if (lenSq === 0) return dist(p, a);
        let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
        t = Math.max(0, Math.min(1, t));
        return dist(p, { x: a.x + t * dx, y: a.y + t * dy });
    };

    const hitTest = (sx: number, sy: number) => {
        const w = screenToWorld(sx, sy);
        // Objects Reverse
        for (let i = store.objects.length - 1; i >= 0; i--) {
            const obj = store.objects[i];
            const hw = (obj.width || 0.5) / 2;
            const hh = (obj.height || 0.5) / 2;
            if (w.x >= obj.x - hw && w.x <= obj.x + hw && w.y >= obj.y - hh && w.y <= obj.y + hh) return obj.id;
        }
        // Walls
        for (let i = store.walls.length - 1; i >= 0; i--) {
            const wall = store.walls[i];
            for (let j = 0; j < wall.points.length - 1; j++) {
                if (pointToSegDist(w, wall.points[j], wall.points[j+1]) < wall.thickness / 2 + 0.15) return wall.id;
            }
        }
        return null;
    };

    // --- Mouse Events ---
    const handlePointerDown = (e: React.PointerEvent) => {
        const target = e.target as SVGElement;
        const handleType = target.getAttribute('data-handle');

        const isGrab = store.tool === 'grab';
        const isPanShortcut = e.metaKey || e.ctrlKey;

        if (e.button === 1 || (e.button === 0 && (e.altKey || isGrab || isPanShortcut))) { // Alt/Grab/Cmd/Middle-click for pan
            setPan({ sx: e.clientX, sy: e.clientY, vx: store.viewport.x, vy: store.viewport.y });
            e.preventDefault(); return;
        }
        if (e.button !== 0) return;

        const w = screenToWorld(e.clientX, e.clientY);

        if (store.tool === 'wall') {
            let pt = { x: snapWorld(w.x), y: snapWorld(w.y) };

            // 0) Check if clicking at the start/end of an existing wall to resume drawing
            if (!store.wallDrawing || store.wallDrawing.points.length === 0) {
                let resumeId: string | null = null;
                let atStart = false;
                store.walls.forEach(wall => {
                    if (wall.points.length < 2) return;
                    const p0 = wall.points[0];
                    const pN = wall.points[wall.points.length - 1];
                    if (dist(p0, w) < 0.3) { resumeId = wall.id; atStart = true; }
                    else if (dist(pN, w) < 0.3) { resumeId = wall.id; atStart = false; }
                });
                if (resumeId) {
                    store.resumeWallDrawing(resumeId, atStart);
                    return;
                }
            }
            
            // 1) End-to-end snapping for ALL walls
            store.walls.forEach(wall => wall.points.forEach(p => {
                if (dist(p, pt) < 0.3) pt = { ...p };
            }));

            // 2) Snapping to the CURRENT wall's FIRST point (Closed Loop)
            if (store.wallDrawing && store.wallDrawing.points.length > 1) {
                const firstPt = store.wallDrawing.points[0];
                if (dist(firstPt, pt) < 0.3) {
                    // Close the loop
                    store.addWallPoint({ ...firstPt });
                    store.endWallMode();
                    store.setTool('select');
                    return;
                }
            }

            // 3) Orthogonal Snap (Reto) vs Free Angle (Distorcer)
            if (store.wallDrawing && store.wallDrawing.points.length > 0 && store.snapEnabled) {
                const last = store.wallDrawing.points[store.wallDrawing.points.length - 1];
                const angle = Math.atan2(pt.y - last.y, pt.x - last.x) * 180 / Math.PI;
                const snappedAngles = [0, 45, 90, 135, 180, -45, -90, -135, -180];
                for (const sa of snappedAngles) {
                    if (Math.abs(angle - sa) < SNAP_ANGLE_TOL) {
                        const len = dist(last, pt);
                        pt = { x: last.x + Math.cos(sa * Math.PI/180) * len, y: last.y + Math.sin(sa * Math.PI/180) * len };
                        break;
                    }
                }
            }
            store.addWallPoint(pt);
            return;
        }

        if (store.tool.startsWith('add-')) {
            const key = store.tool.replace('add-', '');
            if (key !== 'point') {
                const tpl = CATALOG[key];
                if (tpl) {
                    store.saveState();
                    store.addObject({
                        id: generateId('o'),
                        ...JSON.parse(JSON.stringify(tpl)),
                        x: snapWorld(w.x),
                        y: snapWorld(w.y),
                        rotation: 0
                    });
                    store.setTool('select');
                }
                return;
            }
        }

        if (store.tool === 'add-point') {
            const w = screenToWorld(e.clientX, e.clientY);
            let bestWall: any = null;
            let bestSeg = -1;
            let bestT = 0;
            let minD = 0.5;

            store.walls.forEach(wall => {
                for (let j = 0; j < wall.points.length - 1; j++) {
                    const a = wall.points[j], b = wall.points[j+1];
                    const dx = b.x - a.x, dy = b.y - a.y;
                    const lenSq = dx * dx + dy * dy;
                    if (lenSq === 0) continue;
                    let t = ((w.x - a.x) * dx + (w.y - a.y) * dy) / lenSq;
                    t = Math.max(0, Math.min(1, t));
                    const d = dist(w, { x: a.x + t * dx, y: a.y + t * dy });
                    if (d < minD) {
                        minD = d; bestWall = wall; bestSeg = j; bestT = t;
                    }
                }
            });

            if (bestWall && bestSeg !== -1 && bestT > 0 && bestT < 1) {
                const a = bestWall.points[bestSeg];
                const b = bestWall.points[bestSeg + 1];
                const pt = { x: a.x + (b.x - a.x) * bestT, y: a.y + (b.y - a.y) * bestT };
                store.splitWallSegment(bestWall.id, bestSeg, bestT, pt);
                store.setSelection([bestWall.id]);
                store.setTool('select');
            }
            return;
        }

        if (store.tool === 'door' || store.tool === 'window') {
            const w = screenToWorld(e.clientX, e.clientY);
            let bestWall: any = null;
            let bestSeg = -1;
            let bestT = 0;
            let minD = 0.5;

            store.walls.forEach(wall => {
                for (let j = 0; j < wall.points.length - 1; j++) {
                    const a = wall.points[j], b = wall.points[j+1];
                    const dx = b.x - a.x, dy = b.y - a.y;
                    const lenSq = dx * dx + dy * dy;
                    if (lenSq === 0) continue;
                    let t = ((w.x - a.x) * dx + (w.y - a.y) * dy) / lenSq;
                    t = Math.max(0, Math.min(1, t));
                    const d = dist(w, { x: a.x + t * dx, y: a.y + t * dy });
                    if (d < minD) {
                        minD = d; bestWall = wall; bestSeg = j; bestT = t;
                    }
                }
            });

            if (bestWall) {
                store.addWallOpening(bestWall.id, bestSeg, bestT, store.tool);
            }
            return;
        }

        if (store.tool === 'select') {
            if (handleType === 'rotate') {
                const objId = target.getAttribute('data-obj-id')!;
                const obj = store.objects.find(o => o.id === objId);
                if (obj) {
                    store.saveState();
                    setDrag({ type: 'rotate', objId, startRotation: obj.rotation || 0, centerX: obj.x, centerY: obj.y, startAngle: Math.atan2(w.y - obj.y, w.x - obj.x) });
                }
                return;
            }
            if (handleType === 'resize') {
                const objId = target.getAttribute('data-obj-id')!;
                const dir = target.getAttribute('data-dir')!;
                const obj = store.objects.find(o => o.id === objId);
                if (obj) {
                    store.saveState();
                    const rad = (obj.rotation || 0) * Math.PI / 180;
                    const cos = Math.cos(rad);
                    const sin = Math.sin(rad);
                    
                    // Store initial state for more complex resize
                    setDrag({ 
                        type: 'resize', objId, dir, 
                        startW: obj.width || 0.5, startH: obj.height || 0.5, 
                        startX: obj.x, startY: obj.y,
                        startRotation: obj.rotation || 0,
                        aspectRatio: (obj.width || 0.5) / (obj.height || 0.5),
                        sx: e.clientX, sy: e.clientY 
                    });
                }
                return;
            }
            if (handleType === 'sun-dir') {
                const objId = target.getAttribute('data-obj-id')!;
                const obj = store.objects.find(o => o.id === objId);
                if (obj) {
                    store.saveState();
                    setDrag({ type: 'sun-dir', objId });
                }
                return;
            }

            const handleWallId = target.getAttribute('data-wall-handle');
            if (handleWallId) {
                const ptIdx = parseInt(target.getAttribute('data-pt')!);
                store.saveState();
                setDrag({ type: 'wallpt', wallId: handleWallId, ptIdx, sx: e.clientX, sy: e.clientY });
                return;
            }

            const bezierWallId = target.getAttribute('data-bezier-handle');
            if (bezierWallId) {
                const ptIdx = parseInt(target.getAttribute('data-pt')!);
                const bType = target.getAttribute('data-type')! as 'hIn' | 'hOut';
                store.saveState();
                setDrag({ type: 'bezier', wallId: bezierWallId, ptIdx, bType, sx: e.clientX, sy: e.clientY });
                return;
            }

            const hitId = hitTest(e.clientX, e.clientY);
            if (hitId) {
                if (!e.shiftKey) store.setSelection([hitId]);
                else if (!store.selection.includes(hitId)) store.setSelection([...store.selection, hitId]);
                
                store.saveState();
                setDrag({ type: 'move', sx: e.clientX, sy: e.clientY });
            } else {
                store.setSelection([]);
            }
        }
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        const w = screenToWorld(e.clientX, e.clientY);
        setPreviewPoint({ x: snapWorld(w.x), y: snapWorld(w.y) });

        if (pan) {
            store.setViewport({ ...store.viewport, x: pan.vx + (e.clientX - pan.sx), y: pan.vy + (e.clientY - pan.sy) });
            return;
        }

        if (drag) {
            const dx = (e.clientX - drag.sx) / (store.viewport.zoom * PX_PER_METER);
            const dy = (e.clientY - drag.sy) / (store.viewport.zoom * PX_PER_METER);
            
            if (drag.type === 'move') {
                store.moveObjects(dx, dy);
                setDrag({ ...drag, sx: e.clientX, sy: e.clientY });
            } else if (drag.type === 'sun-dir') {
                const obj = store.objects.find(o => o.id === drag.objId);
                if (obj) {
                    const angleRad = Math.atan2(w.y - obj.y, w.x - obj.x);
                    let angleDeg = angleRad * 180 / Math.PI + 90; // +90 so 0° = up (north)
                    if (angleDeg < 0) angleDeg += 360;
                    if (angleDeg >= 360) angleDeg -= 360;
                    if (store.snapEnabled) angleDeg = Math.round(angleDeg / 15) * 15;
                    store.updateObject(obj.id, { properties: { ...obj.properties, azimuth: Math.round(angleDeg) } });
                }
            } else if (drag.type === 'rotate') {
                const currentAngle = Math.atan2(w.y - drag.centerY, w.x - drag.centerX);
                let diff = (currentAngle - drag.startAngle) * 180 / Math.PI;
                if (store.snapEnabled) diff = Math.round(diff / 15) * 15;
                store.updateObject(drag.objId, { rotation: drag.startRotation + diff });
            } else if (drag.type === 'resize') {
                const obj = store.objects.find(o => o.id === drag.objId);
                if (obj) {
                    const rot = (obj.rotation || 0) * Math.PI / 180;
                    const cos = Math.cos(-rot); // Rotate mouse delta back to local space
                    const sin = Math.sin(-rot);
                    const localDx = dx * cos - dy * sin;
                    const localDy = dx * sin + dy * cos;

                    let newW = drag.startW;
                    let newH = drag.startH;
                    let offX = 0;
                    let offY = 0;

                    const d = drag.dir;
                    if (d.includes('e')) { newW = Math.max(0.1, drag.startW + localDx); offX = (newW - drag.startW) / 2; }
                    if (d.includes('w')) { newW = Math.max(0.1, drag.startW - localDx); offX = -(newW - drag.startW) / 2; }
                    if (d.includes('s')) { newH = Math.max(0.1, drag.startH + localDy); offY = (newH - drag.startH) / 2; }
                    if (d.includes('n')) { newH = Math.max(0.1, drag.startH - localDy); offY = -(newH - drag.startH) / 2; }

                    if (e.shiftKey && d.length === 2) { // Aspect Ratio (Corner Only)
                        const scale = Math.max(newW / drag.startW, newH / drag.startH);
                        newW = drag.startW * scale;
                        newH = drag.startH * scale;
                        offX = (d.includes('e') ? 1 : -1) * (newW - drag.startW) / 2;
                        offY = (d.includes('s') ? 1 : -1) * (newH - drag.startH) / 2;
                    }

                    // Rotate offset back to world space
                    const worldOffX = offX * Math.cos(rot) - offY * Math.sin(rot);
                    const worldOffY = offX * Math.sin(rot) + offY * Math.cos(rot);

                    store.updateObject(obj.id, { 
                        width: newW, 
                        height: newH,
                        x: drag.startX + worldOffX,
                        y: drag.startY + worldOffY
                    });
                }
            } else if (drag.type === 'wallpt') {
                const wall = store.walls.find(w => w.id === drag.wallId);
                if (wall) {
                    const newPts = [...wall.points];
                    const oldPt = newPts[drag.ptIdx];
                    const newPt: import('../store/useLightMapStore').Point = { x: snapWorld(w.x), y: snapWorld(w.y) };
                    
                    // Move handles along with point
                    const dxP = newPt.x - oldPt.x;
                    const dyP = newPt.y - oldPt.y;
                    if (oldPt.hIn) newPt.hIn = { x: oldPt.hIn.x + dxP, y: oldPt.hIn.y + dyP };
                    if (oldPt.hOut) newPt.hOut = { x: oldPt.hOut.x + dxP, y: oldPt.hOut.y + dyP };

                    newPts[drag.ptIdx] = { ...oldPt, ...newPt };
                    store.updateWall(drag.wallId, { points: newPts });
                }
            } else if (drag.type === 'bezier') {
                const wall = store.walls.find(w => w.id === drag.wallId);
                if (wall) {
                    const newPts = [...wall.points];
                    const pt: import('../store/useLightMapStore').Point = { ...newPts[drag.ptIdx] };
                    if (drag.bType === 'hIn') pt.hIn = { x: w.x, y: w.y }; // Not snapped for smooth curves
                    if (drag.bType === 'hOut') pt.hOut = { x: w.x, y: w.y };
                    newPts[drag.ptIdx] = pt;
                    store.updateWall(drag.wallId, { points: newPts });
                }
            }
        }
    };

    const handlePointerUp = () => {
        if (drag) setDrag(null);
        if (pan) setPan(null);
    };

    const handleWheel = (e: React.WheelEvent) => {
        if (!wrapRef.current) return;
        const r = wrapRef.current.getBoundingClientRect();
        const mx = e.clientX - r.left, my = e.clientY - r.top;
        const oldZoom = store.viewport.zoom;
        const factor = e.deltaY < 0 ? 1.1 : 0.9;
        const newZoom = Math.max(0.1, Math.min(10, oldZoom * factor));
        
        store.setViewport({
            x: mx - (mx - store.viewport.x) * (newZoom / oldZoom),
            y: my - (my - store.viewport.y) * (newZoom / oldZoom),
            zoom: newZoom
        });
    };

    // --- Key Events ---
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const t = e.target as HTMLElement;
            if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT') return;
            const key = e.key.toLowerCase();
            
            if (key === 'v') store.setTool('select');
            if (key === 'w') store.setTool('wall');
            if (key === 'f') { e.preventDefault(); store.fitToScreen(); }
            if (key === 'enter') {
                if (store.tool === 'wall') { store.endWallMode(); store.setTool('select'); }
            }
            if (key === 'escape') {
                if (store.tool === 'wall') { store.endWallMode(); store.setTool('select'); }
                else store.setSelection([]);
            }
            if (key === 'backspace' || key === 'delete') {
                if (store.tool === 'wall' && store.wallDrawing) store.popWallPoint();
                else store.deleteSelected();
            }
            if ((e.ctrlKey || e.metaKey) && key === 'z') { e.preventDefault(); store.undo(); }
            if ((e.ctrlKey || e.metaKey) && key === 'y') { e.preventDefault(); store.redo(); }
            if ((e.ctrlKey || e.metaKey) && key === 'd') { e.preventDefault(); store.duplicateSelected(); }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [store]);

    // RENDERERS
    const renderGrid = () => {
        if (!store.gridVisible) return null;
        const gp = GRID_SIZE * PX_PER_METER * store.viewport.zoom;
        const mgp = PX_PER_METER * store.viewport.zoom;
        
        const dots = [];
        const lines = [];

        const ox = store.viewport.x % gp, oy = store.viewport.y % gp;
        const mox = store.viewport.x % mgp, moy = store.viewport.y % mgp;

        for (let x = ox; x < dim.w; x += gp) {
            for (let y = oy; y < dim.h; y += gp) {
                dots.push(<circle key={`d-${x}-${y}`} cx={x} cy={y} r={1} fill="#333" />);
            }
        }
        for (let x = mox; x < dim.w; x += mgp) {
            lines.push(<line key={`vl-${x}`} x1={x} y1={0} x2={x} y2={dim.h} stroke="#222" strokeWidth={0.5} />);
        }
        for (let y = moy; y < dim.h; y += mgp) {
            lines.push(<line key={`hl-${y}`} x1={0} y1={y} x2={dim.w} y2={y} stroke="#222" strokeWidth={0.5} />);
        }

        return <g id="grid">{lines}{dots}</g>;
    };

    const renderWalls = () => {
        return store.walls.map(wall => {
            const elements: React.ReactElement[] = [];
            const lines: React.ReactElement[] = [];
            const handles: React.ReactElement[] = [];
            const isSelected = store.selection.includes(wall.id);
            const z = store.viewport.zoom;
            const th = wall.thickness * PX_PER_METER * z;

            const SP = wall.points.map(p => worldToScreen(p.x, p.y));
            const N = SP.length;
            if (N < 2) return null;

            const isClosed = N > 2 && Math.sqrt((SP[0].x - SP[N-1].x)**2 + (SP[0].y - SP[N-1].y)**2) < 0.01;

            const L = new Array(N);
            const R = new Array(N);

            const normalize = (dx: number, dy: number) => {
                const len = Math.sqrt(dx*dx + dy*dy) || 1;
                return { x: dx/len, y: dy/len };
            };

            const handleWallClick = (e: React.MouseEvent) => {
                e.stopPropagation();
                if (!store.selection.includes(wall.id)) store.setSelection(e.shiftKey ? [...store.selection, wall.id] : [wall.id]);
                if (e.altKey || store.tool === 'distort') store.toggleWallSpline(wall.id, true);
            };

            if (wall.isSpline) {
                let d = '';
                SP.forEach((p, i) => {
                    if (i === 0) d += `M ${p.x} ${p.y} `;
                    else {
                        const prev = wall.points[i-1];
                        const curr = wall.points[i];
                        if (prev.hOut && curr.hIn) {
                            const hp1 = worldToScreen(prev.hOut.x, prev.hOut.y);
                            const hp2 = worldToScreen(curr.hIn.x, curr.hIn.y);
                            d += `C ${hp1.x} ${hp1.y}, ${hp2.x} ${hp2.y}, ${p.x} ${p.y} `;
                        } else {
                            d += `L ${p.x} ${p.y} `;
                        }
                    }
                });
                if (isClosed) {
                    const prev = wall.points[N-1];
                    const curr = wall.points[0];
                    if (prev.hOut && curr.hIn) {
                        const hp1 = worldToScreen(prev.hOut.x, prev.hOut.y);
                        const hp2 = worldToScreen(curr.hIn.x, curr.hIn.y);
                        d += `C ${hp1.x} ${hp1.y}, ${hp2.x} ${hp2.y}, ${SP[0].x} ${SP[0].y} `;
                    } else {
                        d += 'Z ';
                    }
                }

                elements.push(
                    <path key={`spline-${wall.id}`} d={d} fill="none" stroke={wall.color} strokeWidth={th} strokeLinecap="round" strokeLinejoin="round" style={{ pointerEvents: 'none' }} />
                );
                elements.push(
                    <path key={`hit-${wall.id}`} d={d} fill="none" stroke="transparent" strokeWidth={th + 15} style={{ pointerEvents: 'all', cursor: 'pointer' }} onClick={handleWallClick} />
                );
                
                if (isSelected) {
                    wall.points.forEach((pt, i) => {
                        const s = worldToScreen(pt.x, pt.y);
                        handles.push(
                            <circle key={`hndl-${wall.id}-${i}`} cx={s.x} cy={s.y} r={5} fill="#1f6feb" stroke="#fff" strokeWidth={1} cursor="grab" data-wall-handle={wall.id} data-pt={i} />
                        );
                        if (pt.hIn) {
                            const hs = worldToScreen(pt.hIn.x, pt.hIn.y);
                            handles.push(<line key={`l-in-${wall.id}-${i}`} x1={s.x} y1={s.y} x2={hs.x} y2={hs.y} stroke="#1f6feb" strokeWidth={1} strokeDasharray="2 2" />);
                            handles.push(<circle key={`h-in-${wall.id}-${i}`} cx={hs.x} cy={hs.y} r={4} fill="#fff" stroke="#1f6feb" strokeWidth={1} cursor="grab" data-bezier-handle={wall.id} data-pt={i} data-type="hIn" />);
                        }
                        if (pt.hOut) {
                            const hs = worldToScreen(pt.hOut.x, pt.hOut.y);
                            handles.push(<line key={`l-out-${wall.id}-${i}`} x1={s.x} y1={s.y} x2={hs.x} y2={hs.y} stroke="#1f6feb" strokeWidth={1} strokeDasharray="2 2" />);
                            handles.push(<circle key={`h-out-${wall.id}-${i}`} cx={hs.x} cy={hs.y} r={4} fill="#fff" stroke="#1f6feb" strokeWidth={1} cursor="grab" data-bezier-handle={wall.id} data-pt={i} data-type="hOut" />);
                        }
                    });
                }
                return <g key={wall.id}>{elements}{lines}{handles}</g>;
            }

            for (let i = 0; i < N; i++) {
                if (isClosed && (i === 0 || i === N - 1)) {
                    if (i === N - 1) {
                        L[N-1] = { ...L[0] };
                        R[N-1] = { ...R[0] };
                    } else {
                        const d1 = normalize(SP[0].x - SP[N-2].x, SP[0].y - SP[N-2].y);
                        const d2 = normalize(SP[1].x - SP[0].x, SP[1].y - SP[0].y);
                        const m_dir = normalize(d1.x + d2.x, d1.y + d2.y);
                        const m_normal = { x: -m_dir.y, y: m_dir.x };
                        const n1 = { x: -d1.y, y: d1.x };
                        const dot = n1.x * m_normal.x + n1.y * m_normal.y;
                        
                        if (Math.abs(dot) < 0.05) {
                            L[0] = { x: SP[0].x + n1.x * th/2, y: SP[0].y + n1.y * th/2 };
                            R[0] = { x: SP[0].x - n1.x * th/2, y: SP[0].y - n1.y * th/2 };
                        } else {
                            const mlen = (th/2) / dot;
                            L[0] = { x: SP[0].x + m_normal.x * mlen, y: SP[0].y + m_normal.y * mlen };
                            R[0] = { x: SP[0].x - m_normal.x * mlen, y: SP[0].y - m_normal.y * mlen };
                        }
                    }
                } else if (!isClosed && i === 0) {
                    const d = normalize(SP[1].x - SP[0].x, SP[1].y - SP[0].y);
                    const n = { x: -d.y, y: d.x };
                    L[0] = { x: SP[0].x + n.x * th/2, y: SP[0].y + n.y * th/2 };
                    R[0] = { x: SP[0].x - n.x * th/2, y: SP[0].y - n.y * th/2 };
                } else if (!isClosed && i === N - 1) {
                    const d = normalize(SP[N-1].x - SP[N-2].x, SP[N-1].y - SP[N-2].y);
                    const n = { x: -d.y, y: d.x };
                    L[N-1] = { x: SP[N-1].x + n.x * th/2, y: SP[N-1].y + n.y * th/2 };
                    R[N-1] = { x: SP[N-1].x - n.x * th/2, y: SP[N-1].y - n.y * th/2 };
                } else {
                    const d1 = normalize(SP[i].x - SP[i-1].x, SP[i].y - SP[i-1].y);
                    const d2 = normalize(SP[i+1].x - SP[i].x, SP[i+1].y - SP[i].y);
                    const m_dir = normalize(d1.x + d2.x, d1.y + d2.y);
                    const m_normal = { x: -m_dir.y, y: m_dir.x };
                    const n1 = { x: -d1.y, y: d1.x };
                    const dot = n1.x * m_normal.x + n1.y * m_normal.y;
                    
                    if (Math.abs(dot) < 0.05) {
                        L[i] = { x: SP[i].x + n1.x * th/2, y: SP[i].y + n1.y * th/2 };
                        R[i] = { x: SP[i].x - n1.x * th/2, y: SP[i].y - n1.y * th/2 };
                    } else {
                        const mlen = (th/2) / dot;
                        L[i] = { x: SP[i].x + m_normal.x * mlen, y: SP[i].y + m_normal.y * mlen };
                        R[i] = { x: SP[i].x - m_normal.x * mlen, y: SP[i].y - m_normal.y * mlen };
                    }
                }
            }

            const strokeColor = isSelected ? '#1f6feb' : '#444';
            const sw = isSelected ? 2 : 1.5;

            let pieceIdx = 0;
            const fillPoly = (p1: any, p2: any, p3: any, p4: any) => elements.push(
                <polygon key={`wp-${wall.id}-${pieceIdx++}`} points={`${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y}`} fill={wall.color || '#444'} stroke="none" style={{ pointerEvents: 'none' }} />
            );
            const strokeEdge = (p1: any, p2: any) => lines.push(
                <line key={`wl-${wall.id}-${pieceIdx++}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={strokeColor} strokeWidth={sw} style={{ pointerEvents: 'none' }} />
            );

            // We also need an invisible polygon for hit-testing without stroke visual artifacts
            elements.push(
                <g key={`hit-${wall.id}`} style={{ pointerEvents: 'all', cursor: 'pointer' }} onClick={handleWallClick}>
                    {SP.map((p, i) => {
                        if (i === N - 1) return null;
                        const d = normalize(SP[i+1].x - SP[i].x, SP[i+1].y - SP[i].y);
                        const n = { x: -d.y, y: d.x };
                        const s1 = { x: SP[i].x + n.x * th/2, y: SP[i].y + n.y * th/2 };
                        const s2 = { x: SP[i+1].x + n.x * th/2, y: SP[i+1].y + n.y * th/2 };
                        const s3 = { x: SP[i+1].x - n.x * th/2, y: SP[i+1].y - n.y * th/2 };
                        const s4 = { x: SP[i].x - n.x * th/2, y: SP[i].y - n.y * th/2 };
                        return <polygon key={i} points={`${s1.x},${s1.y} ${s2.x},${s2.y} ${s3.x},${s3.y} ${s4.x},${s4.y}`} fill="transparent" stroke="transparent" strokeWidth={10} />;
                    })}
                </g>
            );

            for (let i = 0; i < N - 1; i++) {
                const P1 = SP[i], P2 = SP[i+1];
                const segLen = Math.sqrt((P2.x-P1.x)**2 + (P2.y-P1.y)**2);
                const d = normalize(P2.x-P1.x, P2.y-P1.y);
                const n = { x: -d.y, y: d.x };

                const getL = (t: number, miter: boolean) => {
                    if (miter && t === 0) return L[i];
                    if (miter && t === 1) return L[i+1];
                    return { x: P1.x + d.x * (t * segLen) + n.x * th/2, y: P1.y + d.y * (t * segLen) + n.y * th/2 };
                };
                const getR = (t: number, miter: boolean) => {
                    if (miter && t === 0) return R[i];
                    if (miter && t === 1) return R[i+1];
                    return { x: P1.x + d.x * (t * segLen) - n.x * th/2, y: P1.y + d.y * (t * segLen) - n.y * th/2 };
                };

                const wallOps = (wall.openings || []).filter(op => op.segmentIndex === i).sort((a,b) => a.t - b.t);
                let lastT = 0;

                wallOps.forEach((op, opIdx) => {
                    const opSW = op.width * PX_PER_METER * z;
                    const halfW = (opSW / 2) / (segLen || 1);
                    const tStart = Math.max(lastT, op.t - halfW);
                    const tEnd = Math.min(1, op.t + halfW);

                    if (tStart > lastT) {
                        const sl = getL(lastT, true);
                        const sr = getR(lastT, true);
                        const el = getL(tStart, true);
                        const er = getR(tStart, true);
                        
                        fillPoly(sl, el, er, sr);
                        strokeEdge(sl, el);
                        strokeEdge(sr, er);
                        
                        // Start caps
                        if (lastT === 0 && i === 0 && !isClosed) strokeEdge(sl, sr);
                        else if (lastT > 0) strokeEdge(sl, sr);
                        
                        // End caps
                        if (tStart === 1 && i === N - 2 && !isClosed) strokeEdge(el, er);
                        else if (tStart < 1) strokeEdge(el, er);
                    }

                    const inL1 = { x: P1.x + d.x*(tStart*segLen) + n.x*th*0.15, y: P1.y + d.y*(tStart*segLen) + n.y*th*0.15 };
                    const inR1 = { x: P1.x + d.x*(tStart*segLen) - n.x*th*0.15, y: P1.y + d.y*(tStart*segLen) - n.y*th*0.15 };
                    const inL2 = { x: P1.x + d.x*(tEnd*segLen) + n.x*th*0.15, y: P1.y + d.y*(tEnd*segLen) + n.y*th*0.15 };
                    const inR2 = { x: P1.x + d.x*(tEnd*segLen) - n.x*th*0.15, y: P1.y + d.y*(tEnd*segLen) - n.y*th*0.15 };

                    elements.push(
                        <polygon key={`wop-${wall.id}-${i}-${op.id}`} points={`${inL1.x},${inL1.y} ${inL2.x},${inL2.y} ${inR2.x},${inR2.y} ${inR1.x},${inR1.y}`} fill="#222" stroke="#444" strokeWidth={0.5} style={{ pointerEvents: 'none' }} />
                    );

                    if (op.type === 'door') {
                        const angle = Math.atan2(d.y, d.x);
                        const doorLen = opSW;
                        const flipSwing = op.flipSwing ? -1 : 1;
                        const flipSide = op.flipSide ? -1 : 1;
                        const swingAngle = angle - (Math.PI / 2) * flipSide;
                        const cdx = Math.cos(swingAngle) * doorLen * flipSwing;
                        const cdy = Math.sin(swingAngle) * doorLen * flipSwing;
                        const o1 = op.flipSwing ? { x: P1.x + d.x*(tEnd*segLen), y: P1.y + d.y*(tEnd*segLen) } : { x: P1.x + d.x*(tStart*segLen), y: P1.y + d.y*(tStart*segLen) };
                        const o2 = op.flipSwing ? { x: P1.x + d.x*(tStart*segLen), y: P1.y + d.y*(tStart*segLen) } : { x: P1.x + d.x*(tEnd*segLen), y: P1.y + d.y*(tEnd*segLen) };
                        const sweep = ((op.flipSide ? 1 : 0) ^ (op.flipSwing ? 1 : 0)) ? 0 : 1;
                        elements.push(
                            <g key={`door-sym-${op.id}`} style={{ pointerEvents: 'none' }}>
                                <line x1={o1.x} y1={o1.y} x2={o1.x+cdx} y2={o1.y+cdy} stroke="#4a9eff" strokeWidth={2} />
                                <path d={`M ${o1.x+cdx} ${o1.y+cdy} A ${doorLen} ${doorLen} 0 0 ${sweep} ${o2.x} ${o2.y}`} fill="none" stroke="#4a9eff" strokeWidth={1} strokeDasharray="2 2" />
                            </g>
                        );
                    } else {
                        const wL1 = { x: P1.x + d.x*(tStart*segLen) + n.x*th*0.3, y: P1.y + d.y*(tStart*segLen) + n.y*th*0.3 };
                        const wR1 = { x: P1.x + d.x*(tStart*segLen) - n.x*th*0.3, y: P1.y + d.y*(tStart*segLen) - n.y*th*0.3 };
                        const wL2 = { x: P1.x + d.x*(tEnd*segLen) + n.x*th*0.3, y: P1.y + d.y*(tEnd*segLen) + n.y*th*0.3 };
                        const wR2 = { x: P1.x + d.x*(tEnd*segLen) - n.x*th*0.3, y: P1.y + d.y*(tEnd*segLen) - n.y*th*0.3 };
                        elements.push(
                            <g key={`win-sym-${op.id}`} style={{ pointerEvents: 'none' }}>
                                <line x1={wL1.x} y1={wL1.y} x2={wL2.x} y2={wL2.y} stroke="#4a9eff" strokeWidth={1} />
                                <line x1={wR1.x} y1={wR1.y} x2={wR2.x} y2={wR2.y} stroke="#4a9eff" strokeWidth={1} />
                            </g>
                        );
                    }

                    lastT = tEnd;
                });

                if (lastT < 1) {
                    const sl = getL(lastT, true);
                    const sr = getR(lastT, true);
                    const el = getL(1, true);
                    const er = getR(1, true);
                    
                    fillPoly(sl, el, er, sr);
                    strokeEdge(sl, el);
                    strokeEdge(sr, er);
                    
                    if (lastT === 0 && i === 0 && !isClosed) strokeEdge(sl, sr);
                    else if (lastT > 0) strokeEdge(sl, sr);
                    
                    if (i === N - 2 && !isClosed) strokeEdge(el, er);
                }
            }

            if (isSelected) {
                wall.points.forEach((pt, i) => {
                    const s = worldToScreen(pt.x, pt.y);
                    handles.push(
                        <circle 
                            key={`hndl-${wall.id}-${i}`} cx={s.x} cy={s.y} r={5} fill="#1f6feb" stroke="#fff" strokeWidth={1}
                            cursor="grab" data-wall-handle={wall.id} data-pt={i}
                        />
                    );
                });
            }

            return <g key={wall.id}>{elements}{lines}{handles}</g>;
        });
    };

    const renderObjects = (layer?: 'active' | 'passive') => {
        return store.objects.filter(obj => {
            const isActive = obj.type === 'camera' || obj.type === 'light';
            if (layer === 'active') return isActive;
            if (layer === 'passive') return !isActive;
            return true;
        }).map(obj => {
            const s = worldToScreen(obj.x, obj.y);
            const isSelected = store.selection.includes(obj.id);
            const z = store.viewport.zoom;
            const w = (obj.width || 1) * PX_PER_METER * z / 2;
            const h = (obj.height || 0.5) * PX_PER_METER * z / 2;
            const color = obj.color || '#3a3d4a';
            const stroke = isSelected ? '#1f6feb' : '#444';
            const sw = isSelected ? 2 : 0.5;
            const sda = isSelected ? '4 2' : 'none';

            let content = null;
            let handles = null;

            if (isSelected) {
                const hSz = 8 * z;
                const rotHandleOffset = 24 * z;
                const handlesData = [
                    { x: -w, y: -h, dir: 'nw' }, { x: 0, y: -h, dir: 'n' }, { x: w, y: -h, dir: 'ne' },
                    { x: -w, y: 0, dir: 'w' },                            { x: w, y: 0, dir: 'e' },
                    { x: -w, y: h, dir: 'sw' }, { x: 0, y: h, dir: 's' }, { x: w, y: h, dir: 'se' }
                ];
                handles = (
                    <g style={{ pointerEvents: 'all' }}>
                        {/* Rotation Handle (24px above TM) */}
                        <line x1={0} y1={-h} x2={0} y2={-h - rotHandleOffset} stroke="#1f6feb" strokeWidth={1.5} />
                        <circle 
                            cx={0} cy={-h - rotHandleOffset - 5*z} r={hSz} fill="#1f6feb" stroke="#fff" strokeWidth={1}
                            cursor="crosshair" data-handle="rotate" data-obj-id={obj.id}
                        />
                        
                        {/* Resize Handles (8 total) */}
                        {handlesData.map(hd => (
                            <rect 
                                key={hd.dir}
                                x={hd.x - hSz/2} y={hd.y - hSz/2} width={hSz} height={hSz}
                                fill="#ffffff" stroke="#1f6feb" strokeWidth={1}
                                cursor={`${hd.dir.length === 1 ? (hd.dir === 'n' || hd.dir === 's' ? 'ns' : 'ew') : hd.dir}-resize`}
                                data-handle="resize" data-obj-id={obj.id} data-dir={hd.dir}
                            />
                        ))}
                    </g>
                );
            }

            if (obj.type === 'camera') {
                const fov = fovFromFocal(obj.properties?.focalLength || 35);
                // Scale cone with camera size (1.5x width)
                const coneLen = (obj.width || 0.6) * 4 * PX_PER_METER * z;
                const halfFov = (fov / 2) * Math.PI / 180;
                
                // Cone starts from the front edge of the camera
                const startY = -h;
                const cx1 = -Math.sin(halfFov) * coneLen, cy1 = startY - Math.cos(halfFov) * coneLen;
                const cx2 = Math.sin(halfFov) * coneLen, cy2 = startY - Math.cos(halfFov) * coneLen;

                content = (
                    <>
                        <polygon points={`0,${startY} ${cx1},${cy1} ${cx2},${cy2}`} fill={hexToRgba(color, 0.12)} stroke={hexToRgba(color, 0.35)} strokeWidth={1} />
                        <image 
                            href="/icons/LightMap/camera.svg" 
                            x={-w} y={-h} width={w * 2} height={h * 2}
                            style={{ filter: isSelected ? 'drop-shadow(0 0 2px #1f6feb)' : 'none' }}
                        />
                        {isSelected && <rect x={-w} y={-h} width={w * 2} height={h * 2} fill="transparent" stroke={stroke} strokeWidth={sw} strokeDasharray={sda} />}
                    </>
                );
            } else if (obj.type === 'light') {
                const p = obj.properties || {};
                const intensity = (p.intensity ?? 80) / 100;
                
                if (obj.subtype === 'bulb') {
                    const r = (p.radius || 2) * PX_PER_METER * z;
                    content = (
                        <>
                            <circle cx={0} cy={0} r={6 * z} fill={color} stroke={stroke} strokeWidth={sw} strokeDasharray={sda} />
                        </>
                    );
                } else if (obj.subtype === 'spot') {
                    const angle = ((p.coneAngle || 35) / 2) * Math.PI / 180;
                    const rng = (p.range || 3) * PX_PER_METER * z;
                    const cx1 = -Math.sin(angle) * rng, cy1 = -Math.cos(angle) * rng;
                    const cx2 = Math.sin(angle) * rng, cy2 = -Math.cos(angle) * rng;
                    const spotModel = p.spotModel || 'reflector';
                    
                    // Use model dimensions from store instead of fixed iconSz
                    const iW = (obj.width || 0.3) * PX_PER_METER * z / 2;
                    const iH = (obj.height || 0.3) * PX_PER_METER * z / 2;

                    content = (
                        <>
                            <image
                                href={`/icons/LightMap/${spotModel}.svg`}
                                x={-iW} y={-iH / 2} width={iW * 2} height={iH * 2}
                                style={{ filter: isSelected ? 'drop-shadow(0 0 2px #1f6feb)' : 'none' }}
                            />
                           {isSelected && <rect x={-iW} y={-iH / 2} width={iW * 2} height={iH * 2} fill="transparent" stroke={stroke} strokeWidth={sw} strokeDasharray={sda} />}
                        </>
                    );
                } else if (obj.subtype === 'mesa') {
                    content = (
                        <rect 
                            x={-w} y={-h} width={w * 2} height={h * 2}
                            fill={obj.fill || obj.color || '#4a3d2a'}
                            rx={obj.borderRadius ? obj.borderRadius * PX_PER_METER * z : 0}
                            opacity={obj.opacity ?? 1}
                            stroke={stroke} strokeWidth={sw} strokeDasharray={sda}
                        />
                    );
                } else if (obj.subtype === 'sun') {
                    const sz = 12 * z;
                    const azimuthDeg = (p.azimuth || 0) - 90; // -90 so 0° = up (north)
                    const azimuthRad = azimuthDeg * Math.PI / 180;
                    const arrowLen = 80 * z;
                    const ax = Math.cos(azimuthRad) * arrowLen;
                    const ay = Math.sin(azimuthRad) * arrowLen;
                    // Arrowhead tip perpendicular lines
                    const perpAngle = azimuthRad + Math.PI * 0.75;
                    const hs = 10 * z;
                    content = (
                        <>
                            {/* Sun Core */}
                            <circle cx={0} cy={0} r={6 * z} fill={'#ffdd44'} stroke={stroke} strokeWidth={sw} strokeDasharray={sda} />
                            {/* Direction arrow shaft */}
                            <line x1={0} y1={0} x2={ax} y2={ay} stroke="#ffdd44" strokeWidth={2 * z} strokeDasharray={`${4 * z} ${3 * z}`} opacity={0.7} style={{ pointerEvents: 'none' }} />
                            {/* Arrowhead lines */}
                            <line
                                x1={ax} y1={ay}
                                x2={ax + Math.cos(perpAngle) * hs} y2={ay + Math.sin(perpAngle) * hs}
                                stroke="#ffdd44" strokeWidth={2 * z} strokeLinecap="round" style={{ pointerEvents: 'none' }}
                            />
                            <line
                                x1={ax} y1={ay}
                                x2={ax + Math.cos(perpAngle + Math.PI / 2) * hs} y2={ay + Math.sin(perpAngle + Math.PI / 2) * hs}
                                stroke="#ffdd44" strokeWidth={2 * z} strokeLinecap="round" style={{ pointerEvents: 'none' }}
                            />
                            {/* Invisible drag hit area — no visible circle */}
                            <circle
                                cx={ax} cy={ay} r={10 * z}
                                fill="transparent" stroke="none"
                                cursor="grab"
                                data-handle="sun-dir" data-obj-id={obj.id}
                                style={{ pointerEvents: 'all' }}
                            />
                        </>
                    );
                } else {
                    // panel
                    const pw = ((p.panelW || 0.6) * PX_PER_METER * z) / 2;
                    const rng = (p.range || 2) * PX_PER_METER * z;
                    content = (
                        <>
                            <rect x={-pw} y={0} width={pw * 2} height={6 * z} rx={2} fill={color} stroke={stroke} strokeWidth={sw} strokeDasharray={sda} />
                        </>
                    );
                }
            } else if (obj.type === 'character') {
                const model = obj.properties?.model || (obj.subtype === 'char-female' ? 'woman_main' : 'man_main');
                content = (
                    <>
                        <image 
                            href={`/icons/LightMap/${model}.svg`} 
                            x={-w} y={-h} width={w * 2} height={h * 2}
                            style={{ filter: isSelected ? 'drop-shadow(0 0 2px #1f6feb)' : 'none' }}
                        />
                        {isSelected && <rect x={-w} y={-h} width={w * 2} height={h * 2} fill="transparent" stroke={stroke} strokeWidth={sw} strokeDasharray={sda} />}
                    </>
                );
            } else {
                // PROPS: all prop objects (furniture, desk, bed, etc.)
                const model = obj.properties?.model || obj.subtype;
                const isFurniture = ['sofa', 'sofa2', 'sofa3', 'poltrona', 'desk', 'bed-double', 'bed-single', 'bed', 'piano'].includes(obj.subtype) || obj.properties?.model;
                const hasCustomColor = obj.color && obj.color !== '#3a3d4a';
                if (isFurniture) {
                    content = (
                        <>
                            <image 
                                href={`/icons/LightMap/${model}.svg`} 
                                x={-w} y={-h} width={w * 2} height={h * 2}
                                style={{ filter: isSelected ? 'drop-shadow(0 0 2px #1f6feb)' : 'none' }}
                            />
                            {hasCustomColor && <rect x={-w} y={-h} width={w * 2} height={h * 2} rx={3} fill={hexToRgba(obj.color!, 0.25)} stroke="none" style={{ pointerEvents: 'none' }} />}
                            {isSelected && <rect x={-w} y={-h} width={w * 2} height={h * 2} fill="transparent" stroke={stroke} strokeWidth={sw} strokeDasharray={sda} />}
                        </>
                    );
                } else {
                    // Props like TV, Shelf
                    content = <rect x={-w} y={-h} width={w * 2} height={h * 2} rx={3} fill="transparent" stroke={stroke} strokeWidth={sw} strokeDasharray={sda} />;
                }
            }

            return (
                <g key={obj.id} transform={`translate(${s.x},${s.y}) rotate(${obj.rotation || 0})`}>
                    <g style={{ pointerEvents: 'none' }}>
                        {content}
                    </g>
                    {handles}
                    {obj.label && (
                        <text x={0} y={h + 16} textAnchor="middle" fill="#888" fontSize={10} fontFamily="Inter" style={{ pointerEvents: 'none' }}>{obj.label}</text>
                    )}
                </g>
            );
        });
    };

    const renderWallPreview = () => {
        if (!store.wallDrawing || !store.wallDrawing.active || !store.wallDrawing.points.length || !previewPoint) return null;
        
        const pts = store.wallDrawing.points;
        const last = pts[pts.length - 1];
        
        let pt = { ...previewPoint };

        // Angle snap preview
        if (store.snapEnabled) {
            const angle = Math.atan2(pt.y - last.y, pt.x - last.x) * 180 / Math.PI;
            const snappedAngles = [0, 45, 90, 135, 180, -45, -90, -135, -180];
            for (const sa of snappedAngles) {
                if (Math.abs(angle - sa) < SNAP_ANGLE_TOL) {
                    const len = dist(last, pt);
                    pt = { x: last.x + Math.cos(sa * Math.PI/180) * len, y: last.y + Math.sin(sa * Math.PI/180) * len };
                    break;
                }
            }
        }

        const a = worldToScreen(last.x, last.y);
        const b = worldToScreen(pt.x, pt.y);

        return (
            <g>
                <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#4a9eff" strokeWidth={2} strokeDasharray="6 3" />
                <text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 - 8} textAnchor="middle" fill="#4a9eff" fontSize={11} fontFamily="monospace">
                    {mToStr(dist(last, pt))}
                </text>
                {pts.map((p, i) => {
                    if (i === 0) return null;
                    const pa = worldToScreen(pts[i - 1].x, pts[i - 1].y);
                    const pb = worldToScreen(p.x, p.y);
                    return <line key={i} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y} stroke="#1f6feb" strokeWidth={3} />;
                })}
            </g>
        );
    };

    return (
        <div ref={wrapRef} className="relative w-full h-full bg-[#111] overflow-hidden cursor-crosshair select-none touch-none"
             onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onWheel={handleWheel}>
            
            <svg ref={store.svgRef} width={dim.w} height={dim.h} className="block overflow-visible" style={{ pointerEvents: 'none' }} version="1.1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 48 48">
                <g style={{ pointerEvents: 'all' }}>
                    {/* Hit Area for empty space */}
                    <rect x={-5000} y={-5000} width={10000} height={10000} fill="transparent" pointerEvents="all" />
                    
                    {renderGrid()}
                    {renderObjects('passive')}
                    {renderObjects('active')}
                    {renderWalls()}
                    {renderWallPreview()}
                </g>
            </svg>
        </div>
    );
}
