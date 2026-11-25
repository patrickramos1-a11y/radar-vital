import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';

const repo = process.argv[2];
const mig = (f) => readFileSync(`${repo}/supabase/migrations/${f}`, 'utf8');
const db = new PGlite();
let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? 'OK  ' : 'FALHOU'} ${msg}`); if (!cond) failures++; };
const one = async (sql, params) => (await db.query(sql, params)).rows[0];
const val = async (sql, params) => Object.values((await one(sql, params)) || {})[0];

await db.exec(readFileSync(new URL('./base.sql', import.meta.url), 'utf8'));
await db.exec(mig('20261101165458_reset_priority_aging_clock.sql'));
await db.exec(mig('20261021180000_priority_deliverables_from_completion_date.sql'));
await db.exec(`CREATE TRIGGER sync_completed_priority_deliverable_trigger AFTER INSERT OR UPDATE OF status, title, description, client_id, assigned_to, due_date, completed_at ON public.priorities FOR EACH ROW EXECUTE FUNCTION public.sync_completed_priority_deliverable();`);

// ---- dados antes da migration (casos vistos em producao)
const A = await val(`INSERT INTO clients (name) VALUES ('Cliente A') RETURNING id`);
const RAMOS = await val(`INSERT INTO clients (name, client_type) VALUES ('RAMOS ENGENHARIA', 'UNIVERSO_RAMOS') RETURNING id`);
const old = `now() - interval '200 days'`;
const T1 = await val(`INSERT INTO tasks (client_id, title, priority, created_at) VALUES ($1, 'T1 sem prioridade', 'alta', ${old}) RETURNING id`, [A]);
await db.exec(`UPDATE tasks SET updated_at = ${old}`);
const T1updated = await val(`SELECT updated_at FROM tasks WHERE id = $1`, [T1]);
const T2 = await val(`INSERT INTO tasks (client_id, title, description, due_date) VALUES ($1, 'T2', 'desc tarefa', '2026-12-01') RETURNING id`, [A]);
const P2 = await val(`INSERT INTO priorities (title, description, client_id, weight, due_date, source_task_id) VALUES ('T2 corrigido', 'desc prioridade', $1, 5, '2026-12-10', $2) RETURNING id`, [A, T2]);
await db.query(`UPDATE tasks SET priority_id = $1 WHERE id = $2`, [P2, T2]);
const T3 = await val(`INSERT INTO tasks (client_id, title, priority, parent_task_id) VALUES ($1, 'T3 etapa', 'urgente', $2) RETURNING id`, [A, T2]);
const P4 = await val(`INSERT INTO priorities (title, weight) VALUES ('P4 sem cliente', 3) RETURNING id`);
const P5 = await val(`INSERT INTO priorities (title, client_id, weight, status, assigned_to) VALUES ('P5 sem tarefa', $1, 4, 'em_andamento', '{Gabi}') RETURNING id`, [A]);
const T6 = await val(`INSERT INTO tasks (client_id, title, completed) VALUES ($1, 'T6 concluida', true) RETURNING id`, [A]);
const P6 = await val(`INSERT INTO priorities (title, client_id, weight, source_task_id) VALUES ('T6 concluida', $1, 4, $2) RETURNING id`, [A, T6]);
const T7 = await val(`INSERT INTO tasks (client_id, title, parent_task_id) VALUES ($1, 'T7 etapa', $2) RETURNING id`, [A, T2]);
await db.query(`INSERT INTO priorities (title, client_id, weight, source_task_id) VALUES ('T7 etapa', $1, 5, $2)`, [A, T7]);
const T8 = await val(`INSERT INTO tasks (client_id, title) VALUES ($1, 'T8 envelhecida') RETURNING id`, [A]);
const P8 = await val(`INSERT INTO priorities (title, client_id, weight, category, source_task_id) VALUES ('T8 envelhecida', $1, 2, 'auto_task_aging', $2) RETURNING id`, [A, T8]);
await db.query(`UPDATE tasks SET priority_id = $1 WHERE id = $2`, [P8, T8]);
await db.query(`UPDATE priorities SET weight_changed_at = now() - interval '40 days' WHERE id = $1`, [P8]);
const T9 = await val(`INSERT INTO tasks (client_id, title, completed) VALUES ($1, 'T9 concluida sem prioridade', true) RETURNING id`, [A]);
const T10 = await val(`INSERT INTO tasks (client_id, title) VALUES ($1, 'T10 para promover') RETURNING id`, [A]);
await db.exec(`UPDATE tasks SET priority_changed_at = now() - interval '100 days' WHERE id = '${T10}'`);

// ---- migration (duas vezes: precisa ser idempotente)
const sql = mig('20261125180000_processos_v2.sql');
await db.exec(sql);
const firstDeliverables = await val(`SELECT count(*)::int FROM deliverables`);
const r2 = await db.exec(sql);
const second = r2.find(r => r.rows?.[0]?.convert_open_priorities_to_processes)?.rows[0].convert_open_priorities_to_processes;
ok(second && second.created_roots === 0 && second.updated_roots === 0 && second.moved_to_internal_client === 0, `segunda execucao nao muda nada: ${JSON.stringify(second)}`);

// ---- conferencia da conversao
const w = async id => val(`SELECT weight FROM tasks WHERE id = $1`, [id]);
ok(await w(T1) === 3, 'T1 sem prioridade: peso 3 vindo da urgencia alta');
ok(String(await val(`SELECT updated_at FROM tasks WHERE id = $1`, [T1])) === String(T1updated), 'T1: updated_at preservado no preenchimento');
const t2 = await one(`SELECT * FROM tasks WHERE id = $1`, [T2]);
ok(t2.weight === 5 && t2.title === 'T2 corrigido' && t2.description === 'desc prioridade' && String(t2.due_date).includes('2026') , `T2 recebe peso, titulo, descricao e vencimento da prioridade (${t2.title}, ${t2.due_date})`);
ok(await w(T3) === 4, 'T3 etapa sem prioridade: peso 4 vindo de urgente');
const r4 = await one(`SELECT t.client_id, t.weight, t.priority, p.client_id AS pc FROM priorities p JOIN tasks t ON t.id = p.source_task_id WHERE p.id = $1`, [P4]);
ok(r4 && r4.client_id === RAMOS && r4.pc === RAMOS && r4.weight === 3 && r4.priority === 'alta', 'P4 sem cliente: vai para RAMOS ENGENHARIA com tarefa raiz peso 3');
const r5 = await one(`SELECT t.* FROM priorities p JOIN tasks t ON t.id = p.source_task_id WHERE p.id = $1`, [P5]);
ok(r5 && r5.weight === 4 && r5.status === 'em_andamento' && r5.assigned_to[0] === 'Gabi' && r5.priority_id === P5, 'P5: ganha tarefa raiz em andamento, peso 4, mesmo responsavel');
const t6 = await one(`SELECT * FROM tasks WHERE id = $1`, [T6]);
ok(t6.weight === 4 && t6.completed, 'T6: concluida continua concluida e recebe peso 4');
ok(await w(T7) === 5, 'T7: prioridade apontando para etapa passa so o peso');
ok(firstDeliverables === 0, 'migration nao cria entregavel para concluidos antigos (T6, T9)');
ok((await val(`SELECT count(*)::int FROM tasks`)) === 10, 'tarefas: 8 antigas + 2 raizes novas (P4, P5)');

// ---- envelhecimento
const aging = await val(`SELECT public.reconcile_stale_task_priorities('Teste')`);
ok(aging.promoted === 0 && aging.updated === 1, `envelhecimento: nao promove, sobe 1 processo (${JSON.stringify(aging)})`);
ok(await w(T8) === 4 && (await val(`SELECT weight FROM priorities WHERE id=$1`, [P8])) === 4, 'T8: peso 2 + 40 dias / 15 = peso 4, tarefa e prioridade iguais');
ok((await val(`SELECT count(*)::int FROM priorities WHERE source_task_id = $1`, [T10])) === 0, 'T10 parada 100 dias nao vira prioridade');

// ---- entregaveis
await db.query(`UPDATE tasks SET completed = true WHERE id = $1`, [T1]);
let d = await one(`SELECT * FROM deliverables WHERE source_task_id = $1`, [T1]);
ok(d && d.status === 'concluido' && d.client_id === A, 'concluir processo sem prioridade cria entregavel');
ok((await val(`SELECT count(*)::int FROM deliverable_items WHERE deliverable_id = $1 AND item_type = 'task'`, [d.id])) === 1, 'entregavel ganha item do tipo task');
await db.query(`UPDATE tasks SET completed = true WHERE id = $1`, [T1]);
await db.query(`UPDATE tasks SET status = 'concluida', title = 'T1x' WHERE id = $1`, [T1]);
ok((await val(`SELECT count(*)::int FROM deliverables WHERE source_task_id = $1`, [T1])) === 1, 'salvar de novo nao duplica');
await db.query(`UPDATE tasks SET completed = false WHERE id = $1`, [T1]);
ok((await val(`SELECT count(*)::int FROM deliverables WHERE source_task_id = $1`, [T1])) === 0, 'reabrir remove o entregavel');

await db.query(`UPDATE tasks SET completed = true WHERE id = $1`, [T3]);
ok((await val(`SELECT count(*)::int FROM deliverables WHERE source_task_id = $1`, [T3])) === 0, 'etapa concluida nao vira entregavel');

await val(`SELECT public.finish_priority_with_task_tree($1, true)`, [P2]);
const dl = (await db.query(`SELECT * FROM deliverables WHERE source_task_id = $1 OR source_priority_id = $2`, [T2, P2])).rows;
ok(dl.length === 1 && dl[0].source_task_id === T2 && dl[0].source_priority_id === P2, `concluir pela prioridade (codigo atual): um unico entregavel ligado aos dois (${dl.length})`);
ok((await val(`SELECT count(*)::int FROM deliverable_items WHERE deliverable_id = $1`, [dl[0].id])) === 2, 'esse entregavel tem item task e item priority');
const newDel = await val(`SELECT count(*)::int FROM deliverables WHERE source_task_id = ANY($1)`, [[T7]]);
ok(newDel === 0, 'etapas concluidas junto nao viram entregavel');

// ---- sincronia de peso e urgencia
const T11 = await val(`INSERT INTO tasks (client_id, title, priority) VALUES ($1, 'T11', 'urgente') RETURNING id`, [A]);
ok(await w(T11) === 4, 'codigo atual: nova tarefa urgente nasce com peso 4');
const T12 = await val(`INSERT INTO tasks (client_id, title, weight) VALUES ($1, 'T12', 5) RETURNING id`, [A]);
ok((await val(`SELECT priority FROM tasks WHERE id=$1`, [T12])) === 'urgente', 'codigo novo: peso 5 deixa urgencia como urgente');
await db.query(`UPDATE tasks SET priority = 'baixa' WHERE id = $1`, [T11]);
ok(await w(T11) === 1, 'codigo atual: mudar urgencia muda o peso');
await db.query(`UPDATE tasks SET weight = 3 WHERE id = $1`, [T11]);
ok((await val(`SELECT priority FROM tasks WHERE id=$1`, [T11])) === 'alta', 'codigo novo: mudar peso muda a urgencia');
await db.query(`UPDATE priorities SET weight = 1 WHERE id = $1`, [P5]);
ok((await val(`SELECT t.weight FROM priorities p JOIN tasks t ON t.id = p.source_task_id WHERE p.id=$1`, [P5])) === 1, 'codigo atual: mudar peso da prioridade muda o peso do processo');
const r5b = await one(`SELECT t.id FROM priorities p JOIN tasks t ON t.id = p.source_task_id WHERE p.id=$1`, [P5]);
await db.query(`UPDATE tasks SET priority = 'urgente' WHERE id = $1`, [r5b.id]);
ok(await w(r5b.id) === 1, 'tarefa ligada a prioridade: urgencia nao muda o peso (prioridade manda)');
await db.query(`SELECT public.promote_client_task($1, 5, NULL, 'Teste')`, [T10]);
ok(await w(T10) === 5, 'codigo atual: promover tarefa com peso 5 deixa o processo com peso 5');

// ---- comentarios e repeticao
await db.query(`INSERT INTO client_comments (client_id, comment_text, task_id) VALUES ($1, 'acompanhamento', $2)`, [A, T2]);
ok(true, 'comentario aceita task_id');
const tryErr = async (q, p) => { try { await db.query(q, p); return false; } catch { return true; } };
ok(!(await tryErr(`UPDATE tasks SET recurrence='custom', recurrence_interval=14, recurrence_unit='days' WHERE id=$1`, [T12])), 'repeticao a cada 14 dias aceita');
ok(await tryErr(`UPDATE tasks SET recurrence='custom', recurrence_interval=NULL, recurrence_unit=NULL WHERE id=$1`, [T12]), 'repeticao livre sem intervalo recusada');
ok(await tryErr(`UPDATE tasks SET recurrence='weekly', recurrence_interval=2, recurrence_unit='days' WHERE id=$1`, [T12]), 'semanal com intervalo recusada');
ok(await tryErr(`UPDATE tasks SET weight = 6 WHERE id=$1`, [T12]), 'peso 6 recusado');

console.log(failures ? `\n${failures} FALHA(S)` : '\nTUDO CERTO');
process.exit(failures ? 1 : 0);
