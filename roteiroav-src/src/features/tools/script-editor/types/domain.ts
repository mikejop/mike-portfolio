// ---------------------------------------------------------------------------
// Domain Types — Roteiro AV
// Pure data shapes with no dependency on state management or React.
// ---------------------------------------------------------------------------

export type AspectRatio = '16:9' | '9:16' | '4:5' | '5:4' | '3:2' | '1:1';

export interface FieldLock { // NOVO
    userId: string | null;
    userName: string | null;
    lockedAt: any | null;
}

export interface Take {
    id: string;
    ordem: number;
    audio: string;
    visual: string;
    imagemRef: string; // Firebase Storage download URL
    // Image transformations
    imageScale?: number;
    imageX?: number;
    imageY?: number;
    flipX?: boolean;
    flipY?: boolean;
    editedBy?: string;
    editedByName?: string;
    audioAuthors?: string[];
    visualAuthors?: string[];
    imageUploadedBy?: string;
    imageUploadedByName?: string;
    audioLock?: FieldLock | null; // NOVO
    visualLock?: FieldLock | null; // NOVO
}


export interface Scene {
    id: string;
    ordem: number;
    titulo: string; // e.g. "INT. LOCAL - DIA"
    takes: Take[];
}

/** Full script content stored in Firestore subcollection content/{version} */
export interface ScriptFull {
    titulo: string;
    descricao: string;
    criadoEm: string;
    entregaEm?: string;
    aspectRatio: AspectRatio;
    cenas: Scene[];
}

/** Lightweight metadata stored in Firestore for collection listing */
export interface ScriptMetadata {
    id: string;
    titulo: string;
    descricao: string;
    clientName: string;
    status: 'draft' | 'review' | 'completed';
    totalCenas: number;
    totalTakes?: number;
    totalWords?: number;
    duracao: number;
    aspectRatio: AspectRatio;
    criadoEm: string;
    atualizadoEm: string;
    entregaEm?: string;
    storageRef: string;
    currentVersion?: number | string;
    availableVersions?: (number | string)[];
    /** Maps version key (as string) to ISO creation date */
    versionDates?: Record<string, string>;
    ownerId?: string;
    ownerEmail?: string;
    permission?: 'editor' | 'viewer';
    contributions?: Record<string, {
        displayName: string;
        charCount: number;
        wordCount?: number;
        editCount: number;
        locations: string[];
        images?: number;
        scenesWritten?: number;
        dialogueChars?: number;
        dialogueWords?: number;
    }>;
    sharedWith?: Record<string, {
        email: string;
        displayName: string;
        permission: 'editor' | 'viewer';
        sharedAt: string;
    }>;
    roomId?: string;
}

export interface ScriptRoom {
    id: string;
    name: string;
    createdBy: string;
    createdByEmail: string;
    createdAt: string;
    memberIds: string[];
    members: Record<string, {
        uid: string;
        email: string;
        displayName: string;
        permission: 'editor' | 'viewer';
        joinedAt: string;
    }>;
}

export type SortField = 'name' | 'createdAt' | 'updatedAt';
export type SortOrder = 'asc' | 'desc';
