"use client";

import { useEffect, useState, useMemo } from "react";
import { useScriptStore } from "../../store/useScriptStore";
import { EditorHeader } from "./EditorHeader";
import { TakesTable } from "./TakesTable";
import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import { ShareScriptModal } from "../ShareScriptModal";
import { useAuth } from "@/hooks/useAuth";
import { updateProfile } from "firebase/auth";
import { updateUserProfile } from "@/lib/firestore";
import { cn } from "@/lib/utils";

interface ScriptEditorProps {
    id: string;
    ownerId?: string | null;
    roomId?: string | null;
}

export function ScriptEditor({ id, ownerId, roomId }: ScriptEditorProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { setAppBackHandler, setAppTitle } = useAppStore();
    const { 
        setActiveScript, 
        activeScriptContent, 
        loadingApp,
        sharingScriptId,
        activeScriptId,
        scripts,
        sharedScripts,
        roomScripts,
        rooms,
        syncError // FIX: BUG 5 - Expose syncError from script store
    } = useScriptStore();
    
    const { user, profile, setProfileLocal } = useAuth();
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [submittingName, setSubmittingName] = useState(false);

    const [minTimePassed, setMinTimePassed] = useState(false);
    const [selectedQuote, setSelectedQuote] = useState<{ author: string; text: string } | null>(null);
    const [loadingVisible, setLoadingVisible] = useState(true);
    const [fadeOut, setFadeOut] = useState(false);

    useEffect(() => {
        setMinTimePassed(false);
        setFadeOut(false);
        setLoadingVisible(true);
        
        const randomIndex = Math.floor(Math.random() * SCREENWRITING_QUOTES.length);
        setSelectedQuote(SCREENWRITING_QUOTES[randomIndex]);
        
        const timer = setTimeout(() => {
            setMinTimePassed(true);
        }, 3000);
        
        return () => clearTimeout(timer);
    }, [id]);

    const showLoadingScreen = loadingApp || !activeScriptContent || !minTimePassed;

    useEffect(() => {
        if (!showLoadingScreen) {
            setFadeOut(true);
            const timer = setTimeout(() => {
                setLoadingVisible(false);
            }, 500);
            return () => clearTimeout(timer);
        } else {
            setFadeOut(false);
            setLoadingVisible(true);
        }
    }, [showLoadingScreen]);

    const scriptMetadata = useMemo(() => {
        return scripts.find(s => s.id === id) || 
               sharedScripts.find(s => s.id === id) ||
               roomScripts.find(s => s.id === id);
    }, [id, scripts, sharedScripts, roomScripts]);

    const collaborators = useMemo(() => {
        const names = new Set<string>();
        
        if (scriptMetadata) {
            if (scriptMetadata.ownerId === user?.uid) {
                names.add(user?.displayName || profile?.displayName || user?.email?.split('@')[0] || 'Autor');
            } else if (scriptMetadata.ownerEmail) {
                names.add(scriptMetadata.ownerEmail.split('@')[0]);
            }
            if (scriptMetadata.contributions) {
                Object.values(scriptMetadata.contributions).forEach(c => {
                    if (c.displayName) names.add(c.displayName);
                });
            }
            if (scriptMetadata.roomId) {
                const room = rooms.find(r => r.id === scriptMetadata.roomId);
                if (room?.members) {
                    Object.values(room.members).forEach(m => {
                        if (m.displayName) names.add(m.displayName);
                    });
                }
            }
        }
        
        if (activeScriptContent) {
            const activeWriters = getActiveWriters(activeScriptContent);
            activeWriters.forEach(w => names.add(w.displayName));

            activeScriptContent.cenas?.forEach((scene: any) => {
                scene.takes?.forEach((take: any) => {
                    if (take.audioAuthors) {
                        take.audioAuthors.forEach((a: string) => {
                            if (a) names.add(a);
                        });
                    }
                    if (take.visualAuthors) {
                        take.visualAuthors.forEach((a: string) => {
                            if (a) names.add(a);
                        });
                    }
                });
            });
        }
        
        return Array.from(names);
    }, [scriptMetadata, activeScriptContent, user, profile, rooms]);

    // FIX: BUG 1 - Add user?.uid to the dependency array to trigger listener setup exactly when the auth state initializes
    useEffect(() => {
        if (user?.uid) {
            setActiveScript(id, ownerId, roomId);
        }
        return () => { 
            // FIX: BUG 3 - Clean up listeners, reset script state, and clear dirty tracking Sets on unmount
            setActiveScript(null); 
        };
    }, [id, ownerId, roomId, user?.uid, setActiveScript]);

    const urlTab = searchParams.get("tab");

    useEffect(() => {
        setAppBackHandler(() => {
            const metadata = scripts.find(s => s.id === activeScriptId) || 
                             sharedScripts.find(s => s.id === activeScriptId) ||
                             roomScripts.find(s => s.id === activeScriptId);
            const targetRoomId = roomId || metadata?.roomId;
            if (targetRoomId) {
                router.push(`/tools/script-editor?roomId=${targetRoomId}`);
            } else if (urlTab) {
                router.push(`/tools/script-editor?tab=${urlTab}`);
            } else {
                router.push("/tools/script-editor");
            }
        });
        
        if (activeScriptContent?.titulo) {
            setAppTitle(`Roteiro AV - ${activeScriptContent.titulo}`);
        } else {
            setAppTitle("Roteiro AV");
        }

        return () => {
            setAppBackHandler(null);
            setAppTitle(null);
        };
    }, [router, setAppBackHandler, setAppTitle, activeScriptContent, roomId, urlTab, activeScriptId, scripts, sharedScripts, roomScripts]);

    const handleSaveName = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firstName.trim() || !lastName.trim() || !user || submittingName) return;

        setSubmittingName(true);
        try {
            const displayName = `${firstName.trim()} ${lastName.trim()}`;
            await updateProfile(user, { displayName });
            await updateUserProfile(user.uid, { displayName });
            setProfileLocal({ displayName });
        } catch (error) {
            console.error("Erro ao salvar nome:", error);
            alert("Erro ao salvar nome. Por favor, tente novamente.");
        } finally {
            setSubmittingName(false);
        }
    };

    // FIX: BUG 5 - Show error screen to the user if syncError occurs (e.g. Permission Denied)
    if (syncError) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-[#0a0a0a] text-red-500/80 p-6 text-center">
                <div className="bg-red-500/10 border border-red-500/20 max-w-md rounded-3xl p-8 space-y-4 shadow-2xl">
                    <h2 className="text-lg font-black uppercase tracking-wider text-red-500">Erro de Sincronização</h2>
                    <p className="text-xs text-white/60 leading-relaxed font-medium">{syncError}</p>
                    <button 
                        onClick={() => router.push(roomId ? `/tools/script-editor?roomId=${roomId}` : "/tools/script-editor")}
                        className="mt-2 py-3 px-6 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-widest transition-all"
                    >
                        Voltar ao Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const hasName = !!(user?.displayName || profile?.displayName);
    if (user && !hasName) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                <div className="bg-[#1a1a1a] border border-white/10 w-full max-w-md rounded-[28px] overflow-hidden shadow-2xl p-8 space-y-6 animate-in zoom-in-95 duration-300">
                    <div>
                        <h2 className="text-xl font-black text-white uppercase tracking-wider">Identifique-se</h2>
                        <p className="text-white/40 text-xs font-medium mt-1 uppercase tracking-widest leading-relaxed">
                            Precisamos do seu nome para registrar suas alterações no roteiro.
                        </p>
                    </div>

                    <form onSubmit={handleSaveName} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-1">Nome</label>
                            <input 
                                required
                                type="text" 
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                placeholder="Ex: João"
                                className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-white placeholder:text-white/10 focus:outline-none focus:border-amber-500/50 focus:bg-white/[0.08] transition-all text-sm font-medium"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-1">Sobrenome</label>
                            <input 
                                required
                                type="text" 
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                placeholder="Ex: Silva"
                                className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-white placeholder:text-white/10 focus:outline-none focus:border-amber-500/50 focus:bg-white/[0.08] transition-all text-sm font-medium"
                            />
                        </div>

                        <button 
                            type="submit"
                            disabled={!firstName.trim() || !lastName.trim() || submittingName}
                            className="w-full py-4 px-6 rounded-2xl bg-amber-500 text-black font-black uppercase tracking-widest text-[11px] hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-amber-500/20 flex items-center justify-center gap-2"
                        >
                            {submittingName ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                "Confirmar e Entrar"
                            )}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="relative flex-1 flex flex-col h-full bg-[#121212] overflow-hidden">
            {activeScriptContent && (
                <div className={cn(
                    "flex-1 flex flex-col h-full transition-all duration-700 ease-in-out",
                    fadeOut ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                )}>
                    <EditorHeader />
                    
                    <main className="flex-1 overflow-y-auto custom-scrollbar">
                        <div className="max-w-[1400px] mx-auto px-10 pt-4 pb-40">
                            <TakesTable />
                        </div>
                    </main>
                </div>
            )}

            {loadingVisible && (
                <div className={cn(
                    "fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0a0a0a] text-white p-8 transition-opacity duration-500 ease-in-out",
                    fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"
                )}>
                    <div className="max-w-xl w-full text-center space-y-12 animate-in fade-in zoom-in-95 duration-500">
                        {/* Loading Spinner / Branding */}
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-500 text-2xl font-black tracking-tight mb-2">
                                AV
                            </div>
                            <h2 className="text-2xl font-black uppercase tracking-wider text-white">
                                {scriptMetadata?.titulo || activeScriptContent?.titulo || "Carregando Roteiro..."}
                            </h2>
                            {collaborators.length > 0 && (
                                <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em]">
                                    Por: {collaborators.join(" • ")}
                                </p>
                            )}
                        </div>

                        {/* Random Quote */}
                        {selectedQuote && (
                            <div className="bg-white/5 border border-white/5 rounded-[24px] p-8 space-y-4 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500/0 via-amber-500/30 to-amber-500/0" />
                                <p className="text-sm font-medium text-white/70 italic leading-relaxed">
                                    "{selectedQuote.text}"
                                </p>
                                <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest">
                                    — {selectedQuote.author}
                                </p>
                            </div>
                        )}

                        {/* Spinner */}
                        <div className="flex items-center justify-center gap-3 text-white/30 text-[10px] font-black uppercase tracking-[0.2em]">
                            <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                            <span>Preparando Sala...</span>
                        </div>
                    </div>
                </div>
            )}

            {sharingScriptId && <ShareScriptModal />}
        </div>
    );
}

