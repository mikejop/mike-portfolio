"use client";

import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Loader2, Mail, ArrowLeft, Send, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRecaptcha } from "@/hooks/useRecaptcha";
import { useRandomBackground } from "@/hooks/useRandomBackground";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const router = useRouter();
    const { getToken } = useRecaptcha();
    const bgStyle = useRandomBackground();

    const handleResetRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const recaptchaToken = await getToken("PASSWORD_RESET");
            console.log("[reCAPTCHA] Token PASSWORD_RESET validado:", recaptchaToken?.score ?? "SDK indisponível");
            await sendPasswordResetEmail(auth, email);
            setSuccess(true);
            setLoading(false);
        } catch (err: any) {
            console.error("Reset Email Error:", err);
            setLoading(false);
            
            switch (err.code) {
                case "auth/user-not-found":
                    setError("Nenhuma conta encontrada com esse e-mail.");
                    break;
                case "auth/invalid-email":
                    setError("E-mail inválido.");
                    break;
                case "auth/too-many-requests":
                    setError("Muitas tentativas. Aguarde alguns minutos.");
                    break;
                default:
                    setError("Erro ao enviar link. Tente novamente.");
                    break;
            }
        }
    };

    return (
        <div 
            className="min-h-screen w-full flex items-center justify-center bg-[#050505] relative overflow-hidden"
        >
            {/* Blurred Background Layer */}
            <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none scale-105"
                style={{
                    ...bgStyle,
                    filter: "blur(8px)"
                }}
            />
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />

            <div className="w-full max-w-md relative z-10 px-8">
                <div className="bg-white/[0.08] backdrop-blur-2xl border border-white/10 rounded-[42px] p-[10px] shadow-2xl">
                    <div className="bg-[#0a0a0c] rounded-[32px] p-8 space-y-8">
                        
                        <div className="text-center space-y-2">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 mb-4">
                                <Mail className="w-8 h-8 text-indigo-400" />
                            </div>
                            <h1 className="text-3xl font-bold text-white tracking-tight">
                                Recuperar senha
                            </h1>
                            <p className="text-white/40 text-sm">
                                {success 
                                    ? "Verifique seu e-mail para continuar." 
                                    : "Digite seu e-mail para receber o link de redefinição."}
                            </p>
                        </div>

                        {!success ? (
                            <form onSubmit={handleResetRequest} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 ml-2">Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                        <input
                                            type="email"
                                            placeholder="seu@email.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full bg-white/[0.05] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/10 focus:outline-none focus:border-indigo-500/50 transition-colors"
                                            required
                                        />
                                    </div>
                                    {error && (
                                        <p className="text-red-400 text-xs mt-2 font-medium animate-shake">{error}</p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-white text-black font-bold py-4 rounded-2xl hover:bg-white/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                        <>
                                            Enviar link de recuperação
                                            <Send className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            </form>
                        ) : (
                            <div className="space-y-6 animate-in fade-in zoom-in duration-500">
                                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 text-center">
                                    <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                                    <p className="text-emerald-400/90 text-sm font-medium leading-relaxed">
                                        Enviamos um link para <span className="text-white font-bold">{email}</span>. 
                                        Verifique sua caixa de entrada e spam.
                                    </p>
                                </div>
                                <button
                                    onClick={() => router.push("/login")}
                                    className="w-full bg-white/5 border border-white/10 text-white font-bold py-4 rounded-2xl hover:bg-white/10 active:scale-[0.98] transition-all"
                                >
                                    Voltar ao Login
                                </button>
                            </div>
                        )}

                        {!success && (
                            <div className="pt-4 border-t border-white/5">
                                <button 
                                    onClick={() => router.push("/login")}
                                    className="w-full flex items-center justify-center gap-2 text-white/40 hover:text-white/60 text-xs font-semibold uppercase tracking-wider transition-colors"
                                >
                                    <ArrowLeft className="w-3 h-3" />
                                    Voltar para o Login
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
