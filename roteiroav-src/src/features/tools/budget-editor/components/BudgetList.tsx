"use client";

import { useEffect, useState } from "react";
import {
    collection,
    getDocs,
    query,
    orderBy,
    deleteDoc,
    doc,
    limit
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { Trash2, FileText, Loader2, Copy, Printer, FileDown } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getUserDocument, saveUserDocument } from "@/lib/firestore";
import { useRouter } from "next/navigation";
import { exportBudgetToPDF } from "../utils/pdfExport";
import { SortOption, SortOrder, TabState } from "./BudgetDashboard";
import { useAppStore } from "@/store/useAppStore";
import { isToday, isYesterday, isThisWeek, differenceInDays } from "date-fns";
import { ChevronDown, AlertCircle } from "lucide-react";
interface BudgetListItem {
    id: string;
    meta: {
        num: string;
        data: string;
        validade?: string;
        status?: "Pendente" | "Aprovado" | "Recusado" | "Expirado";
    };
    cliente: {
        nome: string;
    };
    total?: number;
    createdAt?: any; 
    updatedAt?: any;
}

interface BudgetListProps {
    activeTab: TabState;
    searchTerm: string;
    sortOption: SortOption;
    sortOrder: SortOrder;
}

export function BudgetList({ activeTab, searchTerm, sortOption, sortOrder }: BudgetListProps) {
    const { user } = useAuth();
    const { requestConfirm } = useAppStore();
    const router = useRouter();
    const [budgets, setBudgets] = useState<BudgetListItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Duplication Modal State
    const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
    const [budgetToDuplicate, setBudgetToDuplicate] = useState<BudgetListItem | null>(null);
    const [newName, setNewName] = useState("");
    const [newValidity, setNewValidity] = useState("15");

    const fetchBudgets = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const q = query(
                collection(db, "users", user.uid, "budgets"),
                orderBy("updatedAt", "desc"),
                limit(100)
            );
            const snapshot = await getDocs(q);
            const items = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data()
            })) as BudgetListItem[];
            setBudgets(items);
        } catch (error) {
            console.error("Error fetching budgets:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBudgets();
    }, [user]);

    const isBudgetExpired = (budget: BudgetListItem) => {
        const status = budget.meta?.status || "Pendente";
        if (status === "Aprovado" || status === "Recusado") return false;
        
        const dataStr = budget.meta?.data;
        const validadeProps = parseInt(budget.meta?.validade || "15", 10);
        
        if (!dataStr) return false;
        
        const dataCriacao = new Date(dataStr);
        const diff = differenceInDays(new Date(), dataCriacao);
        
        return diff > validadeProps;
    };

    const handleDelete = async (id: string) => {
        if (!user) return;
        if (!await requestConfirm("Excluir Orçamento", "Tem certeza que deseja excluir este orçamento?")) return;

        try {
            await deleteDoc(doc(db, "users", user.uid, "budgets", id));
            setBudgets(prev => prev.filter(b => b.id !== id));
        } catch (error) {
            console.error("Error deleting budget:", error);
            alert("Erro ao excluir orçamento.");
        }
    };

    const handleDuplicate = async (budget: BudgetListItem, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user) return;
        
        if (isBudgetExpired(budget)) {
            // Open modal to request new name and validity
            setBudgetToDuplicate(budget);
            setNewName(budget.cliente?.nome || "");
            setNewValidity(budget.meta?.validade || "15");
            setDuplicateModalOpen(true);
            return;
        }

        await processDuplication(budget.id);
    };

    const processDuplication = async (sourceId: string, customName?: string, customValidity?: string) => {
        try {
            const data = await getUserDocument("budgets", sourceId);
            if (!data) return;

            const newId = Math.random().toString(36).substr(2, 9);
            const { createdAt, updatedAt, ownerId, ...budgetData } = data;

            // Handle name changes
            if (customName) {
                if (!budgetData.cliente) budgetData.cliente = { nome: "" };
                budgetData.cliente.nome = customName;
            } else if (budgetData.cliente?.nome) {
                budgetData.cliente.nome += " (Cópia)";
            }

            // Update Metadata
            budgetData.meta = {
                ...budgetData.meta,
                id: newId,
                status: "Pendente", // Always reset to pending on duplicate
                data: new Date().toISOString(), // Reset date to today
                validade: customValidity || budgetData.meta?.validade || "15"
            };

            await saveUserDocument("budgets", newId, budgetData);
            setDuplicateModalOpen(false);
            fetchBudgets();
        } catch (error) {
            console.error("Error duplicating budget:", error);
            alert("Erro ao duplicar orçamento.");
        }
    };

    const handlePrint = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        window.open(`/tools/budget-editor/editor?id=${id}&print=true`, "_blank");
    };

    const handleGeneratePDF = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const data = await getUserDocument("budgets", id);
            if (!data) return;

            // Passa os dados para a função de PDF. Precisaremos ajustar a tipagem lá caso reclame.
            await exportBudgetToPDF(data as any);
        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Erro ao gerar PDF.");
        }
    };

    const handleOpen = (budget: BudgetListItem) => {
        if (isBudgetExpired(budget)) {
            alert("Este orçamento está expirado e não pode mais ser editado.\nDuplique-o para gerar uma nova versão com nova data de validade.");
            return;
        }
        router.push(`/tools/budget-editor/editor?id=${budget.id}`);
    };

    const handleStatusChange = async (id: string, newStatus: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user) return;
        try {
            const data = await getUserDocument("budgets", id);
            if (!data) return;
            data.meta = { ...data.meta, status: newStatus };
            await saveUserDocument("budgets", id, data);
            setBudgets(prev => prev.map(b => b.id === id ? { ...b, meta: { ...b.meta, status: newStatus as any } } : b));
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Erro ao atualizar status.");
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-white/20" />
            </div>
        );
    }

    // 1. FILTERING
    const filteredBudgets = budgets.filter((b) => {
        // Status filter (Active vs Approved)
        const status = b.meta?.status || "Pendente";
        if (activeTab === "approved" && status !== "Aprovado") return false;
        if (activeTab === "active" && status === "Aprovado") return false; // Hide approved from active tab

        // Text Search
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            const clientName = (b.cliente?.nome || "").toLowerCase();
            const budgetNum = (b.meta?.num || "").toLowerCase();
            if (!clientName.includes(term) && !budgetNum.includes(term)) return false;
        }
        return true;
    });

    // 2. SORTING
    const sortedBudgets = [...filteredBudgets].sort((a, b) => {
        const orderMult = sortOrder === "asc" ? 1 : -1;
        
        switch (sortOption) {
            case "createdAt": {
                const ta = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
                const tb = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
                return (ta - tb) * orderMult;
            }
            case "updatedAt": {
                const ta = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : 0;
                const tb = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : 0;
                return (ta - tb) * orderMult;
            }
            case "validade": {
                const dataA = a.meta?.data ? new Date(a.meta.data).getTime() : 0;
                const valA = parseInt(a.meta?.validade || "0") * 86400000;
                const dataB = b.meta?.data ? new Date(b.meta.data).getTime() : 0;
                const valB = parseInt(b.meta?.validade || "0") * 86400000;
                return ((dataA + valA) - (dataB + valB)) * orderMult;
            }
            case "total": {
                const ta = a.total || 0;
                const tb = b.total || 0;
                return (ta - tb) * orderMult;
            }
            case "alpha": {
                const nameA = (a.cliente?.nome || "").toLowerCase();
                const nameB = (b.cliente?.nome || "").toLowerCase();
                return nameA.localeCompare(nameB) * orderMult;
            }
            default: return 0;
        }
    });

    // 3. GROUPING 
    // We only group by date if sorting by createdAt/updatedAt/validade 
    // AND if there's no active search term to keep search results flat
    const shouldGroup = !searchTerm && ["createdAt", "updatedAt", "validade"].includes(sortOption);
    
    interface GroupedBudgets {
        label: string;
        items: BudgetListItem[];
    }

    const groupedData: GroupedBudgets[] = [];
    
    if (shouldGroup) {
        const groupsMap = new Map<string, BudgetListItem[]>();
        
        sortedBudgets.forEach(b => {
            let d: Date | null = null;
            if (sortOption === "createdAt" && b.createdAt) d = b.createdAt.toDate();
            else if (sortOption === "updatedAt" && b.updatedAt) d = b.updatedAt.toDate();
            else if (sortOption === "validade" && b.meta?.data) d = new Date(b.meta.data);
            
            let label = "Sem Data";
            if (d) {
                if (isToday(d)) label = "Hoje";
                else if (isYesterday(d)) label = "Ontem";
                else if (isThisWeek(d)) label = "Esta semana";
                else label = format(d, "MMMM yyyy", { locale: ptBR }).replace(/^\w/, c => c.toUpperCase());
            }

            if (!groupsMap.has(label)) groupsMap.set(label, []);
            groupsMap.get(label)!.push(b);
        });

        // Maintain the order of the keys exactly as they appear in the sorted array
        const labelsSeen = new Set<string>();
        sortedBudgets.forEach(b => {
            let d: Date | null = null;
            if (sortOption === "createdAt" && b.createdAt) d = b.createdAt.toDate();
            else if (sortOption === "updatedAt" && b.updatedAt) d = b.updatedAt.toDate();
            else if (sortOption === "validade" && b.meta?.data) d = new Date(b.meta.data);
            
            let label = "Sem Data";
            if (d) {
                if (isToday(d)) label = "Hoje";
                else if (isYesterday(d)) label = "Ontem";
                else if (isThisWeek(d)) label = "Esta semana";
                else label = format(d, "MMMM yyyy", { locale: ptBR }).replace(/^\w/, c => c.toUpperCase());
            }

            if (!labelsSeen.has(label)) {
                labelsSeen.add(label);
                groupedData.push({ label, items: groupsMap.get(label)! });
            }
        });
    } else {
        // Flat list
        groupedData.push({ label: "Todos os Orçamentos", items: sortedBudgets });
    }

    if (groupedData.length === 0 || (groupedData.length === 1 && groupedData[0].items.length === 0)) {
        return (
            <div className="p-12 text-center flex flex-col items-center justify-center border border-white/5 rounded-xl border-dashed bg-white/[0.02]">
                <FileText className="h-8 w-8 text-white/20 mb-3" />
                <p className="text-white/40 font-medium">
                    Nenhum orçamento encontrado.
                </p>
                <p className="text-white/20 text-sm mt-1">Crie um novo ou tente alterar os filtros de busca.</p>
            </div>
        );
    }

    const renderCard = (budget: BudgetListItem) => {
        const expired = isBudgetExpired(budget);
        let status = budget.meta?.status || "Pendente";
        
        // Se expirado e não aprovado/recusado, força exibição como Expirado
        if (expired && status !== 'Aprovado' && status !== 'Recusado') {
            status = "Expirado";
        }
        
        const statusColors: Record<string, string> = {
            "Pendente": "bg-blue-500/10 text-blue-400 border-blue-500/20",
            "Aprovado": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
            "Recusado": "bg-red-500/10 text-red-400 border-red-500/20",
            "Expirado": "bg-amber-500/10 text-amber-500 border-amber-500/20"
        };
        const colorClass = statusColors[status] || statusColors["Pendente"];

        return (
            <div
                key={budget.id}
                onClick={() => handleOpen(budget)}
                className={`flex flex-col p-5 bg-[#171717] border border-white/5 rounded-xl transition-all group ${!expired ? 'hover:bg-[#1f1f1f] hover:border-white/15 cursor-pointer' : 'opacity-80'}`}
            >
                {/* Header: Num + Actions */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white/40 uppercase tracking-wider">
                            #{budget.meta?.num}
                        </span>
                        {expired && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded uppercase tracking-wider">
                                <AlertCircle className="h-3 w-3" /> Expirado
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => handleGeneratePDF(budget.id, e)} className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-md"><FileDown className="h-3.5 w-3.5" /></button>
                        <button onClick={(e) => handlePrint(budget.id, e)} className="p-1.5 text-white/40 hover:text-blue-400 hover:bg-blue-500/10 rounded-md"><Printer className="h-3.5 w-3.5" /></button>
                        <button onClick={(e) => handleDuplicate(budget, e)} className="p-1.5 text-white/40 hover:text-amber-400 hover:bg-amber-500/10 rounded-md"><Copy className="h-3.5 w-3.5" /></button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(budget.id); }} className="p-1.5 text-white/40 hover:text-red-500 hover:bg-red-500/10 rounded-md"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                </div>

                {/* Body: Client & Date */}
                <div className="mb-6 flex-1">
                    <h3 className="text-base font-semibold text-white leading-tight mb-2 line-clamp-2">
                        {budget.cliente?.nome || "Cliente não informado"}
                    </h3>
                    <p className="text-xs text-white/50">
                        {budget.meta?.data ? format(new Date(budget.meta.data), "dd 'de' MMMM, yyyy", { locale: ptBR }) : 'Data não informada'}
                    </p>
                </div>

                {/* Footer: Status Dropdown & Total */}
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                    {/* Status Select */}
                    <div className="relative group/status" onClick={e => e.stopPropagation()}>
                        <select 
                            value={status}
                            disabled={expired}
                            onChange={(e) => handleStatusChange(budget.id, e.target.value, e as any)}
                            className={`appearance-none text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 pr-6 rounded-md border ${colorClass} ${!expired ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'} focus:outline-none`}
                        >
                            <option value="Pendente" className="bg-[#1a1a1a] text-white">Pendente</option>
                            <option value="Aprovado" className="bg-[#1a1a1a] text-white">Aprovado</option>
                            <option value="Recusado" className="bg-[#1a1a1a] text-white">Recusado</option>
                            <option value="Expirado" className="bg-[#1a1a1a] text-white" disabled>Expirado</option>
                        </select>
                        <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none opacity-60" />
                    </div>

                    {/* Total */}
                    <span className="text-sm font-bold text-emerald-400">
                        {budget.total ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(budget.total) : '---'}
                    </span>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8 relative">
            {groupedData.map((group, groupIdx) => (
                <div key={groupIdx} className="space-y-4">
                    {shouldGroup && (
                        <div className="flex items-center gap-4">
                            <h3 className="text-xs font-semibold uppercase tracking-widest text-white/50">{group.label}</h3>
                            <div className="flex-1 h-px bg-white/5"></div>
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {group.items.map(renderCard)}
                    </div>
                </div>
            ))}

            {/* Duplication Modal for Expired Budgets */}
            {duplicateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setDuplicateModalOpen(false)}>
                    <div className="bg-[#1a1a1a] border border-white/10 p-6 rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-white mb-2">Duplicar Orçamento Expirado</h3>
                        <p className="text-sm text-white/50 mb-6">Este orçamento está expirado. Para copiá-lo e voltar a editá-lo, defina um novo nome e data de validade atualizada.</p>
                        
                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-xs font-medium text-white/70 mb-1.5">Novo Nome do Cliente/Projeto</label>
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                                    placeholder="Ex: Coca-cola (Nova Cópia)"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-white/70 mb-1.5">Nova Validade (em dias)</label>
                                <input
                                    type="number"
                                    value={newValidity}
                                    onChange={(e) => setNewValidity(e.target.value)}
                                    min="1"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                                    placeholder="15"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setDuplicateModalOpen(false)}
                                className="px-5 py-2 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => budgetToDuplicate && processDuplication(budgetToDuplicate.id, newName, newValidity)}
                                className="px-5 py-2 rounded-xl text-sm font-medium text-black bg-emerald-500 hover:bg-emerald-400 transition-colors"
                            >
                                Duplicar e Atualizar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
