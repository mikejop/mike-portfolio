"use client";

import { useScriptStore } from "../../store/useScriptStore";
import { useAppStore } from "@/store/useAppStore";
import { Plus, GitBranch, GitCommitHorizontal, Calendar, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function VersionExplorerSidebar() {
    const { 
        activeScriptId, 
        scripts, 
        activeScriptVersion, 
        switchScriptVersion,
        createScriptVersion,
        createSubVersion,
        deleteLastVersion
    } = useScriptStore();

    const { requestConfirm } = useAppStore();

    if (!activeScriptId) return null;

    const metadata = scripts.find(s => s.id === activeScriptId);
    if (!metadata) return null;

    const versions = metadata.availableVersions || [1];
    const versionDates = metadata.versionDates || {};
    const currentActive = activeScriptVersion || 1;
    const lastVersion = versions[versions.length - 1];
    const isOnLatest = currentActive === lastVersion;

    // Group versions by date (dd/mm/yyyy), same pattern as budget-editor
    const grouped = versions.reduce((acc, v) => {
        const isoDate = versionDates[String(v)] || metadata.criadoEm || "";
        const dateKey = isoDate ? isoDate.split("T")[0] : "Sem Data";
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(v);
        return acc;
    }, {} as Record<string, (number | string)[]>);

    // Reverse items inside each group so newest version appears first
    for (const key of Object.keys(grouped)) {
        grouped[key].reverse();
    }

    const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

    const handleVersionClick = async (v: number | string) => {
        if (v === currentActive) return;
        await switchScriptVersion(v);
    };

    const handleNewVersion = async () => {
        if (!isOnLatest) {
            const laterVersions = versions.slice(versions.indexOf(currentActive) + 1);
            const laterLabels = laterVersions.map(v => 
                String(v).includes('.') ? `V${v}` : `V${String(v).padStart(2, '0')}`
            ).join(', ');

            const confirmed = await requestConfirm(
                "Criar Sub-versão",
                `Você está na ${String(currentActive).includes('.') ? `V${currentActive}` : `V${String(currentActive).padStart(2, '0')}`}. Ao criar uma nova versão a partir daqui, as versões posteriores (${laterLabels}) serão apagadas permanentemente.`,
                "Criar e Apagar",
                "Cancelar",
                true
            );

            if (confirmed) {
                await createSubVersion(currentActive);
            }
        } else {
            await createScriptVersion();
        }
    };

    const formatLabel = (v: number | string) => {
        return String(v).includes('.') ? `V${v}` : `V${String(v).padStart(2, '0')}`;
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-2 mb-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">
                    Versões
                </h3>
                <button
                    onClick={handleNewVersion}
                    className="p-1 hover:bg-white/10 rounded-md transition-colors text-white/60 hover:text-white"
                    title="Nova Versão"
                >
                    <Plus size={14} />
                </button>
            </div>

            {/* Version List Grouped by Date */}
            <div className="flex-1 space-y-6 overflow-y-auto custom-scrollbar pr-1">
                {sortedDates.length === 0 && (
                    <div className="text-center py-8 text-white/50 text-xs italic">
                        Nenhuma versão criada
                    </div>
                )}

                {sortedDates.map(date => (
                    <div key={date} className="space-y-2">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-white/70 px-2">
                            <Calendar size={10} />
                            {date === "Sem Data" ? date : new Date(date + "T12:00:00").toLocaleDateString('pt-BR')}
                        </div>
                        <div className="space-y-0.5">
                            {grouped[date].map((v) => {
                                const isActive = currentActive === v;
                                const isSubversion = String(v).includes('.');
                                const isLast = v === lastVersion && versions.length > 1;

                                return (
                                    <div
                                        key={String(v)}
                                        className={cn(
                                            "group flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors cursor-pointer",
                                            isActive
                                                ? "bg-[var(--macos-selected)] text-white"
                                                : "hover:bg-white/5 text-white/90"
                                        )}
                                        onClick={() => handleVersionClick(v)}
                                    >
                                        {isSubversion ? (
                                            <GitBranch size={14} className="shrink-0 ml-2" />
                                        ) : (
                                            <GitCommitHorizontal size={14} className="shrink-0" />
                                        )}
                                        <span className="flex-1 text-xs leading-tight py-1 font-bold tracking-wide">
                                            {formatLabel(v)}
                                        </span>
                                        {isLast && (
                                            <button
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    const confirmed = await requestConfirm(
                                                        "Apagar Versão",
                                                        `Deseja apagar a ${formatLabel(v)}? Esta ação não pode ser desfeita.`,
                                                        "Apagar",
                                                        "Cancelar",
                                                        true
                                                    );
                                                    if (confirmed) {
                                                        await deleteLastVersion();
                                                    }
                                                }}
                                                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
