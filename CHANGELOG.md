# Histórico de versões — SIG-COSEPH

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).
Versionamento semântico: `MAIOR.MENOR.CORREÇÃO`.

---

## [1.3.0] — 2026-09-14

Trilha de auditoria: toda inclusão, alteração e exclusão feita no sistema passa
a ser registrada com autor, data e hora, e os valores de antes e depois. Fecha a
lacuna de risco alto apontada no Dossiê GSI/STIC.

> **Requer a migration `20260914120000_trilha_auditoria.sql`**, aplicada pelo
> SQL Editor. Ela roda numa transação única: cria a tabela, liga os triggers e
> grava o retrato inicial juntos.
>
> **Requer publicar as edge functions `admin-delete-user` e `bootstrap-admin`**
> depois da migration (elas chamam funções que a migration cria). Sem a nova
> versão, o sistema funciona, mas a exclusão de usuário fica registrada sem
> autor.
>
> `src/integrations/supabase/types.ts` foi ajustado à mão, pelo mesmo motivo da
> 1.2.0.

### Adicionado

- **Tabela `auditoria`**, alimentada por um trigger em todas as tabelas de
  `public`. Guarda a linha inteira antes e depois, a lista de campos
  alterados, o usuário (com nome e papel copiados no momento do fato) e a
  origem: tela do sistema, função administrativa, cadastro de acesso ou
  alteração direta no banco.
- **Imutável**: sem policy de escrita, privilégios revogados e um trigger que
  recusa UPDATE, DELETE e TRUNCATE — inclusive para a service role.
- **Leitura só para admin**, pela RLS.
- **Retrato inicial**: na ativação, o estado de cada registro existente é
  gravado como ponto de partida da reconstituição.
- **Tela `/auditoria`** (só admin): filtros por período, tabela, usuário e
  operação, busca por registro ou usuário, detalhe campo a campo com o valor
  anterior riscado ao lado do novo, paginação no servidor e exportação para
  planilha.
- **Histórico por registro**: botão de relógio nas listagens de Unidades,
  Comarcas, Servidores, Terceirizados, Equipamentos e Contratos, e botão
  "Auditoria" na tela do chamado. Abre um painel lateral com tudo que
  aconteceu com aquele registro.
- **Aviso de tabela descoberta**: a tela aponta tabelas de `public` sem o
  trigger, com o comando para incluí-las.
- **Guia do Sistema**: seção "Trilha de Auditoria", exibida só para admin.
- Script de conferência em `supabase/verificacao/20260914_trilha_auditoria.sql`.

### Corrigido

- **Exclusão de chamado apagava a linha do tempo sem rastro.** Os eventos saem
  junto, por cascade; agora cada um fica guardado na auditoria.
- **Primeiro admin por concorrência.** A checagem "já existe admin?" da
  `bootstrap-admin` e a promoção eram duas chamadas separadas; dois cadastros
  simultâneos podiam passar os dois. Agora acontecem numa função só, com a
  tabela travada.

### Alterado

- O item "Auditoria" do menu aparece só para admin. `adminOnly` escondia itens
  apenas do operador; o gestor via e era devolvido ao painel.

## [1.2.1] — 2026-09-10

> **Requer a migration `20260910130000_remove_super_admin.sql`**, aplicada pelo
> SQL Editor **depois** de publicar este frontend — a versão anterior lê a
> coluna removida e quebraria a tela de Configurações.
>
> `src/integrations/supabase/types.ts` foi ajustado à mão, pelo mesmo motivo da
> 1.2.0.

### Removido

- **Administrador protegido** (`profiles.super_admin`), com o gatilho
  `proteger_super_admin` e o cadeado em Configurações. A proteção era contornável:
  excluir o usuário apagava o perfil antes do papel e levava a flag junto. Todos
  os admins passam a ter o mesmo nível; continua valendo a trava que impede o
  último admin de tirar o próprio papel.

## [1.2.0] — 2026-09-09

Substitui o módulo de Manutenção por uma Central de Chamados de prestação de
serviços, que controla o ciclo inteiro do atendimento em vez de apenas cadastrar
uma manutenção.

