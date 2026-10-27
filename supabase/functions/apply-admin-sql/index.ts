// TEMPORARY one-shot function: applies the RESPONSABILIDADES 4 library seed from
// the private admin-scripts bucket, then is deleted. Not a generic SQL executor.
import { createClient } from "npm:@supabase/supabase-js@2";
import postgres from "npm:postgres@3.4.5";

const EXPECTED_TOKEN = "a8f5a935231ca140d339ed870753ec71089504f7083ed6e2";
const EXPECTED_SHA = "ad8d6c65e503cc33bd2d591e4b64345389ccfd0656c55401032db65506e99541";

Deno.serve(async (req) => {
  if (req.headers.get("x-admin-token") !== EXPECTED_TOKEN) {
    return new Response("unauthorized", { status: 401 });
  }
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data, error } = await supabase.storage.from("admin-scripts").download("RESPOSABILIDADES4.sql");
    if (error) return Response.json({ ok: false, step: "download", error: error.message }, { status: 500 });
    const script = await data.text();
    if (!script.includes(EXPECTED_SHA)) {
      return Response.json({ ok: false, step: "sanity", error: "unexpected script content" }, { status: 500 });
    }
    const dbUrl = Deno.env.get("SUPABASE_DB_URL");
    if (!dbUrl) return Response.json({ ok: false, step: "env", error: "SUPABASE_DB_URL unavailable" }, { status: 500 });
    const sql = postgres(dbUrl, { ssl: "require", max: 1, prepare: false });
    try {
      await sql.unsafe(script, [], { simple: true });
      const [row] = await sql`
        SELECT
          (SELECT count(*) FROM public.master_plan_capability_library) AS capabilities_published,
          (SELECT count(*) FROM public.master_plan_responsibility_library) AS competencies_published,
          (SELECT count(*) FROM public.master_plan_capability_library WHERE source_sha256 = ${EXPECTED_SHA}) AS capabilities_at_current_version,
          (SELECT count(*) FROM public.master_plan_responsibility_library WHERE source_sha256 = ${EXPECTED_SHA}) AS competencies_at_current_version
      `;
      return Response.json({ ok: true, verification: row });
    } finally {
      await sql.end();
    }
  } catch (e) {
    return Response.json({ ok: false, error: String((e as Error)?.message ?? e) }, { status: 500 });
  }
});
