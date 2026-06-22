"use client"

import { usePricingStore } from "../store/usePricingStore";
import { cn } from "@/lib/utils";
import { Video, Star, CalendarDays, PartyPopper, Globe, Heart, Clapperboard } from "lucide-react";

const jobTypes = [
    { id: "publicidade" as const, label: "Publicidade", icon: Star },
    { id: "conteudos-web" as const, label: "Conteúdos para Web", icon: Globe },
    { id: "casamentos" as const, label: "Casamentos", icon: Heart },
    { id: "eventos" as const, label: "Eventos", icon: PartyPopper },
];

export function ProfessionSelector() {
    const { professionType, jobType, setProfession, setJobType } = usePricingStore();

    return (
        <div className="space-y-4">
            <label className="text-[11px] font-bold tracking-widest uppercase text-muted-foreground">
                Tipo de Profissional
            </label>

            <div className="grid grid-cols-3 gap-3">
                {([
                    { id: "videomaker", label: "Videomaker", icon: Video, disabled: false },
                    { id: "especialista", label: "Especialista", icon: Clapperboard, disabled: true },
                    { id: "fee-mensal", label: "Fee Mensal", icon: CalendarDays, disabled: true },
                ] as const).map(({ id, label, icon: Icon, disabled }) => (
                    <button
                        key={id}
                        onClick={() => !disabled && setProfession(id)}
                        disabled={disabled}
                        title={disabled ? "Disponível em breve" : undefined}
                        className={cn(
                            "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all text-sm font-medium relative group",
                            professionType === id
                                ? "border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-lg shadow-emerald-500/10"
                                : "border-border hover:border-emerald-500/40 text-muted-foreground hover:text-foreground",
                            disabled && "opacity-40 grayscale-[0.8] cursor-not-allowed hover:border-border hover:text-muted-foreground"
                        )}
                    >
                        <Icon size={22} />
                        {label}
                        {disabled && (
                            <div className="absolute -top-2 px-1.5 py-0.5 rounded-md bg-zinc-800 text-[8px] font-bold text-zinc-400 border border-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                                BREVE
                            </div>
                        )}
                    </button>
                ))}
            </div>

            {professionType === "videomaker" && (
                <div className="space-y-2 pt-2">
                    <label className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground/70">
                        Tipo de Trabalho
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {jobTypes.map(({ id, label, icon: Icon }) => (
                            <button
                                key={id}
                                onClick={() => setJobType(id)}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-medium transition-all",
                                    jobType === id
                                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                                        : "border-border hover:border-emerald-500/30 text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Icon size={14} />
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
