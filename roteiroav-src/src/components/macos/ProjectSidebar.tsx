"use client";

import { useAppStore } from "@/store/useAppStore";
import { useBudgetStore } from "@/features/tools/budget-editor/store/useBudgetStore";
import { usePricingStore } from "@/features/tools/pricing-editor/store/usePricingStore";
import { ExplorerSidebar } from "@/features/tools/script-editor/components/ExplorerSidebar";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    Folder,
    FileText,
    ChevronRight,
    ChevronLeft,
    Plus,
    Calendar,
    Trash2,
    Settings2,
    LogOut,
    User as UserIcon
} from "lucide-react";

export function ProjectSidebar() {
    const { currentApp, isProjectSidebarOpen, toggleProjectSidebar, isTransitioning, requestConfirm } = useAppStore();
    const { savedBudgets, meta, loadBudget, deleteBudget, createNewBudget } = useBudgetStore();
    const { expenses, setShowExpensesModal } = usePricingStore();
    const { user } = useAuth();
    const router = useRouter();

    if (!currentApp || isTransitioning) return null;

    const handleLogout = async () => {
        if (await requestConfirm("Sair da Conta", "Deseja realmente sair?")) {
            await signOut(auth);
            router.push("/login");
        }
    };

    // Group budgets by date (if in budget-editor)
    const groupedBudgets = currentApp === "budget-editor" ? savedBudgets.reduce((acc: any, budget: any) => {
        const date = budget.meta.data || "Sem Data";
        if (!acc[date]) acc[date] = [];
        acc[date].push(budget);
        return acc;
    }, {} as Record<string, typeof savedBudgets>) : {};

    const sortedDates = Object.keys(groupedBudgets).sort((a, b) => b.localeCompare(a));

    return (
        <div className="relative flex h-full z-40">
            {/* Sidebar Content */}
            <div
                className={cn(
                    "h-full bg-[#2c2c2c]/70 backdrop-blur-[24px] transition-all duration-500 ease-in-out overflow-hidden border-r border-white/10 flex flex-col",
                    isProjectSidebarOpen ? "w-[240px]" : "w-0"
                )}
            >
                <div className="w-[240px] p-4 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xs font-black uppercase tracking-widest text-white/80">
                            Explorador
                        </h3>
                        <div className="flex items-center gap-1.5">
                            {currentApp === "budget-editor" && (
                                <button
                                    onClick={createNewBudget}
                                    className="p-1 hover:bg-white/10 rounded-md transition-colors text-white/60 hover:text-white"
                                    title="Novo Orçamento"
                                >
                                    <Plus size={14} />
                                </button>
                            )}
                            <button
                                onClick={toggleProjectSidebar}
                                className="p-1 hover:bg-white/10 rounded-md transition-colors text-white/60 hover:text-white"
                                title="Minimizar Menu"
                            >
                                <ChevronLeft size={14} />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-hidden hover:overflow-y-auto custom-scrollbar pr-1">
                        {currentApp === "budget-editor" ? (
                            <div className="space-y-6">
                                {sortedDates.length === 0 && (
                                    <div className="text-center py-8 text-white/50 text-xs italic">
                                        Nenhum orçamento salvo
                                    </div>
                                )}

                                {sortedDates.map(date => (
                                    <div key={date} className="space-y-2">
                                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-white/70 px-2">
                                            <Calendar size={10} />
                                            {date === "Sem Data" ? date : new Date(date + "T12:00:00").toLocaleDateString('pt-BR')}
                                        </div>
                                        <div className="space-y-0.5">
                                            {groupedBudgets[date].map((budget: any) => (
                                                <div
                                                    key={budget.meta.id}
                                                    className={cn(
                                                        "group flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors cursor-pointer",
                                                        meta.id === budget.meta.id
                                                            ? "bg-[var(--macos-selected)] text-white"
                                                            : "hover:bg-white/5 text-white/90"
                                                    )}
                                                    onClick={() => loadBudget(budget.meta.id)}
                                                >
                                                    <FileText size={14} className="shrink-0" />
                                                    <span className="flex-1 text-xs leading-tight py-1">
                                                        {budget.meta.num} - {budget.cliente.nome || "Cliente s/ nome"}
                                                    </span>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            deleteBudget(budget.meta.id);
                                                        }}
                                                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : currentApp === "pricing-editor" ? (
                            <div className="space-y-4">
                                <div className="px-2 py-2 mb-2">
                                    <button
                                        onClick={() => setShowExpensesModal(true)}
                                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold uppercase tracking-wider hover:bg-emerald-500/30 transition-all"
                                    >
                                        <Settings2 size={12} />
                                        Editar Despesas
                                    </button>
                                </div>

                                <div className="space-y-1">
                                    {[
                                        { label: "Aluguel", value: expenses.aluguel },
                                        { label: "Alimentação", value: expenses.alimentacao },
                                        { label: "Transporte", value: expenses.transporte },
                                        { label: "Lazer", value: expenses.lazer },
                                        { label: "Internet", value: expenses.internet },
                                        { label: "Água", value: expenses.agua },
                                        { label: "Luz", value: expenses.luz },
                                        { label: "Telefone", value: expenses.telefone },
                                        { label: "Saúde", value: expenses.saude },
                                    ].map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between px-3 py-1.5 text-[11px] text-white/70 hover:text-white transition-colors border-b border-white/5">
                                            <span>{item.label}</span>
                                            <span className="font-medium tabular-nums">
                                                R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    ))}

                                    {(() => {
                                        const now = new Date();
                                        const currentMonth = now.getMonth() + 1;
                                        const currentYear = now.getFullYear();

                                        const totalSoftwaresMensal = (expenses.softwares || []).reduce((sum: number, s: any) => sum + s.monthlyCost, 0);
                                        const totalInstallmentsMensal = (expenses.installments || []).reduce((sum: number, inst: any) => {
                                            const monthsDiff = (currentYear - inst.startYear) * 12 + (currentMonth - inst.startMonth);
                                            const isActive = monthsDiff >= 0 && monthsDiff < inst.totalInstallments;
                                            return isActive ? sum + inst.value : sum;
                                        }, 0);
                                        const custosFixos = expenses.aluguel + expenses.internet + totalSoftwaresMensal + totalInstallmentsMensal;
                                        const custosVariaveis = expenses.alimentacao + expenses.transporte + expenses.lazer + expenses.agua + expenses.luz + expenses.telefone + expenses.saude;
                                        const totalCustosMensais = custosFixos + custosVariaveis;

                                        return (
                                            <>
                                                <div className="flex items-center justify-between px-3 py-1.5 text-[11px] text-white/70 hover:text-white transition-colors border-b border-white/5">
                                                    <span>Custos Variáveis</span>
                                                    <span className="font-medium tabular-nums text-blue-400">
                                                        R$ {custosVariaveis.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between px-3 py-1.5 text-[11px] text-white/70 hover:text-white transition-colors">
                                                    <span className="uppercase text-[9px] font-black">Custo Total Mensal</span>
                                                    <span className="font-bold tabular-nums text-emerald-400">
                                                        R$ {totalCustosMensais.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </span>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>

                                <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 space-y-3">
                                    <div className="text-[9px] uppercase font-bold text-emerald-400/70 leading-tight">
                                        CUSTO OPERACIONAL MÍNIMO
                                        <span className="block text-[8px] text-emerald-400/40 normal-case font-normal">(Valores p/ cobrir custos fixos sem imposto)</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                        {[
                                            { label: "Mês", units: 1 },
                                            { label: "Semana", units: 4 },
                                            { label: "Diária", units: 22 },
                                            { label: "Hora", units: 176 },
                                        ].map((unit, idx) => {
                                            const now = new Date();
                                            const currentMonth = now.getMonth() + 1;
                                            const currentYear = now.getFullYear();

                                            const totalSoftwaresMensal = (expenses.softwares || []).reduce((sum: number, s: any) => sum + s.monthlyCost, 0);
                                            const totalInstallmentsMensal = (expenses.installments || []).reduce((sum: number, inst: any) => {
                                                const monthsDiff = (currentYear - inst.startYear) * 12 + (currentMonth - inst.startMonth);
                                                const isActive = monthsDiff >= 0 && monthsDiff < inst.totalInstallments;
                                                return isActive ? sum + inst.value : sum;
                                            }, 0);
                                            const totalExpenses = (expenses.aluguel + expenses.alimentacao + expenses.transporte + expenses.lazer + expenses.internet + expenses.agua + expenses.luz + expenses.telefone + expenses.saude) + totalSoftwaresMensal + totalInstallmentsMensal;
                                            const minRate = totalExpenses / unit.units;

                                            return (
                                                <div key={idx} className="space-y-0.5">
                                                    <div className="text-[9px] text-emerald-400/70 uppercase font-medium">{unit.label}</div>
                                                    <div className="text-[12px] font-black text-emerald-400 tabular-nums leading-none">
                                                        R$ {minRate.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="mt-2 p-3 rounded-lg bg-white/5 border border-white/10 space-y-2">
                                    <div className="flex justify-between text-[10px] uppercase font-bold text-white/60">
                                        <span>Configuração (%)</span>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-[11px]">
                                            <span className="text-white/65 text-[10px]">Imposto</span>
                                            <span className="text-emerald-400 font-bold">{(expenses.impostoPercent || 0).toFixed(2)}%</span>
                                        </div>
                                        <div className="flex justify-between text-[11px]">
                                            <span className="text-white/65 text-[10px]">Lucro</span>
                                            <span className="text-emerald-400 font-bold">{(expenses.lucroPercent || 0).toFixed(2)}%</span>
                                        </div>
                                        <div className="flex justify-between text-[11px]">
                                            <span className="text-white/65 text-[10px]">Reinvestimento</span>
                                            <span className="text-emerald-400 font-bold">{(expenses.investimentoPercent || 0).toFixed(2)}%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : currentApp === "script-editor" ? (
                            <ExplorerSidebar />
                        ) : (
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-[var(--macos-selected)] text-white text-sm cursor-pointer">
                                    <FileText className="w-4 h-4" />
                                    <span className="truncate">Projeto Atual.dojo</span>
                                </div>
                                <div className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-white/5 text-white/80 hover:text-white text-sm cursor-pointer group/item">
                                    <Folder className="w-4 h-4 text-amber-400" />
                                    <span className="truncate">Rascunhos</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {user && (
                        <div className="pt-4 mt-4 border-t border-white/5 space-y-4">
                            <div className="flex items-center gap-3 px-2">
                                <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                                    {user.photoURL ? (
                                        <img src={user.photoURL} alt="" className="w-full h-full rounded-full" />
                                    ) : (
                                        <UserIcon size={14} className="text-indigo-400" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[11px] font-bold text-white truncate leading-tight">
                                        {user.displayName || "Usuário"}
                                    </p>
                                    <p className="text-[9px] text-white/50 truncate">
                                        {user.email}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-500/10 text-white/60 hover:text-red-400 text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                                <LogOut size={12} />
                                Sair da Conta
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <button
                onClick={toggleProjectSidebar}
                title={isProjectSidebarOpen ? "Recolher Sidebar" : "Expandir Sidebar"}
                className={cn(
                    "absolute top-16 z-50",
                    "w-5 h-10 bg-[var(--macos-sidebar)] border border-white/20 rounded-r-lg shadow-xl",
                    "flex items-center justify-center transition-all duration-500 hover:bg-[#3a3a3a] hover:scale-110",
                    isProjectSidebarOpen ? "left-[240px]" : "left-0"
                )}
            >
                {isProjectSidebarOpen ? (
                    <ChevronLeft className="w-3.5 h-3.5 text-[var(--macos-text)]" />
                ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-[var(--macos-text)]" />
                )}
            </button>
        </div>
    );
}
