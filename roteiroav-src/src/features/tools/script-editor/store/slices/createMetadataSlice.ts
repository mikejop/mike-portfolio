// ---------------------------------------------------------------------------
// Metadata Slice — Roteiro AV
// Zustand slice for managing listing, metadata, sharing, and dashboard UI.
// ---------------------------------------------------------------------------

import { StateCreator } from 'zustand';
import { ScriptStoreState, MetadataSliceState } from '../../types/store';
import { ScriptMetadata, ScriptFull, AspectRatio, Scene, Take, SortField, SortOrder } from '../../types/domain';
import { auth } from '@/lib/firebase';
import { uploadImageToStorage } from '@/lib/storage';
import { safeUUID } from '@/lib/utils';
import {
    subscribeToPersonalScripts,
    subscribeToSharedScripts,
    fetchDirectRoomLines,
    fetchDirectScriptContent,
    cloneScriptForDuplicate,
    cloneRoomScriptDeep,
    clonePersonalScriptDeep,
    deleteScriptInFirestore,
    archiveAndDeleteScript,
    shareScriptInFirestore,
    unshareScriptInFirestore,
    deleteSharedScriptReference,
    createScriptInFirestore,
    createScriptInRoomFirestore,
    findUserByEmail
} from '@/lib/services/scriptService';
import { subscribeToRooms } from '@/lib/services/roomService';

const saveMetadataCache = (userId: string, data: { scripts: ScriptMetadata[]; sharedScripts: ScriptMetadata[]; rooms: any[] }) => {
    if (typeof window === 'undefined') return;
    try {
        const cacheObj = {
            userId,
            scripts: data.scripts || [],
            sharedScripts: data.sharedScripts || [],
            rooms: data.rooms || [],
            cachedAt: Date.now()
        };
        localStorage.setItem("ag_scripts_cache", JSON.stringify(cacheObj));
    } catch (e) {
        console.error("[createMetadataSlice] Failed to save metadata cache:", e);
    }
};

const saveRoomCache = (roomId: string, scripts: ScriptMetadata[]) => {
    if (typeof window === 'undefined') return;
    try {
        const cacheObj = {
            roomId,
            scripts: scripts || [],
            cachedAt: Date.now()
        };
        localStorage.setItem(`ag_room_scripts_cache_${roomId}`, JSON.stringify(cacheObj));
    } catch (e) {
        console.error(`[createMetadataSlice] Failed to save room cache for room ${roomId}:`, e);
    }
};

let _scriptsUnsub: (() => void) | null = null;
let _sharedScriptsUnsub: (() => void) | null = null;
let _roomsUnsub: (() => void) | null = null;

export const createMetadataSlice: StateCreator<
    ScriptStoreState,
    [],
    [],
    MetadataSliceState
