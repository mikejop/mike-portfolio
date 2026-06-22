"use client";

import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarItemProps {
    icon?: LucideIcon;
    iconPath?: string;
    label: string;
    href: string;
    exact?: boolean;
}

export function SidebarItem({ icon: Icon, iconPath, label, href, exact }: SidebarItemProps) {
    const pathname = usePathname();
    const isActive = exact ? pathname === href : pathname.startsWith(href);

    return (
        <Link
            href={href}
            className={cn(
                "flex items-center gap-2.5 px-3 py-1.5 mx-2 rounded-md transition-colors text-sm font-medium",
                isActive
                    ? "bg-[var(--macos-selected)] text-white"
                    : "text-[var(--macos-text)] hover:bg-[var(--macos-hover)]"
            )}
        >
            {Icon && (
                <Icon
                    className={cn(
                        "w-4 h-4",
                        isActive ? "text-white" : "text-[var(--macos-selected)]"
                    )}
                />
            )}
            {iconPath && (
                <div className="w-4 h-4 flex items-center justify-center shrink-0">
                    <img src={iconPath} alt={label} className="w-full h-full object-contain" />
                </div>
            )}
            <span className="truncate">{label}</span>
        </Link>
    );
}
