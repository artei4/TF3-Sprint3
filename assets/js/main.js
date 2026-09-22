import {
  validCPF as validateCPF,
  maskCPF as formatCPF,
  getAgeFromBirth,
  getCategoryFromAge,
  validBirthDate,
  normalizeEmail,
} from './validation.js'
import { filterAthletes } from './filters.js'
import { toggleFavorite, registerVote, removeVote, hasVoted } from './feed.js'
import { LANGS, getLang, setLang, t } from './i18n.js'
import {
  FEET,
  STRENGTHS,
  criteriaForPosition,
  statsForPosition,
  weightLevel,
  computeFinalScore,
  MAX_ADJUSTMENT,
  percent,
  validateStats,
} from './evaluation.js'
import { threadKey, searchConversations } from './messages.js'
import {
  remote,
  initRemote,
  describeError,
  getSessionUser,
  signUp as remoteSignUp,
  signIn as remoteSignIn,
  requestPasswordReset,
  updatePassword,
  signOut as remoteSignOut,
  onSignedOut,
  fetchOwnProfile,
  listDirectory,
  updateOwnProfile,
  fetchMessages,
  sendMessage as remoteSendMessage,
  subscribeMessages,
  fetchEvaluations,
  createEvaluation,
  removeEvaluation,
} from './remote.js'

const app = document.querySelector('#app')

const POSITIONS = ['Goleiro', 'Zagueiro', 'Lateral', 'Volante', 'Meia', 'Ponta', 'Atacante']
const GENDERS = ['Masculino', 'Feminino', 'Prefiro não informar']
const AVATAR_COLORS = [
  'from-amber-400 to-yellow-200', 'from-sky-400 to-cyan-200', 'from-violet-400 to-fuchsia-200',
  'from-emerald-400 to-lime-200', 'from-orange-400 to-amber-200', 'from-rose-400 to-pink-200',
]
const LEGACY_EMAIL_DOMAIN = 'academiapelé.com'
const DEMO_STAFF = [
  { email: 'funcionario@academiapele.com', name: 'Marina Lopes', position: 'Olheira', phone: '(11) 99999-0000' },
  { email: 'treinador@academiapele.com', name: 'Bruno Martins', position: 'Treinador', phone: '(11) 99999-1111' },
]

const defaultProfile = {
  name: 'Gabriel Martins',
  cpf: '',
  birth: '2008-03-14',
  gender: 'Masculino',
  foot: 'Destro',
  email: 'gabriel@academiapele.com',
  phone: '(11) 99872-1122',
  pos: 'Atacante',
  secondary: 'Ponta',
  city: 'São Paulo',
  state: 'SP',
  address: 'Av. Ipiranga',
  number: '1200',
  district: 'República',
  zip: '01046-010',
}

const defaultAthletes = [
  { id: 1, foot: 'Destro', email: 'gabriel@academiapele.com', name: 'Gabriel Martins', age: 18, birth: '2008-03-14', gender: 'Masculino', city: 'São Paulo', state: 'SP', pos: 'Atacante', secondary: 'Ponta', rating: 8.8, votes: 128, status: 'Em observação', color: 'from-amber-400 to-yellow-200', tags: ['Finalização', 'Velocidade', 'Drible'] },
  { id: 2, foot: 'Canhoto', name: 'Lucas Ferreira', age: 19, birth: '2007-07-20', gender: 'Masculino', city: 'Osasco', state: 'SP', pos: 'Meia', secondary: 'Volante', rating: 8.4, votes: 94, status: 'Disponível', color: 'from-sky-400 to-cyan-200', tags: ['Passe', 'Visão de jogo', 'Resistência'] },
  { id: 3, foot: 'Destro', name: 'Rafael Souza', age: 17, birth: '2009-01-22', gender: 'Masculino', city: 'Guarulhos', state: 'SP', pos: 'Zagueiro', secondary: 'Lateral', rating: 8.1, votes: 76, status: 'Em avaliação', color: 'from-violet-400 to-fuchsia-200', tags: ['Marcação', 'Força', 'Cabeceio'] },
  { id: 4, foot: 'Destro', name: 'João Vitor', age: 18, birth: '2008-10-11', gender: 'Masculino', city: 'Campinas', state: 'SP', pos: 'Volante', secondary: 'Meia', rating: 8.6, votes: 111, status: 'Destaque', color: 'from-emerald-400 to-lime-200', tags: ['Desarme', 'Passe', 'Leitura'] },
  { id: 5, foot: 'Destro', name: 'Pedro Henrique', age: 20, birth: '2006-05-05', gender: 'Masculino', city: 'Santos', state: 'SP', pos: 'Goleiro', secondary: '—', rating: 8.0, votes: 62, status: 'Disponível', color: 'from-slate-300 to-slate-100', tags: ['Reflexo', 'Posicionamento', 'Saída'] },
  { id: 6, foot: 'Canhoto', name: 'Matheus Alves', age: 18, birth: '2008-12-02', gender: 'Masculino', city: 'Sorocaba', state: 'SP', pos: 'Ponta', secondary: 'Atacante', rating: 8.7, votes: 103, status: 'Destaque', color: 'from-orange-400 to-amber-200', tags: ['Velocidade', 'Drible', 'Cruzamento'] },
]

const defaultTryouts = [
  { id: 1, title: 'Peneira Sub-20 — Atacantes', date: '2026-09-24', time: '14:00', city: 'São Paulo', state: 'SP', location: 'Centro de Treinamento Pelé', category: 'Sub-20', positions: ['Atacante', 'Ponta'], seats: 12, enrolled: ['gabriel@academiapele.com'] },
  { id: 2, title: 'Avaliação Sub-20 — Meio-campo', date: '2026-09-28', time: '09:00', city: 'Osasco', state: 'SP', location: 'Arena Oeste', category: 'Sub-20', positions: ['Meia', 'Volante'], seats: 18, enrolled: [] },
  { id: 3, title: 'Goleiros em Destaque', date: '2026-10-04', time: '10:30', city: 'Barueri', state: 'SP', location: 'Centro de Treinamento Oeste', category: 'Sub-20', positions: ['Goleiro'], seats: 8, enrolled: [] },
]

const state = {
  athletes: defaultAthletes,
  filteredAthletes: defaultAthletes,
  user: readStorage('ap_user', null),
  accounts: readStorage('ap_accounts', []),
  favorites: readStorage('ap_favorites', []),
  votes: readStorage('ap_votes', {}),
  voted: readStorage('ap_voted', {}),
  messages: readStorage('ap_messages', []),
  profile: readStorage('ap_profile', null),
  tryouts: readStorage('ap_tryouts', defaultTryouts),
  reviews: readStorage('ap_reviews', {}),
  notifications: readStorage('ap_notifications', []),
  lastRead: readStorage('ap_lastread', {}),
}

let activeThread = null
let lastRoute = null
let notificationSeq = 0
let activeThreadKey = null
let activeConversation = null
let mobileChatOpen = false
let openChatOnArrive = false
let booted = false
let passwordRecovery = false
let stopMessages = null
let stopAuthWatch = null
let lastRemoteRefresh = 0

migrateLegacyStorage()
seedDemoAccounts()
syncAthletes()

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

function migrateLegacyStorage(){
  // e-mails antigos com acento (academiapelé.com) -> ASCII
  const fixEmail = (email) => (typeof email === 'string' ? email.replace(LEGACY_EMAIL_DOMAIN, 'academiapele.com') : email)
  if (state.user) state.user.email = fixEmail(state.user.email)
  state.accounts = (Array.isArray(state.accounts) ? state.accounts : []).map((account) => ({
    ...account,
    email: fixEmail(account.email),
    profile: account.profile ? { ...account.profile, email: fixEmail(account.profile.email) } : account.profile,
  }))
  if (state.profile) state.profile.email = fixEmail(state.profile.email)
  // cada conta de jogador precisa de um athleteId para aparecer no banco de atletas
  let seq = Date.now()
  state.accounts.forEach((account) => {
    if (account.role === 'player' && !account.athleteId) {
      account.athleteId = account.email === 'gabriel@academiapele.com' ? 1 : ++seq
    }
  })
  // notificações antigas eram globais (sem destinatário); agora cada aviso pertence a um usuário
  state.notifications = (Array.isArray(state.notifications) ? state.notifications : []).filter((n) => n.to).map((n) => ({ ...n, to: fixEmail(n.to) }))
  // mensagens antigas não tinham remetente definido por papel
  state.messages = (Array.isArray(state.messages) ? state.messages : []).filter((m) => m.senderRole)

  if(state.profile?.birth && /^\d{2}\/\d{2}\/\d{4}$/.test(state.profile.birth)){
    const parts=state.profile.birth.split('/')
    state.profile.birth=parts[2]+'-'+parts[1]+'-'+parts[0]
  }
  state.tryouts=(state.tryouts || defaultTryouts).map((tryout)=>({
    ...tryout,
    enrolled:Array.isArray(tryout.enrolled) ? tryout.enrolled.map(fixEmail) : [],
    positions:Array.isArray(tryout.positions) ? tryout.positions : POSITIONS.slice(-1),
    category:tryout.category || 'Sub-20',
    location:tryout.location || String(tryout.city || 'Local não informado').split(' - ')[0],
    state:tryout.state || 'SP',
  }))
}

function persist() {
  // Com o Supabase ativo, sessão, contas e mensagens vivem no servidor (nada disso é guardado no navegador).
  if (!remote.enabled) {
    localStorage.setItem('ap_user', JSON.stringify(state.user))
    localStorage.setItem('ap_accounts', JSON.stringify(state.accounts))
    localStorage.setItem('ap_profile', JSON.stringify(state.profile))
    localStorage.setItem('ap_messages', JSON.stringify(state.messages))
  }
  localStorage.setItem('ap_favorites', JSON.stringify(state.favorites))
  localStorage.setItem('ap_votes', JSON.stringify(state.votes))
  localStorage.setItem('ap_voted', JSON.stringify(state.voted))
  localStorage.setItem('ap_tryouts', JSON.stringify(state.tryouts))
  localStorage.setItem('ap_reviews', JSON.stringify(state.reviews))
  localStorage.setItem('ap_notifications', JSON.stringify(state.notifications))
}

// Cria um aviso para um usuário específico (identificado pelo e-mail).
function notify(to, title, text) {
  if (!to) return
  state.notifications.unshift({ id: Date.now() * 1000 + (notificationSeq++ % 1000), to, title, text, time: 'Agora' })
}

function myNotifications() {
  return state.notifications.filter((n) => n.to === state.user?.email)
}

// Quem deve saber de mudanças numa peneira: quem a criou (ou todos os funcionários, nas peneiras de exemplo).
function notifyTryoutStaff(tryout, title, text) {
  const recipients = tryout.createdBy
    ? [tryout.createdBy]
    : state.accounts.filter((account) => account.role === 'staff').map((account) => account.email)
  recipients.forEach((email) => notify(email, title, text))
}

function updateNotificationBadge() {
  const badge = document.querySelector('#notif-badge')
  if (!badge) return
  const count = myNotifications().length
  badge.textContent = count > 9 ? '9+' : String(count)
  badge.style.display = count ? 'grid' : 'none'
}

function seedDemoAccounts() {
  DEMO_STAFF.forEach((demo) => {
    if (!state.accounts.some((account) => account.email === demo.email)) {
      state.accounts.push({
        email: demo.email,
        password: 'Academia123!',
        role: 'staff',
        profile: { name: demo.name, email: demo.email, phone: demo.phone, position: demo.position, city: 'São Paulo', state: 'SP' },
      })
    }
  })
  if (!state.accounts.some((account) => account.email === 'gabriel@academiapele.com')) {
    const profile = { ...defaultProfile, email: 'gabriel@academiapele.com', cpf: '11144477735' }
    state.accounts.push({ email: profile.email, password: 'Demo123!', role: 'player', cpf: profile.cpf, athleteId: 1, profile })
    notify(profile.email, 'Perfil visualizado', 'Um profissional visualizou seu perfil.')
    notify(profile.email, 'Nova oportunidade', 'Há uma peneira compatível com sua posição.')
  }
  persist()
}

function athleteFieldsFromProfile(profile = {}) {
  const age = getAgeFromBirth(profile.birth)
  return {
    name: profile.name,
    birth: profile.birth,
    gender: profile.gender,
    foot: profile.foot,
    city: profile.city,
    state: profile.state,
    pos: profile.pos,
    secondary: profile.secondary || '—',
    age: Number.isFinite(age) ? age : 0,
  }
}

// Banco de atletas = atletas de exemplo + todas as contas de jogador cadastradas.
function syncAthletes() {
  const players = state.accounts.filter((account) => account.role === 'player' && account.athleteId && account.profile)
  const byId = new Map(players.map((account) => [account.athleteId, account]))
  // Com o Supabase, um atleta de exemplo com o mesmo e-mail de uma conta real é substituído pela conta real.
  const realEmails = new Set(players.filter((account) => account.uid).map((account) => account.email))
  const base = defaultAthletes.filter((athlete) => !(athlete.email && realEmails.has(athlete.email))).map((athlete) => {
    const account = byId.get(athlete.id)
    return account ? { ...athlete, ...athleteFieldsFromProfile(account.profile) } : { ...athlete }
  })
  const registered = players
    .filter((account) => !defaultAthletes.some((athlete) => athlete.id === account.athleteId))
    .map((account, index) => ({
      id: account.athleteId,
      profileId: account.uid,
      email: account.email,
      ...athleteFieldsFromProfile(account.profile),
      rating: 0,
      votes: 0,
      status: 'Novo cadastro',
      color: AVATAR_COLORS[index % AVATAR_COLORS.length],
      tags: [account.profile.pos, account.profile.secondary].filter((item) => item && item !== '—'),
    }))
  state.athletes = base.concat(registered)
  state.filteredAthletes = state.athletes
}

// =====================================================================================
// Conversas: identidade, não lidas, tempo real (Supabase) e layout do celular
// =====================================================================================
const isMobileView = () => window.matchMedia('(max-width: 767px)').matches
const myRole = () => (state.user?.role === 'staff' ? 'staff' : 'player')
const timeLocale = () => 'pt-BR'

function fmtClock(ts) {
  return ts ? new Date(ts).toLocaleTimeString(timeLocale(), { hour: '2-digit', minute: '2-digit' }) : ''
}

function fmtListTime(ts) {
  if (!ts) return ''
  const date = new Date(ts)
  const today = new Date()
  return date.toDateString() === today.toDateString()
    ? fmtClock(ts)
    : date.toLocaleDateString(timeLocale(), { day: '2-digit', month: '2-digit' })
}

// Cada conversa é o par (atleta, funcionário). `key` é o mesmo para as duas pontas.
function getConversations() {
  if (!state.user) return []
  const staff = state.user.role === 'staff'
  if (staff) {
    return state.athletes
      .filter((a) => !remote.enabled || a.profileId)
      .map((a) => ({
        id: String(a.id),
        name: a.name,
        subtitle: a.pos + ' • ' + a.city,
        avatar: a.name,
        key: remote.enabled ? threadKey(a.profileId, state.user.uid) : threadKey(a.id, state.user.email),
        athleteRef: a.profileId,
        staffRef: state.user.uid,
      }))
  }
  const me = getCurrentAthlete()
  if (!remote.enabled && !me) return []
  return state.accounts.filter((a) => a.role === 'staff').map((a) => ({
    id: remote.enabled ? a.uid : a.email,
    name: a.profile?.name || a.email,
    subtitle: (a.profile?.position || 'Profissional') + ' • ' + (a.profile?.city || 'Academia Pelé'),
    avatar: a.profile?.name || a.email,
    key: remote.enabled ? threadKey(state.user.uid, a.uid) : threadKey(me.id, a.email),
    athleteRef: state.user.uid,
    staffRef: a.uid,
  }))
}

const messageTs = (message) => Number(message.ts) || Number(message.id) || 0
const lastMessageOf = (key) => state.messages.filter((m) => m.thread === key).reduce((last, m) => (!last || messageTs(m) >= messageTs(last) ? m : last), null)

function unreadCount(key) {
  const readUntil = state.lastRead[key] || 0
  return state.messages.filter((m) => m.thread === key && m.senderRole !== myRole() && !m.pending && messageTs(m) > readUntil).length
}

function markRead(key) {
  const last = lastMessageOf(key)
  if (!last || messageTs(last) <= (state.lastRead[key] || 0)) return
  state.lastRead[key] = messageTs(last)
  localStorage.setItem('ap_lastread', JSON.stringify(state.lastRead))
}

// Na primeira vez que o usuário entra, tudo o que já existe conta como lido (evita "50 não lidas" de uma vez).
function ensureReadBaseline(tag) {
  const flag = '__init:' + tag
  if (state.lastRead[flag]) return
  state.messages.forEach((m) => {
    state.lastRead[m.thread] = Math.max(state.lastRead[m.thread] || 0, messageTs(m))
  })
  state.lastRead[flag] = 1
  localStorage.setItem('ap_lastread', JSON.stringify(state.lastRead))
}

function updateMessageBadge() {
  const badge = document.querySelector('#msg-badge')
  if (!badge) return
  const total = getConversations().reduce((sum, c) => sum + unreadCount(c.key), 0)
  badge.textContent = total > 9 ? '9+' : String(total)
  badge.style.display = total ? 'grid' : 'none'
}

function messageBubble(message, role) {
  const mine = message.senderRole === role
  return '<div class="flex ' + (mine ? 'justify-end' : '') + '" data-msg-id="' + escapeHtml(message.id) + '"><div class="max-w-[78%] rounded-2xl ' + (mine ? 'rounded-br-md bg-[#d8af58] text-black' : 'rounded-bl-md border border-white/8 bg-white/[.045] text-white') + (message.pending ? ' opacity-60' : '') + ' px-4 py-3 text-sm leading-6"><p class="whitespace-pre-wrap break-words" translate="no">' + escapeHtml(message.text) + '</p><p class="mt-1 text-[10px] opacity-50">' + escapeHtml(fmtClock(messageTs(message)) || message.time || '') + '</p></div></div>'
}

function appendBubble(message) {
  const box = document.querySelector('#chat-messages')
  if (!box) return
  box.querySelector('[data-empty-chat]')?.remove()
  box.insertAdjacentHTML('beforeend', messageBubble(message, myRole()))
  box.scrollTop = box.scrollHeight
}