> = (set, get) => ({
    scripts: [],
    sharedScripts: [],
    selectedClient: typeof window !== 'undefined' ? localStorage.getItem('ag_selected_client') : null,
    clientSortField: typeof window !== 'undefined' ? (localStorage.getItem('ag_client_sort_field') || 'name') as SortField : 'name',
    clientSortOrder: typeof window !== 'undefined' ? (localStorage.getItem('ag_client_sort_order') || 'asc') as SortOrder : 'asc',
    showNewScriptModal: false,
    sharingScriptId: null,
    loadingApp: false,
    loadingScripts: false,
    activeTab: typeof window !== 'undefined' ? (localStorage.getItem('ag_active_tab') || 'my-scripts') as 'my-scripts' | 'shared' : 'my-scripts',
    pendingDuplicates: [],

    setSelectedClient: (client) => {
        if (typeof window !== 'undefined') {
            if (client) localStorage.setItem('ag_selected_client', client);
            else localStorage.removeItem('ag_selected_client');
        }
        set({ selectedClient: client });
    },

    setSortOptions: (field, order) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('ag_client_sort_field', field);
            localStorage.setItem('ag_client_sort_order', order);
        }
        set({ clientSortField: field, clientSortOrder: order });
    },

    setShowNewScriptModal: (show) => set({ showNewScriptModal: show }),

    setSharingScriptId: (id) => set({ sharingScriptId: id }),

    setActiveTab: (tab) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('ag_active_tab', tab);
        }
        set({ activeTab: tab });
    },

    setScripts: (scripts) => set({ 
        scripts: scripts.filter(s => s && s.id) 
    }),

    subscribeToScripts: () => {
        const userId = auth.currentUser?.uid;
        if (!userId) return () => {};

        let hasCache = false;
        if (typeof window !== 'undefined') {
            try {
                const cached = localStorage.getItem("ag_scripts_cache");
                if (cached) {
                    const parsed = JSON.parse(cached);
                    const TTL = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
                    if (parsed && parsed.userId === userId && parsed.cachedAt && (Date.now() - parsed.cachedAt < TTL)) {
                        set({
                            scripts: parsed.scripts || [],
                            sharedScripts: parsed.sharedScripts || [],
                            rooms: parsed.rooms || [],
                            loadingScripts: false
                        });
                        hasCache = true;
                    }
                }
            } catch (e) {
                console.error("[createMetadataSlice] Erro ao ler cache de scripts:", e);
            }
        }

        if (!hasCache) {
            set({ loadingScripts: true });
        }

        if (_scriptsUnsub) _scriptsUnsub();
        if (_sharedScriptsUnsub) _sharedScriptsUnsub();
        if (_roomsUnsub) _roomsUnsub();

        _scriptsUnsub = subscribeToPersonalScripts(userId, (list) => {
            set({ scripts: list, loadingScripts: false });
            saveMetadataCache(userId, { scripts: list, sharedScripts: get().sharedScripts, rooms: get().rooms });
        }, (error) => {
            console.error('[createMetadataSlice] Erro no listener de roteiros pessoais:', error);
            set({ loadingScripts: false });
        });

        _sharedScriptsUnsub = subscribeToSharedScripts(userId, (list) => {
            set({ sharedScripts: list, loadingScripts: false });
            saveMetadataCache(userId, { scripts: get().scripts, sharedScripts: list, rooms: get().rooms });
        }, (error) => {
            console.error('[createMetadataSlice] Erro no listener de roteiros compartilhados:', error);
            set({ loadingScripts: false });
        });

        _roomsUnsub = subscribeToRooms(userId, (list) => {
            set({ rooms: list });
            saveMetadataCache(userId, { scripts: get().scripts, sharedScripts: get().sharedScripts, rooms: list });
        }, (error) => {
            console.error('[createMetadataSlice] Erro no listener de salas colaborativas:', error);
        });

        const activeRoomId = get().activeRoomId;
        if (activeRoomId) {
            get().setActiveRoomId(activeRoomId);
        }

        return () => {
            if (_scriptsUnsub) { _scriptsUnsub(); _scriptsUnsub = null; }
            if (_sharedScriptsUnsub) { _sharedScriptsUnsub(); _sharedScriptsUnsub = null; }
            if (_roomsUnsub) { _roomsUnsub(); _roomsUnsub = null; }
        };
    },

    addScript: async (data) => {
        const userId = auth.currentUser?.uid;
        const userEmail = auth.currentUser?.email;
        if (!userId) throw new Error("Usuário não autenticado");

        const id = safeUUID();
        const now = new Date().toISOString();

        const initialContent: ScriptFull = {
            titulo: data.titulo,
            descricao: data.descricao,
            criadoEm: now,
            entregaEm: data.entregaEm,
            aspectRatio: data.aspectRatio,
            cenas: [
                {
                    id: safeUUID(),
                    ordem: 1,
                    titulo: "INT. LOCAL - DIA",
                    takes: [
                        { id: safeUUID(), ordem: 1, audio: "", visual: "", imagemRef: "" }
                    ]
                }
            ]
        };

        const metadata: ScriptMetadata = {
            id,
            titulo: data.titulo,
            descricao: data.descricao,
            clientName: data.clientName,
            status: 'draft',
            totalCenas: 1,
            totalTakes: 1,
            totalWords: 0,
            duracao: 0,
            aspectRatio: data.aspectRatio,
            criadoEm: now,
            atualizadoEm: now,
            entregaEm: data.entregaEm,
            storageRef: `firestore://users/${userId}/roteiros/${id}`,
            currentVersion: 1,
            availableVersions: [1],
            versionDates: { '1': now },
            ownerId: userId,
            ownerEmail: userEmail || '',
            contributions: {}
        };

        await createScriptInFirestore(userId, userEmail || '', id, metadata, initialContent);

        set((state) => {
            const exists = state.scripts.some(s => s.id === id);
            const nextScripts = exists ? state.scripts : [...state.scripts, metadata];
            saveMetadataCache(userId, { scripts: nextScripts, sharedScripts: state.sharedScripts, rooms: state.rooms });
            return {
                scripts: nextScripts,
                activeScriptId: id,
                activeScriptContent: initialContent,
                activeScriptVersion: 1
            };
        });

        return id;
    },

    deleteScript: async (id) => {
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        const { scripts, sharedScripts, roomScripts } = get();

        // 1. Check if it is a personal script
        const personalMetadata = scripts.find(s => s.id === id);
        if (personalMetadata) {
            const ownerId = personalMetadata.ownerId || userId;
            const currentVersions = personalMetadata.availableVersions || [1];

            await deleteScriptInFirestore(userId, null, id, currentVersions);

            set((state) => {
                const nextScripts = state.scripts.filter((s) => s.id !== id);
                saveMetadataCache(userId, { scripts: nextScripts, sharedScripts: state.sharedScripts, rooms: state.rooms });
                return {
                    scripts: nextScripts,
                    activeScriptId: state.activeScriptId === id ? null : state.activeScriptId,
                    activeScriptContent: state.activeScriptId === id ? null : state.activeScriptContent
                };
            });
            return;
        }

        // 2. Check if it is a shared script (meaning we want to remove our own access)
        const sharedMetadata = sharedScripts.find(s => s.id === id);
        if (sharedMetadata) {
            const ownerId = sharedMetadata.ownerId;
            if (!ownerId) {
                throw new Error("Dono do roteiro compartilhado não encontrado.");
            }

            await deleteSharedScriptReference(userId, id);

            try {
                const ownerMeta = sharedScripts.find(s => s.id === id);
                if (ownerMeta) {
                    const sharedWith = { ...(ownerMeta.sharedWith || {}) };
                    delete sharedWith[userId];

                    await shareScriptInFirestore(
                        id,
                        userId,
                        "",
                        "",
                        "viewer",
                        ownerId,
                        ownerMeta.ownerEmail || "",
                        sharedWith,
                        ownerMeta
                    );
                }
            } catch (err) {
                console.warn("[createMetadataSlice] Erro ao remover participação no roteiro do dono:", err);
            }

            set((state) => {
                const nextShared = state.sharedScripts.filter((s) => s.id !== id);
                saveMetadataCache(userId, { scripts: state.scripts, sharedScripts: nextShared, rooms: state.rooms });
                return {
                    sharedScripts: nextShared,
                    activeScriptId: state.activeScriptId === id ? null : state.activeScriptId,
                    activeScriptContent: state.activeScriptId === id ? null : state.activeScriptContent
                };
            });
            return;
        }

        // 3. Room script deletion (if user has permissions)
        const roomMetadata = roomScripts.find(s => s.id === id);
        if (roomMetadata && roomMetadata.roomId) {
            const roomId = roomMetadata.roomId;
            const room = get().rooms.find(r => r.id === roomId);
            const isOwner = room?.createdBy === userId;
            const member = room?.members[userId];
            const canEdit = isOwner || member?.permission === 'editor';
            
            if (!canEdit) {
                throw new Error("Você não tem permissão para deletar este roteiro.");
            }

            const rawLines = await fetchDirectRoomLines(roomId, id);
            const lineIds = rawLines.map(l => l.id);

            await deleteScriptInFirestore(userId, roomId, id, [], lineIds);

            set((state) => {
                const nextRoomScripts = state.roomScripts.filter((s) => s.id !== id);
                saveRoomCache(roomId, nextRoomScripts);
                return {
                    roomScripts: nextRoomScripts,
                    activeScriptId: state.activeScriptId === id ? null : state.activeScriptId,
                    activeScriptContent: state.activeScriptId === id ? null : state.activeScriptContent
                };
            });
            return;
        }

        throw new Error("Roteiro não encontrado no banco de dados local.");
    },

    duplicateScript: async (id, customTitle) => {
        const userId = auth.currentUser?.uid;
        if (!userId) {
            throw new Error("Usuário não autenticado.");
        }

        const { scripts, sharedScripts, roomScripts } = get();
        const metadata = scripts.find(s => s.id === id) || 
                         sharedScripts.find(s => s.id === id) ||
                         roomScripts.find(s => s.id === id);
        if (!metadata) {
            throw new Error("Roteiro não encontrado no banco de dados local.");
        }

        const newId = safeUUID();
        const now = new Date().toISOString();
        const finalTitle = customTitle || `${metadata.titulo} - Cópia`;

        // Push ghost card immediately so UI shows it loading
        const ghost = { titulo: finalTitle, criadoEm: now };
        set(state => ({ pendingDuplicates: [...state.pendingDuplicates, ghost] }));

        try {
            // 0. Check if it is a room script
            if (metadata.roomId) {
                const roomId = metadata.roomId;
                const room = get().rooms.find(r => r.id === roomId);
                if (room) {
                    const isOwner = room.createdBy === userId;
                    const member = room.members[userId];
                    const canEdit = isOwner || member?.permission === 'editor';
                    if (!canEdit) {
                        throw new Error("Você não tem permissão de editor nesta sala para duplicar este roteiro.");
                    }
                } else {
                    throw new Error("Sala correspondente ao roteiro não encontrada localmente.");
                }

                const rawLines = await fetchDirectRoomLines(roomId, id);
                const lines = rawLines.map(lineDoc => {
                    const data = { ...lineDoc };
                    if (data.type === 'take') {
                        if (data.audio?.lock) {
                            data.audio.lock = { userId: null, userName: null, lockedAt: null };
                        }
                        if (data.visual?.lock) {
                            data.visual.lock = { userId: null, userName: null, lockedAt: null };
                        }
                    }
                    return { id: lineDoc.id, data };
                });

                const newMetadata: ScriptMetadata = {
                    ...metadata,
                    id: newId,
                    titulo: finalTitle,
                    criadoEm: now,
                    atualizadoEm: now,
                    currentVersion: 1,
                    availableVersions: [1],
                    versionDates: { '1': now },
                    storageRef: `firestore://salasRoteiro/${roomId}/roteiros/${newId}`,
                    ownerId: userId,
                    ownerEmail: auth.currentUser?.email || '',
                    permission: undefined,
                    sharedWith: undefined
                };

                // Deep-clone: metadata + linhas + linhas_yjs + storage images
                await cloneRoomScriptDeep(userId, roomId, id, newId, newMetadata, lines);

                set((state) => {
                    const exists = state.roomScripts.some(s => s.id === newId);
                    const nextRoomScripts = exists ? state.roomScripts : [...state.roomScripts, newMetadata];
                    saveRoomCache(roomId, nextRoomScripts);
                    return { roomScripts: nextRoomScripts };
                });
                return;
            }

            // 1. Personal or Shared script duplication
            const ownerId = metadata.ownerId || userId;

            const newMetadata: ScriptMetadata = {
                ...metadata,
                id: newId,
                titulo: finalTitle,
                criadoEm: now,
                atualizadoEm: now,
                currentVersion: 1,
                availableVersions: [1],
                versionDates: { '1': now },
                storageRef: `firestore://users/${userId}/roteiros/${newId}`,
                ownerId: userId,
                ownerEmail: auth.currentUser?.email || '',
                permission: undefined,
                sharedWith: undefined
            };

            // Deep-clone: ALL content versions + metadata + storage images
            await clonePersonalScriptDeep(userId, ownerId, id, newId, newMetadata);

            set((state) => {
                const exists = state.scripts.some(s => s.id === newId);
                const nextScripts = exists ? state.scripts : [...state.scripts, newMetadata];
                saveMetadataCache(userId, { scripts: nextScripts, sharedScripts: state.sharedScripts, rooms: state.rooms });
                return { scripts: nextScripts };
            });
        } finally {
            set(state => ({ pendingDuplicates: state.pendingDuplicates.filter(g => g !== ghost) }));
        }
    },

    importScript: async (content, images, roomId = null, filename = null) => {
        const userId = auth.currentUser?.uid;
        const userEmail = auth.currentUser?.email;
        const displayName = auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || 'Autor';
        if (!userId) throw new Error("Usuário não autenticado");

        const id = safeUUID();
        const now = new Date().toISOString();

        let finalTitle = content.titulo;
        if (!finalTitle || finalTitle.toLowerCase() === 'copy' || finalTitle === 'Cópia') {
            if (filename) {
                finalTitle = filename.replace(/\.roteiroav$/, "").replace(/[_-]/g, " ");
            } else {
                finalTitle = "Roteiro Importado";
            }
        }

        // 1. Upload images to Firebase Storage
        const updatedCenas = await Promise.all(
            content.cenas.map(async (scene) => {
                const updatedTakes = await Promise.all(
                    scene.takes.map(async (take) => {
                        const localImageBlob = images[take.id];
                        if (localImageBlob) {
                            try {
                                const fileExtension = localImageBlob.type === 'image/jpeg' ? 'jpg' : 'webp';
                                const path = roomId
                                    ? `rooms/${roomId}/roteiros/${id}/takes/${take.id}-${Date.now()}.${fileExtension}`
                                    : `users/${userId}/roteiros/${id}/takes/${take.id}-${Date.now()}.${fileExtension}`;
                                
                                const downloadUrl = await uploadImageToStorage(path, localImageBlob);
                                return {
                                    ...take,
                                    imagemRef: downloadUrl,
                                    imageUploadedBy: userId,
                                    imageUploadedByName: displayName
                                };
                            } catch (uploadErr) {
                                console.error(`Failed to upload image for take ${take.id}:`, uploadErr);
                                return take;
                            }
                        }
                        return take;
                    })
                );
                return {
                    ...scene,
                    takes: updatedTakes
                };
            })
        );

        const fullyUpdatedContent: ScriptFull = {
            ...content,
            titulo: finalTitle,
            cenas: updatedCenas,
            criadoEm: now
        };

        const totalCenas = fullyUpdatedContent.cenas.length;
        const totalTakes = fullyUpdatedContent.cenas.reduce((acc, c) => acc + c.takes.length, 0);
        const totalWords = fullyUpdatedContent.cenas.reduce((acc, c) => acc + c.takes.reduce((sum, t) => {
            const aWords = t.audio ? t.audio.trim().split(/\s+/).filter(Boolean).length : 0;
            const vWords = t.visual ? t.visual.trim().split(/\s+/).filter(Boolean).length : 0;
            return sum + aWords + vWords;
        }, 0), 0);

        const metadata: ScriptMetadata = {
            id,
            titulo: finalTitle,
            descricao: fullyUpdatedContent.descricao,
            clientName: (content as any).clientName || 'Cliente Importado',
            status: 'draft',
            totalCenas,
            totalTakes,
            totalWords,
            duracao: 0,
            aspectRatio: fullyUpdatedContent.aspectRatio,
            criadoEm: now,
            atualizadoEm: now,
            storageRef: roomId ? `firestore://salasRoteiro/${roomId}/roteiros/${id}` : `firestore://users/${userId}/roteiros/${id}`,
            currentVersion: 1,
            availableVersions: [1],
            versionDates: { '1': now },
            ownerId: userId,
            ownerEmail: userEmail || '',
            contributions: {},
            roomId: roomId || undefined
        };

        if (roomId) {
            // Room script
            const newLines: any[] = [];
            let currentOrdem = 1;
            fullyUpdatedContent.cenas.forEach(scene => {
                newLines.push({
                    id: scene.id,
                    type: 'scene',
                    titulo: scene.titulo,
                    ordem: currentOrdem++
                });
                scene.takes.forEach(take => {
                    newLines.push({
                        id: take.id,
                        type: 'take',
                        ordem: currentOrdem++,
                        audio: { texto: take.audio || '', lock: { userId: null, userName: null, lockedAt: null } },
                        visual: { texto: take.visual || '', lock: { userId: null, userName: null, lockedAt: null } },
                        imagemRef: take.imagemRef || '',
                        imageScale: take.imageScale || 1,
                        imageX: take.imageX || 0,
                        imageY: take.imageY || 0,
                        flipX: take.flipX || false,
                        flipY: take.flipY || false,
                        audioAuthors: [],
                        visualAuthors: []
                    });
                });
            });

            // Yjs fields should be configured in editor slice since it controls Yjs
            // But we call service to configure room script lines
            await createScriptInRoomFirestore(roomId, id, metadata, newLines);

            // Import collaboration provider initialization if necessary.
            // Slices are coupled via composed state, so editor slice will manage providers when loaded.
            set((state) => {
                const exists = state.roomScripts.some(s => s.id === id);
                const nextRoomScripts = exists ? state.roomScripts : [...state.roomScripts, metadata];
                saveRoomCache(roomId, nextRoomScripts);
                return {
                    roomScripts: nextRoomScripts
                };
            });
        } else {
            // Personal script
            await createScriptInFirestore(userId, userEmail || '', id, metadata, fullyUpdatedContent);

            set((state) => {
                const exists = state.scripts.some(s => s.id === id);
                const nextScripts = exists ? state.scripts : [...state.scripts, metadata];
                saveMetadataCache(userId, { scripts: nextScripts, sharedScripts: state.sharedScripts, rooms: state.rooms });
                return {
                    scripts: nextScripts
                };
            });
        }

        return id;
    },


    fetchScriptContent: async (script) => {
        const userId = auth.currentUser?.uid;
        if (!userId) throw new Error("Usuário não autenticado");

        const resolvedOwnerId = script.ownerId || userId;
        const resolvedRoomId = script.roomId || null;

        if (resolvedRoomId) {
            const rawLines = await fetchDirectRoomLines(resolvedRoomId, script.id);
            const cenas: Scene[] = [];
            let currentScene: Scene | null = null;

            rawLines.forEach(doc => {
                if (doc.type === 'scene') {
                    currentScene = {
                        id: doc.id,
                        ordem: doc.ordem,
                        titulo: doc.titulo || 'Cena Sem Título',
                        takes: []
                    };
                    cenas.push(currentScene);
                } else if (doc.type === 'take') {
                    // Extract fields like useScriptStore parseTakeDoc does
                    const audioText = doc['audio.texto'] || doc.audio?.texto || '';
                    const visualText = doc['visual.texto'] || doc.visual?.texto || '';
                    const takeItem: Take = {
                        id: doc.id,
                        ordem: doc.ordem,
                        audio: audioText,
                        visual: visualText,
                        imagemRef: doc.imagemRef || '',
                        imageScale: doc.imageScale || 1,
                        imageX: doc.imageX || 0,
                        imageY: doc.imageY || 0,
                        flipX: doc.flipX || false,
                        flipY: doc.flipY || false,
                        editedBy: doc.audio?.editedBy || doc.visual?.editedBy || '',
                        editedByName: doc.audio?.editedByName || doc.visual?.editedByName || '',
                        audioAuthors: doc.audioAuthors || [],
                        visualAuthors: doc.visualAuthors || []
                    };

                    if (currentScene) {
                        currentScene.takes.push(takeItem);
                    } else {
                        currentScene = {
                            id: 'default-scene',
                            ordem: 1,
                            titulo: 'Cena Principal',
                            takes: [takeItem]
                        };
                        cenas.push(currentScene);
                    }
                }
            });

            return {
                titulo: script.titulo,
                descricao: script.descricao,
                criadoEm: script.criadoEm,
                entregaEm: script.entregaEm || undefined,
                aspectRatio: script.aspectRatio,
                cenas
            };
        } else {
            const activeVersion = script.currentVersion || 1;
            const contentData = await fetchDirectScriptContent(resolvedOwnerId, script.id, activeVersion);
            if (!contentData) {
                throw new Error("Conteúdo do roteiro não encontrado.");
            }
            return contentData;
        }
    },

    getClients: () => {
        const { scripts, clientSortField, clientSortOrder } = get();
        const clientMap = scripts.reduce((acc, s) => {
            if (!acc[s.clientName]) {
                acc[s.clientName] = { 
                    name: s.clientName, 
                    createdAt: s.criadoEm, 
                    updatedAt: s.atualizadoEm 
                };
            } else {
                if (new Date(s.criadoEm) < new Date(acc[s.clientName].createdAt)) {
                    acc[s.clientName].createdAt = s.criadoEm;
                }
                if (new Date(s.atualizadoEm) > new Date(acc[s.clientName].updatedAt)) {
                    acc[s.clientName].updatedAt = s.atualizadoEm;
                }
            }
            return acc;
        }, {} as Record<string, { name: string; createdAt: string; updatedAt: string }>);

        const clientNames = Object.keys(clientMap);

        return clientNames.sort((a, b) => {
            let comparison = 0;
            switch (clientSortField) {
                case 'name':
                    comparison = a.localeCompare(b);
                    break;
                case 'createdAt':
                    comparison = new Date(clientMap[a].createdAt).getTime() - new Date(clientMap[b].createdAt).getTime();
                    break;
                case 'updatedAt':
                    comparison = new Date(clientMap[a].updatedAt).getTime() - new Date(clientMap[b].updatedAt).getTime();
                    break;
            }
            return clientSortOrder === 'asc' ? comparison : -comparison;
        });
    },

    getFilteredScripts: () => {
        const { scripts, selectedClient } = get();
        let filtered = selectedClient 
            ? scripts.filter(s => s.clientName === selectedClient)
            : scripts;
            
        return [...filtered].sort((a, b) => 
            new Date(b.atualizadoEm).getTime() - new Date(a.atualizadoEm).getTime()
        );
    },

    canEditActiveScript: () => {
        const { activeScriptId, scripts, sharedScripts, activeRoomId, rooms, roomScripts } = get();
        if (!activeScriptId) return false;
        
        if (scripts.some(s => s.id === activeScriptId)) return true;
        
        const roomScript = roomScripts.find(s => s.id === activeScriptId);
        const targetRoomId = activeRoomId || roomScript?.roomId;
        if (targetRoomId) {
            const room = rooms.find(r => r.id === targetRoomId);
            if (room) {
                const userId = auth.currentUser?.uid;
                if (room.createdBy === userId) return true;
                const member = room.members[userId || ''];
                return member?.permission === 'editor';
            }
        }
        
        const shared = sharedScripts.find(s => s.id === activeScriptId);
        return shared?.permission === 'editor';
    },

    shareScript: async (scriptId, email, permission) => {
        const userId = auth.currentUser?.uid;
        const myEmail = auth.currentUser?.email;
        if (!userId) throw new Error("Usuário não autenticado");

        const targetUser = await findUserByEmail(email);
        if (!targetUser) {
            throw new Error("Usuário com este e-mail não encontrado. Certifique-se de que ele já fez login no Dojo Utilities.");
        }

        const targetUid = targetUser.uid;
        const targetDisplayName = targetUser.displayName || email.split('@')[0];

        if (targetUid === userId) {
            throw new Error("Você não pode compartilhar um roteiro com você mesmo.");
        }

        const { scripts } = get();
        const metadata = scripts.find(s => s.id === scriptId);
        if (!metadata) throw new Error("Roteiro não encontrado.");

        const now = new Date().toISOString();
        const updatedSharedWith = {
            ...(metadata.sharedWith || {}),
            [targetUid]: {
                email: email.toLowerCase().trim(),
                displayName: targetDisplayName,
                permission,
                sharedAt: now
            }
        };

        await shareScriptInFirestore(
            scriptId,
            targetUid,
            targetDisplayName,
            email,
            permission,
            userId,
            myEmail || '',
            updatedSharedWith,
            metadata
        );
        
        set(state => ({
            scripts: state.scripts.map(s => s.id === scriptId ? { ...s, sharedWith: updatedSharedWith } : s)
        }));
    },

    unshareScript: async (scriptId, targetUid) => {
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        const { scripts } = get();
        const metadata = scripts.find(s => s.id === scriptId);
        if (!metadata) return;

        const sharedWith = { ...(metadata.sharedWith || {}) };
        delete sharedWith[targetUid];

        await unshareScriptInFirestore(scriptId, targetUid, userId, sharedWith);

        set(state => ({
            scripts: state.scripts.map(s => s.id === scriptId ? { ...s, sharedWith } : s)
        }));
    }
});
