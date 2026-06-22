// ---------------------------------------------------------------------------
// Script Service — Roteiro AV
// All Firestore I/O lives here. The store slices call these functions and
// focus purely on orchestrating state, not on how data is persisted.
// ---------------------------------------------------------------------------

import { db } from '@/lib/firebase';
import {
    doc,
    setDoc,
    deleteDoc,
    getDoc,
    serverTimestamp,
    collection,
    query,
    where,
    getDocs,
    onSnapshot,
    orderBy,
    writeBatch
} from 'firebase/firestore';
import { ScriptFull, ScriptMetadata, Take, Scene } from '@/features/tools/script-editor/types/domain';
import { validateScriptMetadata, validateScriptFull } from '@/features/tools/script-editor/types/validation';
import { toScriptMetadataDTO, toScriptFullDTO } from '@/features/tools/script-editor/types/dto';
import { safeUUID } from '@/lib/utils';

// ---------------------------------------------------------------------------
// SUBSCRIBERS (Real-Time listeners)
// ---------------------------------------------------------------------------

export function subscribeToPersonalScripts(
    userId: string,
    onUpdate: (list: ScriptMetadata[]) => void,
    onError: (err: any) => void
) {
    const personalRef = collection(db, 'users', userId, 'roteiros');
    return onSnapshot(personalRef, (snapshot) => {
        const list = snapshot.docs.map(doc => {
            const data = doc.data();
            return validateScriptMetadata({
                id: doc.id,
                ownerId: userId,
                ...data
            });
        });
        onUpdate(list);
    }, onError);
}

export function subscribeToSharedScripts(
    userId: string,
    onUpdate: (list: ScriptMetadata[]) => void,
    onError: (err: any) => void
) {
    const sharedRef = collection(db, 'users', userId, 'sharedScripts');
    return onSnapshot(sharedRef, (snapshot) => {
        const list = snapshot.docs.map(doc => {
            const data = doc.data();
            return validateScriptMetadata({
                id: doc.id,
                ...data
            });
        });
        onUpdate(list);
    }, onError);
}

export function subscribeToRoomScripts(
    roomId: string,
    onUpdate: (list: ScriptMetadata[]) => void,
    onError: (err: any) => void
) {
    const scriptsRef = collection(db, 'salasRoteiro', roomId, 'roteiros');
    return onSnapshot(scriptsRef, (snapshot) => {
        const list = snapshot.docs.map(doc => {
            const data = doc.data();
            return validateScriptMetadata({
                id: doc.id,
                ...data
            });
        });
        onUpdate(list);
    }, onError);
}

export function subscribeToPresence(
    roomId: string | null,
    scriptId: string,
    resolvedOwnerId: string,
    onUpdate: (list: any[]) => void,
    onError: (err: any) => void
) {
    const presenceColRef = roomId
        ? collection(db, 'salasRoteiro', roomId, 'presence')
        : collection(db, 'users', resolvedOwnerId, 'roteiros', scriptId, 'presence');

    return onSnapshot(presenceColRef, (snapshot) => {
        const now = Date.now();
        const list = snapshot.docs.map(doc => ({
            uid: doc.id,
            ...doc.data()
        } as any)).filter(u => {
            const diff = now - new Date(u.lastActive).getTime();
            return diff < 30000;
        });
        onUpdate(list);
    }, onError);
}

export function subscribeToActiveScriptMetadata(
    roomId: string | null,
    resolvedOwnerId: string,
    scriptId: string,
    onUpdate: (meta: ScriptMetadata | null) => void,
    onError: (err: any) => void
) {
    const metaRef = roomId
        ? doc(db, 'salasRoteiro', roomId, 'roteiros', scriptId)
        : doc(db, 'users', resolvedOwnerId, 'roteiros', scriptId);

    return onSnapshot(metaRef, (snap) => {
        if (snap.exists()) {
            onUpdate(validateScriptMetadata({ id: snap.id, ...snap.data() }));
        } else {
            onUpdate(null);
        }
    }, onError);
}

