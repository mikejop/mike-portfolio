"use client"

import { useBudgetStore } from "../store/useBudgetStore";
import { Input } from "@/components/ui/input";

export function BudgetHeader() {
    const meta = useBudgetStore((state) => state.meta);
    const updateField = useBudgetStore((state) => state.updateField);

    return (
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
            <div>
                <div className="text-2xl font-light text-muted-foreground mb-1">
                    ORÇAMENTO <span className="font-medium text-foreground">#{meta.num || "—"}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                    {meta.data ? new Date(meta.data + "T12:00:00").toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : "Carregando data…"}
                </div>
            </div>

            <div className="flex flex-wrap gap-4">
                <div className="space-y-1.5 w-[160px]">
                    <label className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground flex">
                        Nº Orçamento
                    </label>
                    <Input
                        value={meta.num}
                        readOnly
                        className="bg-muted/30 cursor-default opacity-70"
                        title="Gerado automaticamente"
                    />
                </div>
                <div className="space-y-1.5 w-[150px]">
                    <label className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground flex">
                        Data
                    </label>
                    <Input
                        type="date"
                        value={meta.data}
                        readOnly
                        className="bg-muted/30 cursor-default opacity-70"
                        title="Data obtida automaticamente da internet"
                    />
                </div>
                <div className="space-y-1.5 w-[130px]">
                    <label className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground flex">
                        Validade (dias)
                    </label>
                    <Input
                        type="number"
                        min="1"
                        value={meta.validade}
                        onChange={(e) => updateField("meta", "validade", e.target.value)}
                        className="bg-muted/30"
                    />
                </div>
            </div>
        </div>
    );
}
