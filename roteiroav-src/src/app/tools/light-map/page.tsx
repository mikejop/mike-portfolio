"use client"

import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { useRouter } from "next/navigation";
import { LightMapDashboard } from "@/features/tools/lightmap-creator/components/LightMapDashboard";

export default function LightMapPage() {
    const { setCurrentApp, setAppBackHandler, setIsTransitioning } = useAppStore();
    const router = useRouter();

    useEffect(() => {
        setCurrentApp("light-map");

        // Custom back handler for the tool -> go to home
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
        <div className="w-full h-full animate-in fade-in duration-500 overflow-hidden bg-[#111318]">
            <LightMapDashboard />
        </div>
    );
}
