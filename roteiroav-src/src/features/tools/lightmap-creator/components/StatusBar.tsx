"use client"

import { useLightMapStore } from "../store/useLightMapStore";

export function StatusBar() {
    const { objects, walls, viewport, selection, snapEnabled } = useLightMapStore();

    return (
        <div className="h-7 shrink-0 bg-[var(--macos-bg)] border-t border-white/5 flex items-center px-4 gap-6 text-[10px] text-[var(--macos-text-secondary)] font-mono z-20 uppercase tracking-tight">
            <div className="flex items-center gap-1.5 hover:text-white transition-colors cursor-default">
                <span className="opacity-50">Zoom:</span>
                <span className="font-bold text-[var(--macos-text)]">{Math.round(viewport.zoom * 100)}%</span>
            </div>
            
            <div className="w-px h-3 bg-white/5" />
            
            <div>
                {selection.length > 0 
                    ? `Selected: ${selection.length} item${selection.length > 1 ? 's' : ''}`
                    : 'No selection'}
            </div>
            
            <div className="w-px h-3 bg-[#2a2d38]" />
            
            <div>
                Objects: {objects.length + walls.length}
            </div>
            
            <div className="w-px h-3 bg-[#2a2d38]" />
            
            <div>
                Snap: <span className={snapEnabled ? "text-emerald-400" : ""}>{snapEnabled ? 'ON' : 'OFF'}</span>
            </div>
        </div>
    );
}
