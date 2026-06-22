"use client"

import { usePricingStore } from "../store/usePricingStore";
import { cn } from "@/lib/utils";
import { Tv, Globe, Heart, Calendar } from "lucide-react";
import { VideomakerJobType } from "../store/types";

export function JobTypeSelector() {
    const { jobType, setJobType } = usePricingStore();

    const types = [
        { id: "publicidade" as VideomakerJobType, label: "Publicidade", icon: <Tv size={18} /> },
        { id: "conteudos-web" as VideomakerJobType, label: "Conteúdo Web", icon: <Globe size={18} /> },
        { id: "casamentos" as VideomakerJobType, label: "Casamentos", icon: <Heart size={18} />, disabled: true },
        { id: "eventos" as VideomakerJobType, label: "Eventos", icon: <Calendar size={18} />, disabled: true },
    ];

    return (
        <div className="space-y-4">
            <h3 className="text-sm font-bold tracking-widest uppercase text-muted-foreground flex items-center gap-2">
                Qual o tipo de Trabalho?
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {types.map((type) => (
                    <div key={type.id} className="relative group">
                        <button
                            onClick={() => !type.disabled && setJobType(type.id)}
                            disabled={type.disabled}
                            className={cn(
                                "w-full flex flex-col items-center gap-3 p-4 rounded-xl border transition-all relative overflow-hidden",
                                jobType === type.id
                                    ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400 ring-2 ring-emerald-500/20"
                                    : type.disabled
                                        ? "bg-muted/5 border-border/50 text-muted-foreground/30 cursor-not-allowed opacity-60"
                                        : "bg-muted/20 border-border hover:border-border/80 text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <div className={cn(
                                "p-2.5 rounded-lg transition-colors",
                                jobType === type.id ? "bg-emerald-500/20" : "bg-muted/30"
                            )}>
                                {type.icon}
                            </div>
                            <span className="text-xs font-semibold tracking-tight">{type.label}</span>

                            {type.disabled && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="bg-white text-black text-[10px] font-black px-2 py-1 rounded uppercase tracking-tighter">
                                        Breve
                                    </span>
                                </div>
                            )}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
