"use client"

import { usePricingStore } from "../store/usePricingStore";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Receipt, Percent, BadgeDollarSign } from "lucide-react";

export function ResultPanel() {
    const {
        result,
        impostoPercent,
        descontoPercent,
        setImpostoPercent,
        setDescontoPercent,
        durationQty
    } = usePricingStore();

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    return (
        <div className="space-y-6">
            {/* Result */}
            {result ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Imposto & Desconto */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground flex items-center gap-1.5">
                                <Receipt size={12} /> Imposto
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={impostoPercent}
                                    onChange={(e) => setImpostoPercent(parseFloat(e.target.value) || 0)}
                                    className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 pr-7"
                                />
                                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground flex items-center gap-1.5">
                                <Percent size={12} /> Desconto
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={descontoPercent}
                                    onChange={(e) => setDescontoPercent(parseFloat(e.target.value) || 0)}
                                    className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 pr-7"
                                />
                                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                            </div>
                        </div>
                    </div>

                    {/* Main value */}
                    <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/15 to-emerald-600/5 border border-emerald-500/20 text-center">
                        <div className="text-xs text-emerald-400/70 font-medium uppercase tracking-wider mb-1">Valor Sugerido</div>
                        <div className="text-4xl font-black text-emerald-400 tabular-nums">
                            {formatCurrency(result.valorFinal)}
                        </div>
                    </div>

                    {/* Breakdown */}
                    <div className="space-y-2 p-4 rounded-xl bg-muted/10 border">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Mão de Obra</span>
                            <span className="font-medium">{formatCurrency(result.valorMercado)}</span>
                        </div>
                        {result.equipamentoTotal > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Equipamentos</span>
                                <span className="font-medium text-blue-400">{formatCurrency(result.equipamentoTotal)}</span>
                            </div>
                        )}

                        <div className="border-t border-border/50 my-2"></div>

                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span className="font-medium">{formatCurrency(result.subtotal)}</span>
                        </div>
                        {result.desconto > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground text-[11px] uppercase font-bold">Desconto (-{descontoPercent}%)</span>
                                <span className="text-emerald-400 font-medium">-{formatCurrency(result.desconto)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Divulgação</span>
                            <span className="font-medium text-blue-400">+{formatCurrency(result.valorDivulgacao)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Reinvestimento</span>
                            <span className="font-medium text-amber-400">+{formatCurrency(result.valorInvestimento)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Lucro</span>
                            <span className="font-medium text-emerald-400">+{formatCurrency(result.lucroMarkup)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground text-[11px] uppercase font-bold">Imposto (+{impostoPercent}%)</span>
                            <span className="font-medium text-red-400">+{formatCurrency(result.imposto)}</span>
                        </div>

                        <div className="border-t border-border my-2"></div>

                        <div className="flex justify-between text-base font-black uppercase tracking-tight">
                            <span>Total</span>
                            <span className="text-emerald-400">{formatCurrency(result.valorFinal)}</span>
                        </div>
                        {/* Profit breakdown */}
                        <div className="grid grid-cols-1 gap-3">
                            <div className="p-4 rounded-xl bg-muted/5 border border-dashed space-y-4">
                                <h4 className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Resumo de Lucratividade</h4>
                                <div className="grid grid-cols-3 gap-y-4 gap-x-2">
                                    <div className="space-y-0.5 border-t border-border/10 pt-3 col-span-1">
                                        <div className="flex items-center gap-1">
                                            <p className="text-[8px] font-black text-muted-foreground uppercase opacity-60">Lucro Bruto</p>
                                            <div className="p-0.5 rounded-full bg-muted flex items-center justify-center group relative cursor-help">
                                                <span className="text-[6px] font-bold text-muted-foreground">?</span>
                                                <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-popover text-[8px] rounded border invisible group-hover:visible shadow-xl z-50 text-left">
                                                    Diferença entre Valor de Mercado e Custos do Job (Equipamentos, Divulgação, Reinvestimento, Impostos). Inclui seu salário pessoal.
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-xs font-bold text-foreground/80">{formatCurrency(result.lucroBruto)}</p>
                                    </div>

                                    <div className="space-y-0.5 border-t border-border/10 pt-3 col-span-1">
                                        <div className="flex items-center gap-1 text-emerald-500">
                                            <p className="text-[8px] font-black uppercase opacity-60">Lucro Real</p>
                                            <div className="p-0.5 rounded-full bg-muted flex items-center justify-center group relative cursor-help">
                                                <span className="text-[6px] font-bold text-muted-foreground">?</span>
                                                <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-popover text-[8px] rounded border invisible group-hover:visible shadow-xl z-50 text-left">
                                                    O que realmente sobra para você após pagar seu custo diário (salário).
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-xs font-bold text-emerald-500">{formatCurrency(result.lucroReal)}</p>
                                    </div>
                                    <div className="border-t border-border/10 pt-3 col-span-1 flex flex-col items-start gap-1">
                                        <div className="flex items-center gap-1">
                                            <p className="text-[8px] font-black text-muted-foreground uppercase opacity-60">Margem Líq.</p>
                                            <div className="p-0.5 rounded-full bg-muted flex items-center justify-center group relative cursor-help">
                                                <span className="text-[6px] font-bold text-muted-foreground">?</span>
                                                <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-popover text-[8px] rounded border invisible group-hover:visible shadow-xl z-50 text-left">
                                                    (Lucro Líquido) ÷ Total × 100
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-xs font-bold text-foreground/80">{result.margemLucro.toFixed(2)}%</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="py-32 text-center space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-muted/20 flex items-center justify-center mx-auto">
                        <BadgeDollarSign size={32} className="text-muted-foreground/20" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Aguardando Profissional</p>
                        <p className="text-[11px] text-muted-foreground/40 max-w-[200px] mx-auto">
                            O cálculo será habilitado assim que você selecionar o tipo de profissional no formulário ao lado.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

