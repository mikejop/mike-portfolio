"use client";

import { Clock, Users, AppWindow, FileText, Download, PlaySquare, Cloud, ChevronDown, Sparkles } from "lucide-react";
import { SidebarItem } from "./SidebarItem";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";
import { useState, useEffect, ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getTopApps } from "@/lib/firestore";
import { toolsRegistry } from "@/features/tools/tools.registry";

function SidebarSection({ title, children, defaultOpen = true }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="mb-6">
            <div
                className="px-5 flex items-center justify-between text-xs font-bold text-white/60 mb-1 uppercase tracking-wider cursor-pointer md:cursor-default group"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span>{title}</span>
                <ChevronDown className={cn("w-4 h-4 transition-transform md:hidden text-white/50 group-hover:text-white/80", isOpen ? "rotate-180" : "")} />
            </div>
            <div className={cn("transition-all duration-300 overflow-hidden md:!block", isOpen ? "block" : "hidden")}>
                {children}
            </div>
        </div>
    );
}

export function Sidebar() {
    const { currentApp, isTransitioning } = useAppStore();
    const isAppOpen = currentApp !== null;
    const isHiding = isAppOpen || isTransitioning;

    const { user } = useAuth();
    const [topApps, setTopApps] = useState<any[]>([]);

    useEffect(() => {
        const fetchTopApps = async () => {
            if (user) {
                const appIds = await getTopApps(user.uid, 2);
                const mappedApps = appIds.map(id => toolsRegistry.find(t => t.id === id)).filter(Boolean);
                setTopApps(mappedApps);
            }
        };
        fetchTopApps();
    }, [user]);

    return (
        <div
            className={cn(
                "h-full shrink-0 relative flex flex-col transition-all duration-500 ease-in-out z-20 overflow-hidden",
                isHiding ? "w-0 opacity-0" : "w-[220px] opacity-100"
            )}
        >
            {/* 1. Backdrop Layer: Strictly Glass Blur & Opacity */}
            <div
                className="absolute inset-0 bg-[#2c2c2c]/70 backdrop-blur-[24px] z-0"
                style={{
                    borderRight: '1px solid rgba(255, 255, 255, 0.1)'
                }}
            />

            {/* 3. SHARP Content Layer */}
            <div
                className="relative z-20 flex flex-col h-full pt-4 overflow-y-auto custom-scrollbar px-2"
            >
                {/* Shortcuts Section (Only Mobile) */}
                <div className="md:hidden">
                    <SidebarSection title="Atalhos" defaultOpen={true}>
                        {topApps.length > 0 ? (
                            topApps.map(app => (
                                <SidebarItem
                                    key={`shortcut-${app.id}`}
                                    iconPath={app.iconPath}
                                    icon={!app.iconPath ? Sparkles : undefined}
                                    label={app.name}
                                    href={app.route}
                                />
                            ))
                        ) : (
                            <div className="px-5 py-2 text-xs text-white/40 italic">Carregando...</div>
                        )}
                    </SidebarSection>
                </div>

                {/* Section */}
                <SidebarSection title="Geral" defaultOpen={true}>
                    <SidebarItem icon={Clock} label="Recents" href="/recent" exact />
                    <SidebarItem icon={Users} label="Shared" href="/shared" exact />
                </SidebarSection>

                {/* Section */}
                <SidebarSection title="Favorites" defaultOpen={true}>
                    <SidebarItem icon={AppWindow} label="Applications" href="/" />
                    <SidebarItem icon={FileText} label="Documents" href="/documents" />
                    <SidebarItem icon={Download} label="Downloads" href="/downloads" />
                    <SidebarItem icon={PlaySquare} label="Movies" href="/movies" />
                </SidebarSection>

                {/* Section */}
                <SidebarSection title="Locations" defaultOpen={true}>
                    <SidebarItem icon={Cloud} label="iCloud Drive" href="/icloud" />
                </SidebarSection>

                <div className="flex-1" />
            </div>
        </div>
    );
}
