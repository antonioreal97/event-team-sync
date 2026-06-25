import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const allowedTeamTypes = new Set(["iniciante", "intermediario", "avancado", "sem_equipe"]);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(supabaseUrl, serviceKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: userRes, error: userErr } = await userClient.auth.getUser(token);
    if (userErr || !userRes?.user) {
      return json({ error: "Unauthorized" }, 401);
    }

    const callerId = userRes.user.id;
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .eq("role", "gestor")
      .maybeSingle();

    if (!roleRow) {
      return json({ error: "Forbidden: apenas gestores podem convidar freelancers" }, 403);
    }

    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const name = body.name ? String(body.name).trim() : null;
    const teamType = String(body.teamType || "iniciante");

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ error: "Email inválido" }, 400);
    }
    if (!allowedTeamTypes.has(teamType)) {
      return json({ error: "Nível de equipe inválido" }, 400);
    }

    await admin
      .from("freelancer_invites")
      .update({ status: "expired" })
      .eq("status", "pending")
      .lt("expires_at", new Date().toISOString());

    const { data: existingProfile } = await admin
      .from("profiles")
      .select("user_id")
      .ilike("email", email)
      .maybeSingle();

    if (existingProfile) {
      return json({ error: "Este email já está cadastrado no sistema" }, 409);
    }

    const { data: existingInvite } = await admin
      .from("freelancer_invites")
      .select("id")
      .ilike("email", email)
      .eq("status", "pending")
      .maybeSingle();

    if (existingInvite) {
      return json({ error: "Já existe um convite pendente para este email" }, 409);
    }

    const appUrl = Deno.env.get("APP_URL") || req.headers.get("origin") || "http://localhost:8080";
    const redirectTo = `${appUrl.replace(/\/$/, "")}/invite/accept`;

    const { data: inviteData, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email, {
      data: {
        name: name || email,
        role: "freelancer",
        teamType,
      },
      redirectTo,
    });

    if (inviteErr || !inviteData?.user) {
      return json({ error: inviteErr?.message || "Não foi possível enviar o convite" }, 400);
    }

    const invitedUserId = inviteData.user.id;

    await admin.from("profiles").upsert(
      {
        user_id: invitedUserId,
        name: name || email,
        email,
        team_type: teamType,
        experience_level: teamType === "sem_equipe" ? "iniciante" : teamType,
      },
      { onConflict: "user_id" },
    );

    await admin.from("user_roles").upsert(
      { user_id: invitedUserId, role: "freelancer" },
      { onConflict: "user_id,role" },
    );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { data: invite, error: auditErr } = await admin
      .from("freelancer_invites")
      .insert({
        email,
        name,
        team_type: teamType,
        invited_by: callerId,
        invited_user_id: invitedUserId,
        status: "pending",
        invite_url: redirectTo,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .maybeSingle();

    if (auditErr) {
      return json({ error: auditErr.message }, 400);
    }

    return json({
      message: "Convite enviado com sucesso",
      invite,
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Erro inesperado" }, 500);
  }
});
