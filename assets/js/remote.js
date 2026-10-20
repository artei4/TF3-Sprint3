// Camada de acesso ao Supabase para autenticação, perfis e avaliações.
// Se o Supabase não estiver configurado (ou não carregar), `remote.enabled` fica false
// e o site continua funcionando em modo local (localStorage), como antes.
import { SUPABASE_URL, SUPABASE_KEY } from './config.js'
import { t } from './i18n.js'

const SUPABASE_CDN = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm'
const LOAD_TIMEOUT_MS = 8000

export const remote = { enabled: false }
let client = null

export function disableRemote() {
  remote.enabled = false
  client = null
}

function forcedLocal() {
  try { return new URLSearchParams(location.search).get('local') === '1' } catch { return false }
}

export async function initRemote() {
  if (forcedLocal() || !SUPABASE_URL || !SUPABASE_KEY) return false
  try {
    const module = await Promise.race([
      import(/* @vite-ignore */ SUPABASE_CDN),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), LOAD_TIMEOUT_MS)),
    ])
    client = module.createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
    remote.enabled = true
    return true
  } catch (error) {
    console.warn('[Supabase] indisponível, usando modo local:', error)
    remote.enabled = false
    return false
  }
}

// Traduz erros do Supabase em mensagens amigáveis (em português; a tradução para o espanhol é feita na tela).
export function describeError(error) {
  const text = String(error?.message || error || '').toLowerCase()
  const code = String(error?.code || '').toLowerCase()
  if (text.includes('tryout_full')) return t('As vagas desta peneira acabaram.')
  if (text.includes('tryout_past')) return t('As inscrições fecharam no horário de início da peneira.')
  if (text.includes('tryout_closed')) return t('Esta peneira já foi encerrada.')
  if (text.includes('venues_name_city_key')) return t('Já existe um local com esse nome nesta cidade.')
  if (text.includes('venue_inactive')) return t('Este local foi desativado. Escolha outro.')
  if (text.includes('not_player')) return t('Só atletas podem se inscrever em peneiras.')
  if (text.includes('not_admin')) return t('Só administradores podem fazer isso.')
  if (text.includes('invite_email_taken')) return t('Este e-mail já tem uma conta na plataforma.')
  if (text.includes('invalid_email')) return t('Informe um e-mail válido.')
  if (text.includes('invite_not_pending')) return t('Este convite já foi usado ou cancelado.')
  if (text.includes('cannot_change_self')) return t('Você não pode alterar a própria conta. Peça a outro administrador.')
  if (text.includes('checkin_not_open')) return t('A chamada abre no dia da peneira.')
  if (text.includes('not_enrolled')) return t('Este atleta não está inscrito nesta peneira.')
  if (text.includes('not_staff')) return t('Esta conta não é de funcionário.')
  if (text.includes('guardian_required')) return t('Falta a autorização do responsável. Registre no seu perfil.')
  if (text.includes('consent_required')) return t('A autorização do responsável é obrigatória para menores de 18 anos.')
  if (text.includes('no_consent')) return t('Não há autorização ativa para revogar.')
  if (text.includes('birth_locked')) return t('A data de nascimento não muda depois do cadastro. Fale com a equipe para corrigir.')
  if (text.includes('account_disabled')) return t('Esta conta de funcionário foi desativada. Fale com um administrador.')
  if (text.includes('message_rate_limit')) return t('Você enviou muitas mensagens seguidas. Aguarde um minuto.')
  if (text.includes('invalid login credentials')) return t('E-mail ou senha incorretos.')
  if (text.includes('already registered') || code === 'user_already_exists') return t('Já existe uma conta com esse e-mail.')
  if (text.includes('email not confirmed')) return t('Confirme seu e-mail antes de entrar (veja sua caixa de entrada).')
  if (text.includes('database error saving new user') || code === 'unexpected_failure') return t('Não foi possível criar a conta. O CPF ou o e-mail já pode estar cadastrado.')
  if (text.includes('rate limit') || code.includes('rate_limit')) return t('Muitas tentativas. Aguarde alguns minutos e tente novamente.')
  if (text.includes('relation') && text.includes('does not exist')) return t('O banco ainda não foi configurado. Execute o SQL da pasta supabase/migrations.')
  if (text.includes('schema cache') || text.includes('could not find the table')) return t('O banco ainda não foi atualizado. Execute a migration mais recente no Supabase.')
  if (text.includes('perfil não encontrado') || text.includes('profile not found')) return t('O perfil desta conta ainda não foi criado. Execute a migration de contas no Supabase e tente novamente.')
  if (text.includes('failed to fetch') || text.includes('network')) return t('Sem conexão com o servidor. Verifique sua internet.')
  return t('Não foi possível concluir a operação. Tente novamente.')
}

