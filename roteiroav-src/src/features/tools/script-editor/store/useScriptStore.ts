// ---------------------------------------------------------------------------
// Main Store Entrypoint — Roteiro AV
// Composes room, editor, and metadata slices into a unified Zustand store.
// ---------------------------------------------------------------------------

import { create } from 'zustand';
import { ScriptStoreState } from '../types/store';
import { createCombinedStore } from './slices';
import { isLockAtivo } from './slices/createEditorSlice';

// Export helper for components to check lock activity status
export { isLockAtivo };

// Compose and export useScriptStore
export const useScriptStore = create<ScriptStoreState>(createCombinedStore);
