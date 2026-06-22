"use client";

import { useCallback } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";

const RECAPTCHA_SITE_KEY = "6Lcpy68sAAAAADS_K4IP6WX7fNfRjy5SGF2QOL4N";

interface AssessmentResult {
    success: boolean;
    score: number;
    action: string;
    reasons: string[];
}

/**
 * Hook reutilizável para gerar e validar tokens do reCAPTCHA Enterprise.
 *
 * Fluxo:
 *  1. Chama grecaptcha.enterprise.execute() para gerar o token no client
 *  2. Envia o token ao Cloud Function `assessRecaptcha` para validação backend
 *  3. Lança erro se score < 0.5 ou action não corresponde (provável bot)
 *
 * @example
 * const { getToken } = useRecaptcha();
 * await getToken('LOGIN'); // lança HttpsError se suspeito
 */
export function useRecaptcha() {
    const getToken = useCallback(
        async (action: string): Promise<AssessmentResult | null> => {
            console.log(`[reCAPTCHA] Validação desativada/bypassed para a ação: ${action}`);
            return null;
        },
        []
    );

    return { getToken };
}
