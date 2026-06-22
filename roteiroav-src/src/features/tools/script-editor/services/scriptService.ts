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
} from 'firebase/firestore';
import { ScriptFull, ScriptMetadata } from '../types/domain';

// ---------------------------------------------------------------------------
// READ
// ---------------------------------------------------------------------------

/**
 * Loads a script's content for the given version.
 * Falls back to the legacy `content/full` path for v1 for backwards compat.
 */
export async function loadScriptContent(
    userId: string,
    scriptId: string,
    version: number | string
): Promise<ScriptFull | null> {
    const contentRef = doc(db, 'users', userId, 'roteiros', scriptId, 'content', `v${version}`);
    let snap = await getDoc(contentRef);

    // Backwards compat: old scripts were saved under 'content/full'
    if (!snap.exists() && version === 1) {
        const fallbackRef = doc(db, 'users', userId, 'roteiros', scriptId, 'content', 'full');
        snap = await getDoc(fallbackRef);
    }

    return snap.exists() ? (snap.data() as ScriptFull) : null;
}

// ---------------------------------------------------------------------------
// WRITE
// ---------------------------------------------------------------------------

/**
 * Persists script metadata to Firestore (merge — never overwrites unrelated fields).
 */
export async function saveScriptMetadata(
    userId: string,
    scriptId: string,
    metadata: Partial<ScriptMetadata>
): Promise<void> {
    const metaRef = doc(db, 'users', userId, 'roteiros', scriptId);
    await setDoc(metaRef, { ...metadata, updatedAt: serverTimestamp() }, { merge: true });
}

/**
 * Persists full script content for a specific version.
 */
export async function saveScriptContent(
    userId: string,
    scriptId: string,
    version: number | string,
    content: ScriptFull
): Promise<void> {
    const contentRef = doc(db, 'users', userId, 'roteiros', scriptId, 'content', `v${version}`);
    await setDoc(contentRef, content);
}

/**
 * Creates a brand-new script document and its v1 content in a single batch.
 */
export async function createScriptInFirestore(
    userId: string,
    scriptId: string,
    metadata: ScriptMetadata,
    content: ScriptFull
): Promise<void> {
    const metaRef = doc(db, 'users', userId, 'roteiros', scriptId);
    await setDoc(metaRef, { ...metadata, updatedAt: serverTimestamp() });

    const contentRef = doc(db, 'users', userId, 'roteiros', scriptId, 'content', 'v1');
    await setDoc(contentRef, content);
}

/**
 * Copies content from one version to another within the same script.
 * Used when creating a new version (clones current content into the new slot).
 */
export async function cloneVersionContent(
    userId: string,
    scriptId: string,
    fromVersion: number | string,
    toVersion: number | string
): Promise<void> {
    const sourceRef = doc(db, 'users', userId, 'roteiros', scriptId, 'content', `v${fromVersion}`);
    const snap = await getDoc(sourceRef);
    if (!snap.exists()) return;

    const destRef = doc(db, 'users', userId, 'roteiros', scriptId, 'content', `v${toVersion}`);
    await setDoc(destRef, snap.data());
}

/**
 * Saves a duplicated script (new ID, new metadata, v1 content).
 */
export async function cloneScriptForDuplicate(
    userId: string,
    newId: string,
    newMetadata: ScriptMetadata,
    newContent: ScriptFull
): Promise<void> {
    const contentRef = doc(db, 'users', userId, 'roteiros', newId, 'content', 'v1');
    await setDoc(contentRef, newContent);

    const metaRef = doc(db, 'users', userId, 'roteiros', newId);
    await setDoc(metaRef, { ...newMetadata, updatedAt: serverTimestamp() });
}

// ---------------------------------------------------------------------------
// DELETE
// ---------------------------------------------------------------------------

/**
 * Deletes all versioned content documents for a script (v1, v2, v4.1…)
 * and the legacy `content/full` for backwards compat.
 * Uses Promise.allSettled so a missing doc never aborts the whole cleanup.
 */
export async function deleteAllVersionContent(
    userId: string,
    scriptId: string,
    versions: (number | string)[]
): Promise<void> {
    const deletePromises = versions.map((v) =>
        deleteDoc(doc(db, 'users', userId, 'roteiros', scriptId, 'content', `v${v}`))
    );

    // Attempt legacy path deletion (might not exist — allSettled handles it)
    deletePromises.push(
        deleteDoc(doc(db, 'users', userId, 'roteiros', scriptId, 'content', 'full'))
    );

    await Promise.allSettled(deletePromises);
}

/**
 * Deletes a single versioned content document.
 */
export async function deleteVersionContent(
    userId: string,
    scriptId: string,
    version: number | string
): Promise<void> {
    await deleteDoc(
        doc(db, 'users', userId, 'roteiros', scriptId, 'content', `v${version}`)
    );
}

/**
 * Deletes the top-level metadata document for a script.
 */
export async function deleteScriptMetadata(
    userId: string,
    scriptId: string
): Promise<void> {
    await deleteDoc(doc(db, 'users', userId, 'roteiros', scriptId));
}