export function subscribeToRoomLines(
    roomId: string,
    scriptId: string,
    onUpdate: (docs: any[]) => void,
    onError: (err: any) => void
) {
    const linesColRef = collection(db, 'salasRoteiro', roomId, 'roteiros', scriptId, 'linhas');
    const linesQuery = query(linesColRef, orderBy('ordem', 'asc'));
    return onSnapshot(linesQuery, (linesSnap) => {
        const docs = linesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        onUpdate(docs);
    }, onError);
}

export function subscribeToActiveScriptContent(
    roomId: string | null,
    resolvedOwnerId: string,
    scriptId: string,
    version: string | number,
    onUpdate: (content: ScriptFull | null) => void,
    onError: (err: any) => void
) {
    const contentRef = roomId
        ? doc(db, 'salasRoteiro', roomId, 'roteiros', scriptId, 'content', `v${version}`)
        : doc(db, 'users', resolvedOwnerId, 'roteiros', scriptId, 'content', `v${version}`);

    return onSnapshot(contentRef, (contentSnap) => {
        if (contentSnap.exists()) {
            onUpdate(validateScriptFull(contentSnap.data()));
        } else {
            onUpdate(null);
        }
    }, onError);
}

// ---------------------------------------------------------------------------
// READ / GET
// ---------------------------------------------------------------------------

export async function loadScriptContentLegacy(
    roomId: string | null,
    resolvedOwnerId: string,
    scriptId: string
): Promise<ScriptFull | null> {
    const fallbackRef = roomId
        ? doc(db, 'rooms', roomId, 'roteiros', scriptId, 'content', 'full')
        : doc(db, 'users', resolvedOwnerId, 'roteiros', scriptId, 'content', 'full');
    
    const fallbackSnap = await getDoc(fallbackRef);
    return fallbackSnap.exists() ? validateScriptFull(fallbackSnap.data()) : null;
}

export async function fetchDirectRoomLines(
    roomId: string,
    scriptId: string
): Promise<any[]> {
    const linesColRef = collection(db, 'salasRoteiro', roomId, 'roteiros', scriptId, 'linhas');
    const linesQuery = query(linesColRef, orderBy('ordem', 'asc'));
    const linesSnap = await getDocs(linesQuery);
    return linesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
}

export async function fetchDirectScriptContent(
    resolvedOwnerId: string,
    scriptId: string,
    version: string | number
): Promise<ScriptFull | null> {
    const contentRef = doc(db, 'users', resolvedOwnerId, 'roteiros', scriptId, 'content', `v${version}`);
    const snap = await getDoc(contentRef);
    if (snap.exists()) return validateScriptFull(snap.data());
    
    const fallbackRef = doc(db, 'users', resolvedOwnerId, 'roteiros', scriptId, 'content', 'full');
    const fallbackSnap = await getDoc(fallbackRef);
    if (fallbackSnap.exists()) return validateScriptFull(fallbackSnap.data());
    
    return null;
}

export async function findUserByEmail(email: string) {
    const q = query(collection(db, "users"), where("email", "==", email.toLowerCase().trim()));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return { uid: snap.docs[0].id, ...snap.docs[0].data() as any };
}

// ---------------------------------------------------------------------------
// WRITE
// ---------------------------------------------------------------------------

export async function updatePresence(
    roomId: string | null,
    resolvedOwnerId: string,
    scriptId: string,
    userId: string,
    displayName: string
) {
    const myPresenceRef = roomId
        ? doc(db, 'salasRoteiro', roomId, 'presence', userId)
        : doc(db, 'users', resolvedOwnerId, 'roteiros', scriptId, 'presence', userId);

    await setDoc(myPresenceRef, {
        uid: userId,
        displayName,
        activeScriptId: scriptId,
        lastActive: new Date().toISOString()
    }, { merge: true });
}

