"use client";

import { useState, useEffect } from "react";
import { AppsGrid } from "@/components/macos/AppsGrid";
import { AppItem } from "@/components/macos/AppItem";
import { toolsRegistry } from "@/features/tools/tools.registry";
import { AppWindow } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";

export default function ToolsPage() {
    const setCurrentApp = useAppStore((state) => state.setCurrentApp);
    const [isMounted, setIsMounted] = useState(false);
    const categories = ['Criatividade', 'Financeiro', 'Planejamento', 'Utilitários'] as const;

    useEffect(() => {
        setIsMounted(true);
        setCurrentApp(null);
    }, [setCurrentApp]);

    return (
        <div className={cn(
            "w-full h-full p-12 overflow-y-auto bg-black/20 transition-opacity duration-300",
            !isMounted ? "opacity-0" : "opacity-100"
        )}>
            <div className="max-w-6xl mx-auto space-y-16 pb-24">
                {categories.map(category => {
                    const tools = toolsRegistry.filter(t => t.category === category);
                    if (tools.length === 0) return null;

                    return (
                        <div key={category} className="space-y-8">
                            <div className="flex items-center gap-4 px-2">
                                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">
                                    {category}
                                </h2>
                                <div className="flex-1 h-px bg-white/5" />
                            </div>

                            <AppsGrid className="p-0 gap-10">
                                {tools.map((tool) => (
                                    <AppItem
                                        key={tool.id}
                                        id={tool.id}
                                        name={tool.name}
                                        icon={AppWindow}
                                        href={tool.isComingSoon ? `/tools/coming-soon?id=${tool.id}` : `/tools/${tool.id}`}
                                        version={tool.version}
                                        colorHex={tool.color}
                                        iconPath={tool.iconPath}
                                        isComingSoon={tool.isComingSoon}
                                    />
                                ))}
                            </AppsGrid>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
