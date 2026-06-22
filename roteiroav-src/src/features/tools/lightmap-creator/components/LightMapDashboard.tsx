"use client"

import { useEffect, useState } from "react";
import { useLightMapStore } from "../store/useLightMapStore";
import { RadialMenu } from "./RadialMenu";
import { RightSidebar } from "./RightSidebar";
import { BottomBar } from "./BottomBar";
import { SvgCanvas } from "./SvgCanvas";
import { TopMenuBar } from "./TopMenuBar";
import { StatusBar } from "./StatusBar";
import { useAppStore } from "@/store/useAppStore";

export function LightMapDashboard() {
    const { setIsTransitioning } = useAppStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        setTimeout(() => setIsTransitioning(false), 300);
    }, [setIsTransitioning]);

    if (!mounted) return null;

    return (
        <div className="flex flex-col h-[calc(100vh-3rem)] bg-[var(--macos-bg)] text-[var(--macos-text)] overflow-hidden font-sans select-none animate-in fade-in duration-700">
            <TopMenuBar />
            
            <div className="flex flex-1 overflow-hidden relative">
                <div className="flex-1 flex flex-col relative bg-[var(--macos-bg)] overflow-hidden">
                    <div className="flex-1 relative overflow-hidden">
                        <RadialMenu />
                        <SvgCanvas />
                    </div>
                    <BottomBar />
                </div>
                
                <RightSidebar />
            </div>

            <StatusBar />
        </div>
    );
}
