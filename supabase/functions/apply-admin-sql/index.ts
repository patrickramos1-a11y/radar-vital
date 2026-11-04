import postgres from "npm:postgres@3.4.4";
const TOKEN = "02f537e98f71d4ba1c5b7202c17ea2c3497dcd8fcf851d5992e5630149af46c4";
Deno.serve(async (req) => {
  if (req.headers.get("x-admin-token") !== TOKEN) return new Response("forbidden", { status: 403 });
  const sqlText = await req.text();
  const sql = postgres(Deno.env.get("SUPABASE_DB_URL")!, { max: 1, prepare: false });
  try {
    await sql.unsafe(sqlText).simple();
    return new Response(JSON.stringify({ ok: true }));
  } catch (e) {
    try { await sql.unsafe("ROLLBACK").simple(); } catch (_) {}
    return new Response(JSON.stringify({ ok: false, error: String(e?.message ?? e) }), { status: 500 });
  } finally { await sql.end(); }
});
