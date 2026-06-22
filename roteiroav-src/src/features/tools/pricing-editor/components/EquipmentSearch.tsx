"use client"

import { useState, useMemo, useEffect } from "react";
import { predefinedEquipments, PredefinedEquipment } from "../data/predefinedEquipments";
import { Input } from "@/components/ui/input";
import { Search, Plus, Sparkles, Zap, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { useContextualSearch } from "@/hooks/useContextualSearch";
import { SearchItem } from "@/lib/search/types";

interface EquipmentSearchProps {
    onSelect: (item: PredefinedEquipment) => void;
    usdRate: number;
}

export function EquipmentSearch({ onSelect, usdRate }: EquipmentSearchProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Map predefined equipments to SearchItems
    const searchItems = useMemo<SearchItem[]>(() => 
        predefinedEquipments.map(item => ({
            id: item.id,
            title: item.name,
            description: item.spec,
            category: item.category,
            tags: [item.name, item.category, item.spec],
            popularity: 50,
            createdAt: new Date()
        }))
    , []);

    const { query, results, suggestions, isLoading, search, setQuery } = useContextualSearch(searchItems, {
        debounceMs: 100,
        minChars: 2
    });

    const groupedResults = useMemo(() => {
        const categoryOrder = ["Câmera", "Luzes", "Lente", "Modificador de Luz", "Monitor", "Adaptador", "Cartão de Memória", "Armazenamento", "Áudio"];

        if (!query) {
            // Group and sort items alphabetically by name
            const groups: Record<string, any[]> = {};
            const sortedEquipments = [...predefinedEquipments].sort((a, b) => a.name.localeCompare(b.name));
            
            sortedEquipments.forEach(item => {
                if (!groups[item.category]) groups[item.category] = [];
                groups[item.category].push({
                    item: {
                        id: item.id,
                        title: item.name,
                        description: item.spec,
                        category: item.category,
                    },
                    originalItem: item,
                    highlights: { title: item.name }
                });
            });

            // Return groups sorted by categoryOrder
            const sortedGroups: Record<string, any[]> = {};
            categoryOrder.forEach(cat => {
                if (groups[cat]) {
                    sortedGroups[cat] = groups[cat];
                }
            });
            // Add any categories not in categoryOrder at the end
            Object.keys(groups).forEach(cat => {
                if (!categoryOrder.includes(cat)) {
                    sortedGroups[cat] = groups[cat];
                }
            });

            return sortedGroups;
        }

        const groups: Record<string, any[]> = {};
        results.forEach((res) => {
            const originalItem = predefinedEquipments.find(i => i.id === res.item.id);
            if (originalItem) {
                if (!groups[res.item.category]) groups[res.item.category] = [];
                groups[res.item.category].push({
                    ...res,
                    originalItem
                });
            }
        });

        // Sort match categories by order too
        const sortedMatchGroups: Record<string, any[]> = {};
        categoryOrder.forEach(cat => {
            if (groups[cat]) sortedMatchGroups[cat] = groups[cat];
        });
        Object.keys(groups).forEach(cat => {
            if (!categoryOrder.includes(cat)) sortedMatchGroups[cat] = groups[cat];
        });

        return sortedMatchGroups;
    }, [query, results]);

    const hasResults = Object.keys(groupedResults).length > 0;

    const getMatchIcon = (type: string) => {
        switch (type) {
            case 'exact': return <Target size={12} className="text-emerald-400" />;
            case 'fuzzy': return <Sparkles size={12} className="text-amber-400" />;
            case 'semantic': return <Zap size={12} className="text-blue-400" />;
            default: return null;
        }
    };

    return (
        <div className="relative w-full">
            <div className="relative group">
                <Search className={cn(
                    "absolute left-3 top-1/2 -translate-y-1/2 transition-colors",
                    isLoading ? "text-blue-500 animate-pulse" : "text-muted-foreground/50 group-focus-within:text-blue-500"
                )} size={16} />
                <Input
                    placeholder="Busque por nome, marca ou categoria... (ex: 'luzes colbor')"
                    value={query}
                    onChange={(e) => {
                        search(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    className="pl-10 h-10 transition-all rounded-xl cursor-pointer bg-muted/30 border-blue-500/10 focus:border-blue-500/50"
                />
                {isLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                    </div>
                )}
            </div>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-[100]"
                        onClick={() => {
                            setIsOpen(false);
                            setQuery("");
                        }}
                    />
                    <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl z-[101] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* Autocomplete Suggestions */}
                        {suggestions.length > 0 && query.length >= 2 && (
                            <div className="p-2 border-b border-white/5 bg-blue-500/5">
                                <div className="flex flex-wrap gap-2">
                                    {suggestions.map((s, i) => (
                                        <button
                                            key={i}
                                            onClick={() => search(s)}
                                            className="px-2 py-1 text-[10px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md transition-colors border border-white/5"
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="max-h-[350px] overflow-y-auto p-2 space-y-4">
                            {!hasResults && !isLoading ? (
                                <div className="p-8 text-center">
                                    <p className="text-sm text-zinc-500">Nenhum equipamento encontrado para "{query}".</p>
                                    <p className="text-[10px] text-zinc-700 uppercase font-black mt-1">Biblioteca Dojo</p>
                                </div>
                            ) : (
                                Object.entries(groupedResults).map(([category, items]) => (
                                    <div key={category} className="space-y-1">
                                        <div className="px-3 py-1 bg-zinc-900/50 rounded-lg flex justify-between items-center">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">{category}</span>
                                            {query && (
                                                <span className="text-[8px] text-zinc-600 font-bold">{items.length} MATCHES</span>
                                            )}
                                        </div>
                                        <div className="space-y-0.5">
                                            {items.map((res: any, idx) => (
                                                <button
                                                    key={`${res.item?.id || res.item.id}-${idx}`}
                                                    onClick={() => {
                                                        onSelect(res.originalItem || res.item);
                                                        setQuery("");
                                                        setIsOpen(false);
                                                    }}
                                                    className="w-full flex items-center justify-between p-3 hover:bg-blue-600/10 rounded-xl transition-all group text-left border border-transparent hover:border-blue-500/20"
                                                >
                                                    <div className="flex flex-col gap-0.5">
                                                        <div className="flex items-center gap-2">
                                                            <span 
                                                                className="text-sm font-bold text-zinc-200 group-hover:text-blue-400 transition-colors"
                                                                dangerouslySetInnerHTML={{ __html: res.highlights?.title || res.item.title }}
                                                            />
                                                            {res.matchType && (
                                                                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-zinc-900 rounded border border-white/5">
                                                                    {getMatchIcon(res.matchType)}
                                                                    <span className="text-[8px] text-zinc-500 font-black uppercase">{res.matchType}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <span className="text-[10px] text-zinc-500 font-medium" 
                                                            dangerouslySetInnerHTML={{ __html: `${res.highlights?.category || res.item.category || res.category} • ${res.highlights?.description || res.item.description || res.spec}` }}
                                                        />
                                                    </div>
                                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
                                                            <Plus size={16} className="text-white" />
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="p-3 border-t border-white/5 bg-black/20 flex justify-between items-center px-4">
                            <div className="flex items-center gap-4">
                                <span className="text-[10px] text-zinc-600 uppercase font-black tracking-widest">Dojo Library</span>
                                {query && (
                                    <div className="flex items-center gap-2 opacity-30 group-hover:opacity-100 transition-opacity">
                                        <span className="flex items-center gap-1 text-[8px] text-zinc-500"><Target size={8} /> Exato</span>
                                        <span className="flex items-center gap-1 text-[8px] text-zinc-500"><Sparkles size={8} /> Fuzzy</span>
                                        <span className="flex items-center gap-1 text-[8px] text-zinc-500"><Zap size={8} /> Semantic</span>
                                    </div>
                                )}
                            </div>
                            <span className="text-[9px] text-zinc-700 italic">Evoluindo seu fluxo</span>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
