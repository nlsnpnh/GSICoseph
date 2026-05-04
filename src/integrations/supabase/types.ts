export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      contratos: {
        Row: {
          aditivos: Json | null
          created_at: string
          data_fim: string | null
          data_inicio: string | null
          empresa: string
          fiscal: string | null
          gestor: string | null
          id: string
          numero: string
          objeto: string | null
          observacoes: string | null
          sla: string | null
          unidades_atendidas: string[] | null
          updated_at: string
          valor_mensal: number | null
          valor_total: number | null
        }
        Insert: {
          aditivos?: Json | null
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          empresa: string
          fiscal?: string | null
          gestor?: string | null
          id?: string
          numero: string
          objeto?: string | null
          observacoes?: string | null
          sla?: string | null
          unidades_atendidas?: string[] | null
          updated_at?: string
          valor_mensal?: number | null
          valor_total?: number | null
        }
        Update: {
          aditivos?: Json | null
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          empresa?: string
          fiscal?: string | null
          gestor?: string | null
          id?: string
          numero?: string
          objeto?: string | null
          observacoes?: string | null
          sla?: string | null
          unidades_atendidas?: string[] | null
          updated_at?: string
          valor_mensal?: number | null
          valor_total?: number | null
        }
        Relationships: []
      }
      equipamentos: {
        Row: {
          created_at: string
          data_instalacao: string | null
          fabricante: string | null
          id: string
          identificacao: string | null
          localizacao: string | null
          modelo: string | null
          numero_serie: string | null
          observacoes: string | null
          proxima_manutencao: string | null
          status: Database["public"]["Enums"]["status_equipamento"]
          tipo: string
          ultima_manutencao: string | null
          unidade_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_instalacao?: string | null
          fabricante?: string | null
          id?: string
          identificacao?: string | null
          localizacao?: string | null
          modelo?: string | null
          numero_serie?: string | null
          observacoes?: string | null
          proxima_manutencao?: string | null
          status?: Database["public"]["Enums"]["status_equipamento"]
          tipo: string
          ultima_manutencao?: string | null
          unidade_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_instalacao?: string | null
          fabricante?: string | null
          id?: string
          identificacao?: string | null
          localizacao?: string | null
          modelo?: string | null
          numero_serie?: string | null
          observacoes?: string | null
          proxima_manutencao?: string | null
          status?: Database["public"]["Enums"]["status_equipamento"]
          tipo?: string
          ultima_manutencao?: string | null
          unidade_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipamentos_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      ocorrencias: {
        Row: {
          created_at: string
          data_abertura: string
          data_conclusao: string | null
          descricao: string | null
          empresa_responsavel: string | null
          equipamento: string | null
          id: string
          observacoes: string | null
          prazo: string | null
          prioridade: Database["public"]["Enums"]["prioridade_oco"]
          protocolo: string
          responsavel_nome: string | null
          status: Database["public"]["Enums"]["status_oco"]
          tipo: Database["public"]["Enums"]["tipo_ocorrencia"]
          titulo: string
          unidade_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_abertura?: string
          data_conclusao?: string | null
          descricao?: string | null
          empresa_responsavel?: string | null
          equipamento?: string | null
          id?: string
          observacoes?: string | null
          prazo?: string | null
          prioridade?: Database["public"]["Enums"]["prioridade_oco"]
          protocolo?: string
          responsavel_nome?: string | null
          status?: Database["public"]["Enums"]["status_oco"]
          tipo: Database["public"]["Enums"]["tipo_ocorrencia"]
          titulo: string
          unidade_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_abertura?: string
          data_conclusao?: string | null
          descricao?: string | null
          empresa_responsavel?: string | null
          equipamento?: string | null
          id?: string
          observacoes?: string | null
          prazo?: string | null
          prioridade?: Database["public"]["Enums"]["prioridade_oco"]
          protocolo?: string
          responsavel_nome?: string | null
          status?: Database["public"]["Enums"]["status_oco"]
          tipo?: Database["public"]["Enums"]["tipo_ocorrencia"]
          titulo?: string
          unidade_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ocorrencias_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      portoes: {
        Row: {
          automatizacao: string | null
          camera_associada: string | null
          controle_acesso: string | null
          created_at: string
          descricao_manutencao: string | null
          id: string
          identificacao: string
          interfone: boolean
          localizacao: string | null
          necessidade_manutencao: Database["public"]["Enums"]["prioridade_manut"]
          observacoes: string | null
          situacao: Database["public"]["Enums"]["situacao_op"]
          tipo: string
          unidade_id: string | null
          updated_at: string
        }
        Insert: {
          automatizacao?: string | null
          camera_associada?: string | null
          controle_acesso?: string | null
          created_at?: string
          descricao_manutencao?: string | null
          id?: string
          identificacao: string
          interfone?: boolean
          localizacao?: string | null
          necessidade_manutencao?: Database["public"]["Enums"]["prioridade_manut"]
          observacoes?: string | null
          situacao?: Database["public"]["Enums"]["situacao_op"]
          tipo: string
          unidade_id?: string | null
          updated_at?: string
        }
        Update: {
          automatizacao?: string | null
          camera_associada?: string | null
          controle_acesso?: string | null
          created_at?: string
          descricao_manutencao?: string | null
          id?: string
          identificacao?: string
          interfone?: boolean
          localizacao?: string | null
          necessidade_manutencao?: Database["public"]["Enums"]["prioridade_manut"]
          observacoes?: string | null
          situacao?: Database["public"]["Enums"]["situacao_op"]
          tipo?: string
          unidade_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "portoes_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          cargo: string | null
          created_at: string
          email: string | null
          id: string
          lotacao: string | null
          matricula: string | null
          nome_completo: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cargo?: string | null
          created_at?: string
          email?: string | null
          id?: string
          lotacao?: string | null
          matricula?: string | null
          nome_completo?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cargo?: string | null
          created_at?: string
          email?: string | null
          id?: string
          lotacao?: string | null
          matricula?: string | null
          nome_completo?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      servidores: {
        Row: {
          cargo: string
          comarca: string | null
          created_at: string
          data_ingresso: string | null
          data_nascimento: string | null
          email: string | null
          escala: string | null
          funcao_atual: string | null
          id: string
          matricula: string
          nome: string
          observacoes: string | null
          regime: string | null
          situacao: Database["public"]["Enums"]["situacao_servidor"]
          telefone: string | null
          unidade: string | null
          updated_at: string
        }
        Insert: {
          cargo: string
          comarca?: string | null
          created_at?: string
          data_ingresso?: string | null
          data_nascimento?: string | null
          email?: string | null
          escala?: string | null
          funcao_atual?: string | null
          id?: string
          matricula: string
          nome: string
          observacoes?: string | null
          regime?: string | null
          situacao?: Database["public"]["Enums"]["situacao_servidor"]
          telefone?: string | null
          unidade?: string | null
          updated_at?: string
        }
        Update: {
          cargo?: string
          comarca?: string | null
          created_at?: string
          data_ingresso?: string | null
          data_nascimento?: string | null
          email?: string | null
          escala?: string | null
          funcao_atual?: string | null
          id?: string
          matricula?: string
          nome?: string
          observacoes?: string | null
          regime?: string | null
          situacao?: Database["public"]["Enums"]["situacao_servidor"]
          telefone?: string | null
          unidade?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      terceirizados: {
        Row: {
          certificacoes: string | null
          comarca: string | null
          contrato: string | null
          cpf: string | null
          created_at: string
          empresa: string | null
          escala: string | null
          funcao: string | null
          id: string
          nome: string
          observacoes: string | null
          posto_trabalho: string | null
          situacao: Database["public"]["Enums"]["situacao_terc"]
          turno: string | null
          unidade: string | null
          updated_at: string
          validade_certificacao: string | null
        }
        Insert: {
          certificacoes?: string | null
          comarca?: string | null
          contrato?: string | null
          cpf?: string | null
          created_at?: string
          empresa?: string | null
          escala?: string | null
          funcao?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          posto_trabalho?: string | null
          situacao?: Database["public"]["Enums"]["situacao_terc"]
          turno?: string | null
          unidade?: string | null
          updated_at?: string
          validade_certificacao?: string | null
        }
        Update: {
          certificacoes?: string | null
          comarca?: string | null
          contrato?: string | null
          cpf?: string | null
          created_at?: string
          empresa?: string | null
          escala?: string | null
          funcao?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          posto_trabalho?: string | null
          situacao?: Database["public"]["Enums"]["situacao_terc"]
          turno?: string | null
          unidade?: string | null
          updated_at?: string
          validade_certificacao?: string | null
        }
        Relationships: []
      }
      unidades: {
        Row: {
          comarca: string
          controle_acesso: boolean
          created_at: string
          criticidade: Database["public"]["Enums"]["criticidade"]
          endereco: string | null
          horario_funcionamento: string | null
          id: string
          imagem_url: string | null
          nome: string
          observacoes: string | null
          possui_derso: boolean
          responsavel_local: string | null
          servidor_substituto_id: string | null
          servidor_titular_id: string | null
          telefone: string | null
          tipo: Database["public"]["Enums"]["tipo_unidade"]
          updated_at: string
          vigilancia_eletronica: boolean
        }
        Insert: {
          comarca: string
          controle_acesso?: boolean
          created_at?: string
          criticidade?: Database["public"]["Enums"]["criticidade"]
          endereco?: string | null
          horario_funcionamento?: string | null
          id?: string
          imagem_url?: string | null
          nome: string
          observacoes?: string | null
          possui_derso?: boolean
          responsavel_local?: string | null
          servidor_substituto_id?: string | null
          servidor_titular_id?: string | null
          telefone?: string | null
          tipo: Database["public"]["Enums"]["tipo_unidade"]
          updated_at?: string
          vigilancia_eletronica?: boolean
        }
        Update: {
          comarca?: string
          controle_acesso?: boolean
          created_at?: string
          criticidade?: Database["public"]["Enums"]["criticidade"]
          endereco?: string | null
          horario_funcionamento?: string | null
          id?: string
          imagem_url?: string | null
          nome?: string
          observacoes?: string | null
          possui_derso?: boolean
          responsavel_local?: string | null
          servidor_substituto_id?: string | null
          servidor_titular_id?: string | null
          telefone?: string | null
          tipo?: Database["public"]["Enums"]["tipo_unidade"]
          updated_at?: string
          vigilancia_eletronica?: boolean
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "gestor" | "operador"
      criticidade: "Baixo" | "Médio" | "Alto" | "Crítico"
      prioridade_manut: "Nenhuma" | "Baixa" | "Média" | "Alta" | "Urgente"
      prioridade_oco: "Baixa" | "Média" | "Alta" | "Urgente"
      situacao_op:
        | "Operacional"
        | "Operacional com restrição"
        | "Inoperante"
        | "Em manutenção"
        | "Desativado"
      situacao_servidor:
        | "Ativo"
        | "Férias"
        | "Licença"
        | "Afastado"
        | "Aposentado"
        | "Cedido"
      situacao_terc: "Ativo" | "Afastado" | "Substituído" | "Desligado"
      status_equipamento:
        | "Operacional"
        | "Em manutenção"
        | "Inoperante"
        | "Desativado"
      status_oco:
        | "Aberto"
        | "Em andamento"
        | "Aguardando peça"
        | "Concluído"
        | "Cancelado"
      tipo_ocorrencia:
        | "Chamado"
        | "Falha"
        | "Pendência"
        | "Manutenção preventiva"
        | "Manutenção corretiva"
        | "Vistoria"
      tipo_unidade:
        | "Fórum"
        | "Sede Administrativa"
        | "Anexo"
        | "Depósito"
        | "CEJUSC"
        | "Juizado"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "gestor", "operador"],
      criticidade: ["Baixo", "Médio", "Alto", "Crítico"],
      prioridade_manut: ["Nenhuma", "Baixa", "Média", "Alta", "Urgente"],
      prioridade_oco: ["Baixa", "Média", "Alta", "Urgente"],
      situacao_op: [
        "Operacional",
        "Operacional com restrição",
        "Inoperante",
        "Em manutenção",
        "Desativado",
      ],
      situacao_servidor: [
        "Ativo",
        "Férias",
        "Licença",
        "Afastado",
        "Aposentado",
        "Cedido",
      ],
      situacao_terc: ["Ativo", "Afastado", "Substituído", "Desligado"],
      status_equipamento: [
        "Operacional",
        "Em manutenção",
        "Inoperante",
        "Desativado",
      ],
      status_oco: [
        "Aberto",
        "Em andamento",
        "Aguardando peça",
        "Concluído",
        "Cancelado",
      ],
      tipo_ocorrencia: [
        "Chamado",
        "Falha",
        "Pendência",
        "Manutenção preventiva",
        "Manutenção corretiva",
        "Vistoria",
      ],
      tipo_unidade: [
        "Fórum",
        "Sede Administrativa",
        "Anexo",
        "Depósito",
        "CEJUSC",
        "Juizado",
      ],
    },
  },
} as const
