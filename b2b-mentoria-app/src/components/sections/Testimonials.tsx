"use client";

import { motion } from "framer-motion";

export default function Testimonials() {
  const testimonials = [
    {
      text: "A equipe interna passou de gravadores amadores para verdadeiros realizadores. Hoje, entregamos vídeos comerciais para nossa marca com qualidade de cinema, economizando milhares de reais que antes iam para agências externas.",
      name: "Rodrigo Almeida",
      role: "Head de Marketing, TechPrime Corp"
    },
    {
      text: "A consultoria de workflow do Michael mudou completamente nossa rotina. O que levava 3 dias de pós-produção e ajustes de cor agora resolvemos em menos de 4 horas com templates precisos no DaVinci Resolve.",
      name: "Ana Julia Santos",
      role: "Diretora Criativa, GoodVibe Studio"
    },
    {
      text: "Minha equipe de filmagem aprendeu a extrair imagens cinematográficas usando apenas luz natural e equipamentos que nós já tínhamos na empresa. O retorno do investimento foi imediato logo no primeiro lançamento corporativo.",
      name: "Felipe Mendes",
      role: "Diretor Executivo, Grupo Conecta"
    }
  ];

  return (
    <section className="bg-white py-24 border-b border-[#e0e0e0]">
      <div className="max-w-6xl mx-auto px-6">
        
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="font-sans text-[10px] uppercase tracking-[0.15em] text-[#0066cc] font-semibold mb-2 block">
            Depoimentos de Sucesso
          </span>
          <h2 className="font-sans text-3xl md:text-5xl font-bold -tracking-[0.02em] text-[#1d1d1f]">
            Casos de Sucesso e Depoimentos de Clientes
          </h2>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {testimonials.map((test, idx) => (
            <div
              key={idx}
              className="bg-[#fafafc] p-8 border border-black/[0.06] rounded-lg relative flex flex-col justify-between transition-all duration-300 hover:border-black/10"
            >
              {/* Quote marks */}
              <div 
                className="absolute top-4 right-6 font-sans text-5xl text-[#0066cc] opacity-10 select-none pointer-events-none"
                aria-hidden="true"
              >
                “
              </div>
              
              <p className="font-sans text-sm text-[#7a7a7a] leading-relaxed mb-8 italic relative z-10">
                "{test.text}"
              </p>

              {/* Depoente Info */}
              <div className="flex items-center gap-4 border-t border-black/[0.05] pt-4">
                {/* Rounded avatar placeholder */}
                <div className="w-10 h-10 bg-[#f5f5f7] border border-black/[0.05] flex items-center justify-center font-sans text-[#1d1d1f] font-semibold text-sm rounded-full">
                  {test.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-sans text-sm font-semibold text-[#1d1d1f]">
                    {test.name}
                  </h3>
                  <p className="font-sans text-xs text-[#7a7a7a]">
                    {test.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Transition callout */}
        <div className="text-center flex flex-col items-center gap-6">
          <p className="font-sans text-sm text-[#7a7a7a]">
            Mais de <span className="text-[#0066cc] font-semibold">200 profissionais</span> já transformaram a forma como produzem.
          </p>
          <a
            href="#contato"
            className="bg-[#0066cc] text-white font-sans text-xs font-semibold rounded-full px-8 py-3 hover:bg-[#0071e3] active:scale-95 transition-all duration-150 inline-block shadow-sm"
          >
            Quero fazer parte
          </a>
        </div>

      </div>
    </section>
  );
}

