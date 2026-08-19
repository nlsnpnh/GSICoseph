// =====================================================================
// Permissoes de escrita do front, espelhando as policies de RLS.
//
// A RLS do Postgres e quem de fato autoriza — isto aqui existe so para a
// interface nao oferecer acoes que o banco vai recusar. Ao mexer numa policy,
// atualize a tabela abaixo junto.
// =====================================================================

export type Recurso =
  | "comarcas"
  | "unidades"
  | "contratos"
  | "ocorrencias"
  | "equipamentos"
  | "portoes"
  | "servidores"
  | "terceirizados"
  | "boletim"
  | "planejamento"
  | "orcamento";

/**
 * - "admin"            -> so admin
 * - "gestor"           -> admin ou gestor
 * - "unidade"          -> admin, gestor, ou operador na propria unidade
 */
type Regra = "admin" | "gestor" | "unidade";

const ESCRITA: Record<Recurso, Regra> = {
  comarcas: "gestor",
  unidades: "gestor",
  contratos: "gestor",
  ocorrencias: "gestor",
  equipamentos: "gestor",
  portoes: "unidade",
  servidores: "unidade",
  terceirizados: "unidade",
  boletim: "unidade",
  planejamento: "admin",
  orcamento: "admin",
};

const EXCLUSAO: Record<Recurso, Regra> = {
  comarcas: "admin",
  unidades: "admin",
  contratos: "admin",
  ocorrencias: "gestor",
  equipamentos: "gestor",
  portoes: "admin",
  servidores: "unidade",
  terceirizados: "unidade",
  boletim: "admin",
  planejamento: "admin",
  orcamento: "admin",
};

export type PerfilAcesso = {
  isAdmin: boolean;
  isGestor: boolean;
  isOperador: boolean;
  unidadeId: string | null;
};

/**
 * `unidadeIdRegistro` e a unidade da linha sendo alterada. Omita ao criar ou
 * quando a acao nao for por linha — nesse caso basta o operador ter unidade.
 */
function atende(
  regra: Regra,
  p: PerfilAcesso,
  unidadeIdRegistro?: string | null,
): boolean {
  if (p.isAdmin) return true;
  if (regra === "admin") return false;
  if (p.isGestor) return true;
  if (regra === "gestor") return false;

  // Operador: so na propria unidade, e so se tiver unidade vinculada.
  if (!p.isOperador || !p.unidadeId) return false;
  return unidadeIdRegistro == null || unidadeIdRegistro === p.unidadeId;
}

export function podeEditar(
  p: PerfilAcesso,
  recurso: Recurso,
  unidadeIdRegistro?: string | null,
): boolean {
  return atende(ESCRITA[recurso], p, unidadeIdRegistro);
}

export function podeExcluir(
  p: PerfilAcesso,
  recurso: Recurso,
  unidadeIdRegistro?: string | null,
): boolean {
  return atende(EXCLUSAO[recurso], p, unidadeIdRegistro);
}
