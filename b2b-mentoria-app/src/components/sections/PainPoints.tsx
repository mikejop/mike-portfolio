"use client";

import { motion, Variants } from "framer-motion";
import { VideoOff, DollarSign, Users, Palette, Settings, TrendingDown } from "lucide-react";

export default function PainPoints() {
  const cards = [
    {
      icon: <VideoOff size={22} />,
      title: "Resultado Amador",
      desc: "Sua equipe tem câmera, tem luz, mas o resultado final nunca convence. Falta aquele 'algo' que separa o amador do profissional."
    },
    {
      icon: <DollarSign size={22} />,
      title: "Desperdício de Equipamento",
      desc: "Você gasta com equipamentos caros e ainda assim o concorrente entrega vídeos mais impactantes com metade do orçamento."
    },
    {
      icon: <Users size={22} />,
      title: "Gargalo com Terceirização",
      desc: "Contratar uma agência para cada projeto sai caro demais. Mas treinar a equipe interna parece impossível sem parar a operação."
    },
    {
      icon: <Palette size={22} />,
      title: "Cores Sem Vida",
      desc: "A edição fica pronta, mas as cores parecem mortas, sem vida. Ninguém na equipe sabe exatamente o que está errado."
    },
    {
      icon: <Settings size={22} />,
      title: "Falta de Processo",
      desc: "Não existe um processo claro de produção. Cada projeto começa do zero, com retrabalho, atraso e custo não planejado."
    },
    {
      icon: <TrendingDown size={22} />,
      title: "Baixa Conversão",
      desc: "O conteúdo que você produz não converte, não engaja e não representa a qualidade real do seu produto ou serviço."
    }
  ];

  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  return (
    <section className="bg-[#f5f5f7] py-24 border-b border-[#e0e0e0]">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="font-sans text-[10px] uppercase tracking-[0.15em] text-[#0066cc] font-semibold mb-2 block">
            Diagnóstico de Dor
          </span>
          <h2 className="font-sans text-3xl md:text-5xl font-bold -tracking-[0.02em] text-[#1d1d1f]">
            Desafios e Gargalos Audiovisuais Comuns nas Empresas
          </h2>
        </div>

        {/* Cards Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16"
        >
          {cards.map((card, idx) => (
            <motion.div
              key={idx}
              variants={cardVariants}
              className="bg-white p-8 border border-black/[0.05] rounded-lg transition-all duration-300 group flex flex-col gap-4"
            >
              <div className="text-[#0066cc] p-3 bg-[#0066cc]/10 w-fit rounded-md group-hover:bg-[#0066cc] group-hover:text-white transition-all duration-300">
                {card.icon}
              </div>
              <h3 className="font-sans text-lg font-semibold text-[#1d1d1f] tracking-tight">
                {card.title}
              </h3>
              <p className="font-sans text-sm text-[#7a7a7a] leading-relaxed">
                {card.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Transition statement */}
        <div className="text-center max-w-2xl mx-auto pt-4 border-t border-[#e0e0e0]">
          <p className="font-sans text-sm md:text-base text-[#1d1d1f]/80 leading-relaxed">
            Se você se identificou com pelo menos{" "}
            <span className="text-[#0066cc] font-semibold">2 desses pontos</span>, as
            nossas mentorias personalizadas foram feitas para o seu time.
          </p>
        </div>
      </div>
    </section>
  );
}

