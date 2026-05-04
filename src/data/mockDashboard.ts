// Dados mockados para o painel executivo (validação de UX)
export type Criticidade = "adequado" | "parcial" | "critico" | "sem_dados";

export type ComarcaPin = {
  nome: string;
  lat: number;
  lng: number;
  nivel: Criticidade;
};

// Coordenadas aproximadas das principais comarcas de Rondônia
export const COMARCAS_RO: ComarcaPin[] = [
  { nome: "Porto Velho", lat: -8.7619, lng: -63.9039, nivel: "adequado" },
  { nome: "Ji-Paraná", lat: -10.8773, lng: -61.9322, nivel: "adequado" },
  { nome: "Ariquemes", lat: -9.9133, lng: -63.0408, nivel: "critico" },
  { nome: "Vilhena", lat: -12.7406, lng: -60.1458, nivel: "critico" },
  { nome: "Cacoal", lat: -11.4386, lng: -61.4475, nivel: "parcial" },
  { nome: "Rolim de Moura", lat: -11.7286, lng: -61.7783, nivel: "parcial" },
  { nome: "Jaru", lat: -10.4386, lng: -62.4664, nivel: "critico" },
  { nome: "Guajará-Mirim", lat: -10.7825, lng: -65.3389, nivel: "critico" },
  { nome: "Buritis", lat: -10.2103, lng: -63.8294, nivel: "parcial" },
  { nome: "Pimenta Bueno", lat: -11.6731, lng: -61.1939, nivel: "parcial" },
  { nome: "Ouro Preto do Oeste", lat: -10.7164, lng: -62.2569, nivel: "adequado" },
  { nome: "Machadinho do Oeste", lat: -9.4422, lng: -61.9911, nivel: "adequado" },
];

export const ALERTAS = [
  { tipo: "critical" as const, label: "Contratos vencendo nos próximos 30 dias", count: 12, unidade: "contratos" },
  { tipo: "warning"  as const, label: "Manutenções preventivas vencidas",        count: 27, unidade: "registros" },
  { tipo: "critical" as const, label: "Equipamentos críticos inoperantes",       count: 18, unidade: "registros" },
  { tipo: "warning"  as const, label: "Garantias de equipamentos vencendo",      count: 15, unidade: "registros" },
  { tipo: "info"     as const, label: "Unidades com pendências não tratadas",    count: 8,  unidade: "unidades" },
];

export const SERVIDORES_COMARCA_TOP5 = [
  { comarca: "Porto Velho", total: 54 },
  { comarca: "Ariquemes",   total: 18 },
  { comarca: "Ji-Paraná",   total: 16 },
  { comarca: "Vilhena",     total: 12 },
  { comarca: "Cacoal",      total: 11 },
];

export const EQUIPAMENTOS_TIPO = [
  { tipo: "Câmeras",            total: 1845, color: "hsl(217 91% 55%)" },
  { tipo: "Catracas",           total: 96,   color: "hsl(142 65% 45%)" },
  { tipo: "Portões",            total: 134,  color: "hsl(42 95% 55%)" },
  { tipo: "Sensores",           total: 256,  color: "hsl(0 75% 55%)" },
  { tipo: "Outros",             total: 320,  color: "hsl(215 15% 60%)" },
];

export const UNIDADES_MOCK = [
  { nome: "Fórum Geral de Porto Velho", comarca: "Porto Velho", endereco: "Rua José Camacho, 585 - Olaria", tipo: "Fórum", responsavel: "João da Silva", derso: "Sim (07h às 19h)", criticidade: "Alto" as const },
];

export const SERVIDORES_MOCK = [
  { nome: "João da Silva",   matricula: "204567", cargo: "Agente de Segurança",     comarca: "Porto Velho", faixa: "41 a 50", status: "Ativo" },
  { nome: "Maria de Fátima", matricula: "205678", cargo: "Técnico Judiciário",      comarca: "Ariquemes",   faixa: "31 a 40", status: "Ativo" },
  { nome: "Carlos Alberto",  matricula: "203456", cargo: "Agente de Segurança",     comarca: "Ji-Paraná",   faixa: "51 a 60", status: "Ativo" },
  { nome: "Ana Paula",       matricula: "206789", cargo: "Chefe de Seção",          comarca: "Vilhena",     faixa: "41 a 50", status: "Ativo" },
];

export const TERCEIRIZADOS_MOCK = [
  { nome: "Paulo Souza",     empresa: "SegService",   funcao: "Vigilante",     unidade: "Fórum PVH", status: "Ativo" },
  { nome: "José Lima",       empresa: "SegService",   funcao: "Vigilante",     unidade: "Fórum PVH", status: "Ativo" },
  { nome: "Roberto Carlos",  empresa: "Grupo Protege",funcao: "Monitoramento", unidade: "CETEL",      status: "Ativo" },
  { nome: "Lucas Martins",   empresa: "Grupo Protege",funcao: "Supervisor",    unidade: "Fórum ARQ",  status: "Ativo" },
];

export const EQUIPAMENTOS_MOCK = [
  { tipo: "Câmeras",            qtd: 1845, op: 95 },
  { tipo: "Catracas",           qtd: 96,   op: 92 },
  { tipo: "Portões Automatizados", qtd: 134, op: 70 },
  { tipo: "Alarmes e Sensores", qtd: 256,  op: 82 },
  { tipo: "Detectores de Metais", qtd: 28, op: 89 },
];

export const CONTRATOS_MOCK = [
  { contrato: "058/2023", empresa: "SegService", inicio: "01/05/2023", fim: "30/04/2026", status: "Ativo" as const },
  { contrato: "074/2023", empresa: "Grupo Protege", inicio: "15/06/2023", fim: "14/06/2026", status: "Ativo" as const },
  { contrato: "091/2022", empresa: "TechSeg", inicio: "10/03/2022", fim: "09/03/2025", status: "A vencer" as const },
  { contrato: "103/2024", empresa: "Portões RO", inicio: "05/08/2024", fim: "04/08/2026", status: "Ativo" as const },
];
