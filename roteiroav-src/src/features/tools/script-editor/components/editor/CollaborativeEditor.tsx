import { useEffect, useState, useRef } from "react";
import { Editor, EditorContent, Extension } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import Placeholder from "@tiptap/extension-placeholder";
import * as Y from "yjs";
import { Plugin, PluginKey } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
import { createFirestoreProvider } from "../../services/firestoreYjsProvider";
import { cn } from "@/lib/utils";
import { useScriptStore } from "../../store/useScriptStore";

const characterPalette = [
    "#5B9BD5", // azul
    "#E05555", // vermelho coral
    "#34C48A", // verde esmeralda
    "#E59F27", // âmbar
    "#9B7FDD", // violeta
    "#E07B3A", // laranja
    "#1DB8A8", // teal
    "#C86DD4", // fúcsia
];

const getCharacterColorMap = () => {
    const scriptContent = useScriptStore.getState().activeScriptContent;
    if (!scriptContent) return {};
    
    const uniqueNames: string[] = [];
    scriptContent.cenas.forEach(scene => {
        scene.takes.forEach(take => {
            const regex = /\[CHAR:([^\]]*)\]/gi;
            let match;
            if (take.audio) {
                while ((match = regex.exec(take.audio)) !== null) {
                    const name = match[1].trim().toUpperCase();
                    if (name && !uniqueNames.includes(name)) {
                        uniqueNames.push(name);
                    }
                }
            }
            if (take.visual) {
                while ((match = regex.exec(take.visual)) !== null) {
                    const name = match[1].trim().toUpperCase();
                    if (name && !uniqueNames.includes(name)) {
                        uniqueNames.push(name);
                    }
                }
            }
        });
    });
    
    const map: { [name: string]: string } = {};
    uniqueNames.forEach((name, idx) => {
        map[name] = characterPalette[idx % characterPalette.length];
    });
    return map;
};

const getCharacterColor = (name: string, map: { [name: string]: string }) => {
    const cleanName = name.trim().toUpperCase();
    if (map[cleanName]) return map[cleanName];
    const usedCount = Object.keys(map).length;
    return characterPalette[usedCount % characterPalette.length];
};

