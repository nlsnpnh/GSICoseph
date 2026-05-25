import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "gestor" | "operador";

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  roles: AppRole[];
  loading: boolean;
  isAdmin: boolean;
  isGestor: boolean;
  isOperador: boolean;
  canEdit: boolean;
  canDelete: boolean;
  unidadeId: string | null;
  unidadeNome: string | null;
  comarcaNome: string | null;
  nomeCompleto: string | null;
  signOut: () => Promise<void>;
  refreshRoles: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const sb = supabase as unknown as { from: (t: string) => any };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  // True enquanto papéis/perfil do usuário recém-autenticado ainda estão carregando.
  const [resolving, setResolving] = useState(false);
  const resolvedFor = useRef<string | null>(null);
  const [unidadeId, setUnidadeId] = useState<string | null>(null);
  const [unidadeNome, setUnidadeNome] = useState<string | null>(null);
  const [comarcaNome, setComarcaNome] = useState<string | null>(null);
  const [nomeCompleto, setNomeCompleto] = useState<string | null>(null);

  const fetchRoles = async (uid: string) => {
    const { data } = await sb.from("user_roles").select("role").eq("user_id", uid);
    setRoles((data?.map((r: any) => r.role as AppRole)) ?? []);
  };

  const fetchProfile = async (uid: string) => {
    const { data: p } = await sb.from("profiles").select("unidade_id, nome_completo").eq("user_id", uid).single();
    setNomeCompleto(p?.nome_completo ?? null);
    if (p?.unidade_id) {
      setUnidadeId(p.unidade_id);
      const { data: u } = await sb.from("unidades").select("nome, comarcas(nome)").eq("id", p.unidade_id).single();
      setUnidadeNome(u?.nome ?? null);
      setComarcaNome((u?.comarcas as any)?.nome ?? null);
    } else {
      setUnidadeId(null);
      setUnidadeNome(null);
      setComarcaNome(null);
    }
  };

  useEffect(() => {
    const loadUserData = async (uid: string) => {
      setResolving(true);
      try {
        await Promise.all([fetchRoles(uid), fetchProfile(uid)]);
        resolvedFor.current = uid;
      } finally {
        setResolving(false);
      }
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      const u = newSession?.user ?? null;
      setUser(u);
      if (u) {
        // Só recarrega ao trocar de usuário; evita "flash" da tela de aprovação
        // no login (user setado antes dos papéis) e flicker em refresh de token.
        if (resolvedFor.current !== u.id) {
          setResolving(true);
          setTimeout(() => { loadUserData(u.id); }, 0);
        }
      } else {
        resolvedFor.current = null;
        setRoles([]);
        setUnidadeId(null);
        setUnidadeNome(null);
        setComarcaNome(null);
        setNomeCompleto(null);
        setResolving(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      const u = s?.user ?? null;
      setUser(u);
      if (u) {
        loadUserData(u.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const isAdmin    = roles.includes("admin");
  const isGestor   = roles.includes("gestor");
  const isOperador = roles.includes("operador") && !isAdmin && !isGestor;

  const value: AuthContextValue = {
    session, user, roles,
    loading: loading || resolving,
    isAdmin, isGestor, isOperador,
    canEdit: true,
    canDelete: isAdmin,
    unidadeId,
    unidadeNome,
    comarcaNome,
    nomeCompleto,
    signOut: async () => { await supabase.auth.signOut(); },
    refreshRoles: async () => { if (user) await fetchRoles(user.id); },
    refreshProfile: async () => { if (user) await fetchProfile(user.id); },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
