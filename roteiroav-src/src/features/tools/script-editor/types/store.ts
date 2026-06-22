// ---------------------------------------------------------------------------
// Store State Types — Roteiro AV
// Defines the shape of each slice and the composed ScriptStoreState.
// ---------------------------------------------------------------------------

import { ScriptFull, ScriptMetadata, SortField, SortOrder, AspectRatio, Take, ScriptRoom, Scene } from './domain';

// ------ Metadata Slice ------------------------------------------------------

export interface MetadataSliceState {
    scripts: ScriptMetadata[];
    sharedScripts: ScriptMetadata[];
    selectedClient: string | null;
    clientSortField: SortField;
    clientSortOrder: SortOrder;
    showNewScriptModal: boolean;
    sharingScriptId: string | null;
    loadingApp: boolean;
    loadingScripts: boolean;
    activeTab: 'my-scripts' | 'shared';
    pendingDuplicates: Array<{ titulo: string; criadoEm: string }>;
    
    setSelectedClient: (client: string | null) => void;
    setSortOptions: (field: SortField, order: SortOrder) => void;
    setShowNewScriptModal: (show: boolean) => void;
    setSharingScriptId: (id: string | null) => void;
    setActiveTab: (tab: 'my-scripts' | 'shared') => void;
    
    setScripts: (scripts: ScriptMetadata[]) => void;
    addScript: (data: {
        titulo: string;
        clientName: string;
        descricao: string;
        aspectRatio: AspectRatio;
        entregaEm?: string;
    }) => Promise<string>;
    deleteScript: (id: string) => Promise<void>;
    duplicateScript: (id: string, customTitle?: string) => Promise<void>;
    importScript: (content: ScriptFull, images: Record<string, Blob>, roomId?: string | null, filename?: string | null) => Promise<string>;
    fetchScriptContent: (script: ScriptMetadata) => Promise<ScriptFull>;
    getClients: () => string[];
    getFilteredScripts: () => ScriptMetadata[];
    canEditActiveScript: () => boolean;
    subscribeToScripts: () => (() => void);
    shareScript: (scriptId: string, email: string, permission: 'editor' | 'viewer') => Promise<void>;
    unshareScript: (scriptId: string, targetUid: string) => Promise<void>;
}

// ------ Room Slice ----------------------------------------------------------

export interface RoomSliceState {
    rooms: ScriptRoom[];
    activeRoomId: string | null;
    roomScripts: ScriptMetadata[];
    roomPresence: { uid: string; displayName: string; activeScriptId: string; lastActive: string }[];
    loadingRoomScripts: boolean;
    
    setActiveRoomId: (roomId: string | null) => Promise<void>;
    createRoom: (name: string) => Promise<string>;
    deleteRoom: (roomId: string) => Promise<void>;
    addMemberToRoom: (roomId: string, email: string, permission: 'editor' | 'viewer') => Promise<void>;
    removeMemberFromRoom: (roomId: string, uid: string) => Promise<void>;
    createScriptInRoom: (roomId: string, data: {
        titulo: string;
        clientName: string;
        descricao: string;
        aspectRatio: AspectRatio;
        entregaEm?: string;
    }) => Promise<string>;
}

// ------ Editor Slice --------------------------------------------------------

export interface EditorSliceState {
    activeScriptId: string | null;
    activeScriptContent: ScriptFull | null;
    activeScriptVersion: number | string | null;
    syncError: string | null;
    focusedFieldId: string | null;
    setFocusedFieldId: (id: string | null) => void;
    
    resetDirtyTracking: () => void;
    setActiveScript: (id: string | null, ownerId?: string | null, roomId?: string | null) => Promise<void>;
    updateScriptContent: (id: string, updates: Partial<ScriptFull>, isMeaningful?: boolean, reason?: any) => Promise<void>;
    adquirirLock: (takeId: string, campo: 'audio' | 'visual') => Promise<void>;
    liberarLock: (takeId: string, campo: 'audio' | 'visual') => Promise<void>;
    refreshLock: (takeId: string, campo: 'audio' | 'visual') => Promise<void>;
    importScriptAsNewVersion: (content: ScriptFull) => Promise<void>;
    
    // Scene Actions
    addScene: () => void;
    addSceneAfter: (afterSceneId: string) => void;
    removeScene: (sceneId: string) => void;
    updateScene: (sceneId: string, titulo: string) => void;
    moveScene: (sceneId: string, direction: 'up' | 'down') => void;
    moveSceneToPosition: (sceneId: string, toIndex: number) => void;
    
    // Take Actions
    addTake: (sceneId: string) => void;
    updateTake: (sceneId: string, takeId: string, updates: Partial<Take>) => void;
    updateTakeLocalOnly: (sceneId: string, takeId: string, updates: Partial<Take>) => void;
    removeTake: (sceneId: string, takeId: string) => void;
    moveTake: (fromSceneId: string, takeId: string, direction: 'up' | 'down') => void;
    moveTakeToPosition: (takeId: string, fromSceneId: string, toSceneId: string, newIndex: number) => void;
    
    // Version Actions
    createScriptVersion: () => Promise<void>;
    createSubVersion: (baseVersion: number | string) => Promise<void>;
    switchScriptVersion: (version: number | string) => Promise<void>;
    deleteLastVersion: () => Promise<void>;
}

// ------ Composed State ------------------------------------------------------

/** Full store state — the intersection of all slices. */
export type ScriptStoreState =
    MetadataSliceState &
    RoomSliceState &
    EditorSliceState;
export type UISliceState = MetadataSliceState; // For backward compatibility if anything uses UISliceState