export async function deletePresence(
    roomId: string | null,
    resolvedOwnerId: string,
    scriptId: string,
    userId: string
) {
    const myPresenceRef = roomId
        ? doc(db, 'salasRoteiro', roomId, 'presence', userId)
        : doc(db, 'users', resolvedOwnerId, 'roteiros', scriptId, 'presence', userId);
    await deleteDoc(myPresenceRef);
}

export async function saveScriptMetadata(
    roomId: string | null,
    resolvedOwnerId: string,
    scriptId: string,
    metadata: Partial<ScriptMetadata>
) {
    const metaRef = roomId
        ? doc(db, 'salasRoteiro', roomId, 'roteiros', scriptId)
        : doc(db, 'users', resolvedOwnerId, 'roteiros', scriptId);

    const dto = toScriptMetadataDTO({
        ...metadata,
        updatedAt: serverTimestamp() as any
    });
    await setDoc(metaRef, dto, { merge: true });
}

export async function saveScriptContent(
    roomId: string | null,
    resolvedOwnerId: string,
    scriptId: string,
    version: string | number,
    content: ScriptFull
) {
    // Content is only saved directly for personal scripts! Room scripts use flat lines.
    if (!roomId) {
        const contentRef = doc(db, 'users', resolvedOwnerId, 'roteiros', scriptId, 'content', `v${version}`);
        await setDoc(contentRef, toScriptFullDTO(content));
    }
}

export async function createScriptInFirestore(
    userId: string,
    userEmail: string,
    scriptId: string,
    metadata: ScriptMetadata,
    content: ScriptFull
) {
    const metaRef = doc(db, 'users', userId, 'roteiros', scriptId);
    await setDoc(metaRef, toScriptMetadataDTO({
        ...metadata,
        updatedAt: serverTimestamp() as any
    }));

    const contentRef = doc(db, 'users', userId, 'roteiros', scriptId, 'content', 'v1');
    await setDoc(contentRef, toScriptFullDTO(content));
}

export async function createScriptInRoomFirestore(
    roomId: string,
    scriptId: string,
    metadata: ScriptMetadata,
    lines: any[]
) {
    // Save metadata
    const metaRef = doc(db, 'salasRoteiro', roomId, 'roteiros', scriptId);
    await setDoc(metaRef, toScriptMetadataDTO({
        ...metadata,
        updatedAt: serverTimestamp() as any
    }));

    // Save lines
    for (const line of lines) {
        const lineRef = doc(db, 'salasRoteiro', roomId, 'roteiros', scriptId, 'linhas', line.id);
        await setDoc(lineRef, {
            ...line,
            criadoEm: serverTimestamp(),
            atualizadoEm: serverTimestamp()
        });
    }
}

