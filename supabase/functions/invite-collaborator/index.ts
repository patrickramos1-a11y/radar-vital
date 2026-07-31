import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ message: "Method not allowed" }, 405);

  const authHeader = request.headers.get("Authorization");
  if (!authHeader) return json({ message: "Authentication required" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const publishableKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !serviceRoleKey || !publishableKey) {
    return json({ message: "Supabase environment is not configured" }, 500);
  }

  const callerClient = createClient(supabaseUrl, publishableKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userError } = await callerClient.auth.getUser();
  if (userError || !userData.user) return json({ message: "Invalid session" }, 401);

  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const { data: roles, error: rolesError } = await adminClient
    .from("user_roles")
    .select("role")
    .eq("user_id", userData.user.id)
    .eq("role", "admin");
  if (rolesError || !roles?.length) return json({ message: "Administrator access required" }, 403);

  const body = await request.json().catch(() => null) as {
    collaboratorId?: string;
    redirectTo?: string;
  } | null;
  if (!body?.collaboratorId) return json({ message: "Collaborator is required" }, 400);

  const { data: collaborator, error: collaboratorError } = await adminClient
    .from("collaborators")
    .select("id, name, email, is_active, user_id")
    .eq("id", body.collaboratorId)
    .maybeSingle();
  if (collaboratorError || !collaborator) return json({ message: "Collaborator not found" }, 404);
  if (!collaborator.is_active) return json({ message: "Inactive collaborators cannot receive access" }, 400);
  if (!collaborator.email) return json({ message: "Register the collaborator e-mail first" }, 400);

  if (collaborator.user_id) {
    return json({
      status: "existing",
      message: "Este colaborador já tem acesso vinculado. Ele pode entrar pela opção Link por e-mail.",
    });
  }

  const { data: users, error: usersError } = await adminClient.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (usersError) return json({ message: usersError.message }, 500);

  const existingUser = users.users.find(
    (item) => item.email?.toLowerCase() === collaborator.email?.toLowerCase(),
  );
  if (existingUser) {
    await adminClient.from("collaborators").update({ user_id: existingUser.id }).eq("id", collaborator.id);
    return json({
      status: "existing",
      message: "O e-mail já possuía uma conta e foi vinculado ao colaborador. O acesso está liberado.",
    });
  }

  const redirectTo = typeof body.redirectTo === "string" ? body.redirectTo : undefined;
  const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
    collaborator.email,
    {
      redirectTo,
      data: { display_name: collaborator.name, collaborator_id: collaborator.id },
    },
  );
  if (inviteError) return json({ message: inviteError.message }, 400);

  return json({
    status: "invited",
    message: "Convite enviado. O colaborador deve abrir o e-mail para criar a senha e acessar a plataforma.",
  });
});
