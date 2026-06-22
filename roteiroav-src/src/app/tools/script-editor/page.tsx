"use client";

import { useEffect, Suspense } from "react";
import { useAppStore } from "@/store/useAppStore";
import { ScriptDashboard } from "@/features/tools/script-editor/components/ScriptDashboard";

function ScriptEditorInner() {
    const setCurrentApp = useAppStore((s) => s.setCurrentApp);
    const applyMaximizeState = useAppStore((s) => s.applyMaximizeState);

    useEffect(() => {
        setCurrentApp("script-editor");
        applyMaximizeState(false);

        return () => {
            setCurrentApp(null);
        };
    }, [setCurrentApp, applyMaximizeState]);

    return (
        <div className="w-full h-full flex flex-col bg-[#0a0a0a]">
            <ScriptDashboard />
        </div>
    );
}

export default function ScriptEditorPage() {
    // Suspense is required by Next.js App Router when child components call
    // useSearchParams(). Without it, the entire subtree is deferred to the
    // client bundle and causes an extra render cycle delay.
    return (
        <Suspense>
            <ScriptEditorInner />
        </Suspense>
    );
}