const hexToRgbComponents = (hex: string) => {
    if (!hex || !hex.startsWith('#')) return '91, 155, 213'; // default blue
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r}, ${g}, ${b}`;
};

const getRegisteredCharacters = () => {
    const scriptContent = useScriptStore.getState().activeScriptContent;
    if (!scriptContent) return [];
    const names: string[] = [];
    scriptContent.cenas.forEach(scene => {
        scene.takes.forEach(take => {
            const regex = /\[CHAR:([^\]]*)\]/gi;
            let match;
            if (take.audio) {
                while ((match = regex.exec(take.audio)) !== null) {
                    const name = match[1].trim().toUpperCase();
                    if (name && !names.includes(name)) {
                        names.push(name);
                    }
                }
            }
        });
    });
    return names;
};

// ─── Chip colour palette for every element type ───────────────────────────────
const CHIP_COLORS: Record<string, string> = {
    CHAR: '#5B9BD5',
    DIAL: '#85B7EB', VO: '#85B7EB', OFF: '#85B7EB', LOC: '#85B7EB', ENTREVISTA: '#85B7EB',
    TRILHA: '#9B7FDD',
    SFX: '#34C48A',
    PLANO: '#E59F27', ANGULO: '#E07B3A', POSICAO: '#C8A020',
    MOVCAM: '#1DB8A8', LENTE: '#38B8F0', LUZ: '#D4A800',
    INSERCAO: '#C86DD4', TRANSICAO: '#E05555',
};

const VISUAL_TAG_TYPES = new Set(['PLANO', 'ANGULO', 'POSICAO', 'MOVCAM', 'LENTE', 'LUZ', 'INSERCAO', 'TRANSICAO']);

/**
 * Creates a ProseMirror widget Decoration that renders a chip/badge with a
 * label and a × delete button.  The raw tag text is hidden separately via an
 * inline decoration (.roteiro-raw-hidden).
 */
const makeChipDecoration = (
    tagType: string,
    tagVal: string,
    tagStart: number,
    tagEnd: number,
    chipColor: string
): Decoration => {
    // Visible label inside the chip
    let labelText: string;
    if (tagType === 'CHAR') {
        labelText = (tagVal || 'CHAR').toUpperCase();
    } else if (VISUAL_TAG_TYPES.has(tagType)) {
        // Visual column chips show the selected sub-value (e.g., "PP" not "PLANO")
        labelText = tagVal || tagType;
    } else {
        labelText = tagType; // DIAL, TRILHA, SFX …
    }

    return Decoration.widget(
        tagStart,
        (view) => {
            const rgb = hexToRgbComponents(chipColor);

            const chip = document.createElement('span');
            chip.contentEditable = 'false';
            chip.className = `roteiro-chip roteiro-chip-${tagType.toLowerCase()}`;
            chip.style.cssText =
                `border-color:${chipColor};background:rgba(${rgb},0.13);`;

            const lbl = document.createElement('span');
            lbl.className = 'roteiro-chip-label';
            lbl.style.color = chipColor;
            lbl.textContent = labelText;
            chip.appendChild(lbl);

            const btn = document.createElement('button');
            btn.className = 'roteiro-chip-delete';
            btn.type = 'button';
            btn.title = 'Remover elemento';
            btn.textContent = '×';
            btn.style.color = chipColor;
            btn.addEventListener('mousedown', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const { state } = view;
                const safeEnd = Math.min(tagEnd, state.doc.content.size);
                if (tagStart < safeEnd) {
                    try {
                        const snippet = state.doc.textBetween(tagStart, safeEnd);
                        if (snippet.startsWith('[')) {
                            view.dispatch(state.tr.delete(tagStart, safeEnd));
                        }
                    } catch { /* position shifted due to concurrent edit */ }
                }
                view.focus();
            });
            chip.appendChild(btn);
            return chip;
        },
        { side: -1, ignoreSelection: true, key: `chip-${tagStart}-${tagType}` }
    );
};

// ProseMirror decoration plugin to visually render structured script elements
const RoteiroDecorationExtension = Extension.create({
    name: 'roteiroDecoration',

    addProseMirrorPlugins() {
        return [
            new Plugin({
                key: new PluginKey('roteiroDecoration'),
                state: {
                    init() { return DecorationSet.empty; },
                    apply(tr, _oldSet, _oldState, newState) {
                        const { doc } = tr;
                        const decorations: Decoration[] = [];
                        const charColorMap = getCharacterColorMap();
                        let lastActiveCharName: string | null = null;

                        doc.descendants((node, pos) => {
                            if (!node.isTextblock) return;
                            const text = node.textContent;

                            // Track active character for dialogue block colouring
                            if (text.startsWith('[CHAR:')) {
                                const m = /\[CHAR:([^\]]*)\]/i.exec(text);
                                lastActiveCharName = m ? m[1].trim().toUpperCase() : null;
                            } else if (text.startsWith('[TRILHA') || text.startsWith('[SFX')) {
                                lastActiveCharName = null;
                            }

                            const tagRegex = /\[([A-Z_]+)(?::([^\]]*))?\]/g;
                            let match;
                            let firstTagType: string | null = null;
                            let firstMatchIdx = -1;

                            while ((match = tagRegex.exec(text)) !== null) {
                                const start = pos + 1 + match.index;
                                const end   = start + match[0].length;
                                const tagType = match[1];
                                const tagVal  = match[2] ?? '';

                                if (firstMatchIdx === -1) {
                                    firstMatchIdx = match.index;
                                    firstTagType  = tagType;
                                }

                                if (tagType === 'CHAR' && !tagVal) {
                                    // Empty CHAR (initial state) — show cursor
                                    // between hidden brackets so the field looks blank.
                                    decorations.push(Decoration.inline(start, start + 6, { class: 'roteiro-raw-hidden' }));
                                    decorations.push(Decoration.inline(end - 1, end,     { class: 'roteiro-raw-hidden' }));
                                    decorations.push(Decoration.inline(start, end,       { 'data-tag': tagType, 'data-val': tagVal }));
                                } else {
                                    // Determine chip colour
                                    let chipColor: string;
                                    if (tagType === 'CHAR') {
                                        chipColor = getCharacterColor(tagVal, charColorMap);
                                    } else if (['DIAL','VO','OFF','LOC','ENTREVISTA'].includes(tagType) && lastActiveCharName) {
                                        chipColor = getCharacterColor(lastActiveCharName, charColorMap);
                                    } else {
                                        chipColor = CHIP_COLORS[tagType] ?? '#ffffff80';
                                    }

                                    // 1. Hide the raw markup text
                                    decorations.push(Decoration.inline(start, end, {
                                        class: 'roteiro-raw-hidden',
                                        'data-tag': tagType,
                                        'data-val': tagVal,
                                    }));

                                    // 2. Chip widget that replaces it visually
                                    decorations.push(makeChipDecoration(tagType, tagVal, start, end, chipColor));
                                }
                            }

                            // ─── Block-level paragraph decoration ────────────────────
                            if (firstTagType && firstMatchIdx !== -1) {
                                const textBefore = text.slice(0, firstMatchIdx);
                                if (textBefore.trim() === '') {
                                    let blockStyle = '';

                                    if (firstTagType === 'CHAR') {
                                        const closeIdx = text.indexOf(']');
                                        const charName = closeIdx !== -1
                                            ? text.slice(firstMatchIdx + 6, closeIdx).trim().toUpperCase()
                                            : '';
                                        const charColor = getCharacterColor(charName, charColorMap);
                                        const rgb = hexToRgbComponents(charColor);
                                        blockStyle = `--char-color:${charColor};border-left-color:${charColor}!important;background-color:rgba(${rgb},var(--roteiro-bg-opacity))!important;`;

                                    } else if (['DIAL','VO','OFF','LOC','ENTREVISTA'].includes(firstTagType) && lastActiveCharName) {
                                        const charColor = getCharacterColor(lastActiveCharName, charColorMap);
                                        const rgb = hexToRgbComponents(charColor);
                                        blockStyle = `--char-color:${charColor};border-left-color:${charColor}!important;background-color:rgba(${rgb},var(--roteiro-bg-opacity))!important;color:${charColor}!important;`;

                                    } else if (firstTagType === 'TRILHA') {
                                        blockStyle = 'color:#9B7FDD!important;';

                                    } else if (firstTagType === 'SFX') {
                                        blockStyle = 'color:#34C48A!important;';
                                    }

                                    decorations.push(
                                        Decoration.node(pos, pos + node.nodeSize, {
                                            class: `roteiro-block roteiro-block-${firstTagType.toLowerCase()}`,
                                            style: blockStyle,
                                        })
                                    );
                                }
                            }
                        });

                        return DecorationSet.create(doc, decorations);
                    }
                },
                props: {
                    decorations(state) { return this.getState(state); }
                }
            })
        ];
    }
});

interface CollaborativeEditorProps {
    collectionPath?: string;
    field: 'audio' | 'visual';
    value?: string;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    id?: string;
    onUpdate?: (plainText: string) => void;
    onFocus?: () => void;
    onBlur?: () => void;
    onKeyDown?: (e: React.KeyboardEvent<Element>) => void;
}

const cleanAndNormalizeText = (text: string) => {
    // Text is stored as typed — CSS handles uppercase rendering for labels
    return text;
};

const getSlashQuery = (editor: Editor) => {
    const { selection } = editor.state;
    const { $from } = selection;
    const textOfBlock = $from.parent.textContent;
    const caretPos = $from.parentOffset;
    const textBeforeCaret = textOfBlock.slice(0, caretPos);

    const lastSlashIdx = textBeforeCaret.lastIndexOf('/');
    if (lastSlashIdx === -1) return null;

    const queryText = textBeforeCaret.slice(lastSlashIdx + 1);

    const textBeforeSlash = textBeforeCaret.slice(0, lastSlashIdx);
    const isAtStart = textBeforeSlash.trim() === "";

    if (!isAtStart) return null;
    if (queryText.includes(' ')) return null;

    return {
        query: queryText,
        slashIndex: lastSlashIdx,
        caretPos
    };
};

const getCharAutocompleteInfo = (editor: Editor) => {
    const { selection } = editor.state;
    const { $from } = selection;
    const textOfBlock = $from.parent.textContent;
    const caretPos = $from.parentOffset;
    
    if (textOfBlock.startsWith('[CHAR:')) {
        const closeBracketIdx = textOfBlock.indexOf(']');
        if (caretPos > 6 && (closeBracketIdx === -1 || caretPos <= closeBracketIdx)) {
            const query = textOfBlock.slice(6, closeBracketIdx !== -1 ? closeBracketIdx : caretPos);
            return {
                query: query.trim(),
                from: $from.start() + 6,
                to: $from.start() + (closeBracketIdx !== -1 ? closeBracketIdx : caretPos)
            };
        }
    }
    return null;
};

const getAudioContext = (editor: Editor) => {
    const { doc, selection } = editor.state;
    const { $from } = selection;
    const textOfBlock = $from.parent.textContent;

    if (textOfBlock.startsWith('[CHAR:') ||
        textOfBlock.startsWith('[DIAL]') || 
        textOfBlock.startsWith('[VO]') || 
        textOfBlock.startsWith('[OFF]') || 
        textOfBlock.startsWith('[LOC]') || 
        textOfBlock.startsWith('[ENTREVISTA]')) {
        return 'CHAR';
    }

    const currentBlockPos = $from.before();
    let lastTag: 'CHAR' | 'NONE' = 'NONE';

    doc.descendants((node, pos) => {
        if (pos >= currentBlockPos) return false;
        if (!node.isTextblock) return;
        const text = node.textContent;
        if (text.startsWith('[CHAR:')) {
            lastTag = 'CHAR';
        } else if (text.startsWith('[TRILHA') || text.startsWith('[SFX')) {
            lastTag = 'NONE';
        }
    });

    return lastTag;
};

const getAudioMenuOptions = (
    query: string, 
    context: 'NONE' | 'CHAR', 
    onSelectTag: (markup: string) => void, 
    onSelectSub: (val: string) => void
) => {
    const q = query.toLowerCase().trim();

    if (context === 'CHAR') {
        const subs = [
            { label: 'DIAL (/dial)', cmd: 'dial', val: 'DIAL' },
            { label: 'VO (/vo)', cmd: 'vo', val: 'VO' },
            { label: 'OFF (/off)', cmd: 'off', val: 'OFF' },
            { label: 'LOC (/loc)', cmd: 'loc', val: 'LOC' },
            { label: 'ENTREVISTA (/entrevista)', cmd: 'entrevista', val: 'ENTREVISTA' },
            { label: 'Efeito Sonoro (/sfx)', cmd: 'sfx', markup: '[SFX:] ' },
            { label: 'Trilha Sonora (/trilha)', cmd: 'trilha', markup: '[TRILHA:] ' },
            { label: 'Personagem / Fala (/char)', cmd: 'char', markup: '[CHAR:]' }
        ];
        return subs
            .filter(s => !q || s.label.toLowerCase().includes(q) || s.cmd.includes(q))
            .map(s => ({
                label: s.label,
                command: `/${s.cmd}`,
                action: () => {
                    if (s.markup) {
                        onSelectTag(s.markup);
                    } else {
                        onSelectSub(s.val!);
                    }
                }
            }));
    }

    const mains = [
        { label: 'Personagem / Fala (/char)', cmd: 'char', markup: '[CHAR:]' },
        { label: 'Trilha Sonora (/trilha)', cmd: 'trilha', markup: '[TRILHA:] ' },
        { label: 'Efeito Sonoro (/sfx)', cmd: 'sfx', markup: '[SFX:] ' }
    ];
    return mains
        .filter(m => !q || m.label.toLowerCase().includes(q) || m.cmd.includes(q))
        .map(m => ({
            label: m.label,
            command: `/${m.cmd}`,
            action: () => onSelectTag(m.markup)
        }));
};

const getVisualMenuOptions = (
    query: string, 
    selectedVisualElementKey: string | null,
    onSelectElement: (el: string) => void, 
    onSelectSub: (el: string, sub: string) => void
) => {
    const q = query.toLowerCase().trim();
    
    const elements = [
        { key: 'PLANO', label: 'PLANO', cmd: 'plano', subs: ['PE', 'PG', 'PC', 'PAM', 'PM', 'PP', 'PPP', 'PD'] },
        { key: 'ANGULO', label: 'ÂNGULO DE CÂMERA', cmd: 'angulo', subs: ['Normal', 'Plongée', 'Contra-plongée', 'Zenital', 'Câmera Overhead', 'Dutch Angle'] },
        { key: 'POSICAO', label: 'POSIÇÃO / ORIENTAÇÃO', cmd: 'posicao', subs: ['Frontal', '3/4', 'Perfil', 'Costas', 'Campo', 'Contracampo', 'POV'] },
        { key: 'MOVCAM', label: 'MOVIMENTO DE CÂMERA', cmd: 'movcam', subs: ['Estática', 'Pan', 'Tilt', 'Travelling', 'Steadicam', 'Grua', 'Crane', 'Drone', 'Arco', 'Chicote', 'Plano-sequência'] },
        { key: 'LENTE', label: 'MOVIMENTO DE OBJETIVA', cmd: 'lente', subs: ['Zoom in', 'Zoom out', 'Rack focus', 'Foco seletivo', 'Profundidade de campo ampla', 'Dolly zoom'] },
        { key: 'LUZ', label: 'ILUMINAÇÃO', cmd: 'luz', subs: ['High key', 'Low key', 'Chiaroscuro', 'Luz natural', 'Luz artificial', 'Temperatura de cor', 'Contraluz', 'Luz motivada'] },
        { key: 'TRANSICAO', label: 'TRANSIÇÕES E MONTAGEM', cmd: 'transicao', subs: ['Corte seco', 'Fade in', 'Fade out', 'Dissolve', 'Wipe', 'Match cut', 'Paralela', 'Jump cut', 'Elipse'] },
        { key: 'INSERCAO', label: 'INSERÇÕES VISUAIS', cmd: 'insercao', subs: ['Texto na tela', 'Lower thirds', 'Legendas', 'Grafismos', 'Motion graphics', 'Imagem arquivo', 'Material de acervo', 'Tela dentro da tela', 'Simulação', 'Animação 2D', 'Animação 3D', 'Infográfico'] }
    ];

    if (selectedVisualElementKey) {
        const el = elements.find(x => x.key === selectedVisualElementKey);
        if (el) {
            return el.subs
                .filter(sub => !q || sub.toLowerCase().includes(q))
                .map(sub => ({
                    label: sub,
                    command: sub,
                    action: () => onSelectSub(selectedVisualElementKey, sub)
                }));
        }
    }

    if (!q) {
        return elements.map(el => ({
            label: `${el.label} (/${el.cmd})`,
            command: `/${el.cmd}`,
            action: () => onSelectElement(el.key)
        }));
    }

    const matchedElement = elements.find(el => el.cmd === q || el.key.toLowerCase() === q);
    if (matchedElement) {
        return matchedElement.subs.map(sub => ({
            label: sub,
            command: sub,
            action: () => onSelectSub(matchedElement.key, sub)
        }));
    }

    const options: any[] = [];
    elements.forEach(el => {
        if (el.label.toLowerCase().includes(q) || el.cmd.includes(q)) {
            options.push({
                label: `${el.label} (/${el.cmd})`,
                command: `/${el.cmd}`,
                action: () => onSelectElement(el.key)
            });
        }
    });

    elements.forEach(el => {
        el.subs.forEach(sub => {
            if (sub.toLowerCase().includes(q) && !options.some(opt => opt.label === sub)) {
                options.push({
                    label: `${sub} (${el.label})`,
                    command: sub,
                    action: () => onSelectSub(el.key, sub)
                });
            }
        });
    });

    return options;
};

export function CollaborativeEditor({
    collectionPath,
    field,
    value = "",
    placeholder = "",
    disabled = false,
    className,
    id,
    onUpdate,
    onFocus,
    onBlur,
    onKeyDown,
}: CollaborativeEditorProps) {
    const [editor, setEditor] = useState<Editor | null>(null);
    const { focusedFieldId, setFocusedFieldId } = useScriptStore();

    const [dummyValue, setDummyValue] = useState(value);
    const dummyRef = useRef<HTMLTextAreaElement>(null);
    const hasModifiedRef = useRef(false);
    const lastEnterRef = useRef<{ time: number; pos: number } | null>(null);

    const [selectedVisualElementKey, setSelectedVisualElementKey] = useState<string | null>(null);
    const [slashMenu, setSlashMenu] = useState<{
        visible: boolean;
        query: string;
        x: number;
        y: number;
        options: { label: string; command: string; action: () => void }[];
        activeIndex: number;
    }>({
        visible: false,
        query: "",
        x: 0,
        y: 0,
        options: [],
        activeIndex: 0
    });

    // Synchronize local Tiptap editor content with value if external updates happen
    useEffect(() => {
        if (editor && !collectionPath && value !== editor.getText()) {
            editor.commands.setContent(value);
        }
    }, [value, editor, collectionPath]);

    // Keep dummy value in sync with external updates if the editor isn't loaded yet
    useEffect(() => {
        if (!editor) {
            setDummyValue(value);
        }
    }, [value, editor]);

    // Handle focus and state transitions when the real editor loads
    useEffect(() => {
        if (editor) {
            const wasFocused = dummyRef.current && document.activeElement === dummyRef.current;
            const shouldFocus = wasFocused || (id && focusedFieldId === id);

            if (hasModifiedRef.current) {
                editor.commands.setContent(dummyValue);
                hasModifiedRef.current = false;
            }

            if (shouldFocus) {
                editor.commands.focus('end');
                if (id && focusedFieldId === id) {
                    setFocusedFieldId(null);
                }
            }
        }
    }, [editor, id, focusedFieldId, setFocusedFieldId, dummyValue]);

    // Focus the dummy textarea immediately if focusedFieldId matches before the editor loads
    useEffect(() => {
        if (!editor && id && focusedFieldId === id && dummyRef.current) {
            dummyRef.current.focus();
        }
    }, [editor, id, focusedFieldId]);

    const adjustDummyHeight = () => {
        const textarea = dummyRef.current;
        if (textarea) {
            textarea.style.height = "auto";
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    };

    useEffect(() => {
        if (!editor) {
            adjustDummyHeight();
        }
    }, [dummyValue, editor]);

    const handleDummyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setDummyValue(e.target.value);
        hasModifiedRef.current = true;
        const normalized = cleanAndNormalizeText(e.target.value);
        onUpdate?.(normalized);
        adjustDummyHeight();
    };

    const insertAudioTag = (editor: Editor, tagMarkup: string) => {
        const { selection } = editor.state;
        const { $from } = selection;
        const from = $from.before() + 1;
        const to = $from.after() - 1;
        
        editor.chain()
            .focus()
            .insertContentAt({ from, to }, tagMarkup)
            .run();
            
        if (tagMarkup.startsWith('[CHAR:')) {
            // Position cursor inside [CHAR:] right after the colon for name typing
            editor.commands.setTextSelection(from + 6);
        } else if (tagMarkup.startsWith('[TRILHA:]')) {
            // TRILHA is inline: position cursor after the tag+space so user types content directly
            editor.commands.setTextSelection(from + tagMarkup.length);
        } else if (tagMarkup.startsWith('[SFX:]')) {
            // SFX is inline: position cursor after the tag+space so user types content directly
            editor.commands.setTextSelection(from + tagMarkup.length);
        } else {
            editor.commands.setTextSelection(from + tagMarkup.length);
        }
    };

    const insertCharAutocomplete = (editor: Editor, name: string) => {
        const { selection } = editor.state;
        const { $from } = selection;
        const from = $from.before() + 1;
        const to = $from.after() - 1;
        
        // Store name as typed — CSS applies uppercase rendering
        const tag = `[CHAR:${name}]`;
        editor.chain()
            .focus()
            .insertContentAt({ from, to }, tag)
            .run();
        
        // Position cursor after the closing bracket (name is complete, ready to press Enter)
        editor.commands.setTextSelection(from + tag.length);
    };

    const insertAudioSubTag = (editor: Editor, subVal: string) => {
        const { selection } = editor.state;
        const { $from } = selection;
        const text = $from.parent.textContent;
        const from = $from.before() + 1;
        const to = $from.after() - 1;
        
        let newText = text;
        if (text.startsWith('/')) {
            // Replace the slash command line completely with the dialogue tag
            newText = `[${subVal}] `;
        } else if (text.startsWith('[DIAL') || text.startsWith('[VO') || text.startsWith('[OFF') || text.startsWith('[LOC') || text.startsWith('[ENTREVISTA')) {
            newText = text.replace(/\[[A-Z]+\]\s*\/[a-z_]*/i, `[${subVal}] `);
        } else if (text.startsWith('[CHAR:')) {
            newText = text + ` [${subVal}]`;
        }
        
        editor.chain()
            .focus()
            .insertContentAt({ from, to }, newText)
            .run();
            
        editor.commands.setTextSelection(from + newText.length);
    };

    const insertVisualTag = (editor: Editor, element: string, subelement: string) => {
        const { selection } = editor.state;
        const { $from } = selection;
        const text = $from.parent.textContent;
        const caretPos = $from.parentOffset;
        const textBeforeCaret = text.slice(0, caretPos);
        const lastSlashIdx = textBeforeCaret.lastIndexOf('/');
        
        if (lastSlashIdx !== -1) {
            const from = $from.start() + lastSlashIdx;
            const to = $from.start() + caretPos;
            const tag = `[${element}:${subelement}] `;
            
            editor.chain()
                .focus()
                .insertContentAt({ from, to }, tag)
                .run();
                
            editor.commands.setTextSelection(from + tag.length);
        }
    };

    // Slash menu trigger listener
    useEffect(() => {
        if (!editor) return;

        const updateHandler = () => {
            // First check if character autocomplete is active
            const charAutocomplete = getCharAutocompleteInfo(editor);
            if (charAutocomplete) {
                const registered = getRegisteredCharacters();
                const q = charAutocomplete.query.toUpperCase();
                const filtered = registered.filter(name => !q || name.startsWith(q));

                const opts = filtered.map(name => ({
                    label: name,
                    command: name,
                    action: () => {
                        insertCharAutocomplete(editor, name);
                        setSlashMenu(prev => ({ ...prev, visible: false }));
                    }
                }));

                const { selection } = editor.state;
                const coords = editor.view.coordsAtPos(selection.from);
                const editorRect = editor.view.dom.getBoundingClientRect();
                const top = coords.bottom - editorRect.top + editor.view.dom.scrollTop + 4;
                const left = coords.left - editorRect.left + editor.view.dom.scrollLeft;

                setSlashMenu({
                    visible: opts.length > 0,
                    query: charAutocomplete.query,
                    x: left,
                    y: top,
                    options: opts,
                    activeIndex: 0
                });
                return;
            }

            // Standard slash commands menu
            const slashInfo = getSlashQuery(editor);
            if (slashInfo) {
                const { selection } = editor.state;
                const coords = editor.view.coordsAtPos(selection.from);
                const editorRect = editor.view.dom.getBoundingClientRect();
                
                const top = coords.bottom - editorRect.top + editor.view.dom.scrollTop + 4;
                const left = coords.left - editorRect.left + editor.view.dom.scrollLeft;

                const context = field === 'audio' ? getAudioContext(editor) : 'NONE';
                
                let opts: any[] = [];
                if (field === 'audio') {
                    opts = getAudioMenuOptions(
                        slashInfo.query, 
                        context, 
                        (markup) => {
                            insertAudioTag(editor, markup);
                            setSlashMenu(prev => ({ ...prev, visible: false }));
                        }, 
                        (subVal) => {
                            insertAudioSubTag(editor, subVal);
                            setSlashMenu(prev => ({ ...prev, visible: false }));
                        }
                    );
                } else {
                    opts = getVisualMenuOptions(
                        slashInfo.query,
                        selectedVisualElementKey,
                        (elKey) => {
                            setSelectedVisualElementKey(elKey);
                        },
                        (elKey, subVal) => {
                            insertVisualTag(editor, elKey, subVal);
                            setSelectedVisualElementKey(null);
                            setSlashMenu(prev => ({ ...prev, visible: false }));
                        }
                    );
                }

                setSlashMenu({
                    visible: opts.length > 0,
                    query: slashInfo.query,
                    x: left,
                    y: top,
                    options: opts,
                    activeIndex: 0
                });
            } else {
                setSlashMenu(prev => prev.visible ? { ...prev, visible: false } : prev);
                setSelectedVisualElementKey(null);
            }
        };

        editor.on('selectionUpdate', updateHandler);
        editor.on('update', updateHandler);

        return () => {
            editor.off('selectionUpdate', updateHandler);
            editor.off('update', updateHandler);
        };
    }, [editor, field, selectedVisualElementKey]);

    useEffect(() => {
        let isCancelled = false;
        let provider: any = null;
        let ydoc: Y.Doc | null = null;
        let ed: Editor | null = null;

        async function init() {
            let extensions = [
                StarterKit,
                Placeholder.configure({
                    placeholder,
                    emptyEditorClass: "before:content-[attr(data-placeholder)] before:text-white/10 before:float-left before:h-0 before:pointer-events-none",
                }),
                RoteiroDecorationExtension
            ];

            if (collectionPath) {
                ydoc = new Y.Doc();
                try {
                    provider = await createFirestoreProvider(ydoc, collectionPath);
                    extensions.push(Collaboration.configure({ fragment: ydoc.getXmlFragment('default') }));
                } catch (err) {
                    console.error("Failed to initialize Yjs provider:", err);
                }
            }

            if (isCancelled) {
                if (provider) provider.destroy();
                if (ydoc) ydoc.destroy();
                return;
            }

            ed = new Editor({
                extensions,
                content: !collectionPath ? value : undefined,
                editable: !disabled,
                editorProps: {
                    attributes: {
                        class: cn(
                            "w-full bg-transparent resize-none overflow-hidden focus:outline-none",
                            "transition-all duration-200 min-h-[40px] leading-relaxed prose-invert",
                            "prose prose-sm max-w-none",
                            className
                        ),
                        ...(id ? { id } : {}),
                    },
                    handleKeyDown: (view, event) => {
                        // Slash menu keyboard navigation (priority)
                        if (slashMenu.visible && slashMenu.options.length > 0) {
                            if (event.key === 'ArrowDown') {
                                event.preventDefault();
                                setSlashMenu(prev => ({
                                    ...prev,
                                    activeIndex: (prev.activeIndex + 1) % prev.options.length
                                }));
                                return true;
                            }
                            if (event.key === 'ArrowUp') {
                                event.preventDefault();
                                setSlashMenu(prev => ({
                                    ...prev,
                                    activeIndex: (prev.activeIndex - 1 + prev.options.length) % prev.options.length
                                }));
                                return true;
                            }
                            if (event.key === 'Enter') {
                                event.preventDefault();
                                const activeOpt = slashMenu.options[slashMenu.activeIndex];
                                if (activeOpt) {
                                    activeOpt.action();
                                }
                                return true;
                            }
                            if (event.key === 'Escape') {
                                event.preventDefault();
                                setSlashMenu(prev => ({ ...prev, visible: false }));
                                return true;
                            }
                        }

                        // Enter intercept on DIAL/speech blocks
                        if (event.key === 'Enter' && !event.shiftKey && ed) {
                            const { selection } = ed.state;
                            const { $from } = selection;
                            const text = $from.parent.textContent;
                            const dialMatch = text.match(/^\[(DIAL|VO|OFF|LOC|ENTREVISTA)\]/);
                            if (dialMatch) {
                                event.preventDefault();
                                const tagType = dialMatch[1];
                                const now = Date.now();
                                const lastEnter = lastEnterRef.current;
                                
                                // Update ref first
                                lastEnterRef.current = { time: now, pos: $from.pos };

                                if (lastEnter && (now - lastEnter.time <= 100)) {
                                    // Exit Dial: remove the [TAG] prefix from the current paragraph
                                    const startPos = $from.start();
                                    const deleteLen = tagType.length + 3; // e.g. "[DIAL] " has length 7
                                    
                                    const parentEnd = $from.end();
                                    const safeEnd = Math.min(startPos + deleteLen, parentEnd);
                                    
                                    ed.chain()
                                        .deleteRange({ from: startPos, to: safeEnd })
                                        .focus(startPos)
                                        .run();
                                    return true;
                                } else {
                                    // Continue Dial: insert new paragraph with same tag below
                                    const pos = $from.after();
                                    const tagPrefix = `[${tagType}] `;
                                    ed.chain()
                                        .insertContentAt(pos, `<p>${tagPrefix}</p>`)
                                        .focus(pos + tagPrefix.length + 1) // e.g. pos + 7 + 1 = pos + 8 for DIAL
                                        .run();
                                    return true;
                                }
                            }
                        }

                        // Enter intercept on Character names: insert a new line with '/' to trigger subelements
                        if (event.key === 'Enter' && !event.shiftKey && ed) {
                            const { selection } = ed.state;
                            const { $from } = selection;
                            const text = $from.parent.textContent;
                            if (text.startsWith('[CHAR:')) {
                                event.preventDefault();
                                const pos = $from.after();
                                ed.chain()
                                    .insertContentAt(pos, '<p>/</p>')
                                    .focus(pos + 2) // inside the paragraph after /
                                    .run();
                                return true;
                            }
                        }

                        if (onKeyDown) {
                            onKeyDown(event as unknown as React.KeyboardEvent<Element>);
                        }
                        if (event.defaultPrevented) {
                            return true;
                        }
                        return false;
                    }
                },
                onUpdate: ({ editor: currentEd }) => {
                    if (onUpdate) {
                        const rawText = currentEd.getText();
                        const normalizedText = cleanAndNormalizeText(rawText);
                        onUpdate(normalizedText);
                    }
                },
                onFocus: () => {
                    onFocus?.();
                },
                onBlur: () => {
                    onBlur?.();
                },
            });

            if (isCancelled) {
                if (provider) provider.destroy();
                if (ydoc) ydoc.destroy();
                ed.destroy();
                return;
            }

            setEditor(ed);
        }

        init();

        return () => {
            isCancelled = true;
            if (provider) provider.destroy();
            if (ydoc) ydoc.destroy();
            if (ed) ed.destroy();
        };
    }, [collectionPath]);

    // Manter a propriedade editable reativa
    useEffect(() => {
        if (editor) {
            editor.setEditable(!disabled);
        }
    }, [editor, disabled]);

    if (!editor) {
        return (
            <textarea
                ref={dummyRef}
                value={dummyValue}
                onChange={handleDummyChange}
                placeholder={placeholder}
                disabled={disabled}
                className={cn(
                    "w-full bg-transparent resize-none overflow-hidden focus:outline-none transition-all duration-200 min-h-[40px] leading-relaxed",
                    className
                )}
                id={id}
                onFocus={onFocus}
                onBlur={onBlur}
                onKeyDown={onKeyDown}
                rows={1}
            />
        );
    }

    return (
        <div className="relative w-full">
            <EditorContent editor={editor} />

            {/* Slash Menu command palette dropdown */}
            {slashMenu.visible && slashMenu.options.length > 0 && (
                <div 
                    className="absolute bg-neutral-950/95 backdrop-blur-md border border-white/10 rounded-lg shadow-2xl py-1 z-50 w-64 max-h-60 overflow-y-auto"
                    style={{ 
                        top: `${slashMenu.y}px`, 
                        left: `${slashMenu.x}px` 
                    }}
                >
                    {slashMenu.options.map((opt, idx) => (
                        <button
                            key={idx}
                            type="button"
                            onClick={() => opt.action()}
                            className={cn(
                                "w-full text-left px-3 py-1.5 text-[11px] transition-colors flex flex-col gap-0.5",
                                idx === slashMenu.activeIndex 
                                    ? "bg-white/10 text-white font-medium" 
                                    : "text-white/60 hover:bg-white/5 hover:text-white"
                            )}
                        >
                            <span>{opt.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
