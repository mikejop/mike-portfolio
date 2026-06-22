// ---------------------------------------------------------------------------
// Editor Slice — Roteiro AV
// Zustand slice for managing the active script, cenas, takes, lock control,
// versions, and Yjs real-time collaborative editing.
// ---------------------------------------------------------------------------

import { StateCreator } from 'zustand';
import { ScriptStoreState, EditorSliceState } from '../../types/store';
import { ScriptFull, Scene, Take, ScriptMetadata } from '../../types/domain';
import { auth } from '@/lib/firebase';
import { serverTimestamp } from 'firebase/firestore';
import * as Y from 'yjs';
import {
    subscribeToPresence,
    subscribeToActiveScriptMetadata,
    subscribeToRoomLines,
    subscribeToActiveScriptContent,
    deletePresence,
    updatePresence,
    adquirirLock as adquirirLockService,
    liberarLock as liberarLockService,
    saveScriptMetadata,
    saveScriptContent,
    writeRoomLineDirect,
    deleteRoomLineDirect,
    writeRoomLinesBatch,
    loadScriptContentLegacy,
    fetchDirectScriptContent,
    appendRoomHistoryLog,
    deleteScriptVersions,
    updateRoomYjsSnapshots
} from '@/lib/services/scriptService';
import { safeUUID } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
        console.error("[createEditorSlice] Failed to save metadata cache:", e);
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
        console.error(`[createEditorSlice] Failed to save room cache for room ${roomId}:`, e);
    }
};

export function isLockAtivo(lock: any): boolean {
    if (!lock || !lock.userId || !lock.lockedAt) return false;
    const lockedTime = typeof lock.lockedAt.toMillis === 'function'
        ? lock.lockedAt.toMillis()
        : new Date(lock.lockedAt).getTime();
    return (Date.now() - lockedTime) <= 30000;
}

function parseTakeDoc(doc: any): Take {
    const audioText = doc['audio.texto'] || doc.audio?.texto || '';
    const visualText = doc['visual.texto'] || doc.visual?.texto || '';
    
    const audioLock = doc.audio?.lock || (doc['audio.lock.userId'] ? {
        userId: doc['audio.lock.userId'],
        userName: doc['audio.lock.userName'] || null,
        lockedAt: doc['audio.lock.lockedAt'] || null
    } : null);
    
    const visualLock = doc.visual?.lock || (doc['visual.lock.userId'] ? {
        userId: doc['visual.lock.userId'],
        userName: doc['visual.lock.userName'] || null,
        lockedAt: doc['visual.lock.lockedAt'] || null
    } : null);

    const editedBy = doc['audio.editedBy'] || doc['visual.editedBy'] || doc.audio?.editedBy || doc.visual?.editedBy || '';
    const editedByName = doc['audio.editedByName'] || doc['visual.editedByName'] || doc.audio?.editedByName || doc.visual?.editedByName || '';

    return {
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
        editedBy,
        editedByName,
        audioLock,
        visualLock,
        audioAuthors: doc.audioAuthors || [],
        visualAuthors: doc.visualAuthors || []
    };
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
    if (typeof window !== 'undefined') {
        let binary = '';
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    } else {
        return Buffer.from(bytes).toString('base64');
    }
}

// ---------------------------------------------------------------------------
// Module level states
// ---------------------------------------------------------------------------

const _dirtyTakes = new Set<string>();
const _dirtyScenes = new Set<string>();
const _myLocks = new Set<string>();
const _fieldDebounceTimers = new Map<string, ReturnType<typeof setTimeout>>();
const _persistTimers = new Map<string, ReturnType<typeof setTimeout>>();

const PERSIST_DEBOUNCE_MS = 1200;

let _contentUnsub: (() => void) | null = null;
let _metadataUnsub: (() => void) | null = null;
let _roomPresenceUnsub: (() => void) | null = null;
let _heartbeatInterval: any = null;

const releaseAllMyLocks = async (roomId: string | null, scriptId: string | null) => {
    if (!roomId || !scriptId || _myLocks.size === 0) return;
    const userId = auth.currentUser?.uid;
    if (!userId) return;
    
    const locksToRelease = Array.from(_myLocks);
    _myLocks.clear();
    
    for (const lockKey of locksToRelease) {
        const [takeId, campo] = lockKey.split('-');
        try {
            await liberarLockService(roomId, scriptId, takeId, campo as any);
        } catch (e) {
            console.warn(`[createEditorSlice] Erro ao liberar lock ${lockKey} ao limpar:`, e);
        }
    }
};

const clearActiveScriptListeners = () => {
    if (_contentUnsub) {
        _contentUnsub();
        _contentUnsub = null;
    }
    if (_metadataUnsub) {
        _metadataUnsub();
        _metadataUnsub = null;
    }
    if (_roomPresenceUnsub) {
        _roomPresenceUnsub();
        _roomPresenceUnsub = null;
    }
    if (_heartbeatInterval) {
        clearInterval(_heartbeatInterval);
        _heartbeatInterval = null;
    }
};

function mergeContent(local: ScriptFull | null, incoming: ScriptFull): ScriptFull {
    if (!local) return incoming;

    const titulo = _dirtyScenes.has('titulo') ? local.titulo : incoming.titulo;
    const descricao = _dirtyScenes.has('descricao') ? local.descricao : incoming.descricao;

    const scenesMap = new Map(incoming.cenas.map(s => [s.id, s]));

    const mergedCenas = local.cenas.map(localScene => {
        const incomingScene = scenesMap.get(localScene.id);
        if (!incomingScene) {
            return localScene;
        }

        const sceneTitle = _dirtyScenes.has(localScene.id) ? localScene.titulo : incomingScene.titulo;

        const incomingTakesMap = new Map(incomingScene.takes.map(t => [t.id, t]));
        
        const mergedTakes = localScene.takes.map(localTake => {
            const incomingTake = incomingTakesMap.get(localTake.id);
            if (!incomingTake) {
                return localTake;
            }

            if (_dirtyTakes.has(localTake.id)) {
                return { ...incomingTake, ...localTake };
            }
            return incomingTake;
        });

        const localTakeIds = new Set(localScene.takes.map(t => t.id));
        const externalTakes = incomingScene.takes.filter(t => !localTakeIds.has(t.id));
        const allTakes = [...mergedTakes, ...externalTakes].sort((a, b) => a.ordem - b.ordem);

        return {
            ...incomingScene,
            titulo: sceneTitle,
            takes: allTakes
        };
    });

    const localSceneIds = new Set(local.cenas.map(s => s.id));
    const externalScenes = incoming.cenas.filter(s => !localSceneIds.has(s.id));
    const allScenes = [...mergedCenas, ...externalScenes].sort((a, b) => a.ordem - b.ordem);

    return {
        ...incoming,
        titulo,
        descricao,
        cenas: allScenes
    };
}

