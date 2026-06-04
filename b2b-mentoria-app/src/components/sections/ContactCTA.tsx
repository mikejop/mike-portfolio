"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Send, Mail, Phone, Globe, Check } from "lucide-react";

const formSchema = z.object({
  fullName: z.string().min(2, "Nome é obrigatório").max(100, "Máximo de 100 caracteres"),
  email: z.string().email("E-mail inválido").max(150, "Máximo de 150 caracteres"),
  phone: z.string().min(8, "Telefone é obrigatório").max(30, "Máximo de 30 caracteres"),
  companyName: z.string().min(2, "Nome da empresa é obrigatório").max(100, "Máximo de 100 caracteres"),
  teamSize: z.string().min(1, "Selecione o tamanho da equipe"),
});

type FormData = z.infer<typeof formSchema>;

export default function ContactCTA() {
  const [isSubmitSuccess, setIsSubmitSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setSubmitError("");
    try {
      const waText = `Olá Michael! Solicitei uma proposta de mentoria técnica pelo site michaeloliveira.online:
• *Nome*: ${data.fullName}
• *Empresa*: ${data.companyName}
• *E-mail*: ${data.email}
• *Telefone*: ${data.phone}
• *Tamanho da Equipe*: ${data.teamSize}`;
      const waUrl = `https://wa.me/5511994822209?text=${encodeURIComponent(waText)}`;

      setIsSubmitSuccess(true);
      reset();

      setTimeout(() => {
        window.open(waUrl, "_blank");
      }, 1000);
    } catch (err) {
      console.error("Erro ao processar contato:", err);
      setSubmitError("Erro ao processar sua solicitação. Por favor, tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactItems = [
    { icon: <Mail size={16} />, text: "contato@michaeloliveira.online", href: "mailto:contato@michaeloliveira.online" },
    { icon: <Phone size={16} />, text: "+55 (11) 99482-2209", href: "https://wa.me/5511994822209" },
    {
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
      ),
      text: "@mike_flmmkr",
      href: "https://instagram.com/mike_flmmkr"
    },
    {
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
          <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
        </svg>
      ),
      text: "@mikeflmmkr",
      href: "https://www.youtube.com/@mikeflmmkr"
    },
    {
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
          <rect x="2" y="9" width="4" height="12" />
          <circle cx="4" cy="4" r="2" />
        </svg>
      ),
      text: "@mkes8",
      href: "https://www.linkedin.com/in/mkes8/"
    },
    { icon: <Globe size={16} />, text: "michaeloliveira.online", href: "https://michaeloliveira.online" },
  ];

  return (
    <section id="contato" className="bg-black py-24 border-b border-white/10 relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* Left Column - Copy and Info */}
          <div className="lg:col-span-5">
            <span className="font-sans text-[10px] uppercase tracking-[0.15em] text-[#2997ff] font-semibold mb-2 block">
              Pronto para o Próximo Nível?
            </span>
            <h2 className="font-sans text-3xl md:text-5xl font-bold -tracking-[0.02em] text-white mb-6 leading-tight">
              Solicite um Orçamento de Treinamento Audiovisual Corporativo
            </h2>
            <p className="font-sans text-sm md:text-base text-white/70 leading-relaxed mb-12">
              Preencha o formulário e receba uma proposta personalizada para o tamanho e o momento da sua empresa.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {contactItems.map((item, idx) => (
                <a
                  key={idx}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 border border-white/10 bg-white/5 py-3.5 px-4 rounded-md hover:border-[#2997ff] hover:bg-white/10 transition-all duration-300"
                >
                  <span className="text-[#2997ff] flex-shrink-0">{item.icon}</span>
                  <span className="font-sans text-xs truncate text-white/70">
                    {item.text}
                  </span>
                </a>
              ))}
            </div>
          </div>

          {/* Right Column - Form */}
          <div className="lg:col-span-7">
            <div className="bg-[#1d1d1f] border border-white/10 p-8 md:p-12 rounded-lg shadow-2xl relative">
              {isSubmitSuccess ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-[#0066cc]/10 border border-[#0066cc]/30 flex items-center justify-center text-[#2997ff] mb-6 animate-bounce">
                    <Check size={28} />
                  </div>
                  <h3 className="font-sans text-2xl font-bold text-white mb-2">
                    Proposta solicitada!
                  </h3>
                  <p className="font-sans text-sm text-white/75 max-w-sm mb-6">
                    Michael entrará em contato com você em até 24 horas para alinhar os detalhes.
                  </p>
                  <button
                    onClick={() => setIsSubmitSuccess(false)}
                    className="border border-white/10 bg-white/5 text-white px-6 py-2.5 rounded-full font-sans text-xs font-semibold hover:bg-white/10 active:scale-95 transition-all"
                  >
                    Enviar nova solicitação
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
                  {/* Full Name */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="fullName" className="font-sans text-xs font-semibold text-white/50">
                      Nome completo *
                    </label>
                    <input
                      id="fullName"
                      type="text"
                      className={`bg-white/5 border ${
                        errors.fullName ? "border-red-500/50 focus:border-red-500" : "border-white/10 focus:border-[#2997ff]"
                      } text-white px-4 py-3 rounded-md font-sans text-sm focus:outline-none transition-colors`}
                      placeholder="Rodrigo Silva"
                      {...register("fullName")}
                    />
                    {errors.fullName && (
                      <span className="text-red-400 text-[10px] font-sans mt-0.5">{errors.fullName.message}</span>
                    )}
                  </div>

                  {/* Email */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="email" className="font-sans text-xs font-semibold text-white/50">
                      E-mail corporativo *
                    </label>
                    <input
                      id="email"
                      type="email"
                      className={`bg-white/5 border ${
                        errors.email ? "border-red-500/50 focus:border-red-500" : "border-white/10 focus:border-[#2997ff]"
                      } text-white px-4 py-3 rounded-md font-sans text-sm focus:outline-none transition-colors`}
                      placeholder="rodrigo@produtora.com.br"
                      {...register("email")}
                    />
                    {errors.email && (
                      <span className="text-red-400 text-[10px] font-sans mt-0.5">{errors.email.message}</span>
                    )}
                  </div>

                  {/* Two columns Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Phone */}
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="phone" className="font-sans text-xs font-semibold text-white/50">
                        Telefone / WhatsApp *
                      </label>
                      <input
                        id="phone"
                        type="tel"
                        className={`bg-white/5 border ${
                          errors.phone ? "border-red-500/50 focus:border-red-500" : "border-white/10 focus:border-[#2997ff]"
                      } text-white px-4 py-3 rounded-md font-sans text-sm focus:outline-none transition-colors`}
                        placeholder="(11) 99999-9999"
                        {...register("phone")}
                      />
                      {errors.phone && (
                        <span className="text-red-400 text-[10px] font-sans mt-0.5">{errors.phone.message}</span>
                      )}
                    </div>

                    {/* Company */}
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="companyName" className="font-sans text-xs font-semibold text-white/50">
                        Nome da empresa *
                      </label>
                      <input
                        id="companyName"
                        type="text"
                        className={`bg-white/5 border ${
                          errors.companyName ? "border-red-500/50 focus:border-red-500" : "border-white/10 focus:border-[#2997ff]"
                      } text-white px-4 py-3 rounded-md font-sans text-sm focus:outline-none transition-colors`}
                        placeholder="CineStudio Produções"
                        {...register("companyName")}
                      />
                      {errors.companyName && (
                        <span className="text-red-400 text-[10px] font-sans mt-0.5">{errors.companyName.message}</span>
                      )}
                    </div>
                  </div>

                  {/* Team Size Select */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="teamSize" className="font-sans text-xs font-semibold text-white/50">
                      Número de pessoas a serem treinadas *
                    </label>
                    <select
                      id="teamSize"
                      className={`bg-white/5 border ${
                        errors.teamSize ? "border-red-500/50 focus:border-red-500" : "border-white/10 focus:border-[#2997ff]"
                      } text-white px-4 py-3 rounded-md font-sans text-sm focus:outline-none transition-colors appearance-none cursor-pointer`}
                      style={{
                        backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-opacity='0.4' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "right 1rem center",
                        backgroundSize: "1rem"
                      }}
                      {...register("teamSize")}
                    >
                      <option value="" className="bg-[#1d1d1f]">Selecione o tamanho da equipe...</option>
                      <option value="5" className="bg-[#1d1d1f]">5 pessoas (Starter)</option>
                      <option value="10" className="bg-[#1d1d1f]">10 pessoas (Growth)</option>
                      <option value="15" className="bg-[#1d1d1f]">15 pessoas (Scale)</option>
                      <option value="30" className="bg-[#1d1d1f]">30 pessoas (Enterprise)</option>
                      <option value="Outro" className="bg-[#1d1d1f]">Outro (Proposta sob medida)</option>
                    </select>
                    {errors.teamSize && (
                      <span className="text-red-400 text-[10px] font-sans mt-0.5">{errors.teamSize.message}</span>
                    )}
                  </div>

                  {/* Error messaging */}
                  {submitError && (
                    <div className="text-red-400 text-xs font-sans text-center bg-red-500/5 border border-red-500/10 p-3 rounded-md">
                      {submitError}
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-[#0066cc] text-white py-4 font-sans text-sm font-semibold rounded-full hover:bg-[#0071e3] transition-all duration-150 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    <span>{isSubmitting ? "Enviando..." : "Solicitar proposta"}</span>
                    {!isSubmitting && <Send size={14} />}
                  </button>
                </form>
              )}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

