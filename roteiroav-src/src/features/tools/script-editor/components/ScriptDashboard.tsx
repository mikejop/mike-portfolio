"use client";

import { useScriptStore } from "../store/useScriptStore";
import { ScriptCard } from "./ScriptCard";
import { NewScriptCard } from "./NewScriptCard";
import { DatabaseActions } from "./DatabaseActions";
import { CreateRoomModal } from "./CreateRoomModal";
import { RoomMembersModal } from "./RoomMembersModal";
import { Search, FolderOpen, ArrowLeft, Plus, FolderUp, Users, XCircle, X, ChevronDown, Folder, Loader2, ListFilter, ArrowDownWideNarrow, ArrowUpNarrowWide } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import JSZip from "jszip";
import { ImportReviewModal } from "./editor/ImportReviewModal";
import { ScriptFull } from "../store/types";
import { NewScriptModal } from "./NewScriptModal";
import { ShareScriptModal } from "./ShareScriptModal";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

// Dnd-kit imports
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    horizontalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Subcomponents
import { RecentScripts } from "./RecentScripts";
import { SharedScripts } from "./SharedScripts";
import { ScriptEditor } from "./editor/ScriptEditor";

interface SortableTabProps {
    roomId: string;
    title: string;
    isActive: boolean;
    onClick: () => void;
    onClose: (e: React.MouseEvent) => void;
}

function SortableTab({ roomId, title, isActive, onClick, onClose }: SortableTabProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: roomId });

    const style = {
        transform: transform ? CSS.Transform.toString(transform) : undefined,
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={(e) => {
                onClick();
            }}
            className={cn(
                "h-9 px-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 transition-all cursor-pointer select-none shrink-0 border",
                isActive
                    ? "bg-amber-500 text-black font-black border-amber-500 shadow-lg shadow-amber-500/10"
                    : "bg-white/5 border-white/5 hover:bg-white/10 text-white/60 hover:text-white"
            )}
        >
            <Users size={12} className={isActive ? "text-black" : "text-amber-500"} />
            <span className="truncate max-w-[100px] sm:max-w-[150px]">{title}</span>
            <button
                onClick={onClose}
                onPointerDown={(e) => e.stopPropagation()}
                className={cn(
                    "p-0.5 rounded-full hover:bg-black/10 transition-colors cursor-pointer",
                    isActive ? "text-black hover:bg-black/10" : "text-white/20 hover:text-white hover:bg-white/10"
                )}
            >
                <X size={10} strokeWidth={3} />
            </button>
        </div>
    );
}