> **Requer as migrations `20260909120000_central_chamados.sql` e
> `20260909130000_chamados_limpeza.sql`**, aplicadas pelo SQL Editor do
> Supabase.
>
> `src/integrations/supabase/types.ts` foi atualizado **à mão**, contra a regra
> usual, porque `supabase gen types` precisa de Docker e a rede do TJ bloqueia
> o HTTPS do Supabase. Ao rodar o gerador de uma máquina com Docker, o arquivo
> volta a ser gerado e a edição manual é descartada sem perda.

### Adicionado

- **Central de Chamados** (`/chamados`), com as visualizações Pendentes,
  Fechados, Todos, Personalizado, Painel e Relatórios. Busca, ordenação,
  paginação e filtros combináveis por unidade, contrato, categoria, serviço,
  status, prioridade, responsável e período.
- **Tela de abertura** (`/chamados/novo`) e **tela do chamado**
  (`/chamados/:id`), com ficha lateral, mensagens e linha do tempo.
- **Histórico do chamado** (`chamado_eventos`): abertura, mensagens, mudanças
  de status, conclusão, fechamento e reabertura, cada evento com data, hora e
  autor. A tabela não tem policy de UPDATE nem DELETE — o histórico não se
  reescreve.
- **Encerramento** com solução adotada e justificativa; `resolvido_em` e
  `fechado_em` são registrados automaticamente. Chamado fechado ou cancelado
  pode ser **reaberto** mediante justificativa.
- **Prazo pelo contrato**: novo campo `sla_dias` em contratos define o
  vencimento do chamado (`abertura + sla_dias`). Contrato sem SLA gera chamado
  sem prazo, em vez de herdar um número inventado.
- **Painel do módulo** com abertos, em atendimento, aguardando, vencidos e
  resolvidos no mês, mais o recorte por unidade predial.
- **Relatórios dos chamados**: indicadores por status, gráficos (status,
  categoria, unidade, abertos × resolvidos por mês), chamados pendentes há mais
  tempo, chamados sem movimentação e exportação em Excel e PDF.
- **Indicadores de segurança da unidade em três estados**: Sim, Não e **Não
  informado**. Eram booleanos `NOT NULL DEFAULT false`, então "não possui" e
  "ninguém respondeu" ficavam gravados igual — e o mapa lia os dois como
  cobertura zero. Comarca sem nenhuma resposta agora aparece em cinza (Sem
  dados), não em vermelho: das 8 comarcas que constavam como críticas, todas
  eram falta de cadastro, nenhuma era deficiência declarada.
- **Diagnóstico da cobertura de segurança** no Guia do Sistema, para
  administradores: explica de onde vem a cor do mapa e aponta quais unidades
  ainda não responderam os indicadores.
- `lib/seguranca.ts` com a regra de cobertura tri-estado, antes duplicada em
  dois componentes, e `lib/dates.ts` ganhou `formatarDataHora` (instante no
  fuso de Rondônia) e `anoAtual()`.
- `components/admin/SecaoFormulario.tsx` — o bloco de seção dos formulários de
  cadastro, que existia copiado byte a byte em cinco páginas.
- 36 testes novos, cobrindo prazo, vencimento, fluxo de status e filtros.

### Alterado

- **O operador passa a abrir e movimentar chamados da própria unidade.** Antes
  só conseguia visualizar. Excluir continua com admin e gestor — o histórico do
  atendimento não some por decisão da unidade.
- **`contratos.unidades_atendidas` virou `contratos.unidade_ids`** (`uuid[]`).
  A coluna guardava os *nomes* das unidades, então renomear uma unidade
  desvinculava seus contratos em silêncio.
- O tipo de `Contrato.empresa` deixou de ser a lista fechada de terceirizados,
  que não cobria as empresas já cadastradas (V2 INTEGRADORA, TECHSCAN).
- **O ano do exercício vinha do relógio do navegador.** `new Date().getFullYear()`
  lê o fuso de quem acessa: em 31/12 à noite, um acesso de Brasília já veria o
  ano seguinte enquanto Rondônia (UTC−4) ainda não virou — e a lista de
  exercícios do Orçamento e do Planejamento mudava conforme a localização do
  usuário. Passou a usar `anoAtual()` de `lib/dates.ts`.
- **A policy de leitura de contratos passou a casar por id.** Comparava
  `get_user_unidade_nome()` contra o array de nomes, então renomear uma unidade
  escondia os contratos dela do operador, sem aviso.
