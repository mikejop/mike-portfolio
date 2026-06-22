"use client"

import { useBudgetStore } from "../store/useBudgetStore";
import { BudgetSectionKey } from "../store/types";
import { budgetCategories } from "../utils/categories";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X, ChevronDown, ChevronRight, Search } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

const SECTION_UNIT_OPTIONS: Record<string, string[]> = {
    pre: [
        "Hora", "Diária", "Semana", "Projeto", "Reunião",
        "Roteiro", "Página", "Pacote"
    ],
    live: [
        "Hora", "Meio período", "Diária", "Diária estendida", "Semana",
        "Cachê", "Diária de equipamento", "Cena", "Locação", "Km"
    ],
    pos: [
        "Hora", "Diária", "Vídeo", "Corte / Versão", "Segundo",
        "Episódio", "Trilha", "Faixa / Track", "Vinheta", "Locução",
        "Palavra", "Foto", "Arte / Peça"
    ],
    "3d": [
        "Hora", "Diária", "Segundo animado", "Cena 3D", "Asset / Elemento",
        "Loop", "Frame", "Ilustração", "Pacote"
    ],
    desp: [
        "Hora", "Diária", "Km", "Diária de deslocamento", "Diária de equipamento",
        "Cachê", "Licença", "Uso", "Semana", "Mês", "Pacote", "Projeto"
    ]
};

interface BudgetTableProps {
    sectionKey: BudgetSectionKey;
    title: string;
    themeColor: string;
    themeBg: string;
}

// ── Portal-based Dropdown (renders at body level, unaffected by overflow) ──
function PortalDropdown({
    anchorRef,
    open,
    children,
    width = 280,
}: {
    anchorRef: React.RefObject<HTMLElement | null>;
    open: boolean;
    children: React.ReactNode;
    width?: number;
}) {
    const [pos, setPos] = useState({ top: 0, left: 0 });

    useEffect(() => {
        if (open && anchorRef.current) {
            const rect = anchorRef.current.getBoundingClientRect();
            setPos({ top: rect.bottom + 4, left: rect.left });
        }
    }, [open, anchorRef]);

    if (!open || typeof document === "undefined") return null;

    return createPortal(
        <div
            style={{ position: "fixed", top: pos.top, left: pos.left, width, zIndex: 99999 }}
            className="bg-popover border rounded-lg shadow-2xl"
        >
            {children}
        </div>,
        document.body
    );
}

