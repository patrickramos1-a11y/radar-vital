import postgres from "https://deno.land/x/postgresjs@v3.4.4/mod.js";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
Deno.serve(async (req) => {
  if (req.headers.get("x-admin-token") !== "fb318cffa37f71e375d1188b284f2569d40d23027654d5f0") return new Response("no", { status: 403 });
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data, error } = await sb.storage.from("admin-scripts").download("R7.sql");
  if (error) return new Response(error.message, { status: 500 });
  const text = await data.text();
  const sql = postgres(Deno.env.get("SUPABASE_DB_URL")!, { max: 1, prepare: false });
  try {
    await sql.begin(async (tx) => { await tx.unsafe(text, [], { simple: true } as never); });
    const r = await sql`select (select count(*) from master_plan_capability_library) caps,(select count(*) from master_plan_responsibility_library) resp,(select count(*) from master_plan_capability_library where source_sha256='ed1f3c2ef1cb93717fdb0e45a920fe718b81dd2894bf72f722b8eb04797f395f') caps_v,(select count(*) from master_plan_responsibility_library where source_sha256='ed1f3c2ef1cb93717fdb0e45a920fe718b81dd2894bf72f722b8eb04797f395f') resp_v,(select count(*) from master_plan_library_metadata where source_sha256='ed1f3c2ef1cb93717fdb0e45a920fe718b81dd2894bf72f722b8eb04797f395f') meta_v`;
    return new Response(JSON.stringify(r));
  } catch (e) { return new Response(String(e), { status: 500 }); } finally { await sql.end(); }
});
