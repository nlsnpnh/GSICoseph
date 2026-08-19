# SIG-COSEPH

Sistema Integrado de Gestão da Segurança Patrimonial e Humana — COSEPH / TJRO.
Painel de gestão de unidades prediais, servidores, terceirizados, equipamentos,
contratos, manutenções, boletim operacional, planejamento e orçamento.

## Stack

Vite 5 · React 18 · TypeScript · Tailwind + shadcn/ui (Radix) · React Router 6 ·
TanStack Query 5 · Supabase (auth, Postgres com RLS, storage, edge functions).
Deploy na Vercel (`vercel --prod --yes`, projeto `gsi-coseph`).

## Comandos

```bash
npm run dev      # servidor local na porta 8080
npm test         # vitest (76+ testes, sem watch)
npm run lint     # eslint — deve terminar limpo
npm run build    # build de produção
npx tsc --noEmit -p tsconfig.app.json   # type-check
```

Antes de dar por pronto: `tsc`, `lint`, `test` e `build` têm de passar.

## Organização

```
src/
  data/          uma entidade por arquivo, cada um expõe seus hooks (useX, addX,
                 updateX, removeX). api.ts guarda só comarcas e anexos.
  lib/           código puro e sem React: dates, permissoes, exporters, utils.
  pages/         uma rota por arquivo, default export.
  components/    reaproveitáveis (CrudTableLayout, PageHeader, ConfirmDelete,
                 EmptyState, StatCard) + subpastas por domínio.
  contexts/      AuthContext (sessão, papéis, permissões), Theme, Period.
supabase/
  migrations/    SQL versionado. Aplicado pelo SQL Editor do dashboard — a
                 conexão direta ao Postgres é bloqueada pela rede daqui.
  functions/     edge functions (bootstrap-admin, admin-delete-user).
```

## Regras que não são óbvias no código

**Datas.** Todo campo de data do domínio é `YYYY-MM-DD`, sem hora. Use sempre
`src/lib/dates.ts` (`hojeISO`, `addDiasISO`, `diffDiasISO`, `anosCompletosISO`),
nunca `new Date()` direto. O "hoje" do sistema é o de **America/Porto_Velho**,
não o do navegador — quatro bugs já vieram daí. `toISOString().slice(0,10)`
sobre data local é o padrão a evitar: converte para UTC e pode voltar um dia.

**Permissões.** `src/lib/permissoes.ts` espelha as policies de RLS. A interface
consulta `podeEditar(recurso, unidadeIdDoRegistro?)` / `podeExcluir(...)` do
`useAuth()` para decidir se mostra botão. **Ao mexer numa policy, atualize a
tabela desse arquivo junto** — senão a UI oferece ação que o banco recusa.
Quem autoriza de fato é a RLS; isto aqui é só para não frustrar o usuário.

**Papéis.** `admin` > `gestor` > `operador`. Ficam em `user_roles` (tabela
separada, nunca no JWT nem no profile). `isOperador` só é true quando o usuário
não é admin nem gestor. Operador enxerga e escreve apenas na própria unidade,
via `get_user_unidade_id()` na RLS.

**Bootstrap.** `/bootstrap-admin` é alcançável por usuário ainda sem papel
(`ProtectedRoute exigeLiberacao={false}`), senão a tela só existiria quando já
fosse inútil. A edge function recusa a promoção assim que houver um admin.

**Bundle.** Rotas entram por `React.lazy`. Bibliotecas pesadas (`xlsx`, `jspdf`)
são carregadas por `import()` dentro da função que as usa, não no topo do
arquivo. O geojson do mapa mora no chunk do `ComarcasMap`, que também é lazy.

**Types do Supabase.** `src/integrations/supabase/types.ts` é gerado, não edite
à mão. Regenere com:

```bash
SUPABASE_ACCESS_TOKEN=sbp_xxx npx supabase gen types typescript \
  --project-id biihefnojkwqvidcfbhn > src/integrations/supabase/types.ts
```

## Testes

Vitest + jsdom. O client do Supabase é stubado em `src/test/setup.ts`, então
módulos de `data/` podem ser importados sem variáveis de ambiente. Testes de
data congelam o relógio num **instante absoluto UTC** (`"2026-08-19T15:00:00Z"`),
não em hora local — assim independem do fuso da máquina.

A cobertura hoje é de funções puras (SLA, vigência, orçamento, idade, datas,
permissões). Componentes ainda não têm teste.

## Idioma

Código, comentários, commits e interface em português. Comentários explicam
*por que*, não *o que* — o código já diz o quê.
