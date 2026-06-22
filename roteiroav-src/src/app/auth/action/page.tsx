"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { applyActionCode } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Loader2, CheckCircle2, XCircle, ArrowRight, ShieldCheck } from "lucide-react";

import { useRandomBackground } from "@/hooks/useRandomBackground";

type ActionState = "loading" | "success" | "error";

function AuthActionContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const bgStyle = useRandomBackground();

    const mode = searchParams.get("mode");
    const oobCode = searchParams.get("oobCode");

    const [status, setStatus] = useState<ActionState>("loading");
    const [message, setMessage] = useState("Aguarde um momento...");
    const [countdown, setCountdown] = useState(3);
    const hasAttempted = useRef(false);

    useEffect(() => {
        if (hasAttempted.current) return;

        if (!mode || !oobCode) {
            setStatus("error");
            setMessage("Link de ação inválido ou incompleto.");
            return;
        }

        hasAttempted.current = true;

        const handleActionVerification = async () => {
            if (mode === "verifyEmail") {
                setMessage("Verificando seu e-mail...");
                try {
                    await applyActionCode(auth, oobCode);
                    setStatus("success");
                    setMessage("E-mail verificado com sucesso!");
                    
                    let currentCount = 3;
                    const interval = setInterval(() => {
                        currentCount -= 1;
                        setCountdown(currentCount);
                        if (currentCount <= 0) {
                            clearInterval(interval);
                            router.push("/dashboard");
                        }
                    }, 1000);
                } catch (error: any) {
                    console.error("Firebase Action Error:", error);
                    setStatus("error");
                    switch (error.code) {
                        case "auth/expired-action-code":
                            setMessage("Esse link expirou. Solicite um novo e-mail de verificação.");
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
                        default:
                            setMessage("Ocorreu um erro ao processar sua solicitação.");
                            break;
                    }
                }
            } else if (mode === "resetPassword") {
                // Redirecting to the dedicated reset password page while passing the oobCode
                setMessage("Redirecionando para a página de redefinição...");
                router.push(`/reset-password?oobCode=${oobCode}`);
            } else {
                setStatus("error");
                setMessage("Ação desconhecida.");
            }
        };

        handleActionVerification();
    }, [mode, oobCode, router]);

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

                        {status === "error" && (
                            <>
                                <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-2">
                                    <XCircle className="w-8 h-8 text-red-400" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-white mb-2">Ops, algo deu errado</h1>
                                    <p className="text-red-400/80 text-sm font-medium mb-8 max-w-[280px] mx-auto">{message}</p>
                                    
                                    <button
                                        onClick={() => router.push("/login")}
                                        className="w-full bg-white text-black font-bold py-4 rounded-2xl hover:bg-white/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                    >
                                        Ir para o Login
                                        <ArrowRight className="w-4 h-4" />
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

export default function AuthActionPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen w-full flex items-center justify-center bg-[#050505]">
                <Loader2 className="w-8 h-8 text-white/20 animate-spin" />
            </div>
        }>
            <AuthActionContent />
        </Suspense>
    );
}
