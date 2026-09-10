// Camada de acesso a dados generica (comarcas e anexos de chamado).
// As demais entidades tem modulo proprio em src/data/.
//
// Tipos gerados do Supabase (types.ts) nao cobrem joins dinamicos, entao o uso
// de `any` no cliente abaixo e intencional.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ===== Tipos =====
export type Comarca = {
  id: string;
  nome: string;
};

// Cliente sem tipos para tabelas dinâmicas / não geradas em types.ts
const sb = supabase as unknown as {
  from: (table: string) => any;
  storage: typeof supabase.storage;
  auth: typeof supabase.auth;
};

// ===== Hooks genéricos de CRUD =====
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

// ===== Comarcas =====
export const useComarcas = () => useList<Comarca>("comarcas");
export const useCreateComarca = () => useCreate<Partial<Comarca>>("comarcas");
export const useUpdateComarca = () => useUpdate<Partial<Comarca>>("comarcas");
export const useRemoveComarca = () => useRemove("comarcas");

// ===== Anexos de chamado =====
export type ChamadoAnexo = {
  id: string;
  chamado_id: string;
  nome_arquivo: string;
  storage_path: string;
  mime_type: string | null;
  tamanho: number | null;
  created_at: string;
};

export const useAnexos = (chamadoId: string | null) =>
  useQuery({
    queryKey: ["chamado_anexos", chamadoId],
    enabled: !!chamadoId,
    queryFn: async () => {
      const { data, error } = await sb
        .from("chamado_anexos")
        .select("*")
        .eq("chamado_id", chamadoId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ChamadoAnexo[];
    },
  });

export const useUploadAnexo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ chamadoId, file }: { chamadoId: string; file: File }) => {
      const { data: u } = await supabase.auth.getUser();
      const path = `${chamadoId}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("anexos").upload(path, file);
      if (upErr) throw upErr;
      const { error } = await sb.from("chamado_anexos").insert({
        chamado_id: chamadoId,
        nome_arquivo: file.name,
        storage_path: path,
        mime_type: file.type,
        tamanho: file.size,
        uploaded_by: u.user?.id,
      });
      if (error) throw error;
    },
    onSuccess: (_d, v) =>
      qc.invalidateQueries({ queryKey: ["chamado_anexos", v.chamadoId] }),
  });
};

export const useDeleteAnexo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (anexo: ChamadoAnexo) => {
      await supabase.storage.from("anexos").remove([anexo.storage_path]);
      const { error } = await sb.from("chamado_anexos").delete().eq("id", anexo.id);
      if (error) throw error;
    },
    onSuccess: (_d, v) =>
      qc.invalidateQueries({ queryKey: ["chamado_anexos", v.chamado_id] }),
  });
};

export async function getAnexoSignedUrl(path: string) {
  const { data, error } = await supabase.storage.from("anexos").createSignedUrl(path, 60);
  if (error) throw error;
  return data.signedUrl;
}
