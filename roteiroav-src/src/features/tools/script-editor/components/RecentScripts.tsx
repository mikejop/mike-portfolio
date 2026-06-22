"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useScriptStore } from "../store/useScriptStore";
import { ScriptCard } from "./ScriptCard";
import { NewScriptCard } from "./NewScriptCard";
import { GhostScriptCard } from "./GhostScriptCard";
import { useRouter } from "next/navigation";
import { SharedScripts } from "./SharedScripts";
import { Loader2 } from "lucide-react";

interface RecentScriptsProps {
    searchQuery: string;
    sortBy: 'criadoEm' | 'atualizadoEm' | 'totalWords' | 'totalCenas' | 'totalTakes' | 'titulo';
    sortOrder: 'asc' | 'desc';
}

export function RecentScripts({ searchQuery, sortBy, sortOrder }: RecentScriptsProps) {
    const router = useRouter();
    const { 
        getFilteredScripts, 
        selectedClient, 
        setShowNewScriptModal, 
        activeTab,
        loadingScripts,
        pendingDuplicates,
    } = useScriptStore();

    // Filter and sort scripts
    const scripts = useMemo(() => {
        const baseScripts = getFilteredScripts();
        const filtered = selectedClient
            ? baseScripts.filter(s => s.clientName === selectedClient)
            : baseScripts;

        const unique = filtered.filter((s, index, self) => 
            self.findIndex(t => t.id === s.id) === index
        );
            
        return unique.sort((a, b) => {
            let valA: any = a[sortBy];
            let valB: any = b[sortBy];

            if (sortBy === 'totalWords') {
                valA = a.totalWords || 0;
                valB = b.totalWords || 0;
            } else if (sortBy === 'totalCenas') {
                valA = a.totalCenas || 0;
                valB = b.totalCenas || 0;
            } else if (sortBy === 'totalTakes') {
                valA = a.totalTakes || 0;
                valB = b.totalTakes || 0;
            } else if (sortBy === 'titulo') {
                valA = (a.titulo || '').toLowerCase();
                valB = (b.titulo || '').toLowerCase();
            } else if (sortBy === 'criadoEm' || sortBy === 'atualizadoEm') {
                valA = new Date(valA || 0).getTime();
                valB = new Date(valB || 0).getTime();
            }

            if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
            if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
    }, [getFilteredScripts, selectedClient, sortBy, sortOrder]);

    const filteredAndSearchedScripts = useMemo(() => {
        return scripts.filter(s => {
            if (!s || typeof s !== 'object') return false;
            
            const nameMatch = s.titulo?.toLowerCase().includes(searchQuery.toLowerCase());
            const clientMatch = s.clientName?.toLowerCase().includes(searchQuery.toLowerCase());
            const briefingMatch = s.descricao?.toLowerCase().includes(searchQuery.toLowerCase());
            
            return nameMatch || clientMatch || briefingMatch;
        });
    }, [scripts, searchQuery]);

    const currentMonthLabel = useMemo(() => format(new Date(), "MMMM yyyy", { locale: ptBR }), []);

    const groupedByMonth = useMemo(() => {
        const groups = filteredAndSearchedScripts.reduce((acc, s) => {
            const date = s.criadoEm ? new Date(s.criadoEm) : new Date();
            const month = format(date, "MMMM yyyy", { locale: ptBR });
            if (!acc[month]) acc[month] = [];
            acc[month].push(s);
            return acc;
        }, {} as Record<string, typeof scripts>);

        if (activeTab === 'my-scripts' && searchQuery === "") {
            if (!groups[currentMonthLabel]) {
                groups[currentMonthLabel] = [];
            }
        }
        return groups;
    }, [filteredAndSearchedScripts, activeTab, searchQuery, currentMonthLabel]);

    return (
        <div className="space-y-12">
            {/* Month Groups */}
            {Object.entries(groupedByMonth).map(([month, monthScripts]) => (
                <div key={month} className="space-y-6">
                    <div className="flex items-center gap-4 px-2">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">
                            {month}
                        </h2>
                        <div className="flex-1 h-px bg-white/5" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {activeTab === 'my-scripts' && month === currentMonthLabel && (
                            <NewScriptCard onClick={() => setShowNewScriptModal(true)} />
                        )}
                        
                        {/* Ghost cards for in-progress duplications */}
                        {activeTab === 'my-scripts' && month === currentMonthLabel && pendingDuplicates.map((ghost, i) => (
                            <GhostScriptCard key={`ghost-${i}`} titulo={ghost.titulo} />
                        ))}
                        
                        {monthScripts.map(script => (
                            <ScriptCard 
                                key={script.id} 
                                script={script} 
                                onClick={() => router.push(`/tools/script-editor?id=${script.id}`)} 
                            />
                        ))}

                        {/* Loading placeholder inside month grid */}
                        {loadingScripts && month === currentMonthLabel && (
                            <div className="flex items-center justify-center p-8 border border-dashed border-white/10 rounded-3xl bg-white/[0.02] min-h-[220px] aspect-[3/2]">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
                                        <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
                                    </div>
                                    <span className="text-[10px] text-white/40 font-black uppercase tracking-widest animate-pulse">Sincronizando...</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ))}

            <SharedScripts />
        </div>
    );
}
