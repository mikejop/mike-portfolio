"use client";

import { use } from "react";
import { toolsRegistry } from "@/features/tools/tools.registry";
import { ToolContent } from "@/components/ToolContent";
import { notFound } from "next/navigation";

interface PageProps {
    searchParams: Promise<{ id?: string }>;
}

export default function ComingSoonPage({ searchParams }: PageProps) {
    const { id } = use(searchParams);
    const toolData = toolsRegistry.find((t) => t.id === id);

    if (!toolData) {
        notFound();
    }

    return (
        <ToolContent toolData={toolData} />
    );
}
