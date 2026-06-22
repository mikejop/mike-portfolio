import { BudgetSectionKey } from "../store/types";

interface CategoryGroup {
    group: string;
    items: string[];
}

export const budgetCategories: Record<BudgetSectionKey, CategoryGroup[]> = {
    pre: [
        { group: "Desenvolvimento Criativo", items: ["Ideia / Conceito Criativo", "Pesquisa Criativa", "Desenvolvimento de Roteiro", "Revisões de Roteiro", "Script Doctor", "Adaptação de Roteiro", "Roteiro Técnico"] },
        { group: "Direção", items: ["Direção Criativa", "Direção de Cena (preparação)", "Decupagem", "Referências Visuais", "Moodboard"] },
        { group: "Planejamento", items: ["Planejamento de Produção", "Breakdown de Roteiro", "Cronograma de Produção", "Plano de Filmagem", "Storyboard", "Animatic"] },
        { group: "Casting", items: ["Direção de Casting", "Testes de Elenco", "Seleção de Talentos", "Negociação de Cachês", "Casting de Figurantes"] },
        { group: "Locação", items: ["Pesquisa de Locação (Location Scouting)", "Visita Técnica", "Reserva de Locações", "Taxas de Locação", "Permissões de Filmagem", "Licenças municipais"] },
        { group: "Arte (Pré)", items: ["Conceito de Arte", "Design de Produção", "Pesquisa de Figurino", "Pesquisa de Cenografia", "Desenvolvimento de Props"] },
        { group: "Produção Técnica", items: ["Reuniões de Pré-Produção", "Reunião Técnica (Tech Recce)", "Planejamento de Equipamentos", "Planejamento de Equipe"] },
        { group: "Logística", items: ["Planejamento de Transporte", "Planejamento de Hospedagem", "Planejamento de Catering"] },
        { group: "Jurídico", items: ["Contratos de Talento", "Contratos de Equipe", "Direitos de Uso de Imagem", "Direitos Autorais", "Liberação de Locação"] },
    ],
    live: [
        { group: "Direção", items: ["Diretor", "Assistente de Direção", "Segundo Assistente de Direção", "Continuísta (Script Supervisor)"] },
        { group: "Produção", items: ["Produtor Executivo", "Produtor", "Coordenador de Produção", "Assistente de Produção", "Runner / PA"] },
        { group: "Direção de Fotografia", items: ["Diretor de Fotografia", "Operador de Câmera", "1º Assistente de Câmera (Foquista)", "2º Assistente de Câmera", "DIT (Digital Imaging Technician)", "Video Assist"] },
        { group: "Equipamentos de Câmera", items: ["Câmera", "Lentes", "Filtros", "Monitor de Diretor", "Follow Focus", "Tripé", "Gimbal", "Steadicam", "Drone", "Cartões de memória", "Gravadores externos"] },
        { group: "Elétrica / Iluminação", items: ["Gaffer", "Best Boy Elétrica", "Eletricistas", "Aluguel de Iluminação", "Gerador", "Cabos e distribuição elétrica", "Grip elétrico"] },
        { group: "Grip", items: ["Key Grip", "Dolly Grip", "Trilhos", "Dolly", "Grua", "Rigging", "Bandeiras", "Difusores", "Rebatedores"] },
        { group: "Som Direto", items: ["Técnico de Som Direto", "Boom Operator", "Gravador de áudio", "Microfones", "Sistema de wireless", "Timecode"] },
        { group: "Arte", items: ["Diretor de Arte", "Cenógrafo", "Assistente de Arte", "Set Decorator", "Props Master", "Construção de Cenário", "Aluguel de Cenografia", "Objetos de Cena"] },
        { group: "Figurino", items: ["Figurinista", "Assistente de Figurino", "Compra de Figurino", "Aluguel de Figurino", "Manutenção de Figurino"] },
        { group: "Maquiagem e Caracterização", items: ["Maquiador", "Hair Stylist", "FX Makeup", "Materiais de maquiagem"] },
        { group: "Elenco", items: ["Cachê de Atores", "Figurantes", "Dublês", "Preparador de Elenco", "Preparador de Ação"] },
        { group: "Transporte", items: ["Transporte de Equipe", "Transporte de Equipamentos", "Motoristas", "Combustível", "Vans de Produção", "Caminhões de Equipamento"] },
        { group: "Alimentação", items: ["Catering", "Coffee Break", "Água / bebidas"] },
        { group: "Logística de Set", items: ["Tendas", "Banheiros químicos", "Cadeiras / mesas", "Tendas de maquiagem", "Tendas de produção"] },
        { group: "Segurança", items: ["Seguro de Produção", "Segurança de Set", "Brigada de incêndio", "Ambulância / paramédico"] },
    ],
    pos: [
        { group: "Gestão de Pós", items: ["Supervisor de Pós-Produção", "Coordenação de Pós", "Gestão de workflow"] },
        { group: "Ingest / Organização", items: ["Backup", "Organização de mídia", "Sincronização de áudio", "Transcodificação"] },
        { group: "Montagem", items: ["Editor", "Assistente de Edição", "Edição Offline", "Edição Online"] },
        { group: "Finalização de Imagem", items: ["Conform", "Color Grading", "Colorista", "Masterização"] },
        { group: "VFX", items: ["Supervisão de VFX", "Composição", "Clean Up", "Rotoscopia", "Tracking", "Matchmove"] },
        { group: "Motion Graphics", items: ["Design de Motion", "Animação de Grafismos", "Lower Thirds", "Títulos"] },
        { group: "Som", items: ["Edição de Som", "Design de Som", "Foley", "ADR / Dublagem", "Mixagem", "Master de Áudio"] },
        { group: "Música", items: ["Composição de Trilha", "Licenciamento de Música", "Biblioteca Musical", "Gravação de Trilha"] },
        { group: "Entregas", items: ["Master Final", "Exportações", "Versões de entrega", "QC (controle de qualidade)"] },
    ],
    "3d": [
        { group: "Desenvolvimento", items: ["Concept Art", "Design de Personagem", "Design de Ambiente"] },
        { group: "Modelagem", items: ["Modelagem 3D", "Escultura Digital"] },
        { group: "Texturização", items: ["UV Mapping", "Texturas", "Shading", "Look Development"] },
        { group: "Rigging", items: ["Rig de Personagem", "Rig de Objetos"] },
        { group: "Animação", items: ["Animação de Personagem", "Animação de Objetos", "Motion Capture"] },
        { group: "Simulação", items: ["Simulações", "Partículas", "Fumaça", "Fogo", "Água", "Destruição"] },
        { group: "Iluminação", items: ["Lighting 3D", "Setup de cena"] },
        { group: "Render", items: ["Render Farm", "Renderização"] },
        { group: "Composição", items: ["Composição VFX", "Integração com Live Action"] },
    ],
    desp: [
        { group: "Produção Executiva", items: ["Produção Executiva", "Gestão de Projeto", "Coordenação Geral"] },
        { group: "Administração", items: ["Custos administrativos", "Financeiro", "Contabilidade"] },
        { group: "Jurídico", items: ["Contratos", "Licenças", "Direitos autorais"] },
        { group: "Infraestrutura", items: ["Escritório de Produção", "Internet", "Telefonia", "Softwares"] },
        { group: "Seguros", items: ["Seguro de produção", "Seguro de equipamento", "Seguro de responsabilidade civil"] },
        { group: "Taxas", items: ["Taxas bancárias", "Impostos", "Taxas de plataforma"] },
        { group: "Comunicação", items: ["Comunicação com cliente", "Reuniões", "Relatórios"] },
        { group: "Marketing / Portfólio", items: ["Registro de making of", "Fotografias de set", "Material de divulgação"] },
        { group: "Contingência", items: ["Reserva de contingência", "Custos imprevistos"] },
    ],
};