function markBubbleSent(oldId, message) {
  const bubble = document.querySelector('[data-msg-id="' + oldId + '"]')
  if (!bubble) return
  bubble.setAttribute('data-msg-id', message.id)
  bubble.firstElementChild?.classList.remove('opacity-60')
}

function conversationItemsHtml(conversations, selectedId) {
  const role = myRole()
  return conversations.map((c) => {
    const last = lastMessageOf(c.key)
    const unread = c.id === selectedId && (!isMobileView() || mobileChatOpen) ? 0 : unreadCount(c.key)
    return '<button type="button" class="conversation-item ' + (c.id === selectedId ? 'selected' : '') + '" data-thread="' + escapeHtml(c.id) + '" data-name="' + escapeHtml(c.name) + '" data-subtitle="' + escapeHtml(c.subtitle) + '">' +
      '<span class="avatar">' + avatar(c.avatar) + '</span>' +
      '<span class="min-w-0 flex-1 text-left"><strong class="block truncate">' + escapeHtml(c.name) + '</strong>' +
      '<small class="conv-sub block truncate text-white/35">' + escapeHtml(c.subtitle) + '</small>' +
      '<small class="conv-preview truncate text-white/45">' + (last ? (last.senderRole === role ? '<span>Você: </span>' : '') + '<span translate="no">' + escapeHtml(last.text) + '</span>' : '<span>' + escapeHtml(c.subtitle) + '</span>') + '</small></span>' +
      '<span class="conv-meta">' + (last ? '<time class="conv-time">' + escapeHtml(fmtListTime(messageTs(last))) + '</time>' : '') + (unread ? '<b class="conv-unread">' + unread + '</b>' : '') + '</span></button>'
  }).join('') + '<p id="conversation-empty" class="p-4 text-center text-xs text-white/35" hidden>Nenhum resultado encontrado.</p>'
}

function bindConversationItems() {
  document.querySelectorAll('[data-thread]').forEach((button) => button.addEventListener('click', () => {
    activeThread = button.dataset.thread
    if (isMobileView()) {
      mobileChatOpen = true
      history.pushState({ apChat: true }, '')
    }
    render()
  }))
}

// Atualiza só a lista de contatos (mantém o texto digitado na pesquisa e na mensagem).
function updateConversationList() {
  const list = document.querySelector('#conversation-list')
  if (!list) return
  list.innerHTML = conversationItemsHtml(getConversations(), activeThread)
  bindConversationItems()
  document.querySelector('#conversation-search')?.dispatchEvent(new Event('input'))
}

function closeMobileChat() {
  if (history.state?.apChat) history.back()
  else {
    mobileChatOpen = false
    render()
  }
}

// ---------- envio e recebimento ----------
async function sendChatMessage(text) {
  const conversation = activeConversation
  if (!conversation) return false
  const role = myRole()
  if (!remote.enabled) {
    const message = { id: Date.now(), thread: conversation.key, senderRole: role, text, ts: Date.now() }
    state.messages.push(message)
    persist()
    appendBubble(message)
    markRead(conversation.key)
    return true
  }
  const temp = { id: 'tmp-' + Date.now() + Math.random().toString(36).slice(2, 6), thread: conversation.key, senderRole: role, text, ts: Date.now(), pending: true }
  state.messages.push(temp)
  appendBubble(temp)
  const { row, error } = await remoteSendMessage({ athleteId: conversation.athleteRef, staffId: conversation.staffRef, senderId: state.user.uid, body: text })
  if (error || !row) {
    state.messages = state.messages.filter((m) => m.id !== temp.id)
    document.querySelector('[data-msg-id="' + temp.id + '"]')?.remove()
    toast('Não foi possível enviar a mensagem. Tente novamente.', 'error')
    return false
  }
  const real = mapRemoteMessage(row)
  const index = state.messages.findIndex((m) => m.id === temp.id)
  if (state.messages.some((m) => m.id === real.id)) {
    state.messages = state.messages.filter((m) => m.id !== temp.id) // o "eco" em tempo real já chegou
  } else if (index >= 0) {
    state.messages[index] = real
  }
  markBubbleSent(temp.id, real)
  markRead(conversation.key)
  return true
}

function mapRemoteMessage(row) {
  return {
    id: 'r' + row.id,
    thread: row.athlete_id + '::' + row.staff_id,
    senderRole: row.sender_id === row.athlete_id ? 'player' : 'staff',
    text: row.body,
    ts: Date.parse(row.created_at),
  }
}

// Adiciona a mensagem ao estado. Se ela é a versão definitiva de uma mensagem "enviando...", troca a temporária.
function ingestMessage(message) {
  if (state.messages.some((m) => m.id === message.id)) return { added: false }
  const pendingIndex = state.messages.findIndex((m) => m.pending && m.thread === message.thread && m.senderRole === message.senderRole && m.text === message.text)
  if (pendingIndex >= 0) {
    const replacedId = state.messages[pendingIndex].id
    state.messages[pendingIndex] = message
    return { added: true, replacedId }
  }
  state.messages.push(message)
  return { added: true }
}

function showIncoming(message, fromSelf) {
  const viewing = currentRoute() === 'messages' && activeThreadKey === message.thread && (!isMobileView() || mobileChatOpen)
  if (viewing) {
    appendBubble(message)
    markRead(message.thread)
    return
  }
  if (!fromSelf) {
    const name = getConversations().find((c) => c.key === message.thread)?.name
    toast('Nova mensagem' + (name ? ' de ' + name : '') + '.')
  }
  updateMessageBadge()
  if (currentRoute() === 'messages') updateConversationList()
}

function onRemoteInsert(row) {
  const message = mapRemoteMessage(row)
  const { added, replacedId } = ingestMessage(message)
  if (!added) return
  if (replacedId) {
    markBubbleSent(replacedId, message)
    return
  }
  showIncoming(message, message.senderRole === myRole())
}

// ---------- sessão remota (Supabase) ----------
function remoteAccount(row) {
  return {
    email: row.email,
    role: row.role,
    athleteId: Number(row.athlete_num),
    uid: row.id,
    profile: { ...(row.data || {}), name: row.name, email: row.email },
  }
}

async function hydrateRemote(uid) {
  const own = await fetchOwnProfile(uid)
  if (!own.profile) throw new Error('perfil não encontrado')
  const directory = await listDirectory(own.profile.role)
  const ownAccount = remoteAccount(own.profile)
  ownAccount.profile = { ...ownAccount.profile, ...own.private }
  state.accounts = [ownAccount].concat(directory.map(remoteAccount))
  state.user = { name: own.profile.name, email: own.profile.email, role: own.profile.role, uid }
  state.profile = own.profile.role === 'player' ? ownAccount.profile : null
  state.messages = (await fetchMessages()).map(mapRemoteMessage)
  ensureReadBaseline(uid)
  stopMessages?.()
  stopMessages = subscribeMessages(uid, onRemoteInsert)
  stopAuthWatch?.()
  stopAuthWatch = onSignedOut(() => { if (state.user && remote.enabled) clearRemoteSession({ navigate: true, signOut: false }) })
  lastRemoteRefresh = Date.now()
  syncAthletes()
  try {
    await refreshRemoteEvaluations()
  } catch (error) {
    // A conta deve conseguir entrar mesmo antes de a migration de avaliações
    // ser aplicada; a sincronização será tentada novamente na próxima atualização.
    console.warn('[Supabase] não foi possível carregar avaliações:', error)
  }
}

function mapRemoteEvaluation(row) {
  const athlete = state.athletes.find((item) => item.profileId === row.athlete_id)
  if (!athlete) return null
  return {
    id: 'r' + row.id,
    author: row.evaluator?.name || state.accounts.find((account) => account.uid === row.evaluator_id)?.profile?.name || 'Olheiro',
    authorEmail: row.evaluator?.email || state.accounts.find((account) => account.uid === row.evaluator_id)?.email,
    position: row.position,
    ratings: row.ratings || {},
    rating: Number(row.rating).toFixed(1),
    baseRating: Number(row.base_rating),
    adjustment: Number(row.adjustment || 0),
    stats: row.stats || {},
    strengths: Array.isArray(row.strengths) ? row.strengths : [],
    comment: row.comment,
    date: row.created_at ? new Date(row.created_at).toLocaleDateString('pt-BR') : 'Agora',
  }
}

async function refreshRemoteEvaluations() {
  if (!remote.enabled) return
  const rows = await fetchEvaluations()
  const reviews = {}
  rows.forEach((row) => {
    const review = mapRemoteEvaluation(row)
    const athlete = state.athletes.find((item) => item.profileId === row.athlete_id)
    if (review && athlete) (reviews[athlete.id] ||= []).push(review)
  })
  state.reviews = reviews
  persist()
}

async function clearRemoteSession({ navigate = false, signOut = true } = {}) {
  stopMessages?.()
  stopAuthWatch?.()
  stopMessages = null
  stopAuthWatch = null
  if (signOut) await remoteSignOut()
  state.user = null
  state.profile = null
  state.accounts = []
  state.messages = []
  activeThread = null
  activeConversation = null
  activeThreadKey = null
  mobileChatOpen = false
  syncAthletes()
  if (navigate) {
    if (currentRoute() === 'login') render()
    else go('login')
  }
}

// Atualiza a lista de pessoas (novos cadastros) e busca mensagens perdidas (ex.: celular em segundo plano).
async function refreshRemote(force = false) {
  if (!remote.enabled || !state.user?.uid) return
  if (!force && Date.now() - lastRemoteRefresh < 15000) return
  lastRemoteRefresh = Date.now()
  try {
    const directory = await listDirectory(state.user.role)
    const own = state.accounts.find((account) => account.uid === state.user.uid)
    const before = state.athletes.length
    state.accounts = (own ? [own] : []).concat(directory.map(remoteAccount))
    syncAthletes()
    const known = new Set(state.messages.map((m) => m.id))
    const missed = (await fetchMessages()).map(mapRemoteMessage).filter((m) => !known.has(m.id))
    missed.forEach((message) => {
      if (ingestMessage(message).added) showIncoming(message, message.senderRole === myRole())
    })
    await refreshRemoteEvaluations()
    const route = currentRoute()
    if (state.athletes.length !== before) {
      if (route === 'athletes') applyFilters()
      else if (route === 'dashboard') render()
      else if (route === 'messages') updateConversationList()
    }
  } catch (error) {
    console.warn('[Supabase] não foi possível atualizar:', error)
  }
}

// Nota exibida do atleta: média das avaliações registradas (se houver) ou a nota inicial.
function ratingOf(athlete) {
  const scores = (state.reviews[athlete.id] || []).map((review) => Number(review.rating)).filter(Number.isFinite)
  if (scores.length) return scores.reduce((sum, value) => sum + value, 0) / scores.length
  return Number(athlete.rating) || 0
}

function footTag(foot) {
  if (!foot) return ''
  return tag(foot === 'Destro' ? 'Perna direita' : foot === 'Canhoto' ? 'Perna esquerda' : 'Ambidestro', true)
}