async function syncFlatLines(
    scriptId: string,
    roomId: string,
    newCenas: Scene[],
    oldCenas: Scene[],
    reason: { tipo: 'edicao' | 'criacao_linha' | 'movimento_linha' | 'exclusao_linha'; campo: 'audio' | 'visual' | 'estrutura'; linhaId?: string; conteudoResumo?: string }
) {
    const newLines: any[] = [];
    let currentOrdem = 1;
    newCenas.forEach(scene => {
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
                audio: {
                    texto: take.audio || '',
                    editedBy: take.editedBy || null,
                    editedAt: take.editedBy ? new Date().toISOString() : null,
                    lock: take.audioLock || { userId: null, userName: null, lockedAt: null }
                },
                visual: {
                    texto: take.visual || '',
                    editedBy: take.editedBy || null,
                    editedAt: take.editedBy ? new Date().toISOString() : null,
                    lock: take.visualLock || { userId: null, userName: null, lockedAt: null }
                },
                imagemRef: take.imagemRef || '',
                imageScale: take.imageScale || 1,
                imageX: take.imageX || 0,
                imageY: take.imageY || 0,
                flipX: take.flipX || false,
                flipY: take.flipY || false,
                audioAuthors: take.audioAuthors || [],
                visualAuthors: take.visualAuthors || []
            });
        });
    });

    const oldLinesMap = new Map(
        oldCenas.flatMap(s => [
            { id: s.id, type: 'scene' },
            ...s.takes.map(t => ({ id: t.id, type: 'take' }))
        ]).map(x => [x.id, x])
    );

    const newLinesMap = new Map(newLines.map(x => [x.id, x]));

    // 2. Identify deletions
    const deletedLineIds = Array.from(oldLinesMap.keys()).filter(id => !newLinesMap.has(id));

    // 3. Write in batch
    const userId = auth.currentUser?.uid;
    let historyLog = null;
    if (userId) {
        const userName = auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || 'Colaborador';
        historyLog = {
            userId,
            userName,
            log: {
                linhaId: reason.linhaId || '',
                campo: reason.campo,
                tipo: reason.tipo,
                conteudoResumo: reason.conteudoResumo || ''
            }
        };
    }

    await writeRoomLinesBatch(roomId, scriptId, newLines, deletedLineIds, historyLog);
}

export const createEditorSlice: StateCreator<
    ScriptStoreState,
    [],
    [],
    EditorSliceState
