import React, { useState, useEffect } from "react";
import { X, FileSpreadsheet, FileText, Download, Loader2 } from "lucide-react";
import { collection, getDocs, query, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import * as xlsx from "xlsx";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { differenceInDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";

(pdfMake as any).vfs = (pdfFonts as any).pdfMake ? (pdfFonts as any).pdfMake.vfs : (pdfFonts as any).vfs;

interface StatsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function BudgetStatsModal({ isOpen, onClose }: StatsModalProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    
    const [stats, setStats] = useState({
        aprovados: { count: 0, total: 0 },
        recusados: { count: 0, total: 0 },
        pendentes: { count: 0, total: 0 },
        expirados: { count: 0, total: 0 },
        totalGeral: { count: 0, total: 0 }
    });

    const [rawData, setRawData] = useState<any[]>([]);

    useEffect(() => {
        if (isOpen && user) {
            fetchStats();
        }
    }, [isOpen, user]);

    const calcBudgetTotal = (b: any): number => {
        const sections = ["pre", "live", "pos", "3d", "desp"];
        let subtotal = 0;
        sections.forEach(sec => {
            const items = b.itens?.[sec];
            if (Array.isArray(items)) {
                items.forEach((item: any) => {
                    subtotal += Number(item.total || 0);
                });
            }
        });
        const descPct = Number(b.financeiro?.descPct || 0);
        const discountVal = subtotal * (descPct / 100);
        const baseCalc = subtotal - discountVal;
        const iss = baseCalc * 0.06;
        return baseCalc + iss;
    };

    const fetchStats = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "users", user!.uid, "budgets"), limit(500));
            const snapshot = await getDocs(q);
            
            let aprovados = { count: 0, total: 0 };
            let recusados = { count: 0, total: 0 };
            let pendentes = { count: 0, total: 0 };
            let expirados = { count: 0, total: 0 };
            let totalGeral = { count: 0, total: 0 };
            
            const raw: any[] = [];

            snapshot.forEach(doc => {
                const b = doc.data();
                const total = calcBudgetTotal(b);
                let status = b.meta?.status || "Pendente";
                
                // Expiration Check
                if (status !== "Aprovado" && status !== "Recusado" && b.meta?.data) {
                    const diff = differenceInDays(new Date(), new Date(b.meta.data));
                    const val = parseInt(b.meta?.validade || "15", 10);
                    if (diff > val) status = "Expirado";
                }

                raw.push({ ...b, id: doc.id, computedStatus: status, computedTotal: total });

                totalGeral.count++;
                totalGeral.total += total;

                switch (status) {
                    case "Aprovado": aprovados.count++; aprovados.total += total; break;
                    case "Recusado": recusados.count++; recusados.total += total; break;
                    case "Expirado": expirados.count++; expirados.total += total; break;
                    default: pendentes.count++; pendentes.total += total; break; // Pendente
                }
            });

            setStats({ aprovados, recusados, pendentes, expirados, totalGeral });
            setRawData(raw);

        } catch (error) {
            console.error("Error fetching stats:", error);
            alert("Erro ao buscar estatísticas.");
        } finally {
            setLoading(false);
        }
    };

    const formatBRL = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    const getExportData = () => {
        return rawData.map(b => ({
            "Número": b.meta?.num || "-",
            "Cliente": b.cliente?.nome || "-",
            "Projeto": b.projeto?.titulo || "-",
            "Data de Criação": b.meta?.data ? format(new Date(b.meta.data), "dd/MM/yyyy", { locale: ptBR }) : "-",
            "Validade (Dias)": b.meta?.validade || "15",
            "Status": b.computedStatus,
            "Valor Total": b.computedTotal || 0,
        }));
    };

    const exportToXLSX = () => {
        const ws = xlsx.utils.json_to_sheet(getExportData());
        const wb = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(wb, ws, "Orçamentos");
        xlsx.writeFile(wb, `Estatisticas_Orcamentos_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    };

    const exportToMD = () => {
        const data = getExportData();
        let md = `# Estatísticas de Orçamentos\nGerado em: ${format(new Date(), "dd/MM/yyyy HH:mm")}\n\n`;
        
        md += `## Resumo Geral\n`;
        md += `- **Orçamentos Totais**: ${stats.totalGeral.count} (${formatBRL(stats.totalGeral.total)})\n`;
        md += `- **Aprovados**: ${stats.aprovados.count} (${formatBRL(stats.aprovados.total)})\n`;
        md += `- **Pendentes**: ${stats.pendentes.count} (${formatBRL(stats.pendentes.total)})\n`;
        md += `- **Expirados**: ${stats.expirados.count} (${formatBRL(stats.expirados.total)})\n`;
        md += `- **Recusados**: ${stats.recusados.count} (${formatBRL(stats.recusados.total)})\n\n`;

        md += `## Lista de Orçamentos\n`;
        md += `| Número | Cliente | Status | Valor Total |\n`;
        md += `|---|---|---|---|\n`;
        data.forEach(row => {
            md += `| ${row["Número"]} | ${row["Cliente"]} | ${row["Status"]} | ${formatBRL(Number(row["Valor Total"]))} |\n`;
        });

        const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Estatisticas_Orcamentos_${format(new Date(), 'yyyy-MM-dd')}.md`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const exportToPDF = () => {
        const data = getExportData();
        const tableBody = [];
        
        // Headers
        tableBody.push([
            { text: 'Número', style: 'tableHeader' }, 
            { text: 'Cliente', style: 'tableHeader' }, 
            { text: 'Status', style: 'tableHeader' }, 
            { text: 'Valor Total', style: 'tableHeader' }
        ]);

        // Rows
        data.forEach(row => {
            tableBody.push([
                row["Número"],
                row["Cliente"],
                row["Status"],
                formatBRL(Number(row["Valor Total"]))
            ]);
        });

        const docDefinition: any = {
            content: [
                { text: 'Relatório de Estatísticas de Orçamentos', style: 'header' },
                { text: `Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, margin: [0, 0, 0, 20], color: 'gray' },
                
                { text: 'Resumo', style: 'subheader' },
                {
                    ul: [
                        `Total Geral: ${stats.totalGeral.count} (${formatBRL(stats.totalGeral.total)})`,
                        `Aprovados: ${stats.aprovados.count} (${formatBRL(stats.aprovados.total)})`,
                        `Pendentes: ${stats.pendentes.count} (${formatBRL(stats.pendentes.total)})`,
                        `Expirados: ${stats.expirados.count} (${formatBRL(stats.expirados.total)})`,
                        `Recusados: ${stats.recusados.count} (${formatBRL(stats.recusados.total)})`,
                    ],
                    margin: [0, 0, 0, 20]
                },

                { text: 'Detalhamento', style: 'subheader' },
                {
                    table: {
                        headerRows: 1,
                        widths: ['auto', '*', 'auto', 'auto'],
                        body: tableBody
                    },
                    layout: 'lightHorizontalLines'
                }
            ],
            styles: {
                header: { fontSize: 18, bold: true, margin: [0, 0, 0, 5] },
                subheader: { fontSize: 14, bold: true, margin: [0, 10, 0, 5] },
                tableHeader: { bold: true, fontSize: 11, color: 'black' }
            },
            defaultStyle: {
                fontSize: 10
            }
        };

        pdfMake.createPdf(docDefinition).download(`Estatisticas_Orcamentos_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-[#1a1a1a] border border-white/10 p-6 rounded-2xl w-full max-w-4xl shadow-2xl overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
                
                <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
                    <h2 className="text-2xl font-bold text-white">Estatísticas de Orçamentos</h2>
                    <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mb-4" />
                        <p className="text-white/50 text-sm">Calculando métricas...</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        
                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl">
                                <h4 className="text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">Aprovados ({stats.aprovados.count})</h4>
                                <p className="text-2xl font-bold text-white">{formatBRL(stats.aprovados.total)}</p>
                            </div>
                            
                            <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl">
                                <h4 className="text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">Pendentes ({stats.pendentes.count})</h4>
                                <p className="text-2xl font-bold text-white">{formatBRL(stats.pendentes.total)}</p>
                            </div>

                            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl">
                                <h4 className="text-amber-500 text-xs font-bold uppercase tracking-wider mb-1">Expirados ({stats.expirados.count})</h4>
                                <p className="text-2xl font-bold text-white">{formatBRL(stats.expirados.total)}</p>
                            </div>

                            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl">
                                <h4 className="text-red-400 text-xs font-bold uppercase tracking-wider mb-1">Recusados ({stats.recusados.count})</h4>
                                <p className="text-2xl font-bold text-white">{formatBRL(stats.recusados.total)}</p>
                            </div>
                        </div>

                        <div className="bg-white/5 border border-white/10 p-5 rounded-xl flex items-center justify-between">
                            <div>
                                <h4 className="text-white/50 text-xs font-bold uppercase tracking-wider mb-1">Total Geral ({stats.totalGeral.count})</h4>
                                <p className="text-xl font-bold text-white">{formatBRL(stats.totalGeral.total)}</p>
                            </div>
                        </div>

                        {/* Export Actions */}
                        <div>
                            <h3 className="text-sm font-semibold text-white mb-4">Exportar Relatório</h3>
                            <div className="flex flex-wrap gap-3">
                                <button
                                    onClick={exportToXLSX}
                                    className="flex items-center gap-2 bg-[#1d6f42] hover:bg-[#1d6f42]/80 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
                                >
                                    <FileSpreadsheet className="h-4 w-4" />
                                    Planilha Excel (.xlsx)
                                </button>
                                
                                <button
                                    onClick={exportToPDF}
                                    className="flex items-center gap-2 bg-[#d13b3b] hover:bg-[#d13b3b]/80 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
                                >
                                    <Download className="h-4 w-4" />
                                    Documento PDF (.pdf)
                                </button>

                                <button
                                    onClick={exportToMD}
                                    className="flex items-center gap-2 bg-[#333] hover:bg-[#444] text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors border border-white/10"
                                >
                                    <FileText className="h-4 w-4" />
                                    Markdown (.md)
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
