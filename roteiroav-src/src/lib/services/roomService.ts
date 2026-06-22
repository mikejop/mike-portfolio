// ---------------------------------------------------------------------------
// Room Service — Roteiro AV
// Handles room creation, member lists, and role management on Firestore.
// ---------------------------------------------------------------------------

import { db } from '@/lib/firebase';
import {
    doc,
    setDoc,
    deleteDoc,
    collection,
    query,
    where,
    onSnapshot
} from 'firebase/firestore';
import { ScriptRoom } from '@/features/tools/script-editor/types/domain';
import { validateScriptRoom } from '@/features/tools/script-editor/types/validation';
import { toScriptRoomDTO } from '@/features/tools/script-editor/types/dto';

// ---------------------------------------------------------------------------
// SUBSCRIBERS
// ---------------------------------------------------------------------------

export function subscribeToRooms(
    userId: string,
    onUpdate: (rooms: ScriptRoom[]) => void,
    onError: (err: any) => void
) {
    const roomsRef = collection(db, 'rooms');
    const roomsQuery = query(roomsRef, where('memberIds', 'array-contains', userId));
    
    return onSnapshot(roomsQuery, (snapshot) => {
        const list = snapshot.docs.map(doc => {
            const data = doc.data();
            return validateScriptRoom({
                id: doc.id,
                ...data
            });
        });
        onUpdate(list);
    }, onError);
}

// ---------------------------------------------------------------------------
// WRITE
// ---------------------------------------------------------------------------

export async function createRoomInFirestore(room: ScriptRoom) {
    const roomRef = doc(db, 'rooms', room.id);
    await setDoc(roomRef, toScriptRoomDTO(room));
}

export async function deleteRoomInFirestore(roomId: string) {
    const roomRef = doc(db, 'rooms', roomId);
    await deleteDoc(roomRef);
}

export async function updateRoomMembersInFirestore(
    roomId: string,
    members: any,
    memberIds: string[]
) {
    const roomRef = doc(db, 'rooms', roomId);
    await setDoc(roomRef, {
        members,
        memberIds
    }, { merge: true });
}
