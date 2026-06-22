import * as Y from 'yjs';
import { db } from '@/lib/firebase';
import { 
    collection, 
    doc, 
    setDoc, 
    getDoc, 
    onSnapshot, 
    query, 
    orderBy, 
    serverTimestamp, 
    getDocs, 
    writeBatch 
} from 'firebase/firestore';

function uint8ArrayToBase64(arr: Uint8Array): string {
    let binary = '';
    const len = arr.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(arr[i]);
    }
    return typeof window !== 'undefined' ? window.btoa(binary) : Buffer.from(binary, 'binary').toString('base64');
}

function base64ToUint8Array(base64: string): Uint8Array {
    if (typeof window !== 'undefined') {
        const binary = window.atob(base64);
        const len = binary.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
    } else {
        const buffer = Buffer.from(base64, 'base64');
        return new Uint8Array(buffer);
    }
}

function getMillis(val: any): number {
    if (!val) return 0;
    if (typeof val.toMillis === 'function') return val.toMillis();
    if (val instanceof Date) return val.getTime();
    if (typeof val.seconds === 'number') {
        return val.seconds * 1000 + Math.floor((val.nanoseconds || 0) / 1000000);
    }
    return new Date(val).getTime();
}

export async function createFirestoreProvider(ydoc: Y.Doc, collectionPath: string) {
    const updatesRef = collection(db, `${collectionPath}/updates`);
    const originName = 'firestoreYjsProvider';
    const localUpdates = new Set<string>();

    let unsubscribe: (() => void) | null = null;
    let isDestroyed = false;

    const pushUpdate = async (update: Uint8Array) => {
        const base64Update = uint8ArrayToBase64(update);
        localUpdates.add(base64Update);

        const newDocRef = doc(updatesRef);
        await setDoc(newDocRef, {
            data: base64Update,
            createdAt: serverTimestamp()
        });
    };

    try {
        // 1. Carrega o snapshot/current se existir
        const snapshotDocRef = doc(db, `${collectionPath}/snapshot/current`);
        const snapshotDoc = await getDoc(snapshotDocRef);
        let snapshotTime: any = null;

        if (snapshotDoc.exists()) {
            const data = snapshotDoc.data();
            if (data.state) {
                try {
                    const snapshotUpdate = base64ToUint8Array(data.state);
                    Y.applyUpdate(ydoc, snapshotUpdate, originName);
                } catch (e) {
                    console.error('[FirestoreYjsProvider] Erro ao aplicar snapshot inicial:', e);
                }
            }
            snapshotTime = data.updatedAt;
        }

        if (!isDestroyed) {
            // 2. Inicia o listener de snapshot e espera pelo fetch inicial
            const q = query(updatesRef, orderBy('createdAt', 'asc'));
            await new Promise<void>((resolve, reject) => {
                let firstEvent = true;
                unsubscribe = onSnapshot(q, (snapshot) => {
                    snapshot.docChanges().forEach(change => {
                        if (change.type === 'added') {
                            const docData = change.doc.data();
                            if (!docData.data) return;

                            // Ignorar updates locais ecoados
                            if (localUpdates.has(docData.data)) {
                                localUpdates.delete(docData.data);
                                return;
                            }

                            // Ignorar updates já consolidados no snapshot carregado
                            const createdAt = docData.createdAt;
                            if (snapshotTime && createdAt) {
                                if (getMillis(createdAt) <= getMillis(snapshotTime)) {
                                    return;
                                }
                            }

                            try {
                                const updateArray = base64ToUint8Array(docData.data);
                                Y.applyUpdate(ydoc, updateArray, originName);
                            } catch (e) {
                                console.error('[FirestoreYjsProvider] Erro ao aplicar update remoto:', e);
                            }
                        }
                    });
                    if (firstEvent) {
                        firstEvent = false;
                        resolve();
                    }
                }, (error) => {
                    console.error('[FirestoreYjsProvider] Erro no onSnapshot:', error);
                    reject(error);
                });
            });
        }
    } catch (err) {
        console.error('[FirestoreYjsProvider] Erro na inicialização do provider:', err);
    }

    const onDocUpdate = (update: Uint8Array, origin: any) => {
        if (origin !== originName) {
            pushUpdate(update);
        }
    };

    if (!isDestroyed) {
        ydoc.on('update', onDocUpdate);
    }

    const destroy = () => {
        isDestroyed = true;
        if (unsubscribe) {
            unsubscribe();
        }
        ydoc.off('update', onDocUpdate);
    };

    return {
        pushUpdate,
        destroy
    };
}

export async function compactUpdates(collectionPath: string) {
    const updatesRef = collection(db, `${collectionPath}/updates`);
    const q = query(updatesRef, orderBy('createdAt', 'asc'));
    const snapshot = await getDocs(q);

    const docs = snapshot.docs;
    if (docs.length < 50) {
        console.log(`[compactUpdates] Apenas ${docs.length} documentos. Compactação abortada.`);
        return;
    }

    console.log(`[compactUpdates] Iniciando compactação de ${docs.length} updates...`);

    // 1. Reconstrói o Y.Doc temporário
    const tempDoc = new Y.Doc();
    for (const docSnapshot of docs) {
        const data = docSnapshot.data();
        if (data.data) {
            try {
                const updateArray = base64ToUint8Array(data.data);
                Y.applyUpdate(tempDoc, updateArray);
            } catch (e) {
                console.error('[compactUpdates] Erro ao aplicar update no tempDoc:', e);
            }
        }
    }

    // 2. Gera o snapshot consolidado
    const consolidatedUpdate = Y.encodeStateAsUpdate(tempDoc);
    const base64Snapshot = uint8ArrayToBase64(consolidatedUpdate);

    console.log(`[compactUpdates] Snapshot consolidado gerado. Tamanho: ${base64Snapshot.length} caracteres base64.`);

    // 3. Salva no local correto (snapshot/current)
    const snapshotDocRef = doc(db, `${collectionPath}/snapshot/current`);
    await setDoc(snapshotDocRef, {
        state: base64Snapshot,
        updatedAt: serverTimestamp()
    });

    console.log(`[compactUpdates] Snapshot gravado com sucesso em ${collectionPath}/snapshot/current.`);

    // 4. Deleta apenas os updates consolidados
    const docIds = docs.map(d => d.id);
    console.log(`[compactUpdates] ${docIds.length} documentos serão deletados da subcoleção updates.`);

    const chunkSize = 500;
    for (let i = 0; i < docIds.length; i += chunkSize) {
        const batch = writeBatch(db);
        const chunk = docIds.slice(i, i + chunkSize);
        
        chunk.forEach(id => {
            batch.delete(doc(updatesRef, id));
        });

        // Log antes de cada deleção real
        console.log(`[compactUpdates] Deletando lote de ${chunk.length} documentos...`);
        await batch.commit();
        console.log(`[compactUpdates] Lote de ${chunk.length} documentos deletado com sucesso.`);
    }

    console.log('[compactUpdates] Sincronização e compactação de updates concluídas com sucesso.');
}
