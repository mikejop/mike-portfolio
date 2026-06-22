/**
 * Declarações de tipo global para o Google reCAPTCHA Enterprise SDK.
 * Carregado via script externo em src/app/layout.tsx.
 */
interface RecaptchaEnterprise {
    ready(callback: () => void): void;
    execute(siteKey: string, options: { action: string }): Promise<string>;
}

interface Window {
    grecaptcha: {
        enterprise: RecaptchaEnterprise;
    };
}
