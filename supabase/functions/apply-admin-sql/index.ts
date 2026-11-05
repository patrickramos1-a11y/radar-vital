// TEMPORARY admin SQL runner — delete after use.
import postgres from "https://deno.land/x/postgresjs@v3.4.5/mod.js";

Deno.serve(async (req) => {
  try {
    const expected = Deno.env.get("APPLY_ADMIN_SQL_TOKEN");
    const { token, sql } = await req.json();
    if (!expected || token !== expected) {
      return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
    }
    if (typeof sql !== "string" || sql.length === 0) {
      return new Response(JSON.stringify({ error: "missing sql" }), { status: 400 });
    }
    const dbUrl = Deno.env.get("SUPABASE_DB_URL");
    if (!dbUrl) {
      return new Response(JSON.stringify({ error: "no db url" }), { status: 500 });
    }
    const client = postgres(dbUrl, { max: 1, prepare: false });
    try {
      await client`BEGIN`;
      await client.unsafe(sql);
      await client`COMMIT`;
    } catch (e) {
      try { await client`ROLLBACK`; } catch { /* ignore */ }
      throw e;
    } finally {
      await client.end();
    }
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