export async function cloneScriptForDuplicate(
    userId: string,
    roomId: string | null,
    newId: string,
    newMetadata: ScriptMetadata,
    newContent: ScriptFull | null,
    lines?: { id: string; data: any }[]
) {
    if (roomId) {
        // ── Room duplication ──────────────────────────────────────────────
        // 1. Write new metadata
        const newMetaRef = doc(db, 'salasRoteiro', roomId, 'roteiros', newId);
        await setDoc(newMetaRef, toScriptMetadataDTO({
            ...newMetadata,
            updatedAt: serverTimestamp() as any
        }));

        // 2. Copy linhas (flat lines with text)
        if (lines) {
            for (const line of lines) {
                const newLineRef = doc(db, 'salasRoteiro', roomId, 'roteiros', newId, 'linhas', line.id);
                await setDoc(newLineRef, line.data);
            }
        }

        // 3. Copy linhas_yjs subcollection (Yjs collaborative snapshots + updates)
        const origScriptId = newMetadata.id === newId ? newMetadata.id : null;
        // We receive the original script id from the caller via the metadata spread,
        // but the metadata.id has already been overwritten. Instead, the caller reads
        // lines from the original → we derive the original id from the metadata's
        // storageRef or pass it separately. Since we can't get it here, the caller
        // must supply it. We'll add a new parameter for this.
        // For now, copy Yjs from the same roomId with original script id passed as extra arg.
        // (handled by the new overload below)

        // 4. Copy storage images — download each referenced image and re-upload
        //    to a path namespaced under the new script id.
        if (lines) {
            await _copyStorageImagesForLines(lines, roomId, newId, userId);
        }
    } else {
        // ── Personal duplication ──────────────────────────────────────────
        // 1. Copy ALL content versions (not just v1)
        if (newContent) {
            const newContentRef = doc(db, 'users', userId, 'roteiros', newId, 'content', 'v1');
            await setDoc(newContentRef, toScriptFullDTO(newContent));
        }

        // 2. Write new metadata
        const newMetaRef = doc(db, 'users', userId, 'roteiros', newId);
        await setDoc(newMetaRef, toScriptMetadataDTO({
            ...newMetadata,
            updatedAt: serverTimestamp() as any
        }));

        // 3. Copy storage images from content takes
        if (newContent) {
            await _copyStorageImagesForContent(newContent, userId, newId);
        }
    }
}

/**
 * Deep-clone room script including Yjs subcollections.
 * Called from the slice after reading lines from the original script.
 */
export async function cloneRoomScriptDeep(
    userId: string,
    roomId: string,
    originalScriptId: string,
    newId: string,
    newMetadata: ScriptMetadata,
    lines: { id: string; data: any }[]
) {
    // 1. Write new metadata
    const newMetaRef = doc(db, 'salasRoteiro', roomId, 'roteiros', newId);
    await setDoc(newMetaRef, toScriptMetadataDTO({
        ...newMetadata,
        updatedAt: serverTimestamp() as any
    }));

    // 2. Copy flat lines (linhas)
    for (const line of lines) {
        const newLineRef = doc(db, 'salasRoteiro', roomId, 'roteiros', newId, 'linhas', line.id);
        await setDoc(newLineRef, line.data);
    }

    // 3. Copy/batch-write Yjs collaborative snapshots + updates (chunked commits of max 400 ops)
    const ops: { ref: any; data: any }[] = [];
    const takeIds = lines.filter(l => l.data.type === 'take').map(l => l.id);
    
    for (const takeId of takeIds) {
        for (const field of ['audio', 'visual'] as const) {
            // Copy snapshot
            const origSnapshotRef = doc(
                db, 'salasRoteiro', roomId, 'roteiros', originalScriptId,
                'linhas_yjs', takeId, 'campos', field, 'snapshot', 'current'
            );
            const snapshotSnap = await getDoc(origSnapshotRef);
            if (snapshotSnap.exists()) {
                const newSnapshotRef = doc(
                    db, 'salasRoteiro', roomId, 'roteiros', newId,
                    'linhas_yjs', takeId, 'campos', field, 'snapshot', 'current'
                );
                ops.push({ ref: newSnapshotRef, data: snapshotSnap.data() });
            }

            // Copy updates
            const origUpdatesColl = collection(
                db, 'salasRoteiro', roomId, 'roteiros', originalScriptId,
                'linhas_yjs', takeId, 'campos', field, 'updates'
            );
            const updatesSnap = await getDocs(origUpdatesColl);
            for (const updateDoc of updatesSnap.docs) {
                const newUpdateRef = doc(
                    db, 'salasRoteiro', roomId, 'roteiros', newId,
                    'linhas_yjs', takeId, 'campos', field, 'updates', updateDoc.id
                );
                ops.push({ ref: newUpdateRef, data: updateDoc.data() });
            }
        }
    }

    const CHUNK = 400;
    for (let i = 0; i < ops.length; i += CHUNK) {
        const b = writeBatch(db);
        ops.slice(i, i + CHUNK).forEach(op => b.set(op.ref, op.data));
        await b.commit();
    }

    // 4. Copy storage images from lines
    await _copyStorageImagesForLines(lines, roomId, newId, userId);
}

