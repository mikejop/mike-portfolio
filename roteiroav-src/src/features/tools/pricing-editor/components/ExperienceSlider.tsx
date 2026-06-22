"use client"

import { usePricingStore } from "../store/usePricingStore";
import { experienceLabel } from "../data/marketData";
import { cn } from "@/lib/utils";

export function ExperienceSlider() {
    const { experienceLevel, setExperience } = usePricingStore();
    const label = experienceLabel(experienceLevel);

    const colorClass = experienceLevel < 5 ? "text-blue-400" : experienceLevel < 10 ? "text-emerald-400" : "text-amber-400";

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold tracking-widest uppercase text-muted-foreground">
                    Anos de Experiência
                </label>
                <div className={cn("text-sm font-bold", colorClass)}>
                    {experienceLevel >= 15 ? "15+" : experienceLevel} {experienceLevel === 1 ? "ano" : "anos"} — {label}
                </div>
            </div>

            <div className="space-y-2">
                <input
                    type="range"
                    min="0"
                    max="15"
                    step="1"
                    value={experienceLevel}
                    onChange={(e) => setExperience(parseInt(e.target.value))}
                    className="w-full accent-emerald-500 h-2 rounded-full cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-muted-foreground/50 uppercase tracking-wider font-medium">
                    <span>Iniciante (0)</span>
                    <span>Pleno (5)</span>
                    <span>Sênior (10)</span>
                    <span>Sênior (15+)</span>
                </div>
            </div>
        </div>
    );
}
