"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AppsGridProps {
    children: ReactNode;
    className?: string;
}

export function AppsGrid({ children, className }: AppsGridProps) {
    return (
        <div
            className={cn(
                "w-full grid gap-x-8 gap-y-4 justify-start",
                className
            )}
            style={{
                gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))"
            }}
        >
            {children}
        </div>
    );
}
