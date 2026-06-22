"use client"

import { usePricingStore } from "../store/usePricingStore";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

const units = [
    { id: "hora" as const, label: "Hora" },
    { id: "diaria" as const, label: "Diária" },
    { id: "semana" as const, label: "Semana" },
    { id: "mes" as const, label: "Mês" },
];

export function DurationSelector() {
    const { durationUnit, durationQty, setDurationUnit, setDurationQty } = usePricingStore();

    return (
        <div className="space-y-4">
            <label className="text-[11px] font-bold tracking-widest uppercase text-muted-foreground">
                Duração do Trabalho
            </label>

            <div className="flex gap-3">
                <div className="grid grid-cols-4 gap-1.5 flex-1">
                    {units.map(({ id, label }) => (
                        <button
                            key={id}
                            onClick={() => setDurationUnit(id)}
                            className={cn(
                                "px-2 py-2 rounded-lg border text-xs font-medium transition-all",
                                durationUnit === id
                                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                                    : "border-border hover:border-emerald-500/30 text-muted-foreground"
                            )}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                <div className="w-20">
                    <Input
                        type="number"
                        min="1"
                        value={durationQty}
                        onChange={(e) => setDurationQty(Math.max(1, parseInt(e.target.value) || 1))}
                        className="h-full text-center text-lg font-semibold"
                    />
                </div>
            </div>
        </div>
    );
}
