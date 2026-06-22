"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useScriptStore } from "../../store/useScriptStore";

interface AutoResizeTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    value: string;
}

export function AutoResizeTextarea({ value, className, ...props }: AutoResizeTextareaProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const { focusedFieldId, setFocusedFieldId } = useScriptStore();

    useEffect(() => {
        if (props.id && focusedFieldId === props.id && textareaRef.current) {
            textareaRef.current.focus();
            setFocusedFieldId(null);
        }
    }, [props.id, focusedFieldId, setFocusedFieldId]);

    const adjustHeight = () => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = "auto";
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    };

    useEffect(() => {
        adjustHeight();
    }, [value]);

    return (
        <textarea
            ref={textareaRef}
            value={value}
            className={cn(
                "w-full bg-transparent resize-none overflow-hidden focus:outline-none transition-all duration-200 min-h-[40px] leading-relaxed",
                className
            )}
            rows={1}
            {...props}
        />
    );
}
