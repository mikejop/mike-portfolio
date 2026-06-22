"use client";

import { Copy, FileText } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";

interface GhostScriptCardProps {
    titulo: string;
}

export function GhostScriptCard({ titulo }: GhostScriptCardProps) {
    const { isProjectSidebarOpen } = useAppStore();

    return (
        <div 
            className={cn(
                "relative bg-[#1a1a1a]/40 border border-amber-500/20 rounded-2xl p-3.5 sm:p-4.5 flex flex-col w-full shadow-lg overflow-hidden",
                isProjectSidebarOpen ? "aspect-[2/3]" : "aspect-[3/2]"
            )}
        >

            {/* Shimmer sweep overlay */}
            <div
                className="absolute inset-0 rounded-2xl pointer-events-none z-10"
                style={{
                    background: "linear-gradient(105deg, transparent 40%, rgba(245,158,11,0.04) 50%, transparent 60%)",
                    animation: "ghost-sweep 1.6s ease-in-out infinite",
                }}
            />

            {/* Amber tint */}
            <div className="absolute inset-0 bg-amber-500/[0.03] rounded-2xl pointer-events-none z-0" />

            {/* Header */}
            <div className="flex justify-between items-start mb-2 gap-2 relative z-20">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div className="bg-amber-500/15 p-2 rounded-xl shrink-0">
                        <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500/60" />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                        <h3 className={cn(
                            "text-white/50 font-bold leading-tight break-words",
                            isProjectSidebarOpen ? "text-base sm:text-lg md:text-xl" : "text-sm sm:text-base"
                        )}>
                            {titulo}
                        </h3>
                        <div className="flex mt-0.5">
                            <div className="px-1.5 py-0.5 rounded text-[7px] sm:text-[8px] font-black uppercase tracking-widest border bg-amber-500/10 border-amber-500/20 text-amber-500/60">
                                Duplicando...
                            </div>
                        </div>
                    </div>
                </div>
                <div className="p-1 rounded-lg text-amber-500/40">
                    <Copy size={12} className="animate-pulse" />
                </div>
            </div>

            {/* Content skeleton */}
            <div className="flex-1 min-h-0 flex flex-col justify-center gap-2 relative z-20">
                <div className="h-2 bg-white/5 rounded-full w-3/4 animate-pulse" />
                <div className="h-2 bg-white/5 rounded-full w-1/2 animate-pulse" />
            </div>

            {/* Stats skeleton */}
            <div className="grid grid-cols-3 gap-1.5 py-1.5 border-t border-b border-white/5 my-2 relative z-20">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex flex-col items-center justify-center p-1 bg-white/[0.01] rounded-lg gap-1">
                        <div className="h-3 w-5 bg-white/5 rounded animate-pulse" />
                        <div className="h-2 w-8 bg-white/5 rounded animate-pulse" />
                    </div>
                ))}
            </div>

            {/* Footer skeleton */}
            <div className="space-y-1.5 pt-2 border-t border-white/5 relative z-20">
                <div className="h-2 bg-white/5 rounded w-16 animate-pulse" />
                <div className="flex justify-between">
                    <div className="h-2 bg-white/5 rounded w-20 animate-pulse" />
                    <div className="h-2 bg-white/5 rounded w-16 animate-pulse" />
                </div>
            </div>

            {/* Progress bar at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/5 z-30 overflow-hidden rounded-b-2xl">
                <div
                    className="h-full bg-gradient-to-r from-transparent via-amber-500 to-transparent"
                    style={{
                        width: "50%",
                        animation: "delete-bar 1.4s ease-in-out infinite",
                    }}
                />
            </div>
        </div>
    );
}
