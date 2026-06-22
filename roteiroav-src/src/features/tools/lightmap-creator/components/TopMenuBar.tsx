"use client"

import { useState, useEffect, useRef } from "react";
import { useLightMapStore } from "../store/useLightMapStore";
import { CATALOG, generateId } from "../utils/catalog";
import { 
    Trash2, Undo2, Redo2, 
    Save, Upload, FileDown, Video
} from "lucide-react";

export function TopMenuBar() {
    const { 
        projectName, setProjectName, 
        undo, redo, undoStack, redoStack,
    deleteSelected, clearBoard, svgRef,
    canvasDimensions
  } = useLightMapStore();
    
    const [confirmClear, setConfirmClear] = useState(false);
    const [exportOpen, setExportOpen] = useState(false);
    const exportRef = useRef<HTMLDivElement>(null);

    // Export logic
    const exportImage = async (format: string) => {
        const svg = svgRef.current;
        if (!svg) return;

        // 1. Create a clone to fix styles if needed
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();

        canvas.width = canvasDimensions.w;
        canvas.height = canvasDimensions.h;

        const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(svgBlob);

        img.onload = () => {
            if (!ctx) return;
            // Background color
            ctx.fillStyle = "#111";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            
            let mimeType = "image/png";
            let extension = "png";
            
            if (format === 'jpg') { mimeType = "image/jpeg"; extension = "jpg"; }
            if (format === 'webp') { mimeType = "image/webp"; extension = "webp"; }
            if (format === 'tiff') { mimeType = "image/tiff"; extension = "tiff"; } // Browser might fallback to PNG if tiff is not supported

            const dataUrl = canvas.toDataURL(mimeType, 1.0);
            const link = document.createElement("a");
            link.download = `${projectName || 'scene'}.${extension}`;
            link.href = dataUrl;
            link.click();
            URL.revokeObjectURL(url);
            setExportOpen(false);
        };
        img.src = url;
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
                setExportOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleClear = () => {
        clearBoard();
        setConfirmClear(false);
    };
    
    return (
        <>
            {/* Confirmation Dialog */}
            {confirmClear && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-[var(--macos-sidebar)] border border-white/10 rounded-2xl p-6 shadow-2xl w-80 animate-in fade-in zoom-in-95 duration-200">
                        <h3 className="text-base font-bold text-white mb-2">Limpar o Board?</h3>
                        <p className="text-sm text-[var(--macos-text-secondary)] mb-6">
                            Todos os objetos, paredes e câmeras serão removidos permanentemente. Esta ação não pode ser desfeita.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmClear(false)}
                                className="flex-1 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-semibold transition-all border border-white/5"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleClear}
                                className="flex-1 h-9 rounded-xl bg-red-500/80 hover:bg-red-500 text-white text-sm font-semibold transition-all shadow-lg shadow-red-500/20"
                            >
                                Sim, Limpar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="h-12 shrink-0 bg-[var(--macos-bg)] border-b border-white/5 flex items-center px-4 gap-2 z-50 shadow-sm">
                <div className="flex items-center gap-2 mr-4">
                    <Video className="w-5 h-5 text-[var(--macos-selected)]" />
                    <input 
                        type="text" 
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        className="bg-transparent border border-transparent hover:border-white/5 focus:border-[var(--macos-selected)]/50 focus:bg-black/20 rounded-lg px-2 py-1 text-sm font-semibold outline-none w-32 md:w-48 transition-all"
                        spellCheck={false}
                    />
                </div>

                <div className="w-px h-6 bg-white/5 mx-1" />

                {/* Actions */}
                <MenuBtn icon={Trash2} onClick={deleteSelected} title="Delete (Del)" />

                <div className="w-px h-6 bg-white/5 mx-1" />

                {/* History */}
                <MenuBtn icon={Undo2} disabled={undoStack.length === 0} onClick={undo} title="Undo (Ctrl+Z)" />
                <MenuBtn icon={Redo2} disabled={redoStack.length === 0} onClick={redo} title="Redo (Ctrl+Y)" />

                <div className="flex-1" />

                {/* File Actions */}
                <div className="flex items-center gap-1">
                    <TextBtn icon={Trash2} onClick={() => setConfirmClear(true)} variant="danger">Clear</TextBtn>
                    <TextBtn icon={Save} onClick={() => console.log('Save coming soon!')}>Save</TextBtn>
                    <TextBtn icon={Upload} onClick={() => console.log('Import coming soon!')}>Import</TextBtn>
                    
                    <div className="relative" ref={exportRef}>
                        <TextBtn icon={FileDown} onClick={() => setExportOpen(!exportOpen)}>Export</TextBtn>
                        {exportOpen && (
                            <div className="absolute top-full right-0 mt-2 w-32 bg-[var(--macos-sidebar)] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                                {['png', 'jpg', 'webp', 'tiff'].map(fmt => (
                                    <button
                                        key={fmt}
                                        onClick={() => exportImage(fmt)}
                                        className="w-full h-9 px-4 text-xs font-semibold text-[var(--macos-text-secondary)] hover:text-white hover:bg-white/5 text-left uppercase transition-all"
                                    >
                                        {fmt}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

function MenuBtn({ icon: Icon, active, disabled, onClick, title }: any) {
    return (
        <button 
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200
                ${disabled ? 'opacity-20 cursor-not-allowed' : ''}
                ${active ? 'bg-[var(--macos-selected)] text-white shadow-lg shadow-blue-500/20' : 'text-[var(--macos-text-secondary)] hover:text-white hover:bg-white/5'}
            `}
        >
            <Icon className="w-4 h-4" />
        </button>
    );
}

function TextBtn({ icon: Icon, children, onClick, variant }: any) {
    const isDanger = variant === 'danger';
    return (
        <button 
            onClick={onClick}
            className={`h-8 px-3 rounded-lg flex items-center gap-2 text-xs font-semibold transition-all active:scale-95
                ${isDanger 
                    ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10' 
                    : 'text-[var(--macos-text-secondary)] hover:text-white hover:bg-white/5'}
            `}
        >
            <Icon className="w-3.5 h-3.5" />
            {children}
        </button>
    );
}