/**
 * Deep-clone personal script including ALL content versions and storage images.
 */
export async function clonePersonalScriptDeep(
    userId: string,
    originalOwnerId: string,
    originalScriptId: string,
    newId: string,
    newMetadata: ScriptMetadata
) {
    const now = new Date().toISOString();

    // 1. Copy ALL content versions
    const contentColl = collection(db, 'users', originalOwnerId, 'roteiros', originalScriptId, 'content');
    const contentSnap = await getDocs(contentColl);
    let firstContent: ScriptFull | null = null;

    for (const contentDoc of contentSnap.docs) {
        const data = contentDoc.data();
        const newContentRef = doc(db, 'users', userId, 'roteiros', newId, 'content', contentDoc.id);

        // Only rename title in the first version (v1)
        if (contentDoc.id === 'v1' || contentDoc.id === 'full') {
            const updatedData = { ...data, titulo: newMetadata.titulo };
            await setDoc(newContentRef, toScriptFullDTO(updatedData as any));
            if (!firstContent) firstContent = updatedData as ScriptFull;
        } else {
            await setDoc(newContentRef, toScriptFullDTO(data as any));
        }
        if (!firstContent) firstContent = data as ScriptFull;
    }

    // 2. Write new metadata
    const newMetaRef = doc(db, 'users', userId, 'roteiros', newId);
    await setDoc(newMetaRef, toScriptMetadataDTO({
        ...newMetadata,
        updatedAt: serverTimestamp() as any
    }));

    // 3. Copy storage images
    if (firstContent) {
        await _copyStorageImagesForContent(firstContent, userId, newId);
    }
}

// ---------------------------------------------------------------------------
// ARCHIVE + DELETE (Soft-Delete)
// ---------------------------------------------------------------------------

export async function archiveAndDeleteScript(
    userId: string,
    roomId: string | null,
    scriptId: string,
    versions: (string | number)[],
    lineIds?: string[]
) {
    const archiveTimestamp = new Date().toISOString();

    if (roomId) {
        // ── Room script archive ──────────────────────────────────────────
        // 1. Read & archive metadata
        const metaRef = doc(db, 'salasRoteiro', roomId, 'roteiros', scriptId);
        const metaSnap = await getDoc(metaRef);
        if (metaSnap.exists()) {
            const archiveMetaRef = doc(db, 'archived_scripts', roomId, 'roteiros', scriptId);
            await setDoc(archiveMetaRef, {
                ...metaSnap.data(),
                archivedAt: archiveTimestamp,
                archivedBy: userId,
                originalRoomId: roomId
            });
        }

        // 2. Read & archive all lines
        const linesColRef = collection(db, 'salasRoteiro', roomId, 'roteiros', scriptId, 'linhas');
        const linesSnap = await getDocs(linesColRef);
        for (const lineDoc of linesSnap.docs) {
            const archiveLineRef = doc(
                db, 'archived_scripts', roomId, 'roteiros', scriptId, 'linhas', lineDoc.id
            );
            await setDoc(archiveLineRef, lineDoc.data());
        }

        // 3. Archive historico
        const histColl = collection(db, 'salasRoteiro', roomId, 'roteiros', scriptId, 'historico');
        const histSnap = await getDocs(histColl);
        for (const histDoc of histSnap.docs) {
            const archiveHistRef = doc(
                db, 'archived_scripts', roomId, 'roteiros', scriptId, 'historico', histDoc.id
            );
            await setDoc(archiveHistRef, histDoc.data());
        }

        // 4. Now delete originals
        await deleteDoc(metaRef);
        for (const lineDoc of linesSnap.docs) {
            await deleteDoc(lineDoc.ref);
        }
        for (const histDoc of histSnap.docs) {
            await deleteDoc(histDoc.ref);
        }

    } else {
        // ── Personal script archive ──────────────────────────────────────
        // 1. Read & archive metadata
        const metaRef = doc(db, 'users', userId, 'roteiros', scriptId);
        const metaSnap = await getDoc(metaRef);
        if (metaSnap.exists()) {
            const archiveMetaRef = doc(db, 'archived_scripts', userId, 'roteiros', scriptId);
            await setDoc(archiveMetaRef, {
                ...metaSnap.data(),
                archivedAt: archiveTimestamp,
                archivedBy: userId
            });
        }

        // 2. Read & archive all content versions
        const contentColl = collection(db, 'users', userId, 'roteiros', scriptId, 'content');
        const contentSnap = await getDocs(contentColl);
        for (const contentDoc of contentSnap.docs) {
            const archiveContentRef = doc(
                db, 'archived_scripts', userId, 'roteiros', scriptId, 'content', contentDoc.id
            );
            await setDoc(archiveContentRef, contentDoc.data());
        }

        // 3. Now delete originals
        // Delete all content versions
        for (const contentDoc of contentSnap.docs) {
            await deleteDoc(contentDoc.ref);
        }
        // Delete metadata
        await deleteDoc(metaRef);
    }
}

