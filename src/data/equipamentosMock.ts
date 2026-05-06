import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { queryClient } from "@/lib/queryClient";

export const TIPOS_EQUIPAMENTO = [
  "Câmera Tipo 1 – Câmera Fixa Modelo Dome",
  "Câmera Tipo 2 – Câmera Fixa Modelo Bullet",
  "Câmera Tipo 3 – Câmera Fisheye",
  "Câmera Tipo 4 – Câmera PTZ",
  "Vídeo Porteiro IP",
  "Headsets",
  "Mesa Controladora de CFTV",
  "Estação de Monitoramento",
  "Monitor de 46\"",
  "Monitor Profissional LED 23\"",
  "Switch PoE+ 24 Portas",
  "Switch PoE+ 48 Portas",
  "Telefonia IP",
  "Telefone IP",
  "Estação de Monitoramento - Local",
  "Poste de Fixação de Câmera - Tipo 1",
  "Acessório de Sustentação de Câmera PTZ",
  "Poste de Fixação para Câmera – Tipo 2",
  "Kit Corneta e Sirene",
  "Botão de Emergência com Fio",
  "Kit Controle de Acesso para 1 (uma) Porta",
  "Catraca Bidirecional",
  "Estação de Cadastramento",
  "Kit Automatizador de Portão",
  "Controle Remoto para Automatizador de Portão",
  "Rádio Indoor para Elevador",
  "Kit Abertura de Portão por RFID",
  "Software VMS",
  "Servidor - Software VMS",
  "Servidor – Redundância Software VMS",
  "Gravador de Vídeo IP - Tipo 1 - 128 Canais",
  "Gravador de Vídeo IP - Tipo 2 - 64 Canais",
  "Gravador de Vídeo IP - Tipo 3 - 32 Canais",
  "Gravador de Vídeo IP - Tipo 4 - 16 Canais",
  "Servidor de Vídeo Analítico",
  "Sistema de Vídeo Analítico",
  "Licença Análise Forense",
  "Licença Módulo de Proteção Individual",
  "Servidor – Armazenamento de Imagens",
  "Disco Rígido - Armazenamento de Imagens",
  "Servidor de Controle de Acesso",
  "Software Controle de Acesso",
  "Licença de Sistema de Controle de Acesso",
  "Pontos de Rede com Infraestrutura - Tipo 1",
  "Pontos de Rede com Infraestrutura - Tipo 2",
] as const;
export type TipoEquipamento = (typeof TIPOS_EQUIPAMENTO)[number];

export const STATUS_EQUIPAMENTO = ["Operacional", "Em manutenção", "Inoperante", "Desativado"] as const;
export type StatusEquipamento = (typeof STATUS_EQUIPAMENTO)[number];

export type Equipamento = {
  id: string;
  unidade_id: string;
  tipo: TipoEquipamento;
  identificacao: string;
  fabricante: string;
  modelo: string;
  numero_serie: string;
  numero_patrimonio: string;
  localizacao: string;
  data_instalacao: string;
  ultima_manutencao: string;
  proxima_manutencao: string;
  garantia_ate: string;
  contrato_vinculado: string;
  status: StatusEquipamento;
  observacoes: string;
};

const KEY = ["equipamentos"];

const mapRow = (r: any): Equipamento => ({
  id: r.id,
  unidade_id: r.unidade_id ?? "",
  tipo: r.tipo,
  identificacao: r.identificacao ?? "",
  fabricante: r.fabricante ?? "",
  modelo: r.modelo ?? "",
  numero_serie: r.numero_serie ?? "",
  numero_patrimonio: r.numero_patrimonio ?? "",
  localizacao: r.localizacao ?? "",
  data_instalacao: r.data_instalacao ?? "",
  ultima_manutencao: r.ultima_manutencao ?? "",
  proxima_manutencao: r.proxima_manutencao ?? "",
  garantia_ate: r.garantia_ate ?? "",
  contrato_vinculado: r.contrato_vinculado ?? "",
  status: r.status,
  observacoes: r.observacoes ?? "",
});

export function useEquipamentosMock(): Equipamento[] {
  const { data } = useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await supabase.from("equipamentos").select("*").order("identificacao");
      if (error) throw error;
      return (data ?? []).map(mapRow);
    },
  });
  return data ?? [];
}

const invalidate = () => queryClient.invalidateQueries({ queryKey: KEY });

const toPayload = (d: Omit<Equipamento, "id">) => ({
  ...d,
  unidade_id: d.unidade_id || null,
  data_instalacao: d.data_instalacao || null,
  ultima_manutencao: d.ultima_manutencao || null,
  proxima_manutencao: d.proxima_manutencao || null,
  garantia_ate: d.garantia_ate || null,
  numero_patrimonio: d.numero_patrimonio || null,
  contrato_vinculado: d.contrato_vinculado || null,
});

export async function addEquipamento(d: Omit<Equipamento, "id">) {
  const { error } = await supabase.from("equipamentos").insert(toPayload(d) as any);
  if (error) throw error;
  invalidate();
}
export async function updateEquipamento(id: string, d: Omit<Equipamento, "id">) {
  const { error } = await supabase.from("equipamentos").update(toPayload(d) as any).eq("id", id);
  if (error) throw error;
  invalidate();
}
export async function removeEquipamento(id: string) {
  const { error } = await supabase.from("equipamentos").delete().eq("id", id);
  if (error) throw error;
  invalidate();
}
