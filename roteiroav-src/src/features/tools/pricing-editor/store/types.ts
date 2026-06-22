export type ProfessionType = "videomaker" | "especialista" | "fee-mensal" | null;
export type VideomakerJobType = "publicidade" | "conteudos-web" | "casamentos" | "eventos" | null;
export type RegionType = "capital" | "interior";
export type DurationUnit = "hora" | "diaria" | "semana" | "mes";

export interface UserEquipment {
    id: string;
    name: string;
    category: string;
    valueBRL: number;
    valueUSD?: number;
    valueEUR?: number;
    currency?: 'BRL' | 'USD' | 'EUR';
    selected: boolean;
    quantity: number;
    predefinedId?: string;
}

export interface SoftwareExpense {
    id: string;
    name: string;
    monthlyCost: number;
}

export interface Installment {
    id: string;
    description: string;
    value: number;
    totalInstallments: number;
    startMonth: number; // 1-12
    startYear: number;
}

export interface UserExpenses {
    aluguel: number;
    alimentacao: number;
    transporte: number;
    lazer: number;
    internet: number;
    agua: number;
    luz: number;
    telefone: number;
    saude: number;
    impostoPercent: number;
    lucroPercent: number;
    investimentoPercent: number;
    divulgacaoPercent: number; // Added: marketing/divulgação percentage
    softwares: SoftwareExpense[]; // Added: dynamic software list
    installments: Installment[]; // Added: dynamic installments list
}

export interface CalculationResult {
    subtotal: number;
    imposto: number;
    desconto: number;
    valorFinal: number;
    mediaRegional: number;
    diferencaPercent: number; // +/- compared to regional average
    custoBaseUnidade: number;
    valorMercado: number;
    equipamentoTotal: number;
    lucroReal: number; // Final real profit (Salary Surplus + Markup)
    lucroMarkup: number; // Only the percentage-based addition for the price layers
    valorDivulgacao: number; // Amount to hold for marketing
    valorInvestimento: number; // Amount to hold for reinvestment
    lucroBruto: number; // Added: Revenue - Direct Costs
    margemLucro: number; // Added: Profit Margin %
    custoFixoMensal: number; // Added: Rent + Basic bills
    custoVariavelMensal: number; // Added: Softwares + Installments
}

export interface PricingState {
    // Step 1
    professionType: ProfessionType;
    jobType: VideomakerJobType;
    // Step 2
    stateUF: string;
    regionType: RegionType;
    // Step 3
    experienceLevel: number;
    // Step 4
    selectedEquipment: string[]; // for default list
    userEquipments: UserEquipment[]; // for user's personal list
    equipmentChargePercent: number;
    // Step 5
    durationUnit: DurationUnit;
    durationQty: number;
    // Adjustments
    impostoPercent: number;
    descontoPercent: number;
    // Expenses
    expenses: UserExpenses;
    hasExpensesSaved: boolean;
    // Result
    result: CalculationResult | null;
    showExpensesModal: boolean;
    showEquipmentModal: boolean;
    usdRate: number;
    eurRate: number;
}

export interface PricingActions {
    setProfession: (type: ProfessionType) => void;
    setJobType: (type: VideomakerJobType) => void;
    setStateUF: (uf: string) => void;
    setRegionType: (type: RegionType) => void;
    setExperience: (level: number) => void;
    toggleEquipment: (equipId: string) => void;
    setDurationUnit: (unit: DurationUnit) => void;
    setDurationQty: (qty: number) => void;
    setImpostoPercent: (val: number) => void;
    setDescontoPercent: (val: number) => void;
    setExpenses: (expenses: UserExpenses) => void;
    setShowExpensesModal: (show: boolean) => void;
    setShowEquipmentModal: (show: boolean) => void;
    setUserEquipments: (equips: UserEquipment[]) => void;
    setEquipmentChargePercent: (percent: number) => void;
    toggleUserEquipment: (id: string) => void;
    updateUsdRate: () => Promise<void>;
    calculate: () => void;
    saveToFirestore: () => Promise<void>;
    setPricingConfig: (config: Partial<PricingState>) => void;
    reset: () => void;
}

export type PricingStore = PricingState & PricingActions;

export const defaultExpenses: UserExpenses = {
    aluguel: 0,
    alimentacao: 0,
    transporte: 0,
    lazer: 0,
    internet: 0,
    agua: 0,
    luz: 0,
    telefone: 0,
    saude: 0,
    impostoPercent: 6,
    lucroPercent: 30,
    investimentoPercent: 10,
    divulgacaoPercent: 5, // Default 5%
    softwares: [],
    installments: [],
};

export const initialPricingState: PricingState = {
    professionType: "videomaker",
    jobType: null,
    stateUF: "SP",
    regionType: "capital",
    experienceLevel: 5,
    selectedEquipment: [],
    userEquipments: [],
    equipmentChargePercent: 2, // Default 2% per job
    durationUnit: "diaria",
    durationQty: 1,
    impostoPercent: 6,
    descontoPercent: 0,
    expenses: defaultExpenses,
    hasExpensesSaved: false,
    result: null,
    showExpensesModal: false,
    showEquipmentModal: false,
    usdRate: 5.50,
    eurRate: 6.00,
};
