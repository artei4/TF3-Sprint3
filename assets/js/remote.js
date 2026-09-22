// Camada de acesso ao Supabase (contas, perfis e conversas em tempo real).
// Se o Supabase não estiver configurado (ou não carregar), `remote.enabled` fica false
// e o site continua funcionando em modo local (localStorage), como antes.
import { SUPABASE_URL, SUPABASE_KEY } from './config.js'
import { t } from './i18n.js'

const SUPABASE_CDN = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'
const LOAD_TIMEOUT_MS = 8000

export const remote = { enabled: false }
let client = null

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
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
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
export async function signUp({ email, password, name, publicData = {}, privateData = {} }) {
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: { data: { name, public: publicData, private: privateData } },
  })
  return { error, session: data?.session || null }
}

export async function signIn(email, password) {
  const { data, error } = await client.auth.signInWithPassword({ email, password })
  return { error, user: data?.user || null }
}

export async function signOut() {
  try { await client.auth.signOut() } catch { /* sem conexão: a sessão local é descartada mesmo assim */ }
}

export function onSignedOut(callback) {
  const { data } = client.auth.onAuthStateChange((event) => { if (event === 'SIGNED_OUT') callback() })
  return () => data?.subscription?.unsubscribe()
}

// ---------- Perfis ----------
const PROFILE_COLUMNS = 'id,email,role,athlete_num,name,data'

export async function fetchOwnProfile(uid) {
  const own = await client.from('profiles').select(PROFILE_COLUMNS).eq('id', uid).maybeSingle()
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

// ---------- Conversas ----------
export async function fetchMessages() {
  const { data, error } = await client
    .from('messages')
    .select('id,athlete_id,staff_id,sender_id,body,created_at')
    .order('created_at', { ascending: true })
    .limit(2000)
  if (error) throw error
  return data || []
}

export async function sendMessage({ athleteId, staffId, senderId, body }) {
  const { data, error } = await client
    .from('messages')
    .insert({ athlete_id: athleteId, staff_id: staffId, sender_id: senderId, body })
    .select('id,athlete_id,staff_id,sender_id,body,created_at')
    .single()
  return { row: data || null, error }
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

// Recebe novas mensagens em tempo real (o banco só entrega as conversas de que o usuário participa).
export function subscribeMessages(uid, onInsert) {
  const channel = client
    .channel('messages-' + uid)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => onInsert(payload.new))
    .subscribe()
  return () => { try { client.removeChannel(channel) } catch { /* já removido */ } }
}
