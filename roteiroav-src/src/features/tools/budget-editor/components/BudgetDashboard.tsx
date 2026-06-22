"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useBudgetStore } from "../store/useBudgetStore";
import { BudgetList } from "./BudgetList";
import { BudgetStatsModal } from "./BudgetStatsModal";
import { Plus, Download, Upload, Loader2, Search, ArrowDownUp, Filter, BarChart2 } from "lucide-react";
import { exportBudgetsToOhiro, importOhiroFile } from "../utils/exportImportUtils";

export type SortOption = "createdAt" | "updatedAt" | "validade" | "total" | "alpha";
export type SortOrder = "asc" | "desc";
export type TabState = "active" | "approved";

export function BudgetDashboard() {
    const router = useRouter();
    const { createEmptyBudget } = useBudgetStore();
    const [isCreating, setIsCreating] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [statsModalOpen, setStatsModalOpen] = useState(false);

    // New Dashboard State
    const [activeTab, setActiveTab] = useState<TabState>("active");
    const [searchTerm, setSearchTerm] = useState("");
    const [sortOption, setSortOption] = useState<SortOption>("createdAt");
    const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

    const handleSortToggle = (option: SortOption) => {
        if (sortOption === option) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortOption(option);
            setSortOrder("desc"); // default desc for new option
        }
    };

    const handleCreateNew = async () => {
        setIsCreating(true);
        try {
            const newId = await createEmptyBudget();
            router.push(`/tools/budget-editor/editor?id=${newId}`);
        } catch (error) {
            console.error("Erro ao criar orçamento vazio", error);
            setIsCreating(false);
        }
    };

    const handleExport = async () => {
        setIsExporting(true);
        try {
            await exportBudgetsToOhiro();
        } catch (err) {
            console.error(err);
        } finally {
            setIsExporting(false);
        }
    };

    const handleImportClick = () => {
        document.getElementById('import-ohiro')?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        try {
            const result = await importOhiroFile(file);
            alert(`Importação concluída!\n\n${result.imported} importados\n${result.skipped} ignorados`);
        } catch (error) {
            console.error(error);
            alert("Erro ao importar arquivo. Verifique se é um arquivo .ohiro válido.");
        } finally {
            setIsImporting(false);
            e.target.value = ''; // Reset input
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold text-white tracking-tight font-display">
                    Orçamentos
                </h1>
                <p className="text-white/40 text-sm">
                    Gerencie e crie seus orçamentos audiovisuais
                </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 p-6 bg-white/5 rounded-2xl border border-white/5">
                <button
                    onClick={handleCreateNew}
                    disabled={isCreating}
                    className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-black px-6 py-3 rounded-xl font-medium transition-all disabled:opacity-50"
                >
                    {isCreating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
                    Criar Novo Orçamento
                </button>

                <div className="flex items-center gap-3">
                    <input
                        type="file"
                        id="import-ohiro"
                        accept=".ohiro"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                    <button
                        onClick={handleImportClick}
                        disabled={isImporting}
                        className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                    >
                        {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        Importar (.ohiro)
                    </button>

                    <button
                        onClick={handleExport}
                        disabled={isExporting}
                        className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                    >
                        {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                        Exportar Tudo
                    </button>

                    <button
                        onClick={() => setStatsModalOpen(true)}
                        className="flex items-center gap-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                    >
                        <BarChart2 className="h-4 w-4" />
                        Estatísticas
                    </button>
                </div>
            </div>

            <div className="bg-[#111111] p-6 rounded-2xl border border-white/5">
                {/* Tabs & Filters Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    {/* Tabs */}
                    <div className="flex space-x-1 bg-white/5 p-1 rounded-xl">
                        <button
                            onClick={() => setActiveTab('active')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                activeTab === 'active' 
                                ? 'bg-white/10 text-white shadow-sm' 
                                : 'text-white/40 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            Orçamentos Pendentes
                        </button>
                        <button
                            onClick={() => setActiveTab('approved')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                activeTab === 'approved' 
                                ? 'bg-emerald-500/10 text-emerald-400 shadow-sm' 
                                : 'text-white/40 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            Aprovados
                        </button>
                    </div>

                    {/* Search & Sort */}
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                            <input
                                type="text"
                                placeholder="Buscar orçamento..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 pr-4 py-2 h-10 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-white/20 w-[200px]"
                            />
                        </div>

                        <div className="relative group">
                            <button className="flex items-center gap-2 h-10 px-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-white/70 text-sm transition-colors">
                                <Filter className="h-4 w-4" />
                                {sortOption === 'createdAt' && 'Criação'}
                                {sortOption === 'updatedAt' && 'Modificação'}
                                {sortOption === 'validade' && 'Validade'}
                                {sortOption === 'total' && 'Valor'}
                                {sortOption === 'alpha' && 'A-Z'}
                            </button>
                            
                            {/* Sort Dropdown menu */}
                            <div className="absolute right-0 top-full mt-2 w-48 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 flex flex-col p-1">
                                {[
                                    { value: 'createdAt', label: 'Data de Criação' },
                                    { value: 'updatedAt', label: 'Modificação' },
                                    { value: 'validade', label: 'Validade' },
                                    { value: 'total', label: 'Valor Total' },
                                    { value: 'alpha', label: 'Alfabética' },
                                ].map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => handleSortToggle(opt.value as SortOption)}
                                        className="flex items-center justify-between w-full px-3 py-2 text-sm text-left rounded-lg hover:bg-white/10 text-white/80"
                                    >
                                        <span>{opt.label}</span>
                                        {sortOption === opt.value && (
                                            <span className="text-white/50 text-xs">
                                                {sortOrder === 'asc' ? '↑' : '↓'}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <BudgetList 
                    activeTab={activeTab} 
                    searchTerm={searchTerm} 
                    sortOption={sortOption} 
                    sortOrder={sortOrder} 
                />
            </div>

            <BudgetStatsModal 
                isOpen={statsModalOpen} 
                onClose={() => setStatsModalOpen(false)} 
            />
        </div>
    );
}
