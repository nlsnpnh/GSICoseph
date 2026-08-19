import { useRef, useState } from "react";
import { getErrorMessage } from "@/lib/utils";
import { Download, FileText, Paperclip, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useAnexos, useUploadAnexo, useDeleteAnexo, getAnexoSignedUrl, type OcorrenciaAnexo,
} from "@/data/api";
import { toast } from "@/hooks/use-toast";

export function AnexosSection({ ocorrenciaId }: { ocorrenciaId: string }) {
  const { data: anexos = [], isLoading } = useAnexos(ocorrenciaId);
  const upload = useUploadAnexo();
  const remove = useDeleteAnexo();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files)) {
      try {
        await upload.mutateAsync({ ocorrenciaId, file });
        toast({ title: `Arquivo "${file.name}" anexado` });
      } catch (e) {
        toast({ title: "Erro ao anexar", description: getErrorMessage(e), variant: "destructive" });
      }
    }
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleDownload = async (anexo: OcorrenciaAnexo) => {
    try {
      const url = await getAnexoSignedUrl(anexo.storage_path);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      toast({ title: "Erro ao baixar", description: getErrorMessage(e), variant: "destructive" });
    }
  };

  const handleDelete = async (anexo: OcorrenciaAnexo) => {
    try {
      await remove.mutateAsync(anexo);
      toast({ title: `Arquivo "${anexo.nome_arquivo}" removido` });
    } catch (e) {
      toast({ title: "Erro ao remover", description: getErrorMessage(e), variant: "destructive" });
    }
  };

  const fmtSize = (b: number | null) => {
    if (!b) return "";
    if (b < 1024) return `${b} B`;
    if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-3 rounded-md border border-border bg-muted/20 p-4">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Paperclip className="h-3.5 w-3.5" />Anexos
        </p>
        <Button
          type="button" size="sm" variant="outline" className="h-7 gap-1 text-xs"
          disabled={upload.isPending} onClick={() => inputRef.current?.click()}
        >
          <Upload className="h-3.5 w-3.5" />
          {upload.isPending ? "Enviando..." : "Adicionar arquivo"}
        </Button>
        <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      </div>

      {isLoading && <p className="text-xs text-muted-foreground">Carregando anexos...</p>}
      {!isLoading && anexos.length === 0 && <p className="text-xs italic text-muted-foreground">Nenhum arquivo anexado.</p>}

      {anexos.length > 0 && (
        <ul className="space-y-1.5">
          {anexos.map((a) => (
            <li key={a.id} className="flex items-center gap-2 rounded border border-border bg-background px-3 py-2 text-xs">
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate font-medium">{a.nome_arquivo}</span>
              {a.tamanho && <span className="shrink-0 text-muted-foreground">{fmtSize(a.tamanho)}</span>}
              <span className="shrink-0 text-muted-foreground">{new Date(a.created_at).toLocaleDateString("pt-BR")}</span>
              <Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => handleDownload(a)}>
                <Download className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button" variant="ghost" size="icon"
                className="h-6 w-6 shrink-0 text-destructive hover:text-destructive"
                disabled={remove.isPending} onClick={() => handleDelete(a)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