function formatRating(value) {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? number.toFixed(1) : '—'
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function icon(name, cls = 'size-5') {
  const paths = {
    home: '<path d="m3 10 9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    user: '<circle cx="12" cy="7" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    message: '<path d="M20 11.5a7.5 7.5 0 0 1-8 7.5H6l-3 2v-5a7.5 7.5 0 1 1 17-4.5Z"/>',
    calendar: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.2 6.4 20l1.1-6.2L3 9.6l6.2-.9z"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path stroke-linecap="round" d="M3 12h18M12 3c2.5 2.6 3.8 5.8 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.8-3.8-9s1.3-6.4 3.8-9Z"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    pin: '<path d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z"/><circle cx="12" cy="9" r="2.5"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
    logout: '<path d="M10 17l5-5-5-5M15 12H3M21 19V5a2 2 0 0 0-2-2h-4"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
    heart: '<path d="M20.8 8.8c0 5.5-8.8 10.7-8.8 10.7S3.2 14.3 3.2 8.8A4.8 4.8 0 0 1 12 6a4.8 4.8 0 0 1 8.8 2.8Z"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  }
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="' + cls + '" aria-hidden="true">' + (paths[name] || '') + '</svg>'
}

function avatar(name = 'Atleta') {
  return escapeHtml(name.split(' ').map((x) => x[0]).slice(0, 2).join('').toUpperCase())
}

function go(route) {
  const normalized = String(route || 'dashboard').replace(/^#\/?/, '')
  location.hash = '/' + normalized
}

function currentRoute() {
  if (new URLSearchParams(location.search).get('reset') === '1') return 'reset-password'
  const raw = location.hash.replace(/^#\/?/, '')
  return raw || (state.user ? 'dashboard' : 'login')
}

function toast(message, type = 'success') {
  let root = document.querySelector('#toast-root')
  if (!root) {
    root = document.createElement('div')
    root.id = 'toast-root'
    root.className = 'fixed bottom-5 right-5 z-[120] flex w-[min(92vw,380px)] flex-col gap-2'
    document.body.appendChild(root)
  }
  const el = document.createElement('div')
  el.className = 'pointer-events-auto flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm shadow-2xl backdrop-blur-xl ' +
    (type === 'error'
      ? 'border-rose-400/30 bg-rose-500/15 text-rose-100'
      : 'border-amber-300/30 bg-emerald-500/15 text-white')
  el.innerHTML = icon(type === 'error' ? 'close' : 'check', 'size-4') + '<span>' + escapeHtml(message) + '</span>'
  root.appendChild(el)
  window.setTimeout(() => el.remove(), 2800)
}

function shell(content, options = {}) {
  const role = options.role || 'player'
  const active = options.active || 'dashboard'
  const nav = role === 'staff'
    ? [['dashboard', t('Visão geral'), 'home'], ['athletes', t('Atletas'), 'search'], ['tryouts', t('Peneiras'), 'calendar'], ['messages', t('Conversas'), 'message']]
    : [['dashboard', t('Início'), 'home'], ['profile', t('Meu perfil'), 'user'], ['tryouts', t('Peneiras'), 'calendar'], ['messages', t('Conversas'), 'message']]

  return '<div class="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(208,169,72,.12),_transparent_26%),#090909] text-white">' +
    '<header class="sticky top-0 z-40 border-b border-white/8 bg-[#090909]/90 backdrop-blur-xl">' +
    '<div class="mx-auto flex min-h-[4.5rem] max-w-[1440px] items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-10">' +
    '<button type="button" class="flex items-center gap-3" data-action="home" aria-label="Ir para o início">' +
    '<img src="./assets/brand/simbolo.jpg" alt="Academia Pelé" class="h-11 w-11 rounded-xl object-contain bg-black ring-1 ring-white/10" />' +
    '<div class="hidden sm:block text-left"><p class="text-sm font-black uppercase tracking-[.28em] text-[#e1bb62]">Academia Pelé</p><p class="text-[11px] text-white/40">Plataforma de talentos</p></div></button>' +
    '<nav class="hidden md:flex items-center gap-1" aria-label="Navegação principal">' +
    nav.map((item) => '<button type="button" data-route="' + item[0] + '" class="nav-link ' + (active === item[0] ? 'active' : '') + '">' + icon(item[2], 'size-4') + item[1] + '</button>').join('') +
    '</nav>' +
    '<div class="flex items-center gap-2">' +
    '<button type="button" class="icon-button relative" data-route="messages" aria-label="Conversas">' + icon('message') + '<span id="msg-badge" class="absolute -right-1 -top-1 min-w-[1.1rem] place-items-center rounded-full bg-emerald-500 px-1 text-[10px] font-black leading-[1.1rem] text-white" style="display:none"></span></button>' +
    '<button type="button" class="icon-button" data-action="change-lang" aria-label="Alterar idioma" title="' + t('Alterar idioma') + '">' + icon('globe', 'size-4') + '</button>' +
    '<button type="button" class="icon-button relative" data-action="notifications" aria-label="Abrir notificações">' + icon('bell') + '<span id="notif-badge" class="absolute -right-1 -top-1 min-w-[1.1rem] place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-black leading-[1.1rem] text-white" style="display:' + (myNotifications().length ? 'grid' : 'none') + '">' + (myNotifications().length > 9 ? '9+' : myNotifications().length) + '</span></button>' +
    '<button type="button" class="profile-chip" data-route="profile"><span class="avatar">' + avatar(state.user?.name || 'Atleta') + '</span><span class="hidden lg:block max-w-28 truncate text-sm">' + escapeHtml(state.user?.name || 'Atleta') + '</span></button>' +
    '<button type="button" class="icon-button md:hidden" data-action="menu" aria-label="Abrir menu">' + icon('menu') + '</button>' +
    '</div></div></header>' +
    '<main class="mx-auto max-w-[1440px] px-4 py-5 sm:px-6 lg:px-10 lg:py-8">' + content + '</main>' +
    '<div id="mobile-menu"></div>' +
    '</div>'
}

function stat(value, label, sub) {
  return '<div class="rounded-2xl border border-white/8 bg-white/[.035] p-4"><p class="text-2xl font-black text-[#e6bd62]">' + value + '</p><p class="mt-1 text-sm font-semibold">' + label + '</p><p class="mt-1 text-xs text-white/35">' + sub + '</p></div>'
}

function activity(title, sub, time) {
  return '<div class="flex gap-3"><span class="mt-1 grid size-9 shrink-0 place-items-center rounded-xl bg-[#e1bb62]/10 text-[#e1bb62]">' + icon('check', 'size-4') + '</span><div class="min-w-0"><p class="text-sm font-semibold">' + title + '</p><p class="truncate text-xs text-white/40">' + sub + '</p><p class="mt-1 text-[11px] text-white/25">' + time + '</p></div></div>'
}

function dashboard(role = 'player') {
  return role === 'staff' ? staffDashboard() : playerDashboard()
}

function playerDashboard() {
  const name = escapeHtml(state.user?.name || state.profile?.name || 'Atleta')
  const profile = state.profile || defaultProfile
  const next = state.tryouts.find((t) => {
    const enrolled = Array.isArray(t.enrolled) && t.enrolled.includes(state.user?.email)
    return enrolled
  }) || state.tryouts[0] || { title: t('Nenhuma peneira aberta'), category: '—', date: '', time: '', location: '—', city: '—', state: '', positions: [] }

  return shell(
    '<section class="grid gap-6 xl:grid-cols-[1.55fr_.8fr]">' +
    '<div class="overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,#17130c_0%,#0d0d0d_55%,#18120a_100%)] p-6 shadow-2xl sm:p-8">' +
    '<div class="flex flex-wrap items-center justify-between gap-4"><div><span class="eyebrow">' + t('Painel do atleta') + '</span><h1 class="mt-3 max-w-xl text-3xl font-black leading-tight tracking-tight sm:text-5xl">Olá, ' + name + '. <span class="text-[#e6bd62]">Sua carreira em movimento.</span></h1><p class="mt-4 max-w-2xl text-base leading-7 text-white/55">Acompanhe oportunidades, avaliações e conversas com profissionais da Academia Pelé.</p></div>' +
    '<div class="hidden sm:flex h-28 w-28 items-center justify-center rounded-3xl border border-[#d4ad59]/25 bg-[#d4ad59]/10"><img src="./assets/brand/simbolo.jpg" alt="Logo Academia Pelé" class="h-24 w-24 rounded-2xl object-contain" /></div></div>' +
    '<div class="mt-8 grid gap-3 sm:grid-cols-3">' +
    stat(averagePlayerRating(profile), t('Avaliação média'), 'notas registradas') +
    stat(String(state.tryouts.filter((t) => Array.isArray(t.enrolled) && t.enrolled.includes(state.user?.email)).length).padStart(2, '0'), t('Peneiras inscritas'), 'acompanhe suas vagas') +
    stat(String(myNotifications().length).padStart(2, '0'), t('Notificações'), 'atualizadas recentemente') +
    '</div></div>' +
    '<aside class="rounded-[28px] border border-white/10 bg-white/[.03] p-6"><div class="flex items-center justify-between gap-3"><div><span class="eyebrow">Próxima oportunidade</span><h2 class="mt-2 text-xl font-black">' + escapeHtml(next.title) + '</h2></div><span class="status-dot">' + escapeHtml(next.category || t('Aberta')) + '</span></div>' +
    '<div class="mt-6 space-y-4"><div class="flex gap-3">' + icon('calendar', 'size-5 text-[#e1bb62]') + '<div><p class="text-sm font-semibold">' + formatDate(next.date) + ' • ' + escapeHtml(next.time) + '</p><p class="text-xs text-white/45">' + escapeHtml(next.location) + ' • ' + escapeHtml(next.city) + '/' + escapeHtml(next.state) + '</p></div></div>' +
    '<div class="flex gap-3">' + icon('pin', 'size-5 text-[#e1bb62]') + '<div><p class="text-sm font-semibold">Posições aceitas</p><p class="text-xs text-white/45">' + escapeHtml(next.positions.join(', ')) + '</p></div></div></div>' +
    '<button type="button" class="btn-primary mt-6 w-full" data-route="tryouts">Ver peneiras ' + icon('arrow', 'size-4') + '</button></aside></section>' +
    '<section class="mt-8 grid gap-5 lg:grid-cols-[1.15fr_.85fr]">' +
    '<div class="panel"><div class="flex items-center justify-between"><div><span class="eyebrow">' + t('Meu perfil') + '</span><h2 class="section-title">' + escapeHtml(profile.pos) + ' • ' + escapeHtml(profile.city) + '</h2></div><button type="button" class="btn-ghost" data-route="profile">Editar perfil ' + icon('edit', 'size-4') + '</button></div>' +
    '<div class="mt-5 flex flex-wrap gap-2">' + tag(profile.pos) + tag(profile.secondary, true) + tag(getCategoryFromAge(getAgeFromProfile(profile.birth))) + '</div></div>' +
    '<div class="panel"><div class="flex items-center justify-between"><div><span class="eyebrow">' + t('Minha atividade') + '</span><h2 class="section-title">Últimos movimentos</h2></div>' + icon('arrow', 'size-5 text-white/35') + '</div><div class="mt-5 space-y-4">' +
    activity('Perfil atualizado', 'Seus dados pessoais estão prontos para os profissionais.', 'Agora') +
    activity('Peneiras', 'Confira posições compatíveis com sua categoria.', 'Hoje') +
    activity(t('Mensagens'), 'Responda contatos de treinadores e olheiros.', 'Hoje') +
    '</div></div></section>',
    { active: 'dashboard', role: 'player' },
  )
}

function staffDashboard() {
  return shell(
    '<section class="grid gap-6 xl:grid-cols-[1.55fr_.8fr]">' +
    '<div class="rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,#17130c,#0e0e0e_65%,#1b1408)] p-6 sm:p-8"><span class="eyebrow">' + t('Central do funcionário') + '</span><h1 class="mt-3 text-3xl font-black sm:text-5xl">Encontre atletas, avalie perfis e <span class="text-[#e6bd62]">crie oportunidades.</span></h1><p class="mt-4 max-w-2xl text-white/55">Pesquise o banco, abra o perfil completo do atleta, envie mensagens, registre avaliações e agende peneiras.</p><div class="mt-8 flex flex-wrap gap-3"><button type="button" class="btn-primary" data-route="athletes">' + t('Pesquisar atletas') + ' ' + icon('search', 'size-4') + '</button><button type="button" class="btn-secondary" data-action="openTryout">' + icon('plus', 'size-4') + ' ' + t('Criar peneira') + '</button></div></div>' +
    '<aside class="panel"><span class="eyebrow">' + t('Hoje') + '</span><div class="mt-3 grid grid-cols-2 gap-3">' +
    staffStat(String(state.athletes.length).padStart(2, '0'), t('Atletas ativos')) + staffStat(String(Object.values(state.reviews).filter((list) => Array.isArray(list) && list.length).length).padStart(2, '0'), t('Perfis avaliados')) + staffStat(String(state.tryouts.length).padStart(2, '0'), t('Peneiras')) + staffStat(String(state.messages.filter((m) => String(m.thread).endsWith('::' + state.user?.email)).length).padStart(2, '0'), t('Mensagens')) +
    '</div></aside></section>' +
    '<section class="mt-8 panel"><div class="flex flex-wrap items-end justify-between gap-3"><div><span class="eyebrow">' + t('Seu radar') + '</span><h2 class="section-title">' + t('Atletas para observar') + '</h2></div><button type="button" class="btn-ghost" data-route="athletes">' + t('Abrir banco completo') + ' ' + icon('arrow', 'size-4') + '</button></div><div class="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">' +
    state.athletes.slice(0, 6).map((a) => athleteCard(a, true)).join('') + '</div></section>',
    { active: 'dashboard', role: 'staff' },
  )
}

function staffStat(value, label) {
  return '<div class="rounded-2xl border border-white/8 bg-white/[.03] p-4"><p class="text-2xl font-black">' + value + '</p><p class="mt-1 text-xs text-white/45">' + label + '</p></div>'
}

function athleteCard(a, staff = false) {
  const fav = state.favorites.includes(a.id)
  const count = a.votes + (state.votes[a.id] || 0)
  const reviewCount = (state.reviews[a.id] || []).length
  const voted = hasVoted(state, a.id, state.user?.email || 'anon')

  return '<article class="group rounded-2xl border border-white/8 bg-white/[.03] p-4 transition hover:-translate-y-0.5 hover:border-[#d4ad59]/30 hover:bg-white/[.045]">' +
    '<div class="flex gap-3"><div class="avatar-lg bg-gradient-to-br ' + a.color + '">' + avatar(a.name) + '</div><div class="min-w-0 flex-1"><div class="flex items-start justify-between gap-2"><button type="button" class="min-w-0 text-left" data-open-athlete="' + a.id + '"><h3 class="truncate font-bold">' + escapeHtml(a.name) + '</h3><p class="text-xs text-white/40">' + a.age + ' anos • ' + escapeHtml(a.city) + '/' + escapeHtml(a.state) + '</p></button>' +
    '<button type="button" class="icon-button sm" data-favorite="' + a.id + '" aria-label="' + (fav ? 'Remover dos favoritos' : 'Favoritar') + '">' + icon('heart', 'size-4 ' + (fav ? 'fill-[#e2bb62] text-[#e2bb62]' : '')) + '</button></div>' +
    '<div class="mt-3 flex flex-wrap gap-1.5">' + tag(a.pos) + tag(a.secondary, true) + footTag(a.foot) + tag(getCategoryFromAge(a.age)) + '</div></div></div>' +
    '<div class="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/7 pt-3"><div class="flex items-center gap-2 text-xs text-white/45">' + icon('star', 'size-4 text-[#e2bb62]') + '<strong class="text-white">' + formatRating(ratingOf(a)) + '</strong> média <span>•</span> ' + count + ' votos <span>•</span> ' + reviewCount + ' avaliação(ões)</div>' +
    '<div class="flex gap-2"><button type="button" class="vote-button ' + (voted ? 'voted' : '') + '" data-vote="' + a.id + '" title="' + t(voted ? 'Clique para retirar seu voto' : 'Votar neste atleta') + '">' + t(voted ? 'Retirar voto' : 'Votar') + '</button>' +
    (staff ? '<button type="button" class="btn-secondary px-3 py-2 text-xs" data-message-athlete="' + a.id + '">' + t('Mensagem') + '</button>' : '') +
    '<button type="button" class="btn-ghost px-2" data-open-athlete="' + a.id + '" aria-label="Abrir perfil de ' + escapeHtml(a.name) + '">Ver perfil</button></div></div></article>'
}

function tag(text, ghost = false) {
  const safe = escapeHtml(text || '—')
  return '<span class="tag ' + (ghost ? 'ghost' : '') + '">' + safe + '</span>'
}

function athletesPage() {
  const filters = '<aside class="panel h-max"><div class="flex items-center justify-between"><h2 class="font-bold">Filtros</h2><button type="button" class="text-xs text-[#e2bb62]" data-action="clearFilters">Limpar</button></div>' +
    '<div class="mt-4 space-y-4"><label class="field-label">' + t('Buscar por nome') + '<input id="filter-name" class="field" placeholder="Ex.: Gabriel" /></label>' +
    '<label class="field-label">' + t('Posição principal ou secundária') + '<select id="filter-pos" class="field"><option value="">Todas</option>' + POSITIONS.map((p) => '<option>' + p + '</option>').join('') + '</select></label>' +
    '<label class="field-label">' + t('Perna dominante') + '<select id="filter-foot" class="field"><option value="">Todas</option>' + FEET.map((f) => '<option>' + f + '</option>').join('') + '</select></label>' +
    '<label class="field-label">' + t('Cidade/região') + '<select id="filter-city" class="field"><option value="">Todas</option>' + [...new Set(state.athletes.map((a) => a.city))].sort().map((c) => '<option>' + escapeHtml(c) + '</option>').join('') + '</select></label>' +
    '<label class="field-label">' + t('Idade') + '<select id="filter-age" class="field"><option value="">Todas</option>' + [...new Set(state.athletes.map((a) => a.age))].sort((a,b)=>a-b).map((age) => '<option value="' + age + '">' + age + '</option>').join('') + '</select></label>' +
    '<label class="field-label">' + t('Categoria') + '<select id="filter-category" class="field"><option value="">Todas</option><option>Sub-7</option><option>Sub-9</option><option>Sub-11</option><option>Sub-13</option><option>Sub-15</option><option>Sub-17</option><option>Sub-20</option></select></label>' +
    '</div><div class="mt-6 rounded-2xl border border-[#d4ad59]/15 bg-[#d4ad59]/7 p-4 text-xs leading-5 text-white/55"><strong class="text-[#e2bb62]">Filtro em tempo real</strong><br/>Nome, posição, perna dominante, cidade, idade e categoria alteram a lista sem recarregar.</div></aside>'

  return shell(
    '<div class="flex flex-wrap items-end justify-between gap-4"><div><span class="eyebrow">Banco de talentos</span><h1 class="page-title">' + t('Pesquisar atletas') + '</h1><p class="page-subtitle">Abra o perfil completo, mande uma mensagem, vote e registre uma avaliação.</p></div><button type="button" class="btn-primary" data-action="openTryout">' + icon('plus', 'size-4') + ' Nova peneira</button></div>' +
    '<section class="mt-6 grid gap-5 lg:grid-cols-[280px_1fr]">' +
    filters +
    '<div><div class="mb-4 flex flex-wrap items-center justify-between gap-2"><p id="athlete-count" class="text-sm text-white/45">' + state.athletes.length + ' atletas encontrados</p><button type="button" class="btn-secondary" data-action="export">' + icon('arrow', 'size-4') + ' Exportar seleção</button></div><div id="athlete-grid" class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">' + state.athletes.map((a) => athleteCard(a, true)).join('') + '</div></div></section>',
    { active: 'athletes', role: 'staff' },
  )
}

function profilePage() {
  const role = state.user?.role || 'player'
  if (role === 'staff') {
    const account = state.accounts.find((a) => a.email === state.user.email)
    const profile = account?.profile || { name: state.user.name, email: state.user.email, phone: '', position: t('Funcionário'), city: 'São Paulo', state: 'SP' }
    return shell(
      '<div class="flex flex-wrap items-end justify-between gap-4"><div><span class="eyebrow">' + t('Meu perfil') + '</span><h1 class="page-title">' + escapeHtml(profile.name) + '</h1><p class="page-subtitle">' + t('Dados do funcionário que está conectado.') + '</p></div><button type="button" class="btn-secondary" data-action="logout">' + icon('logout', 'size-4') + ' ' + t('Sair') + '</button></div>' +
      '<section class="mt-6 grid gap-5 md:grid-cols-2"><aside class="panel"><div class="flex items-center gap-4"><div class="avatar-xl">' + avatar(profile.name) + '</div><div><p class="text-xs uppercase tracking-[.2em] text-white/35">' + t('Funcionário') + '</p><h2 class="mt-1 text-2xl font-black">' + escapeHtml(profile.position || t('Profissional')) + '</h2><p class="text-sm text-white/45">' + escapeHtml(profile.city) + '/' + escapeHtml(profile.state) + '</p></div></div></aside><div class="panel"><span class="eyebrow">' + t('Acesso demo') + '</span><h2 class="section-title">' + t('Credenciais de teste') + '</h2><p class="mt-4 text-sm leading-6 text-white/55">'+ t('E-mail de teste') + ': funcionario@academiapele.com<br/>' + t('Senha de teste') + ': Academia123!</p><button type="button" class="btn-primary mt-5" data-route="athletes">'+ t('Ir para o banco de atletas') + ' ' + icon('arrow', 'size-4') + '</button></div></section>',
      { active: 'dashboard', role: 'staff' },
    )
  }

  const p = state.profile || defaultProfile
  const age = getAgeFromProfile(p.birth)
  const category = getCategoryFromAge(age)
  return shell(
    '<div class="flex flex-wrap items-end justify-between gap-4"><div><span class="eyebrow">' + t('Meu perfil') + '</span><h1 class="page-title">' + escapeHtml(p.name) + '</h1><p class="page-subtitle">' + t('Mantenha seus dados pessoais, categoria, cidade e posições atualizados.') + '</p></div><button type="button" class="btn-secondary" data-action="logout">' + icon('logout', 'size-4') + ' ' + t('Sair') + '</button></div>' +
    '<section class="mt-6 grid gap-5 xl:grid-cols-[.75fr_1.25fr]">' +
    '<aside class="panel"><div class="flex items-center gap-4"><div class="avatar-xl">' + avatar(p.name) + '</div><div><p class="text-xs uppercase tracking-[.2em] text-white/35">' + t('Atleta') + '</p><h2 class="mt-1 text-2xl font-black">' + escapeHtml(p.pos) + '</h2><p class="text-sm text-white/45">' + age + ' anos • ' + escapeHtml(category) + '</p></div></div>' +
    '<div class="mt-6 grid grid-cols-2 gap-3">' + stat(averagePlayerRating(p), t('Avaliação'), t('média atual')) + stat(String(state.tryouts.filter((t) => Array.isArray(t.enrolled) && t.enrolled.includes(state.user.email)).length).padStart(2, '0'), t('Peneiras'), t('inscritas')) + stat(String(getPlayerReviewCount()).padStart(2, '0'), t('Avaliações'), t('recebidas')) + stat(String(myNotifications().length).padStart(2, '0'), t('Notificações'), t('recentes')) + '</div>' +
    '<div class="mt-6 flex flex-wrap gap-2">' + tag(t(p.pos)) + tag(t(p.secondary), true) + footTag(t(p.foot)) + tag(t(category)) + tag(p.city) + '</div></aside>' +
    '<div class="panel"><div class="flex items-center justify-between"><div><span class="eyebrow">' + t('Dados do jogador') + '</span><h2 class="section-title">' + t('Atualizar perfil') + '</h2></div>' + icon('edit', 'size-5 text-[#e1bb62]') + '</div>' +
    '<form id="profile-form" class="mt-5 grid gap-4 sm:grid-cols-2">' +
    input(t('Nome completo'), 'profile-name', p.name, 'text', true) +
    input('CPF', 'profile-cpf', p.cpf || '', 'text', false, true) +
    input(t('Data de nascimento'), 'profile-birth', p.birth, 'date', true) +
    input(t('Idade'), 'profile-age', String(age), 'number', false, false, true) +
    '<label class="field-label">Categoria<select id="profile-category" class="field" disabled><option>' + escapeHtml(category) + '</option></select></label>' +
    selectField(t('Gênero'), 'profile-gender', GENDERS, p.gender) +
    input(t('E-mail'), 'profile-email', p.email, 'email', true, remote.enabled) + input(t('Telefone'), 'profile-phone', p.phone, 'tel', true) +
    selectField(t('Posição principal'), 'profile-pos', POSITIONS, p.pos) + selectField(t('Posição secundária'), 'profile-secondary', ['—'].concat(POSITIONS), p.secondary) + selectField(t('Perna dominante'), 'profile-foot', FEET, p.foot || '') +
    '<div class="sm:col-span-2 mt-2 border-t border-white/8 pt-5"><p class="text-sm font-bold">' + t('Endereço') + '</p></div>' +
    input(t('CEP'), 'profile-zip', p.zip, 'text', true) + input(t('Cidade'), 'profile-city', p.city, 'text', true) + input(t('Estado'), 'profile-state', p.state, 'text', true) + input(t('Bairro'), 'profile-district', p.district, 'text', true) +
    input(t('Endereço'), 'profile-address', p.address, 'text', true) + input(t('Número'), 'profile-number', p.number, 'text', true) +
    '<div id="profile-feedback" class="sm:col-span-2 hidden" role="alert"></div><div class="sm:col-span-2 flex justify-end"><button class="btn-primary" type="submit">' + t('Salvar alterações') + ' ' + icon('check', 'size-4') + '</button></div></form></div></section>' +
    '<section class="mt-6 panel"><div class="flex items-center justify-between"><div><span class="eyebrow">' + t('Olheiros') + '</span><h2 class="section-title">' + t('Comentários e notas') + '</h2><p class="mt-1 text-xs text-white/35">' + t('Notas e estatísticas ficam visíveis apenas para você e para a equipe da Academia.') + '</p></div><span class="tag">' + getPlayerReviewCount() + ' ' + t('registro(s)') + '</span></div><div class="mt-5 grid gap-4 md:grid-cols-2">' + renderPlayerReviews() + '</div></section>',
    { active: 'profile', role: 'player' },
  )
}

function renderPlayerReviews() {
  const profileAthlete = getCurrentAthlete()
  const reviews = state.reviews[profileAthlete?.id] || []
  if (!reviews.length) {
    return '<div class="md:col-span-2 rounded-2xl border border-dashed border-white/10 p-8 text-center text-white/40">'+ t('Ainda não há avaliações registradas para este perfil.') +'</div>'
  }
  return reviews.map(reviewCard).join('')
}

function reviewStatChips(review) {
  const stats = review.stats || {}
  const chips = []
  const add = (label, value) => chips.push('<span class="tag ghost">' + escapeHtml(label) + ' <strong class="text-white">' + escapeHtml(value) + '</strong></span>')
  const has = (key) => stats[key] !== undefined
  if (has('minutos')) add('Minutos', stats.minutos)
  if (has('gols')) add('Gols', stats.gols)
  if (has('assistencias')) add('Assistências', stats.assistencias)
  if (has('finalizacoes') || has('finalizacoesAlvo')) {
    if (has('finalizacoes') && has('finalizacoesAlvo')) add('Finalizações', stats.finalizacoesAlvo + '/' + stats.finalizacoes + ' no alvo')
    else if (has('finalizacoes')) add('Finalizações', stats.finalizacoes)
    else add('Finalizações no alvo', stats.finalizacoesAlvo)
  }
  if (has('passesCertos')) {
    const pct = percent(stats.passesCertos, stats.passesTentados)
    add('Passes', has('passesTentados') ? stats.passesCertos + '/' + stats.passesTentados + (pct !== null ? ' (' + pct + '%)' : '') : stats.passesCertos + ' certos')
  }
  if (has('desarmes')) add('Desarmes', stats.desarmes)
  if (has('defesas')) add('Defesas', stats.defesas)
  if (has('golsSofridos')) add('Gols sofridos', stats.golsSofridos)
  return chips.join('')
}

function reviewCard(review, athleteId = null) {
  const canDelete = athleteId !== null && state.user?.role === 'staff' && review.authorEmail && review.authorEmail === state.user.email
  const criteria = review.ratings && review.position
    ? criteriaForPosition(review.position).filter((c) => review.ratings[c.key] !== undefined && review.ratings[c.key] !== '')
    : []
  return '<article class="rounded-2xl border border-white/8 bg-white/[.025] p-5"><div class="flex items-start justify-between gap-3"><div class="flex items-center gap-3"><span class="avatar">' + avatar(review.author || 'Olheiro') + '</span><div><p class="font-semibold">' + escapeHtml(review.author || 'Olheiro') + '</p><p class="text-xs text-white/35">' + escapeHtml(review.date || 'Agora') + (review.position ? ' • ' + t('como') + ' ' + escapeHtml(review.position) : '') + '</p></div></div>' +
    '<div class="text-center"><div class="rounded-xl border border-[#d4ad59]/20 bg-[#d4ad59]/8 px-3 py-2 text-sm font-black text-[#e2bb62]">' + escapeHtml(String(review.rating).replace('.', ',')) + '</div>' + (criteria.length ? '<p class="mt-1 text-[10px] text-white/30">' + t('nota ponderada') + '</p>' : '') + '</div></div>' +
    (criteria.length ? '<div class="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">' + criteria.map((c) => {
      const value = Number(review.ratings[c.key])
      return '<div><div class="flex justify-between text-[11px] text-white/50"><span>' + escapeHtml(c.label) + '</span><strong class="text-white">' + String(value).replace('.', ',') + '</strong></div><div class="mt-1 h-1 overflow-hidden rounded-full bg-white/8"><div class="h-1 rounded-full bg-[#d4ad59]" style="width:' + Math.max(0, Math.min(100, value * 10)) + '%"></div></div></div>'
    }).join('') + '</div>' : '') +
    (review.baseRating !== undefined && review.adjustment ? '<p class="mt-3 text-[11px] text-white/40">' + t('Nota base') + ' <strong class="text-white">' + String(review.baseRating).replace('.', ',') + '</strong> • ' + t('ajuste por desempenho') + ' <strong class="' + (review.adjustment > 0 ? 'text-emerald-300' : 'text-rose-300') + '">' + (review.adjustment > 0 ? '+' : '') + String(review.adjustment).replace('.', ',') + '</strong></p>' : '') +
    (reviewStatChips(review) ? '<div class="mt-4 flex flex-wrap gap-1.5">' + reviewStatChips(review) + '</div>' : '') +
    (review.strengths && review.strengths.length ? '<div class="mt-3"><p class="text-[10px] font-bold uppercase tracking-[.16em] text-white/30">' + t('Pontos fortes') + '</p><div class="mt-1.5 flex flex-wrap gap-1.5">' + review.strengths.map((item) => tag(item)).join('') + '</div></div>' : '') +
    '<p class="mt-4 text-sm leading-6 text-white/65">“' + escapeHtml(review.comment) + '”</p>' +
    (canDelete ? '<button type="button" class="mt-3 text-xs font-semibold text-rose-300 hover:text-rose-200" data-delete-review="' + review.id + '">Excluir minha avaliação</button>' : '') + '</article>'
}

function tryoutsPage() {
  const role = state.user?.role === 'staff' ? 'staff' : 'player'
  const createButton = role === 'staff' ? '<button type="button" class="btn-primary" data-action="openTryout">' + icon('plus', 'size-4') + ' ' + t('Criar peneira') + '</button>' : ''
  return shell(
    '<div class="flex flex-wrap items-end justify-between gap-4"><div><span class="eyebrow">Calendário</span><h1 class="page-title">' + t('Peneiras') + '</h1><p class="page-subtitle">Veja oportunidades, posições, categoria, vagas e sua inscrição.</p></div>' + createButton + '</div>' +
    '<div class="mt-6 grid gap-4 lg:grid-cols-3">' + state.tryouts.map(tryoutCard).join('') + '</div>',
    { active: 'tryouts', role },
  )
}

function tryoutCard(tryout) {
  const staff = state.user?.role === 'staff'
  const email = state.user?.email || ''
  const list = Array.isArray(tryout.enrolled) ? tryout.enrolled : []
  const seats = Math.max(1, Number(tryout.seats) || 1)
  const taken = list.length
  const vacancies = Math.max(0, seats - taken)
  const full = vacancies === 0
  const enrolled = list.includes(email)
  const playerCategory = getCategoryFromAge(getAgeFromProfile(state.profile?.birth))
  const playerPos = state.profile?.pos
  const canEnroll = staff || ((tryout.positions.includes(playerPos) || tryout.positions.includes(state.profile?.secondary)) && (!tryout.category || tryout.category === playerCategory))
  const incompatible = !staff && !enrolled && !canEnroll

  let actions
  if (staff) {
    actions = '<button type="button" class="btn-secondary w-full" data-action="view-enrolled" data-id="' + tryout.id + '">' + t('Ver inscritos') + ' (' + taken + '/' + seats + ') ' + icon('arrow', 'size-4') + '</button>' +
      '<button type="button" class="btn-danger w-full" data-action="cancel-tryout" data-id="' + tryout.id + '">' + icon('close', 'size-4') + ' ' + t('Cancelar peneira') + '</button>'
  } else if (enrolled) {
    actions = '<div class="btn-secondary w-full cursor-default" role="status">' + t('Inscrição confirmada') + ' ' + icon('check', 'size-4') + '</div>' +
      '<button type="button" class="btn-danger w-full" data-action="withdraw" data-id="' + tryout.id + '">' + t('Cancelar minha inscrição') + '</button>'
  } else {
    actions = '<button type="button" class="btn-' + (incompatible ? 'incompatible' : 'primary') + ' w-full" data-action="enroll" data-id="' + tryout.id + '" ' + (!canEnroll || full ? 'disabled' : '') + '>' +
      (full ? t('Sem vagas') : canEnroll ? t('Inscrever-me') : t('Posição/categoria incompatível')) + ' ' + icon('arrow', 'size-4') + '</button>'
  }

  return '<article class="panel flex flex-col" data-tryout-card="' + tryout.id + '"><div class="flex flex-wrap gap-1.5">' + tag(tryout.category || t('Aberta')) + tag(tryout.positions.join(' • '), true) + '</div>' +
    '<h2 class="mt-4 text-xl font-black">' + escapeHtml(tryout.title) + '</h2><div class="mt-5 space-y-3 text-sm text-white/55">' +
    '<p class="flex gap-2">' + icon('calendar', 'size-4 text-[#e2bb62]') + formatDate(tryout.date) + ' • ' + escapeHtml(tryout.time) + '</p>' +
    '<p class="flex gap-2">' + icon('pin', 'size-4 text-[#e2bb62]') + escapeHtml(tryout.location) + ' — ' + escapeHtml(tryout.city) + '/' + escapeHtml(tryout.state) + '</p></div>' +
    '<div class="mt-6 flex items-end justify-between gap-3"><div><p class="text-[11px] font-bold uppercase tracking-[.18em] text-white/35">' + t('Vagas preenchidas') + '</p>' +
    '<p class="mt-1 text-3xl font-black leading-none" aria-label="' + taken + ' de ' + seats + ' vagas preenchidas"><span class="' + (full ? 'text-rose-300' : 'text-[#e6bd62]') + '">' + taken + '</span><span class="text-white/35">/' + seats + '</span></p></div>' +
    '<span class="tag ' + (full ? 'red' : 'green') + '">' + (full ? t('Lotada') : vacancies + ' ' + t(vacancies === 1 ? 'vaga livre' : 'vagas livres')) + '</span></div>' +
    '<div class="mt-3 h-2 overflow-hidden rounded-full bg-white/8"><div class="h-full rounded-full ' + (full ? 'bg-rose-400' : 'bg-[#d4ad59]') + '" style="width:' + Math.min(100, taken / seats * 100) + '%"></div></div>' +
    '<div class="mt-6 grid gap-2">' + actions + '</div></article>'
}

function messagesPage() {
  const staff = state.user?.role === 'staff'
  const role = staff ? 'staff' : 'player'
  const conversations = getConversations()
  const heading = '<div class="chat-heading"><span class="eyebrow">Comunicação</span><h1 class="page-title">' + t('Conversas') + '</h1><p class="page-subtitle">' +
    (staff ? 'Pesquise qualquer atleta do banco, abra a conversa e envie uma mensagem.' : 'Converse com treinadores e olheiros disponíveis.') + '</p></div>'

  if (!conversations.length) {
    activeConversation = null
    activeThreadKey = null
    return shell(
      '<div><span class="eyebrow">Comunicação</span><h1 class="page-title">' + t('Conversas') + '</h1></div><div class="mt-6 rounded-2xl border border-dashed border-white/10 p-10 text-center text-white/40">' +
      (remote.enabled && staff ? 'Nenhum jogador cadastrado ainda. Quando um atleta criar a conta, ele aparece aqui.' : 'Nenhuma conversa disponível no momento.') + '</div>',
      { active: 'messages', role },
    )
  }

  const selected = conversations.find((c) => c.id === activeThread) || conversations[0]
  activeThread = selected.id
  activeConversation = selected
  activeThreadKey = selected.key
  if (!isMobileView() || mobileChatOpen) markRead(selected.key)
  const history = state.messages.filter((m) => m.thread === selected.key).sort((a, b) => messageTs(a) - messageTs(b))

  return shell(
    heading +
    '<section class="chat-layout mt-6 grid min-h-[620px] overflow-hidden rounded-[28px] border border-white/10 bg-white/[.025] md:grid-cols-[300px_1fr]" data-mobile-view="' + (mobileChatOpen ? 'chat' : 'list') + '">' +
    '<aside class="chat-list border-b border-white/8 bg-black/20 md:border-b-0 md:border-r"><div class="p-4"><label class="field-label">Pesquisar ' + (staff ? 'atleta' : 'profissional') + '<input id="conversation-search" class="field mt-2" placeholder="Digite um nome, posição ou cidade..." autocomplete="off" /></label></div>' +
    '<div id="conversation-list" class="max-h-[520px] space-y-1 overflow-y-auto p-2">' + conversationItemsHtml(conversations, selected.id) + '</div></aside>' +
    '<div class="chat-pane flex min-w-0 flex-col"><header class="chat-header flex items-center justify-between gap-3 border-b border-white/8 px-5 py-4"><div class="flex min-w-0 items-center gap-3">' +
    '<button type="button" class="chat-back icon-button" data-action="chat-back" aria-label="Voltar para as conversas">' + icon('back') + '</button>' +
    '<span class="avatar">' + avatar(selected.avatar) + '</span><div class="min-w-0"><p class="truncate font-bold">' + escapeHtml(selected.name) + '</p><p class="text-xs text-emerald-300">Disponível para conversar</p></div></div>' +
    '<span class="chat-tag">' + tag(staff ? selected.subtitle : 'Canal seguro') + '</span></header>' +
    '<div id="chat-messages" class="chat-messages flex-1 space-y-3 overflow-y-auto p-5">' + renderHistory(history, role) + '</div>' +
    '<form id="message-form" class="chat-input-bar border-t border-white/8 p-4"><div class="flex gap-2"><input id="message-input" class="field" placeholder="Escreva sua mensagem..." autocomplete="off" maxlength="2000" required/><button class="btn-primary chat-send shrink-0" aria-label="Enviar mensagem">' + icon('arrow', 'size-4') + '</button></div></form></div></section>',
    { active: 'messages', role },
  )
}

function renderHistory(history, role) {
  if (!history.length) {
    return '<div data-empty-chat class="grid h-full place-items-center rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-white/40">Nenhuma mensagem ainda. Envie a primeira mensagem para iniciar a conversa.</div>'
  }
  return history.map((message) => messageBubble(message, role)).join('')
}

function loginPage() {
  return '<div class="min-h-screen bg-[radial-gradient(circle_at_center,_rgba(210,173,88,.12),_transparent_30%),#070707] px-4 py-8 text-white"><div class="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-[32px] border border-white/10 bg-white/[.025] lg:grid-cols-[.95fr_1.05fr]">' +
    '<div class="relative hidden overflow-hidden border-r border-white/8 bg-[radial-gradient(circle_at_30%_20%,rgba(216,176,88,.24),transparent_25%),#0c0c0c] p-10 lg:flex lg:flex-col lg:justify-between"><div><img src="./assets/brand/simbolo.jpg" alt="Academia Pelé" class="h-28 w-28 rounded-3xl object-contain"/><span class="eyebrow mt-8">TF3 • Sprint 3</span><h1 class="mt-4 max-w-lg text-5xl font-black leading-tight">Onde o futebol encontra <span class="text-[#e1bb62]">o próximo talento.</span></h1><p class="mt-5 max-w-xl text-white/50">Uma experiência para atletas, treinadores, funcionários e olheiros se encontrarem.</p></div><div class="text-sm text-white/30">Academia Pelé • Plataforma de talentos</div></div>' +
    '<div class="flex items-center justify-center p-6 sm:p-10"><div class="w-full max-w-md"><img src="./assets/brand/simbolo.jpg" alt="Academia Pelé" class="mx-auto h-24 w-24 rounded-3xl object-contain lg:hidden"/><span class="eyebrow mt-6">' + t('Acesso') + '</span><h2 class="mt-3 text-3xl font-black">' + t('Entrar na Academia Pelé') + '</h2><p class="mt-2 text-sm text-white/45">' + t('Escolha o tipo de conta antes de entrar.') + '</p>' +
    '<div class="mt-6 grid grid-cols-2 gap-2 rounded-2xl border border-white/8 bg-black/25 p-1"><button type="button" class="role-tab active" data-role="player">' + t('Jogador') + '</button><button type="button" class="role-tab" data-role="staff">' + t('Funcionário') + '</button></div>' +
    '<form id="login-form" class="mt-6 space-y-4">' + input(t('E-mail'), 'login-email', '', 'email', true) + input(t('Senha'), 'login-password', '', 'password', true) + '<p id="login-error" class="hidden rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-200"></p><button class="btn-primary w-full" type="submit">' + t('Entrar') + ' ' + icon('arrow', 'size-4') + '</button></form>' +
    '<button type="button" class="mt-3 w-full text-center text-xs text-[#e2bb62] hover:text-[#f0d58c]" data-action="forgot-password">' + t('Esqueci minha senha') + '</button>' +
    '<div class="my-6 flex items-center gap-3"><span class="h-px flex-1 bg-white/8"></span><span class="text-xs text-white/25">' + t('ou') + '</span><span class="h-px flex-1 bg-white/8"></span></div>' +
    '<button type="button" class="btn-secondary w-full" data-route="register">' + t('Criar conta de jogador') + '</button><button type="button" class="mt-3 w-full text-center text-xs text-white/35 hover:text-white" data-action="demo">' + t('Entrar com conta demo') + '</button>' +
    '<button type="button" class="mt-4 w-full text-center text-xs text-white/30 hover:text-white" data-action="change-lang">' + icon('globe', 'size-3.5') + ' ' + LANGS.find((l) => l.code === getLang())?.label + '</button>' +
    '<p class="mt-5 text-center text-[11px] leading-5 text-white/30">Funcionário (teste): funcionario@academiapele.com / Academia123!<br/>Jogador (teste): gabriel@academiapele.com / Demo123!</p></div></div></div></div>'
}

function passwordRecoveryPage() {
  return '<div class="grid min-h-screen place-items-center bg-[#070707] px-4 py-8 text-white"><div class="w-full max-w-md rounded-[32px] border border-white/10 bg-white/[.025] p-6 sm:p-10">' +
    '<span class="eyebrow">' + t('Recuperação de acesso') + '</span><h1 class="mt-2 text-3xl font-black">' + t('Crie uma nova senha') + '</h1><p class="mt-3 text-sm leading-6 text-white/45">' + t('Escolha uma senha nova para voltar a acessar sua conta.') + '</p>' +
    '<form id="password-recovery-form" class="mt-6 space-y-4">' + input(t('Nova senha'), 'recovery-password', '', 'password', true) + input(t('Confirmar senha'), 'recovery-confirm', '', 'password', true) + '<p id="recovery-feedback" class="hidden rounded-2xl border px-4 py-3 text-sm" role="alert"></p><button class="btn-primary w-full" type="submit">' + t('Salvar nova senha') + '</button></form>' +
    '</div></div>'
}

function forgotPassword() {
  if (!remote.enabled) return toast(t('A recuperação por e-mail precisa do Supabase configurado.'), 'error')
  const email = normalizeEmail(document.querySelector('#login-email').value)
  if (!email || !email.includes('@')) return showFeedback('login-error', t('Informe um e-mail válido.'), true)
  const button = document.querySelector('[data-action="forgot-password"]')
  button?.setAttribute('disabled', '')
  requestPasswordReset(email, location.origin + location.pathname + '?reset=1')
    .then((error) => {
      button?.removeAttribute('disabled')
      if (error) return showFeedback('login-error', describeError(error), true)
      toast(t('Se o e-mail estiver cadastrado, enviaremos um link para redefinir sua senha.'))
    })
    .catch((error) => {
      button?.removeAttribute('disabled')
      showFeedback('login-error', describeError(error), true)
    })
}

async function saveRecoveredPassword() {
  const password = document.querySelector('#recovery-password').value
  const confirm = document.querySelector('#recovery-confirm').value
  if (password.length < 6) return showFeedback('recovery-feedback', t('A senha precisa ter pelo menos 6 caracteres.'), true)
  if (password !== confirm) return showFeedback('recovery-feedback', t('As senhas não coincidem.'), true)
  const error = await updatePassword(password)
  if (error) return showFeedback('recovery-feedback', describeError(error), true)
  toast(t('Senha atualizada com sucesso.'))
  await clearRemoteSession({ navigate: true })
}

function registerPage() {
  return '<div class="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(216,176,88,.1),transparent_28%),#070707] px-4 py-8 text-white"><div class="mx-auto max-w-5xl rounded-[32px] border border-white/10 bg-white/[.025] p-6 sm:p-10">' +
    '<div class="flex flex-wrap items-center justify-between gap-4"><div class="flex items-center gap-3"><img src="./assets/brand/simbolo.jpg" alt="Academia Pelé" class="h-16 w-16 rounded-2xl object-contain"/><div><span class="eyebrow">' + t('Cadastro') + '</span><h1 class="mt-1 text-3xl font-black">' + t('Criar conta de jogador') + '</h1></div></div><button type="button" class="btn-ghost" data-route="login">' + t('Voltar') + '</button></div>' +
    '<p class="mt-3 max-w-3xl text-sm leading-6 text-white/45">Preencha seus dados pessoais, categoria esportiva, gênero, posições e endereço. A idade e a categoria são calculadas automaticamente pela data de nascimento.</p>' +
    '<form id="register-form" class="mt-8 grid gap-4 sm:grid-cols-2">' +
    input(t('Nome completo'), 'reg-name', '', 'text', true) +
    input('CPF', 'reg-cpf', '', 'text', true) +
    input(t('Data de nascimento'), 'reg-birth', '', 'date', true) +
    input(t('Idade'), 'reg-age', '', 'number', false, false, true) +
    '<label class="field-label">Categoria<select id="reg-category" class="field" disabled><option>Preencha a data de nascimento</option></select></label>' +
    selectField(t('Gênero'), 'reg-gender', GENDERS, '') +
    input(t('E-mail'), 'reg-email', '', 'email', true) +
    input(t('Telefone'), 'reg-phone', '', 'tel', true) +
    selectField(t('Posição principal'), 'reg-pos', POSITIONS, '') +
    selectField(t('Posição secundária'), 'reg-secondary', ['—'].concat(POSITIONS), '—') +
    selectField(t('Perna dominante'), 'reg-foot', FEET, '') +
    '<div class="sm:col-span-2 mt-2 rounded-2xl border border-white/8 bg-black/15 p-4"><p class="text-sm font-bold">' + t('Endereço') + '</p><p class="mt-1 text-xs text-white/35">A cidade informada aqui será usada também nos filtros de região.</p></div>' +
    input(t('CEP'), 'reg-zip', '', 'text', true) +
    input(t('Cidade'), 'reg-city', '', 'text', true) +
    input(t('Estado'), 'reg-state', '', 'text', true) +
    input(t('Bairro'), 'reg-district', '', 'text', true) +
    input(t('Endereço'), 'reg-address', '', 'text', true) +
    input(t('Número'), 'reg-number', '', 'text', true) +
    input(t('Senha'), 'reg-password', '', 'password', true) +
    input(t('Confirmar senha'), 'reg-confirm', '', 'password', true) +
    '<div id="reg-feedback" class="sm:col-span-2 hidden rounded-2xl border px-4 py-3 text-sm" role="alert"></div>' +
    '<div class="sm:col-span-2 flex flex-wrap items-center justify-between gap-3 pt-3"><p class="max-w-2xl text-xs leading-5 text-white/35">Nesta versão front-end, os dados são armazenados localmente no navegador para permitir a demonstração do fluxo. Não use senhas reais.</p><button class="btn-primary" type="submit">' + t('Criar conta') + ' ' + icon('check', 'size-4') + '</button></div>' +
    '</form></div></div>'
}

function input(label, id, value = '', type = 'text', required = false, disabled = false, readonly = false) {
  return '<label class="field-label">' + escapeHtml(label) + '<input id="' + id + '" class="field" type="' + type + '" value="' + escapeHtml(value) + '"' + (required ? ' required' : '') + (disabled ? ' disabled' : '') + (readonly ? ' readonly' : '') + ' /></label>'
}

function selectField(label, id, options, selected = '') {
  const placeholder = selected ? '' : '<option value="" disabled selected>Selecione</option>'
  return '<label class="field-label">' + escapeHtml(label) + '<select id="' + id + '" class="field" required>' + placeholder + options.map((option) => '<option value="' + escapeHtml(option) + '" ' + (String(option) === String(selected) ? 'selected' : '') + '>' + escapeHtml(option) + '</option>').join('') + '</select></label>'
}

function showFeedback(id, text, error = false) {
  const element = document.querySelector('#' + id)
  if (!element) return
  element.textContent = text
  element.className = (id === 'reg-feedback' ? 'sm:col-span-2' : '') + ' rounded-2xl border px-4 py-3 text-sm ' + (error
    ? 'border-rose-400/20 bg-rose-500/10 text-rose-200'
    : 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200')
  element.classList.remove('hidden')
}

function getAgeFromProfile(birth) {
  return getAgeFromBirth(birth)
}

function getCurrentAthlete() {
  if (!state.user || state.user.role === 'staff') return null
  const account = state.accounts.find((entry) => entry.email === state.user.email)
  if (account?.athleteId) return state.athletes.find((a) => a.id === account.athleteId) || null
  return state.athletes.find((a) => a.name === state.profile?.name) || null
}

function getPlayerReviewCount() {
  const athlete = getCurrentAthlete()
  return athlete ? (state.reviews[athlete.id] || []).length : 0
}

function averagePlayerRating() {
  const athlete = getCurrentAthlete()
  return athlete ? formatRating(ratingOf(athlete)).replace('.', ',') : '—'
}

function formatDate(date) {
  if (!date) return 'Data não informada'
  const parts = String(date).split('-')
  if (parts.length !== 3) return escapeHtml(date)
  return parts[2] + '/' + parts[1] + '/' + parts[0]
}

function handleBirthPreview(prefix) {
  const birth = document.querySelector('#' + prefix + '-birth')?.value
  const ageField = document.querySelector('#' + prefix + '-age')
  const categoryField = document.querySelector('#' + prefix + '-category')
  if (!birth || !validBirthDate(birth)) {
    if (ageField) ageField.value = ''
    if (categoryField) categoryField.innerHTML = '<option>Preencha uma data válida</option>'
    return
  }
  const age = getAgeFromBirth(birth)
  const category = getCategoryFromAge(age)
  if (ageField) ageField.value = age
  if (categoryField) categoryField.innerHTML = '<option>' + escapeHtml(category) + '</option>'
}

function openAthleteModal(athleteId) {
  const athlete = state.athletes.find((a) => a.id === Number(athleteId))
  if (!athlete) return
  const reviews = state.reviews[athlete.id] || []
  const wrapper = document.createElement('div')
  wrapper.id = 'modal-root'
  wrapper.className = 'fixed inset-0 z-[90] grid place-items-center bg-black/75 p-4 backdrop-blur-md'
  wrapper.innerHTML =
    '<div class="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[28px] border border-white/10 bg-[#111] p-6 shadow-2xl sm:p-8" role="dialog" aria-modal="true" aria-labelledby="athlete-modal-title">' +
    '<div class="flex items-start justify-between gap-4"><div class="flex items-center gap-4"><div class="avatar-xl bg-gradient-to-br ' + athlete.color + '">' + avatar(athlete.name) + '</div><div><span class="eyebrow">' + t('Perfil do atleta') + '</span><h2 id="athlete-modal-title" class="mt-1 text-2xl font-black">' + escapeHtml(athlete.name) + '</h2><p class="text-sm text-white/45">' + athlete.age + ' ' + t('anos') + ' • ' + escapeHtml(athlete.city) + '/' + escapeHtml(athlete.state) + '</p></div></div><button type="button" class="icon-button" data-close-modal aria-label="Fechar">' + icon('close') + '</button></div>' +
    '<div class="mt-6 flex flex-wrap gap-2">' + tag(t(athlete.pos)) + tag(t(athlete.secondary), true) + footTag(t(athlete.foot)) + tag(t(getCategoryFromAge(athlete.age))) + tag(t(athlete.gender || 'Não informado'), true) + '</div>' +
    '<div class="mt-6 grid gap-4 md:grid-cols-3"><div class="panel"><p class="text-xs text-white/35">' + t('Avaliação média') + '</p><p class="mt-2 text-3xl font-black text-[#e6bd62]">' + formatRating(ratingOf(athlete)) + '</p></div><div class="panel"><p class="text-xs text-white/35">' + t('Votos') + '</p><p id="modal-votes" class="mt-2 text-3xl font-black">' + (athlete.votes + (state.votes[athlete.id] || 0)) + '</p></div><div class="panel"><p class="text-xs text-white/35">' + t('Status') + '</p><p class="mt-2 text-lg font-black">' + escapeHtml(athlete.status) + '</p></div></div>' +
    '<div class="mt-6"><span class="eyebrow">' + t('Atributos') + '</span><div class="mt-3 flex flex-wrap gap-2">' + (athlete.tags || []).map((item) => tag(item)).join('') + '</div></div>' +
    '<div class="mt-6 flex flex-wrap gap-2"><button type="button" class="btn-primary" data-message-athlete="' + athlete.id + '">' + icon('message', 'size-4') + ' ' + t('Abrir conversa') + '</button><button type="button" class="btn-secondary" data-vote="' + athlete.id + '">' + icon('star', 'size-4') + '<span>' + (hasVoted(state, athlete.id, state.user?.email || 'anon') ? t('Retirar voto') : t('Votar')) + '</span></button>' +
    (state.user?.role === 'staff' ? '<button type="button" class="btn-secondary" data-review-athlete="' + athlete.id + '">' + icon('edit', 'size-4') + ' ' + t('Registrar avaliação') + '</button>' : '') + '</div>' +
    '<section class="mt-8"><div class="flex items-center justify-between gap-3"><div><span class="eyebrow">' + t('Avaliações') + '</span><h3 class="section-title">' + reviews.length + ' ' + t('registro(s)') + '</h3></div></div><div class="mt-4 grid gap-4 md:grid-cols-2">' + (reviews.length ? reviews.map((review) => reviewCard(review, athlete.id)).join('') : '<div class="md:col-span-2 rounded-2xl border border-dashed border-white/10 p-8 text-center text-white/40">' + t('Nenhuma avaliação registrada ainda.') + '</div>') + '</div></section>' +
    '</div>'

  document.body.appendChild(wrapper)
  wrapper.querySelectorAll('[data-close-modal]').forEach((button) => button.addEventListener('click', () => wrapper.remove()))
  wrapper.addEventListener('click', (event) => { if (event.target === wrapper) wrapper.remove() })
  wrapper.querySelectorAll('[data-message-athlete]').forEach((button) => button.addEventListener('click', () => {
    const id = Number(button.dataset.messageAthlete)
    wrapper.remove()
    startConversationForAthlete(id)
  }))
  wrapper.querySelectorAll('[data-vote]').forEach((button) => button.addEventListener('click', () => {
    const voted = castVote(Number(button.dataset.vote))
    button.querySelector('span').textContent = t(voted ? 'Retirar voto' : 'Votar')
    const counter = wrapper.querySelector('#modal-votes')
    if (counter) counter.textContent = athlete.votes + (state.votes[athlete.id] || 0)
  }))
  wrapper.querySelectorAll('[data-delete-review]').forEach((button) => button.addEventListener('click', () => {
    confirmDialog({
      eyebrow: t('Avaliação'),
      title: t('Excluir sua avaliação?'),
      message: t('A avaliação será removida do perfil de') + ' ' + athlete.name + ' ' + t('e a nota média será recalculada.'),
      confirmLabel: t('Excluir avaliação'),
      onConfirm: async () => {
        const reviewId = button.dataset.deleteReview
        if (remote.enabled) {
          const error = await removeEvaluation(String(reviewId).replace(/^r/, ''))
          if (error) return toast(describeError(error), 'error')
        }
        state.reviews[athlete.id] = (state.reviews[athlete.id] || []).filter((review) => String(review.id) !== String(reviewId))
        persist()
        wrapper.remove()
        refreshAthleteViews()
        openAthleteModal(athlete.id)
        toast(t('Avaliação excluída.'))
      },
    })
  }))
  wrapper.querySelectorAll('[data-review-athlete]').forEach((button) => button.addEventListener('click', () => {
    wrapper.remove()
    openReviewModal(Number(button.dataset.reviewAthlete))
  }))
}

function startConversationForAthlete(id) {
  const athlete = state.athletes.find((a) => a.id === Number(id))
  if (remote.enabled && !athlete?.profileId) return toast(t('Este atleta de exemplo não tem conta para receber mensagens.'), 'error')
  activeThread = String(id)
  openChatOnArrive = true
  go('messages')
}

function confirmDialog({ eyebrow = t('Confirmação'), title, message, confirmLabel = t('Confirmar'), onConfirm }) {
  const wrapper = document.createElement('div')
  wrapper.className = 'fixed inset-0 z-[110] grid place-items-center bg-black/75 p-4'
  wrapper.innerHTML =
    '<div class="w-full max-w-md rounded-[28px] border border-white/10 bg-[#111] p-6" role="dialog" aria-modal="true"><span class="eyebrow">' + escapeHtml(eyebrow) + '</span><h2 class="mt-2 text-2xl font-black">' + escapeHtml(title) + '</h2><p class="mt-3 text-sm leading-6 text-white/55">' + escapeHtml(message) + '</p>' +
    '<div class="mt-6 flex justify-end gap-2"><button type="button" class="btn-secondary" data-close>' + t('Voltar') + '</button><button type="button" class="btn-danger" data-confirm>' + escapeHtml(confirmLabel) + '</button></div></div>'
  document.body.appendChild(wrapper)
  wrapper.querySelector('[data-close]').addEventListener('click', () => wrapper.remove())
  wrapper.addEventListener('click', (event) => { if (event.target === wrapper) wrapper.remove() })
  wrapper.querySelector('[data-confirm]').addEventListener('click', () => {
    wrapper.remove()
    onConfirm()
  })
}

function openReviewModal(athleteId) {
  if (state.user?.role !== 'staff') return
  const athlete = state.athletes.find((a) => a.id === athleteId)
  if (!athlete) return
  const positions = [athlete.pos].concat(athlete.secondary && athlete.secondary !== '—' && athlete.secondary !== athlete.pos ? [athlete.secondary] : [])

  const wrapper = document.createElement('div')
  wrapper.className = 'fixed inset-0 z-[95] grid place-items-center bg-black/75 p-4 backdrop-blur-md'
  wrapper.innerHTML =
    '<div class="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[28px] border border-white/10 bg-[#111] p-6 shadow-2xl sm:p-8" role="dialog" aria-modal="true" aria-labelledby="review-modal-title">' +
    '<div class="flex items-start justify-between gap-4"><div><span class="eyebrow">' + t('Avaliação') + '</span><h2 id="review-modal-title" class="mt-2 text-2xl font-black">Avaliar ' + escapeHtml(athlete.name) + '</h2><p class="mt-1 text-sm text-white/45">Dê uma nota de 0 a 10 para cada característica. A nota base é uma média ponderada pela posição avaliada; as estatísticas da partida ajustam a nota em até ±' + String(MAX_ADJUSTMENT).replace('.', ',') + ' ponto.</p></div><button type="button" class="icon-button" data-close aria-label="Fechar">' + icon('close') + '</button></div>' +
    '<form id="review-form" class="mt-6 space-y-6">' +
    '<label class="field-label">' + t('Posição avaliada') + '<select id="review-position" class="field">' + positions.map((p, i) => '<option value="' + escapeHtml(p) + '">' + escapeHtml(p) + (i === 0 ? ' (principal)' : ' (secundária)') + '</option>').join('') + '</select></label>' +
    '<section><div class="flex items-center justify-between gap-3"><h3 class="font-bold">Características <span class="text-xs font-normal text-white/35">(0 a 10)</span></h3><span class="text-[11px] text-white/35">O “peso” mostra a importância na posição</span></div><div id="review-criteria" class="mt-3 grid gap-3 sm:grid-cols-2"></div>' +
    '<div class="mt-4 flex items-center justify-between gap-4 rounded-2xl border border-[#d4ad59]/20 bg-[#d4ad59]/7 p-4"><div><p class="text-sm font-bold text-[#e2bb62]">Nota final ponderada</p><p id="review-score-hint" class="mt-1 text-xs text-white/45"></p></div><p id="review-score" class="text-4xl font-black text-[#e6bd62]">—</p></div></section>' +
    '<section><h3 class="font-bold">Estatísticas da partida <span class="text-xs font-normal text-white/35">(opcional • visível só para o atleta e para a equipe)</span></h3><div id="review-stats" class="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"></div></section>' +
    '<section><h3 class="font-bold">Pontos fortes <span class="text-xs font-normal text-white/35">(opcional)</span></h3><div class="mt-3 flex flex-wrap gap-2">' + STRENGTHS.map((item) => '<label class="check-pill"><input type="checkbox" name="strength" value="' + escapeHtml(item) + '"/><span>' + escapeHtml(item) + '</span></label>').join('') + '</div></section>' +
    '<label class="field-label">' + t('Comentário') + '<textarea id="review-comment" class="field min-h-28 resize-y" required placeholder="Descreva o que observou no jogo, atitude, evolução..."></textarea></label>' +
    '<p id="review-error" class="hidden rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-200" role="alert"></p>' +
    '<div class="flex justify-end gap-2"><button type="button" class="btn-secondary" data-close>Cancelar</button><button type="submit" class="btn-primary">Salvar avaliação ' + icon('check', 'size-4') + '</button></div></form></div>'
  document.body.appendChild(wrapper)

  const form = wrapper.querySelector('#review-form')
  const criteriaBox = wrapper.querySelector('#review-criteria')
  const statsBox = wrapper.querySelector('#review-stats')
  const positionSelect = wrapper.querySelector('#review-position')
  const readValues = (attr) => Object.fromEntries([...wrapper.querySelectorAll('[' + attr + ']')].map((field) => [field.getAttribute(attr), field.value]))

  const signed = (value) => (value > 0 ? '+' : '') + value.toFixed(1).replace('.', ',')
  const readStatNumbers = () => {
    const stats = {}
    wrapper.querySelectorAll('[data-stat]').forEach((field) => {
      if (field.value !== '' && Number.isFinite(Number(field.value))) stats[field.dataset.stat] = Number(field.value)
    })
    return stats
  }

  const updateScore = () => {
    const pos = positionSelect.value
    const criteria = criteriaForPosition(pos)
    const ratings = readValues('data-criterion')
    const filled = criteria.filter((c) => ratings[c.key] !== '').length
    const result = filled === criteria.length ? computeFinalScore(pos, ratings, readStatNumbers()) : null
    wrapper.querySelector('#review-score').textContent = result === null ? '—' : result.final.toFixed(1).replace('.', ',')
    wrapper.querySelector('#review-score-hint').textContent = result === null
      ? 'Avalie as ' + criteria.length + ' características para calcular (' + filled + '/' + criteria.length + ').'
      : 'Nota base ' + result.base.toFixed(1).replace('.', ',') + ' (pesos de ' + pos + ') • desempenho na partida ' + (result.adjustment ? signed(result.adjustment) : 'sem ajuste')
  }

  const paint = () => {
    const pos = positionSelect.value
    const keepCriteria = readValues('data-criterion')
    const keepStats = readValues('data-stat')
    criteriaBox.innerHTML = criteriaForPosition(pos).map((c) => {
      const level = weightLevel(pos, c.key)
      const tone = level === 'alto' ? 'text-[#e2bb62]' : level === 'médio' ? 'text-white/60' : 'text-white/30'
      return '<label class="field-label"><span class="flex items-center justify-between gap-2"><span>' + escapeHtml(c.label) + '</span><span class="text-[10px] font-bold uppercase tracking-wider ' + tone + '">peso ' + level + '</span></span><input class="field" type="number" inputmode="decimal" min="0" max="10" step="0.5" required placeholder="0 a 10" data-criterion="' + c.key + '" value="' + escapeHtml(keepCriteria[c.key] ?? '') + '"/></label>'
    }).join('')
    statsBox.innerHTML = statsForPosition(pos).map((c) =>
      '<label class="field-label">' + escapeHtml(c.label) + '<input class="field" type="number" inputmode="numeric" min="0" step="1" placeholder="—" data-stat="' + c.key + '" value="' + escapeHtml(keepStats[c.key] ?? '') + '"/></label>').join('')
    updateScore()
  }

  paint()
  positionSelect.addEventListener('change', paint)
  form.addEventListener('input', updateScore)
  wrapper.querySelectorAll('[data-close]').forEach((button) => button.addEventListener('click', () => wrapper.remove()))

  form.addEventListener('submit', async (event) => {
    event.preventDefault()
    const error = wrapper.querySelector('#review-error')
    const fail = (message) => {
      error.textContent = message
      error.classList.remove('hidden')
      error.scrollIntoView({ block: 'nearest' })
    }
    const pos = positionSelect.value
    const ratings = {}
    for (const c of criteriaForPosition(pos)) {
      const value = Number(wrapper.querySelector('[data-criterion="' + c.key + '"]').value)
      if (!Number.isFinite(value) || value < 0 || value > 10) return fail('A nota de "' + c.label + '" deve estar entre 0 e 10.')
      ratings[c.key] = value
    }
    const stats = {}
    for (const c of statsForPosition(pos)) {
      const raw = wrapper.querySelector('[data-stat="' + c.key + '"]').value
      if (raw === '') continue
      const value = Number(raw)
      if (!Number.isInteger(value) || value < 0) return fail('"' + c.label + '" deve ser um número inteiro, 0 ou maior.')
      stats[c.key] = value
    }
    const statsError = validateStats(stats)
    if (statsError) return fail(statsError)
    const comment = wrapper.querySelector('#review-comment').value.trim()
    if (comment.length < 10) return fail('Escreva um comentário com pelo menos 10 caracteres.')

    const result = computeFinalScore(pos, ratings, stats)
    const score = result.final
    const strengths = [...wrapper.querySelectorAll('input[name="strength"]:checked')].map((box) => box.value)
    const review = {
      id: Date.now(),
      author: state.user?.name || 'Olheiro',
      authorEmail: state.user?.email,
      position: pos,
      ratings,
      rating: score.toFixed(1),
      baseRating: result.base,
      adjustment: result.adjustment,
      stats,
      strengths,
      comment,
      date: new Date().toLocaleDateString('pt-BR'),
    }
    if (remote.enabled) {
      if (!athlete.profileId) return fail('Este atleta ainda não possui uma conta ativa para receber avaliações.')
      const submit = form.querySelector('button[type="submit"]')
      submit?.setAttribute('disabled', '')
      const saved = await createEvaluation({
        athleteId: athlete.profileId,
        position: pos,
        ratings,
        rating: score,
        baseRating: result.base,
        adjustment: result.adjustment,
        stats,
        strengths,
        comment,
      })
      if (saved.error || !saved.row) {
        submit?.removeAttribute('disabled')
        return fail(describeError(saved.error))
      }
      review.id = 'r' + saved.row.id
    }
    const list = state.reviews[athleteId] || []
    list.unshift(review)
    state.reviews[athleteId] = list
    if (athlete.email) notify(athlete.email, 'Nova avaliação', 'Um olheiro avaliou seu desempenho como ' + pos + ' (nota ' + score.toFixed(1).replace('.', ',') + ').')
    persist()
    wrapper.remove()
    toast(t('Avaliação salva. Nota final:') + ' ' + score.toFixed(1).replace('.', ',') + '.')
    refreshAthleteViews()
    openAthleteModal(athleteId)
  })
}

function openLocationModal(onSelect) {
  const panel = document.createElement('div')
  panel.className = 'fixed inset-0 z-[100] grid place-items-center bg-black/70 p-4'
  panel.innerHTML =
    '<div class="w-full max-w-md rounded-3xl border border-white/10 bg-[#151515] p-6" role="dialog" aria-modal="true" aria-labelledby="location-title">' +
    '<div class="flex items-center justify-between"><div><span class="eyebrow">' + t('Localidade') + '</span><h3 id="location-title" class="mt-1 text-xl font-black">Confirmar local da peneira</h3></div><button type="button" class="icon-button" data-close>' + icon('close') + '</button></div>' +
    '<div class="mt-5 space-y-2">' +
    [
      ['Centro de Treinamento Pelé', 'São Paulo/SP'],
      ['Arena Oeste', 'Osasco/SP'],
      ['CT Litoral', 'Santos/SP'],
    ].map((item) => '<button type="button" class="location-option" data-location="' + escapeHtml(item[0] + ' — ' + item[1]) + '"><span class="grid size-10 place-items-center rounded-xl bg-[#e1bb62]/10 text-[#e2bb62]">' + icon('pin', 'size-4') + '</span><span class="text-left"><strong>' + escapeHtml(item[0]) + '</strong><small>' + escapeHtml(item[1]) + '</small></span></button>').join('') +
    '</div></div>'

  document.body.appendChild(panel)
  panel.querySelector('[data-close]').addEventListener('click', () => panel.remove())
  panel.querySelectorAll('[data-location]').forEach((button) => button.addEventListener('click', () => {
    onSelect(button.dataset.location)
    panel.remove()
  }))
}

function openTryoutModal() {
  if (state.user?.role !== 'staff') {
    toast('Somente funcionários podem criar uma peneira.', 'error')
    return
  }

  const wrapper = document.createElement('div')
  wrapper.id = 'tryout-modal'
  wrapper.className = 'fixed inset-0 z-[90] grid place-items-center bg-black/75 p-4 backdrop-blur-md'
  wrapper.innerHTML =
    '<div class="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-white/10 bg-[#111] p-6 shadow-2xl sm:p-8" role="dialog" aria-modal="true" aria-labelledby="tryout-title">' +
    '<div class="flex items-start justify-between gap-4"><div><span class="eyebrow">' + t('Nova peneira') + '</span><h2 id="tryout-title" class="mt-2 text-2xl font-black">Criar e agendar</h2></div><button type="button" class="icon-button" data-close>' + icon('close') + '</button></div>' +
    '<form id="tryout-form" class="mt-6 grid gap-4 sm:grid-cols-2">' +
    input('Nome da peneira', 'try-title', '', 'text', true) +
    input('Data', 'try-date', '', 'date', true) +
    input('Horário', 'try-time', '', 'time', true) +
    input('Quantidade de vagas', 'try-seats', '12', 'number', true) +
    '<label class="field-label">Categoria<select id="try-category" class="field" required><option>Sub-7</option><option>Sub-9</option><option>Sub-11</option><option>Sub-13</option><option>Sub-15</option><option selected>Sub-20</option></select></label>' +
    '<div class="sm:col-span-2"><p class="field-label mb-2">Localidade</p><button type="button" id="location-button" class="field flex items-center justify-between text-left"><span id="location-value" class="text-white/35">Selecionar local...</span>' + icon('pin', 'size-4 text-[#e2bb62]') + '</button></div>' +
    '<div class="sm:col-span-2"><p class="field-label">' + t('Posições disponíveis') + '</p><div class="mt-2 grid grid-cols-2 gap-2 rounded-2xl border border-white/8 bg-black/20 p-3 sm:grid-cols-3">' +
    POSITIONS.map((p, i) => '<label class="check-pill"><input type="checkbox" name="position" value="' + escapeHtml(p) + '" ' + (i === 6 ? 'checked' : '') + '/><span>' + escapeHtml(p) + '</span></label>').join('') +
    '</div></div>' +
    '<div id="tryout-error" class="sm:col-span-2 hidden rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200" role="alert"></div>' +
    '<div class="flex justify-end gap-2 sm:col-span-2"><button type="button" class="btn-secondary" data-close>' + t('Cancelar') + '</button><button class="btn-primary" type="submit">' + t('Criar peneira') + ' ' + icon('check', 'size-4') + '</button></div></form></div>'

  document.body.appendChild(wrapper)
  wrapper.querySelectorAll('[data-close]').forEach((button) => button.addEventListener('click', () => wrapper.remove()))
  wrapper.querySelector('#location-button').addEventListener('click', () => openLocationModal((locationValue) => {
    wrapper.querySelector('#location-value').textContent = locationValue
    wrapper.querySelector('#location-value').classList.remove('text-white/35')
  }))

  wrapper.querySelector('#tryout-form').addEventListener('submit', (event) => {
    event.preventDefault()
    const positions = [...wrapper.querySelectorAll('input[name="position"]:checked')].map((input) => input.value)
    const title = wrapper.querySelector('#try-title').value.trim()
    const location = wrapper.querySelector('#location-value').textContent.trim()
    const seats = Number(wrapper.querySelector('#try-seats').value)
    const error = wrapper.querySelector('#tryout-error')
    if (!title || !location || location === 'Selecionar local...' || !positions.length || !seats || seats < 1) {
      error.textContent = 'Preencha nome, vagas, localidade e pelo menos uma posição.'
      error.classList.remove('hidden')
      return
    }

    const match = location.match(/^(.+?) — (.+)\/([A-Za-z]{2})$/)
    const cityState = (location.split(' — ')[1] || 'São Paulo/SP').split('/')
    state.tryouts.unshift({
      id: Date.now(),
      title,
      date: wrapper.querySelector('#try-date').value,
      time: wrapper.querySelector('#try-time').value,
      city: cityState[0] || 'São Paulo',
      state: cityState[1] || 'SP',
      location: match ? match[1] : location.split(' — ')[0],
      category: wrapper.querySelector('#try-category').value,
      positions,
      seats,
      enrolled: [],
      createdBy: state.user.email,
    })
    notify(state.user.email, 'Nova peneira criada', title + ' foi publicada.')
    persist()
    wrapper.remove()
    render()
    toast(t('Peneira criada e publicada.'))
  })
}

function confirmWithdraw(tryoutId) {
  const tryout = state.tryouts.find((item) => item.id === Number(tryoutId))
  if (!tryout || state.user?.role !== 'player') return
  const wrapper = document.createElement('div')
  wrapper.className = 'fixed inset-0 z-[92] grid place-items-center bg-black/75 p-4'
  wrapper.innerHTML =
    '<div class="w-full max-w-md rounded-[28px] border border-white/10 bg-[#111] p-6" role="dialog" aria-modal="true" aria-labelledby="withdraw-title"><span class="eyebrow">Cancelar inscrição</span><h2 id="withdraw-title" class="mt-2 text-2xl font-black">Sair da peneira?</h2>' +
    '<p class="mt-3 text-sm leading-6 text-white/55">Você será removido de <strong class="text-white">' + escapeHtml(tryout.title) + '</strong> (' + formatDate(tryout.date) + ' • ' + escapeHtml(tryout.time) + '). A vaga ficará livre para outros atletas.</p>' +
    '<div class="mt-6 flex justify-end gap-2"><button type="button" class="btn-secondary" data-close>Manter inscrição</button><button type="button" class="btn-danger" data-confirm>Cancelar inscrição</button></div></div>'
  document.body.appendChild(wrapper)
  wrapper.querySelector('[data-close]').addEventListener('click', () => wrapper.remove())
  wrapper.addEventListener('click', (event) => { if (event.target === wrapper) wrapper.remove() })
  wrapper.querySelector('[data-confirm]').addEventListener('click', () => {
    wrapper.remove()
    withdrawFromTryout(tryout.id)
  })
}

function withdrawFromTryout(tryoutId) {
  const tryout = state.tryouts.find((item) => item.id === Number(tryoutId))
  const email = state.user?.email
  if (!tryout || state.user?.role !== 'player' || !Array.isArray(tryout.enrolled) || !tryout.enrolled.includes(email)) return
  tryout.enrolled = tryout.enrolled.filter((item) => item !== email)
  notify(email, 'Inscrição cancelada', 'Você saiu da peneira "' + tryout.title + '". A vaga foi liberada.')
  notifyTryoutStaff(tryout, 'Vaga liberada', state.user.name + ' cancelou a inscrição em "' + tryout.title + '" (' + tryout.enrolled.length + '/' + tryout.seats + ').')
  persist()
  render()
  toast(t('Inscrição cancelada. A vaga foi liberada.'))
}

function openCancelTryoutModal(tryoutId) {
  const tryout = state.tryouts.find((item) => item.id === Number(tryoutId))
  if (!tryout || state.user?.role !== 'staff') return
  const total = Array.isArray(tryout.enrolled) ? tryout.enrolled.length : 0
  const wrapper = document.createElement('div')
  wrapper.className = 'fixed inset-0 z-[92] grid place-items-center bg-black/75 p-4'
  wrapper.innerHTML =
    '<div class="w-full max-w-lg rounded-[28px] border border-white/10 bg-[#111] p-6" role="dialog" aria-modal="true" aria-labelledby="cancel-title"><span class="eyebrow">Cancelar peneira</span><h2 id="cancel-title" class="mt-2 text-2xl font-black">' + escapeHtml(tryout.title) + '</h2>' +
    '<p class="mt-3 text-sm leading-6 text-white/55">' + (total ? '<strong class="text-white">' + total + ' inscrito(s)</strong> receberão um aviso automático com o motivo abaixo.' : 'Não há inscritos nesta peneira, então nenhum aviso será enviado.') + ' Esta ação remove a peneira da lista e não pode ser desfeita.</p>' +
    '<form id="cancel-tryout-form" class="mt-5"><label class="field-label">' + t('Motivo do cancelamento (opcional)') + '<textarea id="cancel-reason" class="field min-h-24 resize-y" maxlength="240" placeholder="Ex.: chuva forte, campo indisponível, nova data será divulgada."></textarea></label>' +
    '<div class="mt-6 flex justify-end gap-2"><button type="button" class="btn-secondary" data-close>Manter peneira</button><button type="submit" class="btn-danger">Cancelar peneira e avisar inscritos</button></div></form></div>'
  document.body.appendChild(wrapper)
  wrapper.querySelector('[data-close]').addEventListener('click', () => wrapper.remove())
  wrapper.addEventListener('click', (event) => { if (event.target === wrapper) wrapper.remove() })
  wrapper.querySelector('#cancel-tryout-form').addEventListener('submit', (event) => {
    event.preventDefault()
    const reason = wrapper.querySelector('#cancel-reason').value.trim() || 'A peneira foi cancelada por uma eventualidade.'
    const when = formatDate(tryout.date) + ' • ' + tryout.time
    ;(tryout.enrolled || []).forEach((email) => notify(email, 'Peneira cancelada', '"' + tryout.title + '" (' + when + ') foi cancelada. Motivo: ' + reason))
    state.tryouts = state.tryouts.filter((item) => item.id !== tryout.id)
    persist()
    wrapper.remove()
    render()
    toast('Peneira cancelada. ' + total + ' inscrito(s) avisado(s).')
  })
}

function openEnrolledModal(tryoutId) {
  const tryout = state.tryouts.find((item) => item.id === Number(tryoutId))
  if (!tryout) return
  const emails = Array.isArray(tryout.enrolled) ? tryout.enrolled : []
  const profiles = emails.map((email) => state.accounts.find((account) => account.email === email)?.profile).filter(Boolean)
  const wrapper = document.createElement('div')
  wrapper.className = 'fixed inset-0 z-[92] grid place-items-center bg-black/75 p-4'
  wrapper.innerHTML =
    '<div class="max-h-[86vh] w-full max-w-xl overflow-y-auto rounded-[28px] border border-white/10 bg-[#111] p-6" role="dialog" aria-modal="true"><div class="flex items-start justify-between gap-3"><div><span class="eyebrow">Inscritos • ' + emails.length + '/' + escapeHtml(tryout.seats) + '</span><h2 class="mt-2 text-2xl font-black">' + escapeHtml(tryout.title) + '</h2></div><button type="button" class="icon-button" data-close>' + icon('close') + '</button></div><div class="mt-5 space-y-2">' +
    (profiles.length ? profiles.map((profile) => '<div class="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[.03] p-4"><div class="flex items-center gap-3"><span class="avatar">' + avatar(profile.name) + '</span><div><p class="font-semibold">' + escapeHtml(profile.name) + '</p><p class="text-xs text-white/45"><span class="text-[#e2bb62]">Principal:</span> ' + escapeHtml(profile.pos) + ' • <span class="text-[#e2bb62]">Secundária:</span> ' + escapeHtml(profile.secondary && profile.secondary !== '—' ? profile.secondary : 'nenhuma') + '</p><p class="text-xs text-white/30">' + escapeHtml(getCategoryFromAge(getAgeFromProfile(profile.birth))) + ' • ' + escapeHtml(profile.city) + (profile.foot ? ' • ' + escapeHtml(profile.foot) : '') + '</p></div></div><div class="flex shrink-0 flex-col gap-1"><button type="button" class="btn-ghost" data-view-email="' + escapeHtml(profile.email) + '">Ver perfil</button><button type="button" class="btn-ghost" data-message-email="' + escapeHtml(profile.email) + '">Mensagem</button></div></div>').join('') : '<div class="rounded-2xl border border-dashed border-white/10 p-8 text-center text-white/40">Ainda não há inscritos nesta peneira.</div>') +
    '</div></div>'

  document.body.appendChild(wrapper)
  wrapper.querySelector('[data-close]').addEventListener('click', () => wrapper.remove())
  wrapper.querySelectorAll('[data-view-email]').forEach((button) => button.addEventListener('click', () => {
    const account = state.accounts.find((entry) => entry.email === button.dataset.viewEmail)
    const athlete = state.athletes.find((a) => a.id === account?.athleteId)
    if (!athlete) return
    wrapper.remove()
    openAthleteModal(athlete.id)
  }))
  wrapper.querySelectorAll('[data-message-email]').forEach((button) => button.addEventListener('click', () => {
    const profile = state.accounts.find((account) => account.email === button.dataset.messageEmail)?.profile
    if (!profile) return
    const account = state.accounts.find((entry) => entry.email === button.dataset.messageEmail)
    const athlete = state.athletes.find((a) => a.id === account?.athleteId) || state.athletes.find((a) => a.name === profile.name)
    wrapper.remove()
    if (athlete) startConversationForAthlete(athlete.id)
    else go('messages')
  }))
}

function openNotifications() {
  const wrapper = document.createElement('div')
  wrapper.className = 'fixed inset-0 z-[90] grid place-items-center bg-black/70 p-4'
  wrapper.innerHTML =
    '<div class="w-full max-w-lg rounded-[28px] border border-white/10 bg-[#111] p-6" role="dialog" aria-modal="true" aria-labelledby="notifications-title">' +
    '<div class="flex items-center justify-between gap-3"><div><span class="eyebrow">' + t('Central') + '</span><h2 id="notifications-title" class="mt-1 text-2xl font-black">Notificações</h2></div><button type="button" class="icon-button" data-close>' + icon('close') + '</button></div>' +
    '<div class="mt-5 space-y-2">' +
    (myNotifications().length ? myNotifications().map((n) => '<article class="rounded-2xl border border-white/8 bg-white/[.03] p-4"><div class="flex items-start justify-between gap-3"><div><p class="font-semibold">' + escapeHtml(n.title) + '</p><p class="mt-1 text-sm text-white/50">' + escapeHtml(n.text) + '</p></div><span class="text-xs text-white/30">' + escapeHtml(n.time) + '</span></div></article>').join('') : '<div class="rounded-2xl border border-dashed border-white/10 p-8 text-center text-white/40">Nenhuma notificação.</div>') +
    '</div><button type="button" class="btn-secondary mt-5 w-full" data-clear-notifications>Marcar como lidas</button></div>'

  document.body.appendChild(wrapper)
  wrapper.querySelector('[data-close]').addEventListener('click', () => wrapper.remove())
  wrapper.querySelector('[data-clear-notifications]').addEventListener('click', () => {
    const me = state.user?.email
    state.notifications = state.notifications.filter((n) => n.to !== me)
    persist()
    wrapper.remove()
    updateNotificationBadge()
    toast(t('Notificações limpas.'))
  })
}

function openMobileMenu() {
  const root = document.querySelector('#mobile-menu')
  if (!root) return
  root.innerHTML =
    '<div class="fixed inset-0 z-[70] bg-black/70 p-4 backdrop-blur-sm" data-close-mobile><div class="ml-auto w-[min(86vw,340px)] rounded-3xl border border-white/10 bg-[#111] p-4 shadow-2xl" role="dialog" aria-modal="true"><div class="flex items-center justify-between"><p class="font-bold">Navegação</p><button type="button" class="icon-button" data-close-mobile aria-label="Fechar menu">' + icon('close') + '</button></div><div class="mt-4 grid gap-2">' +
    (state.user?.role === 'staff'
      ? [['dashboard',t('Visão geral')],['athletes',t('Atletas')],['tryouts',t('Peneiras')],['messages',t('Conversas')],['profile',t('Perfil')]]
      : [['dashboard',t('Início')],['profile',t('Meu perfil')],['tryouts',t('Peneiras')],['messages',t('Conversas')]]
    ).map((item) => '<button type="button" class="nav-link justify-start" data-route="' + item[0] + '" data-close-mobile>' + item[1] + '</button>').join('') +
    '</div></div></div>'
  root.querySelectorAll('[data-route]').forEach((button) => button.addEventListener('click', () => { root.innerHTML = ''; go(button.dataset.route) }))
  root.querySelectorAll('[data-close-mobile]').forEach((button) => button.addEventListener('click', (event) => { if (event.target === button || button.hasAttribute('aria-label')) root.innerHTML = '' }))
}

function exportSelection() {
  const athletes = state.filteredAthletes || state.athletes
  const header = ['Nome', t('Idade'), t('Categoria'), t('Gênero'), t('Perna dominante'), t('Posição principal'), t('Posição secundária'), t('Cidade'), t('Estado'), 'Nota média', 'Avaliações', 'Votos']
  const rows = athletes.map((a) => [
    a.name,
    a.age,
    getCategoryFromAge(a.age),
    a.gender || 'Não informado',
    a.foot || 'Não informada',
    a.pos || 'Não informada',
    a.secondary && a.secondary !== '—' ? a.secondary : 'Nenhuma',
    a.city,
    a.state,
    ratingOf(a) ? ratingOf(a).toFixed(1).replace('.', ',') : 'Sem nota',
    (state.reviews[a.id] || []).length,
    a.votes + (state.votes[a.id] || 0),
  ])
  // Aspas em todas as células; texto que começaria com = + - @ vira texto (evita fórmulas no Excel)
  const cell = (value) => {
    let text = String(value ?? '')
    if (/^[=+\-@]/.test(text) && !/^-?\d+([.,]\d+)?$/.test(text)) text = "'" + text
    return '"' + text.replaceAll('"', '""') + '"'
  }
  const csv = [header].concat(rows).map((row) => row.map(cell).join(';')).join('\r\n')
  // BOM UTF-8: faz o Excel exibir acentos corretamente (São Paulo, Posição, "—" etc.)
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'academia-pele-atletas.csv'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
  toast('CSV exportado com ' + rows.length + ' atleta(s).')
}

function applyFilters() {
  const name = document.querySelector('#filter-name')?.value || ''
  const pos = document.querySelector('#filter-pos')?.value || ''
  const city = document.querySelector('#filter-city')?.value || ''
  const age = document.querySelector('#filter-age')?.value || ''
  const category = document.querySelector('#filter-category')?.value || ''
  const foot = document.querySelector('#filter-foot')?.value || ''
  const filtered = filterAthletes(state.athletes, { name, pos, city, age, category, foot })
  state.filteredAthletes = filtered
  const grid = document.querySelector('#athlete-grid')
  if (grid) grid.innerHTML = filtered.map((a) => athleteCard(a, true)).join('') || '<div class="md:col-span-2 xl:col-span-3 rounded-2xl border border-dashed border-white/10 p-10 text-center text-white/40">Nenhum atleta encontrado com esses filtros.</div>'
  const count = document.querySelector('#athlete-count')
  if (count) count.textContent = filtered.length + ' atleta(s) encontrado(s)'
  bindDynamicCards()
}

function updateCategoryPreview(prefix) {
  document.querySelector(prefix === 'reg' ? '#reg-feedback' : '#profile-feedback')?.classList.add('hidden')
  handleBirthPreview(prefix)
  const age = Number(document.querySelector('#' + prefix + '-age')?.value)
  const pos = document.querySelector('#' + prefix + '-pos')?.value
  const secondary = document.querySelector('#' + prefix + '-secondary')?.value
  if (pos && secondary && pos === secondary && secondary !== '—') {
    showFeedback(prefix === 'reg' ? 'reg-feedback' : 'profile-feedback', 'A posição secundária deve ser diferente da principal.', true)
  }
  if (age && (age < 7 || age > 20)) {
    showFeedback(prefix === 'reg' ? 'reg-feedback' : 'profile-feedback', 'Para esta plataforma, o cadastro esportivo aceita atletas de 7 a 20 anos.', true)
  }
}

async function saveProfile() {
  const p = state.profile || {}
  const birth = document.querySelector('#profile-birth').value
  const age = getAgeFromBirth(birth)
  const pos = document.querySelector('#profile-pos').value
  const secondary = document.querySelector('#profile-secondary').value
  const foot = document.querySelector('#profile-foot').value
  if (!foot) return showFeedback('profile-feedback', t('Selecione a perna dominante.'), true)
  if (!validBirthDate(birth) || age < 7 || age > 20) return showFeedback('profile-feedback', t('Informe uma data de nascimento válida para uma categoria até Sub-20.'), true)
  if (pos === secondary && secondary !== '—') return showFeedback('profile-feedback', t('A posição secundária deve ser diferente da principal.'), true)
  const newEmail = normalizeEmail(document.querySelector('#profile-email').value)
  const oldEmail = state.user.email
  if (newEmail !== oldEmail && state.accounts.some((entry) => entry.email === newEmail)) return showFeedback('profile-feedback', t('Já existe uma conta com esse e-mail.'), true)
  const next = {
    name: document.querySelector('#profile-name').value.trim(),
    cpf: document.querySelector('#profile-cpf').value.trim(),
    birth,
    gender: document.querySelector('#profile-gender').value,
    email: normalizeEmail(document.querySelector('#profile-email').value),
    phone: document.querySelector('#profile-phone').value.trim(),
    pos,
    secondary,
    foot,
    zip: document.querySelector('#profile-zip').value.trim(),
    city: document.querySelector('#profile-city').value.trim(),
    state: document.querySelector('#profile-state').value.trim().toUpperCase(),
    district: document.querySelector('#profile-district').value.trim(),
    address: document.querySelector('#profile-address').value.trim(),
    number: document.querySelector('#profile-number').value.trim(),
  }
  if (remote.enabled) {
    const failure = await updateOwnProfile(state.user.uid, {
      name: next.name,
      data: { birth: next.birth, gender: next.gender, foot: next.foot, pos: next.pos, secondary: next.secondary, city: next.city, state: next.state },
      privateData: { cpf: next.cpf, phone: next.phone, zip: next.zip, district: next.district, address: next.address, number: next.number },
    })
    if (failure) return showFeedback('profile-feedback', describeError(failure), true)
  }
  Object.assign(p, next)
  state.profile = p
  const account = state.accounts.find((entry) => entry.email === state.user.email)
  if (account) {
    account.email = p.email
    account.profile = p
  }
  if (state.user) {
    state.user.name = p.name
    state.user.email = p.email
  }
  if (oldEmail !== p.email) {
    state.tryouts.forEach((tryout) => { tryout.enrolled = (tryout.enrolled || []).map((email) => (email === oldEmail ? p.email : email)) })
    if (state.voted[oldEmail]) { state.voted[p.email] = state.voted[oldEmail]; delete state.voted[oldEmail] }
  }
  syncAthletes()
  persist()
  render()
  toast(t('Dados do jogador atualizados.'))
}

async function registerAccount() {
  const name = document.querySelector('#reg-name').value.trim()
  const cpf = document.querySelector('#reg-cpf').value.trim()
  const birth = document.querySelector('#reg-birth').value
  const gender = document.querySelector('#reg-gender').value
  const email = normalizeEmail(document.querySelector('#reg-email').value)
  const phone = document.querySelector('#reg-phone').value.trim()
  const pos = document.querySelector('#reg-pos').value
  const secondary = document.querySelector('#reg-secondary').value
  const foot = document.querySelector('#reg-foot').value
  const password = document.querySelector('#reg-password').value
  const confirm = document.querySelector('#reg-confirm').value
  const zip = document.querySelector('#reg-zip').value.trim()
  const city = document.querySelector('#reg-city').value.trim()
  const region = document.querySelector('#reg-state').value.trim().toUpperCase()
  const district = document.querySelector('#reg-district').value.trim()
  const address = document.querySelector('#reg-address').value.trim()
  const number = document.querySelector('#reg-number').value.trim()
  const age = getAgeFromBirth(birth)

  if (name.length < 3) return showFeedback('reg-feedback', 'Informe o nome completo.', true)
  if (!validateCPF(cpf)) return showFeedback('reg-feedback', 'CPF inválido. Confira os 11 dígitos.', true)
  if (!validBirthDate(birth)) return showFeedback('reg-feedback', 'Informe uma data de nascimento válida.', true)
  if (age < 7 || age > 20) return showFeedback('reg-feedback', 'A faixa desta plataforma é de 7 a 20 anos, até Sub-20.', true)
  if (!gender) return showFeedback('reg-feedback', 'Selecione o gênero.', true)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showFeedback('reg-feedback', 'Informe um e-mail válido.', true)
  if (!phone) return showFeedback('reg-feedback', 'Informe o telefone.', true)
  if (!pos) return showFeedback('reg-feedback', 'Selecione a posição principal.', true)
  if (!secondary) return showFeedback('reg-feedback', 'Selecione a posição secundária ou "—".', true)
  if (secondary === pos && secondary !== '—') return showFeedback('reg-feedback', 'A posição secundária deve ser diferente da principal.', true)
  if (!foot) return showFeedback('reg-feedback', 'Selecione a perna dominante.', true)
  if (!zip || !city || !region || !district || !address || !number) return showFeedback('reg-feedback', 'Preencha todo o endereço, incluindo cidade e estado.', true)
  if (password.length < 6) return showFeedback('reg-feedback', 'A senha precisa ter pelo menos 6 caracteres.', true)
  if (password !== confirm) return showFeedback('reg-feedback', 'As senhas não coincidem.', true)
  if (!remote.enabled) {
    if (state.accounts.some((account) => account.email === email)) return showFeedback('reg-feedback', 'Já existe uma conta com esse e-mail.', true)
    if (state.accounts.some((account) => account.cpf && account.cpf === cpf.replace(/\D/g, ''))) return showFeedback('reg-feedback', 'Já existe uma conta com esse CPF.', true)
  }

  const profile = {
    name,
    cpf: cpf.replace(/\D/g, ''),
    birth,
    gender,
    email,
    phone,
    pos,
    secondary,
    foot,
    city,
    state: region,
    address,
    number,
    district,
    zip,
  }

  if (remote.enabled) {
    const submit = document.querySelector('#register-form button[type="submit"]')
    submit?.setAttribute('disabled', '')
    const result = await remoteSignUp({
      email,
      password,
      name,
      publicData: { birth, gender, foot, pos, secondary, city, state: region },
      privateData: { cpf: profile.cpf, phone, zip, district, address, number },
    })
    if (result.error) {
      submit?.removeAttribute('disabled')
      return showFeedback('reg-feedback', describeError(result.error), true)
    }
    if (!result.session) {
      submit?.removeAttribute('disabled')
      return showFeedback('reg-feedback', 'Conta criada! Enviamos um e-mail de confirmação: confirme o endereço e depois faça login.')
    }
    try {
      await hydrateRemote(result.session.user.id)
    } catch (error) {
      submit?.removeAttribute('disabled')
      return showFeedback('reg-feedback', describeError(error), true)
    }
    notify(email, 'Conta criada', 'Seu cadastro foi concluído com categoria ' + getCategoryFromAge(age) + '.')
    persist()
    go('dashboard')
    toast(t('Conta criada com sucesso.'))
    return
  }

  const athleteId = Date.now()
  state.accounts.push({ email, password, role: 'player', cpf: profile.cpf, athleteId, profile })
  state.profile = profile
  state.user = { name, email, role: 'player' }
  syncAthletes()
  notify(email, 'Conta criada', 'Seu cadastro foi concluído com categoria ' + getCategoryFromAge(age) + '.')
  persist()
  go('dashboard')
  toast(t('Conta criada com sucesso.'))
}

async function finishRemoteLogin(uid, role, errorId) {
  try {
    await hydrateRemote(uid)
  } catch (error) {
    await clearRemoteSession()
    showFeedback(errorId, describeError(error), true)
    return false
  }
  if (state.user.role !== role) {
    const actual = state.user.role
    await clearRemoteSession()
    showFeedback(errorId, 'Esta conta é de ' + (actual === 'staff' ? 'funcionário' : 'jogador') + '. Selecione a aba correta acima.', true)
    return false
  }
  persist()
  go('dashboard')
  toast('Login realizado como ' + (role === 'staff' ? 'funcionário' : 'jogador') + '.')
  return true
}

async function loginAccount() {
  const email = normalizeEmail(document.querySelector('#login-email').value)
  const password = document.querySelector('#login-password').value
  const role = document.querySelector('.role-tab.active')?.dataset.role || 'player'
  const errorId = 'login-error'

  if (!email || !email.includes('@')) return showFeedback(errorId, 'Informe um e-mail válido.', true)

  if (remote.enabled) {
    const submit = document.querySelector('#login-form button[type="submit"]')
    submit?.setAttribute('disabled', '')
    const result = await remoteSignIn(email, password)
    if (result.error || !result.user) {
      submit?.removeAttribute('disabled')
      return showFeedback(errorId, describeError(result.error), true)
    }
    if (!(await finishRemoteLogin(result.user.id, role, errorId))) submit?.removeAttribute('disabled')
    return
  }

  const anyRole = state.accounts.find((entry) => entry.email === email)
  if (anyRole && anyRole.role !== role && anyRole.password === password) {
    return showFeedback(errorId, 'Esta conta é de ' + (anyRole.role === 'staff' ? 'funcionário' : 'jogador') + '. Selecione a aba correta acima.', true)
  }
  const account = state.accounts.find((entry) => entry.email === email && entry.role === role)
  if (!account || account.password !== password) {
    return showFeedback(errorId, role === 'staff'
      ? 'Funcionário não encontrado ou senha incorreta. Use a conta demo exibida abaixo.'
      : 'Conta não encontrada ou senha incorreta. Crie sua conta ou use a conta demo.', true)
  }

  state.user = { name: account.profile?.name || 'Usuário', email, role }
  state.profile = role === 'player' ? account.profile : null
  persist()
  go('dashboard')
  toast('Login realizado como ' + (role === 'staff' ? 'funcionário' : 'jogador') + '.')
}

async function loginDemo() {
  const role = document.querySelector('.role-tab.active')?.dataset.role || 'player'
  const errorId = 'login-error'

  if (remote.enabled) {
    const demo = role === 'staff'
      ? { email: 'funcionario@academiapele.com', password: 'Academia123!', name: 'Marina Lopes', publicData: { position: 'Olheira', phone: '(11) 99999-0000', city: 'São Paulo', state: 'SP' }, privateData: {} }
      : {
        email: 'gabriel@academiapele.com',
        password: 'Demo123!',
        name: defaultProfile.name,
        publicData: { birth: defaultProfile.birth, gender: defaultProfile.gender, foot: defaultProfile.foot, pos: defaultProfile.pos, secondary: defaultProfile.secondary, city: defaultProfile.city, state: defaultProfile.state },
        privateData: { cpf: '11144477735', phone: defaultProfile.phone, zip: defaultProfile.zip, district: defaultProfile.district, address: defaultProfile.address, number: defaultProfile.number },
      }
    let result = await remoteSignIn(demo.email, demo.password)
    if (result.error) {
      // primeira vez: cria a conta demo no Supabase e entra
      const created = await remoteSignUp(demo)
      if (created.error) return showFeedback(errorId, describeError(created.error), true)
      result = await remoteSignIn(demo.email, demo.password)
      if (result.error) return showFeedback(errorId, describeError(result.error), true)
    }
    if (await finishRemoteLogin(result.user.id, role, errorId)) toast(t('Conta demo carregada.'))
    return
  }

  const email = role === 'staff' ? 'funcionario@academiapele.com' : 'gabriel@academiapele.com'
  const account = state.accounts.find((entry) => entry.email === email)
  if (!account) return
  state.user = { name: account.profile.name, email: account.email, role }
  state.profile = role === 'player' ? account.profile : null
  persist()
  go('dashboard')
  toast(t('Conta demo carregada.'))
}

// Evita erros silenciosos em operações assíncronas (rede, Supabase...)
function safely(promise) {
  promise.catch((error) => {
    console.error(error)
    toast(describeError(error), 'error')
    document.querySelectorAll('form button[type="submit"][disabled]').forEach((button) => button.removeAttribute('disabled'))
  })
}

function initLoginRoleButtons() {
  document.querySelectorAll('[data-role]').forEach((button) => button.addEventListener('click', () => {
    document.querySelectorAll('[data-role]').forEach((item) => item.classList.toggle('active', item === button))
  }))
}

// Atualiza as listas de atletas sem perder os filtros digitados.
function refreshAthleteViews() {
  if (document.querySelector('#athlete-grid')) applyFilters()
  else render()
}

// Vota ou retira o voto (alterna). Retorna true se o usuário ficou com o voto ativo.
function castVote(athleteId) {
  const voter = state.user?.email || 'anon'
  let voted
  if (hasVoted(state, athleteId, voter)) {
    removeVote(state, athleteId, voter)
    voted = false
    toast(t('Voto retirado.'))
  } else {
    registerVote(state, athleteId, voter)
    voted = true
    toast(t('Voto registrado com sucesso.'))
  }
  persist()
  refreshAthleteViews()
  return voted
}

function bindDynamicCards() {
  app.querySelectorAll('[data-open-athlete]').forEach((button) => button.addEventListener('click', () => openAthleteModal(Number(button.dataset.openAthlete))))
  app.querySelectorAll('[data-message-athlete]').forEach((button) => button.addEventListener('click', () => startConversationForAthlete(Number(button.dataset.messageAthlete))))
  app.querySelectorAll('[data-favorite]').forEach((button) => button.addEventListener('click', (event) => {
    event.stopPropagation()
    const id = Number(button.dataset.favorite)
    toggleFavorite(state, id)
    persist()
    refreshAthleteViews()
    toast(t(state.favorites.includes(id) ? 'Atleta adicionado aos favoritos.' : 'Atleta removido dos favoritos.'))
  }))
  app.querySelectorAll('[data-vote]').forEach((button) => button.addEventListener('click', (event) => {
    event.stopPropagation()
    castVote(Number(button.dataset.vote))
  }))
}

function bind() {
  document.querySelectorAll('[data-route]').forEach((button) => button.addEventListener('click', (event) => {
    event.preventDefault()
    go(button.dataset.route)
  }))
  initLoginRoleButtons()
  bindDynamicCards()

  document.querySelectorAll('[data-action="change-lang"]').forEach((button) => button.addEventListener('click', () => {
    document.body.dataset.langChosen = ''
    localStorage.removeItem('ap_lang')
    render()
  }))
  document.querySelectorAll('[data-action="home"]').forEach((button) => button.addEventListener('click', () => {
    document.querySelectorAll('body > div.fixed.inset-0').forEach((modal) => modal.remove())
    if (currentRoute() === 'dashboard') window.scrollTo({ top: 0, behavior: 'smooth' })
    else go('dashboard')
  }))
  document.querySelectorAll('[data-action="notifications"]').forEach((button) => button.addEventListener('click', openNotifications))
  document.querySelectorAll('[data-action="menu"]').forEach((button) => button.addEventListener('click', openMobileMenu))

  document.querySelectorAll('[data-action="clearFilters"]').forEach((button) => button.addEventListener('click', () => {
    ;['filter-name', 'filter-pos', 'filter-foot', 'filter-city', 'filter-age', 'filter-category'].forEach((id) => {
      const field = document.querySelector('#' + id)
      if (field) field.value = ''
    })
    applyFilters()
  }))

  document.querySelectorAll('[data-action="export"]').forEach((button) => button.addEventListener('click', exportSelection))
  document.querySelectorAll('[data-action="logout"]').forEach((button) => button.addEventListener('click', async () => {
    if (remote.enabled) {
      await clearRemoteSession({ navigate: true })
    } else {
      state.user = null
      state.profile = null
      persist()
      go('login')
    }
    toast(t('Sessão encerrada.'))
  }))

  document.querySelectorAll('[data-action="openTryout"]').forEach((button) => button.addEventListener('click', openTryoutModal))
  document.querySelectorAll('[data-action="withdraw"]').forEach((button) => button.addEventListener('click', () => confirmWithdraw(Number(button.dataset.id))))
  document.querySelectorAll('[data-action="cancel-tryout"]').forEach((button) => button.addEventListener('click', () => openCancelTryoutModal(Number(button.dataset.id))))
  document.querySelectorAll('[data-action="view-enrolled"]').forEach((button) => button.addEventListener('click', () => openEnrolledModal(Number(button.dataset.id))))

  document.querySelectorAll('[data-action="enroll"]').forEach((button) => button.addEventListener('click', () => {
    const tryout = state.tryouts.find((item) => item.id === Number(button.dataset.id))
    if (!tryout || state.user?.role !== 'player') return
    const enrolled = Array.isArray(tryout.enrolled) ? tryout.enrolled : (tryout.enrolled = [])
    if (enrolled.includes(state.user.email)) return
    const vacancies = Number(tryout.seats) - enrolled.length
    const category = getCategoryFromAge(getAgeFromProfile(state.profile?.birth))
    const compatible = tryout.positions.includes(state.profile?.pos) || tryout.positions.includes(state.profile?.secondary)
    if (tryout.category && tryout.category !== category) return toast(t('Sua categoria não corresponde à desta peneira.'), 'error')
    if (!compatible) return toast(t('Sua posição não está entre as posições aceitas.'), 'error')
    if (vacancies <= 0) return toast(t('Não há mais vagas nesta peneira.'), 'error')
    enrolled.push(state.user.email)
    notifyTryoutStaff(tryout, 'Nova inscrição', state.user.name + ' se inscreveu em "' + tryout.title + '" (' + enrolled.length + '/' + tryout.seats + ').')
    notify(state.user.email, t('Inscrição confirmada'), 'Você se inscreveu em ' + tryout.title + '.')
    persist()
    render()
    toast(t('Inscrição confirmada.'))
  }))

  const filterIds = ['filter-name', 'filter-pos', 'filter-foot', 'filter-city', 'filter-age', 'filter-category']
  filterIds.forEach((id) => {
    const field = document.querySelector('#' + id)
    if (field) field.addEventListener(field.tagName === 'INPUT' ? 'input' : 'change', applyFilters)
  })

  const registerForm = document.querySelector('#register-form')
  if (registerForm) {
    document.querySelector('#reg-cpf').addEventListener('input', (event) => formatCPF(event.target))
    document.querySelector('#reg-birth').addEventListener('change', () => updateCategoryPreview('reg'))
    document.querySelector('#reg-birth').addEventListener('input', () => updateCategoryPreview('reg'))
    registerForm.addEventListener('submit', (event) => { event.preventDefault(); safely(registerAccount()) })
  }

  const profileForm = document.querySelector('#profile-form')
  if (profileForm) {
    document.querySelector('#profile-birth').addEventListener('change', () => updateCategoryPreview('profile'))
    profileForm.addEventListener('submit', (event) => { event.preventDefault(); safely(saveProfile()) })
  }

  const loginForm = document.querySelector('#login-form')
  if (loginForm) loginForm.addEventListener('submit', (event) => { event.preventDefault(); safely(loginAccount()) })
  document.querySelectorAll('[data-action="forgot-password"]').forEach((button) => button.addEventListener('click', forgotPassword))
  const recoveryForm = document.querySelector('#password-recovery-form')
  if (recoveryForm) recoveryForm.addEventListener('submit', (event) => { event.preventDefault(); safely(saveRecoveredPassword()) })
  document.querySelectorAll('[data-action="demo"]').forEach((button) => button.addEventListener('click', () => safely(loginDemo())))

  const conversationSearch = document.querySelector('#conversation-search')
  if (conversationSearch) conversationSearch.addEventListener('input', () => {
    const items = [...document.querySelectorAll('[data-thread]')].map((el) => ({ name: el.dataset.name, subtitle: el.dataset.subtitle, el }))
    const visible = searchConversations(items, conversationSearch.value)
    const visibleSet = new Set(visible.map((item) => item.el))
    items.forEach((item) => { item.el.hidden = !visibleSet.has(item.el) })
    const empty = document.querySelector('#conversation-empty')
    if (empty) empty.hidden = visibleSet.size > 0
  })

  bindConversationItems()
  document.querySelectorAll('[data-action="chat-back"]').forEach((button) => button.addEventListener('click', closeMobileChat))

  const chat = document.querySelector('#chat-messages')
  if (chat) chat.scrollTop = chat.scrollHeight

  const messageForm = document.querySelector('#message-form')
  if (messageForm) messageForm.addEventListener('submit', async (event) => {
    event.preventDefault()
    const field = document.querySelector('#message-input')
    const text = field.value.trim()
    if (!text) return
    field.value = ''
    field.focus()
    const sent = await sendChatMessage(text)
    if (sent === false && !field.value) field.value = text
  })
}

// Tela mostrada uma única vez (antes do login) para escolher o idioma. Pode ser
// reaberta pelo botão de idioma no cabeçalho ou no rodapé da tela de login.
function languagePage() {
  return '<div class="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_center,_rgba(210,173,88,.12),_transparent_30%),#070707] px-4 py-8 text-white">' +
    '<div class="w-full max-w-md rounded-[32px] border border-white/10 bg-white/[.025] p-8 text-center">' +
    '<img src="./assets/brand/simbolo.jpg" alt="Academia Pelé" class="mx-auto h-20 w-20 rounded-3xl object-contain"/>' +
    '<h1 class="mt-6 text-2xl font-black">Escolha seu idioma<br/><span class="text-[#e1bb62]">Elige tu idioma</span></h1>' +
    '<div class="mt-8 grid gap-3">' + LANGS.map((lang) =>
      '<button type="button" class="btn-secondary w-full !justify-center !py-4 text-base" data-lang="' + lang.code + '"><span class="mr-2 text-xl">' + lang.flag + '</span>' + lang.label + '</button>'
    ).join('') + '</div>' +
    '<p class="mt-6 text-xs text-white/35">Você pode mudar isso depois, a qualquer momento.<br/>Puedes cambiarlo después, en cualquier momento.</p>' +
    '</div></div>'
}

function render() {
  const route = currentRoute()
  if (!getLang() && !document.body.dataset.langChosen) {
    app.innerHTML = languagePage()
    app.querySelectorAll('[data-lang]').forEach((button) => button.addEventListener('click', () => {
      setLang(button.dataset.lang)
      render()
    }))
    return
  }
  if (route !== 'messages') mobileChatOpen = false
  let pushChatEntry = false
  if (route === 'messages' && openChatOnArrive) {
    openChatOnArrive = false
    if (isMobileView()) {
      mobileChatOpen = true
      pushChatEntry = true
    }
  }
  if (!state.user && !['login', 'register', 'reset-password'].includes(route)) {
    go('login')
    return
  }
  if (state.user && ['login', 'register'].includes(route) && !passwordRecovery) {
    go('dashboard')
    return
  }
  if (state.user?.role === 'player' && route === 'athletes') {
    go('dashboard')
    return
  }

  let view
  if (route === 'login') view = loginPage()
  else if (route === 'register') view = registerPage()
  else if (route === 'reset-password') view = passwordRecoveryPage()
  else if (route === 'dashboard') view = dashboard(state.user.role)
  else if (route === 'athletes') view = athletesPage()
  else if (route === 'profile') view = profilePage()
  else if (route === 'tryouts') view = tryoutsPage()
  else if (route === 'messages') view = messagesPage()
  else view = dashboard(state.user.role)

  app.innerHTML = view
  bind()
  if (pushChatEntry) history.pushState({ apChat: true }, '')
  document.body.classList.toggle('chat-open', route === 'messages' && mobileChatOpen)
  updateMessageBadge()
  if (route !== lastRoute) window.scrollTo(0, 0)
  lastRoute = route
  if (['athletes', 'messages', 'dashboard'].includes(route)) refreshRemote()
}

// Atualização automática: quando outra aba/janela altera os dados (inscrição, cancelamento,
// mensagem...), esta tela é atualizada sem precisar recarregar.
function reloadSharedState() {
  state.tryouts = readStorage('ap_tryouts', state.tryouts)
  state.notifications = readStorage('ap_notifications', state.notifications)
  if (!remote.enabled) {
    state.messages = readStorage('ap_messages', state.messages)
    state.accounts = readStorage('ap_accounts', state.accounts)
  }
  state.reviews = readStorage('ap_reviews', state.reviews)
  state.votes = readStorage('ap_votes', state.votes)
  state.voted = readStorage('ap_voted', state.voted)
  state.favorites = readStorage('ap_favorites', state.favorites)
  syncAthletes()
}

window.addEventListener('storage', (event) => {
  if (!state.user || !event.key || !event.key.startsWith('ap_') || ['ap_user', 'ap_profile', 'ap_lastread'].includes(event.key)) return
  if (remote.enabled && ['ap_accounts', 'ap_messages'].includes(event.key)) return
  const before = myNotifications().length
  reloadSharedState()
  const after = myNotifications().length
  const route = currentRoute()
  if (route === 'athletes') applyFilters()
  else if (route === 'messages') { if (!remote.enabled && !document.querySelector('#message-input')?.value) render() }
  else if (route !== 'profile') render()
  updateNotificationBadge()
  if (after > before) toast(t('Você recebeu uma nova notificação.'))
})

window.addEventListener('hashchange', () => { if (booted) render() })
// Botão "voltar" do celular: sai da conversa aberta e volta para a lista de contatos
window.addEventListener('popstate', () => {
  if (booted && mobileChatOpen && !history.state?.apChat) {
    mobileChatOpen = false
    render()
  }
})
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') refreshRemote(true) })
window.addEventListener('online', () => refreshRemote(true))
setInterval(() => { if (document.visibilityState === 'visible') refreshRemote() }, 30000)
// ESC fecha o modal aberto mais recentemente
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return
  const modals = document.querySelectorAll('body > div.fixed.inset-0')
  if (modals.length) modals[modals.length - 1].remove()
})

async function boot() {
  app.innerHTML = '<div class="grid min-h-screen place-items-center text-sm text-white/40">Carregando...</div>'
  if (await initRemote()) {
    // Com o Supabase, a sessão vem do servidor (não do localStorage)
    state.user = null
    state.profile = null
    state.accounts = []
    state.messages = []
    try {
      const session = await getSessionUser()
      if (session) await hydrateRemote(session.uid)
    } catch (error) {
      console.warn('[Supabase] não foi possível restaurar a sessão:', error)
      await clearRemoteSession()
    }
  } else {
    ensureReadBaseline('local')
  }
  syncAthletes()
  booted = true
  render()
}
boot()
