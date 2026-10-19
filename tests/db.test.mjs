// Regras do banco: roda as migrations num Postgres em WASM (PGlite) com um "auth" de mentira e testa como usuário logado.
// Não testa concorrência real (PGlite tem uma conexão só): a trava da última vaga é o "for update" de enroll_tryout.
import { PGlite } from '@electric-sql/pglite'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const dir = fileURLToPath(new URL('../supabase/migrations', import.meta.url))
const db = new PGlite()
await db.exec(`
  create role anon; create role authenticated;
  create schema auth;
  grant usage on schema auth to authenticated;
  create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema public to authenticated;
`)
for (const file of readdirSync(dir).sort()) await db.exec(readFileSync(dir + '/' + file, 'utf8'))
console.log('migrations ok (2x):', await (async () => { for (const f of readdirSync(dir).sort()) await db.exec(readFileSync(dir + '/' + f, 'utf8')); return 'idempotente' })())

const ids = { staff: '00000000-0000-0000-0000-00000000000a', p1: '00000000-0000-0000-0000-000000000001', p2: '00000000-0000-0000-0000-000000000002', p3: '00000000-0000-0000-0000-000000000003' }
await db.exec(`insert into auth.users values
  ('${ids.staff}', 'treinador@academiapele.com', '{"name":"Treinador"}'),
  ('${ids.p1}', 'a@x.com', '{"name":"A"}'), ('${ids.p2}', 'b@x.com', '{"name":"B"}'), ('${ids.p3}', 'c@x.com', '{"name":"C"}')`)

let pass = 0, fail = 0
const as = async (who, sql) => {
  await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${ids[who]}', false); set role authenticated;`)
  try { return { rows: (await db.query(sql)).rows } } catch (e) { return { error: e.message } } finally { await db.exec('reset role') }
}
const expect = (label, ok, detail) => { ok ? pass++ : fail++; console.log((ok ? '  ok  ' : '  FALHOU ') + label + (ok ? '' : ' → ' + JSON.stringify(detail))) }
const today = `(now() at time zone 'America/Sao_Paulo')::date`

// Peneiras criadas pelo funcionário
let r = await as('staff', `insert into tryouts (title, date, location, city, state, positions, seats) values ('Futura', ${today} + 5, 'CT', 'SP', 'SP', '{Meia}', 2) returning id`)
expect('funcionário cria peneira futura', !r.error, r)
const future = r.rows?.[0]?.id
r = await as('staff', `insert into tryouts (title, date, location, city, state, positions, seats) values ('Passada', ${today} - 1, 'CT', 'SP', 'SP', '{Meia}', 2)`)
expect('funcionário NÃO cria peneira com data passada', /row-level security/.test(r.error || ''), r)
r = await as('p1', `insert into tryouts (title, date, location, city, state, positions, seats) values ('Atleta', ${today} + 5, 'CT', 'SP', 'SP', '{Meia}', 2)`)
expect('atleta NÃO cria peneira', !!r.error, r)
// peneira que já passou (criada direto, como se fosse antiga)
const past = (await db.query(`insert into tryouts (created_by, title, date, location, city, state, positions, seats) values ('${ids.staff}', 'Antiga', ${today} - 2, 'CT', 'SP', 'SP', '{Meia}', 5) returning id`)).rows[0].id

// Inscrições
r = await as('p1', `select enroll_tryout(${future})`); expect('atleta se inscreve em peneira futura', !r.error, r)
r = await as('p1', `select enroll_tryout(${future})`); expect('inscrever de novo não duplica nem dá erro', !r.error, r)
r = await as('p2', `select enroll_tryout(${future})`); expect('segundo atleta pega a última vaga', !r.error, r)
r = await as('p3', `select enroll_tryout(${future})`); expect('terceiro atleta recebe tryout_full', /tryout_full/.test(r.error || ''), r)
r = await as('p3', `select enroll_tryout(${past})`); expect('inscrição em peneira passada recebe tryout_past', /tryout_past/.test(r.error || ''), r)
r = await as('staff', `select enroll_tryout(${future})`); expect('funcionário recebe not_player', /not_player/.test(r.error || ''), r)
r = await as('p3', `insert into tryout_enrollments (tryout_id) values (${future})`); expect('insert direto na tabela é negado', /permission denied/.test(r.error || ''), r)
r = await as('p1', `delete from tryout_enrollments where tryout_id = ${future} and athlete_id = auth.uid() returning tryout_id`); expect('atleta cancela a própria inscrição', r.rows?.length === 1, r)
r = await as('p3', `select enroll_tryout(${future})`); expect('vaga liberada pode ser usada', !r.error, r)
const count = (await db.query(`select count(*)::int n from tryout_enrollments where tryout_id = ${future}`)).rows[0].n
expect('nunca passa do número de vagas (2)', count === 2, count)

// Cancelamento só de ida
r = await as('staff', `update tryouts set status = 'cancelled', cancel_reason = 'chuva' where id = ${future} returning id`); expect('funcionário cancela peneira', r.rows?.length === 1, r)
r = await as('staff', `update tryouts set status = 'open' where id = ${future} returning id`); expect('peneira cancelada NÃO é reaberta', !r.rows?.length, r)
r = await as('p1', `select enroll_tryout(${future})`); expect('inscrição em cancelada recebe tryout_closed', /tryout_closed/.test(r.error || ''), r)

