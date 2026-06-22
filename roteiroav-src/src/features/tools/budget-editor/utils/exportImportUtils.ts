import { getUserCollection, saveUserDocument, getUserDocument } from "@/lib/firestore";
import { auth } from "@/lib/firebase";
import { useAppStore } from "@/store/useAppStore";

export interface OhiroExport {
    version: "1.0";
    exportedAt: string;
    owner: string;
    orcamentos: any[];
}

export const exportBudgetsToOhiro = async () => {
    const user = auth.currentUser;
    if (!user) throw new Error("Usuário não autenticado");

    const budgets = await getUserCollection('budgets');

    const data: OhiroExport = {
        version: "1.0",
        exportedAt: new Date().toISOString(),
        owner: user.uid,
        orcamentos: budgets
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `meus_orcamentos_${new Date().toISOString().split('T')[0]}.ohiro`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

export const importOhiroFile = async (file: File): Promise<{ imported: number, skipped: number }> => {
    const user = auth.currentUser;
    if (!user) throw new Error("Usuário não autenticado");

    const text = await file.text();
    let data: OhiroExport;

    try {
        data = JSON.parse(text);
    } catch {
        throw new Error("Arquivo inválido: não é um JSON válido");
    }

    if (data.version !== "1.0" || !Array.isArray(data.orcamentos)) {
        throw new Error("Arquivo inválido: formato .ohiro não reconhecido");
    }

    let imported = 0;
    let skipped = 0;

    for (const orcamento of data.orcamentos) {
        if (!orcamento.meta?.id) continue;

        // Verifica se já existe
        const existing = await getUserDocument('budgets', orcamento.meta.id);

        if (existing) {
            const num = orcamento.meta.num || 'sem número';
            const confirmReplace = await useAppStore.getState().requestConfirm("Substituir", `O orçamento #${num} (${orcamento.meta.id}) já existe. Deseja substituí-lo?`);
            if (!confirmReplace) {
                skipped++;
                continue;
            }
        }

        // Remove campos gerados pelo Firestore que não devem ser reescritos diretamente
        const { id, ownerId, createdAt, updatedAt, ...cleanData } = orcamento;

        await saveUserDocument('budgets', orcamento.meta.id, cleanData);
        imported++;
    }

    return { imported, skipped };
};
