"use client"

import { useBudgetStore } from "../store/useBudgetStore";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
    formatCPF,
    formatCNPJ,
    formatCEP,
    formatPhone,
    validateCPF,
    validateCNPJ
} from "../utils/budgetUtils";
import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, CheckCircle2, Loader2, Plus, X } from "lucide-react";

// Simple email regex
const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// ── Autocomplete Input Component ──
function AutocompleteInput({ suggestions, value, onChange, placeholder, className, onKeyDown }: {
    suggestions: string[];
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    className?: string;
    onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
}) {
    const [open, setOpen] = useState(false);
    const [focused, setFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

    const filtered = useMemo(() => {
        if (!value || value.length < 2) return [];
        const lower = value.toLowerCase();
        return suggestions.filter(s => s.toLowerCase().includes(lower) && s.toLowerCase() !== lower).slice(0, 6);
    }, [value, suggestions]);

    const showDropdown = focused && filtered.length > 0;

    useEffect(() => {
        if (showDropdown && inputRef.current) {
            const rect = inputRef.current.getBoundingClientRect();
            setPos({ top: rect.bottom + 2, left: rect.left, width: rect.width });
        }
    }, [showDropdown]);

    return (
        <>
            <Input
                ref={inputRef}
                placeholder={placeholder}
                value={value}
                onChange={(e) => { onChange(e.target.value); setOpen(true); }}
                onFocus={() => setFocused(true)}
                onBlur={() => setTimeout(() => setFocused(false), 150)}
                onKeyDown={onKeyDown}
                className={className}
            />
            {showDropdown && typeof document !== 'undefined' && createPortal(
                <div
                    style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width, zIndex: 99999 }}
                    className="bg-popover border rounded-lg shadow-xl py-1 max-h-[180px] overflow-y-auto"
                >
                    {filtered.map((s, i) => (
                        <button
                            key={i}
                            type="button"
                            className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent transition-colors truncate"
                            onMouseDown={(e) => { e.preventDefault(); onChange(s); setFocused(false); }}
                        >
                            {s}
                        </button>
                    ))}
                </div>,
                document.body
            )}
        </>
    );
}

