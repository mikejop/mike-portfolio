import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ConfirmState {
    show: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDangerous?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

interface AppState {
    currentApp: string | null;
    hasSeenCloseTooltip: boolean;
    isMaximized: boolean;
    isProjectSidebarOpen: boolean;
    isTransitioning: boolean;
    showLogoutConfirm: boolean;
    isLoggingOut: boolean;
    confirmDialog: ConfirmState | null;
    appBackHandler: (() => void) | null;
    appTitle: string | null;
    manualMaximizeDashboard: boolean | null;
    manualMaximizeEditor: boolean | null;
    setCurrentApp: (appId: string | null) => void;
    setHasSeenCloseTooltip: (seen: boolean) => void;
    setIsTransitioning: (val: boolean) => void;
    setShowLogoutConfirm: (val: boolean) => void;
    setIsLoggingOut: (val: boolean) => void;
    setAppBackHandler: (handler: (() => void) | null) => void;
    setAppTitle: (title: string | null) => void;
    requestConfirm: (title: string, message: string, confirmText?: string, cancelText?: string, isDangerous?: boolean) => Promise<boolean>;
    toggleMaximized: () => void;
    setIsMaximized: (val: boolean) => void;
    applyMaximizeState: (isEditor: boolean) => void;
    toggleProjectSidebar: () => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            currentApp: null,
            hasSeenCloseTooltip: false,
            isMaximized: false,
            isProjectSidebarOpen: false,
            isTransitioning: false,
            showLogoutConfirm: false,
            isLoggingOut: false,
            confirmDialog: null,
            appBackHandler: null,
            appTitle: null,
            manualMaximizeDashboard: null,
            manualMaximizeEditor: null,
            setCurrentApp: (appId) => set({ currentApp: appId }),
            setHasSeenCloseTooltip: (seen) => set({ hasSeenCloseTooltip: seen }),
            setIsTransitioning: (val) => set({ isTransitioning: val }),
            setShowLogoutConfirm: (val) => set({ showLogoutConfirm: val }),
            setIsLoggingOut: (val) => set({ isLoggingOut: val }),
            setAppBackHandler: (handler) => set({ appBackHandler: handler }),
            setAppTitle: (title) => set({ appTitle: title }),
            requestConfirm: (title, message, confirmText = "Confirmar", cancelText = "Cancelar", isDangerous = true) => {
                return new Promise((resolve) => {
                    set({
                        confirmDialog: {
                            show: true,
                            title,
                            message,
                            confirmText,
                            cancelText,
                            isDangerous,
                            onConfirm: () => {
                                set({ confirmDialog: null });
                                resolve(true);
                            },
                            onCancel: () => {
                                set({ confirmDialog: null });
                                resolve(false);
                            }
                        }
                    });
                });
            },
            toggleMaximized: () => set((state) => {
                const nextVal = !state.isMaximized;
                if (typeof window !== 'undefined') {
                    const isEditor = window.location.pathname.includes('/editor');
                    if (isEditor) {
                        return { 
                            isMaximized: nextVal,
                            manualMaximizeEditor: nextVal
                        };
                    } else {
                        return { 
                            isMaximized: nextVal,
                            manualMaximizeDashboard: nextVal
                        };
                    }
                }
                return { isMaximized: nextVal };
            }),
            setIsMaximized: (val) => set({ isMaximized: val }),
            applyMaximizeState: (isEditor) => set((state) => {
                const cached = isEditor ? state.manualMaximizeEditor : state.manualMaximizeDashboard;
                if (cached !== null) {
                    return { isMaximized: cached };
                }
                return { isMaximized: isEditor };
            }),
            toggleProjectSidebar: () => set((state) => ({ isProjectSidebarOpen: !state.isProjectSidebarOpen })),
        }),
        {
            name: 'dojo-app-store',
            partialize: (state) => ({ 
                hasSeenCloseTooltip: state.hasSeenCloseTooltip,
                isProjectSidebarOpen: state.isProjectSidebarOpen,
                isMaximized: state.isMaximized,
                manualMaximizeDashboard: state.manualMaximizeDashboard,
                manualMaximizeEditor: state.manualMaximizeEditor,
            }),
        }
    )
);