export function ScriptDashboard() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const queryRoomId = searchParams.get("roomId");
    const queryId = searchParams.get("id");
    const queryOwnerId = searchParams.get("ownerId");

    const { setAppBackHandler, setAppTitle, applyMaximizeState } = useAppStore();
    const { 
        getFilteredScripts, 
        sharedScripts,
        sharingScriptId,
        selectedClient, 
        setSelectedClient, 
        setShowNewScriptModal,
        showNewScriptModal,
        rooms,
        activeRoomId,
        roomScripts,
        setActiveRoomId,
        activeTab,
        setActiveTab,
        importScript,
        loadingRoomScripts
    } = useScriptStore();

    const [createRoomOpen, setCreateRoomOpen] = useState(false);
    const [roomMembersOpen, setRoomMembersOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState<'criadoEm' | 'atualizadoEm' | 'totalWords' | 'totalCenas' | 'totalTakes' | 'titulo'>('atualizadoEm');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [importedContent, setImportedContent] = useState<ScriptFull | null>(null);
    const [importedImages, setImportedImages] = useState<Record<string, Blob>>({});
    const [importFilename, setImportFilename] = useState("");

    // Tab states
    const [openTabs, setOpenTabs] = useState<{ roomId: string; title: string; order: number }[]>([]);
    const [activeTabIndex, setActiveTabIndex] = useState<number>(0);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [hasHydrated, setHasHydrated] = useState(false);
    const [roomsLoaded, setRoomsLoaded] = useState(false);

    const { user } = useAuth();
    const currentUserId = user?.uid;

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    // Load openTabs from localStorage on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            try {
                const saved = localStorage.getItem("ag_open_tabs");
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (parsed && Array.isArray(parsed.tabs)) {
                        const sortedTabs = parsed.tabs.sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
                        setOpenTabs(sortedTabs);
                        setActiveTabIndex(parsed.activeIndex ?? 0);
                    }
                }
            } catch (e) {
                console.error("Failed to load open tabs", e);
            }
            setHasHydrated(true);
        }
    }, []);

    // Save openTabs to localStorage on changes
    useEffect(() => {
        if (hasHydrated) {
            localStorage.setItem("ag_open_tabs", JSON.stringify({
                tabs: openTabs,
                activeIndex: activeTabIndex
            }));
        }
    }, [openTabs, activeTabIndex, hasHydrated]);

    // Check if rooms list is loaded
    useEffect(() => {
        if (rooms.length > 0) {
            setRoomsLoaded(true);
        } else {
            const timer = setTimeout(() => {
                setRoomsLoaded(true);
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [rooms]);

    // Clean up tabs for non-existing rooms
    useEffect(() => {
        if (hasHydrated && roomsLoaded) {
            const validTabs = openTabs.filter(tab => rooms.some(r => r.id === tab.roomId));
            if (validTabs.length !== openTabs.length) {
                setOpenTabs(validTabs);
                if (activeTabIndex > validTabs.length) {
                    setActiveTabIndex(validTabs.length);
                }
            }
        }
    }, [rooms, hasHydrated, roomsLoaded]);

    // Update store state based on active tab index
    useEffect(() => {
        if (!hasHydrated) return;
        
        if (activeTabIndex === 0) {
            setActiveRoomId(null);
            setActiveTab('my-scripts');
        } else {
            const tab = openTabs[activeTabIndex - 1];
            if (tab) {
                setActiveRoomId(tab.roomId);
                setActiveTab('shared');
            }
        }
    }, [activeTabIndex, openTabs, setActiveRoomId, setActiveTab, hasHydrated]);

    // Sync query parameters to open and focus tab
    useEffect(() => {
        if (queryRoomId && hasHydrated && roomsLoaded) {
            const tabIndex = openTabs.findIndex(t => t.roomId === queryRoomId);
            if (tabIndex !== -1) {
                if (activeTabIndex !== tabIndex + 1) {
                    setActiveTabIndex(tabIndex + 1);
                }
            } else {
                const room = rooms.find(r => r.id === queryRoomId);
                if (room) {
                    const newTabs = [...openTabs, { roomId: room.id, title: room.name, order: openTabs.length }];
                    setOpenTabs(newTabs);
                    setActiveTabIndex(newTabs.length);
                } else {
                    // Room does not exist in Firestore. Redirect silently.
                    setActiveTabIndex(0);
                    if (typeof window !== 'undefined') {
                        const url = new URL(window.location.href);
                        url.searchParams.delete("roomId");
                        url.searchParams.delete("id");
                        url.searchParams.delete("ownerId");
                        window.history.replaceState(null, "", url.pathname + url.search);
                    }
                }
            }
        }
    }, [queryRoomId, rooms, hasHydrated, roomsLoaded]);

    // Sync window maximize layout state
    useEffect(() => {
        applyMaximizeState(!!queryId);
    }, [queryId, applyMaximizeState]);

    // Sync back handler
    useEffect(() => {
        if (queryId) {
            // ScriptEditor handles its own back button, let it override
            return;
        }

        if (activeTabIndex > 0) {
            setAppBackHandler(() => {
                setActiveTabIndex(0);
                if (typeof window !== 'undefined') {
                    const url = new URL(window.location.href);
                    url.searchParams.delete("roomId");
                    url.searchParams.delete("id");
                    url.searchParams.delete("ownerId");
                    window.history.replaceState(null, "", url.pathname + url.search);
                }
            });
        } else {
            setAppBackHandler(() => router.push("/"));
        }
        setAppTitle(null);
        return () => {
            setAppBackHandler(null);
            setAppTitle(null);
        };
    }, [router, setAppBackHandler, setAppTitle, activeTabIndex, queryId]);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setOpenTabs((items) => {
                const oldIndex = items.findIndex((item) => item.roomId === active.id);
                const newIndex = items.findIndex((item) => item.roomId === over.id);
                const newItems = arrayMove(items, oldIndex, newIndex);
                
                const orderedItems = newItems.map((item, idx) => ({
                    ...item,
                    order: idx
                }));

                if (activeTabIndex === oldIndex + 1) {
                    setActiveTabIndex(newIndex + 1);
                } else if (activeTabIndex > 0) {
                    const activeRoomId = openTabs[activeTabIndex - 1]?.roomId;
                    const newActiveIndex = orderedItems.findIndex(item => item.roomId === activeRoomId);
                    if (newActiveIndex !== -1) {
                        setActiveTabIndex(newActiveIndex + 1);
                    }
                }

                return orderedItems;
            });
        }
    };

    const handleCloseTab = (e: React.MouseEvent, roomId: string) => {
        e.stopPropagation();
        const tabIndex = openTabs.findIndex(t => t.roomId === roomId);
        if (tabIndex === -1) return;

        const newTabs = openTabs.filter(t => t.roomId !== roomId);
        const orderedTabs = newTabs.map((t, idx) => ({ ...t, order: idx }));
        setOpenTabs(orderedTabs);

        if (activeTabIndex === tabIndex + 1) {
            setActiveTabIndex(Math.max(0, tabIndex));
        } else if (activeTabIndex > tabIndex + 1) {
            setActiveTabIndex(activeTabIndex - 1);
        }

        // Clean up URL search parameters without triggering a router push/reload
        if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.delete("roomId");
            url.searchParams.delete("id");
            url.searchParams.delete("ownerId");
            window.history.replaceState(null, "", url.pathname + url.search);
        }
    };

    const handleSelectRoom = (roomId: string) => {
        const tabIndex = openTabs.findIndex(t => t.roomId === roomId);
        if (tabIndex !== -1) {
            setActiveTabIndex(tabIndex + 1);
        } else {
            const room = rooms.find(r => r.id === roomId);
            if (room) {
                const newTabs = [...openTabs, { roomId: room.id, title: room.name, order: openTabs.length }];
                setOpenTabs(newTabs);
                setActiveTabIndex(newTabs.length);
            }
        }
        if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.set("roomId", roomId);
            url.searchParams.delete("id");
            url.searchParams.delete("ownerId");
            window.history.replaceState(null, "", url.pathname + url.search);
        }
        setIsDropdownOpen(false);
    };

    const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        e.target.value = "";
        setImportFilename(file.name);
        
        if (!file.name.endsWith(".roteiroav")) {
            alert("Por favor, selecione apenas arquivos com a extensão .roteiroav");
            return;
        }

        if (activeTab === 'shared' && !activeRoomId) {
            alert("Para importar um roteiro na Sala de Roteiro, por favor selecione e entre em uma sala específica primeiro. Ou mude para a aba 'Meus Roteiros' para importar como roteiro pessoal.");
            return;
        }
        
        try {
            const zip = await JSZip.loadAsync(file);
            
            const manifestFile = zip.file("manifest.json");
            if (!manifestFile) {
                alert("Arquivo inválido: manifest.json não encontrado.");
                return;
            }
            const manifestJson = JSON.parse(await manifestFile.async("text"));
            if (manifestJson.formatVersion !== 1) {
                alert("Versão de formato não suportada.");
                return;
            }
            
            const contentFile = zip.file("content.json");
            if (!contentFile) {
                alert("Arquivo inválido: content.json não encontrado.");
                return;
            }
            const contentJson: ScriptFull = JSON.parse(await contentFile.async("text"));
            
            const imagesFolder = zip.folder("images");
            const imageMap: Record<string, Blob> = {};
            if (imagesFolder) {
                const files = Object.keys(imagesFolder.files);
                for (const filepath of files) {
                    const zipFile = imagesFolder.file(filepath);
                    if (zipFile && !zipFile.dir) {
                        const filename = filepath.split('/').pop() || '';
                        const parts = filename.split('.');
                        const takeId = parts[0];
                        if (takeId) {
                            const blob = await zipFile.async("blob");
                            imageMap[takeId] = blob;
                        }
                    }
                }
            }
            
            setImportedContent(contentJson);
            setImportedImages(imageMap);
            setImportModalOpen(true);
        } catch (error) {
            console.error("Error reading import file:", error);
            alert("Falha ao ler o arquivo .roteiroav. Certifique-se de que é um arquivo válido.");
        }
    };

    const handleApplyImport = async (finalContent: ScriptFull) => {
        try {
            const newScriptId = await importScript(finalContent, importedImages, activeRoomId, importFilename);
            alert("Roteiro importado com sucesso!");
            if (activeRoomId) {
                router.push(`/tools/script-editor?id=${newScriptId}&roomId=${activeRoomId}`);
            } else {
                router.push(`/tools/script-editor?id=${newScriptId}`);
            }
        } catch (error: any) {
            console.error("Error importing script:", error);
            alert(error.message || "Erro ao importar roteiro.");
        }
    };

    const currentRoom = useMemo(() => {
        return rooms.find(r => r.id === activeRoomId) || null;
    }, [rooms, activeRoomId]);

    const roomFilteredScripts = useMemo(() => {
        if (!activeRoomId) return [];
        
        let filtered = selectedClient
            ? roomScripts.filter(s => s.clientName === selectedClient)
            : roomScripts;

        const searchedAndFiltered = filtered.filter(s => {
            if (!s || typeof s !== 'object') return false;
            const nameMatch = s.titulo?.toLowerCase().includes(searchQuery.toLowerCase());
            const clientMatch = s.clientName?.toLowerCase().includes(searchQuery.toLowerCase());
            const briefingMatch = s.descricao?.toLowerCase().includes(searchQuery.toLowerCase());
            return nameMatch || clientMatch || briefingMatch;
        });

        const unique = searchedAndFiltered.filter((s, index, self) => 
            self.findIndex(t => t.id === s.id) === index
        );

        return unique.sort((a, b) => {
            let valA: any = a[sortBy];
            let valB: any = b[sortBy];

            if (sortBy === 'totalWords') {
                valA = a.totalWords || 0;
                valB = b.totalWords || 0;
            } else if (sortBy === 'totalCenas') {
                valA = a.totalCenas || 0;
                valB = b.totalCenas || 0;
            } else if (sortBy === 'totalTakes') {
                valA = a.totalTakes || 0;
                valB = b.totalTakes || 0;
            } else if (sortBy === 'titulo') {
                valA = (a.titulo || '').toLowerCase();
                valB = (b.titulo || '').toLowerCase();
            } else if (sortBy === 'criadoEm' || sortBy === 'atualizadoEm') {
                valA = new Date(valA || 0).getTime();
                valB = new Date(valB || 0).getTime();
            }

            if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
            if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
    }, [activeRoomId, roomScripts, selectedClient, searchQuery, sortBy, sortOrder]);

    return (
        <div className="flex-1 flex flex-col h-full bg-[#121212] overflow-hidden">
            {/* Header */}
            {!queryId && (
                <header className="relative z-50 px-10 py-8 flex items-center justify-between border-b border-white/5 bg-[#1a1a1a]/80 backdrop-blur-md">
                    <div className="flex items-center gap-6">
                        <div>
                            <h1 className="text-2xl font-black text-white uppercase tracking-tighter">
                                {selectedClient ? `Scripts: ${selectedClient}` : activeTabIndex === 0 ? "Meus Roteiros" : currentRoom?.name}
                            </h1>
                            <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.2em] mt-1 italic">
                                {!queryId && `${activeRoomId ? roomFilteredScripts.length : getFilteredScripts().length} Roteiro(s) Encontrado(s)`}
                            </p>
                        </div>

                        {selectedClient && (
                            <button 
                                onClick={() => setSelectedClient(null)}
                                className="bg-white/5 hover:bg-white/10 text-white/40 hover:text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border border-white/5 cursor-pointer"
                            >
                                <XCircle size={12} />
                                Limpar Filtro
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Salas Dropdown */}
                        <div className="relative font-sans z-50">
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="bg-white/5 hover:bg-white/10 text-white border border-white/5 hover:border-white/10 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer"
                            >
                                <Users size={14} className="text-amber-500" />
                                Salas
                                <ChevronDown size={14} className={cn("transition-transform duration-200", isDropdownOpen ? "rotate-180" : "")} />
                            </button>

                            {isDropdownOpen && (
                                <div className="absolute right-0 top-12 w-56 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl shadow-black/40 ring-1 ring-white/5 p-2 z-[60] animate-in fade-in zoom-in-95 duration-200">
                                    <button
                                        onClick={() => {
                                            setCreateRoomOpen(true);
                                            setIsDropdownOpen(false);
                                        }}
                                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider text-amber-500 hover:bg-amber-500/10 transition-colors text-left"
                                    >
                                        <Plus size={14} />
                                        Nova Sala
                                    </button>
                                    
                                    <div className="h-px bg-white/5 my-1" />

                                    <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-0.5">
                                        {rooms.length === 0 ? (
                                            <div className="text-[10px] text-white/20 font-bold uppercase tracking-wider text-center py-4 italic">
                                                Nenhuma sala
                                            </div>
                                        ) : (
                                            rooms.map((room) => (
                                                <button
                                                    key={room.id}
                                                    onClick={() => handleSelectRoom(room.id)}
                                                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[11px] text-white/60 hover:text-white hover:bg-white/5 transition-colors text-left truncate font-bold uppercase tracking-wider"
                                                >
                                                    <Folder size={12} className="text-amber-500/60 shrink-0" />
                                                    <span className="truncate">{room.name}</span>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Search & Sort Controls — always visible when not inside the editor */}
                        {!queryId && (
                            <div className="flex items-center gap-2 font-sans">
                                {/* Search */}
                                <div className="relative group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-amber-500 transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Buscar roteiros..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="bg-white/5 border border-white/5 rounded-2xl pl-11 pr-5 py-2.5 text-sm text-white placeholder:text-white/10 focus:outline-none focus:border-amber-500/30 focus:bg-white/[0.08] transition-all w-[200px] xl:w-[260px]"
                                    />
                                </div>

                                {/* Sort field — icon button with glassmorphism dropdown */}
                                <div className="relative">
                                    <button
                                        onClick={() => setIsSortOpen((o) => !o)}
                                        className={cn(
                                            "p-2.5 border rounded-xl transition-all flex items-center justify-center cursor-pointer",
                                            isSortOpen
                                                ? "bg-amber-500/10 border-amber-500/30 text-amber-500"
                                                : "bg-white/5 hover:bg-white/10 border-white/5 text-white/40 hover:text-white"
                                        )}
                                        title={`Ordenar por: ${{
                                            atualizadoEm: 'Modificado em',
                                            criadoEm: 'Criado em',
                                            titulo: 'Nome',
                                            totalWords: 'Palavras',
                                            totalCenas: 'Cenas',
                                            totalTakes: 'Takes'
                                        }[sortBy]}`}
                                    >
                                        <ListFilter size={16} className={isSortOpen ? "text-amber-500" : "text-amber-500/70"} />
                                    </button>

                                    {isSortOpen && (
                                        <div className="absolute right-0 top-12 w-44 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl shadow-black/40 ring-1 ring-white/5 p-1.5 z-[60] animate-in fade-in zoom-in-95 duration-150">
                                            {([
                                                { value: 'atualizadoEm', label: 'Modificado em' },
                                                { value: 'criadoEm',     label: 'Criado em' },
                                                { value: 'titulo',       label: 'Nome' },
                                                { value: 'totalWords',   label: 'Palavras' },
                                                { value: 'totalCenas',   label: 'Cenas' },
                                                { value: 'totalTakes',   label: 'Takes' },
                                            ] as const).map(({ value, label }) => (
                                                <button
                                                    key={value}
                                                    onClick={() => { setSortBy(value); setIsSortOpen(false); }}
                                                    className={cn(
                                                        "w-full text-left px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-colors",
                                                        sortBy === value
                                                            ? "text-amber-500 bg-amber-500/10"
                                                            : "text-white/50 hover:text-white hover:bg-white/5"
                                                    )}
                                                >
                                                    {label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Sort order — toggle icon */}
                                <button
                                    onClick={() => setSortOrder((o) => o === 'desc' ? 'asc' : 'desc')}
                                    className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-all flex items-center justify-center cursor-pointer group"
                                    title={sortOrder === 'desc' ? 'Decrescente' : 'Crescente'}
                                >
                                    {sortOrder === 'desc'
                                        ? <ArrowDownWideNarrow size={16} className="text-amber-500/70 group-hover:text-amber-500 transition-colors" />
                                        : <ArrowUpNarrowWide  size={16} className="text-amber-500/70 group-hover:text-amber-500 transition-colors" />
                                    }
                                </button>
                            </div>
                        )}


                        <DatabaseActions />
                    </div>
                </header>
            )}

            {/* Tab Bar */}
            {!queryId && (
                <div className="px-10 py-2.5 flex items-center gap-2 border-b border-white/5 bg-[#171717]/40 overflow-x-auto custom-scrollbar">
                    <button
                        onClick={() => {
                            setActiveTabIndex(0);
                            if (typeof window !== 'undefined') {
                                const url = new URL(window.location.href);
                                url.searchParams.delete("roomId");
                                url.searchParams.delete("id");
                                url.searchParams.delete("ownerId");
                                window.history.replaceState(null, "", url.pathname + url.search);
                            }
                        }}
                        className={cn(
                            "h-9 px-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer select-none shrink-0",
                            activeTabIndex === 0
                                ? "bg-amber-500 text-black font-black shadow-lg shadow-amber-500/10"
                                : "bg-white/5 border border-white/5 hover:bg-white/10 text-white/60 hover:text-white"
                        )}
                    >
                        Meus Roteiros
                    </button>

                    {openTabs.length > 0 && <div className="h-6 w-px bg-white/10 mx-1 shrink-0" />}

                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={openTabs.map(t => t.roomId)}
                            strategy={horizontalListSortingStrategy}
                        >
                            <div className="flex items-center gap-2">
                                {openTabs.map((tab, idx) => (
                                    <SortableTab
                                        key={tab.roomId}
                                        roomId={tab.roomId}
                                        title={tab.title}
                                        isActive={activeTabIndex === idx + 1}
                                        onClick={() => {
                                            setActiveTabIndex(idx + 1);
                                            if (typeof window !== 'undefined') {
                                                const url = new URL(window.location.href);
                                                url.searchParams.set("roomId", tab.roomId);
                                                url.searchParams.delete("id");
                                                url.searchParams.delete("ownerId");
                                                window.history.replaceState(null, "", url.pathname + url.search);
                                            }
                                        }}
                                        onClose={(e) => handleCloseTab(e, tab.roomId)}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                </div>
            )}

            {/* Dashboard Content / Inline Editor */}
            {queryId ? (
                <div className="flex-1 flex flex-col overflow-hidden bg-[#0a0a0a]">
                    <ScriptEditor id={queryId} ownerId={queryOwnerId} roomId={activeRoomId} />
                </div>
            ) : (
                <div 
                    key={activeTabIndex}
                    className="flex-1 overflow-y-auto custom-scrollbar p-10 pb-32 animate-fade-in-premium animate-in fade-in duration-300"
                >
                    {activeTabIndex > 0 ? (
                        /* Room Internals View */
                        <div className="space-y-8">
                            <div className="bg-[#1a1a1a]/85 border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 backdrop-blur-md">
                                <div>
                                    <h2 className="text-lg font-black text-white uppercase tracking-wider">{currentRoom?.name}</h2>
                                    <p className="text-white/40 text-[9px] font-black uppercase tracking-widest mt-0.5">
                                        Dono: {currentRoom ? (currentRoom.members[currentRoom.createdBy]?.displayName || currentRoom.createdByEmail) : ''} • {Object.keys(currentRoom?.members || {}).length} Membro(s)
                                    </p>
                                </div>

                                <div className="flex items-center gap-3">
                                    {(() => {
                                        const isRoomOwner = currentRoom?.createdBy === currentUserId;
                                        const member = currentRoom?.members[currentUserId || ''];
                                        const canEdit = isRoomOwner || member?.permission === 'editor';
                                        return canEdit && (
                                            <button
                                                onClick={() => document.getElementById('dashboard-import-script-input')?.click()}
                                                className="p-2.5 bg-white/5 hover:bg-white/10 text-white border border-white/5 rounded-xl transition-all flex items-center justify-center cursor-pointer"
                                                title="Importar Roteiro (.roteiroav)"
                                            >
                                                <FolderUp size={16} className="text-amber-500" />
                                            </button>
                                        );
                                    })()}
                                    <button
                                        onClick={() => setRoomMembersOpen(true)}
                                        className="p-2.5 bg-white/5 hover:bg-white/10 text-white border border-white/5 rounded-xl transition-all flex items-center justify-center cursor-pointer"
                                        title="Membros"
                                    >
                                        <Users size={16} className="text-amber-500" />
                                    </button>
                                </div>
                            </div>

                            {loadingRoomScripts ? (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                        {(() => {
                                            const isOwner = currentRoom?.createdBy === currentUserId;
                                            const member = currentRoom?.members[currentUserId || ''];
                                            const canEdit = isOwner || member?.permission === 'editor';
                                            return canEdit && (
                                                <NewScriptCard onClick={() => setShowNewScriptModal(true)} />
                                            );
                                        })()}
                                        <div className="flex items-center justify-center p-8 border border-dashed border-white/10 rounded-3xl bg-white/[0.02] min-h-[220px] aspect-[3/2]">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
                                                    <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
                                                </div>
                                                <span className="text-[10px] text-white/40 font-black uppercase tracking-widest animate-pulse">Sincronizando Sala...</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : roomFilteredScripts.length === 0 && searchQuery === "" ? (
                                <div className="h-[40vh] flex flex-col items-center justify-center text-center space-y-6">
                                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center border border-white/5">
                                        <FolderOpen size={24} className="text-white/10" />
                                    </div>
                                    <div className="max-w-xs space-y-2">
                                        <h2 className="text-white/40 font-black uppercase tracking-widest text-xs">
                                            Nenhum roteiro nesta sala
                                        </h2>
                                        <p className="text-white/20 text-[10px] leading-relaxed">
                                            Crie o primeiro roteiro audiovisual colaborativo dentro desta sala.
                                        </p>
                                    </div>
                                    {(() => {
                                        const isOwner = currentRoom?.createdBy === currentUserId;
                                        const member = currentRoom?.members[currentUserId || ''];
                                        const canEdit = isOwner || member?.permission === 'editor';
                                        return canEdit && (
                                            <button
                                                onClick={() => setShowNewScriptModal(true)}
                                                className="bg-amber-500 hover:bg-amber-600 text-black px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-amber-500/10 transition-all flex items-center gap-2 cursor-pointer"
                                            >
                                                <Plus size={14} />
                                                Criar Roteiro
                                            </button>
                                        );
                                    })()}
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                        {(() => {
                                            const isOwner = currentRoom?.createdBy === currentUserId;
                                            const member = currentRoom?.members[currentUserId || ''];
                                            const canEdit = isOwner || member?.permission === 'editor';
                                            return canEdit && (
                                                <NewScriptCard onClick={() => setShowNewScriptModal(true)} />
                                            );
                                        })()}
                                        {roomFilteredScripts.map(script => (
                                            <ScriptCard 
                                                key={script.id} 
                                                script={script} 
                                                onClick={() => router.push(`/tools/script-editor?id=${script.id}&roomId=${activeRoomId}`)} 
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Standard Personal Scripts View */
                        <RecentScripts searchQuery={searchQuery} sortBy={sortBy} sortOrder={sortOrder} />
                    )}
                </div>
            )}

            {showNewScriptModal && <NewScriptModal />}
            {sharingScriptId && <ShareScriptModal />}
            <CreateRoomModal 
                isOpen={createRoomOpen} 
                onClose={() => setCreateRoomOpen(false)} 
                onRoomCreated={(newRoomId) => {
                    handleSelectRoom(newRoomId);
                }}
            />
            {activeRoomId && (
                <RoomMembersModal 
                    roomId={activeRoomId} 
                    isOpen={roomMembersOpen} 
                    onClose={() => setRoomMembersOpen(false)} 
                />
            )}
            
            <input 
                type="file" 
                accept=".roteiroav" 
                className="hidden" 
                id="dashboard-import-script-input" 
                onChange={handleImportFileChange} 
            />
            {importedContent && (
                <ImportReviewModal
                    isOpen={importModalOpen}
                    onClose={() => {
                        setImportModalOpen(false);
                        setImportedContent(null);
                        setImportedImages({});
                    }}
                    importedContent={importedContent}
                    imageMap={importedImages}
                    onApply={handleApplyImport}
                    isNewImport={true}
                />
            )}
        </div>
    );
}
