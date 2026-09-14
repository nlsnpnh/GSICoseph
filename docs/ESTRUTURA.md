# Estrutura do SIG-COSEPH

Referência de como o sistema está organizado e por que cada decisão foi tomada.
Para o histórico do que mudou em cada versão, ver `CHANGELOG.md`. Para as regras
de trabalho no repositório, ver `CLAUDE.md`.

---

## 1. O que é

Sistema Integrado de Gestão da Segurança Patrimonial e Humana — COSEPH / TJRO.
Controla as edificações do Tribunal de Justiça de Rondônia e tudo que orbita a
segurança delas: pessoal próprio e terceirizado, equipamentos, portões,
contratos, chamados de prestação de serviços, boletim operacional, planejamento
e orçamento.

**Stack.** Vite 5 · React 18 · TypeScript · Tailwind + shadcn/ui (Radix) ·
React Router 6 · TanStack Query 5 · Supabase (autenticação, Postgres com RLS,
storage e edge functions). Publicado na Vercel.

**Escala.** 26 rotas, 19 tabelas, 40 migrations, 111 arquivos de código
(fora os 49 primitivos de `components/ui` e os testes), 147 testes.

---

## 2. Mapa de pastas

```
src/
├── pages/            uma rota por arquivo, sempre com export default
├── components/
│   ├── ui/           primitivos shadcn — não editar salvo decisão de sistema
│   ├── admin/        primitivos de listagem (ações de linha, campo de texto…)
│   ├── boletim/      abas do Boletim Operacional
│   ├── consultas/    catálogo de consultas prontas
│   ├── dashboard/    mapa, gráficos e painéis do painel executivo
│   ├── chamados/     Central de Chamados (filtros, tabela, painel, relatórios)
│   ├── ajuda/        diagnóstico de cadastro exibido no Guia do Sistema
│   ├── orcamento/    tabelas do Orçamento
│   ├── planejamento/ painel e grade do Planejamento
│   ├── relatorios/   blocos de apresentação dos relatórios
│   └── *.tsx         componentes gerais (PageHeader, CrudTableLayout…)
├── data/             uma entidade por arquivo, expõe hooks (useX, addX, updateX…)
├── lib/              código puro, sem React
├── contexts/         AuthContext, ThemeContext, PeriodContext
├── hooks/            hooks de UI reaproveitáveis
├── layouts/          AdminLayout (sidebar + área de conteúdo)
├── integrations/     cliente e tipos gerados do Supabase
└── test/             configuração do Vitest

supabase/
├── migrations/       SQL versionado
└── functions/        edge functions (bootstrap-admin, admin-delete-user)
```

**Regra de ouro:** nada em `lib/` importa React. É lá que mora a lógica que dá
para testar sem montar componente — e é lá que está toda a cobertura de testes.

---

## 3. Camada de dados

Cada entidade tem um arquivo em `src/data/` que exporta seus próprios hooks:

```
unidades.ts · servidores.ts · terceirizados.ts · contratos.ts
chamados.ts · chamadoEventos.ts · portoes.ts · equipamentos.ts · boletim.ts
planejamento.ts · orcamento.ts · mapa.ts · auditoria.ts
api.ts   → só comarcas e anexos de chamado
```

Esses arquivos se chamavam `*Mock.ts` por herança do protótipo, mas já
consultavam o Supabase de verdade havia tempo. O nome enganava quem abria o
projeto e foi corrigido.

**Tipos do banco.** `src/integrations/supabase/types.ts` é **gerado**, não se
edita à mão:

```bash
SUPABASE_ACCESS_TOKEN=sbp_xxx npx supabase gen types typescript \
  --project-id biihefnojkwqvidcfbhn > src/integrations/supabase/types.ts
```

**Migrations.** Aplicadas pelo SQL Editor do painel do Supabase.

### O que a rede do TJ bloqueia

Vale saber antes de tentar automatizar qualquer coisa contra o Supabase daqui:

| Caminho | Estado |
|---|---|
| HTTPS para `*.supabase.co` e `api.supabase.com` | **bloqueado** — o TLS é interceptado e o handshake morre (curl sai com 35) |
| Postgres direto na 5432 (pooler), **com** TLS | bloqueado, `ECONNRESET` |
| Postgres direto na 5432, **sem** TLS | funciona — é o único caminho de leitura |
| `supabase gen types --db-url` | conecta, mas exige Docker para subir o `pg-meta`; não há Docker nas máquinas daqui |

