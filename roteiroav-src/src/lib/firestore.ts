import { db, auth } from "./firebase";
import {
    collection,
    doc,
    setDoc,
    deleteDoc,
    serverTimestamp,
    addDoc,
    getDoc,
    getDocs,
    query,
    orderBy,
    limit,
    increment
} from "firebase/firestore";

export interface UserProfile {
    uid: string;
    displayName?: string;
    email?: string;
    phone?: string;
    photoURL?: string;
    birthDate?: string;
    address?: {
        cep: string;
        street: string;
        number: string;
        complement?: string;
        neighborhood: string;
        city: string;
        state: string;
    };
    source?: any;
    ip?: string | null;
    location?: {
        city?: string | null;
        region?: string | null;
        country?: string | null;
    } | null;
    updatedAt?: any;
}

/**
 * Global save function as requested by the user.
 * Saves to users/{uid}/{type}/{docId}
 */
export const saveDojoData = async (type: 'scripts' | 'budgets' | 'pricing' | 'roteiros', data: any, docId?: string) => {
    const user = auth.currentUser;
    if (!user) {
        console.error("Usuário não autenticado!");
        return null;
    }

    try {
        const payload = {
            ...data,
            ownerId: user.uid,
            updatedAt: serverTimestamp(),
        };

        // If it's a new doc, we might want createdAt
        // In this implementation, we use setDoc to allow specific IDs (like script IDs)
        const colRef = collection(db, "users", user.uid, type);

        if (docId) {
            await setDoc(doc(colRef, docId), payload, { merge: true });
            return docId;
        } else {
            const docRef = await addDoc(colRef, {
                ...payload,
                createdAt: serverTimestamp(),
            });
            return docRef.id;
        }
    } catch (e) {
        console.error("Erro ao salvar no Firestore: ", e);
        throw e;
    }
};

/**
 * Backwards compatibility / Helper for user-based document saving
 */
export const saveUserDocument = async (
    collectionName: 'scripts' | 'budgets' | 'pricing' | 'roteiros',
    docId: string,
    data: any
) => {
    return saveDojoData(collectionName, data, docId);
};

export const deleteUserDocument = async (
    collectionName: 'scripts' | 'budgets' | 'pricing' | 'roteiros',
    docId: string
) => {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const docRef = doc(db, "users", user.uid, collectionName, docId);
    await deleteDoc(docRef);
};

export const getUserCollection = async (
    collectionName: 'scripts' | 'budgets' | 'pricing' | 'roteiros'
) => {
    const user = auth.currentUser;
    if (!user) return [];

    try {
        const colRef = collection(db, "users", user.uid, collectionName);
        const q = query(colRef, orderBy("updatedAt", "desc"), limit(100));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
        console.error(`Erro ao carregar coleção ${collectionName}: `, e);
        return [];
    }
};

export const getUserDocument = async (
    collectionName: 'scripts' | 'budgets' | 'pricing',
    docId: string
) => {
    const user = auth.currentUser;
    if (!user) return null;

    try {
        const docRef = doc(db, "users", user.uid, collectionName, docId);
        const snapshot = await getDoc(docRef);
        return snapshot.exists() ? snapshot.data() : null;
    } catch (e) {
        console.error(`Erro ao carregar documento ${docId} de ${collectionName}: `, e);
        return null;
    }
};

/**
 * User Profile specific helpers
 */
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
    try {
        const docRef = doc(db, "users", uid, "profile", "main");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return docSnap.data() as UserProfile;
        }
        return null;
    } catch (e) {
        console.error("Erro ao carregar perfil: ", e);
        return null;
    }
};

export const updateUserProfile = async (uid: string, data: Partial<UserProfile>) => {
    try {
        const docRef = doc(db, "users", uid, "profile", "main");
        await setDoc(docRef, {
            ...data,
            uid,
            updatedAt: serverTimestamp()
        }, { merge: true });

        // Also write to root users collection to allow querying by email for sharing
        if (data.email) {
            const rootDocRef = doc(db, "users", uid);
            await setDoc(rootDocRef, {
                uid,
                email: data.email.toLowerCase().trim(),
                displayName: data.displayName || "",
                photoURL: data.photoURL || "",
                updatedAt: serverTimestamp()
            }, { merge: true });
        }
    } catch (e) {
        console.error("Erro ao atualizar perfil: ", e);
        throw e;
    }
};

/**
 * App Usage Tracking
 */
export const trackAppUsage = async (uid: string, appId: string) => {
    try {
        const docRef = doc(db, "users", uid, "appUsage", appId);
        await setDoc(docRef, {
            appId,
            visits: increment(1),
            lastVisited: serverTimestamp()
        }, { merge: true });
    } catch (e) {
        console.error("Erro ao registrar uso do app: ", e);
    }
};

export const getTopApps = async (uid: string, count: number = 2): Promise<string[]> => {
    try {
        const usageRef = collection(db, "users", uid, "appUsage");
        const usageQuery = query(usageRef, orderBy("visits", "desc"), limit(count));
        const querySnapshot = await getDocs(usageQuery);

        let topApps: string[] = [];
        querySnapshot.forEach((doc) => {
            topApps.push(doc.id);
        });

        // The specific initial apps required by the user
        const seedApps = ["color-extractor", "palette-creator", "pricing-editor"];

        // Seed with random apps if none found (new user)
        if (topApps.length < count) {
            const needed = count - topApps.length;
            const availableSeeds = seedApps.filter(app => !topApps.includes(app));

            // Randomize array
            const shuffled = availableSeeds.sort(() => 0.5 - Math.random());
            const selectedSeeds = shuffled.slice(0, needed);

            topApps = [...topApps, ...selectedSeeds];

            // Save the initial seeds with 1 visit so they persist
            for (const appId of selectedSeeds) {
                await trackAppUsage(uid, appId);
            }
        }

        return topApps;
    } catch (e) {
        console.error("Erro ao carregar apps mais usados: ", e);
        return ["pricing-editor", "budget-editor"]; // Fallback
    }
};
