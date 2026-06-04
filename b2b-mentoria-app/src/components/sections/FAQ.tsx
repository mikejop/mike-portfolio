"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

export default function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const toggleAccordion = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  const questions = [
    {
      q: "A mentoria é presencial ou online?",
      a: "As mentorias podem ser presenciais (inloco, com Michael indo até a sua empresa) ou online e ao vivo para todo o Brasil. Isso garante flexibilidade para atender o seu time onde quer que ele esteja, adaptando o treinamento ao contexto e equipamentos da sua equipe."
    },
    {
      q: "Quantas sessões estão incluídas em cada pacote?",
      a: "O número de sessões é definido de acordo com o pacote contratado e o diagnóstico da equipe. Todos os detalhes são alinhados antes do início, para que o conteúdo faça sentido para o nível atual do seu time."
    },
    {
      q: "Precisa ter equipamento profissional?",
      a: "Não. Uma das especialidades do Michael é exatamente ensinar como extrair o máximo de equipamentos acessíveis. A mentoria parte do que você já tem e mostra como usá-lo com intenção cinematográfica."
    },
    {
      q: "Os InfoSaaS têm custo adicional?",
      a: "Não. O acesso aos InfoSaaS é incluído em todos os pacotes, sem cobrança separada."
    },
    {
      q: "É possível contratar apenas a consultoria de produtora, sem a mentoria técnica?",
      a: "Sim. A consultoria de estruturação de produtora pode ser contratada de forma independente. Entre em contato para entender o formato mais adequado para a sua necessidade."
    },
    {
      q: "Qual é o prazo para início após a contratação?",
      a: "Após a assinatura do contrato, o início é agendado conforme a disponibilidade da equipe e do Michael. Em geral, as primeiras sessões acontecem em até 15 dias úteis."
    },
    {
      q: "O treinamento é personalizado para o nosso negócio?",
      a: "Sim. Antes do início, Michael realiza um diagnóstico da equipe e da produção atual da empresa. O conteúdo é adaptado para o contexto, as metas e os desafios específicos do seu time."
    },
    {
      q: "Como funciona o pagamento?",
      a: "Os valores e condições de pagamento são definidos na proposta comercial, com opções de parcelamento conforme o pacote. Entre em contato para receber uma proposta detalhada."
    }
  ];

  return (
    <section id="faq" className="bg-[#f5f5f7] py-24 border-b border-[#e0e0e0]">
      <div className="max-w-3xl mx-auto px-6">
        
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="font-sans text-[10px] uppercase tracking-[0.15em] text-[#0066cc] font-semibold mb-2 block">
            Dúvidas Frequentes
          </span>
          <h2 className="font-sans text-3xl md:text-5xl font-bold -tracking-[0.02em] text-[#1d1d1f]">
            Perguntas Frequentes sobre as Mentorias
          </h2>
        </div>

        {/* Accordion list */}
        <div className="flex flex-col border-t border-black/[0.08]">
          {questions.map((item, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="border-b border-black/[0.08] bg-transparent overflow-hidden transition-all duration-300"
              >
                <h3 className="m-0 p-0">
                  <button
                    onClick={() => toggleAccordion(idx)}
                    className="w-full text-left py-5 flex justify-between items-center gap-4 text-[#1d1d1f] focus:outline-none cursor-pointer"
                    aria-expanded={isOpen}
                  >
                    <span className="font-sans text-sm md:text-base font-semibold text-[#1d1d1f] tracking-tight">
                      {item.q}
                    </span>
                    <Plus
                      size={16}
                      className={`text-[#0066cc] flex-shrink-0 transition-transform duration-300 ${
                        isOpen ? "rotate-45" : "rotate-0"
                      }`}
                    />
                  </button>
                </h3>
                
                <div
                  className={`transition-all duration-300 ease-in-out ${
                    isOpen ? "max-h-[300px]" : "max-h-0"
                  } overflow-hidden`}
                >
                  <p className="pb-5 pr-8 font-sans text-xs md:text-sm text-[#7a7a7a] leading-relaxed bg-transparent">
                    {item.a}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}

