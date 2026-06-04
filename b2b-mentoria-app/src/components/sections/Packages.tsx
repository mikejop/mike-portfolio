"use client";

import { Info } from "lucide-react";

export default function Packages() {
  const tiers = [
    {
      title: "PACOTE STARTER",
      subtitle: "Para times enxutos",
      seats: "5 pessoas",
      ideal: "Ideal para: startups, empresas que estão montando a primeira célula de produção",
      buttonText: "Falar sobre este pacote",
      featured: false,
      outline: false,
    },
    {
      title: "PACOTE GROWTH",
      subtitle: "Para equipes em expansão",
      seats: "10 pessoas",
      ideal: "Ideal para: empresas com produção regular que querem padronizar qualidade",
      buttonText: "Falar sobre este pacote",
      featured: false,
      outline: false,
    },
    {
      title: "PACOTE SCALE",
      subtitle: "Para times consolidados",
      seats: "15 pessoas",
      ideal: "Ideal para: produtoras internas de médias empresas com demanda contínua",
      buttonText: "Falar sobre este pacote",
      featured: true,
      badge: "MAIS ESCOLHIDO",
      outline: false,
    },
    {
      title: "PACOTE ENTERPRISE",
      subtitle: "Para grandes equipes",
      seats: "30 pessoas",
      ideal: "Ideal para: empresas com múltiplos projetos simultâneos e times departamentalizados",
      buttonText: "Solicitar proposta personalizada",
      featured: false,
      outline: true,
    }
  ];

  return (
    <section id="pacotes" className="bg-[#f5f5f7] py-24 border-b border-[#e0e0e0]">
      <div className="max-w-6xl mx-auto px-6">
        
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="font-sans text-[10px] uppercase tracking-[0.15em] text-[#0066cc] font-semibold mb-2 block">
            Preços e Planos
          </span>
          <h2 className="font-sans text-3xl md:text-5xl font-bold -tracking-[0.02em] text-[#1d1d1f] mb-4">
            Pacotes de Mentoria Audiovisual Corporativa Inloco
          </h2>
          <p className="font-sans text-sm md:text-base text-[#7a7a7a] max-w-xl mx-auto">
            Todos os pacotes incluem mentoria inloco ou online + acesso aos InfoSaaS do Michael
          </p>
        </div>

        {/* Tiers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch mb-12">
          {tiers.map((tier, idx) => (
            <div
              key={idx}
              className={`p-8 border rounded-lg flex flex-col justify-between transition-all duration-300 relative ${
                tier.featured
                  ? "bg-[#272729] text-white border-transparent lg:scale-105 shadow-[rgba(0,0,0,0.15)_0px_10px_30px_0px] z-10"
                  : "bg-white text-[#1d1d1f] border-black/[0.06] hover:border-black/20"
              }`}
            >
              {tier.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0066cc] text-white font-sans text-[9px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
                  {tier.badge}
                </div>
              )}
              
              <div>
                <span className={`font-sans text-[10px] uppercase tracking-wider font-semibold ${
                  tier.featured ? "text-white/50" : "text-[#1d1d1f]/50"
                }`}>
                  {tier.title}
                </span>
                <h3 className={`font-sans text-xl font-semibold mt-1 mb-4 tracking-tight ${
                  tier.featured ? "text-white" : "text-[#1d1d1f]"
                }`}>
                  {tier.subtitle}
                </h3>
                
                {/* Seats Count */}
                <div className={`font-sans text-xs px-3 py-1.5 w-fit rounded-full mb-6 uppercase tracking-wider border font-medium ${
                  tier.featured 
                    ? "text-[#2997ff] bg-white/5 border-white/10" 
                    : "text-[#1d1d1f]/80 bg-[#f5f5f7] border-black/[0.05]"
                }`}>
                  Até {tier.seats}
                </div>
                
                {/* Price block */}
                <div className="mb-6">
                  <span className={`font-sans text-3xl font-bold tracking-tight ${
                    tier.featured ? "text-[#2997ff]" : "text-[#0066cc]"
                  }`}>
                    [Consulte]
                  </span>
                  <span className={`font-sans text-[10px] block mt-1 ${
                    tier.featured ? "text-white/40" : "text-black/40"
                  }`}>
                    Valor sob consulta corporativa
                  </span>
                </div>
                
                <p className={`font-sans text-xs leading-relaxed border-t pt-4 mb-8 ${
                  tier.featured ? "border-white/10 text-white/70" : "border-black/[0.06] text-[#7a7a7a]"
                }`}>
                  {tier.ideal}
                </p>
              </div>

              <a
                href="#contato"
                className={`w-full block py-3 text-center font-sans text-xs font-semibold rounded-full active:scale-95 transition-all duration-150 ${
                  tier.featured
                    ? "bg-[#0066cc] text-white hover:bg-[#0071e3]"
                    : tier.outline
                    ? "border border-[#0066cc] text-[#0066cc] hover:bg-[#0066cc]/5"
                    : "bg-[#0066cc] text-white hover:bg-[#0071e3]"
                }`}
              >
                {tier.buttonText}
              </a>
            </div>
          ))}
        </div>

        {/* Note below */}
        <div className="flex items-center justify-center gap-2.5 max-w-xl mx-auto p-4 bg-white border border-black/[0.05] rounded-md">
          <Info size={16} className="text-[#0066cc] flex-shrink-0" />
          <p className="font-sans text-xs text-[#7a7a7a] text-left leading-relaxed">
            Todos os valores são consultivos. Entre em contato para receber uma proposta detalhada para o seu contexto operacional.
          </p>
        </div>

      </div>
    </section>
  );
}

