import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, LayoutDashboard, Building2, Map, Users, UserCog, Cpu, DoorOpen, FileText, AlertTriangle, BarChart3, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const passos = [
  {
    icon: LayoutDashboard,
    titulo: "Painel Executivo",
    descricao: "Visão geral do sistema com indicadores de desempenho.",
    steps: [
      "Acesse o Painel Executivo no menu lateral.",
      "Use os filtros de Período, Comarca, Unidade e Status para refinar os dados exibidos.",
      "Os cards superiores mostram totais de unidades, servidores, equipamentos e alertas.",
      "O mapa exibe o nível de estrutura de segurança por comarca (Adequado, Parcial, Crítico).",
      "O painel de Alertas lista pendências críticas, de atenção e informativas.",
    ],
  },
  {
    icon: Building2,
    titulo: "Unidades Prediais",
    descricao: "Cadastro e gestão das unidades físicas do TJRO.",
    steps: [
      "Acesse Unidades Prediais no menu.",
      "Clique em 'Nova Unidade' para cadastrar uma unidade.",
      "Preencha nome, comarca, endereço, tipo, responsável e criticidade.",
      "Informe se a unidade possui DERSO, controle de acesso e vigilância eletrônica.",
      "Latitude e longitude são opcionais — usadas para exibir a unidade no mapa.",
    ],
  },
  {
    icon: Map,
    titulo: "Mapa das Comarcas",
    descricao: "Visualização geográfica das comarcas de Rondônia.",
    steps: [
      "Acesse Mapa das Comarcas no menu.",
      "Cadastre ou edite uma comarca e preencha os campos de Latitude e Longitude para que ela apareça no mapa interativo.",
      "A cor do pin indica o nível de segurança: verde (Adequado), amarelo (Parcial), vermelho (Crítico).",
      "Clique em um pin para ver o resumo da comarca.",
    ],
  },
  {
    icon: Users,
    titulo: "Servidores",
    descricao: "Gestão dos servidores de segurança.",
    steps: [
      "Acesse Servidores no menu.",
      "Cadastre servidores com matrícula, cargo, comarca e escala.",
      "Filtre por situação (Ativo, Férias, Licença) para localizar registros rapidamente.",
    ],
  },
  {
    icon: UserCog,
    titulo: "Terceirizados",
    descricao: "Gestão do pessoal terceirizado.",
    steps: [
      "Acesse Terceirizados no menu.",
      "Vincule o terceirizado à empresa, função e unidade de trabalho.",
      "Acompanhe a situação do contrato individual de cada profissional.",
    ],
  },
  {
    icon: Cpu,
    titulo: "Equipamentos",
    descricao: "Inventário de câmeras, catracas, sensores e demais equipamentos.",
    steps: [
      "Acesse Equipamentos no menu.",
      "Cadastre cada equipamento com tipo, fabricante, modelo e número de série.",
      "Vincule o equipamento a uma unidade predial.",
      "Atualize o status (Operacional, Em manutenção, Inoperante) conforme necessário.",
      "Informe a data de garantia para receber alertas de vencimento.",
    ],
  },
  {
    icon: DoorOpen,
    titulo: "Portões e Acessos",
    descricao: "Controle de portões e sistemas de acesso.",
    steps: [
      "Acesse Portões e Acessos no menu.",
      "Cadastre cada portão com tipo de automação e necessidade de manutenção.",
      "Portões com necessidade Alta ou Urgente geram alertas no Painel Executivo.",
    ],
  },
  {
    icon: FileText,
    titulo: "Contratos",
    descricao: "Gestão de contratos de prestação de serviços.",
    steps: [
      "Acesse Contratos no menu.",
      "Cadastre contratos com empresa, objeto, vigência e valores.",
      "O sistema alerta automaticamente para contratos vencidos ou a vencer em 90 dias.",
      "Registre aditivos e apostilamentos diretamente no contrato.",
    ],
  },
  {
    icon: AlertTriangle,
    titulo: "Ocorrências e Manutenções",
    descricao: "Registro e acompanhamento de chamados e manutenções.",
    steps: [
      "Acesse Ocorrências e Manutenções no menu.",
      "Crie ocorrências com título, tipo, prioridade e unidade afetada.",
      "Defina um prazo e acompanhe a evolução do status (Aberto, Em andamento, Concluído).",
      "Ocorrências com prazo vencido geram alertas no Painel Executivo.",
    ],
  },
  {
    icon: BarChart3,
    titulo: "Relatórios",
    descricao: "Geração de relatórios gerenciais.",
    steps: [
      "Acesse Relatórios no menu.",
      "Selecione o tipo de relatório desejado.",
      "Aplique filtros de período e comarca conforme necessário.",
      "Exporte os dados para impressão ou compartilhamento.",
    ],
  },
  {
    icon: Settings,
    titulo: "Configurações",
    descricao: "Gerenciamento de usuários e permissões.",
    steps: [
      "Acesse Configurações no menu (disponível apenas para administradores).",
      "Gerencie os usuários do sistema e seus papéis (admin, operador).",
      "Restrinja o acesso de operadores a comarcas e unidades específicas.",
    ],
  },
];

export default function AjudaPage() {
  useEffect(() => { document.title = "Guia do Sistema | COSEPH TJRO"; }, []);
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground">Guia do Sistema</h1>
          <p className="text-sm text-muted-foreground">Passo a passo de como utilizar o COSEPH TJRO</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {passos.map(({ icon: Icon, titulo, descricao, steps }) => (
          <Card key={titulo} className="shadow-sm">
            <CardHeader className="border-b border-border pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
                  <Icon className="h-4 w-4 text-primary" />
                </span>
                {titulo}
              </CardTitle>
              <p className="text-xs text-muted-foreground">{descricao}</p>
            </CardHeader>
            <CardContent className="p-4">
              <ol className="space-y-2">
                {steps.map((step, i) => (
                  <li key={i} className="flex gap-2 text-xs text-foreground">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
