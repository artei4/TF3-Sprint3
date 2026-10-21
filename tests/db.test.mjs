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

// Equipe: convites e administradores
ids.admin = '00000000-0000-0000-0000-0000000000ad'
await db.exec(`insert into auth.users values ('${ids.admin}', 'funcionario@academiapele.com', '{"name":"Marina"}')`)
const signUp = async (id, email, invite) => {
  try { await db.query(`insert into auth.users values ($1, $2, $3)`, [id, email, JSON.stringify({ name: 'Nova', invite })]); return {} } catch (e) { return { error: e.message } }
}
const asAnon = async (sql) => {
  await db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false); set role anon;`)
  try { return { rows: (await db.query(sql)).rows } } catch (e) { return { error: e.message } } finally { await db.exec('reset role') }
}
r = await as('admin', `select is_admin() a`)
expect('conta da coordenação é administradora', r.rows?.[0]?.a === true, r)
r = await as('staff', `select create_staff_invite('nova@x.com')`)
expect('funcionário comum NÃO convida', /not_admin/.test(r.error || ''), r)
r = await as('p1', `select create_staff_invite('nova@x.com')`)
expect('atleta NÃO convida', /not_admin/.test(r.error || ''), r)
r = await as('admin', `select * from create_staff_invite('a@x.com')`)
expect('convite para e-mail que já tem conta é recusado', /invite_email_taken/.test(r.error || ''), r)
r = await as('admin', `select * from create_staff_invite('sem-arroba')`)
expect('e-mail inválido é recusado', /invalid_email/.test(r.error || ''), r)
r = await as('admin', `select * from create_staff_invite('  Nova@X.com ')`)
const code = r.rows?.[0]?.code
expect('administrador gera convite (código de 64 caracteres, vale 7 dias)', /^[0-9a-f]{64}$/.test(code || '') && Math.round((new Date(r.rows[0].expires_at) - Date.now()) / 864e5) === 7, r)
r = await asAnon(`select email, status from check_staff_invite('${code}')`)
expect('link do convite funciona sem login e mostra o e-mail', r.rows?.[0]?.email === 'nova@x.com' && r.rows?.[0]?.status === 'valid', r)
r = await asAnon(`select * from check_staff_invite('${'0'.repeat(64)}')`)
expect('código errado não devolve nada', r.rows?.length === 0, r)
r = await as('staff', `select id from staff_invites`)
expect('funcionário comum NÃO lê convites', r.rows?.length === 0, r)
r = await as('admin', `select code_hash from staff_invites`)
expect('nem o administrador lê o hash do código', /permission denied/.test(r.error || ''), r)
r = await as('admin', `insert into staff_invites (email, code_hash) values ('x@x.com', 'abc')`)
expect('ninguém cria convite direto na tabela', /permission denied/.test(r.error || ''), r)

ids.nova = '00000000-0000-0000-0000-0000000000b1'
r = await signUp('00000000-0000-0000-0000-0000000000b0', 'outra@x.com', code)
expect('convite NÃO serve para outro e-mail', /invite_invalid/.test(r.error || ''), r)
r = await signUp(ids.nova, 'nova@x.com', code)
const nova = (await db.query(`select role, is_admin from profiles where id = '${ids.nova}'`)).rows[0]
expect('conta criada com o convite vira funcionário (sem admin)', !r.error && nova?.role === 'staff' && nova?.is_admin === false, { r, nova })
r = await signUp('00000000-0000-0000-0000-0000000000b2', 'nova2@x.com', code)
expect('convite já usado NÃO cria outra conta', /invite_invalid/.test(r.error || ''), r)
r = await asAnon(`select status from check_staff_invite('${code}')`)
expect('convite usado aparece como "used"', r.rows?.[0]?.status === 'used', r)
r = await signUp('00000000-0000-0000-0000-0000000000b3', 'qualquer@x.com', 'inventado')
expect('código inventado NÃO cria conta', /invite_invalid/.test(r.error || ''), r)
ids.semConvite = '00000000-0000-0000-0000-0000000000b4'
await signUp(ids.semConvite, 'sozinho@x.com', '')
r = await db.query(`select role from profiles where id = '${ids.semConvite}'`)
expect('cadastro sem convite continua sendo de atleta', r.rows?.[0]?.role === 'player', r.rows)

r = await as('admin', `select * from create_staff_invite('vence@x.com', true)`)
const expiring = r.rows?.[0]
await db.exec(`update staff_invites set expires_at = now() - interval '1 minute' where id = ${expiring.id}`)
r = await signUp('00000000-0000-0000-0000-0000000000b5', 'vence@x.com', expiring.code)
expect('convite vencido NÃO cria conta', /invite_invalid/.test(r.error || ''), r)
r = await as('admin', `select * from create_staff_invite('dupla@x.com')`)
const first = r.rows?.[0]
r = await as('admin', `select * from create_staff_invite('dupla@x.com')`)
r = await asAnon(`select status from check_staff_invite('${first.code}')`)
expect('convite novo para o mesmo e-mail cancela o anterior', r.rows?.[0]?.status === 'revoked', r)
r = await as('admin', `select revoke_staff_invite(${first.id})`)
expect('cancelar convite já cancelado avisa', /invite_not_pending/.test(r.error || ''), r)
r = await as('staff', `select revoke_staff_invite(${first.id + 1})`)
expect('funcionário comum NÃO cancela convite', /not_admin/.test(r.error || ''), r)
r = await as('admin', `select revoke_staff_invite(${first.id + 1})`)
expect('administrador cancela convite pendente', !r.error, r)

r = await as('nova', `update profiles set is_admin = true, active = true where id = auth.uid()`)
expect('funcionário NÃO se promove a administrador', /permission denied/.test(r.error || ''), r)
r = await as('staff', `select update_staff('${ids.nova}', true, true)`)
expect('funcionário comum NÃO promove outro', /not_admin/.test(r.error || ''), r)
r = await as('admin', `select update_staff('${ids.admin}', false, false)`)
expect('administrador NÃO altera a própria conta', /cannot_change_self/.test(r.error || ''), r)
r = await as('admin', `select update_staff('${ids.p1}', true, true)`)
expect('atleta NÃO vira administrador por essa função', /not_staff/.test(r.error || ''), r)
r = await as('admin', `select update_staff('${ids.staff}', true, true)`)
r = await as('staff', `select is_admin() a`)
expect('administrador promove outro funcionário', r.rows?.[0]?.a === true, r)
r = await as('admin', `select update_staff('${ids.nova}', false, false)`)
r = await as('nova', `${venue} values ('Campo Desativado', 'Rua D, 4', '', 'Osasco', 'SP', '', '')`)
expect('funcionário desativado perde as permissões', /row-level security/.test(r.error || ''), r)
r = await as('p1', `select id from profiles where id = '${ids.nova}'`)
expect('atleta não vê funcionário desativado', r.rows?.length === 0, r)
r = await as('p2', `insert into messages (athlete_id, staff_id, sender_id, body) values ('${ids.p2}', '${ids.nova}', '${ids.p2}', 'oi')`)
expect('atleta não escreve para funcionário desativado', /row-level security/.test(r.error || ''), r)
r = await as('p2', `insert into messages (athlete_id, staff_id, sender_id, body) values ('${ids.p2}', '${ids.staff}', '${ids.p2}', 'oi')`)
expect('...mas continua escrevendo para funcionário ativo', !r.error, r)
r = await as('admin', `select action, details from audit_log where entity in ('staff_invite', 'staff') order by id`)
const actions = r.rows?.map((row) => row.action).join(',')
expect('registro guarda convite, aceite, cancelamento e alterações', ['create', 'accept', 'revoke', 'update', 'deactivate'].every((a) => actions?.includes(a)) && r.rows.at(-1).details?.active?.para === false, actions)

// Descrição da peneira
r = await as('staff', `insert into tryouts (title, date, "time", location, city, state, positions, seats, description) values ('Com detalhes', ${today} + 4, '10:00', 'CT', 'SP', 'SP', '{Meia}', 5, 'Leve chuteira e água.') returning id`)
const described = r.rows?.[0]?.id
expect('funcionário cria peneira com descrição', !r.error, r)
r = await as('p2', `select description from list_tryouts() where id = ${described}`)
expect('atleta lê a descrição na lista', r.rows?.[0]?.description === 'Leve chuteira e água.', r)
r = await as('staff', `insert into tryouts (title, date, "time", location, city, state, positions, seats, description) values ('Longa', ${today} + 4, '10:00', 'CT', 'SP', 'SP', '{Meia}', 5, repeat('a', 1001))`)
expect('descrição acima de 1000 caracteres é recusada', /tryouts_description_len/.test(r.error || ''), r)
r = await as('p2', `update tryouts set description = 'mudei' where id = ${described} returning id`)
expect('atleta NÃO altera a descrição', !!r.error || !r.rows?.length, r)

// Menores de idade e responsável legal
const birthYearsAgo = (years) => (Number((new Date()).toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' }).slice(0, 4)) - years) + '-01-01'
const signUpWith = async (id, email, meta) => {
  try { await db.query(`insert into auth.users values ($1, $2, $3)`, [id, email, JSON.stringify(meta)]); return {} } catch (e) { return { error: e.message } }
}
const guardian = { name: 'Ana Souza', relationship: 'mae', email: 'ana@x.com', phone: '(11) 90000-0000', consent: true }
ids.minor = '00000000-0000-0000-0000-0000000000c1'
ids.adult = '00000000-0000-0000-0000-0000000000c2'
r = await signUpWith('00000000-0000-0000-0000-0000000000c0', 'sem.resp@x.com', { name: 'Menor', public: { birth: birthYearsAgo(15) } })
expect('menor NÃO cria conta sem responsável', /guardian_required/.test(r.error || ''), r)
r = await signUpWith('00000000-0000-0000-0000-0000000000c3', 'sem.ok@x.com', { name: 'Menor', public: { birth: birthYearsAgo(15) }, guardian: { ...guardian, consent: false } })
expect('menor NÃO cria conta sem a autorização marcada', /guardian_required/.test(r.error || ''), r)
r = await signUpWith(ids.minor, 'menor@x.com', { name: 'Menor', public: { birth: birthYearsAgo(15) }, guardian })
const g = (await db.query(`select name, relationship, consent_at from guardians where athlete_id = '${ids.minor}'`)).rows[0]
expect('menor com responsável e autorização cria a conta', !r.error && g?.name === 'Ana Souza' && !!g?.consent_at, { r, g })
r = await signUpWith(ids.adult, 'adulto@x.com', { name: 'Adulto', public: { birth: birthYearsAgo(19) } })
expect('maior de idade não precisa de responsável', !r.error, r)
r = await signUpWith('00000000-0000-0000-0000-0000000000c4', 'rel@x.com', { name: 'Menor', public: { birth: birthYearsAgo(12) }, guardian: { ...guardian, relationship: 'vizinho' } })
expect('parentesco fora da lista é recusado', /check/.test(r.error || ''), r)
r = await db.query(`select details from audit_log where entity = 'guardian' and entity_id = '${ids.minor}'`)
expect('registro da autorização não guarda nome nem contato', r.rows.length === 1 && !JSON.stringify(r.rows[0].details).includes('ana'), r.rows)

r = await as('minor', `select enroll_tryout(${described})`)
expect('menor autorizado se inscreve', !r.error, r)
r = await as('minor', `select revoke_guardian_consent()`)
expect('atleta revoga a autorização', !r.error, r)
r = await as('minor', `select revoke_guardian_consent()`)
expect('revogar de novo avisa', /no_consent/.test(r.error || ''), r)
await db.exec(`delete from tryout_enrollments where athlete_id = '${ids.minor}'`)
r = await as('minor', `select enroll_tryout(${described})`)
expect('sem autorização, menor NÃO se inscreve', /guardian_required/.test(r.error || ''), r)
r = await as('minor', `select save_guardian('Ana Souza', 'mae', 'ana@x.com', '', false)`)
expect('salvar sem marcar a autorização é recusado', /consent_required/.test(r.error || ''), r)
r = await as('minor', `select save_guardian('Ana Souza', 'mae', 'ana@x.com', '', true)`)
r = await as('minor', `select enroll_tryout(${described})`)
expect('autorizado de novo, volta a se inscrever', !r.error, r)
r = await as('adult', `select enroll_tryout(${described})`)
expect('maior de idade se inscreve sem responsável', !r.error, r)
r = await as('staff', `select save_guardian('X Y Z', 'pai', 'x@x.com', '', true)`)
expect('funcionário NÃO grava responsável', /not_player/.test(r.error || ''), r)

r = await as('staff', `select name from guardians where athlete_id = '${ids.minor}'`)
expect('equipe vê o responsável (para falar com a família)', r.rows?.[0]?.name === 'Ana Souza', r)
r = await as('adult', `select name from guardians where athlete_id = '${ids.minor}'`)
expect('outro atleta NÃO vê o responsável', r.rows?.length === 0, r)
r = await as('minor', `insert into guardians (athlete_id, name, relationship, email, consent_at) values (auth.uid(), 'Falso', 'pai', 'f@x.com', now())`)
expect('ninguém grava direto na tabela', /permission denied/.test(r.error || ''), r)
r = await as('adult', `select needs_guardian('${ids.minor}')`)
expect('needs_guardian não é chamável pela API', /permission denied/.test(r.error || ''), r)

r = await as('minor', `update profiles set data = data || '{"birth":"2000-01-01"}' where id = auth.uid()`)
expect('menor NÃO muda a data de nascimento para virar adulto', /birth_locked/.test(r.error || ''), r)
r = await as('minor', `update profiles set data = data || '{"foot":"Canhoto"}' where id = auth.uid() returning id`)
expect('...mas edita os outros dados do perfil', r.rows?.length === 1, r)

// Presença no dia da peneira
r = await as('staff', `select set_attendance(${described}, 'adulto@x.com', true)`)
expect('chamada NÃO abre antes do dia da peneira', /checkin_not_open/.test(r.error || ''), r)
r = await as('staff', `insert into tryouts (title, date, "time", location, city, state, positions, seats) values ('Hoje', ${today}, '23:59', 'CT', 'SP', 'SP', '{Meia}', 5) returning id`)
const todayTryout = r.rows?.[0]?.id
await db.exec(`insert into tryout_enrollments (tryout_id, athlete_id) values (${todayTryout}, '${ids.adult}'), (${todayTryout}, '${ids.minor}')`)
r = await as('adult', `select set_attendance(${todayTryout}, 'adulto@x.com', true)`)
expect('atleta NÃO marca a própria presença', /not_staff/.test(r.error || ''), r)
r = await as('staff', `select set_attendance(${todayTryout}, 'ADULTO@x.com', true) as at`)
const firstAt = r.rows?.[0]?.at
expect('funcionário marca a presença no dia', !r.error && !!firstAt, r)
r = await as('staff', `select set_attendance(${todayTryout}, 'adulto@x.com', true) as at`)
expect('marcar de novo mantém a hora da chegada', String(r.rows?.[0]?.at) === String(firstAt), r)
r = await as('staff', `select set_attendance(${todayTryout}, 'b@x.com', true)`)
expect('quem não está inscrito NÃO recebe presença', /not_enrolled/.test(r.error || ''), r)
r = await as('staff', `select checkins from list_tryouts() where id = ${todayTryout}`)
expect('equipe vê as presenças na lista', Object.keys(r.rows?.[0]?.checkins || {}).join() === 'adulto@x.com', r)
r = await as('minor', `select checkins from list_tryouts() where id = ${todayTryout}`)
expect('outro atleta NÃO vê a presença dos outros', Object.keys(r.rows?.[0]?.checkins || {}).length === 0, r)
r = await as('adult', `select checkins from list_tryouts() where id = ${todayTryout}`)
expect('atleta vê a própria presença', !!r.rows?.[0]?.checkins?.['adulto@x.com'], r)
r = await as('adult', `delete from tryout_enrollments where tryout_id = ${todayTryout} and athlete_id = auth.uid() returning tryout_id`)
expect('atleta presente NÃO cancela a inscrição', !r.error && r.rows?.length === 0, r)
r = await as('adult', `update tryout_enrollments set checked_in_at = null where athlete_id = auth.uid() returning tryout_id`)
expect('ninguém altera a presença direto na tabela', /permission denied/.test(r.error || ''), r)
r = await as('staff', `select set_attendance(${todayTryout}, 'adulto@x.com', false)`)
r = await as('staff', `select checkins from list_tryouts() where id = ${todayTryout}`)
expect('funcionário desfaz a presença', !r.error && Object.keys(r.rows?.[0]?.checkins || {}).length === 0, r)
r = await db.query(`select action, details from audit_log where entity = 'tryout' and entity_id = '${todayTryout}' and action like '%checkin' order by id`)
expect('registro guarda marcar e desfazer, sem e-mail', r.rows.map((x) => x.action).join() === 'checkin,checkin,undo_checkin' && !JSON.stringify(r.rows).includes('@'), r.rows)
// Avaliação ligada à peneira (peneira ao vivo)
const evalSql = (athlete, tryout) => `insert into evaluations (athlete_id, position, ratings, rating, base_rating, comment, tryout_id) values ('${athlete}', 'Meia', '{"passe":8}', 8, 8, 'Nota rápida na peneira de hoje.', ${tryout}) returning tryout_id`
r = await as('staff', evalSql(ids.adult, todayTryout))
expect('funcionário avalia o inscrito ligando à peneira', !r.error && Number(r.rows?.[0]?.tryout_id) === Number(todayTryout), r)
r = await as('staff', evalSql(ids.p1, todayTryout))
expect('NÃO liga a avaliação a uma peneira em que o atleta não está inscrito', /row-level security/.test(r.error || ''), r)
r = await as('staff', evalSql(ids.p1, 'null'))
expect('avaliação fora de peneira continua valendo', !r.error && r.rows?.[0]?.tryout_id === null, r)
await as('staff', `update tryouts set status = 'cancelled', cancel_reason = 'chuva' where id = ${todayTryout}`)
r = await as('staff', `select set_attendance(${todayTryout}, 'adulto@x.com', true)`)
expect('peneira cancelada não tem chamada', /tryout_closed/.test(r.error || ''), r)

console.log(`\n${pass} ok, ${fail} falharam`)
process.exit(fail ? 1 : 0)