// ---------- Autenticação ----------
export async function getSessionUser() {
  const { data } = await client.auth.getSession()
  const user = data?.session?.user
  return user ? { uid: user.id, email: user.email } : null
}

// `publicData` fica visível para a equipe (posição, cidade...). `privateData` só o próprio usuário enxerga (CPF, endereço).
// O perfil é criado no banco por um gatilho (trigger) a partir destes metadados; o papel (jogador/funcionário) é definido
// no servidor e não pode ser escolhido pelo navegador.
// `invite` é o código do link de convite: o servidor confere e, se valer, cria a conta como funcionário.
// `guardian` (menores de 18): responsável e autorização; sem isso o servidor recusa a conta do menor.
export async function signUp({ email, password, name, publicData = {}, privateData = {}, invite = '', guardian = null }) {
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: { data: { name, public: publicData, private: privateData, invite, guardian } },
  })
  return { error, session: data?.session || null }
}

export async function signIn(email, password) {
  const { data, error } = await client.auth.signInWithPassword({ email, password })
  return { error, user: data?.user || null }
}

export async function requestPasswordReset(email, redirectTo) {
  const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo })
  return error || null
}

export async function updatePassword(password) {
  const { error } = await client.auth.updateUser({ password })
  return error || null
}

export async function signOut() {
  try { await client.auth.signOut() } catch { /* sem conexão: a sessão local é descartada mesmo assim */ }
}

export function onSignedOut(callback) {
  const { data } = client.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT' || event === 'PASSWORD_RECOVERY') callback(event)
  })
  return () => data?.subscription?.unsubscribe()
}

// ---------- Perfis ----------
const PROFILE_COLUMNS = 'id,email,role,athlete_num,name,data'

export async function fetchOwnProfile(uid) {
  // '*' traz is_admin/active quando a migration de equipe já rodou, sem quebrar o login antes dela.
  const own = await client.from('profiles').select('*').eq('id', uid).maybeSingle()
  if (own.error) throw own.error
  const priv = await client.from('profile_private').select('data').eq('id', uid).maybeSingle()
  if (priv.error) throw priv.error
  return { profile: own.data, private: priv.data?.data || {} }
}

// Jogadores enxergam a lista de funcionários; funcionários enxergam a lista de jogadores.
export async function listDirectory(role) {
  const { data, error } = await client.from('profiles').select(PROFILE_COLUMNS).eq('role', role === 'staff' ? 'player' : 'staff')
  if (error) throw error
  return data || []
}

export async function updateOwnProfile(uid, { name, data, privateData }) {
  const first = await client.from('profiles').update({ name, data }).eq('id', uid)
  if (first.error) return first.error
  if (privateData) {
    const second = await client.from('profile_private').update({ data: privateData }).eq('id', uid)
    if (second.error) return second.error
  }
  return null
}

export async function fetchEvaluations() {
  const { data, error } = await client
    .from('evaluations')
    .select('id,athlete_id,evaluator_id,position,ratings,rating,base_rating,adjustment,stats,strengths,comment,created_at')
    .order('created_at', { ascending: false })
    .limit(2000)
  if (error) throw error
  const evaluatorIds = [...new Set((data || []).map((row) => row.evaluator_id).filter(Boolean))]
  if (!evaluatorIds.length) return data || []
  const authors = await client.from('profiles').select('id,name,email').in('id', evaluatorIds)
  if (authors.error) throw authors.error
  const byId = new Map((authors.data || []).map((profile) => [profile.id, profile]))
  return (data || []).map((row) => ({ ...row, evaluator: byId.get(row.evaluator_id) || null }))
}

export async function createEvaluation({ athleteId, position, ratings, rating, baseRating, adjustment, stats, strengths, comment }) {
  const { data, error } = await client
    .from('evaluations')
    .insert({
      athlete_id: athleteId,
      position,
      ratings,
      rating,
      base_rating: baseRating,
      adjustment,
      stats,
      strengths,
      comment,
    })
    .select('id,athlete_id,evaluator_id,position,ratings,rating,base_rating,adjustment,stats,strengths,comment,created_at')
    .single()
  return { row: data || null, error }
}

export async function removeEvaluation(id) {
  const { error } = await client.from('evaluations').delete().eq('id', id)
  return error || null
}

// ---------- Peneiras (migration 20261016120000_peneiras.sql) ----------
export async function fetchTryouts() {
  const { data, error } = await client.rpc('list_tryouts')
  if (error) throw error
  return data || []
}

// O servidor copia nome, cidade e UF do local (venue_id); os campos de texto vão só porque são obrigatórios.
export async function createTryout({ title, date, time, location, city, state, category, positions, seats, venueId, description = '' }) {
  const { error } = await client.from('tryouts').insert({ title, date, time, location, city, state, category, positions, seats, venue_id: venueId, description })
  return error || null
}

