"use client";

import { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Container } from "@/components/Container";
import { Card, CardTitle, CardDescription, CardHeader } from "@/components/ui/card";
import { icons } from "lucide-react";
import { cn } from "@/lib/utils";

export function ToolContent({ toolData }: { toolData: any }) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const iconName = toolData.icon
        ? toolData.icon
            .split("-")
            .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
            .join("") as keyof typeof icons
        : "AppWindow";

    const LucideIcon = icons[iconName] || icons.AppWindow;

    return (
        <Container className={cn(
            "py-12 md:py-16 transition-opacity duration-500 ease-in-out",
            isMounted ? "opacity-100" : "opacity-0"
        )}>
            <div className="max-w-3xl mx-auto space-y-8">
                <div className="flex items-center gap-4 border-b pb-6 border-white/10">
                    <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-[var(--macos-text)]">
                        {LucideIcon && <LucideIcon className="w-8 h-8" />}
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--macos-text)]">{toolData.name}</h1>
                        <p className="text-lg text-[var(--macos-text-secondary)] mt-1">{toolData.description}</p>
                    </div>
                </div>

                <Card className="border-dashed bg-white/5 border-white/10">
                    <CardHeader className="text-center py-12">
                        <CardTitle className="text-2xl text-[var(--macos-text-secondary)]">Em Breve</CardTitle>
                        <CardDescription className="text-lg mt-2 text-[var(--macos-text-secondary)]/60">
                            O módulo {toolData.name} está atualmente em desenvolvimento.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        </Container>
    );
}
