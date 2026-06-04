"use client";

import { motion, Variants } from "framer-motion";
import { Lock, Users, Star, ArrowDown } from "lucide-react";

export default function Hero() {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-24 overflow-hidden bg-[#272729]">
      {/* Vimeo video background in loop, muted, no controls */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Dark overlay on top of the video */}
        <div className="absolute inset-0 bg-black/65 z-10" />
        {/* Vimeo background embed: background=1 disables controls/UI, autoplay+loop+muted */}
        <iframe
          src="https://player.vimeo.com/video/382513364?background=1&autoplay=1&loop=1&byline=0&title=0&muted=1"
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[177.78vh] h-[56.25vw] min-w-full min-h-full"
          style={{ border: "none" }}
          allow="autoplay; fullscreen"
          aria-hidden="true"
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        {/* Floating Badge (Apple-inspired) */}
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-black/40 border border-white/10 rounded-full mb-8 backdrop-blur-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2997ff]" />
          <span className="font-sans text-[10px] text-white/80 uppercase tracking-[0.15em] font-semibold">
            Vagas abertas — Junho/2026
          </span>
        </div>

        {/* Hero Content with Stagger animations */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center"
        >
          <motion.h1 
            variants={itemVariants}
            className="font-sans text-4xl md:text-6xl lg:text-7xl font-bold -tracking-[0.025em] text-white max-w-4xl leading-[1.07] mb-6"
          >
            Sua equipe grava. Mas o que aparece na tela ainda <span className="text-[#2997ff]">parece amador</span>.
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="font-sans text-lg md:text-xl text-white/70 max-w-2xl leading-relaxed mb-10"
          >
            Nossas mentorias personalizadas treinam os seus colaboradores de forma presencial (inloco) ou online — com técnicas reais de direção de fotografia e color grading de quem já fez isso em produções de alto nível.
          </motion.p>

          {/* Action Buttons (Apple Action Blue and Ghost pill) */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 w-full sm:w-auto"
          >
            <a
              href="#contato"
              className="bg-[#0066cc] text-white font-sans text-sm font-medium px-8 py-3.5 rounded-full hover:bg-[#0071e3] active:scale-95 transition-all duration-150 w-full sm:w-auto inline-block"
            >
              Quero elevar minha produção
            </a>
            <a
              href="#recebe"
              className="border border-white/20 bg-white/5 backdrop-blur-sm text-white font-sans text-sm font-medium px-8 py-3.5 rounded-full hover:bg-white/10 active:scale-95 transition-all duration-150 w-full sm:w-auto inline-block"
            >
              Ver como funciona
            </a>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-12 border-t border-white/10 pt-8 w-full max-w-3xl"
          >
            <div className="flex items-center justify-center gap-3">
              <Lock size={16} className="text-[#2997ff] flex-shrink-0" />
              <span className="font-sans text-xs text-white/60 text-left tracking-wide">
                Sem contrato de fidelidade
              </span>
            </div>
            <div className="flex items-center justify-center gap-3">
              <Users size={16} className="text-[#2997ff] flex-shrink-0" />
              <span className="font-sans text-xs text-white/60 text-left tracking-wide">
                Turmas de 5 a 30 pessoas
              </span>
            </div>
            <div className="flex items-center justify-center gap-3">
              <Star size={16} className="text-[#2997ff] flex-shrink-0" />
              <span className="font-sans text-xs text-white/60 text-left tracking-wide">
                Mentoria presencial (inloco) ou online
              </span>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator chevron */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1 opacity-50">
        <span className="font-sans text-[8px] uppercase tracking-widest text-white/50">SCROLL</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <ArrowDown size={12} className="text-[#2997ff]" />
        </motion.div>
      </div>
    </section>
  );
}

