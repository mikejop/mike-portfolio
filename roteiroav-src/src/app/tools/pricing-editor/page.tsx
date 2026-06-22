"use client"

import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { usePricingStore } from "@/features/tools/pricing-editor/store/usePricingStore";
import { Container } from "@/components/Container";
import { ProfessionSelector } from "@/features/tools/pricing-editor/components/ProfessionSelector";
import { JobTypeSelector } from "@/features/tools/pricing-editor/components/JobTypeSelector";
import { LocationSelector } from "@/features/tools/pricing-editor/components/LocationSelector";
import { ExperienceSlider } from "@/features/tools/pricing-editor/components/ExperienceSlider";
import { EquipmentSelector } from "@/features/tools/pricing-editor/components/EquipmentSelector";
import { DurationSelector } from "@/features/tools/pricing-editor/components/DurationSelector";
import { EquipmentModal } from "@/features/tools/pricing-editor/components/EquipmentModal";
import { ExpensesModal } from "@/features/tools/pricing-editor/components/ExpensesModal";
import { ResultPanel } from "@/features/tools/pricing-editor/components/ResultPanel";
import { Wallet, RotateCcw, Camera } from "lucide-react";

export default function PricingEditorPage() {
    const { setCurrentApp } = useAppStore();
    const {
        setShowExpensesModal,
        setShowEquipmentModal,
        hasExpensesSaved,
        userEquipments,
        updateUsdRate,
        reset
    } = usePricingStore();

    useEffect(() => {
        setCurrentApp("pricing-editor");
        updateUsdRate(); // Initialize with live dollar rate
        return () => setCurrentApp(null);
    }, []);

    return (
        <Container className="py-8 md:py-12">
            <div className="max-w-[1200px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl font-light text-muted-foreground">
                            <span className="font-semibold text-foreground">Precificação</span> Audiovisual
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Calcule quanto cobrar pelo seu trabalho de forma profissional
                        </p>
                    </div>
                    <div className="flex flex-wrap md:flex-nowrap items-center gap-2 w-full md:w-auto">
                        <button
                            onClick={() => setShowExpensesModal(true)}
                            className="flex-1 md:flex-none justify-center flex items-center gap-2 px-3 md:px-4 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 text-[11px] md:text-sm font-medium transition-all whitespace-nowrap"
                        >
                            <Wallet size={16} />
                            Despesas
                            {hasExpensesSaved && <span className="w-2 h-2 rounded-full bg-emerald-400"></span>}
                        </button>
                        <button
                            onClick={() => setShowEquipmentModal(true)}
                            className="flex-1 md:flex-none justify-center flex items-center gap-2 px-3 md:px-4 py-2.5 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 text-[11px] md:text-sm font-medium transition-all whitespace-nowrap"
                        >
                            <Camera size={16} />
                            Equips
                            {userEquipments.length > 0 && <span className="w-2 h-2 rounded-full bg-blue-400"></span>}
                        </button>
                        <button
                            onClick={reset}
                            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:border-border text-sm transition-all"
                        >
                            <RotateCcw size={14} />
                        </button>
                    </div>
                </div>

                {/* Split layout */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    {/* Left: Form - 3 columns */}
                    <div className="lg:col-span-3 space-y-8">
                        <div className="p-6 rounded-2xl border bg-card/50 space-y-8">
                            <JobTypeSelector />

                            <div className="h-px bg-border"></div>

                            <LocationSelector />

                            <div className="h-px bg-border"></div>

                            <ExperienceSlider />

                            <div className="h-px bg-border"></div>

                            <EquipmentSelector />

                            <div className="h-px bg-border"></div>

                            <DurationSelector />
                        </div>
                    </div>

                    {/* Right: Result - 2 columns */}
                    <div className="lg:col-span-2">
                        <div className="p-6 rounded-2xl border bg-card/50 sticky top-8">
                            <ResultPanel />
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <ExpensesModal />
            <EquipmentModal />
        </Container>
    );
}
