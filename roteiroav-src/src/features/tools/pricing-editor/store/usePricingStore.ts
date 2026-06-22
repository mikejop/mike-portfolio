import { create } from 'zustand';
import { PricingStore, initialPricingState, defaultExpenses, PricingState } from './types';
import {
    brazilianStates,
    jobTypeMultipliers,
    unitsPerMonth,
} from '../data/marketData';
import { saveUserDocument } from '@/lib/firestore';
import { memoryCache } from '@/lib/cache';

export const usePricingStore = create<PricingStore>()((set, get) => ({
    ...initialPricingState,

    saveToFirestore: async () => {
        const state = get();
        // We save the configuration/expenses and current selections
        const dataToSave = {
            expenses: state.expenses,
            userEquipments: state.userEquipments,
            equipmentChargePercent: state.equipmentChargePercent,
            professionType: state.professionType,
            experienceLevel: state.experienceLevel,
            stateUF: state.stateUF,
            selectedEquipment: state.selectedEquipment,
        };

        // Save to 'pricing' collection under the user, with 'config' as the doc ID
        await saveUserDocument('pricing', 'config', dataToSave);
    },

    setPricingConfig: (config: Partial<PricingState>) => {
        set((state) => ({ ...state, ...config }));
        get().calculate();
    },

    setProfession: (type) => {
        set({ professionType: type, result: null });
        get().calculate();
        get().saveToFirestore();
    },
    setJobType: (type) => {
        set({ jobType: type, result: null });
        get().calculate();
        get().saveToFirestore();
    },
    setStateUF: (uf) => {
        set({ stateUF: uf, result: null });
        get().calculate();
    },
    setRegionType: (type) => {
        set({ regionType: type, result: null });
        get().calculate();
    },
    setExperience: (level) => {
        // Profit Display Refinements
        // Refined the calculation and presentation of profit to distinguish between client-facing markup and internal gains:
        // - Client Price: The total price to the client now includes the market rate and only the markup percentage. The "salary surplus" is no longer added as an extra layer.
        // - Real Profit: Added a "Lucro Real" metric in the summary panel. This calculates the videomaker's true gain: (Market Rate - Personal Cost) + Markup - Discount.
        // - UI Tooltips: Updated total summary tooltips to explain these revised metrics.

        // Base de Cálculo do Lucro
        // Standardized how percentages are applied to the budget:
        // - Base do Markup: Agora o lucro (markup), reinvestimento e divulgação são calculados sobre o **Subtotal Bruto** (Mão de Obra + Equipamentos), antes de qualquer desconto. Isso garante que o lucro planejado seja preservado mesmo ao oferecer descontos no valor final.
        set({ experienceLevel: level, result: null });
        get().calculate();
        get().saveToFirestore();
    },
    toggleEquipment: (equipId) => {
        set((state) => ({
            selectedEquipment: state.selectedEquipment.includes(equipId)
                ? state.selectedEquipment.filter((id) => id !== equipId)
                : [...state.selectedEquipment, equipId],
            result: null,
        }));
        get().calculate();
        get().saveToFirestore();
    },
    setDurationUnit: (unit) => {
        set({ durationUnit: unit, result: null });
        get().calculate();
    },
    setDurationQty: (qty) => {
        set({ durationQty: qty, result: null });
        get().calculate();
    },
    setImpostoPercent: (val) => {
        set({ impostoPercent: val, result: null });
        get().calculate();
    },
    setDescontoPercent: (val) => {
        set({ descontoPercent: val, result: null });
        get().calculate();
    },
    setExpenses: (expenses) => {
        set({ expenses, hasExpensesSaved: true, result: null });
        get().calculate();
        get().saveToFirestore();
    },
    setShowExpensesModal: (show) => set({ showExpensesModal: show }),
    setShowEquipmentModal: (show) => set({ showEquipmentModal: show }),
    setUserEquipments: (equips) => {
        const processed = equips.map(e => ({ ...e, quantity: e.quantity || 1 }));
        set({ userEquipments: processed, result: null });
        get().calculate();
    },
    setEquipmentChargePercent: (percent) => {
        set({ equipmentChargePercent: percent, result: null });
        get().calculate();
        get().saveToFirestore();
    },
    toggleUserEquipment: (id) => {
        set((state) => ({
            userEquipments: state.userEquipments.map(e => e.id === id ? { ...e, selected: !e.selected } : e),
            result: null
        }));
        get().calculate();
    },

    updateUsdRate: async () => {
        try {
            // Check cache first (5 minutes TTL)
            const cachedRates = memoryCache.get<{ usd: number; eur: number }>('exchange_rates');
            if (cachedRates) {
                console.log("[PricingStore] Using cached exchange rates:", cachedRates);
                set({ usdRate: cachedRates.usd, eurRate: cachedRates.eur });
                get().calculate();
                return;
            }

            console.log("[PricingStore] Updating exchange rates from API...");

            // Try AwesomeAPI for real-time commercial USD and EUR
            const response = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL');
            const data = await response.json();

            if (data) {
                let usdRate = get().usdRate;
                let eurRate = get().eurRate;

                if (data.USDBRL) {
                    usdRate = parseFloat(data.USDBRL.bid);
                    console.log(`[PricingStore] Live USD: R$ ${usdRate}`);
                }
                if (data.EURBRL) {
                    eurRate = parseFloat(data.EURBRL.bid);
                    console.log(`[PricingStore] Live EUR: R$ ${eurRate}`);
                }

                set({ usdRate, eurRate });
                memoryCache.set('exchange_rates', { usd: usdRate, eur: eurRate }, 5 * 60 * 1000); // 5 min
                get().calculate();
                if (data.USDBRL) return; 
            }
        } catch (e) {
            console.warn("[PricingStore] Live API failed, falling back to BrasilAPI...", e);
        }

        // Fallback to BrasilAPI (USD Only)
        const formatDate = (date: Date) => {
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const year = date.getFullYear();
            return `${month}-${day}-${year}`;
        };

        let daysToTry = 5;
        let currentDate = new Date();

        while (daysToTry > 0) {
            const dateStr = formatDate(currentDate);
            try {
                const response = await fetch(`https://brasilapi.com.br/api/cambio/v1/cotacao/USD/${dateStr}`);
                const data = await response.json();

                if (data.cotacoes && data.cotacoes.length > 0) {
                    const fechamento = data.cotacoes.find((c: any) => c.tipo_boletim === "FECHAMENTO PTAX") || data.cotacoes[data.cotacoes.length - 1];
                    const rate = fechamento.cotacao_venda;
                    console.log(`[PricingStore] Ptax rate (${dateStr}): R$ ${rate}`);
                    set({ usdRate: rate });
                    get().calculate();
                    return;
                }
            } catch (error) {
                console.error(`Failed to fetch rate for ${dateStr}`, error);
            }
            currentDate.setDate(currentDate.getDate() - 1);
            daysToTry--;
        }
    },

    calculate: () => {
        const state = get();
        const {
            professionType, jobType, stateUF, regionType, experienceLevel,
            userEquipments, equipmentChargePercent,
            durationUnit, durationQty, impostoPercent, descontoPercent, expenses, usdRate, eurRate
        } = state;

        // RULE: Result only appears when job type is selected
        if (!jobType) {
            set({ result: null });
            return;
        }

        const totalSoftwaresMensal = (expenses.softwares || []).reduce((sum, s) => sum + s.monthlyCost, 0);

        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        const totalInstallmentsMensal = (expenses.installments || []).reduce((sum, inst) => {
            const monthsDiff = (currentYear - inst.startYear) * 12 + (currentMonth - inst.startMonth);
            const isActive = monthsDiff >= 0 && monthsDiff < inst.totalInstallments;
            return isActive ? sum + inst.value : sum;
        }, 0);

        const custosFixos =
            expenses.aluguel +
            expenses.internet +
            totalSoftwaresMensal +
            totalInstallmentsMensal;

        const custosVariaveis =
            expenses.alimentacao +
            expenses.transporte +
            expenses.lazer +
            expenses.agua +
            expenses.luz +
            expenses.telefone +
            expenses.saude;

        const totalExpensesMensal = custosFixos + custosVariaveis;

        // Custo Base proporcional (aligned with 22 working days/month as shown in sidebar)
        const baseCustoMensalTotal = totalExpensesMensal;

        const unitConversion: Record<string, number> = {
            hora: 1 / (22 * 8),
            diaria: 1 / 22,
            semana: 1 / 4,
            mes: 1,
        };
        const personalCostTotalJob = baseCustoMensalTotal * (unitConversion[durationUnit] || 1) * durationQty;

        // 2. Equipment fee (Sum of individual fees: Val * % * Qty)
        let totalEquipJobFee = 0;
        if (userEquipments.length > 0) {
            totalEquipJobFee = userEquipments
                .filter(e => e.selected)
                .reduce((sum, e) => {
                    const qty = e.quantity || 1;
                    // Assuming usePricingStore is accessible or imported if needed for eurRate
                    const itemBRL = e.predefinedId && e.valueUSD ? (e.valueUSD * usdRate * 1.6) : (e.valueUSD ? (e.valueUSD * usdRate) : (e.valueEUR ? e.valueEUR * (eurRate || 6) : e.valueBRL));
                    const itemFee = itemBRL * (equipmentChargePercent / 100) * qty;
                    return sum + itemFee;
                }, 0);
        }

        // 3. Primary Labor from PDF Market Rates
        const stateData = brazilianStates.find((s) => s.uf === stateUF);
        let maoDeObraTotalJob = 0;
        let mediaRegionalValue = 0; // Pure PDF value for comparison

        if (stateData) {
            const rates = regionType === "capital" ? stateData.capital : stateData.interior;
            const { iniciante, medio, senior, master } = rates;
            let baseMarketRate = iniciante;

            // LINEAR INTERPOLATION LOGIC
            if (jobType === 'conteudos-web' || jobType === 'publicidade') {
                // Specialized curve for Web Content and Publicidade
                const valAt0 = iniciante;
                const valAt5 = valAt0 * 2; // Doubles
                const valAt10 = valAt5 * 1.25; // +25%
                const valAt15 = valAt10 * 1.125; // +12.5%

                if (experienceLevel <= 5) {
                    const ratio = experienceLevel / 5;
                    baseMarketRate = valAt0 + (valAt5 - valAt0) * ratio;
                } else if (experienceLevel <= 10) {
                    const ratio = (experienceLevel - 5) / 5;
                    baseMarketRate = valAt5 + (valAt10 - valAt5) * ratio;
                } else if (experienceLevel <= 15) {
                    const ratio = (experienceLevel - 10) / 5;
                    baseMarketRate = valAt10 + (valAt15 - valAt10) * ratio;
                } else {
                    baseMarketRate = valAt15;
                }
            } else {
                // Standard curve for all other jobs (Casamentos, Eventos, etc.)
                if (experienceLevel <= 5) {
                    // 0 to 5: Interpolate between iniciante and medio (medio at 5)
                    const ratio = experienceLevel / 5;
                    baseMarketRate = iniciante + (medio - iniciante) * ratio;
                } else if (experienceLevel <= 10) {
                    // 5 to 10: Interpolate between medio and senior (senior at 10)
                    const ratio = (experienceLevel - 5) / (10 - 5);
                    baseMarketRate = medio + (senior - medio) * ratio;
                } else {
                    // 10 to 15+: Cap at senior value
                    baseMarketRate = senior;
                }
            }

            const marketConversion: Record<string, number> = {
                hora: 1 / 8,
                diaria: 1,
                semana: 5,
                mes: 22,
            };

            // 3b. PRIMARY DATA
            const baseMaoDeObra = baseMarketRate * (marketConversion[durationUnit] || 1) * durationQty;
            const marketMaoDeObra = baseMaoDeObra * (jobType ? (jobTypeMultipliers[jobType] || 1) : 1);
            const equipFee = totalEquipJobFee;

            // 4. SUBTOTAl (Breakdown Starting Point)
            const subtotalVisible = marketMaoDeObra + equipFee;
            const desconto = subtotalVisible * (descontoPercent / 100);
            const subtotalLiquido = subtotalVisible - desconto;

            // 5. PERCENTAGE ADDITIONS (Based on Subtotal before discount)
            const valorMarkup = subtotalVisible * (expenses.lucroPercent / 100);
            const valorInvestimento = subtotalVisible * (expenses.investimentoPercent / 100);
            const valorDivulgacao = subtotalVisible * (expenses.divulgacaoPercent / 100);

            // 6. LUCRO (Literal user formula: Salary Surplus + Markup)
            const lucroDoSalario = marketMaoDeObra - personalCostTotalJob;
            const lucroNoBreakdown = valorMarkup; // ONLY Markup goes into the client's visible price layers now

            // 7. TOTAL (Literal user sum: Subtotal + Divulg + Reinvest + Lucro + Imposto - Desconto)
            const subtotalWithAdditions = subtotalLiquido + valorDivulgacao + valorInvestimento + lucroNoBreakdown;
            const imposto = subtotalWithAdditions * (impostoPercent / 100);
            const valorFinal = subtotalWithAdditions + imposto;

            // 8. FINAL RESULTS
            const lucroBrutoRes = marketMaoDeObra + valorMarkup - desconto;
            const lucroRealRes = lucroBrutoRes - personalCostTotalJob; // (Market - Cost) + Markup - Discount

            const diferencaPercent = mediaRegionalValue > 0 ? ((baseMaoDeObra - mediaRegionalValue) / mediaRegionalValue) * 100 : 0;

            set({
                result: {
                    subtotal: subtotalVisible,
                    imposto,
                    desconto,
                    valorFinal: valorFinal,
                    mediaRegional: mediaRegionalValue,
                    diferencaPercent,
                    custoBaseUnidade: personalCostTotalJob / durationQty,
                    valorMercado: marketMaoDeObra, // Now includes the multiplier (75% for Publicidade)
                    equipamentoTotal: equipFee,
                    lucroReal: lucroRealRes,
                    lucroMarkup: valorMarkup,
                    valorDivulgacao,
                    valorInvestimento,
                    lucroBruto: lucroBrutoRes,
                    margemLucro: (() => {
                        if (valorFinal <= 0) return 0;
                        return Math.round((lucroRealRes / valorFinal) * 100 * 100) / 100;
                    })(),
                    custoFixoMensal: custosFixos,
                    custoVariavelMensal: custosVariaveis,
                },
            });
        }
    },

    reset: () => {
        set({ ...initialPricingState, expenses: get().expenses, hasExpensesSaved: get().hasExpensesSaved, userEquipments: get().userEquipments, equipmentChargePercent: get().equipmentChargePercent });
        get().calculate();
    }
}));

