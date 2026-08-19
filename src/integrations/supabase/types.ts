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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      boletim_itens_catalogo: {
        Row: {
          categoria: string | null
          descricao: string
          item_number: number
        }
        Insert: {
          categoria?: string | null
          descricao: string
          item_number: number
        }
        Update: {
          categoria?: string | null
          descricao?: string
          item_number?: number
        }
        Relationships: []
      }
      boletim_mensal: {
        Row: {
          ano: number
          created_at: string
          created_by: string | null
          id: string
          item_number: number
          mes: number
          observacoes: string | null
          quantidade: number
          unidade_id: string
          updated_at: string
        }
        Insert: {
          ano: number
          created_at?: string
          created_by?: string | null
          id?: string
          item_number: number
          mes: number
          observacoes?: string | null
          quantidade?: number
          unidade_id: string
          updated_at?: string
        }
        Update: {
          ano?: number
          created_at?: string
          created_by?: string | null
          id?: string
          item_number?: number
          mes?: number
          observacoes?: string | null
          quantidade?: number
          unidade_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "boletim_mensal_item_number_fkey"
            columns: ["item_number"]
            isOneToOne: false
            referencedRelation: "boletim_itens_catalogo"
            referencedColumns: ["item_number"]
          },
          {
            foreignKeyName: "boletim_mensal_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      comarcas: {
        Row: {
          created_at: string
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      contratos: {
        Row: {
          aditivos: Json | null
          apostilamentos: Json
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
          apostilamentos?: Json
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
          apostilamentos?: Json
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
      equipamentos_catalogo: {
        Row: {
          contrato_numero: string
          created_at: string
          descricao: string
          id: string
          item_num: number
          qtd_contrato: number
          unidade_medida: string
          updated_at: string
          valor_total: number
          valor_unitario: number
        }
        Insert: {
          contrato_numero?: string
          created_at?: string
          descricao: string
          id?: string
          item_num: number
          qtd_contrato?: number
          unidade_medida?: string
          updated_at?: string
          valor_total?: number
          valor_unitario?: number
        }
        Update: {
          contrato_numero?: string
          created_at?: string
          descricao?: string
          id?: string
          item_num?: number
          qtd_contrato?: number
          unidade_medida?: string
          updated_at?: string
          valor_total?: number
          valor_unitario?: number
        }
        Relationships: []
      }
      ocorrencia_anexos: {
        Row: {
          created_at: string
          id: string
          mime_type: string | null
          nome_arquivo: string
          ocorrencia_id: string
          storage_path: string
          tamanho: number | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          mime_type?: string | null
          nome_arquivo: string
          ocorrencia_id: string
          storage_path: string
          tamanho?: number | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          mime_type?: string | null
          nome_arquivo?: string
          ocorrencia_id?: string
          storage_path?: string
          tamanho?: number | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ocorrencia_anexos_ocorrencia_id_fkey"
            columns: ["ocorrencia_id"]
            isOneToOne: false
            referencedRelation: "ocorrencias"
            referencedColumns: ["id"]
          },
        ]
      }
      ocorrencias: {
        Row: {
          categoria: string | null
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
          servico: string | null
          servidor_solicitante: string | null
          status: Database["public"]["Enums"]["status_oco"]
          tipo: Database["public"]["Enums"]["tipo_ocorrencia"] | null
          titulo: string | null
          unidade_id: string | null
          updated_at: string
        }
        Insert: {
          categoria?: string | null
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
          servico?: string | null
          servidor_solicitante?: string | null
          status?: Database["public"]["Enums"]["status_oco"]
          tipo?: Database["public"]["Enums"]["tipo_ocorrencia"] | null
          titulo?: string | null
          unidade_id?: string | null
          updated_at?: string
        }
        Update: {
          categoria?: string | null
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
          servico?: string | null
          servidor_solicitante?: string | null
          status?: Database["public"]["Enums"]["status_oco"]
          tipo?: Database["public"]["Enums"]["tipo_ocorrencia"] | null
          titulo?: string | null
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
      orcamento_acoes: {
        Row: {
          acao: string
          ano: number
          anulacao_empenho: number
          created_at: string
          created_by: string | null
          dotacao: number
          ed: string | null
          empenho: number
          fonte: string | null
          id: string
          liquidado: number
          nota_empenho: string | null
          objeto: string | null
          observacao: string | null
          ordem: number
          protocolo: string | null
          reforco_empenho: number
          saldo_dotacao: number
          saldo_empenho: number
          sl: string | null
          updated_at: string
        }
        Insert: {
          acao: string
          ano?: number
          anulacao_empenho?: number
          created_at?: string
          created_by?: string | null
          dotacao?: number
          ed?: string | null
          empenho?: number
          fonte?: string | null
          id?: string
          liquidado?: number
          nota_empenho?: string | null
          objeto?: string | null
          observacao?: string | null
          ordem?: number
          protocolo?: string | null
          reforco_empenho?: number
          saldo_dotacao?: number
          saldo_empenho?: number
          sl?: string | null
          updated_at?: string
        }
        Update: {
          acao?: string
          ano?: number
          anulacao_empenho?: number
          created_at?: string
          created_by?: string | null
          dotacao?: number
          ed?: string | null
          empenho?: number
          fonte?: string | null
          id?: string
          liquidado?: number
          nota_empenho?: string | null
          objeto?: string | null
          observacao?: string | null
          ordem?: number
          protocolo?: string | null
          reforco_empenho?: number
          saldo_dotacao?: number
          saldo_empenho?: number
          sl?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      orcamento_superavit: {
        Row: {
          acao: string
          ano: number
          created_at: string
          created_by: string | null
          data_maxima: string | null
          elemento_despesa: string | null
          envolve_pca: string | null
          especificacao: string | null
          exercicio: string | null
          id: string
          justificativa: string | null
          ordem: number
          quantidade: number | null
          subelemento: string | null
          unidade_medida: string | null
          updated_at: string
          valor_total: number
          valor_unitario: number | null
        }
        Insert: {
          acao: string
          ano?: number
          created_at?: string
          created_by?: string | null
          data_maxima?: string | null
          elemento_despesa?: string | null
          envolve_pca?: string | null
          especificacao?: string | null
          exercicio?: string | null
          id?: string
          justificativa?: string | null
          ordem?: number
          quantidade?: number | null
          subelemento?: string | null
          unidade_medida?: string | null
          updated_at?: string
          valor_total?: number
          valor_unitario?: number | null
        }
        Update: {
          acao?: string
          ano?: number
          created_at?: string
          created_by?: string | null
          data_maxima?: string | null
          elemento_despesa?: string | null
          envolve_pca?: string | null
          especificacao?: string | null
          exercicio?: string | null
          id?: string
          justificativa?: string | null
          ordem?: number
          quantidade?: number | null
          subelemento?: string | null
          unidade_medida?: string | null
          updated_at?: string
          valor_total?: number
          valor_unitario?: number | null
        }
        Relationships: []
      }
      planejamento_acoes: {
        Row: {
          acao: string
          ano: number
          created_at: string
          created_by: string | null
          data_conclusao: string | null
          data_inicio: string | null
          eixo: string | null
          etapas: string | null
          evidencia_sei: string | null
          frequencia: string | null
          id: string
          indicador: string | null
          link_documento: string | null
          observacoes: string | null
          ordem: number
          percentual: number | null
          prazo_data: string | null
          prioridade: string | null
          problema: string | null
          publico_alvo: string | null
          responsavel: string | null
          setor: string
          status: string
          updated_at: string
        }
        Insert: {
          acao: string
          ano?: number
          created_at?: string
          created_by?: string | null
          data_conclusao?: string | null
          data_inicio?: string | null
          eixo?: string | null
          etapas?: string | null
          evidencia_sei?: string | null
          frequencia?: string | null
          id?: string
          indicador?: string | null
          link_documento?: string | null
          observacoes?: string | null
          ordem?: number
          percentual?: number | null
          prazo_data?: string | null
          prioridade?: string | null
          problema?: string | null
          publico_alvo?: string | null
          responsavel?: string | null
          setor: string
          status?: string
          updated_at?: string
        }
        Update: {
          acao?: string
          ano?: number
          created_at?: string
          created_by?: string | null
          data_conclusao?: string | null
          data_inicio?: string | null
          eixo?: string | null
          etapas?: string | null
          evidencia_sei?: string | null
          frequencia?: string | null
          id?: string
          indicador?: string | null
          link_documento?: string | null
          observacoes?: string | null
          ordem?: number
          percentual?: number | null
          prazo_data?: string | null
          prioridade?: string | null
          problema?: string | null
          publico_alvo?: string | null
          responsavel?: string | null
          setor?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
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
          super_admin: boolean
          unidade_id: string | null
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
          super_admin?: boolean
          unidade_id?: string | null
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
          super_admin?: boolean
          unidade_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      servidores: {
        Row: {
          abono_permanencia: boolean
          cargo: string
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
          unidade_id: string | null
          updated_at: string
        }
        Insert: {
          abono_permanencia?: boolean
          cargo: string
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
          unidade_id?: string | null
          updated_at?: string
        }
        Update: {
          abono_permanencia?: boolean
          cargo?: string
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
          unidade_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "servidores_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      terceirizados: {
        Row: {
          certificacoes: string | null
          contrato: string | null
          cpf: string | null
          created_at: string
          curso_libras: boolean
          empresa: string | null
          escala: string | null
          funcao: string | null
          id: string
          nome: string
          observacoes: string | null
          posto_trabalho: string | null
          situacao: Database["public"]["Enums"]["situacao_terc"]
          turno: string | null
          unidade_id: string | null
          updated_at: string
          validade_certificacao: string | null
        }
        Insert: {
          certificacoes?: string | null
          contrato?: string | null
          cpf?: string | null
          created_at?: string
          curso_libras?: boolean
          empresa?: string | null
          escala?: string | null
          funcao?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          posto_trabalho?: string | null
          situacao?: Database["public"]["Enums"]["situacao_terc"]
          turno?: string | null
          unidade_id?: string | null
          updated_at?: string
          validade_certificacao?: string | null
        }
        Update: {
          certificacoes?: string | null
          contrato?: string | null
          cpf?: string | null
          created_at?: string
          curso_libras?: boolean
          empresa?: string | null
          escala?: string | null
          funcao?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          posto_trabalho?: string | null
          situacao?: Database["public"]["Enums"]["situacao_terc"]
          turno?: string | null
          unidade_id?: string | null
          updated_at?: string
          validade_certificacao?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "terceirizados_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      unidade_equipamentos: {
        Row: {
          created_at: string
          equipamento_id: string
          id: string
          observacoes: string
          quantidade: number
          unidade_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          equipamento_id: string
          id?: string
          observacoes?: string
          quantidade: number
          unidade_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          equipamento_id?: string
          id?: string
          observacoes?: string
          quantidade?: number
          unidade_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "unidade_equipamentos_equipamento_id_fkey"
            columns: ["equipamento_id"]
            isOneToOne: false
            referencedRelation: "equipamentos_catalogo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unidade_equipamentos_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      unidades: {
        Row: {
          comarca_id: string | null
          controle_acesso: boolean
          created_at: string
          endereco: string | null
          id: string
          lat: number | null
          lng: number | null
          nome: string
          observacoes: string | null
          possui_derso: boolean
          responsavel_local: string | null
          responsavel_substituto: string
          telefone: string | null
          updated_at: string
          vigilancia_eletronica: boolean
        }
        Insert: {
          comarca_id?: string | null
          controle_acesso?: boolean
          created_at?: string
          endereco?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          nome: string
          observacoes?: string | null
          possui_derso?: boolean
          responsavel_local?: string | null
          responsavel_substituto?: string
          telefone?: string | null
          updated_at?: string
          vigilancia_eletronica?: boolean
        }
        Update: {
          comarca_id?: string | null
          controle_acesso?: boolean
          created_at?: string
          endereco?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          nome?: string
          observacoes?: string | null
          possui_derso?: boolean
          responsavel_local?: string | null
          responsavel_substituto?: string
          telefone?: string | null
          updated_at?: string
          vigilancia_eletronica?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "unidades_comarca_id_fkey"
            columns: ["comarca_id"]
            isOneToOne: false
            referencedRelation: "comarcas"
            referencedColumns: ["id"]
          },
        ]
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
      current_user_can_write: { Args: never; Returns: boolean }
      current_user_is_admin: { Args: never; Returns: boolean }
      get_user_comarca_nome: { Args: never; Returns: string }
      get_user_unidade_id: { Args: never; Returns: string }
      get_user_unidade_nome: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      mapa_comarcas_resumo: {
        Args: never
        Returns: {
          cobertura: number
          comarca_id: string
          itens_vinculados: number
          lat: number
          lng: number
          nivel: string
          nome: string
          ocorrencias_abertas: number
          possui_derso: boolean
          quantidade_total: number
          unidades: number
          valor_estimado: number
        }[]
      }
      mapa_unidades_pontos: {
        Args: never
        Returns: {
          comarca_id: string
          id: string
          lat: number
          lng: number
          nome: string
        }[]
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
  graphql_public: {
    Enums: {},
  },
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
