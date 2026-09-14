// =====================================================================
// Trilha de auditoria: regras de apresentação, sem React nem Supabase.
//
// O banco grava a linha inteira antes e depois de cada mudança (jsonb). Aqui
// mora o que transforma isso em algo legível — nome dos campos, formatação
// dos valores e a lista "campo: antes → depois" que a tela mostra.
// =====================================================================

import { formatarDataHora } from "./dates";

export const OPERACOES = ["INSERT", "UPDATE", "DELETE", "RETRATO"] as const;
export type Operacao = (typeof OPERACOES)[number];

export const ORIGENS = ["app", "edge_function", "autenticacao", "banco", "sistema"] as const;
export type Origem = (typeof ORIGENS)[number];

export type EntradaAuditoria = {
  id: number;
  ocorrido_em: string;   // instante ISO
  tabela: string;
  operacao: Operacao;
  registro_id: string | null;
  registro_rotulo: string | null;
  usuario_id: string | null;
  usuario_nome: string | null;
  usuario_papel: string | null;
  origem: Origem;
  antes: Record<string, unknown> | null;
  depois: Record<string, unknown> | null;
  campos_alterados: string[];
};

export const ROTULO_OPERACAO: Record<Operacao, string> = {
  INSERT: "Inclusão",
  UPDATE: "Alteração",
  DELETE: "Exclusão",
  RETRATO: "Retrato inicial",
};

export const ROTULO_ORIGEM: Record<Origem, string> = {
  app: "Sistema",
  edge_function: "Função administrativa",
  autenticacao: "Cadastro de acesso",
  banco: "Direto no banco",
  sistema: "Ativação da trilha",
};

export const ROTULO_TABELA: Record<string, string> = {
  boletim_itens_catalogo: "Boletim — itens",
  boletim_mensal: "Boletim operacional",
  chamado_anexos: "Anexos de chamado",
  chamado_eventos: "Linha do tempo de chamado",
  chamados: "Chamados",
  comarcas: "Comarcas",
  contratos: "Contratos",
  equipamentos_catalogo: "Equipamentos — catálogo",
  orcamento_acoes: "Orçamento — ações",
  orcamento_superavit: "Orçamento — superávit",
  planejamento_acoes: "Planejamento",
  portoes: "Portões e acessos",
  profiles: "Perfis de usuário",
  servidores: "Servidores",
  terceirizados: "Terceirizados",
  unidade_equipamentos: "Equipamentos por unidade",
  unidades: "Unidades prediais",
  user_roles: "Papéis de acesso",
};

/** Tabela nova sem rótulo cadastrado aparece pelo nome técnico, não some. */
export const rotuloTabela = (tabela: string) => ROTULO_TABELA[tabela] ?? tabela;

// Só os nomes que a regra genérica de `rotuloCampo` erraria ou deixaria sem
// acento. O resto sai do próprio nome da coluna.
const ROTULO_CAMPO: Record<string, string> = {
  id: "Identificador",
  user_id: "Usuário",
  role: "Papel",
  nome_completo: "Nome completo",
  matricula: "Matrícula",
  funcao: "Função",
  funcao_atual: "Função atual",
  lotacao: "Lotação",
  situacao: "Situação",
  descricao: "Descrição",
  observacoes: "Observações",
  observacao: "Observação",
  endereco: "Endereço",
  telefone: "Telefone",
  possui_derso: "Possui DERSO",
  controle_acesso: "Controle de acesso",
  vigilancia_eletronica: "Vigilância eletrônica",
  responsavel_local: "Responsável local",
  responsavel_substituto: "Responsável substituto",
  responsavel_nome: "Responsável",
  data_inicio: "Início",
  data_fim: "Fim",
  data_ingresso: "Ingresso",
  data_nascimento: "Nascimento",
  data_conclusao: "Conclusão",
  data_maxima: "Data máxima",
  prazo_data: "Prazo",
  sla: "SLA (cláusula)",
  sla_dias: "Prazo de atendimento (dias)",
  unidade_ids: "Unidades atendidas",
  valor_mensal: "Valor mensal",
  valor_total: "Valor total",
  valor_unitario: "Valor unitário",
  qtd_contrato: "Quantidade no contrato",
  item_num: "Item",
  item_number: "Item",
  mes: "Mês",
  aditivos: "Aditivos",
  apostilamentos: "Apostilamentos",
  abono_permanencia: "Abono de permanência",
  curso_libras: "Curso de Libras",
  validade_certificacao: "Validade da certificação",
  certificacoes: "Certificações",
  posto_trabalho: "Posto de trabalho",
  identificacao: "Identificação",
  localizacao: "Localização",
  automatizacao: "Automatização",
  camera_associada: "Câmera associada",
  necessidade_manutencao: "Necessidade de manutenção",
  descricao_manutencao: "Descrição da manutenção",
  servico: "Serviço",
  solucao: "Solução",
  aberto_em: "Aberto em",
  resolvido_em: "Resolvido em",
  fechado_em: "Fechado em",
  criado_por: "Criado por",
  created_by: "Criado por",
  created_at: "Criado em",
  updated_at: "Atualizado em",
  ultima_movimentacao: "Última movimentação",
  solicitante_nome: "Solicitante",
  cc: "Com cópia",
  nome_arquivo: "Arquivo",
  mime_type: "Tipo do arquivo",
  storage_path: "Caminho no armazenamento",
  uploaded_by: "Enviado por",
  autor_nome: "Autor",
  status_anterior: "Status anterior",
  status_novo: "Status novo",
  acao: "Ação",
  dotacao: "Dotação",
  saldo_dotacao: "Saldo da dotação",
  saldo_empenho: "Saldo do empenho",
  reforco_empenho: "Reforço de empenho",
  anulacao_empenho: "Anulação de empenho",
  nota_empenho: "Nota de empenho",
  especificacao: "Especificação",
  justificativa: "Justificativa",
  elemento_despesa: "Elemento de despesa",
  envolve_pca: "Envolve PCA",
  evidencia_sei: "Evidência SEI",
  publico_alvo: "Público-alvo",
  link_documento: "Link do documento",
  frequencia: "Frequência",
};

