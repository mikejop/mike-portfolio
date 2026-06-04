"use client";

import { motion } from "framer-motion";
import { CheckCircle, Globe } from "lucide-react";

export default function AboutMentor() {
  const credentials = [
    "Diretor de Fotografia com portfólio em produções B2B e publicitárias",
    "Especialista em color grading para narrativas de marca",
    "Editor com foco em eficiência de workflow e entrega",
    "Criador de InfoSaaS para produtores de conteúdo corporativo",
    "Mentor de equipes internas em empresas de diversos setores"
  ];

  const socialLinks = [
    {
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
      ),
      href: "https://instagram.com/mike_flmmkr",
      text: "@mike_flmmkr"
    },
    {
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
          <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
        </svg>
      ),
      href: "https://www.youtube.com/@mikeflmmkr",
      text: "@mikeflmmkr"
    },
    {
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
          <rect x="2" y="9" width="4" height="12" />
          <circle cx="4" cy="4" r="2" />
        </svg>
      ),
      href: "https://www.linkedin.com/in/mkes8/",
      text: "@mkes8"
    },
    {
      icon: <Globe size={16} />,
      href: "https://michaeloliveira.online",
      text: "Portfólio"
    }
  ];

  return (
    <section id="mentor" className="bg-[#2a2a2c] py-24 border-b border-white/10">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="font-sans text-[10px] uppercase tracking-[0.15em] text-[#2997ff] font-semibold mb-2 block">
            Autoridade e Credibilidade
          </span>
        </div>

        {/* Two-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column - Photo & Socials */}
          <div className="lg:col-span-5 flex flex-col items-center">
            {/* Aspect-ratio portrait image box */}
            <div className="relative w-full max-w-[360px] aspect-[4/5] border border-white/10 bg-[#252527] overflow-hidden group mb-6 rounded-lg shadow-[rgba(0,0,0,0.35)_3px_5px_30px_0]">
              <div className="absolute inset-0 bg-gradient-to-t from-[#2a2a2c]/80 via-transparent to-transparent z-10 opacity-60" />
              <img
                src="/src/assets/michael_oliveira.jpg"
                alt="Michael Oliveira no set"
                className="w-full h-full object-cover filter grayscale contrast-110 group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
              />
              <div className="absolute bottom-4 left-4 z-20">
                <span className="font-sans text-[9px] text-[#2997ff] uppercase tracking-widest block font-bold mb-0.5">
                  Mentor Sênior
                </span>
                <p className="font-sans text-lg font-bold text-white tracking-tight">
                  Michael Oliveira
                </p>
              </div>
            </div>

            {/* Social Grid */}
            <div className="grid grid-cols-2 gap-4 w-full max-w-[360px]">
              {socialLinks.map((social, idx) => (
                <a
                  key={idx}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-white/70 hover:text-white border border-white/10 bg-white/5 py-2.5 px-3 hover:bg-white/10 transition-colors duration-300 rounded-md"
                >
                  <span className="text-[#2997ff]">{social.icon}</span>
                  <span className="font-sans truncate">{social.text}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Right Column - Bio & Credentials */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            <span className="font-sans text-[10px] uppercase tracking-wider text-white/50 font-semibold mb-3 block">
              DIRETOR DE FOTOGRAFIA • COLORISTA • EDITOR
            </span>
            <h3 className="font-sans text-3xl md:text-4xl font-bold text-white mb-6 -tracking-[0.02em]">
              Michael Oliveira
            </h3>
            
            <p className="font-sans text-base md:text-lg text-white/75 leading-relaxed mb-8">
              Michael passou anos descobrindo como fazer o impossível parecer simples: entregar imagens de nível cinematográfico dentro de orçamentos que a maioria dos profissionais recusaria. Essa especialização virou método. E o método virou a sua linha de Mentorias Corporativas.
            </p>

            <ul className="flex flex-col gap-4">
              {credentials.map((cred, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <CheckCircle size={16} className="text-[#2997ff] mt-1 flex-shrink-0" />
                  <span className="font-sans text-sm md:text-base text-white/70 leading-relaxed">
                    {cred}
                  </span>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>
    </section>
  );
}

