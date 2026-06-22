"use client"

import { useBudgetStore } from "../store/useBudgetStore";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function BudgetSummary() {
    const { itens, financeiro, updateField } = useBudgetStore();

    const getSectionTotal = (section: keyof typeof itens) => {
        return itens[section].reduce((acc, item) => acc + (item.total || 0), 0);
    };

    const subtotal = getSectionTotal("pre") + getSectionTotal("live") + getSectionTotal("pos") + getSectionTotal("3d") + getSectionTotal("desp");
    const discountPct = parseFloat(financeiro.descPct) || 0;
    const discountVal = subtotal * (discountPct / 100);
    const baseCalc = subtotal - discountVal;
    const issPct = parseFloat(financeiro.issPct) || 0;
    const iss = baseCalc * (issPct / 100);
    const totalGeral = baseCalc + iss;

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                <div className="bg-muted/10 border rounded-lg p-3 text-center">
                    <div className="text-[10px] tracking-widest uppercase text-muted-foreground mb-1">Pré-Produção</div>
                    <div className="font-semibold text-lg">{formatCurrency(getSectionTotal("pre"))}</div>
                </div>
                <div className="bg-muted/10 border rounded-lg p-3 text-center">
                    <div className="text-[10px] tracking-widest uppercase text-muted-foreground mb-1">Live Action</div>
                    <div className="font-semibold text-lg">{formatCurrency(getSectionTotal("live"))}</div>
                </div>
                <div className="bg-muted/10 border rounded-lg p-3 text-center">
                    <div className="text-[10px] tracking-widest uppercase text-muted-foreground mb-1">Pós-Produção</div>
                    <div className="font-semibold text-lg">{formatCurrency(getSectionTotal("pos"))}</div>
                </div>
                <div className="bg-muted/10 border rounded-lg p-3 text-center">
                    <div className="text-[10px] tracking-widest uppercase text-muted-foreground mb-1">3D / CGI</div>
                    <div className="font-semibold text-lg">{formatCurrency(getSectionTotal("3d"))}</div>
                </div>
                <div className="bg-muted/10 border rounded-lg p-3 text-center">
                    <div className="text-[10px] tracking-widest uppercase text-muted-foreground mb-1">Despesas G.</div>
                    <div className="font-semibold text-lg">{formatCurrency(getSectionTotal("desp"))}</div>
                </div>
            </div>

            <div className="text-[11px] font-semibold tracking-widest uppercase text-primary mb-4 flex items-center gap-3">
                05 — Cálculo Final
                <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent"></div>
            </div>

            <Card className="bg-muted/10">
                <CardContent className="p-0">
                    <div className="flex justify-between items-center p-4 border-b">
                        <span className="text-sm text-muted-foreground">Subtotal de Serviços</span>
                        <span className="font-semibold text-foreground">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 border-b">
                        <span className="text-sm text-muted-foreground flex items-center gap-2">
                            Desconto
                            <div className="flex items-center gap-1 border rounded-md px-2 bg-background">
                                <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    className="w-12 h-7 border-none p-0 text-right focus-visible:ring-0 shadow-none bg-transparent"
                                    value={financeiro.descPct}
                                    onChange={(e) => updateField('financeiro', 'descPct', e.target.value)}
                                />
                                <span className="text-xs text-muted-foreground">%</span>
                            </div>
                        </span>
                        <span className="font-semibold text-destructive">- {formatCurrency(discountVal)}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 border-b">
                        <span className="text-sm text-muted-foreground">Base de Cálculo (após desconto)</span>
                        <span className="font-semibold text-foreground">{formatCurrency(baseCalc)}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 border-b">
                        <span className="text-sm text-muted-foreground flex items-center gap-2">
                            ISS — Imposto Sobre Serviços
                            <div className="flex items-center gap-1 border border-primary/20 rounded-md px-2 bg-primary/5">
                                <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    className="w-10 h-6 border-none p-0 text-center font-medium text-[10px] text-primary focus-visible:ring-0 shadow-none bg-transparent"
                                    value={financeiro.issPct}
                                    onChange={(e) => updateField('financeiro', 'issPct', e.target.value)}
                                />
                                <span className="text-[10px] text-primary font-medium">%</span>
                            </div>
                        </span>
                        <span className="font-semibold text-foreground">{formatCurrency(iss)}</span>
                    </div>
                    <div className="flex justify-between items-center p-6 bg-primary/5">
                        <span className="text-base font-medium">TOTAL GERAL DO ORÇAMENTO</span>
                        <span className="text-3xl font-bold" style={{ color: "#e8b84b" }}>{formatCurrency(totalGeral)}</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