- O enum `prioridade_oco` virou `prioridade_chamado`, e os índices e o trigger
  da tabela renomeada deixaram de falar em "ocorrências".
- Painel executivo, Consultas, Relatórios e Alertas passaram a falar em
  chamados; `/ocorrencias` redireciona para `/chamados`.
- **O fio de acento passou a marcar também as superfícies suspensas** —
  diálogos de cadastro, confirmação de exclusão, painel lateral da comarca — e
  cada seção dos formulários. Aplicado nos primitivos, para que um diálogo novo
  já nasça no padrão.
- **Gráficos de barras dobram a cauda em "Outras N"** em vez de listar tudo:
  "unidades por comarca" vinha com 31 barras e mais de 800px de altura. Ganharam
  também rótulo no fim de cada barra, e a grade perdeu o tracejado.
- **Gráfico vazio agora explica o motivo** quando há um: "nenhuma divergência"
  e "nenhum chamado registrado ainda" no lugar de um "Sem dados" que parecia
  defeito.
- O Guia do Sistema foi reescrito nas seções que descreviam telas que mudaram
  ou campos que não existem.

### Removido

- Módulo de Manutenção (`OcorrenciasPage`, `components/ocorrencias/`,
  `data/ocorrencias.ts`) e a lista de 15 categorias com SLA fixo embutida no
  código, substituída pelos catálogos de serviço e categoria do novo módulo.
- Colunas do modelo antigo de ocorrência sem uso no novo fluxo (`titulo`,
  `tipo`, `equipamento`, `empresa_responsavel`, `observacoes`) e os tipos
  `status_oco` e `tipo_ocorrencia`.
- `chamados.data_abertura`, que sobrevivia ao lado de `aberto_em`. Além de
  redundante, seu default `CURRENT_DATE` era lido no fuso do servidor (UTC):
  chamado aberto após as 20h em Rondônia nasceria com a data do dia seguinte.
- Policy de exclusão de anexos duplicada, que era somada por OR à de
  admin/gestor e não tinha efeito.

---

## [1.1.0] — 2026-08-19

Primeira atualização versionada. Reúne a revisão técnica do sistema e a
padronização visual das telas.

### Corrigido

- **Contrato que vence hoje aparecia como vencido.** A comparação usava a hora
  corrente contra a meia-noite da data de fim. Afetava a listagem de contratos e
  a consulta "contratos vencidos".
- **Chamado aberto após as 20h era gravado com a data do dia seguinte.** A data
  vinha em UTC; em Rondônia (UTC−4) isso adiantava o dia toda noite.
- **Prazo de SLA das manutenções** era montado a partir do horário local do
  navegador, podendo deslocar um dia.
- **Tempo de serviço do servidor mostrava 9,9 no décimo aniversário.** A conta
  usava a média de 365,25 dias por ano e truncava o resultado.
- **Mês e ano do Boletim** vinham do relógio do navegador: a virada de mês e de
  exercício acontecia em momentos diferentes conforme o fuso do usuário.
- **Tela de promoção do primeiro administrador era inalcançável.** Ficava atrás
  da checagem de liberação, então um usuário recém-cadastrado nunca chegava até
  ela — só era acessível depois que já existia um admin, quando não servia mais.
- **Botões de ação que o banco recusava.** Gestor via "Excluir" em unidades e
  contratos, e operador via botões de escrita em equipamentos e contratos, sem
  ter permissão para nenhum dos dois.

- **Erro em uma tela derrubava o sistema inteiro.** Sem limite de erro, qualquer
  falha ao desenhar uma página apagava tudo, menu incluído, sem nenhuma
  mensagem. Agora a falha fica contida na área de conteúdo.
- **Gráficos ilegíveis no modo escuro.** A grade tracejada usava cor fixa clara
  e aparecia como um pontilhado forte sobre os gráficos.
- **Caixa branca sobre os gráficos.** Em "Execução por Ação" e no Planejamento,
  as dicas de valor e o realce ao passar o mouse usavam o cinza-claro padrão da
  biblioteca, em vez das cores do tema.
- **Barra de rolagem à vista** no relatório cadastral de servidores.

### Adicionado

