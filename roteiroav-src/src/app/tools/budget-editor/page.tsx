"use client"

import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Container } from "@/components/Container";
import { BudgetDashboard } from "@/features/tools/budget-editor/components/BudgetDashboard";
import { useRouter } from "next/navigation";

export default function BudgetEditorDashboardPage() {
    const { setCurrentApp, setAppBackHandler, setIsTransitioning } = useAppStore();
    const router = useRouter();

    useEffect(() => {
        setCurrentApp("budget-editor");

        // Custom back handler for the dashboard -> go to home
        setAppBackHandler(async () => {
            setIsTransitioning(true);
            await new Promise(resolve => setTimeout(resolve, 500));
            setCurrentApp(null);
            router.push("/");
            setTimeout(() => setIsTransitioning(false), 100);
        });

        return () => {
            setCurrentApp(null);
            setAppBackHandler(null);
        };
    }, [setCurrentApp, setAppBackHandler, setIsTransitioning, router]);

    return (
        <Container className="py-12 md:py-16">
            <div className="max-w-[1000px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                <BudgetDashboard />
            </div>
        </Container>
    );
}