Consequências práticas: a migration vai pelo SQL Editor, e a regeneração de
tipos precisa de uma máquina com Docker e sem a interceptação de TLS. A senha
do banco trafega em claro no caminho sem TLS — use só para leitura pontual, e
prefira o SQL Editor.

O histórico de migrations do CLI (`supabase_migrations.schema_migrations`) tem
só 3 registros, com versões que não batem com os arquivos do repositório
(resquício do Lovable). **Não rode `supabase db push`**: ele leria as outras 30+
migrations como pendentes e tentaria recriar tabelas que já existem.

### Indicadores de segurança da unidade

`unidades.possui_derso`, `.controle_acesso` e `.vigilancia_eletronica` são
**tri-estado**: `true` possui, `false` não possui, **`NULL` não informado**.

Eram `BOOLEAN NOT NULL DEFAULT false`, e por isso "esta unidade não tem CFTV" e
"ninguém respondeu se tem CFTV" ficavam gravados exatamente igual. A função do
mapa lia os dois como cobertura zero, então **8 comarcas apareciam em vermelho
por falta de cadastro** — nenhuma delas por deficiência declarada.

A regra que vale em todo lugar: **quem não respondeu fica fora da conta**, nem
no numerador nem no denominador. `src/lib/seguranca.ts` concentra isso
(`calcCobertura`, `coberturaDoCampo`, `semResposta`) e é onde estão os testes;
a função `mapa_comarcas_resumo()` aplica a mesma regra no banco. Comarca sem
nenhuma resposta vira `sem_dados` (cinza), não `critico`.

Ao ler qualquer um desses campos, **nunca use truthiness**: `!u.possui_derso`
captura o `NULL` junto e volta a misturar as duas coisas. Compare explicitamente
com `=== false` ou `== null`.

### Central de Chamados

O módulo substituiu a antiga tela de Manutenção. A tabela `ocorrencias` foi
**renomeada** para `chamados` (estava vazia), preservando a sequence do número,
a FK dos anexos e as policies de storage.

**A regra que sustenta o módulo:** nenhum chamado existe sem `unidade_id` **e**
`contrato_id`. As duas colunas são `NOT NULL` com `ON DELETE RESTRICT` — apagar
uma unidade ou um contrato que tenha chamado é recusado pelo banco, porque o
chamado perderia a resposta de *onde ocorreu* e *qual contrato responde*.

O fluxo da tela reflete isso: escolher a unidade filtra os contratos aplicáveis
(`contratos.unidade_ids`), e o contrato escolhido carrega empresa, fiscal e o
prazo de atendimento.

**SLA.** `contratos.sla` é a cláusula em texto corrido e não serve para
calcular nada. Quem define o vencimento é `contratos.sla_dias` (inteiro):
`prazo = dia da abertura + sla_dias`. Contrato sem `sla_dias` gera chamado
**sem prazo** — melhor que herdar um número inventado.

**Vínculo unidade↔contrato.** `contratos.unidade_ids` é `uuid[]`. Antes era
`unidades_atendidas text[]` com os **nomes** das unidades: renomear uma unidade
desvinculava seus contratos em silêncio.

**Histórico.** Toda movimentação vira uma linha em `chamado_eventos`. A tabela
não tem policy de UPDATE nem de DELETE — o histórico não se reescreve, nem por
admin. Um trigger em cada INSERT empurra `chamados.ultima_movimentacao`, que é
o que alimenta "data da última ação" e a busca por chamados parados.

**Status.** Oito estados no enum `status_chamado`. As transições válidas estão
em `TRANSICOES` (`src/data/chamados.ts`) — impedem saltos incoerentes, como ir
de "Novo" direto para "Fechado". "Pendente" é tudo que não é `Fechado` nem
`Cancelado`.

### Trilha de auditoria

Toda escrita em qualquer tabela de `public` gera uma linha em `auditoria`, por um
trigger genérico (`registrar_auditoria()`). A linha guarda o registro inteiro
**antes** e **depois** (jsonb), os campos que mudaram, o usuário — com nome e
papel **copiados** no momento do fato — e a origem.

