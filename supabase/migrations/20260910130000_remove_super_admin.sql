-- Remove o "administrador protegido". A flag criava uma classe de admin acima
-- dos outros, mas não protegia de fato: a exclusão do usuário apagava o perfil
-- antes do papel e levava a flag junto. Todos os admins passam a ser iguais;
-- a única trava que resta é a da tela, que impede o último admin de se rebaixar.
--
-- Aplique DEPOIS de publicar o frontend da 1.2.1: a versão anterior pede a
-- coluna super_admin na tela de Configurações e quebraria sem ela.

DROP TRIGGER IF EXISTS tg_proteger_super_admin ON public.user_roles;
DROP FUNCTION IF EXISTS public.proteger_super_admin();
ALTER TABLE public.profiles DROP COLUMN IF EXISTS super_admin;
