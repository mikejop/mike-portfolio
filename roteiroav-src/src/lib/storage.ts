import { storage } from "./firebase";
import { ref, uploadString, getDownloadURL, deleteObject, listAll, uploadBytes } from "firebase/storage";

/**
 * Uploads a JSON object to Firebase Storage as a string.
 */
export async function uploadJsonToStorage(path: string, data: any): Promise<string> {
    try {
        const storageRef = ref(storage, path);
        const jsonString = JSON.stringify(data);
        await uploadString(storageRef, jsonString, 'raw', {
            contentType: 'application/json',
        });
        return path;
    } catch (error) {
        console.error("Error uploading JSON to Storage:", error);
        throw error;
    }
}

/**
 * Downloads and parses a JSON file from Firebase Storage.
 */
export async function downloadJsonFromStorage<T>(path: string): Promise<T> {
    try {
        const storageRef = ref(storage, path);
        const url = await getDownloadURL(storageRef);
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to download JSON from Storage");
        return await response.json() as T;
    } catch (error) {
        console.error("Error downloading JSON from Storage:", error);
        throw error;
    }
}

/**
 * Uploads an image File to Firebase Storage.
 */
export async function uploadImageToStorage(path: string, file: File | Blob): Promise<string> {
    try {
        const storageRef = ref(storage, path);
        const metadata = {
            contentType: file.type || 'image/jpeg'
        };
        await uploadBytes(storageRef, file, metadata);
        return await getDownloadURL(storageRef);
    } catch (error) {
        console.error("Error uploading image to Storage:", error);
        throw error;
    }
}

/**
 * Deletes a file or even a "folder" from Firebase Storage.
 */
export async function deleteStoragePath(path: string): Promise<void> {
    try {
        const storageRef = ref(storage, path);
        try {
            await deleteObject(storageRef);
        } catch (e: any) {
            if (e.code === 'storage/object-not-found' || e.code === 'storage/unauthorized') {
                const listRef = ref(storage, path);
                const list = await listAll(listRef);
                
                const deletePromises = [
                    ...list.items.map(item => deleteObject(item)),
                    ...list.prefixes.map(prefix => deleteStoragePath(prefix.fullPath))
                ];
                
                await Promise.all(deletePromises);
            } else {
                throw e;
            }
        }
    } catch (error) {
        console.error("Error deleting from Storage:", error);
    }
}