// Mensagens: 8 por minuto
let lastError = null, sent = 0
for (let i = 0; i < 9; i++) {
  r = await as('p1', `insert into messages (athlete_id, staff_id, sender_id, body) values ('${ids.p1}', '${ids.staff}', '${ids.p1}', 'oi ${i}')`)
  if (r.error) lastError = r.error; else sent++
}
expect('8 mensagens passam e a 9ª é barrada', sent === 8 && /message_rate_limit/.test(lastError || ''), { sent, lastError })
r = await as('staff', `insert into messages (athlete_id, staff_id, sender_id, body) values ('${ids.p1}', '${ids.staff}', '${ids.staff}', 'resposta')`)
expect('o limite é por remetente (o treinador ainda responde)', !r.error, r)

// Regras que já existiam e não podem ter quebrado
r = await as('p1', `update profiles set role = 'staff' where id = auth.uid()`); expect('atleta NÃO se promove a funcionário', /permission denied/.test(r.error || ''), r)
r = await as('p2', `select data from profile_private where id = '${ids.p1}'`); expect('atleta NÃO lê CPF/endereço de outro', r.rows?.length === 0, r)

// Locais de peneira
const venue = `insert into venues (name, address, district, city, state, zip, reference)`
r = await as('staff', `${venue} values ('Arena Oeste', 'Rua das Flores, 100', 'Centro', 'Osasco', 'SP', '06010-000', 'Portão 2') returning id`)
expect('funcionário cadastra local', !r.error, r)
const arena = r.rows?.[0]?.id
r = await as('p1', `${venue} values ('Campo do Atleta', 'Rua A, 1', '', 'Osasco', 'SP', '', '')`)
expect('atleta NÃO cadastra local', /row-level security/.test(r.error || ''), r)
r = await as('staff', `${venue} values ('  arena oeste ', 'Outra rua, 5', '', 'OSASCO', 'SP', '', '')`)
expect('local duplicado (mesmo nome e cidade) é recusado', /venues_name_city_key/.test(r.error || ''), r)
r = await as('staff', `${venue} values ('Arena Oeste', 'Rua B, 2', '', 'Barueri', 'SP', '', '') returning id`)
expect('mesmo nome em outra cidade é permitido', !r.error, r)
r = await as('staff', `${venue} values ('CT', 'Rua C, 3', '', 'Santos', 'Sao Paulo', '', '')`)
expect('UF inválida é recusada', /check/.test(r.error || ''), r)
r = await as('p1', `update venues set name = 'Hackeado' where id = ${arena} returning id`)
expect('atleta NÃO edita local', !r.rows?.length, r)

r = await as('staff', `insert into tryouts (title, date, "time", location, city, state, positions, seats, venue_id) values ('Com local', ${today} + 3, '09:00', 'qualquer', 'x', 'XX', '{Meia}', 5, ${arena}) returning location, city, state`)
expect('peneira copia nome/cidade/UF do local', r.rows?.[0]?.location === 'Arena Oeste' && r.rows?.[0]?.state === 'SP', r)
r = await as('staff', `select address, reference from list_tryouts() where venue_id = ${arena}`)
expect('lista de peneiras traz endereço e referência', r.rows?.[0]?.address === 'Rua das Flores, 100' && r.rows?.[0]?.reference === 'Portão 2', r)
r = await as('staff', `insert into tryouts (title, date, "time", location, city, state, positions, seats) values ('Hora ruim', ${today} + 3, '25:00', 'CT', 'SP', 'SP', '{Meia}', 5)`)
expect('horário fora do formato HH:MM é recusado', /tryouts_time_format/.test(r.error || ''), r)

r = await as('staff', `update venues set active = false where id = ${arena} returning active`)
expect('funcionário desativa local', r.rows?.[0]?.active === false, r)
r = await as('staff', `insert into tryouts (title, date, location, city, state, positions, seats, venue_id) values ('Local inativo', ${today} + 3, 'x', 'x', 'SP', '{Meia}', 5, ${arena})`)
expect('local desativado não aceita peneira nova', /venue_inactive/.test(r.error || ''), r)
r = await as('staff', `select count(*)::int n from tryouts where venue_id = ${arena}`)
expect('desativar NÃO apaga as peneiras do local', r.rows?.[0]?.n === 1, r)
r = await as('p1', `select id from venues where id = ${arena}`)
expect('atleta não vê local desativado', r.rows?.length === 0, r)
r = await as('staff', `delete from venues where id = ${arena}`)
expect('ninguém apaga local pela API', /permission denied/.test(r.error || ''), r)

r = await as('staff', `select action, details from audit_log where entity = 'venue' and entity_id = '${arena}' order by id`)
expect('registro guarda criação e desativação', r.rows?.map((row) => row.action).join(',') === 'create,deactivate' && r.rows?.[1]?.details?.active?.para === false, r)
r = await as('staff', `select updated_by from venues where id = ${arena}`)
expect('local guarda quem alterou por último', r.rows?.[0]?.updated_by === ids.staff, r)
r = await as('p1', `select id from audit_log`)
expect('atleta NÃO lê o registro de alterações', r.rows?.length === 0, r)
r = await as('staff', `insert into audit_log (action, entity, entity_id) values ('x', 'y', 'z')`)
expect('ninguém escreve no registro direto', /permission denied/.test(r.error || ''), r)

// Inscrição fecha no horário de início (peneira de hoje que já começou)
const started = (await db.query(`insert into tryouts (created_by, title, date, "time", location, city, state, positions, seats) values ('${ids.staff}', 'Já começou', ${today}, to_char((now() at time zone 'America/Sao_Paulo') - interval '1 minute', 'HH24:MI'), 'CT', 'SP', 'SP', '{Meia}', 5) returning id`)).rows[0].id
r = await as('p2', `select enroll_tryout(${started})`)
expect('inscrição depois do horário de início recebe tryout_past', /tryout_past/.test(r.error || ''), r)

console.log(`\n${pass} ok, ${fail} falharam`)
process.exit(fail ? 1 : 0)