> = (set, get) => ({
    activeScriptId: null,
    activeScriptContent: null,
    activeScriptVersion: null,
    syncError: null,
    focusedFieldId: null,
    setFocusedFieldId: (id) => set({ focusedFieldId: id }),

    resetDirtyTracking: () => {
        _dirtyTakes.clear();
        _dirtyScenes.clear();
    },

    adquirirLock: async (takeId, campo) => {
        const { activeScriptId, activeRoomId } = get();
        if (!activeScriptId || !activeRoomId) return;
        const userId = auth.currentUser?.uid;
        if (!userId) return;
        
        const userName = auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || 'Colaborador';
        try {
            await adquirirLockService(activeRoomId, activeScriptId, takeId, campo, userId, userName);
            _myLocks.add(`${takeId}-${campo}`);
        } catch (e) {
            console.error(`[createEditorSlice] Erro ao adquirir lock:`, e);
        }
    },

    liberarLock: async (takeId, campo) => {
        const { activeScriptId, activeRoomId } = get();
        if (!activeScriptId || !activeRoomId) return;
        
        const lockKey = `${takeId}-${campo}`;
        _myLocks.delete(lockKey);
        
        try {
            await liberarLockService(activeRoomId, activeScriptId, takeId, campo);
        } catch (e) {
            console.error(`[createEditorSlice] Erro ao liberar lock:`, e);
        }
    },

    refreshLock: async (takeId, campo) => {
        const { activeScriptId, activeRoomId } = get();
        if (!activeScriptId || !activeRoomId) return;
        const userId = auth.currentUser?.uid;
        if (!userId) return;
        
        const userName = auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || 'Colaborador';
        try {
            await adquirirLockService(activeRoomId, activeScriptId, takeId, campo, userId, userName);
        } catch (e) {
            console.warn(`[createEditorSlice] Erro ao atualizar lock:`, e);
        }
    },

    setActiveScript: async (id, ownerId = null, roomId = null) => {
        _dirtyTakes.clear();
        _dirtyScenes.clear();

        set({
            activeScriptContent: null,
            activeScriptVersion: null,
            syncError: null
        });

        const oldActiveScriptId = get().activeScriptId;
        const oldActiveRoomId = get().activeRoomId;
        const userId = auth.currentUser?.uid;
        
        if (oldActiveScriptId && userId) {
            const oldMetadata = get().scripts.find(s => s.id === oldActiveScriptId) || 
                                get().sharedScripts.find(s => s.id === oldActiveScriptId) ||
                                get().roomScripts.find(s => s.id === oldActiveScriptId);
            const oldRoomId = oldActiveRoomId || oldMetadata?.roomId;
            const oldOwnerId = oldMetadata?.ownerId || userId;
            
            await releaseAllMyLocks(oldRoomId || null, oldActiveScriptId);
            await deletePresence(oldRoomId || null, oldOwnerId, oldActiveScriptId, userId);
        }

        clearActiveScriptListeners();
        set({ showNewScriptModal: false });

        if (!id) {
            set({ activeScriptId: null, activeScriptContent: null, activeScriptVersion: null });
            return;
        }

        if (!userId) return;

        const displayName = auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || 'Colaborador';

        const metadata = get().scripts.find(s => s.id === id) || 
                         get().sharedScripts.find(s => s.id === id) ||
                         get().roomScripts.find(s => s.id === id);
        const resolvedOwnerId = ownerId || metadata?.ownerId || userId;
        const resolvedRoomId = roomId || metadata?.roomId || null;

        set({ 
            activeRoomId: resolvedRoomId,
            activeTab: resolvedRoomId ? 'shared' : get().activeTab
        });

        const updateMyPresence = async () => {
            try {
                await updatePresence(resolvedRoomId, resolvedOwnerId, id, userId, displayName);
            } catch (e) {
                console.warn("Error updating presence:", e);
            }
        };

        await updateMyPresence();
        _heartbeatInterval = setInterval(updateMyPresence, 10000);

        _roomPresenceUnsub = subscribeToPresence(resolvedRoomId, id, resolvedOwnerId, (list) => {
            set({ roomPresence: list });
        }, (error) => {
            console.error('[createEditorSlice] Erro no listener de presença activa:', error);
        });

        try {
            set({ loadingApp: true });
            let lastSubscribedVersion: string | number | null = null;

            _metadataUnsub = subscribeToActiveScriptMetadata(resolvedRoomId, resolvedOwnerId, id, (metaData) => {
                if (!metaData) {
                    if (typeof window !== 'undefined') {
                        window.location.href = "/tools/script-editor";
                    }
                    return;
                }
                const activeVersion = metaData.currentVersion || 1;

                set(state => {
                    if (resolvedRoomId) {
                        const exists = state.roomScripts.some(s => s.id === id);
                        return {
                            roomScripts: exists
                                ? state.roomScripts.map(s => s.id === id ? { ...s, ...metaData } : s)
                                : [...state.roomScripts, { ...metaData, id, roomId: resolvedRoomId }]
                        };
                    }
                    const isShared = resolvedOwnerId !== userId;
                    if (isShared) {
                        const exists = state.sharedScripts.some(s => s.id === id);
                        return {
                            sharedScripts: exists
                                ? state.sharedScripts.map(s => s.id === id ? { ...s, ...metaData } : s)
                                : [...state.sharedScripts, { ...metaData, id }]
                        };
                    } else {
                        const exists = state.scripts.some(s => s.id === id);
                        return {
                            scripts: exists
                                ? state.scripts.map(s => s.id === id ? { ...s, ...metaData } : s)
                                : [...state.scripts, { ...metaData, id, ownerId: resolvedOwnerId }]
                        };
                    }
                });

                if (lastSubscribedVersion !== activeVersion) {
                    lastSubscribedVersion = activeVersion;

                    if (_contentUnsub) {
                        _contentUnsub();
                        _contentUnsub = null;
                    }

                    const isLatest = activeVersion === (metaData.availableVersions ? metaData.availableVersions[metaData.availableVersions.length - 1] : 1);

                    if (resolvedRoomId && isLatest) {
                        _contentUnsub = subscribeToRoomLines(resolvedRoomId, id, (docs) => {
                            set({ loadingApp: false });

                            const incomingCenas: Scene[] = [];
                            let currentScene: Scene | null = null;

                            docs.forEach(doc => {
                                if (doc.type === 'scene') {
                                    currentScene = {
                                        id: doc.id,
                                        ordem: doc.ordem,
                                        titulo: doc.titulo || 'Cena Sem Título',
                                        takes: []
                                    };
                                    incomingCenas.push(currentScene);
                                } else if (doc.type === 'take') {
                                    const takeItem = parseTakeDoc(doc);
                                    if (currentScene) {
                                        currentScene.takes.push(takeItem);
                                    } else {
                                        currentScene = {
                                            id: 'default-scene',
                                            ordem: 1,
                                            titulo: 'Cena Principal',
                                            takes: [takeItem]
                                        };
                                        incomingCenas.push(currentScene);
                                    }
                                }
                            });

                            const local = get().activeScriptContent;
                            let finalCenas = incomingCenas;
                            if (local) {
                                finalCenas = incomingCenas.map(incScene => {
                                    const localScene = local.cenas.find(s => s.id === incScene.id);
                                    return {
                                        ...incScene,
                                        takes: incScene.takes.map(incTake => {
                                            const localTake = localScene?.takes.find(t => t.id === incTake.id);
                                            if (!localTake) return incTake;

                                            let mergedTake = { ...incTake };

                                            const isAudioMine = incTake.audioLock?.userId === userId && isLockAtivo(incTake.audioLock);
                                            if (isAudioMine) {
                                                mergedTake.audio = localTake.audio;
                                                mergedTake.audioAuthors = localTake.audioAuthors || [];
                                            }

                                            const isVisualMine = incTake.visualLock?.userId === userId && isLockAtivo(incTake.visualLock);
                                            if (isVisualMine) {
                                                mergedTake.visual = localTake.visual;
                                                mergedTake.visualAuthors = localTake.visualAuthors || [];
                                            }

                                            return mergedTake;
                                        })
                                    };
                                });
                            }

                            set({
                                activeScriptId: id,
                                activeScriptContent: {
                                    titulo: metaData.titulo,
                                    descricao: metaData.descricao,
                                    criadoEm: metaData.criadoEm,
                                    entregaEm: metaData.entregaEm,
                                    aspectRatio: metaData.aspectRatio,
                                    cenas: finalCenas
                                },
                                activeScriptVersion: activeVersion
                            });
                        }, (error) => {
                            console.error('[createEditorSlice] Erro no listener de linhas da sala:', error);
                            set({ syncError: 'Erro de permissão ou falha ao carregar conteúdo do roteiro.', loadingApp: false });
                        });

                    } else {
                        _contentUnsub = subscribeToActiveScriptContent(resolvedRoomId, resolvedOwnerId, id, activeVersion, (content) => {
                            set({ loadingApp: false });
                            
                            if (!content) {
                                if (activeVersion === 1) {
                                    loadScriptContentLegacy(resolvedRoomId, resolvedOwnerId, id).then(fallbackContent => {
                                        if (fallbackContent) {
                                            set({ 
                                                activeScriptId: id, 
                                                activeScriptContent: fallbackContent, 
                                                activeScriptVersion: activeVersion 
                                            });
                                        }
                                    }).catch(e => {
                                        console.error('[createEditorSlice] Erro ao carregar fallback content/full:', e);
                                        set({ syncError: 'Erro ao carregar o conteúdo legado do roteiro.' });
                                    });
                                }
                                return;
                            }

                            const localContent = get().activeScriptContent;
                            const mergedContent = mergeContent(localContent, content);

                            let needsBackfill = false;
                            const scriptOwner = metaData.ownerId || resolvedOwnerId;
                            const scriptOwnerName = metaData.ownerEmail?.split('@')[0] || 'Autor';

                            const backfilledContent = {
                                ...mergedContent,
                                cenas: mergedContent.cenas.map(scene => ({
                                    ...scene,
                                    takes: scene.takes.map(take => {
                                        let updatedTake = { ...take };
                                        let changed = false;

                                        const hasText = ((take.audio || '') + (take.visual || '')).trim().length > 0;
                                        if (hasText && !take.editedBy) {
                                            updatedTake.editedBy = scriptOwner;
                                            updatedTake.editedByName = scriptOwnerName;
                                            changed = true;
                                        }

                                        if (take.audioAuthors && take.audioAuthors.length > 0) {
                                            updatedTake.audioAuthors = [];
                                            changed = true;
                                        }
                                        if (take.visualAuthors && take.visualAuthors.length > 0) {
                                            updatedTake.visualAuthors = [];
                                            changed = true;
                                        }

                                        if (changed) {
                                            needsBackfill = true;
                                        }
                                        return updatedTake;
                                    })
                                }))
                            };

                            if (needsBackfill) {
                                saveScriptContent(resolvedRoomId, resolvedOwnerId, id, activeVersion, backfilledContent)
                                    .catch(e => console.warn('Backfill content write failed:', e));
                                saveScriptMetadata(resolvedRoomId, resolvedOwnerId, id, { ...metaData })
                                    .catch(e => console.warn('Backfill metadata write failed:', e));
                            }

                            const finalContent = needsBackfill ? backfilledContent : mergedContent;
                            set({ 
                                activeScriptId: id, 
                                activeScriptContent: finalContent, 
                                activeScriptVersion: activeVersion 
                            });
                        }, (error) => {
                            console.error('[createEditorSlice] Erro no listener de conteúdo do roteiro ativo:', error);
                            set({ syncError: 'Erro de permissão ou falha ao carregar conteúdo do roteiro.', loadingApp: false });
                        });
                    }
                }
            }, (error) => {
                console.error('[createEditorSlice] Erro no listener de metadados do roteiro ativo:', error);
                set({ syncError: 'Erro de permissão ou falha ao carregar metadados do roteiro.', loadingApp: false });
            });
        } catch (error) {
            console.error("Failed to load script content:", error);
            set({ loadingApp: false });
        }
    },

    updateScriptContent: async (id, updates, isMeaningful = false, reason = null) => {
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        const { scripts, sharedScripts, roomScripts, activeScriptContent } = get();
        if (!activeScriptContent) return;

        const newContent = { ...activeScriptContent, ...updates };
        if (updates.titulo !== undefined) _dirtyScenes.add('titulo');
        if (updates.descricao !== undefined) _dirtyScenes.add('descricao');
        const now = new Date().toISOString();

        const isRoomScript = roomScripts.some(s => s.id === id);
        const isShared = !isRoomScript && !scripts.some(s => s.id === id);
        const metadata = isRoomScript 
            ? roomScripts.find(s => s.id === id)
            : (isShared ? sharedScripts.find(s => s.id === id) : scripts.find(s => s.id === id));

        if (metadata) {
            const ownerId = metadata.ownerId || userId;

            let canEdit = true;
            if (isRoomScript) {
                const room = get().rooms.find(r => r.id === metadata.roomId);
                if (room) {
                    const isOwner = room.createdBy === userId;
                    const member = room.members[userId];
                    canEdit = isOwner || member?.permission === 'editor';
                } else {
                    canEdit = false;
                }
            } else if (isShared && metadata.permission === 'viewer') {
                canEdit = false;
            }

            if (!canEdit) {
                console.warn("User does not have write permission, skipping write.");
                return;
            }

            const currentAvailableVersions = metadata.availableVersions || [1];
            const latestVersion = currentAvailableVersions[currentAvailableVersions.length - 1];
            const currentActiveVersion = get().activeScriptVersion || 1;

            if (currentActiveVersion !== latestVersion) {
                const confirmed = window.confirm("Você está editando uma versão anterior. Tem certeza? Isso criará uma nova versão.");
                if (!confirmed) {
                    return;
                }

                let newVersion: string | number = `${latestVersion}.${currentActiveVersion}`;
                if (currentAvailableVersions.includes(newVersion)) {
                    let suffix = 1;
                    while (currentAvailableVersions.includes(`${newVersion}.${suffix}`)) {
                        suffix++;
                    }
                    newVersion = `${newVersion}.${suffix}`;
                }

                const newAvailableVersions = [...currentAvailableVersions, newVersion];

                const updatedMetadata: ScriptMetadata = {
                    ...metadata,
                    titulo: newContent.titulo,
                    descricao: newContent.descricao,
                    aspectRatio: newContent.aspectRatio,
                    totalCenas: newContent.cenas.length,
                    totalTakes: newContent.cenas.reduce((acc, c) => acc + c.takes.length, 0),
                    totalWords: newContent.cenas.reduce((acc, c) => acc + c.takes.reduce((sum, t) => {
                        const aWords = t.audio ? t.audio.trim().split(/\s+/).filter(Boolean).length : 0;
                        const vWords = t.visual ? t.visual.trim().split(/\s+/).filter(Boolean).length : 0;
                        return sum + aWords + vWords;
                    }, 0), 0),
                    currentVersion: newVersion,
                    availableVersions: newAvailableVersions,
                    versionDates: { ...(metadata.versionDates || {}), [String(newVersion)]: now },
                    atualizadoEm: now
                };

                const nextScripts = scripts.map(s => s.id === id ? updatedMetadata : s);
                const nextShared = sharedScripts.map(s => s.id === id ? updatedMetadata : s);
                const nextRoomScripts = roomScripts.map(s => s.id === id ? updatedMetadata : s);

                if (metadata.roomId) {
                    saveRoomCache(metadata.roomId, nextRoomScripts);
                } else {
                    saveMetadataCache(userId, { scripts: nextScripts, sharedScripts: nextShared, rooms: get().rooms });
                }

                set({
                    scripts: nextScripts,
                    sharedScripts: nextShared,
                    roomScripts: nextRoomScripts,
                    activeScriptContent: newContent,
                    activeScriptVersion: newVersion
                });

                await saveScriptContent(metadata.roomId || null, ownerId, id, newVersion, newContent);
                await saveScriptMetadata(metadata.roomId || null, ownerId, id, updatedMetadata);
                await get().switchScriptVersion(newVersion);
                return;
            }

            const updatedMetadata: ScriptMetadata = {
                ...metadata,
                titulo: newContent.titulo,
                descricao: newContent.descricao,
                aspectRatio: newContent.aspectRatio,
                totalCenas: newContent.cenas.length,
                totalTakes: newContent.cenas.reduce((acc, c) => acc + c.takes.length, 0),
                totalWords: newContent.cenas.reduce((acc, c) => acc + c.takes.reduce((sum, t) => {
                    const aWords = t.audio ? t.audio.trim().split(/\s+/).filter(Boolean).length : 0;
                    const vWords = t.visual ? t.visual.trim().split(/\s+/).filter(Boolean).length : 0;
                    return sum + aWords + vWords;
                }, 0), 0),
                atualizadoEm: now
            };

            const nextScripts = scripts.map(s => s.id === id ? updatedMetadata : s);
            const nextShared = sharedScripts.map(s => s.id === id ? updatedMetadata : s);
            const nextRoomScripts = roomScripts.map(s => s.id === id ? updatedMetadata : s);

            if (metadata.roomId) {
                saveRoomCache(metadata.roomId, nextRoomScripts);
            } else {
                saveMetadataCache(userId, { scripts: nextScripts, sharedScripts: nextShared, rooms: get().rooms });
            }

            set({
                activeScriptContent: newContent,
                scripts: nextScripts,
                sharedScripts: nextShared,
                roomScripts: nextRoomScripts
            });

            if (metadata.roomId && updates.cenas) {
                await syncFlatLines(id, metadata.roomId, newContent.cenas, activeScriptContent.cenas, reason || { tipo: 'edicao', campo: 'estrutura' });
            }

            if (_persistTimers.has(id)) {
                clearTimeout(_persistTimers.get(id)!);
            }

            const timer = setTimeout(async () => {
                _persistTimers.delete(id);

                const dirtyTakesArray = Array.from(_dirtyTakes);
                const dirtyScenesArray = Array.from(_dirtyScenes);
                _dirtyTakes.clear();
                _dirtyScenes.clear();

                const latestContent = get().activeScriptContent;
                const latestVersion = get().activeScriptVersion || 1;
                if (!latestContent) return;

                if (metadata.roomId) {
                    for (const takeId of dirtyTakesArray) {
                        let foundTake: Take | null = null;
                        latestContent.cenas.forEach(scene => {
                            const t = scene.takes.find(tk => tk.id === takeId);
                            if (t) foundTake = t;
                        });

                        if (foundTake) {
                            await writeRoomLineDirect(metadata.roomId, id, takeId, {
                                audio: {
                                    texto: (foundTake as Take).audio || '',
                                    editedBy: (foundTake as Take).editedBy || null,
                                    editedAt: (foundTake as Take).editedBy ? serverTimestamp() : null,
                                    lock: (foundTake as Take).audioLock || { userId: null, userName: null, lockedAt: null }
                                },
                                visual: {
                                    texto: (foundTake as Take).visual || '',
                                    editedBy: (foundTake as Take).editedBy || null,
                                    editedAt: (foundTake as Take).editedBy ? serverTimestamp() : null,
                                    lock: (foundTake as Take).visualLock || { userId: null, userName: null, lockedAt: null }
                                },
                                imagemRef: (foundTake as Take).imagemRef || '',
                                imageScale: (foundTake as Take).imageScale || 1,
                                imageX: (foundTake as Take).imageX || 0,
                                imageY: (foundTake as Take).imageY || 0,
                                flipX: (foundTake as Take).flipX || false,
                                flipY: (foundTake as Take).flipY || false,
                                audioAuthors: (foundTake as Take).audioAuthors || [],
                                visualAuthors: (foundTake as Take).visualAuthors || []
                            });
                        }
                    }

                    for (const sceneId of dirtyScenesArray) {
                        const scene = latestContent.cenas.find(s => s.id === sceneId);
                        if (scene) {
                            await writeRoomLineDirect(metadata.roomId, id, sceneId, {
                                titulo: scene.titulo
                            });
                        }
                    }
                }

                await saveScriptMetadata(metadata.roomId || null, ownerId, id, {
                    ...updatedMetadata,
                    titulo: latestContent.titulo,
                    descricao: latestContent.descricao,
                    aspectRatio: latestContent.aspectRatio,
                    totalCenas: latestContent.cenas.length,
                    totalTakes: latestContent.cenas.reduce((acc, c) => acc + c.takes.length, 0),
                    totalWords: latestContent.cenas.reduce((acc, c) => acc + c.takes.reduce((sum, t) => {
                        const aWords = t.audio ? t.audio.trim().split(/\s+/).filter(Boolean).length : 0;
                        const vWords = t.visual ? t.visual.trim().split(/\s+/).filter(Boolean).length : 0;
                        return sum + aWords + vWords;
                    }, 0), 0)
                });

                if (!metadata.roomId) {
                    await saveScriptContent(null, ownerId, id, latestVersion, latestContent);
                }
            }, PERSIST_DEBOUNCE_MS);

            _persistTimers.set(id, timer);
        }
    },

    createScriptVersion: async () => {
        const { activeScriptId, activeScriptContent, scripts, sharedScripts, roomScripts } = get();
        const userId = auth.currentUser?.uid;
        if (!userId || !activeScriptId || !activeScriptContent) return;

        const metadata = scripts.find(s => s.id === activeScriptId) || 
                         sharedScripts.find(s => s.id === activeScriptId) ||
                         roomScripts.find(s => s.id === activeScriptId);
        if (!metadata) return;

        const isRoomScript = !!metadata.roomId;
        const isShared = !isRoomScript && !scripts.some(s => s.id === activeScriptId);
        
        if (isRoomScript) {
            const room = get().rooms.find(r => r.id === metadata.roomId);
            const isOwner = room?.createdBy === userId;
            const member = room?.members[userId];
            if (!isOwner && member?.permission !== 'editor') return;
        } else if (isShared && metadata.permission === 'viewer') {
            return;
        }

        const ownerId = metadata.ownerId || userId;

        const currentAvailableVersions = metadata.availableVersions || [1];
        const nextVersion = Math.max(...currentAvailableVersions.map(v => parseInt(String(v), 10))) + 1;
        const newAvailableVersions = [...currentAvailableVersions, nextVersion];
        const now = new Date().toISOString();

        const updatedMetadata: ScriptMetadata = {
            ...metadata,
            currentVersion: nextVersion,
            availableVersions: newAvailableVersions,
            versionDates: { ...(metadata.versionDates || {}), [String(nextVersion)]: now },
            atualizadoEm: now
        };

        set((state) => ({
            scripts: state.scripts.map(s => s.id === activeScriptId ? updatedMetadata : s),
            sharedScripts: state.sharedScripts.map(s => s.id === activeScriptId ? updatedMetadata : s),
            roomScripts: state.roomScripts.map(s => s.id === activeScriptId ? updatedMetadata : s),
            activeScriptVersion: nextVersion
        }));

        await saveScriptContent(metadata.roomId || null, ownerId, activeScriptId, nextVersion, activeScriptContent);
        await saveScriptMetadata(metadata.roomId || null, ownerId, activeScriptId, updatedMetadata);
    },

    createSubVersion: async (baseVersion) => {
        const { activeScriptId, activeScriptContent, scripts, sharedScripts, roomScripts } = get();
        const userId = auth.currentUser?.uid;
        if (!userId || !activeScriptId || !activeScriptContent) return;

        const metadata = scripts.find(s => s.id === activeScriptId) || 
                         sharedScripts.find(s => s.id === activeScriptId) ||
                         roomScripts.find(s => s.id === activeScriptId);
        if (!metadata) return;

        const isRoomScript = !!metadata.roomId;
        const isShared = !isRoomScript && !scripts.some(s => s.id === activeScriptId);
        
        if (isRoomScript) {
            const room = get().rooms.find(r => r.id === metadata.roomId);
            const isOwner = room?.createdBy === userId;
            const member = room?.members[userId];
            if (!isOwner && member?.permission !== 'editor') return;
        } else if (isShared && metadata.permission === 'viewer') {
            return;
        }

        const ownerId = metadata.ownerId || userId;

        const currentAvailableVersions = metadata.availableVersions || [1];
        const baseVersionIndex = currentAvailableVersions.indexOf(baseVersion);
        if (baseVersionIndex === -1) return;

        const versionsToDelete = currentAvailableVersions.slice(baseVersionIndex + 1);
        
        await deleteScriptVersions(metadata.roomId || null, ownerId, activeScriptId, versionsToDelete);

        let nextVersionStr = "";
        if (String(baseVersion).includes('.')) {
            const parts = String(baseVersion).split('.');
            parts[parts.length - 1] = String(parseInt(parts[parts.length - 1]) + 1);
            nextVersionStr = parts.join('.');
        } else {
            nextVersionStr = `${baseVersion}.1`;
        }

        const newAvailableVersions = [...currentAvailableVersions.slice(0, baseVersionIndex + 1), nextVersionStr];
        const now = new Date().toISOString();

        const newDates = { ...(metadata.versionDates || {}) };
        for (const v of versionsToDelete) { delete newDates[String(v)]; }
        newDates[nextVersionStr] = now;

        const updatedMetadata: ScriptMetadata = {
            ...metadata,
            currentVersion: nextVersionStr,
            availableVersions: newAvailableVersions,
            versionDates: newDates,
            atualizadoEm: now
        };

        set((state) => ({
            scripts: state.scripts.map(s => s.id === activeScriptId ? updatedMetadata : s),
            sharedScripts: state.sharedScripts.map(s => s.id === activeScriptId ? updatedMetadata : s),
            roomScripts: state.roomScripts.map(s => s.id === activeScriptId ? updatedMetadata : s),
            activeScriptVersion: nextVersionStr
        }));

        await saveScriptMetadata(metadata.roomId || null, ownerId, activeScriptId, updatedMetadata);
        await saveScriptContent(metadata.roomId || null, ownerId, activeScriptId, nextVersionStr, activeScriptContent);
    },

    switchScriptVersion: async (version) => {
        const { activeScriptId, scripts, sharedScripts, roomScripts } = get();
        const userId = auth.currentUser?.uid;
        if (!userId || !activeScriptId) return;

        const metadata = scripts.find(s => s.id === activeScriptId) || 
                         sharedScripts.find(s => s.id === activeScriptId) ||
                         roomScripts.find(s => s.id === activeScriptId);
        if (!metadata) return;

        const ownerId = metadata.ownerId || userId;

        set({ loadingApp: true });

        if (_contentUnsub) {
            _contentUnsub();
            _contentUnsub = null;
        }

        const isLatest = version === (metadata.availableVersions ? metadata.availableVersions[metadata.availableVersions.length - 1] : 1);

        if (metadata.roomId && isLatest) {
            // Sincronização de linhas da sala
            _contentUnsub = subscribeToRoomLines(metadata.roomId, activeScriptId, (docs) => {
                set({ loadingApp: false });

                const incomingCenas: Scene[] = [];
                let currentScene: Scene | null = null;

                docs.forEach(doc => {
                    if (doc.type === 'scene') {
                        currentScene = {
                            id: doc.id,
                            ordem: doc.ordem,
                            titulo: doc.titulo || 'Cena Sem Título',
                            takes: []
                        };
                        incomingCenas.push(currentScene);
                    } else if (doc.type === 'take') {
                        const takeItem = parseTakeDoc(doc);
                        if (currentScene) {
                            currentScene.takes.push(takeItem);
                        } else {
                            currentScene = {
                                id: 'default-scene',
                                ordem: 1,
                                titulo: 'Cena Principal',
                                takes: [takeItem]
                            };
                            incomingCenas.push(currentScene);
                        }
                    }
                });

                const local = get().activeScriptContent;
                let finalCenas = incomingCenas;
                if (local) {
                    finalCenas = incomingCenas.map(incScene => {
                        const localScene = local.cenas.find(s => s.id === incScene.id);
                        return {
                            ...incScene,
                            takes: incScene.takes.map(incTake => {
                                const localTake = localScene?.takes.find(t => t.id === incTake.id);
                                if (!localTake) return incTake;

                                let mergedTake = { ...incTake };

                                const isAudioMine = incTake.audioLock?.userId === userId && isLockAtivo(incTake.audioLock);
                                if (isAudioMine) {
                                    mergedTake.audio = localTake.audio;
                                    mergedTake.audioAuthors = localTake.audioAuthors || [];
                                }

                                const isVisualMine = incTake.visualLock?.userId === userId && isLockAtivo(incTake.visualLock);
                                if (isVisualMine) {
                                    mergedTake.visual = localTake.visual;
                                    mergedTake.visualAuthors = localTake.visualAuthors || [];
                                }

                                return mergedTake;
                            })
                        };
                    });
                }

                set({
                    activeScriptId,
                    activeScriptContent: {
                        titulo: metadata.titulo,
                        descricao: metadata.descricao,
                        criadoEm: metadata.criadoEm,
                        entregaEm: metadata.entregaEm,
                        aspectRatio: metadata.aspectRatio,
                        cenas: finalCenas
                    },
                    activeScriptVersion: version
                });
            }, (error) => {
                console.error('[createEditorSlice] Erro no listener de linhas da sala:', error);
                set({ syncError: 'Erro ao carregar o conteúdo da versão selecionada.', loadingApp: false });
            });
        } else {
            _contentUnsub = subscribeToActiveScriptContent(metadata.roomId || null, ownerId, activeScriptId, version, (content) => {
                set({ loadingApp: false });
                if (!content) return;
                
                const localContent = get().activeScriptContent;
                const mergedContent = mergeContent(localContent, content);
                set({
                    activeScriptContent: mergedContent,
                    activeScriptVersion: version
                });
            }, (error) => {
                console.error('[createEditorSlice] Erro no listener de conteúdo (mudança de versão):', error);
                set({ syncError: 'Erro ao carregar o conteúdo da versão selecionada.', loadingApp: false });
            });
        }

        await saveScriptMetadata(metadata.roomId || null, ownerId, activeScriptId, {
            currentVersion: version
        });

        const updatedMetadata = { ...metadata, currentVersion: version };
        set(state => ({
            scripts: state.scripts.map(s => s.id === activeScriptId ? updatedMetadata : s),
            sharedScripts: state.sharedScripts.map(s => s.id === activeScriptId ? updatedMetadata : s),
            roomScripts: state.roomScripts.map(s => s.id === activeScriptId ? updatedMetadata : s),
            activeScriptVersion: version
        }));
    },

    deleteLastVersion: async () => {
        const { activeScriptId, scripts, sharedScripts, roomScripts } = get();
        const userId = auth.currentUser?.uid;
        if (!userId || !activeScriptId) return;

        const metadata = scripts.find(s => s.id === activeScriptId) || 
                         sharedScripts.find(s => s.id === activeScriptId) ||
                         roomScripts.find(s => s.id === activeScriptId);
        if (!metadata) return;

        const isRoomScript = !!metadata.roomId;
        const isShared = !isRoomScript && !scripts.some(s => s.id === activeScriptId);
        
        if (isRoomScript) {
            const room = get().rooms.find(r => r.id === metadata.roomId);
            const isOwner = room?.createdBy === userId;
            const member = room?.members[userId];
            if (!isOwner && member?.permission !== 'editor') return;
        } else if (isShared && metadata.permission === 'viewer') return;

        const ownerId = metadata.ownerId || userId;

        const currentVersions = metadata.availableVersions || [1];
        if (currentVersions.length <= 1) return;

        const versionToDelete = currentVersions[currentVersions.length - 1];
        const previousVersion = currentVersions[currentVersions.length - 2];

        // Delete from Firestore
        await deleteScriptVersions(metadata.roomId || null, ownerId, activeScriptId, [versionToDelete]);

        const newDates = { ...(metadata.versionDates || {}) };
        delete newDates[String(versionToDelete)];

        const newVersions = currentVersions.slice(0, -1);
        const updatedMetadata: ScriptMetadata = {
            ...metadata,
            currentVersion: previousVersion,
            availableVersions: newVersions,
            versionDates: newDates,
            atualizadoEm: new Date().toISOString()
        };

        set((state) => ({
            scripts: state.scripts.map(s => s.id === activeScriptId ? updatedMetadata : s),
            sharedScripts: state.sharedScripts.map(s => s.id === activeScriptId ? updatedMetadata : s),
            roomScripts: state.roomScripts.map(s => s.id === activeScriptId ? updatedMetadata : s)
        }));

        await saveScriptMetadata(metadata.roomId || null, ownerId, activeScriptId, updatedMetadata);
        await get().switchScriptVersion(previousVersion);
    },

    // ---------------------------------------------------------------------------
    // YJS & Version Import Helper
    // ---------------------------------------------------------------------------
    importScriptAsNewVersion: async (content: ScriptFull) => {
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        const { scripts, sharedScripts, roomScripts, activeScriptId, activeScriptContent } = get();
        if (!activeScriptId || !activeScriptContent) return;

        const isRoomScript = roomScripts.some(s => s.id === activeScriptId);
        const isShared = !isRoomScript && !scripts.some(s => s.id === activeScriptId);
        const metadata = isRoomScript 
            ? roomScripts.find(s => s.id === activeScriptId)
            : (isShared ? sharedScripts.find(s => s.id === activeScriptId) : scripts.find(s => s.id === activeScriptId));

        if (!metadata) return;
        const ownerId = metadata.ownerId || userId;

        // Check write permission
        let canEdit = true;
        if (isRoomScript) {
            const room = get().rooms.find(r => r.id === metadata.roomId);
            if (room) {
                const isOwner = room.createdBy === userId;
                const member = room.members[userId];
                canEdit = isOwner || member?.permission === 'editor';
            } else {
                canEdit = false;
            }
        } else if (isShared && metadata.permission === 'viewer') {
            canEdit = false;
        }

        if (!canEdit) {
            throw new Error("Você não tem permissão para editar este roteiro.");
        }

        const cleanedCenas = content.cenas.map(scene => ({
            ...scene,
            takes: scene.takes.map(take => ({
                ...take,
                audioLock: null,
                visualLock: null
            }))
        }));

        const cleanedContent: ScriptFull = {
            ...content,
            titulo: metadata.titulo,
            descricao: metadata.descricao || '',
            cenas: cleanedCenas
        };

        const currentAvailableVersions = metadata.availableVersions || [1];
        const nextVersion = Math.max(...currentAvailableVersions.map(v => parseInt(String(v), 10))) + 1;
        const newAvailableVersions = [...currentAvailableVersions, nextVersion];
        const now = new Date().toISOString();

        const updatedMetadata: ScriptMetadata = {
            ...metadata,
            titulo: metadata.titulo,
            descricao: metadata.descricao,
            aspectRatio: cleanedContent.aspectRatio,
            totalCenas: cleanedContent.cenas.length,
            totalTakes: cleanedContent.cenas.reduce((acc, c) => acc + c.takes.length, 0),
            totalWords: cleanedContent.cenas.reduce((acc, c) => acc + c.takes.reduce((sum, t) => {
                const aWords = t.audio ? t.audio.trim().split(/\s+/).filter(Boolean).length : 0;
                const vWords = t.visual ? t.visual.trim().split(/\s+/).filter(Boolean).length : 0;
                return sum + aWords + vWords;
            }, 0), 0),
            currentVersion: nextVersion,
            availableVersions: newAvailableVersions,
            versionDates: { ...(metadata.versionDates || {}), [String(nextVersion)]: now },
            atualizadoEm: now
        };

        if (_contentUnsub) {
            _contentUnsub();
            _contentUnsub = null;
        }

        await saveScriptContent(metadata.roomId || null, ownerId, activeScriptId, nextVersion, cleanedContent);
        await saveScriptMetadata(metadata.roomId || null, ownerId, activeScriptId, updatedMetadata);

        set({
            scripts: scripts.map(s => s.id === activeScriptId ? updatedMetadata : s),
            sharedScripts: sharedScripts.map(s => s.id === activeScriptId ? updatedMetadata : s),
            roomScripts: roomScripts.map(s => s.id === activeScriptId ? updatedMetadata : s),
            activeScriptContent: cleanedContent,
            activeScriptVersion: nextVersion
        });

        if (metadata.roomId) {
            await syncFlatLines(activeScriptId, metadata.roomId, cleanedContent.cenas, activeScriptContent.cenas, {
                tipo: 'edicao',
                campo: 'estrutura',
                conteudoResumo: 'Importação de Roteiro - Nova Versão'
            });

            const updates: { takeId: string; field: 'audio' | 'visual'; base64: string }[] = [];
            for (const scene of cleanedContent.cenas) {
                for (const take of scene.takes) {
                    const prepareYjsField = (field: 'audio' | 'visual', textValue: string) => {
                        const ydoc = new Y.Doc();
                        const fragment = ydoc.getXmlFragment('default');
                        if (textValue) {
                            const paragraphs = textValue.split('\n');
                            const elements = paragraphs.map(pText => {
                                const p = new Y.XmlElement('p');
                                if (pText.length > 0) {
                                    const yText = new Y.XmlText(pText);
                                    p.insert(0, [yText]);
                                }
                                return p;
                            });
                            fragment.insert(0, elements);
                        } else {
                            const p = new Y.XmlElement('p');
                            fragment.insert(0, [p]);
                        }
                        const update = Y.encodeStateAsUpdate(ydoc);
                        const base64 = uint8ArrayToBase64(update);
                        updates.push({ takeId: take.id, field, base64 });
                    };
                    
                    prepareYjsField('audio', take.audio || '');
                    prepareYjsField('visual', take.visual || '');
                }
            }
            await updateRoomYjsSnapshots(metadata.roomId, activeScriptId, updates);
        }

        await get().switchScriptVersion(nextVersion);
    },

    // ---------------------------------------------------------------------------
    // Scene Actions
    // ---------------------------------------------------------------------------
    addScene: () => {
        const { activeScriptContent, activeScriptId } = get();
        if (!activeScriptContent || !activeScriptId) return;

        const newSceneId = safeUUID();
        const newTakeId = safeUUID();
        const newScene: Scene = {
            id: newSceneId,
            ordem: activeScriptContent.cenas.length + 1,
            titulo: "INT. LOCAL - DIA",
            takes: [
                { id: newTakeId, ordem: 1, audio: "", visual: "", imagemRef: "" }
            ]
        };

        set({ focusedFieldId: `audio-${newTakeId}` });

        get().updateScriptContent(activeScriptId, {
            cenas: [...activeScriptContent.cenas, newScene]
        }, false, {
            tipo: 'criacao_linha',
            campo: 'estrutura',
            linhaId: newSceneId
        });
    },

    addSceneAfter: (afterSceneId) => {
        const { activeScriptContent, activeScriptId } = get();
        if (!activeScriptContent || !activeScriptId) return;

        const newSceneId = safeUUID();
        const newTakeId = safeUUID();
        const newScene: Scene = {
            id: newSceneId,
            ordem: 0,
            titulo: "INT. LOCAL - DIA",
            takes: [
                { id: newTakeId, ordem: 1, audio: "", visual: "", imagemRef: "" }
            ]
        };

        const idx = activeScriptContent.cenas.findIndex(s => s.id === afterSceneId);
        if (idx === -1) return;

        const newCenas = [...activeScriptContent.cenas];
        newCenas.splice(idx + 1, 0, newScene);

        const reordered = newCenas.map((s, i) => ({ ...s, ordem: i + 1 }));

        set({ focusedFieldId: `audio-${newTakeId}` });

        get().updateScriptContent(activeScriptId, { cenas: reordered }, false, {
            tipo: 'criacao_linha',
            campo: 'estrutura',
            linhaId: newSceneId
        });
    },

    removeScene: (sceneId) => {
        const { activeScriptContent, activeScriptId } = get();
        if (!activeScriptContent || !activeScriptId) return;

        const newCenas = activeScriptContent.cenas
            .filter(s => s.id !== sceneId)
            .map((s, i) => ({ ...s, ordem: i + 1 }));

        get().updateScriptContent(activeScriptId, { cenas: newCenas }, false, {
            tipo: 'exclusao_linha',
            campo: 'estrutura',
            linhaId: sceneId
        });
    },

    updateScene: (sceneId, titulo) => {
        const { activeScriptContent, activeScriptId } = get();
        if (!activeScriptContent || !activeScriptId) return;

        _dirtyScenes.add(sceneId);

        const newCenas = activeScriptContent.cenas.map(scene => 
            scene.id === sceneId ? { ...scene, titulo } : scene
        );

        get().updateScriptContent(activeScriptId, { cenas: newCenas }, false, {
            tipo: 'edicao',
            campo: 'estrutura',
            linhaId: sceneId,
            conteudoResumo: titulo
        });
    },

    moveScene: (sceneId, direction) => {
        const { activeScriptContent, activeScriptId } = get();
        if (!activeScriptContent || !activeScriptId) return;

        const cenas = [...activeScriptContent.cenas];
        const idx = cenas.findIndex(s => s.id === sceneId);
        if (idx === -1) return;

        if (direction === 'up' && idx > 0) {
            [cenas[idx - 1], cenas[idx]] = [cenas[idx], cenas[idx - 1]];
        } else if (direction === 'down' && idx < cenas.length - 1) {
            [cenas[idx], cenas[idx + 1]] = [cenas[idx + 1], cenas[idx]];
        } else {
            return;
        }

        const reorderedCenas = cenas.map((s, i) => ({ ...s, ordem: i + 1 }));
        get().updateScriptContent(activeScriptId, { cenas: reorderedCenas }, false, {
            tipo: 'movimento_linha',
            campo: 'estrutura',
            linhaId: sceneId
        });
    },

    moveSceneToPosition: (sceneId, toIndex) => {
        const { activeScriptContent, activeScriptId } = get();
        if (!activeScriptContent || !activeScriptId) return;

        const cenas = [...activeScriptContent.cenas];
        const fromIndex = cenas.findIndex(s => s.id === sceneId);
        if (fromIndex === -1) return;

        const [movedScene] = cenas.splice(fromIndex, 1);
        cenas.splice(toIndex, 0, movedScene);

        const reorderedCenas = cenas.map((s, i) => ({ ...s, ordem: i + 1 }));
        get().updateScriptContent(activeScriptId, { cenas: reorderedCenas }, false, {
            tipo: 'movimento_linha',
            campo: 'estrutura',
            linhaId: sceneId
        });
    },

    // ---------------------------------------------------------------------------
    // Take Actions
    // ---------------------------------------------------------------------------
    addTake: (sceneId) => {
        const { activeScriptContent, activeScriptId } = get();
        if (!activeScriptContent || !activeScriptId) return;

        const newTakeId = safeUUID();
        const newCenas = activeScriptContent.cenas.map(scene => {
            if (scene.id === sceneId) {
                return {
                    ...scene,
                    takes: [
                        ...scene.takes,
                        { 
                            id: newTakeId, 
                            ordem: scene.takes.length + 1, 
                            audio: "", 
                            visual: "", 
                            imagemRef: "" 
                        }
                    ]
                };
            }
            return scene;
        });

        set({ focusedFieldId: `audio-${newTakeId}` });

        get().updateScriptContent(activeScriptId, { cenas: newCenas }, false, {
            tipo: 'criacao_linha',
            campo: 'estrutura',
            linhaId: newTakeId
        });
    },

    updateTakeLocalOnly: (sceneId, takeId, updates) => {
        const { activeScriptContent } = get();
        if (!activeScriptContent) return;

        const newCenas = activeScriptContent.cenas.map(scene => {
            if (scene.id === sceneId) {
                return {
                    ...scene,
                    takes: scene.takes.map(take => {
                        if (take.id === takeId) {
                            return { ...take, ...updates };
                        }
                        return take;
                    })
                };
            }
            return scene;
        });

        set({
            activeScriptContent: {
                ...activeScriptContent,
                cenas: newCenas
            }
        });
    },

    updateTake: (sceneId, takeId, updates) => {
        const { activeScriptContent, activeScriptId, activeRoomId } = get();
        if (!activeScriptContent || !activeScriptId) return;

        _dirtyTakes.add(takeId);

        const newCenas = activeScriptContent.cenas.map(scene => {
            if (scene.id === sceneId) {
                return {
                    ...scene,
                    takes: scene.takes.map(take => {
                        if (take.id === takeId) {
                            const mergeUpdates: any = { ...updates };
                            
                            // Em salas colaborativas com Yjs, os locks são respeitados e não substituídos.
                            // Mas salvamos as contribuições e autoria para o histórico do Dojo.
                            if (activeRoomId) {
                                const myUid = auth.currentUser?.uid || '';
                                const myName = auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || 'Colaborador';
                                
                                if (updates.audio !== undefined) {
                                    const orig = take.audioAuthors || [];
                                    if (!orig.includes(myName)) {
                                        mergeUpdates.audioAuthors = [...orig, myName];
                                    }
                                    mergeUpdates.editedBy = myUid;
                                    mergeUpdates.editedByName = myName;
                                }
                                if (updates.visual !== undefined) {
                                    const orig = take.visualAuthors || [];
                                    if (!orig.includes(myName)) {
                                        mergeUpdates.visualAuthors = [...orig, myName];
                                    }
                                    mergeUpdates.editedBy = myUid;
                                    mergeUpdates.editedByName = myName;
                                }
                            } else {
                                // Roteiro pessoal clássico
                                if (updates.audio !== undefined || updates.visual !== undefined) {
                                    mergeUpdates.editedBy = auth.currentUser?.uid || '';
                                    mergeUpdates.editedByName = auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || 'Autor';
                                }
                            }

                            return { ...take, ...mergeUpdates };
                        }
                        return take;
                    })
                };
            }
            return scene;
        });

        const updatedTake = newCenas.find(s => s.id === sceneId)?.takes.find(t => t.id === takeId);
        let fieldName: 'audio' | 'visual' | 'estrutura' = 'estrutura';
        let typedText = '';
        if (updates.audio !== undefined) {
            fieldName = 'audio';
            typedText = updates.audio;
        } else if (updates.visual !== undefined) {
            fieldName = 'visual';
            typedText = updates.visual;
        }

        get().updateScriptContent(activeScriptId, { cenas: newCenas }, false, {
            tipo: 'edicao',
            campo: fieldName,
            linhaId: takeId,
            conteudoResumo: typedText
        });
    },

    removeTake: (sceneId, takeId) => {
        const { activeScriptContent, activeScriptId } = get();
        if (!activeScriptContent || !activeScriptId) return;

        const newCenas = activeScriptContent.cenas.map(scene => {
            if (scene.id === sceneId) {
                return {
                    ...scene,
                    takes: scene.takes
                        .filter(t => t.id !== takeId)
                        .map((t, i) => ({ ...t, ordem: i + 1 }))
                };
            }
            return scene;
        });

        get().updateScriptContent(activeScriptId, { cenas: newCenas }, false, {
            tipo: 'exclusao_linha',
            campo: 'estrutura',
            linhaId: takeId
        });
    },

    moveTake: (fromSceneId, takeId, direction) => {
        const { activeScriptContent, activeScriptId } = get();
        if (!activeScriptContent || !activeScriptId) return;

        const fromScene = activeScriptContent.cenas.find(s => s.id === fromSceneId);
        if (!fromScene) return;

        const idx = fromScene.takes.findIndex(t => t.id === takeId);
        if (idx === -1) return;

        const takes = [...fromScene.takes];
        if (direction === 'up' && idx > 0) {
            [takes[idx - 1], takes[idx]] = [takes[idx], takes[idx - 1]];
        } else if (direction === 'down' && idx < takes.length - 1) {
            [takes[idx], takes[idx + 1]] = [takes[idx + 1], takes[idx]];
        } else {
            return;
        }

        const reorderedTakes = takes.map((t, i) => ({ ...t, ordem: i + 1 }));
        const newCenas = activeScriptContent.cenas.map(scene => 
            scene.id === fromSceneId ? { ...scene, takes: reorderedTakes } : scene
        );

        get().updateScriptContent(activeScriptId, { cenas: newCenas }, false, {
            tipo: 'movimento_linha',
            campo: 'estrutura',
            linhaId: takeId
        });
    },

    moveTakeToPosition: (takeId, fromSceneId, toSceneId, newIndex) => {
        const { activeScriptContent, activeScriptId } = get();
        if (!activeScriptContent || !activeScriptId) return;

        const fromScene = activeScriptContent.cenas.find(s => s.id === fromSceneId);
        const toScene = activeScriptContent.cenas.find(s => s.id === toSceneId);
        if (!fromScene || !toScene) return;

        const fromIndex = fromScene.takes.findIndex(t => t.id === takeId);
        if (fromIndex === -1) return;

        const [movedTake] = [...fromScene.takes].splice(fromIndex, 1);
        let newCenas = [...activeScriptContent.cenas];

        if (fromSceneId === toSceneId) {
            const sceneIndex = newCenas.findIndex(s => s.id === fromSceneId);
            const takes = [...fromScene.takes];
            takes.splice(fromIndex, 1);
            takes.splice(newIndex, 0, movedTake);
            newCenas[sceneIndex] = {
                ...fromScene,
                takes: takes.map((t, i) => ({ ...t, ordem: i + 1 }))
            };
        } else {
            newCenas = newCenas.map(scene => {
                if (scene.id === fromSceneId) {
                    return {
                        ...scene,
                        takes: scene.takes
                            .filter(t => t.id !== takeId)
                            .map((t, i) => ({ ...t, ordem: i + 1 }))
                    };
                }
                if (scene.id === toSceneId) {
                    const takes = [...scene.takes];
                    takes.splice(newIndex, 0, movedTake);
                    return {
                        ...scene,
                        takes: takes.map((t, i) => ({ ...t, ordem: i + 1 }))
                    };
                }
                return scene;
            });
        }

        get().updateScriptContent(activeScriptId, { cenas: newCenas }, false, {
            tipo: 'movimento_linha',
            campo: 'estrutura',
            linhaId: takeId
        });
    }
});
