"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";

import { useRandomBackground } from "@/hooks/useRandomBackground";

interface WindowContainerProps {
    children: ReactNode;
    className?: string;
}

export function WindowContainer({ children, className }: WindowContainerProps) {
    const isMaximized = useAppStore((state) => state.isMaximized);
    const bgStyle = useRandomBackground();

    return (
        <div
            className={cn(
                "min-h-screen flex items-center justify-center relative overflow-hidden transition-all duration-500 animate-in fade-in duration-1000 fill-mode-both bg-[#000]",
                isMaximized ? "p-0" : "p-4 sm:p-8 md:p-12"
            )}
        >
            {/* Blurred Background Layer */}
            <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-500 pointer-events-none scale-105"
                style={{
                    ...bgStyle,
                    filter: "blur(8px)"
                }}
            />

            {/* The main macOS Window Shell */}
            <div
                className={cn(
                    "flex flex-col transition-all duration-500 ease-in-out overflow-hidden relative z-10",
                    isMaximized
                        ? "w-full h-screen rounded-none"
                        : "w-full h-screen rounded-none md:max-w-[1280px] md:h-[85vh] md:rounded-[20px] md:shadow-2xl md:ring-1 md:ring-white/10",
                    className
                )}
                style={{
                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.05)"
                }}
            >
                {children}
            </div>
        </div>
    );
}
