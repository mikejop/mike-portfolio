"use client";

import { LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface AppItemProps {
    id: string;
    name: string;
    icon: LucideIcon;
    href: string;
    colorHex?: string; // Optional brand color for the background
    iconPath?: string; // Path to custom SVG icon
    version?: string; // Specific app version
    isComingSoon?: boolean; // If true, the app is disabled and shows "Em Breve"
}

export function AppItem({
    id,
    name,
    icon: Icon,
    href,
    colorHex = "#3b82f6",
    iconPath,
    version,
    isComingSoon = false
}: AppItemProps) {
    const { setCurrentApp, setIsTransitioning } = useAppStore();
    const router = useRouter();

    const handleClick = async (e: React.MouseEvent) => {
        if (isComingSoon) {
            e.preventDefault();
            return;
        }

        e.preventDefault();
        setIsTransitioning(true);

        // Wait for fade out animation (500ms)
        await new Promise(resolve => setTimeout(resolve, 500));

        setCurrentApp(id);
        router.push(href);

        // Short delay to ensure navigation starts before resetting state
        setTimeout(() => setIsTransitioning(false), 100);
    };

    const iconContent = (
        <div
            className={cn(
                "w-[72px] h-[72px] flex items-center justify-center rounded-[20px] overflow-hidden relative",
                "shadow-[0_6px_16px_rgba(0,0,0,0.35)]",
                "transition-all duration-150",
                !isComingSoon && "group-hover:scale-105 group-hover:shadow-[0_8px_20px_rgba(0,0,0,0.45)] active:scale-95",
                isComingSoon && "grayscale opacity-60 cursor-not-allowed",
                !iconPath && "bg-blue-500"
            )}
            style={(!iconPath && !isComingSoon) ? { backgroundColor: colorHex } : (!iconPath && isComingSoon ? { backgroundColor: '#4b5563' } : {})}
        >
            {iconPath ? (
                <img
                    src={iconPath}
                    alt={name}
                    className="w-full h-full object-cover"
                />
            ) : (
                <Icon className="w-8 h-8 text-white" strokeWidth={1.5} />
            )}

            {/* Overlay for coming soon if needed or just handled by styles */}
        </div>
    );

    return (
        <div className="flex flex-col items-center gap-1 group select-none py-1">
            {/* Click Restricted to Icon Only */}
            {isComingSoon ? (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger className="cursor-not-allowed outline-none">
                            {iconContent}
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="bg-black/90 text-white border-white/10 text-xs py-1 px-2">
                            <p>Em Breve</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            ) : (
                <button
                    onClick={handleClick}
                    className="cursor-pointer appearance-none bg-transparent border-none p-0 outline-none"
                    aria-label={`Abrir ${name}`}
                >
                    {iconContent}
                </button>
            )}

            {/* App Name & Version */}
            <div className="flex flex-col items-center">
                <span className={cn(
                    "text-[13px] font-medium text-center max-w-[90px] leading-tight transition-colors",
                    isComingSoon ? "text-gray-600" : "text-[#d1d5db]"
                )}>
                    {name}
                </span>
                {!isComingSoon && version && (
                    <span className="text-[9px] font-bold text-[var(--macos-text-secondary)]/40 mt-0.5">
                        {version.includes("rc") ? "RC1" : (version.includes("beta") ? "BETA" : "")}
                    </span>
                )}
            </div>
        </div>
    );
}
