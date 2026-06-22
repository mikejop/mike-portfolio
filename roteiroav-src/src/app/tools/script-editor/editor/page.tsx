"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ScriptEditor } from "@/features/tools/script-editor/components/editor/ScriptEditor";
import { useAppStore } from "@/store/useAppStore";

function EditorContent() {
    const searchParams = useSearchParams();
    const id = searchParams.get("id");
    const ownerId = searchParams.get("ownerId");
    const roomId = searchParams.get("roomId");
    const router = useRouter();

    useEffect(() => {
        if (id) {
            const params = new URLSearchParams();
            params.set("id", id);
            if (roomId) params.set("roomId", roomId);
            if (ownerId) params.set("ownerId", ownerId);
            router.replace(`/tools/script-editor?${params.toString()}`);
        } else {
            router.replace("/tools/script-editor");
        }
    }, [id, roomId, ownerId, router]);

    return null;
}

export default function ScriptEditorPage() {
    return (
        <Suspense fallback={null}>
            <EditorContent />
        </Suspense>
    );
}

