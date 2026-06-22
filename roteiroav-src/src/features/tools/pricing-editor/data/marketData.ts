// Market data for audiovisual pricing in Brazil
// Values updated based on "Análise de Mercado Audiovisual Brasil 2024"

export interface Rates {
    iniciante: number;
    medio: number;
    senior: number;
    master: number;
}

export interface StateData {
    name: string;
    uf: string;
    capital: Rates;
    interior: Rates;
    interiorExamples?: string; // Metadata for UI help
}

export const brazilianStates: StateData[] = [
    {
        name: "São Paulo", uf: "SP",
        capital: { iniciante: 600, medio: 1000, senior: 1700, master: 2800 },
        interior: { iniciante: 480, medio: 800, senior: 1350, master: 2200 },
        interiorExamples: "Campinas, Santos, Ribeirão Preto, São José dos Campos"
    },
    {
        name: "Rio de Janeiro", uf: "RJ",
        capital: { iniciante: 550, medio: 900, senior: 1500, master: 2400 },
        interior: { iniciante: 420, medio: 720, senior: 1200, master: 1950 },
        interiorExamples: "Niterói, Petrópolis, Campos, Nova Iguaçu"
    },
    {
        name: "Distrito Federal", uf: "DF",
        capital: { iniciante: 500, medio: 850, senior: 1400, master: 2200 },
        interior: { iniciante: 400, medio: 680, senior: 1100, master: 1750 },
        interiorExamples: "Entorno (Águas Lindas, Valparaíso)"
    },
    {
        name: "Rio Grande do Sul", uf: "RS",
        capital: { iniciante: 480, medio: 780, senior: 1250, master: 2000 },
        interior: { iniciante: 380, medio: 620, senior: 1000, master: 1650 },
        interiorExamples: "Caxias do Sul, Pelotas, Canoas, Santa Maria"
    },
    {
        name: "Minas Gerais", uf: "MG",
        capital: { iniciante: 450, medio: 750, senior: 1200, master: 1900 },
        interior: { iniciante: 350, medio: 600, senior: 980, master: 1550 },
        interiorExamples: "Uberlândia, Juiz de Fora, BH região metr."
    },
    {
        name: "Paraná", uf: "PR",
        capital: { iniciante: 450, medio: 750, senior: 1200, master: 1850 },
        interior: { iniciante: 350, medio: 600, senior: 980, master: 1500 },
        interiorExamples: "Londrina, Maringá, Ponta Grossa, Foz"
    },
    {
        name: "Santa Catarina", uf: "SC",
        capital: { iniciante: 450, medio: 750, senior: 1200, master: 1850 },
        interior: { iniciante: 350, medio: 600, senior: 980, master: 1500 },
        interiorExamples: "Joinville, Blumenau, Chapecó, Criciúma"
    },
    {
        name: "Bahia", uf: "BA",
        capital: { iniciante: 450, medio: 700, senior: 1100, master: 1700 },
        interior: { iniciante: 350, medio: 580, senior: 920, master: 1450 },
        interiorExamples: "Feira de Santana, Vitória da Conq., Camaçari"
    },
    {
        name: "Pernambuco", uf: "PE",
        capital: { iniciante: 420, medio: 680, senior: 1100, master: 1700 },
        interior: { iniciante: 340, medio: 550, senior: 900, master: 1400 },
        interiorExamples: "Caruaru, Olinda, Jaboatão, Petrolina"
    },
    {
        name: "Ceará", uf: "CE",
        capital: { iniciante: 400, medio: 650, senior: 1050, master: 1600 },
        interior: { iniciante: 320, medio: 520, senior: 850, master: 1300 },
        interiorExamples: "Juazeiro do Norte, Sobral, Crato"
    },
    {
        name: "Mato Grosso", uf: "MT",
        capital: { iniciante: 400, medio: 650, senior: 1050, master: 1650 },
        interior: { iniciante: 320, medio: 520, senior: 850, master: 1350 },
        interiorExamples: "Rondonópolis, Sinop, Várzea Grande"
    },
    {
        name: "Goiás", uf: "GO",
        capital: { iniciante: 450, medio: 700, senior: 1150, master: 1800 },
        interior: { iniciante: 350, medio: 580, senior: 950, master: 1500 },
        interiorExamples: "Anápolis, Aparecida, Rio Verde, Luziânia"
    },
    {
        name: "Amazonas", uf: "AM",
        capital: { iniciante: 400, medio: 650, senior: 1000, master: 1500 },
        interior: { iniciante: 320, medio: 520, senior: 820, master: 1250 },
        interiorExamples: "Parintins, Itacoatiara, Manacapuru"
    },
    {
        name: "Espírito Santo", uf: "ES",
        capital: { iniciante: 400, medio: 650, senior: 1000, master: 1600 },
        interior: { iniciante: 320, medio: 520, senior: 850, master: 1350 },
        interiorExamples: "Vila Velha, Cariacica, Serra, Cachoeiro"
    },
    {
        name: "Pará", uf: "PA",
        capital: { iniciante: 380, medio: 600, senior: 950, master: 1500 },
        interior: { iniciante: 300, medio: 480, senior: 780, master: 1200 },
        interiorExamples: "Santarém, Marabá, Ananindeua"
    },
    {
        name: "Rio Grande do Norte", uf: "RN",
        capital: { iniciante: 380, medio: 600, senior: 950, master: 1500 },
        interior: { iniciante: 300, medio: 480, senior: 780, master: 1200 },
        interiorExamples: "Mossoró, Natal região metr., Parnamirim"
    },
    {
        name: "Mato Grosso do Sul", uf: "MS",
        capital: { iniciante: 380, medio: 600, senior: 950, master: 1500 },
        interior: { iniciante: 300, medio: 480, senior: 780, master: 1250 },
        interiorExamples: "Dourados, Corumbá, Três Lagoas"
    },
    {
        name: "Alagoas", uf: "AL",
        capital: { iniciante: 350, medio: 550, senior: 900, master: 1400 },
        interior: { iniciante: 280, medio: 450, senior: 720, master: 1100 },
        interiorExamples: "Arapiraca, Maceió região metr."
    },
    {
        name: "Maranhão", uf: "MA",
        capital: { iniciante: 350, medio: 550, senior: 900, master: 1400 },
        interior: { iniciante: 280, medio: 450, senior: 720, master: 1150 },
        interiorExamples: "Imperatriz, Timon, Caxias"
    },
    {
        name: "Paraíba", uf: "PB",
        capital: { iniciante: 350, medio: 550, senior: 900, master: 1400 },
        interior: { iniciante: 280, medio: 450, senior: 720, master: 1100 },
        interiorExamples: "Campina Grande, Santa Rita, Patos"
    },
    {
        name: "Rondônia", uf: "RO",
        capital: { iniciante: 350, medio: 550, senior: 900, master: 1400 },
        interior: { iniciante: 280, medio: 450, senior: 720, master: 1150 },
        interiorExamples: "Ariquemes, Ji-Paraná, Porto Velho região"
    },
    {
        name: "Sergipe", uf: "SE",
        capital: { iniciante: 350, medio: 550, senior: 880, master: 1350 },
        interior: { iniciante: 280, medio: 450, senior: 720, master: 1100 },
        interiorExamples: "Nossa Senhora do Socorro, Aracaju região"
    },
    {
        name: "Piauí", uf: "PI",
        capital: { iniciante: 320, medio: 520, senior: 850, master: 1300 },
        interior: { iniciante: 250, medio: 420, senior: 680, master: 1050 },
        interiorExamples: "Teresina região metr., Picos, Piripiri"
    },
    {
        name: "Tocantins", uf: "TO",
        capital: { iniciante: 330, medio: 530, senior: 850, master: 1300 },
        interior: { iniciante: 260, medio: 420, senior: 680, master: 1050 },
        interiorExamples: "Araguaína, Gurupi, Paraíso do Tocantins"
    },
    {
        name: "Acre", uf: "AC",
        capital: { iniciante: 300, medio: 500, senior: 800, master: 1200 },
        interior: { iniciante: 250, medio: 400, senior: 650, master: 1000 },
        interiorExamples: "Cruzeiro do Sul, Sena Madureira"
    },
    {
        name: "Amapá", uf: "AP",
        capital: { iniciante: 300, medio: 480, senior: 750, master: 1100 },
        interior: { iniciante: 250, medio: 400, senior: 620, master: 950 },
        interiorExamples: "Santana, Laranjal do Jari"
    },
    {
        name: "Roraima", uf: "RR",
        capital: { iniciante: 320, medio: 500, senior: 800, master: 1250 },
        interior: { iniciante: 250, medio: 400, senior: 650, master: 1000 },
        interiorExamples: "Caracaraí, Mucajaí"
    },
];

export const experienceLabel = (level: number): string => {
    if (level < 5) return "Iniciante";
    if (level < 10) return "Pleno";
    return "Sênior";
};

// Job type multipliers (applied to the base market rate contextually)
export const jobTypeMultipliers: Record<string, number> = {
    "publicidade": 1.75,
    "conteudos-web": 1.0,
    "casamentos": 1.1,
    "eventos": 1.0,
    "especialista": 1.5,
    "fee-mensal": 0.9,
};

export const unitsPerMonth: Record<string, number> = {
    "hora": 176,
    "diaria": 22,
    "semana": 4,
    "mes": 1,
};