// Keep old function name for backward compatibility but delegate to archive
export async function deleteScriptInFirestore(
    userId: string,
    roomId: string | null,
    scriptId: string,
    versions: (string | number)[],
    lines?: string[]
) {
    await archiveAndDeleteScript(userId, roomId, scriptId, versions, lines);
}

// ---------------------------------------------------------------------------
// INTERNAL — Storage Image Copying
// ---------------------------------------------------------------------------

/**
 * Copies Firebase Storage images referenced by take imagemRef URLs.
 * Downloads each blob and re-uploads to the new script's storage namespace.
 * If an image fails to copy, it's silently skipped (the take keeps the original URL).
 */
async function _copyStorageImagesForLines(
    lines: { id: string; data: any }[],
    roomId: string,
    newScriptId: string,
    userId: string
) {
    for (const line of lines) {
        if (line.data.type !== 'take') continue;
        const imagemRef = line.data.imagemRef || '';
        if (!imagemRef || !imagemRef.startsWith('http')) continue;

        try {
            const response = await fetch(imagemRef);
            if (!response.ok) continue;
            const blob = await response.blob();
            const ext = blob.type === 'image/jpeg' ? 'jpg' : 'webp';
            const newPath = `rooms/${roomId}/roteiros/${newScriptId}/takes/${line.id}-${Date.now()}.${ext}`;
            const newUrl = await _uploadBlobToStorage(newPath, blob);
            line.data.imagemRef = newUrl;

            // Also update the already-written line doc with the new URL
            const lineRef = doc(db, 'salasRoteiro', roomId, 'roteiros', newScriptId, 'linhas', line.id);
            await setDoc(lineRef, { imagemRef: newUrl }, { merge: true });
        } catch (err) {
            console.warn(`[scriptService] Falha ao copiar imagem do take ${line.id}, mantendo URL original:`, err);
        }
    }
}

async function _copyStorageImagesForContent(
    content: ScriptFull,
    userId: string,
    newScriptId: string
) {
    let anyUpdated = false;

    for (const scene of content.cenas) {
        for (const take of scene.takes) {
            if (!take.imagemRef || !take.imagemRef.startsWith('http')) continue;

            try {
                const response = await fetch(take.imagemRef);
                if (!response.ok) continue;
                const blob = await response.blob();
                const ext = blob.type === 'image/jpeg' ? 'jpg' : 'webp';
                const newPath = `users/${userId}/roteiros/${newScriptId}/takes/${take.id}-${Date.now()}.${ext}`;
                const newUrl = await _uploadBlobToStorage(newPath, blob);
                take.imagemRef = newUrl;
                anyUpdated = true;
            } catch (err) {
                console.warn(`[scriptService] Falha ao copiar imagem do take ${take.id}, mantendo URL original:`, err);
            }
        }
    }

    // If any images were re-uploaded, update the stored content doc with new URLs
    if (anyUpdated) {
        // Find all content version docs and update the first one (v1)
        const contentRef = doc(db, 'users', userId, 'roteiros', newScriptId, 'content', 'v1');
        await setDoc(contentRef, toScriptFullDTO(content));
    }
}

