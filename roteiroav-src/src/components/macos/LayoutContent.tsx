"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WindowContainer } from "@/components/macos/WindowContainer";
import { TopBar } from "@/components/macos/TopBar";
import { ProjectSidebar } from "@/components/macos/ProjectSidebar";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useTrafficSource } from "@/hooks/useTrafficSource";
import { Suspense } from "react";
import { useAppStore } from "@/store/useAppStore";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { GlobalConfirmModal } from "@/components/macos/GlobalConfirmModal";

function TrafficTracker() {
  useTrafficSource();
  return null;
}

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isNoShellPage = [
    "/register", "/login", "/dojo-lowticket", "/forgot-password", "/reset-password",
    "/register/", "/login/", "/dojo-lowticket/", "/forgot-password/", "/reset-password/"
  ].includes(pathname);
  const [showTerms, setShowTerms] = useState(false);
  
  const { showLogoutConfirm, isLoggingOut, setShowLogoutConfirm, setIsLoggingOut, isTransitioning, setIsTransitioning } = useAppStore();
  const router = useRouter();

  const confirmLogout = async () => {
      setIsLoggingOut(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setIsTransitioning(true);
      await new Promise(resolve => setTimeout(resolve, 800));
      
      import("@/lib/firebase").then(({ auth }) => {
          auth.signOut().then(() => {
              router.push("/login");
              setTimeout(() => {
                  setIsTransitioning(false);
                  setIsLoggingOut(false);
                  setShowLogoutConfirm(false);
              }, 100);
          });
      });
  };

  if (isNoShellPage) {
    return (
      <main className="w-full h-screen bg-[#111113]">
        {children}
      </main>
    );
  }

  return (
    <AuthGuard>
      <Suspense fallback={null}>
        <TrafficTracker />
      </Suspense>
      <TooltipProvider delay={0}>
        <WindowContainer>
          <GlobalConfirmModal />
          <TopBar title="Roteiro AV" />

          <div className="flex flex-1 overflow-hidden relative">
            <ProjectSidebar />

            <main className="flex-1 overflow-y-auto bg-[var(--macos-bg)] relative">
              {children}
              {/* In-Window Page Transition Overlay */}
              <div 
                  className={`absolute inset-0 bg-[var(--macos-bg)] z-[50] pointer-events-none transition-opacity duration-300 ${isTransitioning ? "opacity-100" : "opacity-0"}`}
              />
            </main>
          </div>

          {/* App Footer Bar */}
          <footer className="shrink-0 flex items-center justify-between px-4 py-2 border-t border-[var(--macos-hover)]/30 bg-[var(--macos-bg)]">
            {/* Left: Social Icons */}
            <div className="flex items-center gap-4 w-1/3">
              <a href="https://instagram.com/mike_flmmkr" target="_blank" rel="noopener noreferrer" title="Instagram" className="text-white/20 hover:text-white/70 transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
              <a href="https://www.tiktok.com/@mike_flmmkr" target="_blank" rel="noopener noreferrer" title="TikTok" className="text-white/20 hover:text-white/70 transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>
              </a>
              <a href="https://www.youtube.com/@mikeflmmkr" target="_blank" rel="noopener noreferrer" title="YouTube" className="text-white/20 hover:text-white/70 transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/></svg>
              </a>
            </div>

            {/* Center: Terms Link */}
            <div className="flex items-center justify-center w-1/3">
              <button
                onClick={() => setShowTerms(true)}
                className="text-white/20 hover:text-white/60 text-[10px] font-medium transition-colors hover:underline underline-offset-4 uppercase tracking-wider"
              >
                Termos de Uso
              </button>
            </div>

            {/* Right: Copyright */}
            <div className="flex items-center justify-end w-1/3">
              <p className="text-white/[0.15] text-[10px] font-medium tracking-wide">© 2026 Dojo Academy</p>
            </div>
          </footer>

          {/* Logout Confirmation Modal - Restricted to macOS Shell */}
          {showLogoutConfirm && (
              <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300 rounded-[inherit]">
                  <div className="w-full max-w-sm bg-card rounded-2xl shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-300 relative">
                      <div className="p-8 text-center flex flex-col items-center justify-center min-h-[220px]">
                          {isLoggingOut ? (
                              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-4">
                                      <LogOut size={28} className="translate-x-0.5" />
                                  </div>
                                  <h2 className="text-xl font-bold text-foreground">Obrigado!</h2>
                                  <p className="text-muted-foreground text-sm">Volte Sempre.</p>
                              </div>
                          ) : (
                              <div className="space-y-6">
                                  <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
                                      <LogOut size={28} className="translate-x-0.5" />
                                  </div>
                                  <div>
                                      <h2 className="text-xl font-bold text-foreground mb-2">Encerrar Sessão</h2>
                                      <p className="text-muted-foreground text-sm">
                                          Você tem certeza que deseja finalizar sua sessão no Roteiro AV?
                                      </p>
                                  </div>
                                  <div className="flex items-center gap-3 pt-4">
                                      <button
                                          onClick={() => setShowLogoutConfirm(false)}
                                          className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-bold text-muted-foreground hover:bg-accent transition-all"
                                          disabled={isLoggingOut}
                                      >
                                          Cancelar
                                      </button>
                                      <button
                                          onClick={confirmLogout}
                                          className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                                          disabled={isLoggingOut}
                                      >
                                          Sim, sair
                                      </button>
                                  </div>
                              </div>
                          )}
                      </div>
                  </div>
              </div>
          )}

        </WindowContainer>
      </TooltipProvider>

      {/* Terms Modal */}
      {showTerms && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#0a0a0c] border border-white/10 rounded-3xl w-full max-w-lg flex flex-col max-h-[85vh] shadow-[0_0_60px_rgba(0,0,0,0.7)]">
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
              <div className="space-y-2"><h3 className="text-white font-semibold text-[11px] uppercase tracking-wider">1. Identificação do serviço</h3><p>A plataforma Dojo é operada pela Dojo Academy, destinada a ferramentas digitais para projetos audiovisuais. Contato: <span className="text-emerald-400">contato@hirocontents.com.br</span></p></div>
              <div className="space-y-2"><h3 className="text-white font-semibold text-[11px] uppercase tracking-wider">2. Descrição da plataforma</h3><p>A plataforma disponibiliza ferramentas criativas (Roteiro AV, Mapa de Luz, Storyboard, Moodboard, Copy Writing), financeiras (Precificação, Editor de Orçamento), de planejamento (Planejador de Conteúdo) e utilitárias (Extrator e Criador de Paleta de Cor). Novas ferramentas poderão ser adicionadas ou removidas a qualquer momento.</p></div>
              <div className="space-y-2"><h3 className="text-white font-semibold text-[11px] uppercase tracking-wider">3. Natureza experimental (Versão Beta)</h3><ul className="list-disc pl-5 space-y-1"><li>O sistema pode conter erros, bugs ou comportamentos inesperados;</li><li>Funcionalidades podem ser alteradas ou removidas sem aviso prévio;</li><li>Pode ocorrer instabilidade ou indisponibilidade temporária;</li><li>Pode ocorrer reset do sistema, com perda parcial ou total de dados;</li><li>Recursos podem estar incompletos ou em fase de implementação.</li></ul></div>
              <div className="space-y-2"><h3 className="text-white font-semibold text-[11px] uppercase tracking-wider">4. Cadastro e acesso</h3><p>O usuário é responsável pela confidencialidade de sua senha e por todas as atividades em sua conta. Uso indevido: <span className="text-emerald-400">contato@hirocontents.com.br</span></p></div>
              <div className="space-y-2"><h3 className="text-white font-semibold text-[11px] uppercase tracking-wider">5. Uso permitido</h3><p>É proibido acessar áreas restritas, realizar engenharia reversa, explorar falhas de segurança, usar para fins ilegais ou redistribuir o software sem autorização.</p></div>
              <div className="space-y-2"><h3 className="text-white font-semibold text-[11px] uppercase tracking-wider">6. Propriedade intelectual</h3><p>Todo o conteúdo, código, design e funcionalidades da plataforma Dojo são protegidos por direitos de propriedade intelectual da Dojo Academy.</p></div>
              <div className="space-y-2"><h3 className="text-white font-semibold text-[11px] uppercase tracking-wider">7. Conteúdo dos usuários</h3><p>Os conteúdos criados na plataforma pertencem ao usuário. O usuário concede à Dojo Academy autorização para armazenamento, processamento e uso anonimizado para melhoria da plataforma.</p></div>
              <div className="space-y-2"><h3 className="text-white font-semibold text-[11px] uppercase tracking-wider">8. Limitação de responsabilidade</h3><p>A Dojo Academy não se responsabiliza por perda de dados, indisponibilidade ou danos indiretos. O uso ocorre por conta e risco do usuário.</p></div>
              <div className="space-y-2"><h3 className="text-white font-semibold text-[11px] uppercase tracking-wider">9. Tratamento de dados (LGPD)</h3><p>Dados são tratados para autenticação, funcionamento da plataforma e melhoria das ferramentas, em conformidade com a Lei nº 13.709/2018.</p></div>
              <div className="space-y-2"><h3 className="text-white font-semibold text-[11px] uppercase tracking-wider">10. Direitos do titular</h3><p>O usuário tem direito a acesso, correção, anonimização, portabilidade e revogação de consentimento. Solicitações: <span className="text-emerald-400">contato@hirocontents.com.br</span></p></div>
              <div className="space-y-2"><h3 className="text-white font-semibold text-[11px] uppercase tracking-wider">11 a 14. Segurança, modificações e legislação</h3><p>A Dojo Academy adota medidas razoáveis de segurança. Pode modificar a plataforma e estes termos a qualquer momento. O uso contínuo implica aceitação. Legislação aplicável: leis da República Federativa do Brasil.</p></div>
            </div>
            <div className="p-6 border-t border-white/5 shrink-0 rounded-b-3xl">
              <button onClick={() => setShowTerms(false)} className="w-full bg-emerald-500 hover:bg-emerald-400 text-[#050505] font-bold py-4 rounded-2xl transition-all active:scale-[0.98] uppercase tracking-wider text-sm">
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthGuard>
  );
}

