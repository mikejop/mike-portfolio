"use client"

import { useBudgetStore } from "../store/useBudgetStore";
import { Button } from "@/components/ui/button";
import { Upload, Download, FileText, RotateCcw } from "lucide-react";
import { exportBudgetToPDF } from "../utils/pdfExport";
import { useRef, useState } from "react";
import { useAppStore } from "@/store/useAppStore";

export function BudgetActions() {
    const store = useBudgetStore();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isExporting, setIsExporting] = useState(false);

    const handleExportPDF = async () => {
        setIsExporting(true);
        try {
            await exportBudgetToPDF(store);
        } finally {
            setIsExporting(false);
        }
    };

    const handleClear = async () => {
        if (await useAppStore.getState().requestConfirm("Novo Orçamento", "Limpar tudo e começar um novo orçamento?")) {
            store.clearAll();
        }
    };

    const handleExportJSON = () => {
        const data = {
            _format: 'hiro-orcamento-audiovisual',
            _version: '1.0',
            meta: store.meta,
            prestador: store.prestador,
            cliente: store.cliente,
            projeto: store.projeto,
            financeiro: store.financeiro,
            condicoes: store.condicoes,
            itens: store.itens
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `orcamento_${store.meta.num || '001'}_${(store.projeto.titulo || 'projeto').replace(/\s+/g, '_').toLowerCase()}.hiro`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const d = JSON.parse(ev.target?.result as string);
                if (d._format !== 'hiro-orcamento-audiovisual') throw new Error('Formato inválido');
                store.importHiro(d);
            } catch (err) {
                alert("Erro ao importar orçamento: Formato inválido.");
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    return (
        <div className="flex flex-wrap items-center justify-end gap-3 mt-8 pt-8 border-t border-border">
            <input
                type="file"
                className="hidden"
                accept=".hiro"
                ref={fileInputRef}
                onChange={handleImportJSON}
            />
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" />
                Importar Orçamento
            </Button>
            <Button variant="secondary" onClick={handleExportJSON} className="bg-[#4fb496]/10 text-[#5cb87a] hover:bg-[#4fb496]/20 border-[#4fb496]/30 border">
                <Download className="w-4 h-4 mr-2" />
                Salvar Orçamento
            </Button>
            <Button variant="outline" onClick={handleClear}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Novo Orçamento
            </Button>
            <Button
                onClick={handleExportPDF}
                loading={isExporting}
                className="bg-[#c4952a] text-black hover:bg-[#e8b84b] text-[15px] px-8 py-6 h-auto"
            >
                <FileText className="w-4 h-4 mr-2" />
                Exportar PDF
            </Button>
        </div>
    );
}