**Por que trigger, e não o front.** Se o registro dependesse da tela, uma
alteração pelo SQL Editor, por uma edge function ou por um cliente que fale
direto com a API não deixaria rastro. O trigger pega tudo que passa pelo banco.

**Imutável, em três camadas.** Nenhuma policy de escrita; privilégios de
INSERT/UPDATE/DELETE/TRUNCATE revogados; e um trigger que recusa UPDATE, DELETE
e TRUNCATE mesmo para a `service_role`, que ignora RLS. Só o dono do projeto,
desligando o trigger no SQL Editor, passa daqui — e nenhuma trilha dentro do
próprio banco impede isso. Leitura: **só admin**.

**Quem agiu.** Pela tela, `auth.uid()`. As edge functions usam a service role,
em que `auth.uid()` é nulo — por isso não escrevem direto nas tabelas: chamam
`admin_excluir_usuario` e `bootstrap_promover_admin`, que declaram o autor com
`set_config('auditoria.ator', …)` **na mesma transação** da escrita. Cada
chamada do supabase-js é uma transação separada; um `set_config` numa chamada e
o DELETE em outra não se enxergariam.

**O que não entra.** UPDATE que só mexe em `updated_at` ou `ultima_movimentacao`
— são carimbos que o banco atualiza sozinho, e sem o filtro cada mensagem num
chamado duplicaria o log. Em `chamado_eventos` só a **exclusão** é auditada: a
inclusão já é a própria linha do tempo, mas a exclusão de um chamado leva os
eventos junto, por cascade, e isso precisa ficar guardado.

**Retrato inicial.** Na ativação, cada registro existente foi gravado como
`RETRATO`. É o ponto de partida da reconstituição: o que aconteceu antes da
ativação não existe na trilha. A listagem esconde os retratos por padrão.

**Tabela nova precisa ser ligada.** O trigger foi ligado por varredura na
migration; uma tabela criada depois fica de fora até rodar
`SELECT public.auditoria_ativar('nome');`. A tela de auditoria avisa quando
encontra tabela descoberta (`auditoria_tabelas_descobertas()`).

**Na interface.** A regra de apresentação (rótulos, formatação, diff) mora em
`src/lib/auditoria.ts`, com testes. `usePainelHistorico()` liga o painel de
histórico a qualquer listagem: `AcoesLinha` ganha o botão de relógio só para
admin.

---

## 4. Controle de acesso

Três papéis, guardados na tabela `user_roles` — nunca no JWT nem no perfil, o
que permitiria escalada de privilégio pelo cliente.

| Papel | Alcance |
|---|---|
| `admin` | tudo, em toda a rede |
| `gestor` | escrita nos cadastros operacionais, sem planejamento nem orçamento |
| `operador` | apenas a própria unidade predial |

`isOperador` só é verdadeiro quando o usuário **não** é admin nem gestor.

### A RLS é quem autoriza

O banco decide. `src/lib/permissoes.ts` apenas **espelha** as policies, para a
interface não oferecer um botão que o banco vai recusar em silêncio.

> **Ao alterar uma policy, atualize a tabela desse arquivo junto.**

Matriz vigente:

| Recurso | Escrita | Exclusão |
|---|---|---|
| comarcas, unidades, contratos | admin, gestor | admin |
| equipamentos | admin, gestor | admin, gestor |
| chamados | admin, gestor, operador (própria unidade) | admin, gestor |
| portões, boletim | admin, gestor, operador (própria unidade) | admin |
| servidores, terceirizados | admin, gestor, operador (própria unidade) | admin, gestor, operador (própria unidade) |
| planejamento, orçamento | admin | admin |
| auditoria | ninguém — só o trigger do banco | ninguém; **leitura só admin** |

Uso na tela:

```tsx
const { podeEditar, podeExcluir } = useAuth();
podeEditar("servidores", s.unidade_id)   // por linha
podeEditar("contratos")                  // ao criar
```

### Primeiro administrador

`/bootstrap-admin` é alcançável por usuário **ainda sem papel**
(`ProtectedRoute exigeLiberacao={false}`). Sem isso a tela só existiria depois
que já houvesse um admin — quando não serve mais para nada. A edge function
recusa a promoção assim que existe um admin no sistema.

---

## 5. Datas

