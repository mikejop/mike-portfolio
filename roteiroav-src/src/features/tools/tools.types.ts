export interface ToolFeature {
    id: string;
    name: string;
    description: string;
    icon: string;
    route: string;
    category: 'Financeiro' | 'Criatividade' | 'Utilitários' | 'Planejamento';
    version?: string; // Specific app version
    phase?: 'alpha' | 'beta' | 'rc' | 'stable'; // Specific app phase
    color?: string; // App Icon branding color
    iconPath?: string; // Path to custom SVG icon
    isComingSoon?: boolean; // If true, the app is disabled and shows "Em Breve"
}
