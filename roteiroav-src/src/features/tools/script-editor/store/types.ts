// ---------------------------------------------------------------------------
// Backwards-compat re-export barrel.
// All existing imports like `from '../../store/types'` continue to work.
// New code should import directly from '../types/domain' or '../types/store'.
// ---------------------------------------------------------------------------
export type {
    AspectRatio,
    Take,
    Scene,
    ScriptFull,
    ScriptMetadata,
    SortField,
    SortOrder,
    ScriptRoom,
} from '../types/domain';

export type { ScriptStoreState } from '../types/store';
