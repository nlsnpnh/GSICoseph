import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, LayoutDashboard, Building2, Map, Users, UserCog, Cpu, DoorOpen, FileText, Ticket, BarChart3, Settings, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FioAcento } from "@/components/admin/FioAcento";
import { CoberturaSegurancaCard } from "@/components/ajuda/CoberturaSegurancaCard";
import { useAuth } from "@/contexts/AuthContext";

const passos = [
  {
    icon: LayoutDashboard,
    titulo: "Painel Executivo",
    descricao: "Visão geral do sistema com indicadores de desempenho.",
    steps: [
      "Acesse o Painel Executivo no menu lateral.",
      "Use os filtros de Período, Comarca, Unidade e Status para refinar os dados exibidos.",
      "Os cards superiores mostram totais de unidades, servidores, equipamentos e alertas.",
      "O mapa exibe o nível de estrutura de segurança por comarca: Adequado, Parcial, Crítico e Sem dados. A regra de cada cor está na seção Mapa das Comarcas, mais adiante neste Guia.",
      "O painel de Alertas lista pendências críticas, de atenção e informativas. Chamados com prazo vencido e contratos a vencer aparecem por lá.",
      "O atalho 'Abrir Chamado', em Ações rápidas, leva direto ao formulário de novo chamado.",
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
      "Na seção 'Segurança', responda DERSO, controle de acesso e vigilância eletrônica. Cada um tem três respostas: Sim, Não e Não informado — e unidade nova começa em 'Não informado'.",
      "A diferença entre 'Não' e 'Não informado' importa: 'Não' é uma afirmação e conta como cobertura zero no mapa; 'Não informado' fica de fora da conta, e a comarca aparece em cinza em vez de vermelho. Responder 'Não' por engano é o que pinta uma comarca de vermelho sem motivo.",
      "Na listagem, os selos DERSO, Acesso e CFTV mostram o estado de cada um: preenchido em verde quando é Sim, apagado quando é Não, e tracejado com '?' quando ainda não foi informado.",
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
      "A cor da comarca indica o nível: verde (Adequado), amarelo (Parcial), vermelho (Crítico) e cinza (Sem dados).",
      "Como a cor é calculada: cada unidade responde três indicadores no próprio cadastro — DERSO, controle de acesso e vigilância eletrônica. A cobertura é quantos 'Sim' a comarca tem sobre o total de respostas dadas. Quem não respondeu fica fora da conta, nos dois lados.",
      "Os limites: 90% ou mais, com equipamentos vinculados e no máximo 1 chamado aberto, é Adequado; abaixo de 50%, ou sem equipamento vinculado, ou com 4 ou mais chamados abertos, é Crítico; o restante é Parcial.",
      "Cinza (Sem dados) significa que nenhuma unidade da comarca respondeu os indicadores — o sistema não afirma que está bem nem que está mal, apenas que não sabe. Preencher o cadastro é o que transforma o cinza numa leitura real. Administradores encontram no topo deste Guia quais unidades estão sem resposta.",
      "Clique em uma comarca para ver o resumo.",
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
      "Acesse Equipamentos no menu. A aba 'Catálogo do contrato' lista os itens contratados; a aba 'Distribuição por unidade' mostra onde cada item está.",
      "Clique em 'Vincular equipamento' para registrar quantos itens do catálogo uma unidade recebeu.",
      "Ao editar um vínculo existente, unidade e item ficam travados — a seção aparece como 'Vínculo (não editável)'. Só a quantidade e as observações mudam; trocar a unidade ou o item seria outro registro, não uma correção deste.",
      "Unidade sem nenhum item vinculado entra como Crítico no mapa das comarcas, mesmo que os indicadores de segurança estejam bem respondidos.",
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
      "Em 'Unidades atendidas', marque quais unidades o contrato cobre. É essa lista que decide quais contratos aparecem ao abrir um chamado para cada unidade.",
      "Em 'Gestão e SLA', o campo 'Prazo de atendimento (dias)' é o que calcula o vencimento dos chamados: abertura mais esse número de dias. O campo 'SLA' logo acima é a cláusula em texto e não calcula nada — contrato sem o prazo em dias gera chamado sem vencimento, e nada aparece como vencido.",
      "O sistema alerta automaticamente para contratos vencidos ou a vencer em 90 dias.",
      "Registre aditivos e apostilamentos diretamente no contrato.",
    ],
  },
  {
    icon: Ticket,
    titulo: "Chamados",
    descricao: "Ciclo completo dos chamados de prestação de serviços.",
    steps: [
      "Acesse Chamados no menu. A central tem as abas Pendentes, Fechados, Todos, Personalizado, Painel e Relatórios.",
      "Clique em '+ Novo chamado'. Escolha primeiro a Unidade Predial: os contratos aplicáveis àquela unidade aparecem em seguida.",
      "Todo chamado nasce vinculado a uma unidade e a um contrato — sem os dois, o sistema não permite abrir.",
      "Informe solicitante, serviço, categoria, assunto e descrição. O número é gerado automaticamente, mas pode ser digitado quando o chamado veio de outro sistema.",
      "O prazo de vencimento vem do contrato: é a data de abertura mais o 'Prazo de atendimento (dias)' cadastrado em Contratos. Contrato sem esse prazo gera chamado sem vencimento.",
      "Dentro do chamado, use 'Nova mensagem / atualização' para registrar o andamento e mudar o status. Tudo entra na Linha do tempo, que não pode ser apagada.",
      "Para encerrar, informe a solução adotada. Chamado fechado ou cancelado pode ser reaberto mediante justificativa.",
      "Chamados com prazo vencido geram alertas no Painel Executivo.",
    ],
  },
  {
    icon: BarChart3,
    titulo: "Relatórios",
    descricao: "Geração de relatórios gerenciais.",
    steps: [
      "Acesse Relatórios no menu para a visão consolidada de todos os módulos; os relatórios só de chamados ficam na aba Relatórios dentro de Chamados.",
      "Os cards do topo trazem os totais. Abaixo vêm os gráficos, e mais embaixo as pendências que exigem providência.",
      "Nos gráficos de barras, quando há muitas categorias aparecem as 10 maiores e uma barra final 'Outras N' — ela soma o restante, então o total continua correto.",
      "Um gráfico vazio nem sempre é defeito: quando o vazio tem motivo, o próprio gráfico explica. 'Nenhuma divergência', por exemplo, significa que as quantidades distribuídas batem com as do contrato.",
      "Use os botões do topo para exportar cada conjunto de dados em CSV.",
    ],
  },
  {
    icon: History,
    titulo: "Trilha de Auditoria",
    descricao: "Quem alterou o quê, quando, e como estava antes.",
    // A trilha é lida só por admin (RLS): ensinar o caminho a quem não pode
    // abri-la seria só frustração.
    somenteAdmin: true,
    steps: [
      "Acesse Auditoria no menu. Cada linha é uma inclusão, alteração ou exclusão, com data, hora, usuário e o registro afetado.",
      "Clique numa linha para ver o detalhe campo a campo: o valor anterior aparece riscado ao lado do novo.",
      "Filtre por período, tabela, usuário ou operação, ou busque pelo nome do registro. O botão 'Exportar planilha' leva o resultado filtrado para o Excel.",
      "Nas listagens de cadastro (Unidades, Servidores, Contratos…), o ícone de relógio ao lado de Editar abre o histórico só daquele registro. Na tela do chamado, é o botão 'Auditoria'.",
      "A trilha não pode ser alterada nem apagada — nem por administrador. A exclusão de um registro também fica guardada, com o conteúdo que ele tinha.",
      "O histórico começa na ativação da trilha. O 'Retrato inicial' mostra como cada registro estava nesse dia; o que aconteceu antes não foi registrado.",
    ],
  },
  {
    icon: Settings,
    titulo: "Configurações",
    descricao: "Gerenciamento de usuários e permissões.",
    steps: [
      "Acesse Configurações no menu (disponível apenas para administradores).",
      "Gerencie os usuários do sistema e seus papéis: admin (acesso total), gestor (escrita nos cadastros operacionais, sem planejamento nem orçamento) e operador (apenas a própria unidade predial).",
      "O operador só enxerga e edita registros da unidade à qual está vinculado — a restrição é aplicada pelo banco, não apenas pela tela.",
    ],
  },
];

export default function AjudaPage() {
  useEffect(() => { document.title = "Guia do Sistema | COSEPH TJRO"; }, []);
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

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

      {/* Diagnóstico do cadastro: fica no manual, e só para admin — é
          informação de manutenção do sistema, não de operação diária. */}
      {isAdmin && <CoberturaSegurancaCard />}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {passos.filter((p) => !p.somenteAdmin || isAdmin).map(({ icon: Icon, titulo, descricao, steps }) => (
          <Card key={titulo} className="overflow-hidden border-border/80 shadow-sm">
            <FioAcento />
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
