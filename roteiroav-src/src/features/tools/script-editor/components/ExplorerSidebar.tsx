"use client";

import { useScriptStore } from "../store/useScriptStore";
import { Folder, ChevronRight, ChevronDown, ListFilter, SortAsc, SortDesc, Calendar, Clock, Type } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { SortField, SortOrder } from "../store/types";
import { VersionExplorerSidebar } from "./editor/VersionExplorerSidebar";

export function ExplorerSidebar() {
    const { 
        scripts,
        getClients, 
        selectedClient, 
        setSelectedClient, 
        clientSortField, 
        clientSortOrder, 
        setSortOptions,
        activeScriptId
    } = useScriptStore();
    
    const [isSortOpen, setIsSortOpen] = useState(false);
    const clients = getClients();

    if (activeScriptId) {
        return <VersionExplorerSidebar />;
    }

    // Map clients to their script counts
    const clientCounts = scripts.reduce((acc, s) => {
        acc[s.clientName] = (acc[s.clientName] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const handleSortChange = (field: SortField) => {
        if (field === clientSortField) {
            setSortOptions(field, clientSortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortOptions(field, 'asc');
        }
        setIsSortOpen(false);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header / Sort Controls */}
            <div className="flex items-center justify-between px-2 mb-4 group/header">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">
                    Clientes / Pastas
                </h3>
                <div className="relative">
                    <button 
                        onClick={() => setIsSortOpen(!isSortOpen)}
                        className="p-1 hover:bg-white/10 rounded transition-colors text-white/60 hover:text-white"
                    >
                        <ListFilter size={12} />
                    </button>
                    
                    {isSortOpen && (
                        <div className="absolute right-0 top-6 w-48 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                            <div className="text-[9px] font-black uppercase tracking-widest text-white/50 px-2 py-1 mb-1">Ordenar por</div>
                            <button 
                                onClick={() => handleSortChange('name')}
                                className={cn(
                                    "w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-[11px] transition-colors",
                                    clientSortField === 'name' ? "bg-amber-500/10 text-amber-500" : "hover:bg-white/5 text-white/70"
                                )}
                            >
                                <div className="flex items-center gap-2">
                                    <Type size={12} />
                                    <span>Nome (A-Z)</span>
                                </div>
                                {clientSortField === 'name' && (clientSortOrder === 'asc' ? <SortAsc size={10} /> : <SortDesc size={10} />)}
                            </button>
                            <button 
                                onClick={() => handleSortChange('createdAt')}
                                className={cn(
                                    "w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-[11px] transition-colors",
                                    clientSortField === 'createdAt' ? "bg-amber-500/10 text-amber-500" : "hover:bg-white/5 text-white/70"
                                )}
                            >
                                <div className="flex items-center gap-2">
                                    <Calendar size={12} />
                                    <span>Data de Criação</span>
                                </div>
                                {clientSortField === 'createdAt' && (clientSortOrder === 'asc' ? <SortAsc size={10} /> : <SortDesc size={10} />)}
                            </button>
                            <button 
                                onClick={() => handleSortChange('updatedAt')}
                                className={cn(
                                    "w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-[11px] transition-colors",
                                    clientSortField === 'updatedAt' ? "bg-amber-500/10 text-amber-500" : "hover:bg-white/5 text-white/70"
                                )}
                            >
                                <div className="flex items-center gap-2">
                                    <Clock size={12} />
                                    <span>Última Modificação</span>
                                </div>
                                {clientSortField === 'updatedAt' && (clientSortOrder === 'asc' ? <SortAsc size={10} /> : <SortDesc size={10} />)}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Client Folders List */}
            <div className="flex-1 space-y-0.5 overflow-y-auto custom-scrollbar pr-1">
                {clients.length === 0 ? (
                    <div className="px-3 py-6 text-center">
                        <p className="text-[10px] text-white/30 uppercase font-bold italic tracking-wider">
                            Nenhum cliente cadastrado
                        </p>
                    </div>
                ) : (
                    clients.map((client) => (
                        <button
                            key={client}
                            onClick={() => setSelectedClient(client)}
                            className={cn(
                                "w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all group",
                                selectedClient === client
                                    ? "bg-amber-500/10 text-amber-500 shadow-inner"
                                    : "text-white/70 hover:bg-white/5 hover:text-white"
                            )}
                        >
                            <Folder 
                                size={14} 
                                className={cn(
                                    "shrink-0 transition-transform duration-300",
                                    selectedClient === client ? "fill-amber-500/20 text-amber-500 scale-110" : "text-white/45 group-hover:scale-110"
                                )} 
                            />
                            <div className="flex-1 flex items-center justify-between min-w-0 pr-1">
                                <span className="text-left text-xs font-bold truncate tracking-tight py-1">
                                    {client}
                                </span>
                                <span className={cn(
                                    "text-[9px] font-black px-1.5 py-0.5 rounded-md min-w-[20px] text-center transition-colors",
                                    selectedClient === client
                                        ? "bg-amber-500/20 text-amber-500"
                                        : "bg-white/5 text-white/50 group-hover:text-white/80"
                                )}>
                                    {clientCounts[client] || 0}
                                </span>
                            </div>
                        </button>
                    ))
                )}
            </div>
        </div>
    );
}
