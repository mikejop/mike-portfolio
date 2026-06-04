import { LayoutDashboard, FileText, Wrench } from "lucide-react";

export default function InfoSaaS() {
  const tools = [
    {
      icon: <LayoutDashboard size={18} />,
      title: "Planejamento & Controle",
      desc: "Sistemas de planejamento e controle de produção pensados para equipes enxutas"
    },
    {
      icon: <FileText size={18} />,
      title: "Templates de Produção",
      desc: "Templates e frameworks de briefing, pré-produção e aprovação de projetos"
    },
    {
      icon: <Wrench size={18} />,
      title: "Guias & Referências",
      desc: "Referências técnicas e guias práticos de cinematografia e color grading"
    }
  ];

  return (
    <section className="bg-[#252527] py-24 border-b border-white/10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Column - Content */}
          <div>
            <span className="font-sans text-[10px] uppercase tracking-[0.15em] text-[#2997ff] font-semibold mb-2 block">
              Diferencial Exclusivo
            </span>
            <h2 className="font-sans text-3xl md:text-5xl font-bold -tracking-[0.02em] text-white mb-6 leading-tight">
              InfoSaaS e Ferramentas inclusas na Mentoria
            </h2>
            <p className="font-sans text-sm md:text-base text-white/70 leading-relaxed mb-8">
              Todo mentorado recebe acesso aos InfoSaaS produzidos pelo Michael Oliveira — ferramentas práticas desenvolvidas especificamente para profissionais de produção audiovisual que precisam ser eficientes no dia a dia.
            </p>

            <div className="flex flex-col gap-6 mb-8">
              {tools.map((tool, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="text-[#2997ff] p-2 bg-white/5 border border-white/10 h-fit rounded-md">
                    {tool.icon}
                  </div>
                  <div>
                    <h3 className="font-sans text-sm font-semibold text-white mb-1">
                      {tool.title}
                    </h3>
                    <p className="font-sans text-xs md:text-sm text-white/60 leading-relaxed">
                      {tool.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="inline-flex px-3 py-1.5 bg-[#2997ff]/10 border border-[#2997ff]/20 rounded-full">
              <span className="font-sans text-[10px] text-[#2997ff] uppercase tracking-wider font-semibold">
                Acesso incluído em todos os pacotes — sem custo adicional
              </span>
            </div>
          </div>

          {/* Right Column - UI Mockup */}
          <div className="bg-[#1d1d1f] border border-white/10 rounded-lg p-6 shadow-2xl relative overflow-hidden group">
            {/* Top Bar */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
              </div>
              <span className="font-sans text-[9px] text-white/40 uppercase tracking-widest font-semibold">
                PIPELINE_DASHBOARD_V1
              </span>
            </div>

            {/* Dashboard Mockup Content */}
            <div className="font-mono text-[11px] text-white/60 flex flex-col gap-4">
              <div className="bg-white/5 p-4 border border-white/10 rounded-md">
                <span className="text-[#2997ff]">&gt; INIT PIPELINE SETUP</span>
                <p className="text-white/40 mt-1">Configuring Sony FX6 to DaVinci Resolve color managed workspace...</p>
                <div className="flex justify-between items-center mt-3 text-[10px] text-white/40 border-t border-white/10 pt-2">
                  <span>INPUT: S-Log3 / SGamut3.Cine</span>
                  <span className="text-emerald-400 font-semibold">STATUS: MATCHED [100%]</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-4 border border-white/10 rounded-md">
                  <span className="text-white/40 text-[10px] block mb-1">PRODUÇÕES ATIVAS</span>
                  <span className="text-xl font-semibold text-white font-sans">08</span>
                  <span className="text-[9px] text-emerald-400 block mt-1">NO CRITICAL DELAYS</span>
                </div>
                <div className="bg-white/5 p-4 border border-white/10 rounded-md">
                  <span className="text-white/40 text-[10px] block mb-1">ORÇAMENTO POUPADO</span>
                  <span className="text-xl font-semibold text-[#2997ff] font-sans">42%</span>
                  <span className="text-[9px] text-white/40 block mt-1">vs EXTERNAL AGENCY</span>
                </div>
              </div>

              {/* Timeline mockup */}
              <div className="bg-white/5 p-4 border border-white/10 rounded-md flex flex-col gap-2">
                <span className="text-[10px] text-white/40">WORKFLOW TIMELINE ESTIMATION</span>
                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden flex">
                  <div className="h-full bg-[#0066cc] w-1/3" />
                  <div className="h-full bg-[#2997ff] w-1/4" />
                  <div className="h-full bg-white/10 w-5/12" />
                </div>
                <div className="flex justify-between text-[8px] text-white/40">
                  <span>PRE-PROD</span>
                  <span>FILMING</span>
                  <span>POST-PRODUCTION</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

