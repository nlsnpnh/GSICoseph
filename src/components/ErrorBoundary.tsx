import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FioAcento } from "@/components/admin/FioAcento";

type Props = { children: ReactNode };
type State = { erro: Error | null };

/**
 * Contém um erro de renderização à área de conteúdo.
 *
 * Sem isto, qualquer exceção durante o render derruba a árvore inteira do
 * React: a tela fica em branco, o menu some junto e não há nenhuma pista do
 * que aconteceu. Com o limite aqui, o menu continua de pé, a mensagem aparece
 * e dá para navegar para outra página.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { erro: null };

  static getDerivedStateFromError(erro: Error): State {
    return { erro };
  }

  componentDidCatch(erro: Error, info: ErrorInfo) {
    // O console é a única trilha que sobra em produção — mantenha o rastro.
    console.error("Falha ao renderizar a página:", erro, info.componentStack);
  }

  private limpar = () => this.setState({ erro: null });

  render() {
    const { erro } = this.state;
    if (!erro) return this.props.children;

    return (
      <Card className="mx-auto max-w-2xl overflow-hidden border-critical/30 shadow-sm">
        <FioAcento className="bg-gradient-to-r from-critical/25 via-critical to-critical/25" />
        <CardContent className="flex flex-col items-start gap-3 p-5">
          <div className="flex items-center gap-2 text-critical">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span className="text-[10px] font-medium uppercase tracking-[0.16em]">
              Erro nesta página
            </span>
          </div>

          <p className="text-[13px] text-foreground">
            A página não pôde ser exibida. O restante do sistema continua funcionando —
            use o menu para ir a outra tela.
          </p>

          <pre className="w-full overflow-x-auto rounded border border-border bg-muted/40 p-2 text-[11px] leading-snug text-muted-foreground scrollbar-hide">
            {erro.message || String(erro)}
          </pre>

          <Button variant="outline" size="sm" onClick={this.limpar}>
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }
}
