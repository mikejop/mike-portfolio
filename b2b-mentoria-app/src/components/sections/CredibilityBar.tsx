"use client";

import { motion } from "framer-motion";

export default function CredibilityBar() {
  const logos = [
    "GRUPO AMÉRICA",
    "GOODLOC",
    "ASTRONAUTAS FILMES",
    "NEXT VISION",
    "LUMITAZ AUDIOVISUAL",
    "MALALA FILMES",
    "FACULDADE FASTECH"
  ];

  return (
    <section className="bg-black border-y border-white/10 py-12 md:py-16 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6">
        {/* Logos container */}
        <div className="flex flex-col items-center mb-10 md:mb-12">
          <span className="font-sans text-[10px] uppercase tracking-[0.15em] text-white/40 mb-6 font-semibold">
            Profissional reconhecido por parceiros como
          </span>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
            {logos.map((logo, index) => (
              <span
                key={index}
                className="font-sans text-base md:text-lg font-extrabold text-white/50 hover:text-white transition-colors duration-300 tracking-wider cursor-default select-none filter grayscale hover:grayscale-0"
              >
                {logo}
              </span>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-white/10">
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <span className="font-sans text-3xl md:text-4xl font-semibold text-[#2997ff] mb-1">
              +8 anos
            </span>
            <span className="font-sans text-xs text-white/60">
              de experiência prática e mentoria
            </span>
          </div>
          
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <span className="font-sans text-3xl md:text-4xl font-semibold text-[#2997ff] mb-1">
              +50 empresas
            </span>
            <span className="font-sans text-xs text-white/60">
              mentoradas com projetos ativos
            </span>
          </div>

          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <span className="font-sans text-3xl md:text-4xl font-semibold text-[#2997ff] mb-1">
              +200 profissionais
            </span>
            <span className="font-sans text-xs text-white/60">
              treinados com o método de Michael
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

