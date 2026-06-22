import { create } from 'zustand';
import { BudgetStore, BudgetItem, BudgetSectionKey, initialState, BudgetStoreState } from './types';
import { fetchInternetDate, generateBudgetNumber } from '../utils/budgetUtils';
import { saveUserDocument, deleteUserDocument, getUserDocument } from '@/lib/firestore';

const generateId = () => Math.random().toString(36).substr(2, 9);

export interface BudgetStoreExtended extends BudgetStore {
    setBudgets: (budgets: BudgetStoreState[]) => void;
}

export const useBudgetStore = create<BudgetStoreExtended>()((set, get) => ({
    ...initialState,

    setBudgets: (loadedBudgets: BudgetStoreState[]) => {
        set({ savedBudgets: loadedBudgets });
    },

    saveToFirestore: async () => {
        const state = get();
        const currentBudget: BudgetStoreState = {
            meta: state.meta,
            prestador: state.prestador,
            cliente: state.cliente,
            projeto: state.projeto,
            financeiro: state.financeiro,
            condicoes: state.condicoes,
            itens: state.itens,
            savedBudgets: [] // Not nested
        };

        if (state.meta.id) {
            await saveUserDocument('budgets', state.meta.id, currentBudget);
        }
    },

    updateField: (section, field, value) => {
        set((state) => {
            const newState = {
                ...state,
                [section]: {
                    ...(state[section] as Record<string, any>),
                    [field]: value
                }
            };

            // Auto-update budget number if client name or date changes
            if ((section === 'cliente' && field === 'nome') || (section === 'meta' && field === 'data')) {
                const clientName = newState.cliente.nome;
                const date = newState.meta.data;
                if (clientName && date) {
                    newState.meta.num = generateBudgetNumber(clientName, date);
                }
            }

            return newState;
        });

        // Auto-save to savedBudgets on every field update
        get().saveBudget();
        get().saveToFirestore();
    },

    addItem: (section: BudgetSectionKey, item?: Partial<BudgetItem>) => {
        const newItem: BudgetItem = {
            id: generateId(),
            desc: item?.desc || "",
            cat: item?.cat || "",
            unit: item?.unit || "Diária",
            qty: item?.qty || 1,
            val: item?.val || 0,
            total: (item?.qty || 1) * (item?.val || 0)
        };

        set((state) => ({
            itens: {
                ...state.itens,
                [section]: [...state.itens[section], newItem]
            }
        }));
        get().saveBudget();
        get().saveToFirestore();
    },

    removeItem: (section: BudgetSectionKey, itemId: string) => {
        set((state) => ({
            itens: {
                ...state.itens,
                [section]: state.itens[section].filter((i) => i.id !== itemId)
            }
        }));
        get().saveBudget();
        get().saveToFirestore();
    },

    updateItem: (section: BudgetSectionKey, itemId: string, field: keyof BudgetItem, value: any) => {
        set((state) => ({
            itens: {
                ...state.itens,
                [section]: state.itens[section].map((item) => {
                    if (item.id === itemId) {
                        const updatedItem = { ...item, [field]: value };
                        if (field === 'qty' || field === 'val') {
                            updatedItem.total = (Number(updatedItem.qty) || 0) * (Number(updatedItem.val) || 0);
                        }
                        return updatedItem;
                    }
                    return item;
                })
            }
        }));
        get().saveBudget();
        get().saveToFirestore();
    },

    clearAll: async () => {
        const date = await fetchInternetDate();
        set({
            ...initialState,
            meta: { ...initialState.meta, data: date, id: generateId() }
        });
        get().saveToFirestore();
    },

    importHiro: (data) => {
        set((state) => ({
            ...state,
            ...data
        }));
        get().saveBudget();
        get().saveToFirestore();
    },

    saveBudget: () => {
        const state = get();
        const currentBudget: BudgetStoreState = {
            meta: state.meta,
            prestador: state.prestador,
            cliente: state.cliente,
            projeto: state.projeto,
            financeiro: state.financeiro,
            condicoes: state.condicoes,
            itens: state.itens,
            savedBudgets: [] // Not nested
        };

        set((state) => {
            const existingIndex = state.savedBudgets.findIndex(b => b.meta.id === state.meta.id);
            let newSaved;
            if (existingIndex >= 0) {
                newSaved = [...state.savedBudgets];
                newSaved[existingIndex] = currentBudget;
            } else {
                newSaved = [...state.savedBudgets, currentBudget];
            }
            return { savedBudgets: newSaved };
        });
    },

    loadBudget: (id: string) => {
        const budget = get().savedBudgets.find(b => b.meta.id === id);
        if (budget) {
            set({
                meta: budget.meta,
                prestador: budget.prestador,
                cliente: budget.cliente,
                projeto: budget.projeto,
                financeiro: budget.financeiro,
                condicoes: budget.condicoes,
                itens: budget.itens
            });
        }
    },

    deleteBudget: async (id: string) => {
        // Optimistic UI
        set((state) => ({
            savedBudgets: state.savedBudgets.filter(b => b.meta.id !== id)
        }));

        // Firestore delete
        try {
            await deleteUserDocument('budgets', id);
        } catch (error) {
            console.error("Firestore delete failed:", error);
        }
    },

    createNewBudget: async () => {
        // Save current budget before creating new one
        if (get().meta.id) get().saveBudget();
        const date = await fetchInternetDate();
        const newId = generateId();
        set({
            ...initialState,
            meta: { ...initialState.meta, id: newId, data: date },
            savedBudgets: get().savedBudgets
        });
        get().saveBudget();
        get().saveToFirestore();
    },

    createEmptyBudget: async () => {
        const date = await fetchInternetDate();
        const newId = generateId();

        const emptyBudget: BudgetStoreState = {
            ...initialState,
            meta: { ...initialState.meta, id: newId, data: date }
        };

        // Salvar direto no Firestore sem alterar o estado atual
        // para não conflitar com o StrictMode/efeitos duplos.
        await saveUserDocument('budgets', newId, emptyBudget);

        return newId;
    },

    loadBudgetFromFirestore: async (id: string) => {
        try {
            const data = await getUserDocument('budgets', id);

            if (data) {
                // Remove createdAt/updatedAt/ownerId from the payload if they exist, 
                // keeping only BudgetStoreState properties
                const { createdAt, updatedAt, ownerId, ...budgetData } = data;

                set({
                    ...initialState, // Garante que tudo que faltar tenha valor default
                    ...(budgetData as Partial<BudgetStoreState>),
                    savedBudgets: get().savedBudgets
                });
                return true;
            }
            return false;
        } catch (error) {
            console.error("Erro ao carregar do Firestore:", error);
            return false;
        }
    }
}));