Todo campo de data do domínio é **só data**, no formato `YYYY-MM-DD`, sem hora.
Misturar isso com `new Date()` do navegador causou cinco defeitos distintos.

**Sempre use `src/lib/dates.ts`:**

| Função | Para quê |
|---|---|
| `hojeISO()` | hoje em America/Porto_Velho |
| `addDiasISO(iso, n)` | somar dias sem desvio de fuso |
| `diffDiasISO(de, ate)` | diferença em dias inteiros |
| `anosCompletosISO(de, ate)` | idade, tempo de serviço |
| `addAnosISO(iso, n)` | 29/02 vira 28/02 em ano não bissexto |
| `formatarDataHora(instante)` | instante ISO → `09/09/2026 07:54` em Rondônia |

**A exceção à regra "só data" são os chamados.** A abertura e cada movimentação
de um chamado são *instantes*, não dias — o histórico precisa dizer 07:54, não
apenas "dia 9". Esses campos (`aberto_em`, `ultima_movimentacao`,
`resolvido_em`, `fechado_em`, `chamado_eventos.criado_em`) são `timestamptz` no
banco e só são lidos por `formatarDataHora`, que os projeta em Rondônia. O
**prazo** do chamado continua `DATE`: vencimento é um dia, não um instante.

**Nunca** `new Date()` direto para calcular data do domínio, e **nunca**
`toISOString().slice(0,10)` sobre uma data local — converte para UTC e pode
voltar um dia.

O "hoje" do sistema é o de **Rondônia**, não o do navegador: um acesso de
Brasília, ou um servidor em UTC, precisa enxergar o mesmo dia que o TJRO.

---

## 6. Apresentação

Tier 0 do design-labz aplicado sobre a identidade institucional: o azul do
brasão e o tema claro permanecem; do Tier 0 veio a disciplina — densidade,
hierarquia e restrição.

### Densidade

Vive em `src/components/ui/table.tsx`, então vale em todas as listagens:

| Elemento | Valor |
|---|---|
| Altura de linha | 36px (`px-3 py-1.5`) |
| Cabeçalho de coluna | `h-8`, 10px, caixa alta, tracking `0.14em` |
| Corpo | 13px |
| Hover | fundo `primary/3.5%` + fio de acento de 2px à esquerda |

### Primitivos

| Componente | Papel |
|---|---|
| `PageHeader` | eyebrow com fio dourado + título em peso leve |
| `CrudTableLayout` | moldura de listagem: busca, filtros e contagem |
| `admin/AcoesLinha` | editar e excluir lado a lado, lixeira sempre vermelha |
| `admin/CampoTexto` | campo de grade que cresce com o conteúdo, sem alça |
| `admin/SinalSeguranca` | chip de recurso presente/ausente |
| `lib/design-tokens.ts` | escala tipográfica e paleta dos gráficos |

### Agrupamento das listagens

Listas longas saem separadas por grupo, com uma faixa fina nomeando onde o
grupo troca. Quando o dado do grupo vira título da faixa, ele **sai da linha** —
repeti-lo em cada registro só gasta largura.

| Tela | Separada por |
|---|---|
| Unidades Prediais | comarca — Porto Velho primeiro |
| AFS por unidade predial | comarca — Porto Velho primeiro, com subtotal |
| Servidores | unidade predial |
| Terceirizados | unidade predial |
| Configurações | papel — admin, gestor, operador |

Operador enxerga uma unidade só: para ele a lista sai em ordem alfabética
simples, sem faixa. A regra de comarca mora em `src/lib/ordenacao.ts`.

### O que evitar

- `<textarea>` cru em célula de tabela — a alça de redimensionamento vira uma
  caixinha pendurada em cada linha; use `CampoTexto`.
- `<Badge>` como filho de `<SelectItem>` — o valor escolhido aparece dentro de
  uma cápsula no meio do campo; use ponto colorido ao lado do rótulo.
- Peso de fonte acima de 500 em títulos.

---

## 7. Desempenho

Carga inicial de **818 kB → ~208 kB** compactados.

- Rotas em `React.lazy` (22 delas).
- `xlsx` e `jspdf` (~850 kB somados) entram por `import()` **dentro da função**
  que exporta — só baixam quando o usuário clica.
- O mapa e seu geojson de 416 kB ficam num chunk próprio, carregado depois que
  o painel já pintou os indicadores.
