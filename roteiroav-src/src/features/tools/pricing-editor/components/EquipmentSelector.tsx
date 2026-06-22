"use client"

import { usePricingStore } from "../store/usePricingStore";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const normalizeCategory = (cat: string) => {
    const c = cat.toLowerCase().trim();
    if (c.includes("cam")) return "Câmeras";
    if (c.includes("lent")) return "Lentes";
    if (c.includes("filtr")) return "Filtros";
    if (c.includes("micr")) return "Microfones";
    if (c.includes("monit") || c.includes("acess")) return "Acessórios & Monitores";
    if (c.includes("dron")) return "Drones";
    if (c.includes("trip") || c.includes("gimb")) return "Tripés & Gimbals";
    if (c.includes("luz") || c.includes("ilum")) return "Iluminação";
    if (c.includes("arma") || c.includes("stor") || c.includes("cart") || c.includes("sd")) return "Armazenamento";
    return cat;
};

export function EquipmentSelector() {
    const {
        userEquipments,
        toggleUserEquipment,
        equipmentChargePercent,
        usdRate,
        eurRate
    } = usePricingStore();

    const hasUserEquipments = userEquipments.length > 0;

    // RULE: If there is nothing in the user's equipment list, nothing appears in the Equipment session.
    if (!hasUserEquipments) {
        return null;
    }

    const groupedEquipments = userEquipments.reduce((acc, item) => {
        const normalized = normalizeCategory(item.category);
        if (!acc[normalized]) acc[normalized] = [];
        acc[normalized].push(item);
        return acc;
    }, {} as Record<string, typeof userEquipments>);

    // Sort categories and items within them
    const sortedCategories = Object.keys(groupedEquipments).sort();

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between">
                <div className="flex flex-col">
                    <label className="text-[11px] font-bold tracking-widest uppercase text-muted-foreground">
                        Meus Equipamentos
                    </label>
                    <p className="text-[9px] text-muted-foreground/60 font-medium">Selecione os itens para este job</p>
                </div>
            </div>

            <div className="space-y-6">
                {sortedCategories.map((category) => {
                    const items = groupedEquipments[category].sort((a, b) => a.name.localeCompare(b.name));

                    return (
                        <div key={category} className="space-y-3">
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">{category}</span>
                                <div className="h-px flex-1 bg-border/40" />
                            </div>

                            <div className="grid grid-cols-1 gap-2">
                                {items.map((item) => {
                                    const isSelected = item.selected;
                                    const itemBRL = item.predefinedId && item.valueUSD ? (item.valueUSD * usdRate * 1.6) : (item.valueUSD ? (item.valueUSD * usdRate) : (item.valueEUR ? item.valueEUR * (eurRate || 6) : item.valueBRL));
                                    const dailyPrice = itemBRL * (equipmentChargePercent / 100) * (item.quantity || 1);

                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => toggleUserEquipment(item.id)}
                                            className={cn(
                                                "flex items-center gap-3 p-3 rounded-xl border transition-all group",
                                                isSelected
                                                    ? "bg-emerald-500/10 border-emerald-500/50 text-foreground"
                                                    : "bg-muted/5 text-muted-foreground border-transparent border-dashed hover:border-border/50 hover:bg-muted/10"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors",
                                                isSelected ? "bg-emerald-500 border-emerald-500 shadow-sm" : "border-border group-hover:border-muted-foreground/20"
                                            )}>
                                                {isSelected && <Check size={12} className="text-white" />}
                                            </div>
                                            <div className="flex-1 text-left min-w-0">
                                                <p className="text-sm font-semibold leading-tight truncate">{item.name || "Item sem nome"}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[9px] font-bold font-mono opacity-60">Qtd: {item.quantity || 1}</span>
                                                    {item.valueUSD && (
                                                        <div className="w-1 h-1 rounded-full bg-blue-400/40" />
                                                    )}
                                                    {item.valueUSD && (
                                                        <span className="text-[8px] font-bold text-blue-400/50 uppercase tracking-tighter">Biblioteca</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className={cn(
                                                    "text-xs font-mono font-black",
                                                    isSelected ? "text-emerald-400" : "text-emerald-400/30"
                                                )}>
                                                    + R$ {dailyPrice.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}/d
                                                </p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
