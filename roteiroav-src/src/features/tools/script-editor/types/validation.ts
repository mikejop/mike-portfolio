// ---------------------------------------------------------------------------
// Validation — Roteiro AV
// Zod schemas and validation helpers for Firestore runtime data.
// ---------------------------------------------------------------------------

import { z } from 'zod';
import { ScriptMetadata, ScriptFull, Scene, Take, ScriptRoom, FieldLock } from './domain';

export const AspectRatioSchema = z.enum(['16:9', '9:16', '4:5', '5:4', '3:2', '1:1']);

export const FieldLockSchema = z.object({
    userId: z.string().nullable(),
    userName: z.string().nullable(),
    lockedAt: z.any().nullable(),
});

export const TakeSchema = z.object({
    id: z.string(),
    ordem: z.number(),
    audio: z.string().default(''),
    visual: z.string().default(''),
    imagemRef: z.string().default(''),
    imageScale: z.number().optional(),
    imageX: z.number().optional(),
    imageY: z.number().optional(),
    flipX: z.boolean().optional(),
    flipY: z.boolean().optional(),
    editedBy: z.string().optional(),
    editedByName: z.string().optional(),
    audioAuthors: z.array(z.string()).optional(),
    visualAuthors: z.array(z.string()).optional(),
    imageUploadedBy: z.string().optional(),
    imageUploadedByName: z.string().optional(),
    audioLock: FieldLockSchema.nullable().optional(),
    visualLock: FieldLockSchema.nullable().optional(),
});

export const SceneSchema = z.object({
    id: z.string(),
    ordem: z.number(),
    titulo: z.string().default('Cena Sem Título'),
    takes: z.array(TakeSchema),
});

export const ScriptFullSchema = z.object({
    titulo: z.string(),
    descricao: z.string().default(''),
    criadoEm: z.string(),
    entregaEm: z.string().optional(),
    aspectRatio: AspectRatioSchema.default('16:9'),
    cenas: z.array(SceneSchema).default([]),
});

export const ContributionSchema = z.object({
    displayName: z.string(),
    charCount: z.number(),
    wordCount: z.number().optional(),
    editCount: z.number(),
    locations: z.array(z.string()),
    images: z.number().optional(),
    scenesWritten: z.number().optional(),
    dialogueChars: z.number().optional(),
    dialogueWords: z.number().optional(),
});

export const SharedWithSchema = z.object({
    email: z.string(),
    displayName: z.string(),
    permission: z.enum(['editor', 'viewer']),
    sharedAt: z.string(),
});

export const ScriptMetadataSchema = z.object({
    id: z.string(),
    titulo: z.string().default(''),
    descricao: z.string().default(''),
    clientName: z.string().default(''),
    status: z.enum(['draft', 'review', 'completed']).default('draft'),
    totalCenas: z.number().default(0),
    totalTakes: z.number().optional(),
    totalWords: z.number().optional(),
    duracao: z.number().default(0),
    aspectRatio: AspectRatioSchema.default('16:9'),
    criadoEm: z.string(),
    atualizadoEm: z.string(),
    entregaEm: z.string().optional(),
    storageRef: z.string().default(''),
    currentVersion: z.union([z.number(), z.string()]).optional(),
    availableVersions: z.array(z.union([z.number(), z.string()])).optional(),
    versionDates: z.record(z.string(), z.string()).optional(),
    ownerId: z.string().optional(),
    ownerEmail: z.string().optional(),
    permission: z.enum(['editor', 'viewer']).optional(),
    contributions: z.record(z.string(), ContributionSchema).optional(),
    sharedWith: z.record(z.string(), SharedWithSchema).optional(),
    roomId: z.string().optional(),
});

export const ScriptRoomSchema = z.object({
    id: z.string(),
    name: z.string(),
    createdBy: z.string(),
    createdByEmail: z.string(),
    createdAt: z.string(),
    memberIds: z.array(z.string()).default([]),
    members: z.record(z.string(), z.object({
        uid: z.string(),
        email: z.string(),
        displayName: z.string(),
        permission: z.enum(['editor', 'viewer']),
        joinedAt: z.string(),
    })).default({}),
});

export function validateScriptMetadata(data: any): ScriptMetadata {
    const res = ScriptMetadataSchema.safeParse(data);
    if (!res.success) {
        console.warn("[Validation] Invalid ScriptMetadata format from Firestore:", res.error.format());
    }
    return data as ScriptMetadata;
}

export function validateScriptFull(data: any): ScriptFull {
    const res = ScriptFullSchema.safeParse(data);
    if (!res.success) {
        console.warn("[Validation] Invalid ScriptFull format from Firestore:", res.error.format());
    }
    return data as ScriptFull;
}

export function validateScriptRoom(data: any): ScriptRoom {
    const res = ScriptRoomSchema.safeParse(data);
    if (!res.success) {
        console.warn("[Validation] Invalid ScriptRoom format from Firestore:", res.error.format());
    }
    return data as ScriptRoom;
}
