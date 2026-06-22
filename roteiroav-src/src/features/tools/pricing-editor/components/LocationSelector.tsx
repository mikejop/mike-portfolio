"use client"

import { useState, useMemo, useEffect, useRef } from "react";
import { usePricingStore } from "../store/usePricingStore";
import { brazilianStates } from "../data/marketData";
import { cn } from "@/lib/utils";
import { Building2, TreePine, Search, ChevronDown, Check } from "lucide-react";
import { Input } from "@/components/ui/input";

export function LocationSelector() {
    const { stateUF, regionType, setStateUF, setRegionType } = usePricingStore();
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [isDetecting, setIsDetecting] = useState(false);
    const hasDetected = useRef(false);

    // 0. Auto-detect location on mount
    useEffect(() => {
        if (hasDetected.current) return;
        hasDetected.current = true;

        const findUF = (data: Record<string, string>): string => {
            // Try region_code / region fields
            const code = (data.region_code || data.region || "").toUpperCase();
            if (brazilianStates.some(s => s.uf === code)) return code;

            // Fallback: match by full name (handles accents)
            const name = (data.region || data.regionName || "").toLowerCase();
            const found = brazilianStates.find(s =>
                s.name.toLowerCase() === name ||
                s.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() === name
            );
            return found?.uf || "";
        };

        const detectLocation = async () => {
            // Only auto-detect if still on the default state
            if (stateUF !== "SP") return;

            setIsDetecting(true);
            try {
                // Primary: ip-api.com (HTTP, no CORS issues, generous limits)
                let detectedUF = "";
                try {
                    const res = await fetch("http://ip-api.com/json/?fields=status,country,regionName,region");
                    if (res.ok) {
                        const data = await res.json();
                        if (data.status === "success" && (data.country === "Brazil" || data.country === "BR")) {
                            detectedUF = findUF({ region_code: data.region, region: data.regionName });
                        }
                    }
                } catch (e) {
                    console.warn("ip-api.com failed, trying fallback...");
                }

                // Fallback: ipapi.co (HTTPS)
                if (!detectedUF) {
                    try {
                        const res = await fetch("https://ipapi.co/json/");
                        if (res.ok) {
                            const data = await res.json();
                            if (data.country === "BR") {
                                detectedUF = findUF(data);
                            }
                        }
                    } catch (e) {
                        console.warn("ipapi.co also failed.");
                    }
                }

                if (detectedUF) {
                    console.log("📍 Localização detectada:", detectedUF);
                    setStateUF(detectedUF);
                }
            } catch (error) {
                console.warn("Geolocation skipped:", error);
            } finally {
                setIsDetecting(false);
            }
        };

        detectLocation();
    }, [stateUF, setStateUF]);

    // 1. Sort states alphabetically by name
    const sortedStates = useMemo(() => {
        return [...brazilianStates].sort((a, b) => a.name.localeCompare(b.name));
    }, []);

    // 2. Filter states by search query
    const filteredStates = useMemo(() => {
        if (!search) return sortedStates;
        const lowQuery = search.toLowerCase();
        return sortedStates.filter(s =>
            s.name.toLowerCase().includes(lowQuery) ||
            s.uf.toLowerCase().includes(lowQuery)
        );
    }, [sortedStates, search]);

    const currentState = sortedStates.find(s => s.uf === stateUF);

    return (
        <div className="space-y-4">
            <label className="text-[11px] font-bold tracking-widest uppercase text-muted-foreground">
                Localização
            </label>

            <div className="space-y-3">
                {/* Searchable Dropdown (Combobox) */}
                <div className="relative">
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="w-full flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 transition-all text-left"
                    >
                        <div className="flex items-center gap-2 truncate">
                            {isDetecting ? (
                                <div className="w-3 h-3 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                            ) : (
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                            )}
                            <span className="truncate">{currentState?.name || "Selecione o estado"}</span>
                        </div>
                        <ChevronDown size={16} className={cn("text-muted-foreground transition-transform", isOpen && "rotate-180")} />
                    </button>

                    {isOpen && (
                        <>
                            <div className="fixed inset-0 z-[100]" onClick={() => setIsOpen(false)} />
                            <div className="absolute top-full left-0 right-0 mt-2 bg-card border rounded-xl shadow-2xl z-[101] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                <div className="p-2 border-b">
                                    <div className="relative">
                                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={14} />
                                        <Input
                                            autoFocus
                                            placeholder="Buscar estado..."
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            className="pl-8 h-9 text-xs bg-muted/20 border-none focus-visible:ring-1 focus-visible:ring-emerald-500/50"
                                        />
                                    </div>
                                </div>
                                <div className="max-h-[250px] overflow-y-auto p-1">
                                    {filteredStates.length === 0 ? (
                                        <div className="py-4 text-center text-xs text-muted-foreground">Nenhum estado encontrado</div>
                                    ) : (
                                        filteredStates.map((state) => (
                                            <button
                                                key={state.uf}
                                                onClick={() => {
                                                    setStateUF(state.uf);
                                                    setIsOpen(false);
                                                    setSearch("");
                                                }}
                                                className={cn(
                                                    "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
                                                    stateUF === state.uf
                                                        ? "bg-emerald-500/10 text-emerald-400"
                                                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                                )}
                                            >
                                                <span>{state.name}</span>
                                                {stateUF === state.uf && <Check size={14} className="text-emerald-400" />}
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                    {([
                        { id: "capital" as const, label: "Capital", icon: Building2 },
                        { id: "interior" as const, label: "Interior", icon: TreePine },
                    ]).map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            onClick={() => setRegionType(id)}
                            className={cn(
                                "flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all",
                                regionType === id
                                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                                    : "border-border hover:border-emerald-500/30 text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Icon size={16} />
                            {label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
