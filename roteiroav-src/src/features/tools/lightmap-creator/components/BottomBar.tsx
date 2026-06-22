"use client"

import { useLightMapStore } from "../store/useLightMapStore";
import { ZoomIn, ZoomOut, Maximize } from "lucide-react";

export function BottomBar() {
    const { viewport, setViewport, fitToScreen } = useLightMapStore();

    const handleZoom = (factor: number) => {
        setViewport(v => {
            const newZoom = Math.max(0.1, Math.min(10, v.zoom * factor));
            return { ...v, zoom: newZoom };
        });
    };

    return (
        <div className="h-10 shrink-0 bg-[var(--macos-bg)] border-t border-white/5 flex items-center justify-center px-4 gap-2 z-50 shadow-sm relative">
            <MenuBtn icon={ZoomOut} onClick={() => handleZoom(0.8)} title="Zoom Out (-)" />
            <input 
                type="range" 
                min="0.1" 
                max="10" 
                step="0.05" 
                value={viewport.zoom}
                onChange={(e) => setViewport({ ...viewport, zoom: parseFloat(e.target.value) })}
                className="w-48 mx-4 accent-[var(--macos-selected)] cursor-pointer"
                title={`Zoom: ${Math.round(viewport.zoom * 100)}%`}
            />
            <MenuBtn icon={ZoomIn} onClick={() => handleZoom(1.2)} title="Zoom In (+)" />
            
            <div className="w-px h-5 bg-white/10 mx-2" />
            
            <MenuBtn icon={Maximize} onClick={fitToScreen} title="Fit Selection/All (F)" />
        </div>
    );
}

function MenuBtn({ icon: Icon, active, disabled, onClick, title }: any) {
    return (
        <button 
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200
                ${disabled ? 'opacity-20 cursor-not-allowed' : ''}
                ${active ? 'bg-[var(--macos-selected)] text-white shadow-lg shadow-blue-500/20' : 'text-[var(--macos-text-secondary)] hover:text-white hover:bg-white/5'}
            `}
        >
            <Icon className="w-4 h-4" />
        </button>
    );
}
