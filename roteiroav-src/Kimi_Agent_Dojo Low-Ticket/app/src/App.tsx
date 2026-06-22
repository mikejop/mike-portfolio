import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, 
  Target, 
  TrendingUp, 
  Globe, 
  Users, 
  Zap, 
  BookOpen, 
  Video, 
  Headphones, 
  Wrench, 
  MessageCircle, 
  ArrowRight,
  CheckCircle2,
  Play,
  DollarSign,
  BarChart3,
  Rocket,
  Award,
  Layers,
  Sparkles,
  Menu,
  X,
  Calendar,
  Lightbulb,
  Megaphone,
  Share2,
  FileText,
  Palette,
  Briefcase,
  GraduationCap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Navigation Component
function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-slate-950/95 backdrop-blur-md border-b border-slate-800' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Dojo</span>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollToSection('estrategias')} className="text-slate-300 hover:text-white transition-colors text-sm font-medium">
              Estratégias
            </button>
            <button onClick={() => scrollToSection('aplicacao')} className="text-slate-300 hover:text-white transition-colors text-sm font-medium">
              Aplicação
            </button>
            <button onClick={() => scrollToSection('conteudo')} className="text-slate-300 hover:text-white transition-colors text-sm font-medium">
              Calendário
            </button>
            <button onClick={() => scrollToSection('planos')} className="text-slate-300 hover:text-white transition-colors text-sm font-medium">
              Planos
            </button>
            <Button 
              onClick={() => scrollToSection('cta')}
              className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white border-0"
            >
              Começar Agora
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-slate-900/95 backdrop-blur-md border-t border-slate-800 overflow-hidden"
            >
              <div className="py-4 space-y-4">
                <button onClick={() => scrollToSection('estrategias')} className="block w-full text-left text-slate-300 hover:text-white px-4 py-2">
                  Estratégias
                </button>
                <button onClick={() => scrollToSection('aplicacao')} className="block w-full text-left text-slate-300 hover:text-white px-4 py-2">
                  Aplicação na Dojo
                </button>
                <button onClick={() => scrollToSection('conteudo')} className="block w-full text-left text-slate-300 hover:text-white px-4 py-2">
                  Calendário de Conteúdo
                </button>
                <button onClick={() => scrollToSection('planos')} className="block w-full text-left text-slate-300 hover:text-white px-4 py-2">
                  Planos
                </button>
                <div className="px-4">
                  <Button 
                    onClick={() => scrollToSection('cta')}
                    className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"
                  >
                    Começar Agora
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}

