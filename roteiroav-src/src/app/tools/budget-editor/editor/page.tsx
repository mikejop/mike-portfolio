"use client"

import { useEffect, useState } from "react";
import { useBudgetStore } from "@/features/tools/budget-editor/store/useBudgetStore";
import { useAppStore } from "@/store/useAppStore";
import { Container } from "@/components/Container";
import { BudgetHeader } from "@/features/tools/budget-editor/components/BudgetHeader";
import { BudgetForms } from "@/features/tools/budget-editor/components/BudgetForms";
import { BudgetTable } from "@/features/tools/budget-editor/components/BudgetTable";
import { BudgetSummary } from "@/features/tools/budget-editor/components/BudgetSummary";
import { BudgetActions } from "@/features/tools/budget-editor/components/BudgetActions";
import { Loader2 } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";


export default function BudgetEditorPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const isPrint = searchParams.get('print') === 'true';

    const { loadBudgetFromFirestore } = useBudgetStore();
    const { setCurrentApp, setAppBackHandler, setIsTransitioning } = useAppStore();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setCurrentApp("budget-editor");

        // Custom back handler for the editor -> go to budget dashboard
        setAppBackHandler(async () => {
            setIsTransitioning(true);
            await new Promise(resolve => setTimeout(resolve, 500));
            router.push("/tools/budget-editor");
            setTimeout(() => setIsTransitioning(false), 100);
        });

        const init = async () => {
            if (id) {
                await loadBudgetFromFirestore(id);
            }
            setLoading(false);

            if (isPrint) {
                // Pequeno delay para garantir que as tabelas renderizaram
                setTimeout(() => {
                    window.print();
                }, 500);
            }
        };

        init();

        return () => {
            setCurrentApp(null);
            setAppBackHandler(null);
        };
    }, [id, loadBudgetFromFirestore, setCurrentApp, setAppBackHandler, setIsTransitioning, router, isPrint]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-white/20" />
            </div>
        );
    }

    return (
        <Container className="py-12 md:py-16">
            <div className="max-w-[1000px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                <BudgetHeader />

                <div className="space-y-12">

                    <BudgetForms />

                    <div>
                        <div className="text-[11px] font-semibold tracking-widest uppercase text-primary mb-4 flex items-center gap-3">
                            04 — Itens do Orçamento
                            <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent"></div>
                        </div>

                        <BudgetTable sectionKey="pre" title="Pré-Produção" themeColor="#4fb496" themeBg="bg-[#4fb496]/10" />
                        <BudgetTable sectionKey="live" title="Produção — Live Action" themeColor="#4f78c7" themeBg="bg-[#4f78c7]/10" />
                        <BudgetTable sectionKey="pos" title="Pós-Produção" themeColor="#c7784f" themeBg="bg-[#c7784f]/10" />
                        <BudgetTable sectionKey="3d" title="3D / CGI / Animação" themeColor="#8c4fc7" themeBg="bg-[#8c4fc7]/10" />
                        <BudgetTable sectionKey="desp" title="Despesas Gerais & Produção Executiva" themeColor="#b4b44f" themeBg="bg-[#b4b44f]/10" />
                    </div>

                    <BudgetSummary />
                    <BudgetActions />
                </div>
            </div>
        </Container>
    );
}
