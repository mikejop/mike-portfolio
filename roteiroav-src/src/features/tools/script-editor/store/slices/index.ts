// ---------------------------------------------------------------------------
// Store Slices Barrel / Combinator — Roteiro AV
// Combines Room, Editor, and Metadata slices into a single composed state.
// ---------------------------------------------------------------------------

import { StateCreator } from 'zustand';
import { ScriptStoreState } from '../../types/store';
import { createMetadataSlice } from './createMetadataSlice';
import { createRoomSlice } from './createRoomSlice';
import { createEditorSlice } from './createEditorSlice';

export const createCombinedStore: StateCreator<ScriptStoreState, [], []> = (set, get, store) => ({
    ...createMetadataSlice(set, get, store),
    ...createRoomSlice(set, get, store),
    ...createEditorSlice(set, get, store),
});
