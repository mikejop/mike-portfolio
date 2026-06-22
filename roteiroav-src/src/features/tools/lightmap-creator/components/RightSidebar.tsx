"use client"

import { useState, useEffect } from "react";
import { useLightMapStore } from "../store/useLightMapStore";
import { Layers, Settings2, X } from "lucide-react";
import { ExplorerView } from "./ExplorerPanel";
import { PropertiesView } from "./PropertiesPanel";

export function RightSidebar() {
    const { selection } = useLightMapStore();
    const [activeTab, setActiveTab] = useState<'explorer' | 'props' | null>(null);

    // Auto-open properties when something is selected
    useEffect(() => {
        if (selection.length > 0) {
            setActiveTab('props');
        }
    }, [selection]);

    const isExpanded = activeTab !== null;

    return (
        <div className="flex h-full z-40 bg-[var(--macos-bg)] border-l border-white/5">
            {/* Content Area */}
            <div className={`flex flex-col bg-[var(--macos-sidebar)] overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'w-[300px]' : 'w-0'}`}>
                {isExpanded && (
                    <>
                        <div className="h-12 border-b border-white/5 flex items-center justify-between px-4 shrink-0">
                            <span className="font-bold text-[10px] uppercase tracking-[0.2em] text-[var(--macos-selected)] flex items-center gap-2">
                                {activeTab === 'explorer' ? <Layers className="w-3.5 h-3.5" /> : <Settings2 className="w-3.5 h-3.5" />}
                                {activeTab === 'explorer' ? 'Explorer' : 'Properties'}
                            </span>
                            <button 
                                onClick={() => setActiveTab(null)}
                                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/5 text-[var(--macos-text-secondary)] hover:text-white transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar overflow-x-hidden">
                            {activeTab === 'explorer' && <ExplorerView />}
                            {activeTab === 'props' && <div className="p-4"><PropertiesView /></div>}
                        </div>
                    </>
                )}
            </div>

            {/* Vertical Tab Bar */}
            <div className="w-12 h-full bg-[var(--macos-sidebar)] border-l border-white/5 shadow-[-10px_0_20px_rgba(0,0,0,0.5)] flex flex-col items-center py-4 gap-4 z-50">
                <button 
                    onClick={() => setActiveTab(activeTab === 'explorer' ? null : 'explorer')}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${activeTab === 'explorer' ? 'bg-[var(--macos-selected)] text-white shadow-[0_0_15px_rgba(31,111,235,0.4)]' : 'hover:bg-white/10 text-[var(--macos-text-secondary)] hover:text-white'}`}
                    title="Toggle Explorer"
                >
                    <Layers className="w-4 h-4" />
                </button>
                <button 
                    onClick={() => setActiveTab(activeTab === 'props' ? null : 'props')}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${activeTab === 'props' ? 'bg-[var(--macos-selected)] text-white shadow-[0_0_15px_rgba(31,111,235,0.4)]' : 'hover:bg-white/10 text-[var(--macos-text-secondary)] hover:text-white'}`}
                    title="Toggle Properties"
                >
                    <Settings2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
