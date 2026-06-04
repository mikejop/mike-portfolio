"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function WhatYouGet() {
  const block1 = [
    "Direção de Fotografia: luz, enquadramento, composição e narrativa visual",
    "Teoria Cinematográfica: estética da imagem, referências e linguagem",
    "Técnicas para imagens cinemáticas com equipamentos acessíveis",
    "Color Grading: teoria e técnica do início ao fim",
    "Workflow de produção personalizado para o seu negócio",
    "Acesso aos InfoSaaS exclusivos do Michael Oliveira"
  ];

  const block2 = [
    "Análise e reformulação da estrutura da produtora",
    "Criação de workflow de produção do zero",
    "Consultoria para escolha correta de equipamentos (economia + eficiência)",
    "Planejamento e gerência de projetos audiovisuais",
    "Estrutura interna: papéis, processos e escalabilidade"
  ];

  return (
    <section id="recebe" className="bg-white py-24 border-b border-[#e0e0e0]">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16 md:mb-20">
          <span className="font-sans text-[10px] uppercase tracking-[0.15em] text-[#0066cc] font-semibold mb-2 block">
            Proposta de Valor
          </span>
          <h2 className="font-sans text-3xl md:text-5xl font-bold -tracking-[0.02em] text-[#1d1d1f]">
            O que a nossa Mentoria entrega para a sua equipe
          </h2>
        </div>

        {/* Modules Stack */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Module 1 */}
          <div className="bg-[#fafafc] p-8 md:p-12 border border-black/[0.06] rounded-lg transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="inline-flex px-2.5 py-1 bg-black/[0.05] text-[9px] font-sans text-neutral-600 font-semibold uppercase tracking-wider rounded-full mb-6">
                NÚCLEO PRINCIPAL
              </div>
              <h3 className="font-sans text-2xl md:text-3xl font-semibold text-[#1d1d1f] mb-4 tracking-tight">
                Treinamento cinematográfico para o seu time
              </h3>
              <p className="font-sans text-sm md:text-base text-[#7a7a7a] leading-relaxed mb-8">
                Disponível presencialmente (inloco no seu set de produção ou empresa) ou de forma remota (online e ao vivo). Michael trabalha diretamente com os seus colaboradores para trazer teoria e prática adequadas ao contexto real da sua operação.
              </p>
            </div>
            
            <div>
              <h4 className="font-sans text-[10px] uppercase tracking-wider text-[#1d1d1f]/40 font-bold mb-4 border-b border-black/[0.05] pb-2">
                O QUE ESTÁ INCLUÍDO
              </h4>
              <ul className="flex flex-col gap-3">
                {block1.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <ArrowRight size={13} className="text-[#0066cc] mt-1.5 flex-shrink-0" />
                    <span className="font-sans text-xs md:text-sm text-[#1d1d1f]/85">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Module 2 */}
          <div className="bg-[#fafafc] p-8 md:p-12 border border-black/[0.06] rounded-lg transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="inline-flex px-2.5 py-1 bg-black/[0.05] text-[9px] font-sans text-neutral-600 font-semibold uppercase tracking-wider rounded-full mb-6">
                MÓDULO COMPLEMENTAR
              </div>
              <h3 className="font-sans text-2xl md:text-3xl font-semibold text-[#1d1d1f] mb-4 tracking-tight">
                Estruture sua produtora do jeito certo
              </h3>
              <p className="font-sans text-sm md:text-base text-[#7a7a7a] leading-relaxed mb-8">
                Para quem quer ir além da técnica e construir uma operação de produção eficiente, rentável e escalável.
              </p>
            </div>
            
            <div>
              <h4 className="font-sans text-[10px] uppercase tracking-wider text-[#1d1d1f]/40 font-bold mb-4 border-b border-black/[0.05] pb-2">
                O QUE ESTÁ INCLUÍDO
              </h4>
              <ul className="flex flex-col gap-3">
                {block2.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <ArrowRight size={13} className="text-[#0066cc] mt-1.5 flex-shrink-0" />
                    <span className="font-sans text-xs md:text-sm text-[#1d1d1f]/85">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

