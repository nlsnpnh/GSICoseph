# Estrutura do SIG-COSEPH

Referência de como o sistema está organizado e por que cada decisão foi tomada.
Para o histórico do que mudou em cada versão, ver `CHANGELOG.md`. Para as regras
de trabalho no repositório, ver `CLAUDE.md`.

---

## 1. O que é

Sistema Integrado de Gestão da Segurança Patrimonial e Humana — COSEPH / TJRO.
Controla as edificações do Tribunal de Justiça de Rondônia e tudo que orbita a
segurança delas: pessoal próprio e terceirizado, equipamentos, portões,
contratos, manutenções, boletim operacional, planejamento e orçamento.

**Stack.** Vite 5 · React 18 · TypeScript · Tailwind + shadcn/ui (Radix) ·
React Router 6 · TanStack Query 5 · Supabase (autenticação, Postgres com RLS,
storage e edge functions). Publicado na Vercel.

**Escala.** 23 rotas, 17 tabelas, 35 migrations, 101 arquivos de código
(fora os 49 primitivos de `components/ui`), 89 testes.

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
│   ├── ocorrencias/  abas da Manutenção
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
ocorrencias.ts · portoes.ts · equipamentos.ts · boletim.ts
planejamento.ts · orcamento.ts · mapa.ts
api.ts   → só comarcas e anexos de ocorrência
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

**Migrations.** Aplicadas pelo SQL Editor do painel do Supabase — a conexão
direta ao Postgres é bloqueada pela rede interna.

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
| ocorrências, equipamentos | admin, gestor | admin, gestor |
| portões, boletim | admin, gestor, operador (própria unidade) | admin |
| servidores, terceirizados | admin, gestor, operador (própria unidade) | admin, gestor, operador (própria unidade) |
| planejamento, orçamento | admin | admin |

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

Vitest + jsdom. **89 testes**, todos sobre funções puras:

| Arquivo | Cobre |
|---|---|
| `lib/dates.test.ts` | fuso de Rondônia, bissexto, viradas de mês e ano |
| `lib/permissoes.test.ts` | a matriz de papéis inteira |
| `lib/utils.test.ts` | mensagens de erro, composição de classes |
| `data/ocorrencias.test.ts` | SLA por categoria, atrasado, em risco, no prazo |
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
npm test                                # 89 testes
npm run build                           # sem aviso de chunk grande
```

Os quatro precisam passar.

---

## 10. O que ainda está aberto

| Pendência | Onde |
|---|---|
| Mapa das comarcas sem revisão de apresentação | `components/dashboard/ComarcaDetailDrawer.tsx`, `MapaComarcasCard.tsx` |
| `RelatoriosPage` com 489 linhas — o miolo é um bloco de `useMemo` | `pages/RelatoriosPage.tsx` |
| Nenhum teste de componente | — |
| Ano do exercício vem do relógio do navegador | `data/orcamento.ts:96`, `data/planejamento.ts:109` |
| `equipamentos_catalogo` existe no banco sem migration no repositório | `supabase/migrations/` |