const SCREENWRITING_QUOTES = [
    { author: "Syd Field", text: "O que conta em um roteiro é o visual. A ação é personagem, o comportamento é personagem." },
    { author: "Syd Field", text: "Escrever um roteiro é um processo de descoberta. Você descobre o que quer dizer à medida que escreve." },
    { author: "Syd Field", text: "O início de um roteiro deve estabelecer o personagem principal, a premissa dramática e a situação dramática." },
    { author: "Christopher Vogler", text: "A jornada do herói não é uma fórmula, mas um guia de design estrutural para contar histórias." },
    { author: "Christopher Vogler", text: "Toda boa história reflete uma jornada interior de crescimento, mudança ou transformação." },
    { author: "Christopher Vogler", text: "Os arquétipos não são papéis rígidos, mas funções desempenhadas por personagens para fazer a história avançar." },
    { author: "Robert McKee", text: "História é sobre mudança. Se as coisas continuam iguais no início e no final, você não tem uma história." },
    { author: "Robert McKee", text: "O diálogo não é conversa cotidiana; é ação verbalizada que revela o subtexto dos personagens." },
    { author: "Robert McKee", text: "O design clássico de história significa uma história construída em torno de um protagonista ativo lutando contra forças de oposição." },
    { author: "Blake Snyder", text: "Salve o gato! Dê ao protagonista um momento empático logo no início para que o público torça por ele." },
    { author: "Blake Snyder", text: "Toda cena deve ter um conflito claro e terminar em uma mudança de polaridade emocional (positivo para negativo ou vice-versa)." },
    { author: "Blake Snyder", text: "A estrutura de 15 pontos de batida é a espinha dorsal de qualquer roteiro de sucesso." },
    { author: "Doc Comparato", text: "O roteiro é a partitura do filme. Sem ele, a orquestra da produção não sabe o que tocar." },
    { author: "Doc Comparato", text: "A dramaturgia é a arte de criar conflito. Sem conflito, não há drama, e sem drama, não há roteiro." },
    { author: "Doc Comparato", text: "O personagem não nasce pronto; ele se constrói e se revela através de suas escolhas sob pressão." }
];

function getActiveWriters(content: any) {
    if (!content) return [];
    const writersMap = new Map<string, { uid: string; displayName: string }>();
    content.cenas?.forEach((scene: any) => {
        scene.takes?.forEach((take: any) => {
            if (take.editedBy && take.editedByName) {
                const text = `${take.audio || ""}${take.visual || ""}`.trim();
                if (text.length > 0) {
                    writersMap.set(take.editedBy, {
                        uid: take.editedBy,
                        displayName: take.editedByName
                    });
                }
            }
        });
    });
    return Array.from(writersMap.values());
}
