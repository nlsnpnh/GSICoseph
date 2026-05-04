import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ===== Tipos =====
export type Comarca = {
  id: string;
  nome: string;
  entrancia: "Inicial" | "Intermediária" | "Final";
  municipios_atendidos: number;
  responsavel: string | null;
  endereco: string | null;
  telefone: string | null;
  lat: number | null;
  lng: number | null;
};

export type Unidade = {
  id: string;
  nome: string;
  tipo: "Fórum" | "Sede Administrativa" | "Anexo" | "Depósito";
  endereco: string | null;
  cidade: string | null;
  comarca_id: string | null;
  status: "Ativa" | "Inativa" | "Em reforma";
};

export type Servidor = {
  id: string;
  nome: string;
  matricula: string;
  cargo: string | null;
  lotacao: string | null;
  email: string | null;
  status: "Ativo" | "Afastado" | "Aposentado";
};

// Cliente sem tipos para tabelas dinâmicas / não geradas em types.ts
const sb = supabase as unknown as {
  from: (table: string) => any;
  storage: typeof supabase.storage;
  auth: typeof supabase.auth;
};

// ===== Hooks genéricos =====
function useList<T>(table: string, orderBy = "nome") {
  return useQuery({
    queryKey: [table],
    queryFn: async () => {
      const { data, error } = await sb.from(table).select("*").order(orderBy);
      if (error) throw error;
      return (data ?? []) as T[];
    },
  });
}

function useCreate<T extends Record<string, unknown>>(table: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: T) => {
      const { data, error } = await sb.from(table).insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [table] }),
  });
}

function useUpdate<T extends Record<string, unknown>>(table: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<T> }) => {
      const { error } = await sb.from(table).update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [table] }),
  });
}

function useRemove(table: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await sb.from(table).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [table] }),
  });
}

// ===== APIs por entidade =====
export const useComarcas = () => useList<Comarca>("comarcas");
export const useCreateComarca = () => useCreate<Partial<Comarca>>("comarcas");
export const useUpdateComarca = () => useUpdate<Partial<Comarca>>("comarcas");
export const useRemoveComarca = () => useRemove("comarcas");

export const useUnidades = () => useList<Unidade>("unidades");
export const useCreateUnidade = () => useCreate<Partial<Unidade>>("unidades");
export const useUpdateUnidade = () => useUpdate<Partial<Unidade>>("unidades");
export const useRemoveUnidade = () => useRemove("unidades");

export const useServidores = () => useList<Servidor>("servidores");
export const useCreateServidor = () => useCreate<Partial<Servidor>>("servidores");
export const useUpdateServidor = () => useUpdate<Partial<Servidor>>("servidores");
export const useRemoveServidor = () => useRemove("servidores");

// ===== Ocorrências =====
export type Ocorrencia = {
  id: string;
  titulo: string;
  descricao: string | null;
  tipo: string;
  gravidade: "Baixa" | "Media" | "Alta" | "Critica";
  status: "Aberta" | "Em andamento" | "Resolvida" | "Cancelada";
  data_fato: string;
  unidade_id: string | null;
  comarca_id: string | null;
  servidor_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type OcorrenciaAnexo = {
  id: string;
  ocorrencia_id: string;
  nome_arquivo: string;
  storage_path: string;
  mime_type: string | null;
  tamanho: number | null;
  created_at: string;
};

export const useOcorrencias = () =>
  useQuery({
    queryKey: ["ocorrencias"],
    queryFn: async () => {
      const { data, error } = await sb
        .from("ocorrencias")
        .select("*")
        .order("data_fato", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Ocorrencia[];
    },
  });

export const useCreateOcorrencia = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Ocorrencia>) => {
      const { data: u } = await supabase.auth.getUser();
      const { data, error } = await sb
        .from("ocorrencias")
        .insert({ ...payload, created_by: u.user?.id })
        .select()
        .single();
      if (error) throw error;
      return data as Ocorrencia;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ocorrencias"] }),
  });
};

export const useUpdateOcorrencia = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Ocorrencia> }) => {
      const { error } = await sb.from("ocorrencias").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ocorrencias"] }),
  });
};

export const useRemoveOcorrencia = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await sb.from("ocorrencias").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ocorrencias"] }),
  });
};

export const useAnexos = (ocorrenciaId: string | null) =>
  useQuery({
    queryKey: ["ocorrencia_anexos", ocorrenciaId],
    enabled: !!ocorrenciaId,
    queryFn: async () => {
      const { data, error } = await sb
        .from("ocorrencia_anexos")
        .select("*")
        .eq("ocorrencia_id", ocorrenciaId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as OcorrenciaAnexo[];
    },
  });

export const useUploadAnexo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ocorrenciaId, file }: { ocorrenciaId: string; file: File }) => {
      const { data: u } = await supabase.auth.getUser();
      const path = `${ocorrenciaId}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("anexos").upload(path, file);
      if (upErr) throw upErr;
      const { error } = await sb.from("ocorrencia_anexos").insert({
        ocorrencia_id: ocorrenciaId,
        nome_arquivo: file.name,
        storage_path: path,
        mime_type: file.type,
        tamanho: file.size,
        uploaded_by: u.user?.id,
      });
      if (error) throw error;
    },
    onSuccess: (_d, v) =>
      qc.invalidateQueries({ queryKey: ["ocorrencia_anexos", v.ocorrenciaId] }),
  });
};

export const useDeleteAnexo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (anexo: OcorrenciaAnexo) => {
      await supabase.storage.from("anexos").remove([anexo.storage_path]);
      const { error } = await sb.from("ocorrencia_anexos").delete().eq("id", anexo.id);
      if (error) throw error;
    },
    onSuccess: (_d, v) =>
      qc.invalidateQueries({ queryKey: ["ocorrencia_anexos", v.ocorrencia_id] }),
  });
};

export async function getAnexoSignedUrl(path: string) {
  const { data, error } = await supabase.storage.from("anexos").createSignedUrl(path, 60);
  if (error) throw error;
  return data.signedUrl;
}
