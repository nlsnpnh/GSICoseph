// Bootstrap admin: promove o usuário autenticado a admin SOMENTE se ainda não existir nenhum admin
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;

    // Cliente com token do usuário para identificá-lo
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Usuário inválido" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    // Já existe algum admin?
    const { data: existing, error: exErr } = await admin
      .from("user_roles")
      .select("id, user_id")
      .eq("role", "admin")
      .limit(1);
    if (exErr) throw exErr;

    if (existing && existing.length > 0) {
      const isSelf = existing[0].user_id === userData.user.id;
      return new Response(
        JSON.stringify({
          error: isSelf
            ? "Você já é admin."
            : "Já existe um admin no sistema. Peça a ele para promover você.",
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Promove o usuário atual a admin
    const { error: insErr } = await admin
      .from("user_roles")
      .insert({ user_id: userData.user.id, role: "admin" });
    if (insErr) throw insErr;

    return new Response(JSON.stringify({ ok: true, message: "Você agora é admin." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
