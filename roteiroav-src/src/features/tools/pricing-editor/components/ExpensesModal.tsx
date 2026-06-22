"use client"

import { usePricingStore } from "../store/usePricingStore";
import { UserExpenses, defaultExpenses } from "../store/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { X, Wallet } from "lucide-react";
import { useState, useEffect } from "react";

const fields: { key: Exclude<keyof UserExpenses, 'softwares' | 'impostoPercent' | 'lucroPercent' | 'investimentoPercent' | 'divulgacaoPercent'>; label: string }[] = [
    { key: "aluguel", label: "Aluguel" },
    { key: "alimentacao", label: "Alimentação" },
    { key: "transporte", label: "Transporte" },
    { key: "lazer", label: "Lazer" },
    { key: "internet", label: "Internet" },
    { key: "agua", label: "Água" },
    { key: "luz", label: "Luz" },
    { key: "telefone", label: "Telefone" },
    { key: "saude", label: "Saúde" },
];

const percentFields: { key: 'impostoPercent' | 'lucroPercent' | 'investimentoPercent' | 'divulgacaoPercent'; label: string }[] = [
    { key: "impostoPercent", label: "Imposto (%)" },
    { key: "lucroPercent", label: "Lucro (%)" },
    { key: "investimentoPercent", label: "Reinvestimento (%)" },
    { key: "divulgacaoPercent", label: "Divulgação (%)" },
];

