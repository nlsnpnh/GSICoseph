# Histórico de versões — SIG-COSEPH

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).
Versionamento semântico: `MAIOR.MENOR.CORREÇÃO`.

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
