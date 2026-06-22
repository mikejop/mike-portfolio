// ---------------------------------------------------------------------------
// Room Slice — Roteiro AV
// Zustand slice for managing collaborative rooms, members, and memberships.
// ---------------------------------------------------------------------------

import { StateCreator } from 'zustand';
import { ScriptStoreState, RoomSliceState } from '../../types/store';
import { ScriptRoom, ScriptMetadata, ScriptFull } from '../../types/domain';
import { auth } from '@/lib/firebase';
import {
    subscribeToRoomScripts,
    subscribeToPresence,
    findUserByEmail,
    createScriptInRoomFirestore
} from '@/lib/services/scriptService';
import {
    createRoomInFirestore,
    deleteRoomInFirestore,
    updateRoomMembersInFirestore
} from '@/lib/services/roomService';
import { serverTimestamp } from 'firebase/firestore';
import { safeUUID } from '@/lib/utils';

let _roomScriptsUnsub: (() => void) | null = null;
let _roomPresenceUnsub: (() => void) | null = null;

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
        console.error(`[createRoomSlice] Failed to save room cache for room ${roomId}:`, e);
    }
};

export const createRoomSlice: StateCreator<
    ScriptStoreState,
    [],
    [],
    RoomSliceState
> = (set, get) => ({
    rooms: [],
    activeRoomId: null,
    roomScripts: [],
    roomPresence: [],
    loadingRoomScripts: false,

    setActiveRoomId: async (roomId) => {
        if (_roomScriptsUnsub) {
            _roomScriptsUnsub();
            _roomScriptsUnsub = null;
        }
        if (_roomPresenceUnsub) {
            _roomPresenceUnsub();
            _roomPresenceUnsub = null;
        }

        if (!roomId) {
            set({ activeRoomId: null, roomScripts: [], roomPresence: [], loadingRoomScripts: false });
            return;
        }

        // Try loading cache synchronously
        let hasCache = false;
        if (typeof window !== 'undefined') {
            try {
                const cached = localStorage.getItem(`ag_room_scripts_cache_${roomId}`);
                if (cached) {
                    const parsed = JSON.parse(cached);
                    const TTL = 7 * 24 * 60 * 60 * 1000; // 7 days
                    if (parsed && parsed.roomId === roomId && parsed.cachedAt && (Date.now() - parsed.cachedAt < TTL)) {
                        const rawScripts: ScriptMetadata[] = parsed.scripts || [];
                        const uniqueScripts = rawScripts.filter((s, index, self) => 
                            self.findIndex(t => t.id === s.id) === index
                        );
                        set({
                            activeRoomId: roomId,
                            roomScripts: uniqueScripts,
                            roomPresence: [],
                            loadingRoomScripts: false
                        });
                        hasCache = true;
                    }
                }
            } catch (e) {
                console.error(`[createRoomSlice] Erro ao ler cache da sala ${roomId}:`, e);
            }
        }

        if (!hasCache) {
            set({ activeRoomId: roomId, roomScripts: [], roomPresence: [], loadingRoomScripts: true });
        }

        const userId = auth.currentUser?.uid;
        if (!userId) {
            console.log("[createRoomSlice] setActiveRoomId: Ignorando escuta até que o login seja concluído.");
            return;
        }

        _roomScriptsUnsub = subscribeToRoomScripts(roomId, (list) => {
            set({ roomScripts: list, loadingRoomScripts: false });
            saveRoomCache(roomId, list);
        }, (error) => {
            console.error('[createRoomSlice] Erro no listener de roteiros da sala:', error);
            set({ loadingRoomScripts: false });
        });

        _roomPresenceUnsub = subscribeToPresence(roomId, "", "", (list) => {
            set({ roomPresence: list });
        }, (error) => {
            console.error('[createRoomSlice] Erro no listener de presença da sala:', error);
        });
    },

    createRoom: async (name) => {
        const userId = auth.currentUser?.uid;
        const userEmail = auth.currentUser?.email;
        const displayName = auth.currentUser?.displayName || 'Colaborador';
        if (!userId) throw new Error("Usuário não autenticado");

        const roomId = safeUUID();
        const now = new Date().toISOString();

        const room: ScriptRoom = {
            id: roomId,
            name,
            createdBy: userId,
            createdByEmail: userEmail || '',
            createdAt: now,
            memberIds: [userId],
            members: {
                [userId]: {
                    uid: userId,
                    email: userEmail || '',
                    displayName,
                    permission: 'editor',
                    joinedAt: now
                }
            }
        };

        await createRoomInFirestore(room);

        return roomId;
    },

    deleteRoom: async (roomId) => {
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        const room = get().rooms.find(r => r.id === roomId);
        if (!room || room.createdBy !== userId) return;

        if (get().activeRoomId === roomId) {
            await get().setActiveRoomId(null);
        }

        await deleteRoomInFirestore(roomId);
    },

    addMemberToRoom: async (roomId, email, permission) => {
        const userId = auth.currentUser?.uid;
        if (!userId) throw new Error("Usuário não autenticado");

        const room = get().rooms.find(r => r.id === roomId);
        if (!room) throw new Error("Sala não encontrada");
        if (room.createdBy !== userId) throw new Error("Apenas o proprietário da sala pode convidar membros");

        const targetUser = await findUserByEmail(email);
        if (!targetUser) {
            throw new Error(`Usuário com o e-mail "${email}" não encontrado no Dojo.`);
        }

        const targetUid = targetUser.uid;
        const targetDisplayName = targetUser.displayName || 'Colaborador';

        const now = new Date().toISOString();
        const updatedMembers = {
            ...room.members,
            [targetUid]: {
                uid: targetUid,
                email: email.trim().toLowerCase(),
                displayName: targetDisplayName,
                permission,
                joinedAt: now
            }
        };
        const updatedMemberIds = Array.from(new Set([...room.memberIds, targetUid]));

        await updateRoomMembersInFirestore(roomId, updatedMembers, updatedMemberIds);
    },

    removeMemberFromRoom: async (roomId, targetUid) => {
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        const room = get().rooms.find(r => r.id === roomId);
        if (!room) return;
        if (room.createdBy !== userId && userId !== targetUid) return;

        const updatedMembers = { ...room.members };
        delete updatedMembers[targetUid];

        const updatedMemberIds = room.memberIds.filter(id => id !== targetUid);

        await updateRoomMembersInFirestore(roomId, updatedMembers, updatedMemberIds);
    },

    createScriptInRoom: async (roomId, data) => {
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
            storageRef: `firestore://salasRoteiro/${roomId}/roteiros/${id}`,
            currentVersion: 1,
            availableVersions: [1],
            versionDates: { '1': now },
            ownerId: userId,
            ownerEmail: userEmail || '',
            roomId,
            contributions: {}
        };

        const sceneId = safeUUID();
        const takeId = safeUUID();

        const lines = [
            {
                id: sceneId,
                type: "scene",
                ordem: 1,
                titulo: "INT. LOCAL - DIA"
            },
            {
                id: takeId,
                type: "take",
                ordem: 2,
                audio: { texto: "", editedBy: null, editedAt: null, lock: { userId: null, userName: null, lockedAt: null } },
                visual: { texto: "", editedBy: null, editedAt: null, lock: { userId: null, userName: null, lockedAt: null } },
                imagemRef: ""
            }
        ];

        await createScriptInRoomFirestore(roomId, id, metadata, lines);

        set((state) => {
            const exists = state.roomScripts.some(s => s.id === id);
            const nextRoomScripts = exists ? state.roomScripts : [...state.roomScripts, metadata];
            saveRoomCache(roomId, nextRoomScripts);
            return {
                roomScripts: nextRoomScripts,
                activeScriptId: id,
                activeScriptContent: initialContent,
                activeScriptVersion: 1
            };
        });

        return id;
    }
});
