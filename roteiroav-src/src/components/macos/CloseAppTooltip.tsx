"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";

export function CloseAppTooltip() {
    const { currentApp, hasSeenCloseTooltip, setHasSeenCloseTooltip } = useAppStore();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Only show if an app is open and we haven't seen the tooltip yet
        if (currentApp && !hasSeenCloseTooltip) {
            // Small delay so it animates in elegantly after the app opens
            const timer = setTimeout(() => {
                setIsVisible(true);
            }, 500);

            // Auto-hide after 6 seconds to prevent annoyance if they don't click it
            const hideTimer = setTimeout(() => {
                setIsVisible(false);
                setHasSeenCloseTooltip(true);
            }, 6500);

            return () => {
                clearTimeout(timer);
                clearTimeout(hideTimer);
            };
        } else {
            setIsVisible(false);
        }
    }, [currentApp, hasSeenCloseTooltip, setHasSeenCloseTooltip]);

    const handleDismiss = () => {
        setIsVisible(false);
        setHasSeenCloseTooltip(true);
    };

    if (!isVisible) return null;

    return (
        <div
            className={cn(
                "absolute top-full left-0 mt-2 z-50 w-[220px] p-3 rounded-xl",
                "bg-[var(--macos-sidebar)] border border-white/10 shadow-xl",
                "animate-in fade-in slide-in-from-top-2 duration-300"
            )}
            onClick={handleDismiss}
        >
            {/* Little arrow pointing up to the red button */}
            <div className="absolute -top-2 left-6 w-4 h-4 bg-[var(--macos-sidebar)] border-t border-l border-white/10 transform rotate-45" />

            <p className="relative text-xs text-[var(--macos-text)] leading-relaxed">
                To close this app and return to Dojo Utilities, click the red button.
            </p>
        </div>
    );
}