/** `data_fim` → "Fim"; coluna sem rótulo cadastrado vira "Nome da coluna". */
export function rotuloCampo(campo: string): string {
  const conhecido = ROTULO_CAMPO[campo];
  if (conhecido) return conhecido;
  const texto = campo.replace(/_id$/, "").replace(/_/g, " ").trim();
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** Traduz um id (unidade, contrato, usuário…) para um nome legível. */
export type ResolverNome = (id: string) => string | undefined;

// Colunas monetárias. O jsonb guarda só o número, e "50.000" sem o "R$" deixa
// dúvida se é valor, quantidade ou código.
const CAMPOS_MOEDA = new Set([
  "valor_mensal", "valor_total", "valor_unitario",
  "dotacao", "empenho", "liquidado", "saldo_dotacao", "saldo_empenho",
  "reforco_empenho", "anulacao_empenho",
]);

const RE_DATA = /^\d{4}-\d{2}-\d{2}$/;
const RE_INSTANTE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;
const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const fmtMoeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatarValor(
  valor: unknown,
  opcoes: { campo?: string; resolver?: ResolverNome } = {},
): string {
  const { campo, resolver } = opcoes;
  if (valor === null || valor === undefined || valor === "") return "—";
  if (typeof valor === "boolean") return valor ? "Sim" : "Não";
  if (typeof valor === "number") {
    return campo && CAMPOS_MOEDA.has(campo) ? fmtMoeda.format(valor) : valor.toLocaleString("pt-BR");
  }
  if (typeof valor === "string") {
    // Data do domínio é só data: vira dd/mm/aaaa por texto, sem passar por
    // Date — que a leria em UTC e poderia voltar um dia.
    if (RE_DATA.test(valor)) {
      const [a, m, d] = valor.split("-");
      return `${d}/${m}/${a}`;
    }
    if (RE_INSTANTE.test(valor)) return formatarDataHora(valor);
    if (RE_UUID.test(valor)) return resolver?.(valor) ?? `${valor.slice(0, 8)}…`;
    return valor;
  }
  if (Array.isArray(valor)) {
    if (valor.length === 0) return "—";
    const simples = valor.every((v) => v === null || typeof v !== "object");
    return simples
      ? valor.map((v) => formatarValor(v, { resolver })).join(", ")
      : JSON.stringify(valor);
  }
  return JSON.stringify(valor);
}

export type MudancaCampo = {
  campo: string;
  rotulo: string;
  /** `undefined` quando o registro não existia antes (inclusão, retrato). */
  antes: unknown;
  /** `undefined` quando o registro deixou de existir (exclusão). */
  depois: unknown;
};

// Nada dizem a quem lê a trilha: identificador técnico e carimbos que o
// próprio banco mantém.
const CAMPOS_TECNICOS = new Set(["id", "created_at", "updated_at", "ultima_movimentacao"]);

const vazio = (v: unknown) =>
  v === null || v === undefined || v === "" || (Array.isArray(v) && v.length === 0);

/**
 * Campos a exibir numa entrada. Na alteração, só o que mudou; na inclusão,
 * exclusão e retrato, o registro inteiro — sem os campos vazios, que numa
 * ficha de 20 colunas escondem as poucas preenchidas.
 */
export function mudancas(
  e: Pick<EntradaAuditoria, "operacao" | "antes" | "depois" | "campos_alterados">,
): MudancaCampo[] {
  const antes = e.antes ?? {};
  const depois = e.depois ?? {};

  let campos: string[];
  if (e.operacao === "UPDATE") {
    campos = e.campos_alterados.length > 0
      ? e.campos_alterados
      : Object.keys(depois).filter(
          (k) => !CAMPOS_TECNICOS.has(k) && JSON.stringify(antes[k]) !== JSON.stringify(depois[k]),
        );
  } else {
    const base = e.operacao === "DELETE" ? antes : depois;
    campos = Object.keys(base).filter((k) => !CAMPOS_TECNICOS.has(k) && !vazio(base[k]));
  }

  return campos
    .map((campo) => ({
      campo,
      rotulo: rotuloCampo(campo),
      antes: e.operacao === "INSERT" || e.operacao === "RETRATO" ? undefined : antes[campo],
      depois: e.operacao === "DELETE" ? undefined : depois[campo],
    }))
    .sort((a, b) => a.rotulo.localeCompare(b.rotulo, "pt-BR"));
}

/** Frase curta para a coluna "O que mudou" da listagem. */
export function resumo(
  e: Pick<EntradaAuditoria, "operacao" | "antes" | "depois" | "campos_alterados">,
): string {
  switch (e.operacao) {
    case "INSERT":  return "Incluiu o registro";
    case "DELETE":  return "Excluiu o registro";
    case "RETRATO": return "Estado na ativação da trilha";
    case "UPDATE": {
      const rotulos = mudancas(e).map((m) => m.rotulo);
      if (rotulos.length === 0) return "Alterou o registro";
      const extras = rotulos.length - 3;
      return `Alterou ${rotulos.slice(0, 3).join(", ")}${extras > 0 ? ` e mais ${extras}` : ""}`;
    }
  }
}

/** Quem fez. Sem usuário identificado, a origem é o que resta para dizer. */
export function autor(e: Pick<EntradaAuditoria, "usuario_id" | "usuario_nome" | "origem">): string {
  if (e.usuario_nome) return e.usuario_nome;
  if (e.usuario_id) return `Usuário ${e.usuario_id.slice(0, 8)}…`;
  if (e.origem === "sistema") return "Sistema";
  return ROTULO_ORIGEM[e.origem] ?? "Não identificado";
}

// Rondônia é UTC-4 o ano inteiro, sem horário de verão: o deslocamento fixo
// basta para transformar "dia" em "intervalo de instantes".
const DESLOCAMENTO_RONDONIA = "-04:00";

/** Meia-noite de um dia YYYY-MM-DD em Rondônia, como instante ISO. */
export function inicioDoDiaRondonia(iso: string): string {
  return `${iso}T00:00:00${DESLOCAMENTO_RONDONIA}`;
}

/**
 * A busca entra num filtro `or=(...)` do PostgREST: vírgula e parêntese
 * quebrariam a sintaxe, e `*`/`%` virariam curinga sem o usuário pedir.
 */
export function termoDeBusca(q: string): string {
  return q.replace(/[,()*%\\]/g, " ").replace(/\s+/g, " ").trim();
}

/** Linha da planilha exportada: uma entrada, com as mudanças por extenso. */
export function linhaExportacao(e: EntradaAuditoria, resolver?: ResolverNome): Record<string, string> {
  const detalhe = mudancas(e)
    .map((m) => {
      const antes = formatarValor(m.antes, { campo: m.campo, resolver });
      const depois = formatarValor(m.depois, { campo: m.campo, resolver });
      if (e.operacao === "UPDATE") return `${m.rotulo}: ${antes} → ${depois}`;
      return `${m.rotulo}: ${e.operacao === "DELETE" ? antes : depois}`;
    })
    .join("; ");

  return {
    "Data e hora": formatarDataHora(e.ocorrido_em),
    "Usuário": autor(e),
    "Papel": e.usuario_papel ?? "",
    "Origem": ROTULO_ORIGEM[e.origem] ?? e.origem,
    "Operação": ROTULO_OPERACAO[e.operacao] ?? e.operacao,
    "Tabela": rotuloTabela(e.tabela),
    "Registro": e.registro_rotulo ?? e.registro_id ?? "",
    "Detalhe": detalhe,
  };
}
