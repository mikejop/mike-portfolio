export interface BudgetItem {
    id: string;
    desc: string;
    cat: string;
    unit: string;
    qty: number;
    val: number;
    total: number;
}

export type BudgetSectionKey = "pre" | "live" | "pos" | "3d" | "desp";

export interface BudgetStoreState {
    meta: {
        id: string;
        num: string;
        data: string;
        validade: string;
        status?: "Pendente" | "Aprovado" | "Recusado" | "Expirado";
    };
    prestador: {
        nome: string;
        cnpj: string;
        end: string;
        cep: string;
        resp: string;
        tel: string;
        telCountry: string;
        email: string;
        site: string;
        im: string;
    };
    cliente: {
        nome: string;
        cnpj: string;
        end: string;
        cep: string;
        resp: string;
        tel: string;
        telCountry: string;
        email: string;
    };
    projeto: {
        titulo: string;
        camp: string;
        tipo: string;
        modal: string;
        dur: string;
        fmt: string;
        plat: string;
        brief: string;
        ini: string;
        entr: string;
        dias: string;
        locais: string[];
        idioma: string;
        refs: string[];
    };
    financeiro: {
        descPct: string;
        issPct: string;
    };
    condicoes: {
        pag: string[];
        mod: string[];
        val: string;
        prazo: string;
        rev: string;
        dir: string;
        banco: string;
        obs: string;
    };
    itens: Record<BudgetSectionKey, BudgetItem[]>;
    savedBudgets: BudgetStoreState[];
}

export interface BudgetStoreActions {
    updateField: (section: keyof BudgetStoreState, field: string, value: any) => void;
    addItem: (section: BudgetSectionKey, item?: Partial<BudgetItem>) => void;
    removeItem: (section: BudgetSectionKey, itemId: string) => void;
    updateItem: (section: BudgetSectionKey, itemId: string, field: keyof BudgetItem, value: any) => void;
    clearAll: () => void;
    importHiro: (data: Partial<BudgetStoreState>) => void;
    saveBudget: () => void;
    loadBudget: (id: string) => void;
    deleteBudget: (id: string) => void;
    createNewBudget: () => void;
    saveToFirestore: () => Promise<void>;
    loadBudgetFromFirestore: (id: string) => Promise<boolean>;
    createEmptyBudget: () => Promise<string>;
}

export type BudgetStore = BudgetStoreState & BudgetStoreActions;

export const initialState: BudgetStoreState = {
    meta: { id: "", num: "001", data: "", validade: "15", status: "Pendente" },
    prestador: { nome: "", cnpj: "", end: "", cep: "", resp: "", tel: "", telCountry: "BR", email: "", site: "", im: "" },
    cliente: { nome: "", cnpj: "", end: "", cep: "", resp: "", tel: "", telCountry: "BR", email: "" },
    projeto: { titulo: "", camp: "", tipo: "", modal: "", dur: "", fmt: "", plat: "", brief: "", ini: "", entr: "", dias: "", locais: [""], idioma: "Português", refs: [""] },
    financeiro: { descPct: "0", issPct: "6" },
    condicoes: { pag: [], mod: [], val: "", prazo: "", rev: "", dir: "", banco: "", obs: "" },
    itens: { pre: [], live: [], pos: [], "3d": [], desp: [] },
    savedBudgets: []
};
