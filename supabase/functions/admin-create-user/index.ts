import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify caller is a gestor
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: userRes, error: userErr } = await userClient.auth.getUser(token);
    if (userErr || !userRes?.user) {
      console.error("Auth error:", userErr);
      return new Response(JSON.stringify({ error: "Unauthorized: " + (userErr?.message || "invalid token") }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const callerId = userRes.user.id;

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .eq("role", "gestor")
      .maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: "Forbidden — apenas gestores podem criar usuários" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const {
      name, email, password, teamType, phone, address, city, state, cpf,
      experienceLevel, audioVisualRoles, bio, portfolio, linkedin, instagram,
      website, previousExperience, certifications, equipment, languages,
      role = "freelancer",
    } = body;

    if (!email || !password || !name) {
      return new Response(JSON.stringify({ error: "name, email e password são obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create auth user (auto-confirmed for admin-created accounts)
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role },
    });
    if (createErr || !created.user) {
      return new Response(JSON.stringify({ error: createErr?.message || "Erro ao criar usuário" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const newUserId = created.user.id;

    // The handle_new_user trigger creates a profile + freelancer role.
    // Update the profile and role with full data.
    await admin.from("profiles").update({
      name, email, phone, address, city, state, cpf,
      team_type: teamType || "sem_equipe",
      experience_level: experienceLevel || "iniciante",
      audio_visual_roles: audioVisualRoles || [],
      bio, portfolio, linkedin, instagram, website,
      previous_experience: previousExperience,
      certifications: certifications || [],
      equipment: equipment || [],
      languages: languages || [],
    }).eq("user_id", newUserId);

    if (role !== "freelancer") {
      await admin.from("user_roles").delete().eq("user_id", newUserId);
      await admin.from("user_roles").insert({ user_id: newUserId, role });
    }

    const { data: profile } = await admin
      .from("profiles")
      .select("*")
      .eq("user_id", newUserId)
      .maybeSingle();

    return new Response(
      JSON.stringify({ user: { ...profile, id: newUserId, role } }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
