"use client";

import { ReactNode } from "react";

interface FileListProps {
    children: ReactNode;
    viewMode?: "list" | "grid"; // For future expansion (Icon vs List view)
}

export function FileList({ children, viewMode = "list" }: FileListProps) {
    return (
        <div
            className={`
        w-full p-2 gap-x-2 gap-y-1 
        ${viewMode === "grid" ? "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5" : "flex flex-col"}
      `}
        >
            {children}
        </div>
    );
}