export async function cancelTryout(id, reason) {
  const { error } = await client.from('tryouts').update({ status: 'cancelled', cancel_reason: reason }).eq('id', id)
  return error || null
}

export async function enrollTryout(id) {
  // Pela função do servidor: ela trava a última vaga e confere data e status.
  const { error } = await client.rpc('enroll_tryout', { p_tryout: id })
  return error || null
}

export async function withdrawTryout(id, uid) {
  const { error } = await client.from('tryout_enrollments').delete().eq('tryout_id', id).eq('athlete_id', uid)
  return error || null
}

// Presença no dia (migration 20261024120000_presenca.sql). Devolve a hora da chegada (ou null ao desfazer).
export async function setAttendance(id, email, present) {
  const { data, error } = await client.rpc('set_attendance', { p_tryout: id, p_email: email, p_present: present })
  return { error: error || null, at: data || null }
}

// ---------- Locais de peneira ----------
const VENUE_COLUMNS = 'id,name,address,district,city,state,zip,reference,active,updated_by,updated_at'

export async function fetchVenues() {
  const { data, error } = await client.from('venues').select(VENUE_COLUMNS).order('name')
  if (error) throw error
  return data || []
}

// Sem id cria; com id edita (inclusive ativar/desativar). Apagar não existe: só desativar.
export async function saveVenue(id, fields) {
  const query = id ? client.from('venues').update(fields).eq('id', id) : client.from('venues').insert(fields)
  const { data, error } = await query.select(VENUE_COLUMNS).single()
  return { row: data || null, error }
}

// ---------- Conversas ----------
const MESSAGE_COLUMNS = 'id,athlete_id,staff_id,sender_id,body,created_at'

export async function fetchMessages() {
  const { data, error } = await client.from('messages').select(MESSAGE_COLUMNS).order('created_at', { ascending: true }).limit(2000)
  if (error) throw error
  return data || []
}

export async function sendMessage({ athleteId, staffId, senderId, body }) {
  const { data, error } = await client
    .from('messages')
    .insert({ athlete_id: athleteId, staff_id: staffId, sender_id: senderId, body })
    .select(MESSAGE_COLUMNS)
    .single()
  return { row: data || null, error }
}

// ---------- Equipe (migration 20261021120000_equipe.sql) ----------
// Convites, administradores e histórico. O banco confere se quem pede é administrador.
export async function fetchTeam() {
  const [staff, invites, log] = await Promise.all([
    client.from('profiles').select(PROFILE_COLUMNS + ',is_admin,active').eq('role', 'staff').order('name'),
    client.from('staff_invites').select('id,email,is_admin,created_by,created_at,expires_at,used_by,used_at,revoked_at').order('created_at', { ascending: false }).limit(50),
    client.from('audit_log').select('id,actor_id,action,entity,entity_id,details,created_at').in('entity', ['staff', 'staff_invite']).order('created_at', { ascending: false }).limit(20),
  ])
  const error = staff.error || invites.error || log.error
  if (error) throw error
  return { staff: staff.data || [], invites: invites.data || [], log: log.data || [] }
}

export async function createStaffInvite(email, admin) {
  const { data, error } = await client.rpc('create_staff_invite', { p_email: email, p_admin: admin })
  return { invite: data?.[0] || null, error }
}

export async function revokeStaffInvite(id) {
  const { error } = await client.rpc('revoke_staff_invite', { p_id: id })
  return error || null
}

export async function updateStaff(id, active, admin) {
  const { error } = await client.rpc('update_staff', { p_profile: id, p_active: active, p_admin: admin })
  return error || null
}

// Funciona sem login (é a primeira tela de quem recebeu o link).
export async function checkStaffInvite(code) {
  const { data, error } = await client.rpc('check_staff_invite', { p_code: code })
  if (error) throw error
  return data?.[0] || null
}

// ---------- Responsável legal (migration 20261023120000_responsavel.sql) ----------
// O atleta vê o próprio; a equipe vê todos. Só as funções do servidor gravam.
export async function fetchGuardians() {
  const { data, error } = await client.from('guardians').select('athlete_id,name,relationship,email,phone,consent_at,consent_version,revoked_at')
  if (error) throw error
  return data || []
}

export async function saveGuardian({ name, relationship, email, phone, consent }) {
  const { error } = await client.rpc('save_guardian', { p_name: name, p_relationship: relationship, p_email: email, p_phone: phone, p_consent: consent })
  return error || null
}

export async function revokeGuardianConsent() {
  const { error } = await client.rpc('revoke_guardian_consent')
  return error || null
}
