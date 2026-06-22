"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import { toolsRegistry } from "@/features/tools/tools.registry";
import { useRouter } from "next/navigation";
import { CloseAppTooltip } from "./CloseAppTooltip";
import { VERSION, LAST_UPDATE, BUILD_NUMBER, PHASE } from "@/version";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { UserProfile } from "@/lib/firestore";
import { User as UserIcon, Settings, LogOut, Sidebar, Home } from "lucide-react";

interface TopBarProps {
    title?: string;
    className?: string;
}

export function TopBar({ title, className }: TopBarProps) {
    const { 
        currentApp, 
        setCurrentApp, 
        toggleMaximized, 
        setIsTransitioning, 
        appBackHandler, 
        setShowLogoutConfirm,
        appTitle,
        isProjectSidebarOpen,
        toggleProjectSidebar
    } = useAppStore();
    const router = useRouter();
    const { user, profile } = useAuth();

    // Determine the title dynamically
    let displayTitle = appTitle || title || "Roteiro AV";
    let appVersion = VERSION;
    let appPhase = PHASE;

    if (currentApp && !appTitle) {
        const appInfo = toolsRegistry.find((t) => t.id === currentApp);
        if (appInfo) {
            displayTitle = appInfo.name;
            if (appInfo.version) appVersion = appInfo.version;
            if (appInfo.phase) appPhase = appInfo.phase;
        }
    }

    const phaseColors: Record<string, string> = {
        alpha: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400",
        beta: "bg-amber-500/10 border-amber-500/20 text-amber-500",
        rc: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
        stable: "bg-blue-500/10 border-blue-500/20 text-blue-400"
    };

    const handleCloseApp = async () => {
        setShowLogoutConfirm(true);
    };

    return (
        <div
            className={cn(
                "h-12 w-full flex items-center px-2 md:px-4 shrink-0 relative",
                "bg-[var(--macos-bg)] md:rounded-t-[20px] border-b border-[var(--macos-hover)]/30",
                className
            )}
            style={{
                WebkitAppRegion: 'drag' // Makes it drift-draggable in Electron/Tauri environments
            } as React.CSSProperties}
        >
            {/* Left Side Controls */}
            <div className="flex items-center gap-2 z-10 w-1/3 relative">
                {/* Traffic Lights (Desktop Only) */}
                <div className="hidden md:flex items-center gap-2">
                    <button
                        onClick={handleCloseApp}
                        className={cn(
                            "w-3 h-3 rounded-full border flex items-center justify-center group outline-none hover:opacity-100 transition-opacity",
                            "bg-[#ff5f56] border-[#e0443e]"
                        )}
                        title={currentApp ? "Fechar app" : "Deslogar"}
                    >
                        <span className="opacity-0 group-hover:opacity-100 text-[#4d0000] text-[8px] leading-none font-bold">×</span>
                    </button>
                    {currentApp && (
                        <button
                            onClick={toggleProjectSidebar}
                            className={cn(
                                "w-3 h-3 rounded-full border flex items-center justify-center group/min outline-none hover:opacity-100 transition-opacity",
                                "bg-[#ffbd2e] border-[#de9e20]"
                            )}
                            title={isProjectSidebarOpen ? "Minimizar Menu" : "Maximizar Menu"}
                        >
                            <span className="opacity-0 group-hover/min:opacity-100 text-[#5c3e00] text-[8px] leading-none font-bold">-</span>
                        </button>
                    )}
                    <button
                        onClick={toggleMaximized}
                        className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29] flex items-center justify-center group/max"
                    >
                        <span className="opacity-0 group-hover/max:opacity-100 text-[#006400] text-[7px] leading-none font-extrabold">+</span>
                    </button>

                    {currentApp && (
                        <>
                            <button
                                onClick={async () => {
                                    if (appBackHandler) {
                                        appBackHandler();
                                    } else {
                                        // Robust fallback: try to navigate to the base tool path or home
                                        const pathSegments = window.location.pathname.split('/').filter(Boolean);
                                        if (pathSegments.length > 2) {
                                            // We are in a sub-route (e.g., /tools/script-editor/editor), go back to the app root
                                            router.push(`/${pathSegments[0]}/${pathSegments[1]}`);
                                        } else {
                                            // We are at the app root, go to home
                                            router.push('/');
                                        }
                                    }
                                }}
                                className="ml-2 w-6 h-6 rounded-md flex items-center justify-center text-[var(--macos-text-secondary)] hover:text-[var(--macos-text)] hover:bg-white/10 transition-colors"
                                title="Voltar"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="m15 18-6-6 6-6" />
                                </svg>
                            </button>
                            <button
                                onClick={toggleProjectSidebar}
                                className="ml-1 w-6 h-6 rounded-md flex items-center justify-center text-[var(--macos-text-secondary)] hover:text-[var(--macos-text)] hover:bg-white/10 transition-colors cursor-pointer"
                                title={isProjectSidebarOpen ? "Recolher Sidebar" : "Expandir Sidebar"}
                            >
                                <Sidebar size={13} className={cn("transition-colors", isProjectSidebarOpen ? "text-amber-500" : "text-[var(--macos-text-secondary)]")} />
                            </button>
                            <button
                                onClick={() => {
                                    router.push("/tools/script-editor/");
                                }}
                                className="ml-1 w-6 h-6 rounded-md flex items-center justify-center text-[var(--macos-text-secondary)] hover:text-[var(--macos-text)] hover:bg-white/10 transition-colors cursor-pointer"
                                title="Início / Dashboard dos Roteiros"
                            >
                                <Home size={13} className="text-[var(--macos-text-secondary)] hover:text-[var(--macos-text)]" />
                            </button>
                        </>
                    )}
                </div>

                {/* Mobile Back Button */}
                <div className="md:hidden flex items-center gap-1">
                    <button
                        onClick={async () => {
                            if (appBackHandler) {
                                appBackHandler();
                            } else if (currentApp) {
                                handleCloseApp();
                            } else {
                                router.back();
                            }
                        }}
                        className="flex items-center gap-1 text-[var(--macos-text)]/80 hover:text-white transition-colors py-2 pr-2"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m15 18-6-6 6-6" />
                        </svg>
                    </button>
                    {currentApp && (
                        <>
                            <button
                                onClick={toggleProjectSidebar}
                                className="flex items-center justify-center text-[var(--macos-text)]/80 hover:text-white transition-colors p-2 cursor-pointer"
                                title={isProjectSidebarOpen ? "Recolher Sidebar" : "Expandir Sidebar"}
                            >
                                <Sidebar size={16} className={isProjectSidebarOpen ? "text-amber-500" : "text-[var(--macos-text)]/80"} />
                            </button>
                            <button
                                onClick={() => {
                                    router.push("/tools/script-editor/");
                                }}
                                className="flex items-center justify-center text-[var(--macos-text)]/80 hover:text-white transition-colors p-2 cursor-pointer"
                                title="Início / Dashboard dos Roteiros"
                            >
                                <Home size={16} className="text-[var(--macos-text)]/80" />
                            </button>
                        </>
                    )}
                </div>

                <CloseAppTooltip />
            </div>

            {/* Title (Centered absolutely if passed) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none fade-in duration-300">
                <div className="flex items-center gap-3 pointer-events-auto py-1">
                    <span 
                        onClick={() => router.push("/tools/script-editor/")}
                        className="text-sm font-medium text-[var(--macos-text-secondary)] hover:text-white transition-colors text-center max-w-[150px] md:max-w-[200px] leading-tight flex-shrink-0 truncate cursor-pointer select-none"
                    >
                        {displayTitle}
                    </span>
                    <TooltipProvider delay={0}>
                        <Tooltip>
                            <TooltipTrigger>
                                <span className={cn(
                                    "px-2 py-0.5 rounded-full border text-[9px] font-bold cursor-help select-none pointer-events-auto flex items-center gap-1.5 uppercase tracking-wider",
                                    phaseColors[appPhase] || phaseColors.alpha,
                                    "hidden sm:flex" // Hide version pill on very small screens to save space
                                )}>
                                    {appPhase} <span className="opacity-40 font-normal">v{appVersion}</span>
                                </span>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="bg-[#1a1a1a] border-[#333] text-[var(--macos-text)] py-2 px-3 shadow-xl">
                                <div className="space-y-1">
                                    <p className="font-bold text-xs text-white">{currentApp ? displayTitle : 'Roteiro AV'}</p>
                                    <div className="flex items-center gap-2 text-[10px] text-[var(--macos-text-secondary)]">
                                        <span>Versão: {appVersion}</span>
                                        <span>•</span>
                                        <span>Build: #{BUILD_NUMBER}</span>
                                    </div>
                                    <p className="text-[9px] text-[var(--macos-text-secondary)]/50 italic font-normal">Última atualização: {LAST_UPDATE}</p>
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>

            {/* User Profile (Right Side) */}
            <div className="flex items-center justify-end flex-1 gap-2 md:gap-4 z-10 relative">
                {user && (
                    <button
                        onClick={() => router.push('/settings')}
                        className="flex items-center gap-2 px-2 md:px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors group"
                    >
                        <div className="hidden md:flex flex-col items-end">
                            <span className="text-[11px] font-medium text-[var(--macos-text)] group-hover:text-white transition-colors truncate max-w-[100px]">
                                {profile?.displayName || user.displayName || user.email?.split('@')[0] || "Usuário"}
                            </span>
                            <span className="text-[9px] text-[var(--macos-text-secondary)] opacity-60">Configurações</span>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/5 group-hover:border-white/20 transition-all shrink-0 overflow-hidden">
                            {(profile?.photoURL || user?.photoURL) ? (
                                <img src={profile?.photoURL || user?.photoURL || ""} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <UserIcon className="w-4 h-4 text-[var(--macos-text-secondary)] group-hover:text-white" />
                            )}
                        </div>
                    </button>
                )}
            </div>

        </div>
    );
}
