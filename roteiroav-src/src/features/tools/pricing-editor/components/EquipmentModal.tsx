"use client"

import { usePricingStore } from "../store/usePricingStore";
import { UserEquipment } from "../store/types";
import { PredefinedEquipment } from "../data/predefinedEquipments";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Camera, Plus, Trash2, DollarSign, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { EquipmentSearch } from "./EquipmentSearch";
import { useAppStore } from "@/store/useAppStore";

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

export function EquipmentModal() {
    const {
        userEquipments,
        equipmentChargePercent,
        usdRate,
        showEquipmentModal,
        setShowEquipmentModal,
        setUserEquipments,
        setEquipmentChargePercent,
        updateUsdRate
    } = usePricingStore();
    const { requestConfirm } = useAppStore();

    const [items, setItems] = useState<UserEquipment[]>(userEquipments);
    const [chargePercent, setChargePercent] = useState(equipmentChargePercent);

    // Form states for Manual Item
    const [showManualForm, setShowManualForm] = useState(false);
    const [manualName, setManualName] = useState("");
    const [manualCategory, setManualCategory] = useState("Lentes");
    const [manualPrice, setManualPrice] = useState("");
    const [manualCurrency, setManualCurrency] = useState<'BRL' | 'USD' | 'EUR'>('BRL');

    useEffect(() => {
        if (showEquipmentModal) {
            setItems(userEquipments);
            setChargePercent(equipmentChargePercent);
            updateUsdRate(); // Refresh USD rate when opening
        }
    }, [showEquipmentModal, userEquipments, equipmentChargePercent]);

    if (!showEquipmentModal) return null;

    const categories = Array.from(new Set(
        require("../data/predefinedEquipments").predefinedEquipments.map((e: any) => normalizeCategory(e.category))
    )).sort() as string[];

    const handleAddManualSubmit = () => {
        if (!manualName.trim()) {
            alert("Por favor, insira o nome do equipamento.");
            return;
        }

        const price = parseFloat(manualPrice) || 0;
        const newItem: UserEquipment = {
            id: `manual-${Date.now()}`,
            name: manualName,
            category: manualCategory,
            valueBRL: manualCurrency === 'BRL' ? price : 0,
            valueUSD: manualCurrency === 'USD' ? price : undefined,
            valueEUR: manualCurrency === 'EUR' ? price : undefined,
            currency: manualCurrency,
            selected: true,
            quantity: 1
        };

        setItems([...items, newItem]);

        // Reset and close form
        setManualName("");
        setManualPrice("");
        setManualCurrency('BRL');
        setShowManualForm(false);
    };

    const updateManualValue = (id: string, value: number, currency: 'BRL' | 'USD' | 'EUR') => {
        const updates: Partial<UserEquipment> = { currency };
        if (currency === 'BRL') updates.valueBRL = value;
        if (currency === 'USD') updates.valueUSD = value;
        if (currency === 'EUR') updates.valueEUR = value;
        updateItem(id, updates);
    };

    const addPredefined = (masterItem: PredefinedEquipment) => {
        const existing = items.find(i => i.predefinedId === masterItem.id);
        if (existing) {
            setItems(items.map(i => i.id === existing.id ? { ...i, quantity: (i.quantity || 1) + 1, selected: true } : i));
            return;
        }

        const newItem: UserEquipment = {
            id: `pre-${masterItem.id}-${Date.now()}`,
            name: masterItem.name,
            category: masterItem.category,
            valueBRL: masterItem.priceUSD * usdRate,
            valueUSD: masterItem.priceUSD,
            selected: true,
            quantity: 1,
            predefinedId: masterItem.id
        };
        setItems([...items, newItem]);
    };

    const clearAll = async () => {
        if (await requestConfirm("Limpar", "Tem certeza que deseja limpar toda a lista?")) {
            setItems([]);
        }
    };

    const removeItem = (id: string) => {
        setItems(items.filter(i => i.id !== id));
    };

    const updateItem = (id: string, updates: Partial<UserEquipment>) => {
        setItems(items.map(i => i.id === id ? { ...i, ...updates } : i));
    };

    const handleSave = () => {
        setUserEquipments(items);
        setEquipmentChargePercent(chargePercent);
        setShowEquipmentModal(false);
    };

    const calculateItemBRL = (item: UserEquipment) => {
        const qty = item.quantity || 1;
        if (item.predefinedId && item.valueUSD) return item.valueUSD * usdRate * 1.6 * qty;
        if (item.currency === 'USD' && item.valueUSD) return item.valueUSD * usdRate * qty;
        if (item.currency === 'EUR' && item.valueEUR) return item.valueEUR * (usePricingStore.getState().eurRate || 6) * qty;
        return item.valueBRL * qty;
    };

    const totalBRL = items.reduce((sum, item) => sum + calculateItemBRL(item), 0);

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center font-sans">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowEquipmentModal(false)} />

            <div className="relative bg-[#121212] border border-white/10 rounded-3xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col overflow-hidden text-white">
                {/* Header */}
                <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-600/10 to-transparent border-b border-white/5">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center border border-blue-400/30">
                            <Camera size={24} className="text-blue-400" />
                        </div>
                        <div>
                            <h2 className="font-bold text-xl tracking-tight">Meus Equipamentos</h2>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] font-black uppercase text-blue-400/70 tracking-widest bg-blue-400/10 px-1.5 py-0.5 rounded">Pricing Pro</span>
                                <p className="text-[11px] text-zinc-500">Gestão de inventário privado</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex gap-4">
                            <div className="flex flex-col items-end">
                                <span className="text-[9px] uppercase font-black text-zinc-500 tracking-tighter">Live Dollar</span>
                                <span className="text-xs font-mono font-bold text-emerald-400">R$ {usdRate.toFixed(2)}</span>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[9px] uppercase font-black text-zinc-500 tracking-tighter">Live Euro</span>
                                <span className="text-xs font-mono font-bold text-blue-300">R$ {(usePricingStore.getState().eurRate || 6).toFixed(2)}</span>
                            </div>
                        </div>
                        <button onClick={() => setShowEquipmentModal(false)} className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-xl transition-all border border-transparent hover:border-white/10 group">
                            <X size={20} className="text-zinc-400 group-hover:text-white" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="overflow-y-auto p-6 space-y-8 bg-[#0a0a0a]">
                    {/* Master Search / Dropdown */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                                Adicionar da Biblioteca
                            </label>
                            <span className="text-[10px] text-zinc-600 italic">*Os preços de aquisição são ocultados para manter sua privacidade</span>
                        </div>
                        <EquipmentSearch onSelect={addPredefined} usdRate={usdRate} />
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between sticky top-0 bg-[#0a0a0a] py-2 z-10">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 flex items-center gap-2">
                                <Plus size={12} /> Meu Inventário ({items.length})
                            </h3>
                            <div className="flex items-center gap-6">
                                <button
                                    onClick={clearAll}
                                    disabled={items.length === 0}
                                    className="text-[10px] font-black text-rose-500/60 hover:text-rose-400 flex items-center gap-1.5 uppercase transition-all disabled:opacity-20"
                                >
                                    <Trash2 size={12} /> Limpar
                                </button>
                                <button
                                    onClick={() => setShowManualForm(true)}
                                    disabled={showManualForm}
                                    className="px-4 py-1.5 rounded-full bg-blue-600/10 border border-blue-500/20 text-[10px] font-black text-blue-400 hover:bg-blue-600/20 transition-all uppercase flex items-center gap-2 disabled:opacity-50"
                                >
                                    <Plus size={14} /> + Item Manual
                                </button>
                            </div>
                        </div>

                        {showManualForm && (
                            <div className="p-4 rounded-2xl bg-[#1a1a1a] border border-blue-500/30 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-400">Adicionar Novo Equipamento Manual</h4>
                                    <button onClick={() => setShowManualForm(false)} className="text-zinc-500 hover:text-white transition-colors">
                                        <X size={14} />
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                                    <div className="md:col-span-5">
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter mb-1 block">Nome / Modelo</label>
                                        <Input
                                            placeholder="Ex: Lente 50mm f/1.8"
                                            value={manualName}
                                            onChange={(e) => setManualName(e.target.value)}
                                            className="h-10 text-xs bg-black/40 border-white/5 focus-visible:ring-blue-500/50"
                                        />
                                    </div>
                                    <div className="md:col-span-4">
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter mb-1 block">Categoria</label>
                                        <select
                                            value={manualCategory}
                                            onChange={(e) => setManualCategory(e.target.value)}
                                            className="w-full h-10 px-3 text-[10px] font-bold uppercase tracking-tighter bg-black/40 border border-white/5 rounded-lg focus:ring-1 focus:ring-blue-500/50 outline-none"
                                        >
                                            {categories.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="md:col-span-3">
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter mb-1 block">Moeda e Preço</label>
                                        <div className="flex items-center gap-1 bg-black/40 rounded-lg p-1 border border-white/5 h-10">
                                            <select
                                                value={manualCurrency}
                                                onChange={(e) => setManualCurrency(e.target.value as any)}
                                                className="h-full px-2 text-[10px] font-black bg-white/5 border border-white/10 rounded-md outline-none cursor-pointer hover:bg-white/10 text-blue-400 transition-colors"
                                            >
                                                <option value="BRL">R$</option>
                                                <option value="USD">$</option>
                                                <option value="EUR">€</option>
                                            </select>
                                            <Input
                                                type="number"
                                                placeholder="0.00"
                                                value={manualPrice}
                                                onChange={(e) => setManualPrice(e.target.value)}
                                                className="h-full w-full text-xs font-bold font-mono bg-transparent border-0 text-right pr-2 text-white placeholder:text-zinc-600 focus-visible:ring-0"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 flex justify-end">
                                    <Button onClick={handleAddManualSubmit} className="h-8 text-[10px] font-black uppercase tracking-wider bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-6">
                                        Adicionar à Lista
                                    </Button>
                                </div>
                            </div>
                        )}

                        <div className="space-y-8 pb-4">
                            {items.length === 0 ? (
                                <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-3xl bg-zinc-900/30">
                                    <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-4 border border-white/5">
                                        <Plus size={24} className="text-zinc-600" />
                                    </div>
                                    <p className="text-zinc-400 font-medium">Seu inventário está vazio</p>
                                    <p className="text-xs text-zinc-600 mt-1">Selecione itens da biblioteca ou adicione manualmente</p>
                                </div>
                            ) : (
                                Object.entries(items.reduce((acc, item) => {
                                    if (!acc[item.category]) acc[item.category] = [];
                                    acc[item.category].push(item);
                                    return acc;
                                }, {} as Record<string, UserEquipment[]>)).map(([category, categoryItems]) => (
                                    <div key={category} className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <div className="flex items-center gap-4">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600 whitespace-nowrap">{category}</span>
                                            <div className="h-px w-full bg-gradient-to-r from-white/10 to-transparent"></div>
                                        </div>
                                        <div className="grid gap-3">
                                            {categoryItems.map((item) => {
                                                const isPredefined = !!item.predefinedId;
                                                const currency = item.currency || 'BRL';
                                                const priceValue = currency === 'BRL' ? (item.valueBRL || 0) : (currency === 'USD' ? (item.valueUSD || 0) : (item.valueEUR || 0));

                                                return (
                                                    <div key={item.id} className="group relative flex flex-wrap md:flex-nowrap gap-4 items-center p-4 rounded-2xl bg-[#1a1a1a] border border-white/5 hover:border-white/15 transition-all">
                                                        {/* Name & Category */}
                                                        <div className="flex-1 min-w-[200px] flex flex-col gap-2">
                                                            {isPredefined ? (
                                                                <div className="flex flex-col">
                                                                    <span className="text-sm font-bold text-zinc-200">{item.name}</span>
                                                                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-tighter">Library Item</span>
                                                                </div>
                                                            ) : (
                                                                <div className="flex flex-col md:flex-row gap-2">
                                                                    <Input
                                                                        placeholder="Nome/Modelo"
                                                                        value={item.name}
                                                                        onChange={(e) => updateItem(item.id, { name: e.target.value })}
                                                                        className="h-10 text-xs bg-black/40 border-white/5 focus-visible:ring-blue-500/50"
                                                                    />
                                                                    <select
                                                                        value={item.category}
                                                                        onChange={(e) => updateItem(item.id, { category: e.target.value })}
                                                                        className="h-10 px-3 text-[10px] font-bold uppercase tracking-tighter bg-black/40 border border-white/5 rounded-lg focus:ring-1 focus:ring-blue-500/50 outline-none"
                                                                    >
                                                                        {categories.map(cat => (
                                                                            <option key={cat} value={cat}>{cat}</option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Price Input & Currency (Discreet for manual items) */}
                                                        {!isPredefined && (
                                                            <div className="flex items-center gap-1 bg-black/40 rounded-xl p-1 border border-white/5">
                                                                <Input
                                                                    type="number"
                                                                    placeholder="Preço"
                                                                    value={priceValue === 0 ? "" : priceValue}
                                                                    onChange={(e) => updateManualValue(item.id, parseFloat(e.target.value) || 0, currency)}
                                                                    className="h-8 w-16 text-[10px] font-bold font-mono bg-transparent border-0 text-center pr-1 text-zinc-500 focus:text-white"
                                                                />
                                                                <select
                                                                    value={currency}
                                                                    onChange={(e) => updateManualValue(item.id, priceValue, e.target.value as any)}
                                                                    className="h-8 px-1 text-[9px] font-black bg-white/5 border border-white/10 rounded-lg outline-none cursor-pointer hover:bg-white/10 transition-colors text-zinc-500"
                                                                >
                                                                    <option value="BRL">R$</option>
                                                                    <option value="USD">$</option>
                                                                    <option value="EUR">€</option>
                                                                </select>
                                                            </div>
                                                        )}

                                                        {/* Qty & Delete */}
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex items-center gap-1 bg-black/40 border border-white/5 rounded-xl p-1">
                                                                <button
                                                                    onClick={() => updateItem(item.id, { quantity: Math.max(1, (item.quantity || 1) - 1) })}
                                                                    className="w-7 h-7 flex items-center justify-center hover:bg-white/10 rounded-lg text-zinc-400"
                                                                >
                                                                    -
                                                                </button>
                                                                <span className="w-6 text-center text-[11px] font-black font-mono">{item.quantity}</span>
                                                                <button
                                                                    onClick={() => updateItem(item.id, { quantity: (item.quantity || 1) + 1 })}
                                                                    className="w-7 h-7 flex items-center justify-center hover:bg-white/10 rounded-lg text-zinc-400"
                                                                >
                                                                    +
                                                                </button>
                                                            </div>
                                                            <button
                                                                onClick={() => removeItem(item.id)}
                                                                className="w-9 h-9 flex items-center justify-center text-zinc-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Summary & Percentage */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-6 border-t border-white/5">
                        <div className="md:col-span-12">
                            <div className="p-6 bg-[#1a1a1a] rounded-3xl border border-emerald-500/10 relative overflow-hidden group max-w-md mx-auto">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-3xl -mr-12 -mt-12 group-hover:bg-emerald-500/10 transition-all"></div>
                                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block mb-3 italic underline decoration-emerald-400/30 underline-offset-4 text-center">Taxa de Locação p/ Job (%)</span>
                                <div className="flex items-center justify-center gap-6 relative z-10">
                                    <div className="relative w-32">
                                        <Input
                                            type="number"
                                            min="0"
                                            step="0.1"
                                            value={chargePercent}
                                            onChange={(e) => setChargePercent(parseFloat(e.target.value) || 0)}
                                            className="h-12 bg-black border-white/10 font-black text-xl text-center pr-8 focus-visible:ring-emerald-500"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-black text-emerald-400">%</span>
                                    </div>
                                    <div className="h-10 w-px bg-white/5"></div>
                                    <div className="flex flex-col">
                                        <div className="text-[10px] font-bold text-zinc-500 uppercase leading-tight">Valor da Diária</div>
                                        <div className="text-lg font-black text-emerald-400 font-mono">
                                            R$ {(totalBRL * chargePercent / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </div>
                                    </div>
                                </div>
                                <p className="text-[10px] text-zinc-600 mt-4 text-center italic">*A porcentagem é aplicada sobre o valor técnico dos itens.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-[#0a0a0a] border-t border-white/5 flex justify-between items-center">
                    <button
                        onClick={() => setShowEquipmentModal(false)}
                        className="text-xs font-black uppercase text-zinc-500 hover:text-zinc-200 transition-colors tracking-widest"
                    >
                        Descartar Alterações
                    </button>
                    <div className="flex gap-4">
                        <Button
                            onClick={handleSave}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-10 h-12 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
                        >
                            Salvar Inventário
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
