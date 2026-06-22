"use client";

import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface FileItemProps {
    id: string;
    name: string;
    icon: LucideIcon;
    href: string;
    version?: string;
    isActiveOverride?: boolean;
    isComingSoon?: boolean;
}

export function FileItem({ name, icon: Icon, href, id, version, isActiveOverride, isComingSoon }: FileItemProps) {
    const pathname = usePathname();
    const isCurrentlyActive = isActiveOverride ?? pathname.startsWith(href);

    const content = (
        <div
            className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-all select-none group relative",
                isCurrentlyActive
                    ? "bg-[var(--macos-selected)] text-white"
                    : "text-[var(--macos-text)] hover:bg-[var(--macos-hover)]",
                isComingSoon && "opacity-50 grayscale cursor-not-allowed hover:bg-transparent"
            )}
        >
            <Icon
                className={cn(
                    "w-8 h-8 transition-transform group-hover:scale-105",
                    isCurrentlyActive ? "text-white" : "text-[#4dabf7]" // generic blue folder icon color
                )}
                strokeWidth={1.5}
            />
            <div className="flex flex-col">
                <span className="text-[13px] font-medium leading-tight truncate max-w-[200px]">{name}</span>
                {isComingSoon ? (
                    <span className="text-[9px] font-bold uppercase tracking-[0.05em] text-amber-500/80 mt-0.5">Em Breve</span>
                ) : (
                    version && (
                        <span className="text-[9px] font-bold text-[var(--macos-text-secondary)]/40 mt-0.5">
                            {version.includes("rc") ? "RC1" : (version.includes("beta") ? "BETA" : "")}
                        </span>
                    )
                )}
            </div>

            {isComingSoon && (
                <div className="absolute inset-0 z-10" title="Este app estará disponível em breve!" />
            )}
        </div>
    );

    if (isComingSoon) {
        return content;
    }

    return (
        <Link href={href}>
            {content}
        </Link>
    );
}
