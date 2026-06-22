"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { verifyPasswordResetCode, confirmPasswordReset } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Loader2, CheckCircle2, XCircle, ArrowRight, ShieldCheck, Lock, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRecaptcha } from "@/hooks/useRecaptcha";
import { useRandomBackground } from "@/hooks/useRandomBackground";

type ActionState = "loading" | "form" | "success" | "error";

function ResetPasswordContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { getToken } = useRecaptcha();
    const bgStyle = useRandomBackground();

    const oobCode = searchParams.get("oobCode");

    const [status, setStatus] = useState<ActionState>("loading");
    const [message, setMessage] = useState("Validando link de recuperação...");
    const [countdown, setCountdown] = useState(3);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    
    // Form States
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const hasAttempted = useRef(false);

    useEffect(() => {
        if (hasAttempted.current) return;

        if (!oobCode) {
            setStatus("error");
            setMessage("Link de recuperação inválido ou ausente.");
            return;
        }

        hasAttempted.current = true;

        const verifyLink = async () => {
            try {
                const email = await verifyPasswordResetCode(auth, oobCode);
                setUserEmail(email);
                setStatus("form");
            } catch (error: any) {
                handleFirebaseError(error);
            }
        };

        verifyLink();
    }, [oobCode]);

    const handleFirebaseError = (error: any) => {
        console.error("Firebase Action Error:", error);
        setStatus("error");
        switch (error.code) {
            case "auth/expired-action-code":
                setMessage("Esse link expirou. Solicite um novo.");
                break;
            case "auth/invalid-action-code":
                setMessage("Esse link é inválido ou já foi usado.");
                break;
            case "auth/user-disabled":
                setMessage("Essa conta foi desativada.");
                break;
            case "auth/user-not-found":
                setMessage("Usuário não encontrado.");
                break;
            case "auth/weak-password":
                setMessage("Senha muito fraca. Use no mínimo 8 caracteres.");
                break;
            default:
                setMessage("Ocorreu um erro ao processar sua solicitação.");
                break;
        }
    };

    const startRedirection = (path: string) => {
        let currentCount = 3;
        const interval = setInterval(() => {
            currentCount -= 1;
            setCountdown(currentCount);
            if (currentCount <= 0) {
                clearInterval(interval);
                router.push(path);
            }
        }, 1000);
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            alert("As senhas não coincidem.");
            return;
        }
        
        const strength = getPasswordStrength(newPassword);
        if (strength.score < 3) {
            alert("Sua senha precisa ser mais forte (Mínimo: 8 caracteres, maiúscula, número e símbolo).");
            return;
        }

        setIsSubmitting(true);
        try {
            const recaptchaToken = await getToken("NEW_PASSWORD");
            console.log("[reCAPTCHA] Token NEW_PASSWORD validado:", recaptchaToken?.score ?? "SDK indisponível");
            await confirmPasswordReset(auth, oobCode!, newPassword);
            setStatus("success");
            setMessage("Senha redefinida com sucesso!");
            startRedirection("/login");
        } catch (error: any) {
            setIsSubmitting(false);
            handleFirebaseError(error);
        }
    };

    const getPasswordStrength = (pass: string) => {
        if (!pass) return { score: 0, label: "Fraca", color: "bg-white/10" };
        let score = 0;
        if (pass.length >= 8) score++;
        if (/[A-Z]/.test(pass)) score++;
        if (/[0-9]/.test(pass)) score++;
        if (/[^A-Za-z0-9]/.test(pass)) score++;

        if (score <= 1) return { score, label: "Muito Fraca", color: "bg-red-500" };
        if (score === 2) return { score, label: "Fraca", color: "bg-yellow-500" };
        if (score === 3) return { score, label: "Média", color: "bg-emerald-400" };
        return { score, label: "Forte", color: "bg-emerald-500" };
    };

    const strength = getPasswordStrength(newPassword);

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
                <div className="bg-white/[0.08] backdrop-blur-2xl border border-white/10 rounded-[42px] p-[10px] shadow-2xl animate-in fade-in zoom-in duration-500">
                    <div className="bg-[#0a0a0c] rounded-[32px] p-8 flex flex-col items-center justify-center text-center space-y-6">
                        
                        {/* INITIAL LOADING STATE */}
                        {status === "loading" && (
                            <>
                                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-2">
                                    <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-white mb-2">Processando...</h1>
                                    <p className="text-white/60 text-sm">{message}</p>
                                </div>
                            </>
                        )}

                        {/* RESET PASSWORD FORM */}
                        {status === "form" && userEmail && (
                            <div className="w-full space-y-6 text-left animate-in fade-in duration-500">
                                <div className="text-center space-y-2">
                                    <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4">
                                        <Lock className="w-8 h-8 text-indigo-400" />
                                    </div>
                                    <h1 className="text-xl font-bold text-white">Nova senha</h1>
                                    <p className="text-white/40 text-xs">Redefinindo acesso para <br/><span className="text-white/80 font-bold">{userEmail}</span></p>
                                </div>

                                <form onSubmit={handleResetPassword} className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 ml-2">Nova Senha</label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="w-full bg-white/[0.05] border border-white/5 rounded-2xl py-4 px-6 text-white placeholder:text-white/10 focus:outline-none focus:border-indigo-500/50 transition-colors"
                                                placeholder="••••••••"
                                                required
                                            />
                                            <button 
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/40 transition-colors"
                                            >
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        
                                        {/* Strength Indicator */}
                                        <div className="px-2 pt-1">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-[9px] font-bold uppercase tracking-wider text-white/20">Força da senha</span>
                                                <span className={cn("text-[9px] font-bold uppercase tracking-wider", strength.color.replace('bg-', 'text-'))}>{strength.label}</span>
                                            </div>
                                            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden flex gap-1">
                                                {[1, 2, 3, 4].map((step) => (
                                                    <div 
                                                        key={step}
                                                        className={cn(
                                                            "h-full flex-1 transition-all duration-500",
                                                            strength.score >= step ? strength.color : "bg-white/5"
                                                        )}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 ml-2">Confirmar Senha</label>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full bg-white/[0.05] border border-white/5 rounded-2xl py-4 px-6 text-white placeholder:text-white/10 focus:outline-none focus:border-indigo-500/50 transition-colors"
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full bg-white text-black font-bold py-4 rounded-2xl hover:bg-white/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4"
                                    >
                                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Salvar nova senha"}
                                    </button>
                                </form>
                            </div>
                        )}

                        {/* SUCCESS STATE */}
                        {status === "success" && (
                            <>
                                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-2 animate-in slide-in-from-bottom-4">
                                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                                </div>
                                <div className="animate-in fade-in duration-500 delay-150">
                                    <h1 className="text-xl font-bold text-white mb-2">Tudo certo!</h1>
                                    <p className="text-emerald-400/80 text-sm font-medium mb-6">{message}</p>
                                    
                                    <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-4 flex flex-col items-center">
                                        <p className="text-white/40 text-xs mb-1 uppercase tracking-wider font-bold">Redirecionando em</p>
                                        <div className="text-3xl font-black text-white">{countdown}</div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* ERROR STATE */}
                        {status === "error" && (
                            <>
                                <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-2">
                                    <XCircle className="w-8 h-8 text-red-400" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-white mb-2">Ops, algo deu errado</h1>
                                    <p className="text-red-400/80 text-sm font-medium mb-8 max-w-[280px] mx-auto">{message}</p>
                                    
                                    <button
                                        onClick={() => router.push("/forgot-password")}
                                        className="w-full bg-white text-black font-bold py-4 rounded-2xl hover:bg-white/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                    >
                                        Solicitar novo link
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                    
                                    <button
                                        onClick={() => router.push("/login")}
                                        className="w-full bg-transparent text-white/50 font-bold py-4 rounded-2xl hover:bg-white/5 hover:text-white/80 active:scale-[0.98] transition-all mt-2"
                                    >
                                        Voltar ao login
                                    </button>
                                </div>
                            </>
                        )}

                        <div className="pt-6 border-t border-white/5 w-full flex items-center justify-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-white/20" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Dojo Authenticator</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen w-full flex items-center justify-center bg-[#050505]">
                <Loader2 className="w-8 h-8 text-white/20 animate-spin" />
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    );
}
