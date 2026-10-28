import type { LucideIcon } from "lucide-react";
import { Compass, FileText, Network, MapPin, Heart, Settings, Megaphone, Handshake, Wallet, Users, ShieldCheck } from "lucide-react";

export interface SectorVisual {
  concept: string;
  accent: string;
  soft: string;
  image: string;
  imageAlt: string;
  icon: LucideIcon;
  flow: [string, string, string, string];
  interfaces: Array<{ id: string; label: string }>;
}

export const sectorVisuals: Record<string, SectorVisual> = {
  "SET-01": {
    concept: "Da leitura ao projeto", accent: "#2F6FD6", soft: "#F3F7F5", image: "/universe-sectors/04-setor-de-projetos.png",
    imageAlt: "Camadas de terreno, água e desenhos técnicos formando um projeto", icon: Compass,
    flow: ["Dados e requisitos", "Planejamento e desenho", "Estudos e projetos", "Processos e cliente"],
    interfaces: [{ id: "SET-02", label: "Exigências e prazos" }, { id: "SET-03", label: "Demandas e prioridades" }, { id: "SET-07", label: "Escopo" }],
  },
  "SET-02": {
    concept: "Caminho regulatório", accent: "#008C95", soft: "#F4FAF8", image: "/universe-sectors/05-licenciamento-e-processos.png",
    imageAlt: "Documentos e rotas de um processo regulatório", icon: FileText,
    flow: ["Requisitos do processo", "Protocolo e acompanhamento", "Licenças e regularização", "Órgãos e áreas técnicas"],
    interfaces: [{ id: "SET-01", label: "Estudos e documentos" }, { id: "SET-11", label: "Dados, mapas e CAR" }, { id: "SET-03", label: "Demandas" }, { id: "SET-08", label: "Taxas" }],
  },
  "SET-03": {
    concept: "Centro de coordenação", accent: "#7652B8", soft: "#F7F3F8", image: "/universe-sectors/06-gestao-e-planejamento.png",
    imageAlt: "Painel de demandas, prioridades e indicadores conectados", icon: Network,
    flow: ["Demanda recebida", "Qualificação e distribuição", "Acompanhamento", "Retorno aos setores"],
    interfaces: [{ id: "SET-01", label: "Prioridades técnicas" }, { id: "SET-02", label: "Prazos e processos" }, { id: "SET-11", label: "Agenda de campo" }, { id: "SET-05", label: "Automação" }],
  },
  "SET-04": {
    concept: "Ambiente que cuida", accent: "#B96B52", soft: "#FFF7F2", image: "/universe-sectors/11-brindes-e-papelaria.png",
    imageAlt: "Objetos de cuidado, organização e acolhimento no ambiente de trabalho", icon: Heart,
    flow: ["Necessidades do ambiente", "Organização e reposição", "Ambiente e kits disponíveis", "Equipe e visitantes"],
    interfaces: [{ id: "SET-05", label: "Reposição" }, { id: "SET-06", label: "Brindes e identidade" }, { id: "SET-03", label: "Arquivo físico" }],
  },
  "SET-05": {
    concept: "A engrenagem em movimento", accent: "#777619", soft: "#F8F8E9", image: "/universe-sectors/03-manutencao.png",
    imageAlt: "Ferramentas e sistemas de manutenção da infraestrutura", icon: Settings,
    flow: ["Solicitação operacional", "Compra ou manutenção", "Recursos disponíveis", "Setores atendidos"],
    interfaces: [{ id: "SET-10", label: "Fornecedores" }, { id: "SET-08", label: "Pagamentos" }, { id: "SET-03", label: "Automação de processos" }],
  },
  "SET-06": {
    concept: "Ideias que ganham alcance", accent: "#C42C6A", soft: "#FFF2F7", image: "/universe-sectors/01-marketing.png",
    imageAlt: "Megafone e peças editoriais conectando conteúdo e público", icon: Megaphone,
    flow: ["Conhecimento e cases", "Produção editorial", "Campanhas e materiais", "Clientes e equipe"],
    interfaces: [{ id: "SET-07", label: "Materiais comerciais" }, { id: "SET-01", label: "Validação técnica" }, { id: "SET-04", label: "Brindes" }, { id: "SET-09", label: "Marca empregadora" }],
  },
  "SET-07": {
    concept: "Pontes com o cliente", accent: "#17745B", soft: "#F4F8F4", image: "/universe-sectors/01-marketing.png",
    imageAlt: "Canais de comunicação e relacionamento com clientes", icon: Handshake,
    flow: ["Necessidade do cliente", "Escopo e proposta", "Acordo e acompanhamento", "Áreas técnicas e cliente"],
    interfaces: [{ id: "SET-01", label: "Escopo técnico" }, { id: "SET-10", label: "Formalização" }, { id: "SET-08", label: "Condições" }, { id: "SET-06", label: "Materiais" }],
  },
  "SET-08": {
    concept: "Fluxo que sustenta", accent: "#876029", soft: "#FBF6EA", image: "/universe-sectors/02-administracao.png",
    imageAlt: "Documentos, calendário e indicadores de controle financeiro", icon: Wallet,
    flow: ["Marcos e obrigações", "Faturamento e conciliação", "Pagamentos e caixa", "Contratos e setores"],
    interfaces: [{ id: "SET-10", label: "Marcos contratuais" }, { id: "SET-07", label: "Condições comerciais" }, { id: "SET-02", label: "Taxas" }, { id: "SET-05", label: "Compras" }],
  },
  "SET-09": {
    concept: "Pessoas que crescem", accent: "#B8564D", soft: "#FFF5F1", image: "/universe-sectors/08-pessoas-e-cultura.png",
    imageAlt: "Pessoas e trilhas de desenvolvimento profissional", icon: Users,
    flow: ["Entrada e necessidades", "Desenvolvimento e cuidado", "Formação registrada", "Pessoas e setores"],
    interfaces: [{ id: "SET-01", label: "Instrutores e conteúdo" }, { id: "SET-08", label: "Folha" }, { id: "SET-06", label: "Marca empregadora" }],
  },
  "SET-10": {
    concept: "Acordos que protegem", accent: "#263B59", soft: "#F3F5F8", image: "/universe-sectors/02-administracao.png",
    imageAlt: "Documentos, registros e marcos de acordos formais", icon: ShieldCheck,
    flow: ["Proposta e requisitos", "Formalização e vigência", "Contratos e aditivos", "Comercial e Financeiro"],
    interfaces: [{ id: "SET-07", label: "Propostas" }, { id: "SET-08", label: "Marcos financeiros" }, { id: "SET-05", label: "Fornecedores" }, { id: "SET-01", label: "Escopo técnico" }],
  },
  "SET-11": {
    concept: "Território em evidência", accent: "#C4572E", soft: "#FFF7EF", image: "/universe-capabilities/F10.png",
    imageAlt: "Equipe em campo com mapa, câmera, GPS e registros de medição", icon: MapPin,
    flow: ["Demanda de campo", "Visita e levantamento", "Dados, mapas e registros", "Projetos e processos"],
    interfaces: [{ id: "SET-01", label: "Dados para estudos" }, { id: "SET-02", label: "Mapas e evidências" }, { id: "SET-03", label: "Agenda" }, { id: "SET-05", label: "Logística" }],
  },
};
