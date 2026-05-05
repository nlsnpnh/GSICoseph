import { useEffect, useState } from "react";
import { ShieldCheck, Trash2 } from "lucide-react";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useAuth, AppRole } from "@/contexts/AuthContext";
import { useUnidadesMock } from "@/data/unidadesMock";
import { toast } from "@/hooks/use-toast";

type Row = {
  user_id: string;
  nome_completo: string | null;
  matricula: string | null;
  cargo: string | null;
  lotacao: string | null;
  roles: AppRole[];
  unidade_id: string | null;
};

const ALL_ROLES: AppRole[] = ["admin", "gestor", "operador"];

export default function ConfiguracoesPage() {
  const { isAdmin, user } = useAuth();
  const qc = useQueryClient();
  const unidades = useUnidadesMock();
  useEffect(() => { document.title = "Configurações | SIG-COSEPH"; }, []);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["users-roles"],
    queryFn: async (): Promise<Row[]> => {
      const { data: profiles, error: pErr } = await supabase
        .from("profiles")
        .select("user_id, nome_completo, matricula, cargo, lotacao, unidade_id");
      if (pErr) throw pErr;
      const { data: rolesData, error: rErr } = await supabase.from("user_roles").select("user_id, role");
      if (rErr) throw rErr;
      const byUser = new Map<string, AppRole[]>();
      (rolesData ?? []).forEach((r) => {
        const arr = byUser.get(r.user_id) ?? [];
        arr.push(r.role as AppRole);
        byUser.set(r.user_id, arr);
      });
      return (profiles ?? []).map((p) => ({
        ...p,
        unidade_id: (p as any).unidade_id ?? null,
        roles: byUser.get(p.user_id) ?? [],
      }));
    },
    enabled: isAdmin,
  });

  const toggleRole = useMutation({
    mutationFn: async ({ userId, role, has }: { userId: string; role: AppRole; has: boolean }) => {
      if (has) {
        const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users-roles"] });
      toast({ title: "Permissões atualizadas" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const assignUnidade = useMutation({
    mutationFn: async ({ userId, unidadeId }: { userId: string; unidadeId: string | null }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ unidade_id: unidadeId || null } as any)
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users-roles"] });
      toast({ title: "Unidade atribuída" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const [toDelete, setToDelete] = useState<Row | null>(null);

  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke("admin-delete-user", {
        body: { user_id: userId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users-roles"] });
      toast({ title: "Usuário excluído" });
      setToDelete(null);
    },
    onError: (e: Error) => toast({ title: "Erro ao excluir", description: e.message, variant: "destructive" }),
  });

  if (!isAdmin) {
    return (
      <div>
        <PageHeader title="Configurações" description="Parâmetros do sistema, perfis e permissões." />
        <Card>
          <CardContent className="p-12 text-center text-sm text-muted-foreground">
            Apenas administradores podem acessar esta área.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Configurações" description="Parâmetros do sistema, perfis e permissões." />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Usuários e papéis</CardTitle>
          <CardDescription>
            Atribua os papéis <Badge variant="outline">admin</Badge>{" "}
            <Badge variant="outline">gestor</Badge>{" "}
            <Badge variant="outline">operador</Badge> aos usuários.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Carregando...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Matrícula / Cargo</TableHead>
                  {ALL_ROLES.map((r) => (
                    <TableHead key={r} className="text-center capitalize">{r}</TableHead>
                  ))}
                  <TableHead>Unidade vinculada</TableHead>
                  <TableHead className="text-center w-16">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => {
                  const isOperadorRow = row.roles.includes("operador") && !row.roles.includes("admin") && !row.roles.includes("gestor");
                  return (
                    <TableRow key={row.user_id}>
                      <TableCell className="font-medium">
                        <div>{row.nome_completo ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">{row.lotacao}</div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        <div className="font-mono">{row.matricula ?? "—"}</div>
                        <div>{row.cargo}</div>
                      </TableCell>
                      {ALL_ROLES.map((r) => {
                        const has = row.roles.includes(r);
                        const isSelf = row.user_id === user?.id && r === "admin";
                        return (
                          <TableCell key={r} className="text-center">
                            <Checkbox
                              checked={has}
                              disabled={isSelf || toggleRole.isPending}
                              onCheckedChange={() => toggleRole.mutate({ userId: row.user_id, role: r, has })}
                            />
                          </TableCell>
                        );
                      })}
                      <TableCell>
                        {isOperadorRow ? (
                          <Select
                            value={row.unidade_id ?? "none"}
                            onValueChange={(v) =>
                              assignUnidade.mutate({ userId: row.user_id, unidadeId: v === "none" ? null : v })
                            }
                            disabled={assignUnidade.isPending}
                          >
                            <SelectTrigger className="h-8 w-[200px] text-xs">
                              <SelectValue placeholder="Sem unidade" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Sem unidade</SelectItem>
                              {unidades.map((u) => (
                                <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          disabled={row.user_id === user?.id}
                          title={row.user_id === user?.id ? "Não é possível excluir a si mesmo" : "Excluir usuário"}
                          onClick={() => setToDelete(row)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={ALL_ROLES.length + 4} className="p-8 text-center text-sm text-muted-foreground">
                      Nenhum usuário cadastrado ainda.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" /> Política de acesso
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
          <p>• <strong>Admin</strong>: acesso total, incluindo exclusão de registros e gestão de papéis.</p>
          <p>• <strong>Gestor</strong>: pode criar e editar registros em todas as unidades; não pode excluir nem gerenciar papéis.</p>
          <p>• <strong>Operador</strong>: supervisor vinculado a uma única unidade predial; vê e gerencia apenas os dados da própria unidade. Não acessa Contratos, Relatórios, Consultas, Configurações nem o Mapa de Comarcas.</p>
        </CardContent>
      </Card>

      <ConfirmDelete
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        onConfirm={() => toDelete && deleteUser.mutate(toDelete.user_id)}
        title="Excluir usuário"
        description={`Tem certeza que deseja excluir ${toDelete?.nome_completo ?? "este usuário"}? Esta ação remove o acesso, o perfil e os papéis. Não pode ser desfeita.`}
      />
    </div>
  );
}
