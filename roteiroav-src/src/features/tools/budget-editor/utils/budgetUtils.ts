import { BudgetStoreState } from "../store/types";

export const fetchInternetDate = async (): Promise<string> => {
    const apis = [
        {
            url: 'https://timeapi.io/api/time/current/zone?timeZone=America/Sao_Paulo',
            extract: (data: any) => data.date, // "YYYY-MM-DD"
        },
        {
            url: 'https://worldtimeapi.org/api/timezone/America/Sao_Paulo',
            extract: (data: any) => data.datetime.split('T')[0],
        },
    ];

    for (const api of apis) {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 4000);
            const response = await fetch(api.url, { signal: controller.signal });
            clearTimeout(timeout);
            if (response.ok) {
                const data = await response.json();
                const date = api.extract(data);
                if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
            }
        } catch {
            // try next
        }
    }

    // Fallback to local time
    console.warn("All date APIs failed, using local time");
    return new Date().toISOString().split('T')[0];
};

export const generateBudgetNumber = (clientName: string, date: string) => {
    if (!clientName) return "000-" + Math.floor(Math.random() * 999).toString().padStart(3, '0');

    // Compound name rule: first letter of first name + first two letters of second name
    // Single name: first 3 letters
    const words = clientName.trim().split(/\s+/).filter(w => w.length > 0);
    let prefix: string;
    if (words.length >= 2) {
        prefix = (words[0][0] + words[1].substring(0, 2)).toUpperCase().padEnd(3, 'X');
    } else {
        prefix = words[0].substring(0, 3).toUpperCase().padEnd(3, 'X');
    }

    // Fixed client hash (simple sum of char codes)
    let clientHash = 0;
    for (let i = 0; i < clientName.length; i++) {
        clientHash += clientName.charCodeAt(i);
    }
    const clientDigits = (clientHash % 1000).toString().padStart(3, '0');

    // Date/Random hash
    const dateStr = date.replace(/-/g, '');
    let dateHash = 0;
    for (let i = 0; i < dateStr.length; i++) {
        dateHash += parseInt(dateStr[i]) * (i + 1);
    }
    // Add random element to date hash
    const randomDigits = ((dateHash + Math.floor(Math.random() * 100)) % 1000).toString().padStart(3, '0');

    return `${prefix}-${clientDigits}${randomDigits}`;
};

export const validateCPF = (cpf: string) => {
    cpf = cpf.replace(/[^\d]/g, '');
    if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false;
    let sum = 0, rest;
    for (let i = 1; i <= 9; i++) sum = sum + parseInt(cpf.substring(i - 1, i)) * (11 - i);
    rest = (sum * 10) % 11;
    if ((rest === 10) || (rest === 11)) rest = 0;
    if (rest !== parseInt(cpf.substring(9, 10))) return false;
    sum = 0;
    for (let i = 1; i <= 10; i++) sum = sum + parseInt(cpf.substring(i - 1, i)) * (12 - i);
    rest = (sum * 10) % 11;
    if ((rest === 10) || (rest === 11)) rest = 0;
    if (rest !== parseInt(cpf.substring(10, 11))) return false;
    return true;
};

export const validateCNPJ = (cnpj: string) => {
    cnpj = cnpj.replace(/[^\d]/g, '');
    if (cnpj.length !== 14 || !!cnpj.match(/(\d)\1{13}/)) return false;
    let size = cnpj.length - 2;
    let numbers = cnpj.substring(0, size);
    let digits = cnpj.substring(size);
    let sum = 0;
    let pos = size - 7;
    for (let i = size; i >= 1; i--) {
        sum += parseInt(numbers.charAt(size - i)) * pos--;
        if (pos < 2) pos = 9;
    }
    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(0))) return false;
    size = size + 1;
    numbers = cnpj.substring(0, size);
    sum = 0;
    pos = size - 7;
    for (let i = size; i >= 1; i--) {
        sum += parseInt(numbers.charAt(size - i)) * pos--;
        if (pos < 2) pos = 9;
    }
    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(1))) return false;
    return true;
};

export const formatCPF = (v: string) => {
    v = v.replace(/\D/g, "");
    if (v.length <= 11) {
        v = v.replace(/(\d{3})(\d)/, "$1.$2");
        v = v.replace(/(\d{3})(\d)/, "$1.$2");
        v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }
    return v;
};

export const formatCNPJ = (v: string) => {
    v = v.replace(/\D/g, "");
    v = v.replace(/^(\d{2})(\d)/, "$1.$2");
    v = v.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
    v = v.replace(/\.(\d{3})(\d)/, ".$1/$2");
    v = v.replace(/(\d{4})(\d)/, "$1-$2");
    return v;
};

export const formatCEP = (v: string) => {
    v = v.replace(/\D/g, "");
    v = v.replace(/^(\d{5})(\d)/, "$1-$2");
    return v;
};

export const formatPhone = (v: string) => {
    v = v.replace(/\D/g, "");
    v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
    v = v.replace(/(\d)(\d{4})$/, "$1-$2");
    return v;
};