async function _uploadBlobToStorage(path: string, blob: Blob): Promise<string> {
    const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
    const { storage } = await import('@/lib/firebase');
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, blob, { contentType: blob.type || 'image/jpeg' });
    return getDownloadURL(storageRef);
}

export async function writeRoomLineDirect(
    roomId: string,
    scriptId: string,
    lineId: string,
    data: any
) {
    const lineRef = doc(db, 'salasRoteiro', roomId, 'roteiros', scriptId, 'linhas', lineId);
    await setDoc(lineRef, data, { merge: true });
}

export async function deleteRoomLineDirect(
    roomId: string,
    scriptId: string,
    lineId: string
) {
    const lineRef = doc(db, 'salasRoteiro', roomId, 'roteiros', scriptId, 'linhas', lineId);
    await deleteDoc(lineRef);
}

export async function writeRoomLinesBatch(
    roomId: string,
    scriptId: string,
    linesToWrite: any[],
    lineIdsToDelete: string[],
    historyLog: { userId: string; userName: string; log: any } | null
) {
    const batch = writeBatch(db);

    // 1. Write updates and additions
    for (const line of linesToWrite) {
        const lineRef = doc(db, 'salasRoteiro', roomId, 'roteiros', scriptId, 'linhas', line.id);
        batch.set(lineRef, {
            ...line,
            atualizadoEm: serverTimestamp()
        }, { merge: true });
    }

    // 2. Handle deletions
    for (const lineId of lineIdsToDelete) {
        const lineRef = doc(db, 'salasRoteiro', roomId, 'roteiros', scriptId, 'linhas', lineId);
        batch.delete(lineRef);
    }

    // 3. Append history log if provided
    if (historyLog) {
        const logId = safeUUID();
        const logRef = doc(db, 'salasRoteiro', roomId, 'roteiros', scriptId, 'historico', logId);
        batch.set(logRef, {
            userId: historyLog.userId,
            userName: historyLog.userName,
            linhaId: historyLog.log.linhaId || '',
            campo: historyLog.log.campo || '',
            tipo: historyLog.log.tipo || '',
            conteudoResumo: historyLog.log.conteudoResumo || '',
            timestamp: serverTimestamp()
        });
    }

    await batch.commit();
}

// ---------------------------------------------------------------------------
// LOCKS
// ---------------------------------------------------------------------------

export async function adquirirLock(
    roomId: string,
    scriptId: string,
    takeId: string,
    campo: 'audio' | 'visual',
    userId: string,
    userName: string
) {
    const docRef = doc(db, 'salasRoteiro', roomId, 'roteiros', scriptId, 'linhas', takeId);
    await setDoc(docRef, {
        [`${campo}.lock.userId`]: userId,
        [`${campo}.lock.userName`]: userName,
        [`${campo}.lock.lockedAt`]: serverTimestamp()
    }, { merge: true });
}

export async function liberarLock(
    roomId: string,
    scriptId: string,
    takeId: string,
    campo: 'audio' | 'visual'
) {
    const docRef = doc(db, 'salasRoteiro', roomId, 'roteiros', scriptId, 'linhas', takeId);
    await setDoc(docRef, {
        [`${campo}.lock.userId`]: null,
        [`${campo}.lock.userName`]: null,
        [`${campo}.lock.lockedAt`]: null
    }, { merge: true });
}

// ---------------------------------------------------------------------------
// SHARING
// ---------------------------------------------------------------------------

