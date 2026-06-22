"use client";

import { Plus } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";

interface NewScriptCardProps {
    onClick: () => void;
}

export function NewScriptCard({ onClick }: NewScriptCardProps) {
    const { isProjectSidebarOpen } = useAppStore();

    return (
        <button 
            onClick={onClick}
            className={cn(
                "group relative bg-[#1a1a1a]/40 border border-white/5 border-dashed rounded-2xl p-5 hover:bg-[#222222]/60 hover:border-amber-500/30 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center w-full shadow-lg hover:shadow-2xl hover:-translate-y-1",
                isProjectSidebarOpen ? "aspect-[2/3]" : "aspect-[3/2]"
            )}
        >
            <div className="bg-white/5 p-4 rounded-2xl group-hover:bg-amber-500/20 group-hover:scale-110 transition-all duration-300 mb-4 border border-white/5">
                <Plus className="w-8 h-8 text-white/10 group-hover:text-amber-500 transition-colors" />
            </div>
            <div className="text-center">
                <span className="text-white/20 group-hover:text-amber-500 font-black uppercase tracking-[0.2em] text-[10px] transition-colors">
                    Novo Roteiro
                </span>
            </div>
        </button>
    );
}
