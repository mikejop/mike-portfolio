import { useEffect, useState, useRef } from "react";
import { Editor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import Placeholder from "@tiptap/extension-placeholder";
import * as Y from "yjs";
import { createFirestoreProvider } from "../../services/firestoreYjsProvider";
import { cn } from "@/lib/utils";
import { useScriptStore } from "../../store/useScriptStore";

interface CollaborativeEditorProps {
    collectionPath: string;
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

export function CollaborativeEditor({
    collectionPath,
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

    // Keep dummy value in sync with external updates if the editor isn't loaded yet
    useEffect(() => {
        if (!editor) {
            setDummyValue(value);
        }
    }, [value, editor]);

    // Handle focus and state transitions when the real editor loads
    useEffect(() => {
        if (editor) {
            // Check if the dummy textarea currently has focus
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
        onUpdate?.(e.target.value);
        adjustDummyHeight();
    };

    useEffect(() => {
        let isCancelled = false;
        let provider: any = null;
        let ydoc: Y.Doc | null = null;
        let ed: Editor | null = null;

        async function init() {
            ydoc = new Y.Doc();
            try {
                provider = await createFirestoreProvider(ydoc, collectionPath);
            } catch (err) {
                console.error("Failed to initialize Yjs provider:", err);
            }

            if (isCancelled) {
                if (provider) provider.destroy();
                ydoc.destroy();
                return;
            }

            const fragment = ydoc.getXmlFragment('default');
            ed = new Editor({
                extensions: [
                    StarterKit,
                    Collaboration.configure({ fragment }),
                    Placeholder.configure({
                        placeholder,
                        emptyEditorClass: "before:content-[attr(data-placeholder)] before:text-white/10 before:float-left before:h-0 before:pointer-events-none",
                    }),
                ],
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
                        onUpdate(currentEd.getText());
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
                ydoc.destroy();
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

    return <EditorContent editor={editor} />;
}