export async function shareScriptInFirestore(
    scriptId: string,
    targetUid: string,
    targetDisplayName: string,
    email: string,
    permission: 'editor' | 'viewer',
    userId: string,
    myEmail: string,
    updatedSharedWith: any,
    currentMetadata: ScriptMetadata
) {
    // 1. Update script's own sharedWith map
    const metaRef = doc(db, 'users', userId, 'roteiros', scriptId);
    await setDoc(metaRef, {
        sharedWith: updatedSharedWith,
        updatedAt: serverTimestamp()
    }, { merge: true });

    // 2. Write to target user's sharedScripts subcollection
    const now = new Date().toISOString();
    const targetSharedRef = doc(db, 'users', targetUid, 'sharedScripts', scriptId);
    
    await setDoc(targetSharedRef, toScriptMetadataDTO({
        ...currentMetadata,
        ownerId: userId,
        ownerEmail: myEmail,
        permission,
        sharedWith: updatedSharedWith,
        atualizadoEm: now
    }));
}

export async function unshareScriptInFirestore(
    scriptId: string,
    targetUid: string,
    userId: string,
    updatedSharedWith: any
) {
    // 1. Update own script's sharedWith map
    const metaRef = doc(db, 'users', userId, 'roteiros', scriptId);
    await setDoc(metaRef, {
        sharedWith: updatedSharedWith,
        updatedAt: serverTimestamp()
    }, { merge: true });

    // 2. Delete reference from target user's sharedScripts
    const targetSharedRef = doc(db, 'users', targetUid, 'sharedScripts', scriptId);
    await deleteDoc(targetSharedRef);
}

export async function deleteSharedScriptReference(
    userId: string,
    scriptId: string
) {
    const targetSharedRef = doc(db, 'users', userId, 'sharedScripts', scriptId);
    await deleteDoc(targetSharedRef);
}

export async function appendRoomHistoryLog(
    roomId: string,
    scriptId: string,
    userId: string,
    userName: string,
    log: {
        linhaId: string;
        campo?: string;
        tipo?: string;
        conteudoResumo?: string;
    }
) {
    const histRef = doc(db, 'salasRoteiro', roomId, 'roteiros', scriptId, 'historico', safeUUID());
    await setDoc(histRef, {
        userId,
        userName,
        linhaId: log.linhaId || '',
        campo: log.campo || '',
        tipo: log.tipo || '',
        conteudoResumo: log.conteudoResumo || '',
        timestamp: serverTimestamp()
    });
}

export async function deleteScriptVersions(
    roomId: string | null,
    ownerId: string,
    scriptId: string,
    versions: (string | number)[]
) {
    const deletePromises = versions.map(async (v) => {
        const ref = roomId
            ? doc(db, 'salasRoteiro', roomId, 'roteiros', scriptId, 'content', `v${v}`)
            : doc(db, 'users', ownerId, 'roteiros', scriptId, 'content', `v${v}`);
        await deleteDoc(ref);
    });
    await Promise.all(deletePromises);
}

export async function updateRoomYjsSnapshots(
    roomId: string,
    scriptId: string,
    updates: { takeId: string; field: 'audio' | 'visual'; base64: string }[]
) {
    const batch = writeBatch(db);
    for (const update of updates) {
        const snapshotRef = doc(db, 'salasRoteiro', roomId, 'roteiros', scriptId, 'linhas_yjs', update.takeId, 'campos', update.field, 'snapshot', 'current');
        batch.set(snapshotRef, {
            state: update.base64,
            updatedAt: serverTimestamp()
        });
        
        const updatesColl = collection(db, 'salasRoteiro', roomId, 'roteiros', scriptId, 'linhas_yjs', update.takeId, 'campos', update.field, 'updates');
        const snap = await getDocs(updatesColl);
        if (!snap.empty) {
            snap.docs.forEach(docSnap => batch.delete(docSnap.ref));
        }
    }
    await batch.commit();
}