- **Datas ancoradas no fuso de Rondônia** (`src/lib/dates.ts`). O "hoje" do
  sistema é o de America/Porto_Velho, não o do navegador de quem acessa.
- **Permissões espelhando a RLS** (`src/lib/permissoes.ts`). A interface passa a
  consultar `podeEditar` / `podeExcluir` antes de oferecer uma ação.
- **Coluna Segurança em Unidades Prediais**, com os indicadores de DERSO,
  controle de acesso e vigilância eletrônica — dados que já existiam no banco e
  não apareciam na listagem.
- **Listagens separadas por grupo**, com faixa nomeada onde o grupo troca:

  | Tela | Separada por |
  |---|---|
  | Unidades Prediais | comarca — Porto Velho primeiro, demais alfabéticas |
  | AFS por unidade predial | comarca — Porto Velho primeiro, com subtotal de AFS |
  | Servidores | unidade predial |
  | Terceirizados | unidade predial |
  | Configurações | papel — admin, gestor, operador |

  Operador, que enxerga uma unidade só, continua vendo a lista em ordem
  alfabética simples.
- **Suíte de testes**: 89 testes cobrindo SLA, vigência de contratos, orçamento,
  idade e tempo de serviço, cálculo de datas e permissões.
- **Fio de acento** no topo de cada card — o único ornamento do sistema.
- **Versão do sistema** exibida no rodapé do menu lateral.

### Alterado

- **Listagens mais densas.** Altura de linha de 56px para 36px, cabeçalho de
  coluna em caixa alta e realce de acento na borda esquerda ao passar o mouse.
  Cabe aproximadamente o dobro de registros por tela.
- **Editar e excluir lado a lado** na mesma célula, com a lixeira sempre
  vermelha.
- **Menos colunas, com hierarquia.** Servidores saiu de 9 para 6 colunas e
  Terceirizados de 8 para 7, juntando o que se repetia (matrícula sob o nome,
  regime junto do cargo, tempo e idade numa coluna só) e tirando da linha o
  dado que passou a ser título da faixa de grupo.
- **Campos de texto das grades não têm mais a caixa expansível.** Em
  Planejamento e Orçamento, o `textarea` exibia a alça de redimensionamento do
  navegador em cada linha; agora o campo cresce com o conteúdo.
- **Prioridade e status sem a bolha.** Nos seletores do Planejamento o valor
  escolhido aparecia dentro de uma cápsula no meio do campo; passou a ponto
  colorido ao lado do rótulo.
- **Cabeçalhos de página** com rótulo de seção (Cadastro, Pessoal, Patrimônio,
  Operação, Análise) e título em peso leve.
- **Carga inicial 75% menor**: de 818 kB para cerca de 208 kB compactados. As
  rotas passam a carregar sob demanda, e as bibliotecas de exportação (Excel e
  PDF) só são baixadas quando o usuário clica em exportar.
- **Painel executivo revisado.** Cabeçalho mais baixo, indicadores com um matiz
  próprio por assunto e cor no número reservada ao que pede providência —
  alertas e manutenções só acendem quando há algo pendente. Os atalhos de ações
  rápidas deixaram de reagir ao mouse.
- **Cards deixaram de saltar ao passar o mouse.** O efeito estava no componente
  base e valia até para cards que não são clicáveis.
- **Tipos do banco regenerados**: 11 para 17 tabelas.
- **Páginas extensas divididas em componentes.** Manutenção saiu de 980 para 61
  linhas, Boletim de 783 para 61 e Consultas de 613 para 210, com as partes
  movidas para `components/ocorrencias`, `components/boletim` e
  `components/consultas`.

### Removido

- Dependências sem uso: `leaflet`, `react-leaflet` e `@types/leaflet`.
- 13 funções de acesso a dados que não eram chamadas por nenhuma tela.
- Arquivo de dados fictícios do painel (`mockDashboard.ts`), do qual só o tipo
  `Criticidade` seguia em uso.

---

## [1.0.0] — 2026-08-18

Versão inicial em produção, anterior à adoção do versionamento. Contempla os
módulos de unidades prediais, comarcas, servidores, terceirizados, equipamentos,
portões, contratos, manutenções, boletim operacional, consultas, relatórios,
planejamento e orçamento, com autenticação e controle de acesso por papel.
