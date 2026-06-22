// ---------------------------------------------------------------------------
// DTOs — Roteiro AV
// Ensures data sent to Firestore does not contain any undefined fields.
// ---------------------------------------------------------------------------

import { ScriptMetadata, ScriptFull, ScriptRoom } from './domain';

/**
 * Recursively cleans undefined properties from an object,
 * but avoids traversing custom class instances like Firebase FieldValue or Timestamp.
 */
export function cleanUndefined<T>(obj: T): T {
    if (obj === null || obj === undefined) return obj;
    
    if (Array.isArray(obj)) {
        return obj.map(item => cleanUndefined(item)) as any;
    }
    
    if (typeof obj === 'object') {
        const proto = Object.getPrototypeOf(obj);
        if (proto && proto.constructor && proto.constructor.name !== 'Object' && proto.constructor.name !== 'Array') {
            return obj; // Return custom classes (Timestamp, FieldValue) as is
        }
        
        const copy: any = {};
        Object.keys(obj as object).forEach(key => {
            const val = (obj as any)[key];
            if (val !== undefined) {
                copy[key] = cleanUndefined(val);
            }
        });
        return copy;
    }
    
    return obj;
}

export function toScriptMetadataDTO(meta: any): any {
    return cleanUndefined(meta);
}

export function toScriptFullDTO(content: any): any {
    return cleanUndefined(content);
}

export function toScriptRoomDTO(room: any): any {
    return cleanUndefined(room);
}