export function ExpensesModal() {
    const { expenses, showExpensesModal, setExpenses, setShowExpensesModal } = usePricingStore();
    const [draft, setDraft] = useState<UserExpenses>(expenses);

    useEffect(() => {
        if (showExpensesModal) setDraft(expenses);
    }, [showExpensesModal]);

    if (!showExpensesModal) return null;

    const handleChange = (key: keyof UserExpenses, value: string) => {
        setDraft({ ...draft, [key]: parseFloat(value) || 0 });
    };

    const handleSave = () => {
        setExpenses(draft);
        setShowExpensesModal(false);
    };

    const softwareTotal = (draft.softwares || []).reduce((sum, s) => sum + s.monthlyCost, 0);
    const total = fields.reduce((sum, f) => sum + (draft[f.key] as number), 0) + softwareTotal;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowExpensesModal(false)} />

            {/* Modal */}
            <div className="relative bg-card border rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[85vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                            <Wallet size={18} className="text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-base">Minhas Despesas</h2>
                            <p className="text-[11px] text-muted-foreground">Custos pessoais mensais</p>
                        </div>
                    </div>
                    <button onClick={() => setShowExpensesModal(false)} className="p-2 hover:bg-muted rounded-lg transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto p-5 space-y-5">
                    {/* Expense fields */}
                    <div className="grid grid-cols-2 gap-3">
                        {fields.map(({ key, label }) => (
                            <div key={key} className="space-y-1">
                                <label className="text-[10px] font-medium tracking-wide uppercase text-muted-foreground">{label}</label>
                                <div className="relative">
                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">R$</span>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={(draft[key] as number) || ""}
                                        onChange={(e) => handleChange(key, e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Total */}
                    <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border border-dashed">
                        <span className="text-xs font-medium text-muted-foreground">Custo Mensal</span>
                        <span className="text-lg font-bold text-emerald-400">
                            R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </div>

                    {/* Percentage fields */}
                    <div className="grid grid-cols-4 gap-2">
                        {percentFields.map(({ key, label }) => (
                            <div key={key} className="space-y-1">
                                <label className="text-[9px] font-bold tracking-tight uppercase text-muted-foreground/70">{label}</label>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={draft[key] as number || ""}
                                        onChange={(e) => handleChange(key, e.target.value)}
                                        className="h-8 px-2 text-xs pr-6"
                                    />
                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">%</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Softwares Section */}
                    <div className="space-y-3 pt-2 border-t border-dashed">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Softwares & Assinaturas</label>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDraft({
                                    ...draft,
                                    softwares: [...(draft.softwares || []), { id: Date.now().toString(), name: "", monthlyCost: 0 }]
                                })}
                                className="h-6 text-[9px] font-bold uppercase bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                            >
                                + Adicionar
                            </Button>
                        </div>

                        <div className="space-y-2">
                            {(draft.softwares || []).length === 0 ? (
                                <p className="text-[10px] text-muted-foreground/50 italic text-center py-2">Nenhum software adicionado</p>
                            ) : (
                                draft.softwares.map((sw, index) => (
                                    <div key={sw.id} className="flex items-center gap-2">
                                        <Input
                                            placeholder="Nome do software"
                                            value={sw.name}
                                            onChange={(e) => {
                                                const newSws = [...draft.softwares];
                                                newSws[index].name = e.target.value;
                                                setDraft({ ...draft, softwares: newSws });
                                            }}
                                            className="h-8 text-xs flex-1"
                                        />
                                        <div className="relative w-24">
                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">R$</span>
                                            <Input
                                                type="number"
                                                placeholder="0,00"
                                                value={sw.monthlyCost || ""}
                                                onChange={(e) => {
                                                    const newSws = [...draft.softwares];
                                                    newSws[index].monthlyCost = parseFloat(e.target.value) || 0;
                                                    setDraft({ ...draft, softwares: newSws });
                                                }}
                                                className="h-8 text-xs pl-7"
                                            />
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setDraft({
                                                    ...draft,
                                                    softwares: draft.softwares.filter((_, i) => i !== index)
                                                });
                                            }}
                                            className="h-8 w-8 p-0 text-muted-foreground/40 hover:text-destructive"
                                        >
                                            <X size={14} />
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Installments Section */}
                    <div className="space-y-3 pt-4 border-t border-dashed">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Parcelas & Financiamentos</label>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDraft({
                                    ...draft,
                                    installments: [...(draft.installments || []), {
                                        id: Date.now().toString(),
                                        description: "",
                                        value: 0,
                                        totalInstallments: 12,
                                        startMonth: new Date().getMonth() + 1,
                                        startYear: new Date().getFullYear()
                                    }]
                                })}
                                className="h-6 text-[9px] font-bold uppercase bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
                            >
                                + Adicionar Parcela
                            </Button>
                        </div>

                        <div className="space-y-3">
                            {(draft.installments || []).length === 0 ? (
                                <p className="text-[10px] text-muted-foreground/50 italic text-center py-2">Nenhuma parcela cadastrada</p>
                            ) : (
                                draft.installments.map((inst, index) => {
                                    const now = new Date();
                                    const currM = now.getMonth() + 1;
                                    const currY = now.getFullYear();
                                    const monthsDiff = (currY - inst.startYear) * 12 + (currM - inst.startMonth);
                                    const isActive = monthsDiff >= 0 && monthsDiff < inst.totalInstallments;
                                    const currentInstallment = monthsDiff >= 0 ? Math.min(monthsDiff + 1, inst.totalInstallments) : 0;

                                    return (
                                        <div key={inst.id} className="p-3 rounded-xl bg-muted/20 border border-border/50 space-y-3">
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    placeholder="Descrição (ex: Mac Studio)"
                                                    value={inst.description}
                                                    onChange={(e) => {
                                                        const newInst = [...draft.installments];
                                                        newInst[index].description = e.target.value;
                                                        setDraft({ ...draft, installments: newInst });
                                                    }}
                                                    className="h-8 text-xs flex-1"
                                                />
                                                <div className={cn(
                                                    "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter shrink-0",
                                                    isActive ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/10 text-red-400"
                                                )}>
                                                    {isActive ? `Ativa (${currentInstallment}/${inst.totalInstallments})` : "Finalizada"}
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setDraft({
                                                            ...draft,
                                                            installments: draft.installments.filter((_, i) => i !== index)
                                                        });
                                                    }}
                                                    className="h-8 w-8 p-0 text-muted-foreground/40 hover:text-destructive shrink-0"
                                                >
                                                    <X size={14} />
                                                </Button>
                                            </div>

                                            <div className="grid grid-cols-4 gap-2">
                                                <div className="space-y-0.5">
                                                    <label className="text-[7px] font-black text-muted-foreground/50 uppercase">Valor Parcela</label>
                                                    <div className="relative">
                                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">R$</span>
                                                        <Input
                                                            type="number"
                                                            value={inst.value || ""}
                                                            onChange={(e) => {
                                                                const newInst = [...draft.installments];
                                                                newInst[index].value = parseFloat(e.target.value) || 0;
                                                                setDraft({ ...draft, installments: newInst });
                                                            }}
                                                            className="h-7 text-[10px] pl-6 pr-1"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-0.5">
                                                    <label className="text-[7px] font-black text-muted-foreground/50 uppercase">Total Parc.</label>
                                                    <Input
                                                        type="number"
                                                        value={inst.totalInstallments || ""}
                                                        onChange={(e) => {
                                                            const newInst = [...draft.installments];
                                                            newInst[index].totalInstallments = parseInt(e.target.value) || 0;
                                                            setDraft({ ...draft, installments: newInst });
                                                        }}
                                                        className="h-7 text-[10px] px-2"
                                                    />
                                                </div>
                                                <div className="space-y-0.5">
                                                    <label className="text-[7px] font-black text-muted-foreground/50 uppercase">Mês Início</label>
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        max="12"
                                                        value={inst.startMonth || ""}
                                                        onChange={(e) => {
                                                            const newInst = [...draft.installments];
                                                            newInst[index].startMonth = parseInt(e.target.value) || 0;
                                                            setDraft({ ...draft, installments: newInst });
                                                        }}
                                                        className="h-7 text-[10px] px-2"
                                                    />
                                                </div>
                                                <div className="space-y-0.5">
                                                    <label className="text-[7px] font-black text-muted-foreground/50 uppercase">Ano Início</label>
                                                    <Input
                                                        type="number"
                                                        value={inst.startYear || ""}
                                                        onChange={(e) => {
                                                            const newInst = [...draft.installments];
                                                            newInst[index].startYear = parseInt(e.target.value) || 0;
                                                            setDraft({ ...draft, installments: newInst });
                                                        }}
                                                        className="h-7 text-[10px] px-2"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-5 border-t flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setShowExpensesModal(false)}>Cancelar</Button>
                    <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-500 text-white">
                        Salvar Despesas
                    </Button>
                </div>
            </div>
        </div>
    );
}