export function BudgetForms() {
    const { prestador, cliente, projeto, updateField, savedBudgets } = useBudgetStore();
    const [loadingCEP, setLoadingCEP] = useState<string | null>(null);
    const [loadingCNPJ, setLoadingCNPJ] = useState<string | null>(null);
    const [emailErrors, setEmailErrors] = useState<Record<string, string | null>>({});

    // Defensive defaults for migrated fields
    const locais = Array.isArray(projeto.locais) ? projeto.locais : (projeto as any).local ? [(projeto as any).local] : [""];
    const refs = Array.isArray(projeto.refs) ? projeto.refs : (projeto as any).ref ? [(projeto as any).ref] : [""];

    // Autocomplete suggestions from saved budgets
    const nameSuggestions = useMemo(() => {
        const names = new Set<string>();
        savedBudgets.forEach(b => {
            if (b.prestador?.nome) names.add(b.prestador.nome);
            if (b.cliente?.nome) names.add(b.cliente.nome);
        });
        return Array.from(names);
    }, [savedBudgets]);

    const cnpjSuggestions = useMemo(() => {
        const docs = new Set<string>();
        savedBudgets.forEach(b => {
            if (b.prestador?.cnpj) docs.add(b.prestador.cnpj);
            if (b.cliente?.cnpj) docs.add(b.cliente.cnpj);
        });
        return Array.from(docs);
    }, [savedBudgets]);

    const handleUpdate = (section: 'prestador' | 'cliente' | 'projeto', field: string, value: any) => {
        updateField(section, field, value);
    };

    // ── CEP lookup ──
    const handleCEPChange = async (section: 'prestador' | 'cliente', value: string) => {
        const cleanCEP = value.replace(/\D/g, "");
        handleUpdate(section, 'cep', formatCEP(cleanCEP));

        if (cleanCEP.length === 8) {
            setLoadingCEP(section);
            try {
                const response = await fetch(`https://brasilapi.com.br/api/cep/v2/${cleanCEP}`);
                if (response.ok) {
                    const data = await response.json();
                    const address = `${data.street}, ${data.neighborhood}, ${data.city} – ${data.state}`;
                    handleUpdate(section, 'end', address);
                }
            } catch (error) {
                console.error("Failed to fetch CEP", error);
            } finally {
                setLoadingCEP(null);
            }
        }
    };

    // ── CNPJ/CPF formatting (on-type) ──
    const handleDocChange = (section: 'prestador' | 'cliente', value: string) => {
        const cleanValue = value.replace(/\D/g, "");
        if (cleanValue.length <= 11) {
            handleUpdate(section, 'cnpj', formatCPF(cleanValue));
        } else {
            handleUpdate(section, 'cnpj', formatCNPJ(cleanValue));
        }
    };

    // ── CNPJ/CPF lookup on Tab/Enter ──
    const handleDocKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>, section: 'prestador' | 'cliente') => {
        if (e.key !== 'Tab' && e.key !== 'Enter') return;

        const rawValue = (section === 'prestador' ? prestador.cnpj : cliente.cnpj);
        const cleanValue = rawValue.replace(/\D/g, "");

        // CNPJ — 14 digits → fetch from BrasilAPI
        if (cleanValue.length === 14 && validateCNPJ(cleanValue)) {
            e.preventDefault();
            setLoadingCNPJ(section);
            try {
                const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanValue}`);
                if (response.ok) {
                    const data = await response.json();
                    handleUpdate(section, 'nome', data.razao_social);
                    const address = `${data.logradouro}, ${data.numero}, ${data.bairro}, ${data.municipio} – ${data.uf}`;
                    handleUpdate(section, 'end', address);
                    if (data.cep) handleCEPChange(section, data.cep);
                }
            } catch (error) {
                console.error("Failed to fetch CNPJ", error);
            } finally {
                setLoadingCNPJ(null);
            }
        }

        // CPF — 11 digits, just validate (no API for CPF names)
        // For Cliente section: disable "Contato / Responsável" when it's a CPF
    };

    // ── Validation icon ──
    const renderValidation = (value: string) => {
        const clean = value.replace(/\D/g, "");
        if (!clean) return null;
        if (clean.length === 11) return validateCPF(clean) ? <CheckCircle2 className="text-green-500 w-4 h-4" /> : <AlertCircle className="text-destructive w-4 h-4" />;
        if (clean.length === 14) return validateCNPJ(clean) ? <CheckCircle2 className="text-green-500 w-4 h-4" /> : <AlertCircle className="text-destructive w-4 h-4" />;
        return null;
    };

    // ── Email validation ──
    const handleEmailBlur = (section: string, email: string) => {
        if (email && !isValidEmail(email)) {
            setEmailErrors(prev => ({ ...prev, [section]: "E-mail inválido. Por favor, insira um e-mail válido." }));
        } else {
            setEmailErrors(prev => ({ ...prev, [section]: null }));
        }
    };

    // ── Is CPF for cliente? Disable "Contato / Responsável" when CPF is used ──
    const isClienteCPF = (cliente.cnpj.replace(/\D/g, "")).length === 11 && validateCPF(cliente.cnpj.replace(/\D/g, ""));

    // ── Dynamic project fields ──
    const handleAddLocaisRef = () => {
        const newLocais = [...locais, ""];
        const newRefs = [...refs, ""];
        handleUpdate('projeto', 'locais', newLocais);
        handleUpdate('projeto', 'refs', newRefs);
    };

    const handleRemoveLocaisRef = (index: number) => {
        if (locais.length <= 1) return;
        const newLocais = locais.filter((_: string, i: number) => i !== index);
        const newRefs = refs.filter((_: string, i: number) => i !== index);
        handleUpdate('projeto', 'locais', newLocais);
        handleUpdate('projeto', 'refs', newRefs);
    };

    const handleLocaisChange = (index: number, value: string) => {
        const newLocais = [...locais];
        newLocais[index] = value;
        handleUpdate('projeto', 'locais', newLocais);
    };

    const handleRefsChange = (index: number, value: string) => {
        const newRefs = [...refs];
        newRefs[index] = value;
        handleUpdate('projeto', 'refs', newRefs);
    };

    return (
        <div className="space-y-8">
            {/* ─── PRESTADOR ─── */}
            <div>
                <div className="text-[11px] font-semibold tracking-widest uppercase text-primary mb-4 flex items-center gap-3">
                    01 — Dados do Prestador de Serviços
                    <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent"></div>
                </div>
                <Card className="bg-muted/10">
                    <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5 md:col-span-2">
                            <label className="text-[11px] font-medium tracking-wide uppercase text-muted-foreground flex items-center gap-2">
                                Razão Social / Nome *
                                {loadingCNPJ === 'prestador' && <Loader2 className="w-3 h-3 animate-spin" />}
                            </label>
                            <AutocompleteInput
                                suggestions={nameSuggestions}
                                placeholder="Nome da produtora ou profissional"
                                value={prestador.nome}
                                onChange={(val) => handleUpdate('prestador', 'nome', val)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-medium tracking-wide uppercase text-muted-foreground flex items-center justify-between">
                                CNPJ / CPF
                                {renderValidation(prestador.cnpj)}
                            </label>
                            <AutocompleteInput
                                suggestions={cnpjSuggestions}
                                placeholder="000.000.000-00"
                                value={prestador.cnpj}
                                onChange={(val) => handleDocChange('prestador', val)}
                                onKeyDown={(e) => handleDocKeyDown(e, 'prestador')}
                            />
                        </div>
                        <div className="space-y-1.5 md:col-span-2">
                            <label className="text-[11px] font-medium tracking-wide uppercase text-muted-foreground">Endereço</label>
                            <Input placeholder="Rua, número, bairro, cidade – UF" value={prestador.end} onChange={(e) => handleUpdate('prestador', 'end', e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-medium tracking-wide uppercase text-muted-foreground flex items-center gap-2">
                                CEP
                                {loadingCEP === 'prestador' && <Loader2 className="w-3 h-3 animate-spin" />}
                            </label>
                            <Input placeholder="00000-000" value={prestador.cep} onChange={(e) => handleCEPChange('prestador', e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-medium tracking-wide uppercase text-muted-foreground">Responsável / Contato</label>
                            <Input placeholder="Nome do responsável" value={prestador.resp} onChange={(e) => handleUpdate('prestador', 'resp', e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-medium tracking-wide uppercase text-muted-foreground">Telefone</label>
                            <div className="flex gap-2">
                                <select
                                    className="bg-muted/30 border rounded px-1 text-xs"
                                    value={prestador.telCountry}
                                    onChange={(e) => handleUpdate('prestador', 'telCountry', e.target.value)}
                                >
                                    <option value="BR">🇧🇷 +55</option>
                                    <option value="US">🇺🇸 +1</option>
                                    <option value="PT">🇵🇹 +351</option>
                                </select>
                                <Input className="flex-1" placeholder="(11) 99999-9999" value={prestador.tel} onChange={(e) => handleUpdate('prestador', 'tel', formatPhone(e.target.value))} />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-medium tracking-wide uppercase text-muted-foreground">E-mail</label>
                            <Input
                                type="email"
                                placeholder="contato@produtora.com.br"
                                value={prestador.email}
                                onChange={(e) => handleUpdate('prestador', 'email', e.target.value.replace(/[^a-zA-Z0-9@._+\-]/g, ""))}
                                onBlur={() => handleEmailBlur('prestador', prestador.email)}
                            />
                            {emailErrors['prestador'] && (
                                <p className="text-destructive text-[10px] flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3" /> {emailErrors['prestador']}</p>
                            )}
                        </div>
                        <div className="space-y-1.5 md:col-span-2">
                            <label className="text-[11px] font-medium tracking-wide uppercase text-muted-foreground">Site / Portfólio</label>
                            <Input placeholder="www.produtora.com.br" value={prestador.site} onChange={(e) => handleUpdate('prestador', 'site', e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-medium tracking-wide uppercase text-muted-foreground">Inscrição Municipal</label>
                            <Input placeholder="Número da IM" value={prestador.im} onChange={(e) => handleUpdate('prestador', 'im', e.target.value.replace(/\D/g, ""))} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ─── CLIENTE ─── */}
            <div>
                <div className="text-[11px] font-semibold tracking-widest uppercase text-primary mb-4 flex items-center gap-3">
                    02 — Dados do Cliente
                    <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent"></div>
                </div>
                <Card className="bg-muted/10">
                    <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5 md:col-span-2">
                            <label className="text-[11px] font-medium tracking-wide uppercase text-muted-foreground flex items-center gap-2">
                                Razão Social / Nome *
                                {loadingCNPJ === 'cliente' && <Loader2 className="w-3 h-3 animate-spin" />}
                            </label>
                            <AutocompleteInput
                                suggestions={nameSuggestions}
                                placeholder="Nome da empresa ou cliente"
                                value={cliente.nome}
                                onChange={(val) => handleUpdate('cliente', 'nome', val)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-medium tracking-wide uppercase text-muted-foreground flex items-center justify-between">
                                CNPJ / CPF
                                {renderValidation(cliente.cnpj)}
                            </label>
                            <AutocompleteInput
                                suggestions={cnpjSuggestions}
                                placeholder="000.000.000-00"
                                value={cliente.cnpj}
                                onChange={(val) => handleDocChange('cliente', val)}
                                onKeyDown={(e) => handleDocKeyDown(e, 'cliente')}
                            />
                        </div>
                        <div className="space-y-1.5 md:col-span-2">
                            <label className="text-[11px] font-medium tracking-wide uppercase text-muted-foreground">Endereço</label>
                            <Input placeholder="Rua, número, bairro, cidade – UF" value={cliente.end} onChange={(e) => handleUpdate('cliente', 'end', e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-medium tracking-wide uppercase text-muted-foreground flex items-center gap-2">
                                CEP
                                {loadingCEP === 'cliente' && <Loader2 className="w-3 h-3 animate-spin" />}
                            </label>
                            <Input placeholder="00000-000" value={cliente.cep} onChange={(e) => handleCEPChange('cliente', e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-medium tracking-wide uppercase text-muted-foreground flex items-center gap-1">
                                Contato / Responsável
                                {isClienteCPF && <span className="text-[9px] text-muted-foreground/50 ml-1">(Pessoa Física)</span>}
                            </label>
                            <Input
                                placeholder={isClienteCPF ? "Campo desativado para CPF" : "Nome do contato"}
                                value={cliente.resp}
                                onChange={(e) => handleUpdate('cliente', 'resp', e.target.value)}
                                disabled={isClienteCPF}
                                className={isClienteCPF ? "opacity-40 cursor-not-allowed" : ""}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-medium tracking-wide uppercase text-muted-foreground">Telefone</label>
                            <div className="flex gap-2">
                                <select
                                    className="bg-muted/30 border rounded px-1 text-xs"
                                    value={cliente.telCountry}
                                    onChange={(e) => handleUpdate('cliente', 'telCountry', e.target.value)}
                                >
                                    <option value="BR">🇧🇷 +55</option>
                                    <option value="US">🇺🇸 +1</option>
                                    <option value="PT">🇵🇹 +351</option>
                                </select>
                                <Input className="flex-1" placeholder="(11) 99999-9999" value={cliente.tel} onChange={(e) => handleUpdate('cliente', 'tel', formatPhone(e.target.value))} />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-medium tracking-wide uppercase text-muted-foreground">E-mail</label>
                            <Input
                                type="email"
                                placeholder="cliente@empresa.com.br"
                                value={cliente.email}
                                onChange={(e) => handleUpdate('cliente', 'email', e.target.value.replace(/[^a-zA-Z0-9@._+\-]/g, ""))}
                                onBlur={() => handleEmailBlur('cliente', cliente.email)}
                            />
                            {emailErrors['cliente'] && (
                                <p className="text-destructive text-[10px] flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3" /> {emailErrors['cliente']}</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ─── PROJETO ─── */}
            <div>
                <div className="text-[11px] font-semibold tracking-widest uppercase text-primary mb-4 flex items-center gap-3">
                    03 — Dados do Projeto
                    <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent"></div>
                </div>
                <Card className="bg-muted/10">
                    <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5 md:col-span-2">
                            <label className="text-[11px] font-medium tracking-wide uppercase text-muted-foreground">Título do Projeto *</label>
                            <Input placeholder="Nome do projeto" value={projeto.titulo} onChange={(e) => handleUpdate('projeto', 'titulo', e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-medium tracking-wide uppercase text-muted-foreground">Nome da Campanha</label>
                            <Input placeholder="Nome da campanha" value={projeto.camp} onChange={(e) => handleUpdate('projeto', 'camp', e.target.value)} />
                        </div>

                        <div className="space-y-1.5 md:col-span-3">
                            <label className="text-[11px] font-medium tracking-wide uppercase text-muted-foreground">Briefing / Descrição</label>
                            <Input placeholder="Objetivos, tom, referências visuais…" value={projeto.brief} onChange={(e) => handleUpdate('projeto', 'brief', e.target.value)} />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-medium tracking-wide uppercase text-muted-foreground">Data de Início</label>
                            <Input type="date" value={projeto.ini} onChange={(e) => handleUpdate('projeto', 'ini', e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-medium tracking-wide uppercase text-muted-foreground">Prazo de Entrega *</label>
                            <Input type="date" value={projeto.entr} onChange={(e) => handleUpdate('projeto', 'entr', e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-medium tracking-wide uppercase text-muted-foreground">Dias de Filmagem</label>
                            <Input type="number" min="0" placeholder="Ex: 3" value={projeto.dias} onChange={(e) => handleUpdate('projeto', 'dias', e.target.value)} />
                        </div>

                        {/* Dynamic Local / Referência pairs */}
                        {locais.map((loc: string, i: number) => (
                            <div key={i} className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                <div className="space-y-1.5 md:col-span-2">
                                    <label className="text-[11px] font-medium tracking-wide uppercase text-muted-foreground">
                                        {i === 0 ? "Local / Locação Principal" : `Local / Locação ${i + 1}`}
                                    </label>
                                    <Input placeholder="Cidade, estado ou país" value={loc} onChange={(e) => handleLocaisChange(i, e.target.value)} />
                                </div>
                                <div className="space-y-1.5 flex items-end gap-2">
                                    <div className="flex-1 space-y-1.5">
                                        <label className="text-[11px] font-medium tracking-wide uppercase text-muted-foreground">
                                            {i === 0 ? "Referência Criativa" : `Referência ${i + 1}`}
                                        </label>
                                        <Input placeholder="URL ou nome de referência" value={refs[i] || ""} onChange={(e) => handleRefsChange(i, e.target.value)} />
                                    </div>
                                    {i > 0 && (
                                        <button
                                            onClick={() => handleRemoveLocaisRef(i)}
                                            className="p-2 text-muted-foreground hover:text-destructive transition-colors mb-0.5"
                                            title="Remover"
                                        >
                                            <X size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}

                        <div className="md:col-span-3">
                            <button
                                onClick={handleAddLocaisRef}
                                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors py-1"
                            >
                                <Plus size={14} /> Adicionar Local / Referência
                            </button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