// Hero Section
function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-950">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-fuchsia-600/20 rounded-full blur-[128px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge className="mb-6 bg-violet-500/20 text-violet-300 border-violet-500/30 hover:bg-violet-500/30">
              <Sparkles className="w-3 h-3 mr-1" />
              Estratégias Comprovadas
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight"
          >
            Domine as Estratégias{' '}
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
              Low-Ticket
            </span>
            <br />
            <span className="text-2xl md:text-4xl lg:text-5xl font-medium text-slate-400">
              e Escale sua Dojo
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto mb-10"
          >
            Aprenda as mesmas estratégias que geram milhões em vendas com produtos de baixo custo. 
            Do Brasil ao mundo: descubra como aplicar low-ticket na sua comunidade para conquistar 
            mais membros e escalar internacionalmente.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button 
              size="lg"
              className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white px-8 py-6 text-lg font-semibold group"
              onClick={() => document.getElementById('estrategias')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Ver Estratégias
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white px-8 py-6 text-lg"
              onClick={() => document.getElementById('aplicacao')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Play className="mr-2 w-5 h-5" />
              Ver Aplicação na Dojo
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {[
              { value: '3', label: 'Especialistas Analisados', icon: Users },
              { value: '60K+', label: 'Alunos Conquistados', icon: TrendingUp },
              { value: 'R$100K+', label: 'Faturamento Médio', icon: DollarSign },
              { value: 'Global', label: 'Alcance Internacional', icon: Globe },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <stat.icon className="w-6 h-6 text-violet-400 mx-auto mb-2" />
                <div className="text-2xl md:text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-slate-400">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// Strategy Card Component
function StrategyCard({ 
  title, 
  description, 
  icon: Icon, 
  color,
  tips 
}: { 
  title: string; 
  description: string; 
  icon: React.ElementType; 
  color: string;
  tips: string[];
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="h-full"
    >
      <Card className="h-full bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-all cursor-pointer overflow-hidden"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardContent className="p-6">
          <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center mb-4`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
          <p className="text-slate-400 mb-4">{description}</p>
          
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t border-slate-800 pt-4 mt-4"
              >
                <p className="text-sm font-semibold text-violet-400 mb-2">Dicas Práticas:</p>
                <ul className="space-y-2">
                  {tips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="flex items-center text-violet-400 text-sm mt-4">
            {isExpanded ? 'Ver menos' : 'Ver mais'}
            <ChevronRight className={`w-4 h-4 ml-1 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Strategies Section
function StrategiesSection() {
  const strategies = [
    {
      title: "O Que é Low-Ticket e Como Funciona",
      description: "Produtos de baixo custo (R$27-R$97) que funcionam como porta de entrada para sua esteira de produtos.",
      icon: Target,
      color: "bg-violet-500",
      tips: [
        "Preço ideal entre R$27 e R$97 para máxima conversão",
        "Entrega rápida de valor - resultado imediato",
        "Baixa barreira de entrada = mais vendas",
        "Funciona como filtro de clientes qualificados"
      ]
    },
    {
      title: "Funil de Vendas Estratégico",
      description: "Estruture um funil que qualifica leads e os prepara para ofertas de maior valor.",
      icon: Layers,
      color: "bg-fuchsia-500",
      tips: [
        "Tripwire: primeiro contato de baixo risco",
        "Core Offer: produto principal de valor médio",
        "Profit Maximizer: upsell de alto ticket",
        "Cada etapa deve entregar valor real"
      ]
    },
    {
      title: "Conteúdo que Atrai e Converte",
      description: "Crie conteúdo educativo que resolve problemas específicos e leva à venda naturalmente.",
      icon: Zap,
      color: "bg-pink-500",
      tips: [
        "Foque na dor imediata do seu público",
        "Conteúdo educativo > conteúdo promocional",
        "Use storytelling para criar conexão",
        "Mostre resultados reais e tangíveis"
      ]
    },
    {
      title: "Página de Vendas que Converte",
      description: "Estrutura simplificada que vende 24/7 sem depender de lives ou lançamentos.",
      icon: BarChart3,
      color: "bg-indigo-500",
      tips: [
        "Headline que captura atenção imediata",
        "Prova social com resultados reais",
        "Garantia que remove o risco",
        "CTA claro e irresistível"
      ]
    },
    {
      title: "Validação com Lançamentos Pagos",
      description: "Use lançamentos pagos para validar ofertas antes de escalar com tráfego.",
      icon: Rocket,
      color: "bg-cyan-500",
      tips: [
        "Teste diferentes tipos de ingresso",
        "Segmente sua audiência por interesse",
        "Use escassez real para aumentar conversão",
        "Colete feedback para melhorar o produto"
      ]
    },
    {
      title: "Escala com Tráfego Pago",
      description: "Estratégias de anúncios que funcionam para produtos de baixo ticket.",
      icon: TrendingUp,
      color: "bg-emerald-500",
      tips: [
        "Teste múltiplos criativos simultaneamente",
        "Use dados para otimizar campanhas",
        "Foque no ROI, não apenas no custo por lead",
        "Escale gradualmente com base nos resultados"
      ]
    }
  ];

  const internationalStrategies = [
    {
      title: "Expansão para América Latina",
      description: "Aproveite a similaridade cultural para escalar na América Latina.",
      icon: Globe,
      color: "bg-orange-500",
      tips: [
        "Mesma língua = menor barreira de entrada",
        "Cultura similar = mensagens que ressoam",
        "Comece com países de maior poder aquisitivo",
        "Adapte preços para cada mercado local"
      ]
    },
    {
      title: "Venda para Brasileiros no Exterior",
      description: "Segmente brasileiros vivendo fora com poder aquisitivo maior.",
      icon: Users,
      color: "bg-blue-500",
      tips: [
        "Segmente por comportamento no Facebook Ads",
        "Use português para criar conexão",
        "Preços em dólar aumentam valor percebido",
        "Foque em nichos específicos de expatriados"
      ]
    },
    {
      title: "IA para Internacionalização",
      description: "Use inteligência artificial para traduzir e adaptar conteúdo.",
      icon: Sparkles,
      color: "bg-purple-500",
      tips: [
        "Traduza conteúdo para espanhol facilmente",
        "Adapte cultura e referências locais",
        "Crie versões do produto em múltiplos idiomas",
        "Automatize atendimento em várias línguas"
      ]
    }
  ];

  return (
    <section id="estrategias" className="py-20 md:py-32 bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <Badge className="mb-4 bg-violet-500/20 text-violet-300 border-violet-500/30">
            <BookOpen className="w-3 h-3 mr-1" />
            Análise Completa
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Estratégias de <span className="text-violet-400">Low-Ticket</span>
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Baseado nas estratégias de Pedro Aredes, Adrian Sacomani e Leandro Belarmino. 
            Clique em cada card para ver as dicas práticas.
          </p>
        </motion.div>

        <Tabs defaultValue="brasil" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-12 bg-slate-900">
            <TabsTrigger value="brasil" className="data-[state=active]:bg-violet-500 data-[state=active]:text-white">
              Mercado Brasil
            </TabsTrigger>
            <TabsTrigger value="internacional" className="data-[state=active]:bg-violet-500 data-[state=active]:text-white">
              Mercado Internacional
            </TabsTrigger>
          </TabsList>

          <TabsContent value="brasil">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {strategies.map((strategy, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <StrategyCard {...strategy} />
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="internacional">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {internationalStrategies.map((strategy, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <StrategyCard {...strategy} />
                </motion.div>
              ))}
            </div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-12 p-8 bg-gradient-to-r from-violet-900/30 to-fuchsia-900/30 rounded-2xl border border-violet-500/20"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-violet-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Case de Sucesso: Leandro Belarmino</h3>
                  <p className="text-slate-300 mb-4">
                    Leandro faturou <strong className="text-violet-400">$300.000</strong> vendendo um produto de apenas <strong className="text-violet-400">$6</strong> 
                    na gringa. A estratégia? Um funil bem estruturado que começa com um low-ticket irresistível 
                    e escala com tráfego pago otimizado.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-violet-400" />
                      Produto de entrada acessível remove a barreira da compra
                    </li>
                    <li className="flex items-center gap-2 text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-violet-400" />
                      Volume alto de vendas compensa o ticket baixo
                    </li>
                    <li className="flex items-center gap-2 text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-violet-400" />
                      Base de clientes qualificados para upsells futuros
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}

// Application Section - How to Apply in Dojo
function ApplicationSection() {
  const applications = [
    {
      phase: "Fase 1",
      title: "Low-Ticket de Entrada",
      description: "Mini-cursos e workshops acessíveis que introduzem novos membros à Dojo",
      price: "R$27 - R$97",
      features: [
        "Mini-curso introdutório de 1-2 horas",
        "Workshop ao vivo mensal",
        "Acesso básico às Dojo Utilities",
        "7 dias de teste da comunidade"
      ],
      icon: BookOpen,
      color: "from-violet-500 to-violet-600"
    },
    {
      phase: "Fase 2",
      title: "Assinatura Dojo",
      description: "Acesso completo à comunidade com todos os recursos e conteúdos",
      price: "R$97/mês",
      features: [
        "Acesso a todos os mini-cursos",
        "Workshops semanais exclusivos",
        "Masterclasses mensais",
        "Dojocast completo",
        "Dojo Utilities ilimitadas",
        "Comunidade de networking"
      ],
      icon: Users,
      color: "from-fuchsia-500 to-fuchsia-600",
      highlighted: true
    },
    {
      phase: "Fase 3",
      title: "Mentoria Premium",
      description: "Acompanhamento personalizado para acelerar resultados",
      price: "R$497/mês",
      features: [
        "Tudo da assinatura Dojo",
        "Mentoria em grupo semanal",
        "Análise de portfólio",
        "Acesso direto aos mentores",
        "Oportunidades de parceria",
        "Certificação Dojo"
      ],
      icon: Award,
      color: "from-pink-500 to-pink-600"
    }
  ];

  const contentStrategies = [
    {
      title: "Dojocast como Isca",
      description: "Use episódios gratuitos do podcast para atrair leads qualificados",
      icon: Headphones,
      action: "Disponibilize 1 episódio por semana no YouTube/Spotify"
    },
    {
      title: "Workshops de Validação",
      description: "Workshops ao vivo gratuitos que vendem o low-ticket no final",
      icon: Video,
      action: "Workshop mensal gratuito com oferta no final"
    },
    {
      title: "Conteúdo Educacional",
      description: "Posts e reels educativos que resolvem problemas específicos",
      icon: Zap,
      action: "3-5 conteúdos por semana nas redes sociais"
    },
    {
      title: "Dojo Utilities Gratuitas",
      description: "Ferramentas gratuitas que demonstram valor e capturam leads",
      icon: Wrench,
      action: "1-2 ferramentas gratuitas como isca digital"
    }
  ];

  return (
    <section id="aplicacao" className="py-20 md:py-32 bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <Badge className="mb-4 bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30">
            <Target className="w-3 h-3 mr-1" />
            Aplicação Prática
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Como Aplicar na <span className="text-fuchsia-400">Dojo</span>
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Transforme as estratégias de low-ticket em uma máquina de aquisição de membros 
            para a sua comunidade.
          </p>
        </motion.div>

        {/* Funnel Visualization */}
        <div className="mb-20">
          <h3 className="text-2xl font-bold text-white text-center mb-10">Esteira de Produtos Dojo</h3>
          <div className="grid md:grid-cols-3 gap-6">
            {applications.map((app, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`h-full ${app.highlighted ? 'bg-gradient-to-b from-fuchsia-900/30 to-slate-900 border-fuchsia-500/50' : 'bg-slate-900/50 border-slate-800'}`}>
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 bg-gradient-to-br ${app.color} rounded-xl flex items-center justify-center mb-4`}>
                      <app.icon className="w-6 h-6 text-white" />
                    </div>
                    <Badge className="mb-2 bg-slate-800 text-slate-300">{app.phase}</Badge>
                    <h4 className="text-xl font-bold text-white mb-2">{app.title}</h4>
                    <p className="text-slate-400 text-sm mb-4">{app.description}</p>
                    <div className="text-2xl font-bold text-violet-400 mb-4">{app.price}</div>
                    <ul className="space-y-2">
                      {app.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                          <CheckCircle2 className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Content Strategy */}
        <div className="mb-20">
          <h3 className="text-2xl font-bold text-white text-center mb-10">Estratégia de Conteúdo</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contentStrategies.map((strategy, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-all">
                  <CardContent className="p-6">
                    <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center mb-4">
                      <strategy.icon className="w-5 h-5 text-violet-400" />
                    </div>
                    <h4 className="text-lg font-bold text-white mb-2">{strategy.title}</h4>
                    <p className="text-slate-400 text-sm mb-4">{strategy.description}</p>
                    <div className="text-xs text-violet-400 font-medium">{strategy.action}</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* International Expansion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="p-8 bg-gradient-to-r from-indigo-900/30 via-violet-900/30 to-fuchsia-900/30 rounded-2xl border border-violet-500/20"
        >
          <div className="text-center mb-8">
            <Globe className="w-12 h-12 text-violet-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">Expansão Internacional da Dojo</h3>
            <p className="text-slate-400">Plano de internacionalização baseado nas estratégias de Leandro Belarmino</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { region: "América Latina", lang: "Espanhol", price: "$7-27", status: "Fase 1" },
              { region: "Europa", lang: "Inglês/Português", price: "€7-27", status: "Fase 2" },
              { region: "Oriente Médio", lang: "Árabe/Inglês", price: "$10-37", status: "Fase 3" },
              { region: "Ásia", lang: "Inglês", price: "$7-27", status: "Fase 4" }
            ].map((market, index) => (
              <div key={index} className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
                <div className="text-violet-400 text-sm font-medium mb-1">{market.status}</div>
                <div className="text-white font-bold mb-1">{market.region}</div>
                <div className="text-slate-400 text-sm">{market.lang}</div>
                <div className="text-fuchsia-400 text-sm font-medium mt-2">{market.price}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// Content Strategy Section - NEW
function ContentStrategySection() {
  const personas = [
    {
      name: "O Freelancer em Crescimento",
      age: "25-32 anos",
      pain: "Precisa se destacar no mercado, falta organização e processos",
      goal: "Aumentar renda e conquistar clientes melhores",
      platforms: ["Instagram", "LinkedIn", "YouTube"],
      icon: Briefcase,
      color: "from-violet-500 to-purple-500"
    },
    {
      name: "O Criativo em Transição",
      age: "28-35 anos",
      pain: "Quer sair do CLT, mas não sabe como começar",
      goal: "Montar portfólio e fazer primeira venda",
      platforms: ["TikTok", "Instagram", "Pinterest"],
      icon: Palette,
      color: "from-fuchsia-500 to-pink-500"
    },
    {
      name: "O Empreendedor Digital",
      age: "30-40 anos",
      pain: "Precisa escalar, mas falta conhecimento técnico",
      goal: "Automatizar processos e aumentar lucro",
      platforms: ["LinkedIn", "YouTube", "Twitter"],
      icon: Rocket,
      color: "from-emerald-500 to-teal-500"
    },
    {
      name: "O Estudante Ambicioso",
      age: "20-25 anos",
      pain: "Faculdade não prepara para o mercado real",
      goal: "Aprender habilidades práticas e conseguir emprego",
      platforms: ["TikTok", "Instagram", "YouTube"],
      icon: GraduationCap,
      color: "from-orange-500 to-amber-500"
    }
  ];

  const marketData = [
    { label: "Mercado de EdTech Brasil", value: "R$ 15,8 bi", growth: "+18% ao ano", icon: TrendingUp },
    { label: "Usuários de Cursos Online", value: "12,5 milhões", growth: "+25% em 2025", icon: Users },
    { label: "Taxa Média de Conversão", value: "2-5%", growth: "Low-ticket: até 8%", icon: BarChart3 },
    { label: "Tempo de Decisão", value: "3-7 dias", growth: "Comunidades: 40% menos", icon: Zap }
  ];

  const marchCalendar = [
    { date: "25-28 Mar", event: "Preparação Pré-Launch", type: "setup", description: "Aquecimento de audiência, teasers, contagem regressiva" },
    { date: "29 Mar", event: "Workshop Gratuito: 'Do Zero ao Primeiro Cliente'", type: "workshop", description: "Workshop ao vivo com oferta do mini-curso no final" },
    { date: "30-31 Mar", event: "Flash Sale: Mini-Curso por R$27", type: "sale", description: "Oferta relâmpago de 48h para lista de espera" }
  ];

  const aprilCalendar = [
    { date: "01-05 Abr", event: "Páscoa Dojo: Renove sua Carreira", type: "campaign", description: "Campanha temática: 'Renovação Profissional' com conteúdo especial" },
    { date: "05 Abr", event: "Live: Bastidores da Dojo", type: "live", description: "Mostre como a comunidade funciona, depoimentos de membros" },
    { date: "08 Abr", event: "Dia Internacional da Mulher (ext) - Conteúdo Empoderamento", type: "content", description: "Histórias de mulheres da comunidade, descontos especiais" },
    { date: "12-15 Abr", event: "Semana do Freelancer", type: "campaign", description: "Série de 5 conteúdos sobre freelancing: precificação, contratos, clientes" },
    { date: "19 Abr", event: "Dojocast Especial: 'Erros que Custaram Carreiras'", type: "podcast", description: "Episódio com histórias reais de fracassos e aprendizados" },
    { date: "21 Abr", event: "Tiradentes - Feriado de Conteúdo", type: "content", description: "Conteúdo leve: 'O que fazer no feriado para impulsionar sua carreira'" },
    { date: "22 Abr", event: "Dia da Terra - Sustentabilidade na Carreira", type: "content", description: "Como ser um profissional consciente, trabalho remoto = menos poluição" },
    { date: "25-27 Abr", event: "Desafio 3 Dias: Organize sua Rotina", type: "challenge", description: "Desafio gratuito no Instagram/LinkedIn com entrega de valor diária" },
    { date: "28-30 Abr", event: "Abertura Vagas Assinatura Dojo", type: "launch", description: "Lançamento oficial da assinatura com bônus de fundador" }
  ];

  const acquisitionStrategies = [
    {
      title: "Iscas Digitais de Alto Valor",
      description: "Ferramentas gratuitas que resolvem problemas imediatos",
      tactics: [
        "Planilha de Precificação Automática",
        "Template de Proposta Comercial",
        "Checklist de Onboarding de Clientes",
        "Ebook: '7 Erros que Destroem Freelancers'"
      ],
      conversion: "15-25% dos downloads viram leads",
      icon: FileText
    },
    {
      title: "Conteúdo Educacional Viral",
      description: "Reels e Shorts que educam e entreteem simultaneamente",
      tactics: [
        "'3 dicas em 60 segundos' - formato fixo toda terça",
        "'Mitos vs Realidade' do mercado criativo",
        "'Antes/Depois' de transformações de membros",
        "'POV: Você descobriu a Dojo' - conteúdo humorado"
      ],
      conversion: "Reels: 3-5% | Shorts: 2-4%",
      icon: Video
    },
    {
      title: "Workshops Gratuitos Semanais",
      description: "Eventos ao vivo que demonstram valor e vendem no final",
      tactics: [
        "Workshop toda quinta-feira às 19h",
        "Tema relacionado a um mini-curso específico",
        "30 min de conteúdo + 15 min de oferta",
        "Replay disponível por 48h com urgência"
      ],
      conversion: "8-15% dos participantes compram",
      icon: Users
    },
    {
      title: "Dojocast como Motor de Tráfego",
      description: "Podcast que constrói autoridade e gera leads qualificados",
      tactics: [
        "1 episódio por semana no YouTube e Spotify",
        "Convidados com audiência própria (cross-promo)",
        "CTA claro no final: 'Link na bio para workshop'",
        "Cortes virais para redes sociais"
      ],
      conversion: "5-10% dos ouvintes viram leads",
      icon: Headphones
    },
    {
      title: "Comunidade como Prova Social",
      description: "Transforme membros em embaixadores da marca",
      tactics: [
        "Programa de indicação: 1 mês grátis por indicação",
        "Destaque semanal de membros nas redes",
        "Desafios internos com premiação",
        "Grupo gratuito no Discord/Telegram"
      ],
      conversion: "30% dos membros indicam alguém",
      icon: Share2
    },
    {
      title: "Parcerias Estratégicas",
      description: "Alcance audiências já aquecidas de parceiros",
      tactics: [
        "Convidados do Dojocast compartilham episódio",
        "Cross-promo com comunidades complementares",
        "Afiliados com comissão atrativa (30-40%)",
        "Guest posts em blogs do nicho"
      ],
      conversion: "Parcerias: 5-12% de conversão",
      icon: HandshakeIcon
    }
  ];

  return (
    <section id="conteudo" className="py-20 md:py-32 bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <Badge className="mb-4 bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
            <Calendar className="w-3 h-3 mr-1" />
            Estratégia 2026
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Plano de Conteúdo <span className="text-cyan-400">Março & Abril</span>
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Estratégia completa baseada em análise de mercado, público-alvo e tendências 2026 
            para maximizar aquisição de assinantes na Dojo.
          </p>
        </motion.div>

        {/* Market Analysis */}
        <div className="mb-20">
          <h3 className="text-2xl font-bold text-white text-center mb-10">
            <BarChart3 className="inline w-6 h-6 mr-2 text-cyan-400" />
            Análise de Mercado 2026
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {marketData.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full bg-slate-900/50 border-slate-800">
                  <CardContent className="p-6 text-center">
                    <item.icon className="w-10 h-10 text-cyan-400 mx-auto mb-4" />
                    <div className="text-3xl font-bold text-white mb-1">{item.value}</div>
                    <div className="text-sm text-slate-400 mb-2">{item.label}</div>
                    <Badge className="bg-emerald-500/20 text-emerald-300">{item.growth}</Badge>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Personas */}
        <div className="mb-20">
          <h3 className="text-2xl font-bold text-white text-center mb-10">
            <Users className="inline w-6 h-6 mr-2 text-fuchsia-400" />
            Público-Alvo: 4 Personas Principais
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            {personas.map((persona, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-all">
                  <CardContent className="p-6">
                    <div className={`w-14 h-14 bg-gradient-to-br ${persona.color} rounded-xl flex items-center justify-center mb-4`}>
                      <persona.icon className="w-7 h-7 text-white" />
                    </div>
                    <h4 className="text-xl font-bold text-white mb-1">{persona.name}</h4>
                    <p className="text-cyan-400 text-sm mb-4">{persona.age}</p>
                    
                    <div className="space-y-3">
                      <div>
                        <span className="text-slate-500 text-xs uppercase tracking-wider">Dor Principal</span>
                        <p className="text-slate-300 text-sm">{persona.pain}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 text-xs uppercase tracking-wider">Objetivo</span>
                        <p className="text-slate-300 text-sm">{persona.goal}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 text-xs uppercase tracking-wider">Onde Está</span>
                        <div className="flex gap-2 mt-1">
                          {persona.platforms.map((platform, i) => (
                            <Badge key={i} className="bg-slate-800 text-slate-300">{platform}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Content Calendar */}
        <div className="mb-20">
          <h3 className="text-2xl font-bold text-white text-center mb-10">
            <Calendar className="inline w-6 h-6 mr-2 text-emerald-400" />
            Calendário de Conteúdo
          </h3>
          
          <Tabs defaultValue="marco" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8 bg-slate-900">
              <TabsTrigger value="marco" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
                Final de Março
              </TabsTrigger>
              <TabsTrigger value="abril" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
                Abril Inteiro
              </TabsTrigger>
            </TabsList>

            <TabsContent value="marco">
              <div className="space-y-4">
                {marchCalendar.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="bg-slate-900/50 border-slate-800">
                      <CardContent className="p-4 flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex items-center gap-3 md:w-48">
                          <Calendar className="w-5 h-5 text-emerald-400" />
                          <span className="text-white font-semibold">{item.date}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-white font-bold">{item.event}</h4>
                            <Badge className={`
                              ${item.type === 'setup' ? 'bg-blue-500/20 text-blue-300' : ''}
                              ${item.type === 'workshop' ? 'bg-violet-500/20 text-violet-300' : ''}
                              ${item.type === 'sale' ? 'bg-emerald-500/20 text-emerald-300' : ''}
                            `}>
                              {item.type === 'setup' && 'Preparação'}
                              {item.type === 'workshop' && 'Workshop'}
                              {item.type === 'sale' && 'Promoção'}
                            </Badge>
                          </div>
                          <p className="text-slate-400 text-sm">{item.description}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="abril">
              <div className="space-y-4">
                {aprilCalendar.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="bg-slate-900/50 border-slate-800">
                      <CardContent className="p-4 flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex items-center gap-3 md:w-48">
                          <Calendar className="w-5 h-5 text-emerald-400" />
                          <span className="text-white font-semibold">{item.date}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h4 className="text-white font-bold">{item.event}</h4>
                            <Badge className={`
                              ${item.type === 'campaign' ? 'bg-fuchsia-500/20 text-fuchsia-300' : ''}
                              ${item.type === 'live' ? 'bg-red-500/20 text-red-300' : ''}
                              ${item.type === 'content' ? 'bg-blue-500/20 text-blue-300' : ''}
                              ${item.type === 'podcast' ? 'bg-violet-500/20 text-violet-300' : ''}
                              ${item.type === 'challenge' ? 'bg-orange-500/20 text-orange-300' : ''}
                              ${item.type === 'launch' ? 'bg-emerald-500/20 text-emerald-300' : ''}
                            `}>
                              {item.type === 'campaign' && 'Campanha'}
                              {item.type === 'live' && 'Live'}
                              {item.type === 'content' && 'Conteúdo'}
                              {item.type === 'podcast' && 'Podcast'}
                              {item.type === 'challenge' && 'Desafio'}
                              {item.type === 'launch' && 'Lançamento'}
                            </Badge>
                          </div>
                          <p className="text-slate-400 text-sm">{item.description}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Acquisition Strategies */}
        <div className="mb-20">
          <h3 className="text-2xl font-bold text-white text-center mb-10">
            <Megaphone className="inline w-6 h-6 mr-2 text-orange-400" />
            6 Estratégias de Aquisição de Assinantes
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {acquisitionStrategies.map((strategy, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-all">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center mb-4">
                      <strategy.icon className="w-6 h-6 text-orange-400" />
                    </div>
                    <h4 className="text-lg font-bold text-white mb-2">{strategy.title}</h4>
                    <p className="text-slate-400 text-sm mb-4">{strategy.description}</p>
                    
                    <div className="space-y-2 mb-4">
                      {strategy.tactics.slice(0, 3).map((tactic, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-slate-300">
                          <CheckCircle2 className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                          {tactic}
                        </div>
                      ))}
                    </div>
                    
                    <div className="pt-4 border-t border-slate-800">
                      <span className="text-xs text-slate-500">Taxa de Conversão Esperada</span>
                      <p className="text-emerald-400 font-semibold">{strategy.conversion}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Weekly Content Rhythm */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="p-8 bg-gradient-to-r from-violet-900/30 via-fuchsia-900/30 to-cyan-900/30 rounded-2xl border border-violet-500/20"
        >
          <div className="text-center mb-8">
            <Lightbulb className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">Ritmo Semanal de Conteúdo</h3>
            <p className="text-slate-400">Consistência é chave: mantenha este calendário semanal para maximizar alcance</p>
          </div>
          
          <div className="grid md:grid-cols-5 gap-4">
            {[
              { day: "Segunda", content: "Reel Educativo", format: "3 dicas rápidas", platform: "Instagram/TikTok" },
              { day: "Terça", content: "Post Carrossel", format: "Passo a passo", platform: "Instagram/LinkedIn" },
              { day: "Quarta", content: "Dojocast", format: "Episódio novo", platform: "YouTube/Spotify" },
              { day: "Quinta", content: "Workshop Gratuito", format: "Ao vivo 19h", platform: "Instagram/Zoom" },
              { day: "Sexta", content: "Storytelling", format: "Bastidores + Depoimentos", platform: "Stories + Reels" }
            ].map((item, index) => (
              <div key={index} className="bg-slate-900/50 rounded-xl p-4 border border-slate-800 text-center">
                <div className="text-violet-400 font-bold mb-2">{item.day}</div>
                <div className="text-white text-sm font-semibold mb-1">{item.content}</div>
                <div className="text-slate-400 text-xs mb-2">{item.format}</div>
                <Badge className="bg-slate-800 text-slate-300 text-xs">{item.platform}</Badge>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// Handshake Icon Component
function HandshakeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

// Pricing Section
function PricingSection() {
  const plans = [
    {
      name: "Mini-Curso",
      description: "Porta de entrada perfeita para novos membros",
      price: "R$47",
      period: "pagamento único",
      features: [
        "1 mini-curso completo",
        "Acesso às Dojo Utilities básicas",
        "7 dias de comunidade",
        "Certificado de conclusão"
      ],
      cta: "Quero Começar",
      highlighted: false
    },
    {
      name: "Dojo Pro",
      description: "Acesso completo à comunidade",
      price: "R$97",
      period: "/mês",
      features: [
        "Todos os mini-cursos",
        "Workshops semanais",
        "Masterclasses mensais",
        "Dojocast completo",
        "Dojo Utilities ilimitadas",
        "Comunidade exclusiva",
        "Networking com membros"
      ],
      cta: "Assinar Agora",
      highlighted: true
    },
    {
      name: "Dojo Elite",
      description: "Mentoria premium para resultados acelerados",
      price: "R$497",
      period: "/mês",
      features: [
        "Tudo do Dojo Pro",
        "Mentoria em grupo semanal",
        "Análise de portfólio",
        "Acesso direto aos mentores",
        "Oportunidades de parceria",
        "Certificação Dojo",
        "Suporte prioritário"
      ],
      cta: "Quero ser Elite",
      highlighted: false
    }
  ];

  return (
    <section id="planos" className="py-20 md:py-32 bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <Badge className="mb-4 bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
            <DollarSign className="w-3 h-3 mr-1" />
            Planos
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Escolha seu <span className="text-emerald-400">Caminho</span>
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Comece com um mini-curso e evolua para a assinatura completa. 
            Cada plano foi desenhado para maximizar seu aprendizado.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`h-full ${plan.highlighted ? 'bg-gradient-to-b from-emerald-900/30 to-slate-900 border-emerald-500/50 relative' : 'bg-slate-900/50 border-slate-800'}`}>
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-emerald-500 text-white">Mais Popular</Badge>
                  </div>
                )}
                <CardContent className="p-8">
                  <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-slate-400 text-sm mb-6">{plan.description}</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                    <span className="text-slate-400">{plan.period}</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                        <CheckCircle2 className={`w-4 h-4 mt-0.5 flex-shrink-0 ${plan.highlighted ? 'text-emerald-400' : 'text-violet-400'}`} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className={`w-full ${plan.highlighted ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-white'}`}
                  >
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// CTA Section
function CTASection() {
  return (
    <section id="cta" className="py-20 md:py-32 bg-slate-900 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-600/20 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Pronto para <span className="text-violet-400">Escalar</span> sua Dojo?
          </h2>
          <p className="text-slate-400 text-lg mb-8 max-w-2xl mx-auto">
            Junte-se a centenas de criadores que estão usando estratégias de low-ticket 
            para construir comunidades lucrativas e escaláveis.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              size="lg"
              className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white px-8 py-6 text-lg font-semibold"
            >
              Começar Gratuitamente
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white px-8 py-6 text-lg"
            >
              <MessageCircle className="mr-2 w-5 h-5" />
              Falar com Especialista
            </Button>
          </div>

          <div className="flex flex-wrap justify-center gap-8 text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-violet-400" />
              <span>7 dias grátis</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-violet-400" />
              <span>Cancele quando quiser</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-violet-400" />
              <span>Suporte humano</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// Footer
function Footer() {
  return (
    <footer className="py-12 bg-slate-950 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white">Dojo</span>
            </div>
            <p className="text-slate-400 text-sm">
              Comunidade de aprendizado com mini-cursos, workshops, masterclasses e ferramentas 
              para impulsionar sua carreira.
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Produtos</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="#" className="hover:text-violet-400 transition-colors">Mini-Cursos</a></li>
              <li><a href="#" className="hover:text-violet-400 transition-colors">Workshops</a></li>
              <li><a href="#" className="hover:text-violet-400 transition-colors">Masterclasses</a></li>
              <li><a href="#" className="hover:text-violet-400 transition-colors">Dojocast</a></li>
              <li><a href="#" className="hover:text-violet-400 transition-colors">Dojo Utilities</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Comunidade</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="#" className="hover:text-violet-400 transition-colors">Networking</a></li>
              <li><a href="#" className="hover:text-violet-400 transition-colors">Tira Dúvidas</a></li>
              <li><a href="#" className="hover:text-violet-400 transition-colors">Mostre seu Trabalho</a></li>
              <li><a href="#" className="hover:text-violet-400 transition-colors">Parcerias</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Contato</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><a href="#" className="hover:text-violet-400 transition-colors">Instagram</a></li>
              <li><a href="#" className="hover:text-violet-400 transition-colors">YouTube</a></li>
              <li><a href="#" className="hover:text-violet-400 transition-colors">LinkedIn</a></li>
              <li><a href="#" className="hover:text-violet-400 transition-colors">suporte@dojo.com</a></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 text-sm">
            © 2026 Dojo. Todos os direitos reservados.
          </p>
          <div className="flex gap-6 text-sm text-slate-500">
            <a href="#" className="hover:text-violet-400 transition-colors">Termos de Uso</a>
            <a href="#" className="hover:text-violet-400 transition-colors">Privacidade</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// Main App
function App() {
  return (
    <div className="min-h-screen bg-slate-950">
      <Navigation />
      <HeroSection />
      <StrategiesSection />
      <ApplicationSection />
      <ContentStrategySection />
      <PricingSection />
      <CTASection />
      <Footer />
    </div>
  );
}

export default App;