// ── Category Combobox ──
function CategoryCombobox({
    sectionKey,
    value,
    onChange,
}: {
    sectionKey: BudgetSectionKey;
    value: string;
    onChange: (val: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const btnRef = useRef<HTMLButtonElement>(null);

    const categories = budgetCategories[sectionKey] || [];

    const filtered = categories.map(group => ({
        ...group,
        items: group.items.filter(item => item.toLowerCase().includes(search.toLowerCase())),
    })).filter(group => group.items.length > 0);

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            const target = e.target as Node;
            if (btnRef.current?.contains(target)) return;
            // Check if click is inside the portal dropdown
            const portal = document.querySelector('[data-cat-dropdown]');
            if (portal?.contains(target)) return;
            setOpen(false);
            setSearch("");
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    return (
        <>
            <button
                ref={btnRef}
                type="button"
                onClick={() => setOpen(!open)}
                className={cn(
                    "h-8 w-full text-left px-2 text-sm rounded-md border border-transparent hover:border-border focus:bg-background bg-transparent truncate",
                    !value && "text-muted-foreground"
                )}
            >
                {value || "Categoria"}
            </button>

            <PortalDropdown anchorRef={btnRef} open={open} width={280}>
                <div data-cat-dropdown="" className="flex flex-col max-h-[320px]">
                    {/* Search field */}
                    <div className="p-2 border-b flex items-center gap-2 shrink-0">
                        <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <input
                            autoFocus
                            type="text"
                            placeholder="Buscar categoria…"
                            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    {/* List */}
                    <div className="overflow-y-auto flex-1 py-1">
                        {filtered.length === 0 && (
                            <div className="px-3 py-4 text-xs text-muted-foreground text-center">Nenhum resultado</div>
                        )}

                        {filtered.map(group => (
                            <div key={group.group}>
                                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 sticky top-0 bg-popover">
                                    {group.group}
                                </div>
                                {group.items.map(item => (
                                    <button
                                        key={item}
                                        type="button"
                                        className={cn(
                                            "w-full text-left px-3 py-1.5 text-sm hover:bg-accent transition-colors",
                                            value === item && "bg-accent font-medium"
                                        )}
                                        onClick={() => {
                                            onChange(item);
                                            setOpen(false);
                                            setSearch("");
                                        }}
                                    >
                                        {item}
                                    </button>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </PortalDropdown>
        </>
    );
}

// ── Unit Dropdown ──
function UnitDropdown({ value, onChange, sectionKey }: { value: string; onChange: (val: string) => void; sectionKey: string }) {
    const [open, setOpen] = useState(false);
    const btnRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            const target = e.target as Node;
            if (btnRef.current?.contains(target)) return;
            const portal = document.querySelector('[data-unit-dropdown]');
            if (portal?.contains(target)) return;
            setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    return (
        <>
            <button
                ref={btnRef}
                type="button"
                onClick={() => setOpen(!open)}
                className={cn(
                    "h-8 w-full text-left px-2 text-sm rounded-md border border-transparent hover:border-border focus:bg-background bg-transparent truncate",
                    !value && "text-muted-foreground"
                )}
            >
                {value || "Un."}
            </button>

            <PortalDropdown anchorRef={btnRef} open={open} width={180}>
                <div data-unit-dropdown="" className="py-1 overflow-y-auto">
                    {(SECTION_UNIT_OPTIONS[sectionKey] || []).map((opt: string) => (
                        <button
                            key={opt}
                            type="button"
                            className={cn(
                                "w-full text-left px-3 py-1.5 text-sm hover:bg-accent transition-colors",
                                value === opt && "bg-accent font-medium"
                            )}
                            onClick={() => {
                                onChange(opt);
                                setOpen(false);
                            }}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            </PortalDropdown>
        </>
    );
}

// ── Main Table ──
export function BudgetTable({ sectionKey, title, themeColor, themeBg }: BudgetTableProps) {
    const [collapsed, setCollapsed] = useState(false);
    const items = useBudgetStore((state) => state.itens[sectionKey]);
    const { addItem, updateItem, removeItem } = useBudgetStore();

    const total = items.reduce((acc, item) => acc + (item.total || 0), 0);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    return (
        <div className="border rounded-lg bg-card mb-6 shadow-sm">
            <div
                className={cn("p-4 flex items-center justify-between cursor-pointer select-none rounded-t-lg", themeBg)}
                onClick={() => setCollapsed(!collapsed)}
            >
                <div className="flex items-center gap-3 font-semibold text-base">
                    <div className="w-7 h-7 rounded-sm flex items-center justify-center font-bold" style={{ backgroundColor: `${themeColor}20`, color: themeColor }}>
                        ✦
                    </div>
                    {title}
                </div>
                <div className="flex items-center gap-4">
                    <span className="font-semibold" style={{ color: themeColor }}>
                        {formatCurrency(total)}
                    </span>
                    {collapsed ? <ChevronRight className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
            </div>

            {!collapsed && (
                <div className="border-t">
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow>
                                <TableHead className="w-[35%] uppercase text-[10px] tracking-wider font-semibold">Descrição do Serviço</TableHead>
                                <TableHead className="w-[15%] uppercase text-[10px] tracking-wider font-semibold">Categoria</TableHead>
                                <TableHead className="w-[10%] uppercase text-[10px] tracking-wider font-semibold">Unidade</TableHead>
                                <TableHead className="w-[10%] uppercase text-[10px] tracking-wider font-semibold">Qtd</TableHead>
                                <TableHead className="w-[15%] uppercase text-[10px] tracking-wider font-semibold text-right">Valor Unit. (R$)</TableHead>
                                <TableHead className="w-[15%] uppercase text-[10px] tracking-wider font-semibold text-right">Total (R$)</TableHead>
                                <TableHead className="w-10"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((item, index) => (
                                <TableRow key={item.id || `row-${index}`} className="group">
                                    <TableCell className="p-2">
                                        <Input
                                            placeholder="Descreva o item…"
                                            className="h-8 bg-transparent border-transparent hover:border-border focus:bg-background"
                                            value={item.desc}
                                            onChange={(e) => updateItem(sectionKey, item.id, 'desc', e.target.value)}
                                        />
                                    </TableCell>
                                    <TableCell className="p-2">
                                        <CategoryCombobox
                                            sectionKey={sectionKey}
                                            value={item.cat}
                                            onChange={(val) => updateItem(sectionKey, item.id, 'cat', val)}
                                        />
                                    </TableCell>
                                    <TableCell className="p-2">
                                        <UnitDropdown
                                            value={item.unit}
                                            onChange={(val) => updateItem(sectionKey, item.id, 'unit', val)}
                                            sectionKey={sectionKey}
                                        />
                                    </TableCell>
                                    <TableCell className="p-2">
                                        <Input
                                            type="number"
                                            min="0"
                                            className="h-8 bg-transparent border-transparent hover:border-border focus:bg-background text-right"
                                            value={item.qty}
                                            onChange={(e) => updateItem(sectionKey, item.id, 'qty', parseFloat(e.target.value) || 0)}
                                        />
                                    </TableCell>
                                    <TableCell className="p-2">
                                        <Input
                                            type="number"
                                            min="0"
                                            className="h-8 bg-transparent border-transparent hover:border-border focus:bg-background text-right"
                                            value={item.val || ''}
                                            onChange={(e) => updateItem(sectionKey, item.id, 'val', parseFloat(e.target.value) || 0)}
                                        />
                                    </TableCell>
                                    <TableCell className="p-2 text-right font-semibold whitespace-nowrap" style={{ color: themeColor }}>
                                        {formatCurrency(item.total || 0)}
                                    </TableCell>
                                    <TableCell className="p-2 text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => removeItem(sectionKey, item.id)}
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    <div className="p-3 bg-muted/10 border-t">
                        <Button
                            variant="outline"
                            className="w-full border-dashed text-muted-foreground hover:text-foreground hover:border-primary/50"
                            onClick={() => addItem(sectionKey)}
                        >
                            <Plus className="w-4 h-4 mr-2" /> Adicionar item
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
