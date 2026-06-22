import { ToolFeature } from "./tools.types";

export const toolsRegistry: ToolFeature[] = [
    {
        id: "pricing-editor",
        name: "Precificação",
        description: "Calcule quanto cobrar por trabalhos audiovisuais.",
        icon: "calculator",
        route: "/tools/pricing-editor",
        category: "Financeiro",
        version: "1.0.0-rc.4",
        phase: "rc",
        color: "#10b981", // emerald-500
        iconPath: "/icons/apps/Pricing Editor.svg"
    },
    {
        id: "budget-editor",
        name: "Editor de Orçamento",
        description: "Crie e gerencie orçamentos de produção.",
        icon: "wallet",
        route: "/tools/budget-editor",
        category: "Financeiro",
        version: "1.0.0-rc.3",
        phase: "rc",
        color: "#3b82f6", // blue-500
        iconPath: "/icons/apps/Budget.svg"
    },
    {
        id: "script-editor",
        name: "Roteiro AV",
        description: "Escreva e formate roteiros audiovisuais.",
        icon: "file-text",
        route: "/tools/script-editor",
        category: "Criatividade",
        version: "0.2.0-alpha.4",
        phase: "alpha",
        color: "#f59e0b", // amber-500
        iconPath: "/icons/apps/AV Script.svg"
    },
    {
        id: "color-extractor",
        name: "Extrair Paleta de Cor",
        description: "Extraia paletas de cores de uma imagem.",
        icon: "pipette",
        route: "/tools/color-extractor",
        category: "Utilitários",
        color: "#ec4899", // pink-500
        isComingSoon: true
    },
    {
        id: "palette-creator",
        name: "Criador de Paleta de Cor",
        description: "Crie e ajuste suas próprias paletas de cores manualmente.",
        icon: "palette",
        route: "/tools/palette-creator",
        category: "Utilitários",
        color: "#8b5cf6", // violet-500
        isComingSoon: true
    },
    {
        id: "content-planner",
        name: "Planejador de Conteúdo",
        description: "Planeje sua estrutura de conteúdo e cronograma.",
        icon: "calendar-days",
        route: "/tools/content-planner",
        category: "Planejamento",
        color: "#0ea5e9", // sky-500
        isComingSoon: true
    },
    {
        id: "light-map",
        name: "Mapa de Luz",
        description: "Planeje a iluminação de suas cenas.",
        icon: "sun",
        route: "/tools/light-map",
        category: "Criatividade",
        version: "0.1.0-alpha.1",
        phase: "alpha",
        color: "#fbbf24", // amber-400
        iconPath: "/icons/apps/Light Map.svg"
    },
    {
        id: "storyboard",
        name: "Storyboard",
        description: "Visualize a sequência de suas cenas.",
        icon: "image",
        route: "/tools/storyboard",
        category: "Criatividade",
        color: "#818cf8", // indigo-400
        isComingSoon: true
    },
    {
        id: "moodboard",
        name: "Moodboard",
        description: "Crie painéis semânticos e visuais para seus projetos.",
        icon: "clapperboard",
        route: "/tools/moodboard",
        category: "Criatividade",
        color: "#94a3b8", // slate-400
        isComingSoon: true
    },
    {
        id: "copy-writing",
        name: "Copy Writing",
        description: "Crie textos persuasivos e de alta conversão.",
        icon: "pen-tool",
        route: "/tools/copy-writing",
        category: "Criatividade",
        color: "#fb7185", // rose-400
        isComingSoon: true
    }
];
