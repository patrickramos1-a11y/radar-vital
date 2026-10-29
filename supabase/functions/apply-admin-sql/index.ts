import postgres from "npm:postgres@3.4.4";
const TOKEN = "f33ebd1a0f7ef25cf52fc3960a578d05fa308627ef5c701a";
Deno.serve(async (req) => {
  if (req.headers.get("x-admin-token") !== TOKEN) return new Response("forbidden", { status: 403 });
  const sqlText = await req.text();
  const sql = postgres(Deno.env.get("SUPABASE_DB_URL")!, { max: 1, prepare: false });
  try {
    await sql.begin(async (tx) => { await tx.unsafe(sqlText); });
    return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e?.message ?? e), detail: e?.detail ?? null }), { status: 500 });
  } finally { await sql.end(); }
});
