"use client";

import { useScriptStore } from "../store/useScriptStore";
import { ScriptCard } from "./ScriptCard";
import { useRouter } from "next/navigation";

export function SharedScripts() {
    const router = useRouter();
    const { sharedScripts, activeTab } = useScriptStore();

    return (
        <div className="space-y-6 pt-6 border-t border-white/5">
            <div className="flex items-center gap-4 px-2">
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">
                    Roteiros Compartilhados Comigo (Individuais)
                </h2>
                <div className="flex-1 h-px bg-white/5" />
            </div>

            {sharedScripts.length === 0 ? (
                <p className="text-white/20 text-xs px-2">Nenhum roteiro compartilhado individualmente.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {sharedScripts.map(script => (
                        <ScriptCard 
                            key={script.id} 
                            script={script} 
                            onClick={() => router.push(`/tools/script-editor?id=${script.id}&ownerId=${script.ownerId}`)} 
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
