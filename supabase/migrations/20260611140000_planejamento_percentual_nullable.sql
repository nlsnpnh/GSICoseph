-- Planejamento: permitir percentual "não informado" (NULL) para bater com a planilha.
-- Na planilha, ações com a célula "% Execução" em branco NÃO entram na média do setor;
-- o seed inicial converteu esses brancos para 0. Aqui voltamos esse caso para NULL.

ALTER TABLE public.planejamento_acoes ALTER COLUMN percentual DROP NOT NULL;
ALTER TABLE public.planejamento_acoes ALTER COLUMN percentual SET DEFAULT 0;

-- Ação cujo "% Execução" estava em branco na planilha (Assessoria COSEPH / "Em andamento").
UPDATE public.planejamento_acoes
SET percentual = NULL
WHERE ano = 2026
  AND setor = 'assessoria_coseph'
  AND acao = 'Gestão Orçamentária'
  AND status = 'Em andamento'
  AND percentual = 0;