- `manualChunks` separa `react-vendor`, `charts` e `supabase`, que mudam pouco
  e ficam em cache entre publicações.

---

## 8. Testes

Vitest + jsdom. **147 testes**, todos sobre funções puras:

| Arquivo | Cobre |
|---|---|
| `lib/auditoria.test.ts` | diff campo a campo, formatação de valores (data, instante, moeda, id), janela de período em Rondônia, busca segura no PostgREST |
| `lib/dates.test.ts` | fuso de Rondônia, bissexto, viradas de mês e ano |
| `lib/permissoes.test.ts` | a matriz de papéis inteira |
| `lib/utils.test.ts` | mensagens de erro, composição de classes |
| `data/chamados.test.ts` | prazo pelo SLA do contrato, vencimento, fluxo de status |
| `components/chamados/filtros.test.ts` | presets de período e filtros combinados |
| `lib/seguranca.test.ts` | cobertura tri-estado: "não" conta zero, "não informado" fica fora |
| `data/contratos.test.ts` | vencido, a vencer, vigente |
| `data/servidores.test.ts` | idade, faixa etária, tempo de serviço |
| `data/orcamento.test.ts` | consolidação e formatadores |
| `components/planejamento/statusUtils.test.ts` | cores de status e prioridade |

Convenções que evitam teste intermitente:

- O cliente do Supabase é substituído em `src/test/setup.ts`, então módulos de
  `data/` podem ser importados sem variáveis de ambiente.
- Testes de data congelam o relógio num **instante absoluto UTC**
  (`"2026-08-19T15:00:00Z"`), nunca em hora local — assim independem do fuso da
  máquina que roda a suíte.

**Lacuna conhecida:** nenhum componente é testado. Quatro páginas tiveram a
estrutura reescrita sem essa rede de proteção; a verificação foi visual.

---

## 9. Antes de dar por pronto

```bash
npx tsc --noEmit -p tsconfig.app.json   # tipos
npm run lint                            # deve terminar limpo
npm test                                # 147 testes
npm run build                           # sem aviso de chunk grande
```

Os quatro precisam passar.

---

## 10. O que ainda está aberto

| Pendência | Onde | Peso |
|---|---|---|
| **Nenhum teste de componente** — a Central de Chamados inteira (6 componentes, 3 páginas, ~2.000 linhas) foi construída apoiada só em `tsc`, `lint` e `build`. Os testes cobrem apenas funções puras | `components/chamados/`, `pages/Chamado*.tsx` | alto |
| **O mapa codifica nível só por cor**, e verde/vermelho é o par que daltonismo vermelho-verde não separa (~8% dos homens). Precisa de um segundo canal: textura, intensidade ou rótulo | `components/dashboard/ComarcasMap.tsx:7` | médio |
| **`types.ts` foi editado à mão** para as tabelas de chamados — `supabase gen types` exige Docker, ausente nas máquinas daqui. Regenerar quando houver ambiente | `integrations/supabase/types.ts` | médio |
| `equipamentos_catalogo` existe no banco sem migration no repositório | `supabase/migrations/` | baixo |
| `RelatoriosPage` com 504 linhas — o miolo é um bloco de `useMemo` que renderia um hook de ~15 retornos | `pages/RelatoriosPage.tsx` | baixo |
| Gráficos "unidades por comarca" e "servidores por comarca" seguem separados; fundir num só permitiria o cruzamento | `pages/RelatoriosPage.tsx` | a decidir |

Pendências de **dado**, não de código — dependem da COSEPH, não do repositório:

- `contratos.sla_dias` está nulo nos 4 contratos. Sem ele, chamado nasce sem
  prazo e nada aparece como vencido.
- 9 unidades estão sem nenhum dos três indicadores de segurança. O Guia do
  Sistema aponta quais, para administradores.

Resolvido e removido desta lista: revisão de apresentação do mapa das comarcas
e do painel lateral (feita), o `manualChunks` que quebrava os gráficos em
produção (removido), a substituição do módulo de Manutenção pela Central de
Chamados, e o ano do exercício que vinha do relógio do navegador (agora
`anoAtual()` de `lib/dates.ts`),
e os indicadores de segurança que não distinguiam "não possui" de "não
respondido" (agora tri-estado, com `NULL` = não informado) — ver CHANGELOG.
