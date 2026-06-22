"use client";

import { useState } from "react";
import {
    signInWithPopup,
    GoogleAuthProvider,
    signInWithEmailAndPassword
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Loader2, Mail, Lock, LogIn, Github, Instagram, Youtube } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRecaptcha } from "@/hooks/useRecaptcha";
import { useRandomBackground } from "@/hooks/useRandomBackground";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const { getToken } = useRecaptcha();

    const [logoClicks, setLogoClicks] = useState(0);
    const [showGoogleLogin, setShowGoogleLogin] = useState(false);
    const [isFadingOut, setIsFadingOut] = useState(false);
    const bgStyle = useRandomBackground();
    const [showTerms, setShowTerms] = useState(false);

    const handleLogoClick = () => {
        const nextClicks = logoClicks + 1;
        setLogoClicks(nextClicks);
        if (nextClicks >= 9) {
            setShowGoogleLogin(true);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError(null);
        try {
            const recaptchaToken = await getToken("GOOGLE_LOGIN");
            console.log("[reCAPTCHA] Token GOOGLE_LOGIN validado:", recaptchaToken?.score ?? "SDK indisponível");
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
            setIsFadingOut(true);
            setTimeout(() => {
                router.push("/");
            }, 1000);
        } catch (err: any) {
            console.error("Google Auth error:", err);
            setError(`Erro ao autenticar com Google: ${err.message || err.code || err}`);
            setLoading(false);
        }
    };

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        console.log(`[Auth] Iniciando tentativa de LOGIN para: ${email}`);
        try {
            const recaptchaToken = await getToken("LOGIN");
            console.log("[reCAPTCHA] Token LOGIN validado:", recaptchaToken?.score ?? "SDK indisponível");
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log("[Auth] Login realizado com sucesso:", userCredential.user.uid);
            setIsFadingOut(true);
            setTimeout(() => {
                router.push("/");
            }, 1000);
        } catch (err: any) {
            console.error("Auth Error Code:", err.code);

            // Hide raw Firebase messages per user request
            if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
                setError("Login ou senha incorretos.");
            } else if (err.code === 'auth/email-already-in-use') {
                setError("Este email já está em uso. Tente fazer login.");
            } else if (err.code === 'auth/weak-password') {
                setError("A senha deve ter pelo menos 6 caracteres.");
            } else if (err.code === 'auth/operation-not-allowed') {
                setError("O login por Email/Senha não está ativado.");
            } else {
                setError("Erro na autenticação. Tente novamente.");
            }
            setLoading(false);
        }
    };

    return (
        <div 
            className={cn(
                "min-h-screen w-full flex items-center justify-center bg-[#050505] relative overflow-hidden transition-opacity duration-1000 ease-in-out",
                isFadingOut ? "opacity-0" : "opacity-100"
            )}
        >
            {/* Blurred Background Layer */}
            <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none scale-105"
                style={{
                    ...bgStyle,
                    filter: "blur(8px)"
                }}
            />
            {/* Dynamic Background Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />

            <div className="w-full max-w-md relative z-10 px-8">
                {/* Glass Border Container (10px) */}
                <div className="bg-white/[0.08] backdrop-blur-2xl border border-white/10 rounded-[42px] p-[10px] shadow-2xl">
                    {/* Inner Solid Content Box */}
                    <div className="bg-[#0a0a0c] rounded-[32px] p-8 space-y-8">

                        <div className="text-center space-y-2">
                            <div 
                                onClick={handleLogoClick}
                                className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 mb-4 cursor-default select-none"
                            >
                                <LogIn className="w-8 h-8 text-indigo-400 pointer-events-none" />
                            </div>
                            <h1 className="text-3xl font-bold text-white tracking-tight">
                                Bem-vindo ao Dojo
                            </h1>
                            <p className="text-white/40 text-sm">
                                Entre na sua conta para continuar.
                            </p>
                        </div>

                        <form onSubmit={handleEmailAuth} className="space-y-4">
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
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 ml-2">Senha</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-white/[0.05] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/10 focus:outline-none focus:border-indigo-500/50 transition-colors"
                                        required
                                    />
                                </div>
                            </div>

                            {error && (
                                <p className="text-red-400 text-xs text-center font-medium animate-shake">{error}</p>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-white text-black font-bold py-4 rounded-2xl hover:bg-white/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Entrar"}
                            </button>
                        </form>

                        <div className="pt-4 border-t border-white/5 space-y-4">
                            <div className="text-center">
                                <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Acesso exclusivo</p>
                                <button
                                    disabled
                                    className="w-full bg-emerald-500/50 text-[#050505]/50 font-black py-4 rounded-2xl cursor-not-allowed text-sm uppercase tracking-wider"
                                >
                                    Resgatar acesso gratuito
                                </button>
                            </div>
                        </div>

                        {showGoogleLogin && (
                            <div className="flex justify-center animate-in fade-in zoom-in duration-500">
                                <button
                                    onClick={handleGoogleLogin}
                                    disabled={loading}
                                    className="w-full flex items-center justify-center gap-3 bg-white/[0.05] border border-white/5 hover:bg-white/10 text-white py-3 rounded-2xl transition-all active:scale-[0.98]"
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    <span className="text-sm font-medium">Continuar com Google</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-8 left-0 w-full flex flex-col items-center justify-center gap-4 z-10 transition-opacity duration-1000">
                <div className="flex items-center gap-6">
                    <a href="https://instagram.com/mike_flmmkr" target="_blank" rel="noopener noreferrer" className="text-black/40 hover:text-black/80 transition-colors drop-shadow-sm" title="Instagram">
                        <Instagram className="w-5 h-5" />
                    </a>
                    <a href="https://www.tiktok.com/@mike_flmmkr" target="_blank" rel="noopener noreferrer" className="text-black/40 hover:text-black/80 transition-colors flex items-center justify-center drop-shadow-sm" title="TikTok">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                        </svg>
                    </a>
                    <a href="https://www.youtube.com/@mikeflmmkr" target="_blank" rel="noopener noreferrer" className="text-black/40 hover:text-black/80 transition-colors drop-shadow-sm" title="YouTube">
                        <Youtube className="w-5 h-5" />
                    </a>
                </div>
                <button 
                    onClick={() => setShowTerms(true)}
                    className="text-black/40 hover:text-black/80 text-[11px] font-medium transition-colors underline-offset-4 hover:underline uppercase tracking-wider drop-shadow-sm"
                >
                    Termos de Uso e Acesso Beta
                </button>
            </div>

            {/* Terms Modal */}
            {showTerms && (
                <div className="fixed inset-0 z-50 bg-[#050505]/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-[#0a0a0c] border border-white/10 rounded-3xl w-full max-w-lg flex flex-col max-h-[85vh] shadow-[0_0_40px_rgba(0,0,0,0.5)]">
                        <div className="flex items-center justify-between p-6 border-b border-white/5 shrink-0">
                            <div>
                                <h2 className="text-lg font-bold text-white">Termos de Uso e Acesso Beta</h2>
                                <p className="text-xs text-white/40 mt-1">dojo.hirocontents.com.br</p>
                            </div>
                            <button onClick={() => setShowTerms(false)} className="text-white/40 hover:text-white transition-colors p-2 rounded-full hover:bg-white/5">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto text-[13px] text-white/60 space-y-6 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
                            <p>Ao acessar ou utilizar a plataforma dojo.hirocontents.com.br, o usuário declara que leu, compreendeu e concorda integralmente com os presentes Termos de Uso, em conformidade com a LGPD (Lei nº 13.709/2018).</p>
                            
                            <div className="space-y-2">
                                <h3 className="text-white font-semibold text-[11px] uppercase tracking-wider">1. Identificação do serviço</h3>
                                <p>A plataforma Dojo é operada pela Dojo Academy, destinada a ferramentas digitais para projetos audiovisuais. Contato: <span className="text-emerald-400">contato@hirocontents.com.br</span></p>
                            </div>
                            
                            <div className="space-y-2">
                                <h3 className="text-white font-semibold text-[11px] uppercase tracking-wider">2. Descrição da plataforma</h3>
                                <p>A plataforma disponibiliza ferramentas criativas (Roteiro AV, Mapa de Luz, Storyboard, Moodboard, Copy Writing), financeiras (Precificação, Editor de Orçamento), de planejamento (Planejador de Conteúdo) e utilitárias (Extrator e Criador de Paleta de Cor). Novas ferramentas poderão ser adicionadas ou removidas a qualquer momento.</p>
                            </div>
                            
                            <div className="space-y-2">
                                <h3 className="text-white font-semibold text-[11px] uppercase tracking-wider">3. Natureza experimental (Versão Beta)</h3>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>O sistema pode conter erros, bugs ou comportamentos inesperados;</li>
                                    <li>Funcionalidades podem ser alteradas ou removidas sem aviso prévio;</li>
                                    <li>Pode ocorrer instabilidade ou indisponibilidade temporária;</li>
                                    <li>Pode ocorrer reset do sistema, com perda parcial ou total de dados;</li>
                                    <li>Recursos podem estar incompletos ou em fase de implementação.</li>
                                </ul>
                            </div>
                            
                            <div className="space-y-2">
                                <h3 className="text-white font-semibold text-[11px] uppercase tracking-wider">4. Cadastro e acesso</h3>
                                <p>O usuário é responsável pela confidencialidade de sua senha e por todas as atividades em sua conta. Uso indevido: <span className="text-emerald-400">contato@hirocontents.com.br</span></p>
                            </div>
                            
                            <div className="space-y-2">
                                <h3 className="text-white font-semibold text-[11px] uppercase tracking-wider">5. Uso permitido</h3>
                                <p>É proibido acessar áreas restritas, realizar engenharia reversa, explorar falhas de segurança, usar para fins ilegais ou redistribuir o software sem autorização.</p>
                            </div>
                            
                            <div className="space-y-2">
                                <h3 className="text-white font-semibold text-[11px] uppercase tracking-wider">6. Propriedade intelectual</h3>
                                <p>Todo o conteúdo, código, design e funcionalidades da plataforma Dojo são protegidos por direitos de propriedade intelectual da Dojo Academy.</p>
                            </div>
                            
                            <div className="space-y-2">
                                <h3 className="text-white font-semibold text-[11px] uppercase tracking-wider">7. Conteúdo dos usuários</h3>
                                <p>Os conteúdos criados na plataforma pertencem ao usuário. O usuário concede à Dojo Academy autorização para armazenamento, processamento e uso anonimizado para melhoria da plataforma.</p>
                            </div>
                            
                            <div className="space-y-2">
                                <h3 className="text-white font-semibold text-[11px] uppercase tracking-wider">8. Limitação de responsabilidade</h3>
                                <p>A Dojo Academy não se responsabiliza por perda de dados, indisponibilidade ou danos indiretos. O uso ocorre por conta e risco do usuário.</p>
                            </div>
                            
                            <div className="space-y-2">
                                <h3 className="text-white font-semibold text-[11px] uppercase tracking-wider">9. Tratamento de dados (LGPD)</h3>
                                <p>Dados são tratados para autenticação, funcionamento da plataforma e melhoria das ferramentas, em conformidade com a Lei nº 13.709/2018.</p>
                            </div>
                            
                            <div className="space-y-2">
                                <h3 className="text-white font-semibold text-[11px] uppercase tracking-wider">10. Direitos do titular</h3>
                                <p>O usuário tem direito a acesso, correção, anonimização, portabilidade e revogação de consentimento. Solicitações: <span className="text-emerald-400">contato@hirocontents.com.br</span></p>
                            </div>
                            
                            <div className="space-y-2">
                                <h3 className="text-white font-semibold text-[11px] uppercase tracking-wider">11 a 14. Segurança, modificações e legislação</h3>
                                <p>A Dojo Academy adota medidas razoáveis de segurança. Pode modificar a plataforma e estes termos a qualquer momento. O uso contínuo implica aceitação. Legislação aplicável: leis da República Federativa do Brasil.</p>
                            </div>
                        </div>
                        <div className="p-6 border-t border-white/5 bg-white/[0.02] shrink-0 rounded-b-3xl">
                            <button onClick={() => setShowTerms(false)} className="w-full bg-emerald-500 hover:bg-emerald-400 text-[#050505] font-bold py-4 rounded-2xl transition-all active:scale-[0.98] uppercase tracking-wider text-sm shadow-[0_0_30px_rgba(16,185,129,0.1)] hover:shadow-[0_0_40px_rgba(16,185,129,0.2)]">
                                Entendido
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
