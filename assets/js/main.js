import {
  validCPF as validateCPF,
  maskCPF as formatCPF,
  getAgeFromBirth,
  getCategoryFromAge,
  validBirthDate,
  normalizeEmail,
} from './validation.js'
import { filterAthletes } from './filters.js'
import { toggleFavorite } from './feed.js'
import { LANGS, getLang, setLang, t } from './i18n.js'
import { designSystemPage, bindDesignSystem } from './design-system.js'
import { cropPhoto, illustratedAvatar } from './avatar.js'
import { initSmoothScroll, initSpotlight, paintScreen, enterPage, scrollToTop, scrollToElement } from './motion.js'
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
  disableRemote,
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
  fetchEvaluations,
  createEvaluation,
  removeEvaluation,
  fetchTryouts,
  createTryout,
  cancelTryout,
  enrollTryout,
  withdrawTryout,
  fetchMessages,
  sendMessage,
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
  { demo: true, id: 1, foot: 'Destro', email: 'gabriel@academiapele.com', name: 'Gabriel Martins', age: 18, birth: '2008-03-14', gender: 'Masculino', city: 'São Paulo', state: 'SP', pos: 'Atacante', secondary: 'Ponta', rating: 8.8, status: 'Em observação', color: 'from-amber-400 to-yellow-200', tags: ['Finalização', 'Velocidade', 'Drible'] },
  { demo: true, id: 2, foot: 'Canhoto', name: 'Lucas Ferreira', age: 19, birth: '2007-07-20', gender: 'Masculino', city: 'Osasco', state: 'SP', pos: 'Meia', secondary: 'Volante', rating: 8.4, status: 'Disponível', color: 'from-sky-400 to-cyan-200', tags: ['Passe', 'Visão de jogo', 'Resistência'] },
  { demo: true, id: 3, foot: 'Destro', name: 'Rafael Souza', age: 17, birth: '2009-01-22', gender: 'Masculino', city: 'Guarulhos', state: 'SP', pos: 'Zagueiro', secondary: 'Lateral', rating: 8.1, status: 'Em avaliação', color: 'from-violet-400 to-fuchsia-200', tags: ['Marcação', 'Força', 'Cabeceio'] },
  { demo: true, id: 4, foot: 'Destro', name: 'João Vitor', age: 18, birth: '2008-10-11', gender: 'Masculino', city: 'Campinas', state: 'SP', pos: 'Volante', secondary: 'Meia', rating: 8.6, status: 'Destaque', color: 'from-emerald-400 to-lime-200', tags: ['Desarme', 'Passe', 'Leitura'] },
  { demo: true, id: 5, foot: 'Destro', name: 'Pedro Henrique', age: 20, birth: '2006-05-05', gender: 'Masculino', city: 'Santos', state: 'SP', pos: 'Goleiro', secondary: '—', rating: 8.0, status: 'Disponível', color: 'from-slate-300 to-slate-100', tags: ['Reflexo', 'Posicionamento', 'Saída'] },
  { demo: true, id: 6, foot: 'Canhoto', name: 'Matheus Alves', age: 18, birth: '2008-12-02', gender: 'Masculino', city: 'Sorocaba', state: 'SP', pos: 'Ponta', secondary: 'Atacante', rating: 8.7, status: 'Destaque', color: 'from-orange-400 to-amber-200', tags: ['Velocidade', 'Drible', 'Cruzamento'] },
]

const defaultTryouts = [
  { id: 1, title: 'Peneira Sub-20 — Atacantes', date: '2026-11-07', time: '14:00', city: 'São Paulo', state: 'SP', location: 'Centro de Treinamento Pelé', category: 'Sub-20', positions: ['Atacante', 'Ponta'], seats: 12, enrolled: ['gabriel@academiapele.com'] },
  { id: 2, title: 'Avaliação Sub-20 — Meio-campo', date: '2026-11-14', time: '09:00', city: 'Osasco', state: 'SP', location: 'Arena Oeste', category: 'Sub-20', positions: ['Meia', 'Volante'], seats: 18, enrolled: [] },
  { id: 3, title: 'Goleiros em Destaque', date: '2026-11-21', time: '10:30', city: 'Barueri', state: 'SP', location: 'Centro de Treinamento Oeste', category: 'Sub-20', positions: ['Goleiro'], seats: 8, enrolled: [] },
]

// Os votos foram removidos (avaliação é a única medida do atleta): apaga o que ficou salvo no navegador.
try { localStorage.removeItem('ap_votes'); localStorage.removeItem('ap_voted') } catch {}

const state = {
  athletes: defaultAthletes,
  filteredAthletes: defaultAthletes,
  user: readStorage('ap_user', null),
  accounts: readStorage('ap_accounts', []),
  favorites: readStorage('ap_favorites', []),
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
  // Com o Supabase, contas, mensagens e peneiras vivem no servidor; o navegador guarda só preferências.
  if (!remote.enabled) {
    localStorage.setItem('ap_user', JSON.stringify(state.user))
    localStorage.setItem('ap_accounts', JSON.stringify(state.accounts))
    localStorage.setItem('ap_profile', JSON.stringify(state.profile))
    localStorage.setItem('ap_messages', JSON.stringify(state.messages))
    localStorage.setItem('ap_tryouts', JSON.stringify(state.tryouts))
  }
  localStorage.setItem('ap_favorites', JSON.stringify(state.favorites))
  localStorage.setItem('ap_reviews', JSON.stringify(state.reviews))
  localStorage.setItem('ap_notifications', JSON.stringify(state.notifications))
}

// Cria um aviso para um usuário específico (identificado pelo e-mail).
function notify(to, title, text) {
  if (!to) return
  state.notifications.unshift({ id: Date.now() * 1000 + (notificationSeq++ % 1000), to, title, text, time: 'Agora' })
}

// O id da notificação carrega o horário de criação (Date.now() * 1000 + seq).
function notificationTime(n) {
  const ts = Math.floor(Number(n.id) / 1000)
  return ts > 1e12 ? fmtListTime(ts) : (n.time || '')
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
  badge.hidden = !count
}


function seedDemoAccounts() {
  DEMO_STAFF.forEach((demo) => {
    if (!state.accounts.some((account) => account.email === demo.email)) {
      state.accounts.push({
        email: demo.email,
        password: 'Academia123!',
        role: 'staff',
        profile: { name: demo.name, email: demo.email, phone: demo.phone, position: demo.position, city: 'São Paulo', state: 'SP', demo: true },
      })
    }
    const account = state.accounts.find((entry) => entry.email === demo.email)
    if (account?.profile) account.profile.demo = true // contas salvas antes desta versão
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
    photo: profile.photo || null,
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
      status: 'Novo cadastro',
      color: AVATAR_COLORS[index % AVATAR_COLORS.length],
      tags: [account.profile.pos, account.profile.secondary].filter((item) => item && item !== '—'),
    }))
  state.athletes = base.concat(registered)
  state.filteredAthletes = state.athletes
}

// =====================================================================================
// Conversas: identidade, não lidas e layout do celular
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
        person: a,
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
    subtitle: (a.profile?.position || 'Profissional') + ' • ' + (a.profile?.city || 'Pelé Academia'),
    avatar: a.profile?.name || a.email,
    person: { name: a.profile?.name || a.email, photo: a.profile?.photo || null, demo: !!a.profile?.demo, id: a.email, group: 'staff' },
    key: remote.enabled ? threadKey(state.user.uid, a.uid) : threadKey(me.id, a.email),
    athleteRef: state.user.uid,
    staffRef: a.uid,
  }))
}

const messageTs = (message) => Number(message.ts) || Number(message.id) || 0
const lastMessageOf = (key) => state.messages.filter((m) => m.thread === key).reduce((last, m) => (!last || messageTs(m) >= messageTs(last) ? m : last), null)

// Leitura é por pessoa: duas contas no mesmo navegador (ex.: demonstração) não compartilham o "lido".
const readKey = (thread) => (state.user?.uid || state.user?.email || 'anon') + '|' + thread

function unreadCount(key) {
  const readUntil = state.lastRead[readKey(key)] || 0
  return state.messages.filter((m) => m.thread === key && m.senderRole !== myRole() && messageTs(m) > readUntil).length
}

function markRead(key) {
  const last = lastMessageOf(key)
  if (!last || messageTs(last) <= (state.lastRead[readKey(key)] || 0)) return
  state.lastRead[readKey(key)] = messageTs(last)
  localStorage.setItem('ap_lastread', JSON.stringify(state.lastRead))
}

// Primeira vez neste aparelho: não sabemos o que foi lido em outro lugar. Se a pessoa respondeu depois de uma
// mensagem, ela viu essa mensagem; o que chegou depois da última resposta dela conta como não lido.
function ensureReadBaseline(tag) {
  const flag = '__init:' + tag
  if (state.lastRead[flag]) return
  state.messages.forEach((m) => {
    if (m.senderRole === myRole()) state.lastRead[readKey(m.thread)] = Math.max(state.lastRead[readKey(m.thread)] || 0, messageTs(m))
  })
  state.lastRead[flag] = 1
  localStorage.setItem('ap_lastread', JSON.stringify(state.lastRead))
}

// Resumo das não lidas: total, quem mandou e a primeira conversa com novidade.
function unreadSummary() {
  if (!state.user) return { total: 0, people: [], first: null }
  const withUnread = getConversations().map((c) => ({ c, n: unreadCount(c.key) })).filter((item) => item.n > 0)
  return { total: withUnread.reduce((sum, item) => sum + item.n, 0), people: withUnread.map((item) => item.c.name), first: withUnread[0]?.c || null }
}

const BASE_TITLE = 'TIER ZERO | Pelé Academia'
function updateMessageBadge() {
  const { total } = unreadSummary()
  const text = total > 9 ? '9+' : String(total)
  const label = total ? t('Conversas') + ', ' + plural(total, 'mensagem não lida', 'mensagens não lidas') : t('Conversas')
  document.querySelectorAll('[data-msg-badge]').forEach((badge) => {
    badge.textContent = text
    badge.hidden = !total
  })
  document.querySelectorAll('[data-route="messages"][data-badge-host]').forEach((button) => button.setAttribute('aria-label', label))
  // Contagem no título da aba, como nos webmails: aparece mesmo com a aba em segundo plano.
  document.title = (total ? '(' + text + ') ' : '') + BASE_TITLE
}

function openUnreadConversation() {
  const { first } = unreadSummary()
  if (first) activeThread = first.id
  openChatOnArrive = true
  go('messages')
}

// Aviso ao entrar: "3 mensagens novas de Marina Lopes" com a ação Abrir.
function announceUnread() {
  const { total, people } = unreadSummary()
  if (!total) return
  const who = people.length === 1 ? people[0] : plural(people.length, 'pessoa', 'pessoas')
  toast(plural(total, 'mensagem nova', 'mensagens novas') + ' ' + t('de') + ' ' + who + '.', 'message', { label: t('Abrir'), onClick: openUnreadConversation })
}

// Enquanto a pessoa navega fora das conversas: confere mensagens novas a cada 30 s (só com a aba visível).
function startInboxWatch() {
  setInterval(async () => {
    if (!remote.enabled || !state.user?.uid || document.hidden || currentRoute() === 'messages') return
    const known = new Set(state.messages.map((m) => m.id))
    await refreshRemoteMessages()
    const fresh = state.messages.filter((m) => !known.has(m.id) && m.senderRole !== myRole())
    updateMessageBadge()
    if (!fresh.length) return
    const conversation = getConversations().find((c) => c.key === fresh[fresh.length - 1].thread)
    toast(fresh.length === 1 && conversation ? t('Nova mensagem de') + ' ' + conversation.name + '.' : plural(fresh.length, 'mensagem nova', 'mensagens novas') + '.', 'message', { label: t('Abrir'), onClick: () => { if (conversation) activeThread = conversation.id; openChatOnArrive = true; go('messages') } })
  }, 30000)
}

// Mensagens agrupadas: mesma pessoa em até 5 min forma um bloco com um só horário; o bloco termina na virada do dia.
const GROUP_WINDOW = 5 * 60 * 1000
function messageBubble(message, role, place = 'single') {
  const mine = message.senderRole === role
  const showMeta = place === 'single' || place === 'last'
  return '<div class="bubble-row ' + (mine ? 'is-mine' : '') + ' is-' + place + '" data-msg-id="' + escapeHtml(message.id) + '"><div class="bubble">' +
    '<p class="whitespace-pre-wrap break-words" translate="no">' + escapeHtml(message.text) + '</p>' +
    (showMeta ? '<p class="bubble-meta"><time>' + escapeHtml(fmtClock(messageTs(message)) || message.time || '') + '</time>' + (mine ? icon('check', 'size-3.5') + '<span class="sr-only">' + t('enviada') + '</span>' : '') + '</p>' : '') +
    '</div></div>'
}

function dayLabel(ts) {
  const date = new Date(ts)
  const today = new Date()
  const yesterday = new Date(Date.now() - 864e5)
  if (date.toDateString() === today.toDateString()) return t('Hoje')
  if (date.toDateString() === yesterday.toDateString()) return t('Ontem')
  return date.toLocaleDateString(timeLocale(), { day: 'numeric', month: 'long', year: date.getFullYear() === today.getFullYear() ? undefined : 'numeric' })
}

// Redesenha o histórico da conversa aberta (mantém agrupamento e separadores corretos) e anima a nova mensagem.
function appendBubble(message) {
  const box = document.querySelector('#chat-messages')
  if (!box || message.thread !== activeConversation?.key) return
  const history = state.messages.filter((m) => m.thread === message.thread).sort((x, y) => messageTs(x) - messageTs(y))
  box.innerHTML = renderHistory(history, myRole())
  box.querySelector('[data-msg-id="' + CSS.escape(String(message.id)) + '"]')?.classList.add('is-new')
  box.scrollTop = box.scrollHeight
}

function conversationItemsHtml(conversations, selectedId) {
  const role = myRole()
  return conversations.map((c) => {
    const last = lastMessageOf(c.key)
    const unread = c.id === selectedId && (!isMobileView() || mobileChatOpen) ? 0 : unreadCount(c.key)
    return '<button type="button" class="conversation-item ' + (c.id === selectedId ? 'selected' : '') + '" data-thread="' + escapeHtml(c.id) + '" data-name="' + escapeHtml(c.name) + '" data-subtitle="' + escapeHtml(c.subtitle) + '">' +
      personAvatar(c.person || { name: c.avatar }) +
      '<span class="min-w-0 flex-1 text-left"><strong class="block truncate">' + escapeHtml(c.name) + '</strong>' +
      '<small class="conv-sub block truncate text-ink-soft">' + escapeHtml(c.subtitle) + '</small>' +
      '<small class="conv-preview truncate text-ink-soft">' + (last ? (last.senderRole === role ? '<span>Você: </span>' : '') + '<span translate="no">' + escapeHtml(last.text) + '</span>' : '<span>' + escapeHtml(c.subtitle) + '</span>') + '</small></span>' +
      '<span class="conv-meta">' + (last ? '<time class="conv-time">' + escapeHtml(fmtListTime(messageTs(last))) + '</time>' : '') + (unread ? '<b class="conv-unread">' + unread + '</b>' : '') + '</span></button>'
  }).join('') + '<p id="conversation-empty" class="p-4 text-center text-xs text-ink-soft" hidden>Nenhum resultado encontrado.</p>'
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
function mapRemoteMessage(row) {
  return {
    id: Number(row.id), thread: threadKey(row.athlete_id, row.staff_id), text: row.body,
    senderRole: row.sender_id === row.staff_id ? 'staff' : 'player', ts: Date.parse(row.created_at), remote: true,
  }
}

async function refreshRemoteMessages() {
  if (!remote.enabled || !state.user?.uid) return
  try {
    state.messages = (await fetchMessages()).map(mapRemoteMessage)
  } catch (error) {
    console.warn('[Supabase] não foi possível carregar mensagens:', error)
  }
}

// Sem Realtime (custo): enquanto a tela de conversas está aberta e visível, busca novas mensagens a cada 8 s.
let messagePoll = null
function syncMessagePolling(route) {
  clearInterval(messagePoll)
  messagePoll = null
  if (route !== 'messages' || !remote.enabled) return
  messagePoll = setInterval(async () => {
    if (document.hidden) return
    const known = new Set(state.messages.map((m) => m.id))
    await refreshRemoteMessages()
    const fresh = state.messages.filter((m) => !known.has(m.id))
    if (!fresh.length) return
    fresh.filter((m) => m.thread === activeConversation?.key).forEach(appendBubble)
    if (activeConversation) markRead(activeConversation.key)
    updateConversationList()
    updateMessageBadge()
  }, 8000)
}

// Mesmo limite do servidor (8 por minuto): no modo local também, e no remoto avisa antes de ir à rede.
const recentSends = []
async function sendChatMessage(text) {
  const conversation = activeConversation
  if (!conversation) return false
  const now = Date.now()
  while (recentSends.length && now - recentSends[0] > 60000) recentSends.shift()
  if (recentSends.length >= 8) {
    toast(t('Você enviou muitas mensagens seguidas. Aguarde um minuto.'), 'error')
    return false
  }
  recentSends.push(now)
  if (remote.enabled) {
    const { row, error } = await sendMessage({ athleteId: conversation.athleteRef, staffId: conversation.staffRef, senderId: state.user.uid, body: text })
    if (error) {
      toast(describeError(error), 'error')
      return false
    }
    const message = mapRemoteMessage(row)
    state.messages.push(message)
    appendBubble(message)
    markRead(conversation.key)
    return true
  }
  const role = myRole()
  const message = { id: Date.now(), thread: conversation.key, senderRole: role, text, ts: Date.now() }
  state.messages.push(message)
  persist()
  appendBubble(message)
  markRead(conversation.key)
  return true
}

// ---------- sessão remota (Supabase) ----------
function remoteAccount(row) {
  return {
    email: row.email,
    role: row.role,
    athleteId: Number(row.athlete_num),
    uid: row.id,
    profile: { ...(row.data || {}), name: row.name, email: row.email, demo: DEMO_STAFF.some((demo) => demo.email === row.email) },
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
  state.messages = []
  await refreshRemoteMessages()
  ensureReadBaseline(uid)
  stopAuthWatch?.()
  stopAuthWatch = onSignedOut((event) => {
    if (event === 'PASSWORD_RECOVERY') {
      passwordRecovery = true
      render()
      return
    }
    if (state.user && remote.enabled) clearRemoteSession({ navigate: true, signOut: false })
  })
  lastRemoteRefresh = Date.now()
  syncAthletes()
  try {
    await refreshRemoteEvaluations()
  } catch (error) {
    // A conta deve conseguir entrar mesmo antes de a migration de avaliações
    // ser aplicada; a sincronização será tentada novamente na próxima atualização.
    console.warn('[Supabase] não foi possível carregar avaliações:', error)
  }
  state.tryoutsStatus = 'loading'
  const loadingSince = performance.now()
  refreshRemoteTryouts().then(() => {
    const elapsed = performance.now() - loadingSince
    // Até 300 ms o loader nem chega a aparecer (CSS); se apareceu, fica no mínimo 600 ms para não piscar.
    const hold = elapsed < 300 ? 0 : Math.max(0, 900 - elapsed)
    setTimeout(() => { if (['tryouts', 'dashboard'].includes(currentRoute())) render() }, hold)
  })
}

// Peneiras do Supabase → formato usado pelas telas. `enrolled` guarda e-mails: funcionários recebem
// todos; atletas recebem só o próprio, e o restante é preenchido com '' apenas para a contagem de vagas.
function mapRemoteTryout(row) {
  const emails = Array.isArray(row.enrolled_emails) ? row.enrolled_emails : []
  return {
    id: Number(row.id), title: row.title, date: row.date, time: row.time, location: row.location, city: row.city, state: row.state,
    category: row.category, positions: row.positions || [], seats: row.seats, status: row.status, cancelReason: row.cancel_reason,
    createdBy: row.created_by_email, remote: true,
    enrolled: emails.concat(Array(Math.max(0, (row.taken || 0) - emails.length)).fill('')),
  }
}

async function refreshRemoteTryouts() {
  if (!remote.enabled || !state.user?.uid) return
  try {
    state.tryouts = (await fetchTryouts()).map(mapRemoteTryout)
    state.tryoutsStatus = 'ready'
  } catch (error) {
    console.warn('[Supabase] não foi possível carregar peneiras:', error)
    state.tryoutsStatus = 'error'
    state.tryoutsError = describeError(error)
  }
}

// Executa uma ação de peneira no servidor com estado de carregamento no botão e erro recuperável.
async function runTryoutAction(button, action, successMessage) {
  button?.setAttribute('aria-busy', 'true')
  const error = await action()
  if (error) {
    button?.removeAttribute('aria-busy')
    toast(error.code === '42501' ? t('Ação não permitida: a peneira pode ter lotado ou sido cancelada. Atualize a lista.') : describeError(error), 'error')
    if (/tryout_(full|past|closed)/.test(error.message || '')) refreshRemoteTryouts().then(render)
    return false
  }
  await refreshRemoteTryouts()
  render()
  toast(successMessage)
  return true
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
  stopAuthWatch?.()
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

// Atualiza a lista de pessoas e avaliações; mensagens são uma demonstração local.
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
    await refreshRemoteEvaluations()
    await refreshRemoteMessages()
    updateMessageBadge()
    const tryoutsBefore = JSON.stringify(state.tryouts)
    await refreshRemoteTryouts()
    const route = currentRoute()
    if (JSON.stringify(state.tryouts) !== tryoutsBefore && ['tryouts', 'dashboard'].includes(route)) render()
    else if (state.athletes.length !== before) {
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
    bookmark: '<path d="M6.5 3.5h11v17L12 16.6l-5.5 3.9Z"/>',
    heart: '<path d="M20.8 8.8c0 5.5-8.8 10.7-8.8 10.7S3.2 14.3 3.2 8.8A4.8 4.8 0 0 1 12 6a4.8 4.8 0 0 1 8.8 2.8Z"/>',
    camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    clipboard: '<rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4.5V3h6v1.5M9 10h6M9 14h6M9 18h3"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/>',
    send: '<path d="M4 12 20 4l-4 16-4-7-8-1Z"/><path d="m12 13 8-9"/>',
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
  const query = new URLSearchParams(location.search)
  const hashParams = new URLSearchParams(location.hash.replace(/^#/, ''))
  if (query.get('reset') === '1' || query.get('type') === 'recovery' || hashParams.get('type') === 'recovery' || hashParams.has('access_token') || hashParams.has('code')) return 'reset-password'
  const raw = location.hash.replace(/^#\/?/, '')
  return raw || (state.user ? 'dashboard' : 'login')
}

function toast(message, type = 'success', action = null) {
  let root = document.querySelector('#toast-root')
  if (!root) {
    root = document.createElement('div')
    root.id = 'toast-root'
    root.className = 'pointer-events-none fixed bottom-24 right-5 z-[120] flex w-[min(92vw,380px)] flex-col gap-2 md:bottom-5'
    root.setAttribute('role', 'status')
    root.setAttribute('aria-live', 'polite')
    document.body.appendChild(root)
  }
  const el = document.createElement('div')
  el.className = 'toast ' + (type === 'error' ? 'toast-error' : type === 'message' ? 'toast-message' : 'toast-success')
  el.innerHTML = icon(type === 'error' ? 'close' : type === 'message' ? 'message' : 'check', 'size-4 shrink-0') + '<span class="flex-1">' + escapeHtml(message) + '</span>'
  if (action) {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'toast-action'
    button.textContent = action.label
    button.addEventListener('click', () => { dismiss(); action.onClick() })
    el.appendChild(button)
  }
  root.appendChild(el)
  let timer = null
  const dismiss = () => {
    clearTimeout(timer)
    el.classList.add('is-out')
    el.addEventListener('animationend', () => el.remove(), { once: true })
    window.setTimeout(() => el.remove(), 400)
  }
  const arm = () => { clearTimeout(timer); timer = window.setTimeout(dismiss, action ? 9000 : 3200) }
  el.addEventListener('pointerenter', () => clearTimeout(timer))
  el.addEventListener('pointerleave', arm)
  el.addEventListener('focusin', () => clearTimeout(timer))
  el.addEventListener('focusout', arm)
  arm()
}


function shell(content, options = {}) {
  const role = options.role || 'player'
  const active = options.active || 'dashboard'
  const nav = role === 'staff'
    ? [['dashboard', t('Visão geral'), 'home'], ['athletes', t('Atletas'), 'search'], ['tryouts', t('Peneiras'), 'calendar'], ['messages', t('Conversas'), 'message']]
    : [['dashboard', t('Início'), 'home'], ['profile', t('Meu perfil'), 'user'], ['tryouts', t('Peneiras'), 'calendar'], ['messages', t('Conversas'), 'message']]
  const navButton = (item, extra = '') => '<button type="button" data-route="' + item[0] + '" class="nav-link ' + extra + (active === item[0] ? ' active" aria-current="page' : '') + '"' + (item[0] === 'messages' ? ' data-badge-host aria-label="' + item[1] + '"' : '') + '>' + icon(item[2], 'size-[1.1rem]') + '<span>' + item[1] + '</span>' + (item[0] === 'messages' ? '<span class="count-badge nav-badge" data-msg-badge aria-hidden="true" hidden></span>' : '') + (active === item[0] ? '<span class="nav-indicator" aria-hidden="true"></span>' : '') + '</button>'
  const cta = role === 'staff'
    ? '<button type="button" class="btn-primary w-full" data-action="openTryout">' + icon('plus', 'size-4') + ' ' + t('Criar peneira') + '</button>'
    : '<button type="button" class="btn-primary w-full" data-route="tryouts">' + icon('calendar', 'size-4') + ' ' + t('Ver peneiras') + '</button>'
  const notifCount = myNotifications().length

  return '<div class="app-shell has-bottom-nav text-chalk">' +
    // Barra lateral (desktop)
    '<aside class="sidebar" aria-label="' + t('Menu lateral') + '"><button type="button" class="sidebar-brand" data-action="home" aria-label="' + t('TIER ZERO, ir para o início') + '">' + brandLockup(36) + '</button>' +
    '<nav class="sidebar-nav" aria-label="' + t('Navegação principal') + '">' + nav.map((item) => navButton(item, 'nav-side')).join('') + '</nav>' +
    '<div class="sidebar-cta">' + cta + '</div>' +
    '<div class="sidebar-foot">' + partnerSeal() +
    '<button type="button" class="profile-row" data-route="profile">' + personAvatar(mePerson()) + '<span class="min-w-0 text-left"><span class="block truncate text-sm font-semibold">' + escapeHtml(state.user?.name || 'Atleta') + '</span><span class="block text-xs text-ink-soft">' + (role === 'staff' ? t('Funcionário') : t('Atleta')) + '</span></span></button></div></aside>' +
    // Coluna principal
    '<div class="app-main">' +
    '<header class="topbar site-header"><button type="button" class="topbar-brand" data-action="home" aria-label="' + t('TIER ZERO, ir para o início') + '">' + brandLockup(34) + '</button>' +
    '<nav class="topbar-nav" aria-label="' + t('Navegação principal') + '">' + nav.map((item) => navButton(item)).join('') + '</nav>' +
    '<div class="topbar-actions">' +
    themeButton('hidden md:grid') + '<button type="button" class="icon-button hidden md:grid" data-action="change-lang" aria-label="' + t('Alterar idioma') + '" title="' + t('Alterar idioma') + '">' + icon('globe', 'size-4') + '</button>' +
    '<button type="button" class="icon-button relative" data-action="notifications" aria-label="' + t('Abrir notificações') + (notifCount ? ', ' + notifCount : '') + '">' + icon('bell') + '<span id="notif-badge" class="count-badge count-badge--alert" aria-hidden="true"' + (notifCount ? '' : ' hidden') + '>' + (notifCount > 9 ? '9+' : notifCount) + '</span></button>' +
    '<button type="button" class="profile-chip topbar-profile" data-route="profile" aria-label="' + t('Meu perfil') + '">' + personAvatar(mePerson()) + '</button>' +
    '<button type="button" class="icon-button md:hidden" data-action="menu" aria-label="' + t('Abrir menu') + '">' + icon('menu') + '</button>' +
    '</div></header>' +
    '<main id="conteudo" tabindex="-1" class="content-sheet outline-none">' + content + '</main>' +
    '<footer class="app-footer"><p>TIER ZERO · ' + t('Plataforma de talentos em parceria com a Pelé Academia') + ' · FIAP 2026. <a class="underline underline-offset-4 hover:text-chalk" href="#/design-system">Design system</a></p></footer>' +
    '</div>' +
    '<nav class="bottom-nav" aria-label="' + t('Navegação rápida') + '">' +
    nav.map((item) => '<button type="button" data-route="' + item[0] + '"' + (item[0] === 'messages' ? ' data-badge-host aria-label="' + item[1] + '"' : '') + (active === item[0] ? ' aria-current="page"' : '') + '>' + icon(item[2], 'size-5') + '<span>' + item[1] + '</span>' + (item[0] === 'messages' ? '<span class="count-badge" data-msg-badge aria-hidden="true" hidden></span>' : '') + '</button>').join('') +
    '</nav>' +
    '<div id="mobile-menu"></div>' +
    '</div>'
}


function stat(value, label, sub) {
  return '<div class="reveal rounded-2xl surface p-4"><p class="num text-4xl text-brand">' + value + '</p><p class="mt-1 text-sm font-semibold">' + label + '</p><p class="mt-1 text-xs text-ink-soft">' + sub + '</p></div>'
}

function activity(title, sub, time) {
  return '<div class="flex gap-3"><span class="mt-1 grid size-9 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">' + icon('check', 'size-4') + '</span><div class="min-w-0"><p class="text-sm font-semibold">' + title + '</p><p class="truncate text-xs text-ink-soft">' + sub + '</p><p class="mt-1 text-xs text-ink-soft">' + time + '</p></div></div>'
}

function dashboard(role = 'player') {
  return role === 'staff' ? staffDashboard() : playerDashboard()
}

// Painel do atleta: uma próxima ação clara, a próxima peneira com contagem regressiva e um
// checklist curto do perfil (3 a 7 itens, verbo de ação, progresso, pode ocultar).
function playerChecklist(profile) {
  const myMessages = state.messages.some((m) => m.senderRole === 'player' && String(m.thread).includes(String(getCurrentAthlete()?.id ?? '')))
  return [
    [!!profile.photo, t('Adicione uma foto de perfil'), t('Ajuda os olheiros a lembrarem de você.'), 'profile'],
    [!!profile.secondary && profile.secondary !== '—', t('Defina uma posição secundária'), t('Abre mais peneiras compatíveis.'), 'profile'],
    [state.tryouts.some(isEnrolledIn), t('Inscreva-se numa peneira'), t('É assim que você entra no radar da Academia.'), 'tryouts:for-you'],
    [myMessages, t('Mande uma mensagem a um treinador'), t('Apresente-se e tire dúvidas.'), 'messages'],
    [!!(profile.city && profile.zip), t('Confira seu endereço'), t('Usado para indicar peneiras perto de você.'), 'profile'],
  ]
}

function playerDashboard() {
  const profile = state.profile || defaultProfile
  const firstName = escapeHtml((state.user?.name || profile.name || 'Atleta').split(' ')[0])
  const category = getCategoryFromAge(getAgeFromProfile(profile.birth))
  const upcoming = state.tryouts.filter((tryout) => !isPastTryout(tryout) && tryout.status !== 'cancelled').sort((x, y) => String(x.date).localeCompare(String(y.date)))
  const mine = upcoming.filter(isEnrolledIn)
  const forYou = upcoming.filter((tryout) => tryoutFit(tryout).ok && !isEnrolledIn(tryout))
  const next = mine[0] || forYou[0] || null
  const unread = unreadSummary().total
  const avg = averagePlayerRating(profile)
  const status = mine.length
    ? t('Você tem') + ' ' + plural(mine.length, 'inscrição', 'inscrições') + '. ' + t('Sua próxima peneira é') + ' ' + countdownLabel(mine[0].date).toLowerCase() + '.'
    : forYou.length
      ? t('Há') + ' ' + plural(forYou.length, 'peneira aberta', 'peneiras abertas') + ' ' + t('para') + ' ' + escapeHtml(profile.pos.toLowerCase()) + ' ' + t('na') + ' ' + escapeHtml(category) + '.'
      : t('Nenhuma peneira compatível agora. Complete o perfil para aparecer para os olheiros.')
  const cta = mine.length
    ? '<button type="button" class="btn-primary" data-tryout-filter="mine">' + icon('calendar', 'size-4') + ' ' + t('Ver minhas inscrições') + '</button>'
    : forYou.length
      ? '<button type="button" class="btn-primary" data-tryout-filter="for-you">' + t('Ver peneiras para você') + ' ' + icon('arrow', 'size-4') + '</button>'
      : '<button type="button" class="btn-primary" data-route="profile">' + t('Completar perfil') + ' ' + icon('arrow', 'size-4') + '</button>'

  const checklist = playerChecklist(profile)
  const done = checklist.filter((item) => item[0]).length
  let hidden = false
  try { hidden = localStorage.getItem('ap_hide_checklist:' + state.user?.email) === '1' } catch {}
  const checklistPanel = hidden ? '' : '<div class="reveal panel"><div class="flex items-start justify-between gap-3"><div><h2 class="section-title !mt-0">' + t('Seu perfil para os olheiros') + '</h2><p class="mt-1 text-sm text-ink-soft">' + done + ' ' + t('de') + ' ' + checklist.length + ' ' + t('passos concluídos') + '</p></div><button type="button" class="btn-ghost text-sm" data-hide-checklist>' + t('Ocultar') + '</button></div>' +
    '<div class="reg-progress mt-4" aria-hidden="true"><span style="width:' + Math.round(done / checklist.length * 100) + '%"></span></div>' +
    (done === checklist.length
      ? '<div class="alert alert-success mt-5">' + icon('check', 'size-5 shrink-0') + '<span><strong>' + t('Perfil completo.') + '</strong> ' + t('Agora é com você em campo.') + '</span></div>'
      : '<ul class="checklist mt-4">' + checklist.map(([ok, title, hint, target]) => {
        const attrs = target.startsWith('tryouts:') ? 'data-tryout-filter="' + target.split(':')[1] + '"' : 'data-route="' + target + '"'
        return '<li class="' + (ok ? 'is-done' : '') + '"><span class="check-mark" aria-hidden="true">' + (ok ? icon('check', 'size-3.5') : '') + '</span><span class="min-w-0 flex-1"><strong>' + title + '</strong><small>' + hint + '</small></span>' +
          (ok ? '<span class="sr-only">' + t('concluído') + '</span>' : '<button type="button" class="btn-ghost text-sm" ' + attrs + '>' + t('Fazer') + '</button>') + '</li>'
      }).join('') + '</ul>') + '</div>'

  const nextCard = next
    ? '<aside class="next-tryout reveal surface rounded-card p-6"><div class="flex items-center justify-between gap-3"><p class="text-sm text-ink-soft">' + (isEnrolledIn(next) ? t('Sua próxima peneira') : t('Próxima peneira para você')) + '</p>' +
      '<span class="tag ' + (isEnrolledIn(next) ? 'green' : '') + '">' + (isEnrolledIn(next) ? t('Inscrito') : t('Aberta')) + '</span></div>' +
      '<div class="mt-4 flex items-end gap-3"><span class="num countdown-big">' + (daysUntil(next.date) <= 0 ? t('Hoje') : daysUntil(next.date)) + '</span>' + (daysUntil(next.date) > 0 ? '<span class="pb-2 text-sm text-ink-soft">' + (daysUntil(next.date) === 1 ? t('dia') : t('dias')) + '<br/>' + t('para o jogo') + '</span>' : '') + '</div>' +
      '<h2 class="mt-4 text-xl font-semibold leading-tight">' + escapeHtml(next.title) + '</h2>' +
      '<div class="mt-3 flex items-center gap-3">' + scoreboard(next.date, next.time) + '<p class="text-sm text-ink-soft">' + escapeHtml(next.location) + '<br/>' + escapeHtml(next.city) + '/' + escapeHtml(next.state) + '</p></div>' +
      '<button type="button" class="btn-secondary mt-6 w-full" data-tryout-filter="' + (isEnrolledIn(next) ? 'mine' : 'for-you') + '">' + (isEnrolledIn(next) ? t('Ver detalhes') : t('Inscrever-me')) + ' ' + icon('arrow', 'size-4') + '</button></aside>'
    : '<aside class="next-tryout reveal surface rounded-card p-6"><div class="empty-state"><strong>' + t('Nenhuma peneira aberta para você') + '</strong><span class="text-sm">' + t('Assim que abrir uma peneira compatível, ela aparece aqui.') + '</span><button type="button" class="btn-secondary mt-2" data-tryout-filter="all">' + t('Ver todas') + '</button></div></aside>'

  return shell(
    '<section class="grid gap-5 xl:grid-cols-[1.5fr_.9fr]">' +
    '<div class="hero rounded-card surface p-6 sm:p-8"><span class="jersey" aria-hidden="true">' + (category.replace(/\D/g, '') || '10') + '</span>' +
    '<p class="text-sm text-ink-soft">' + escapeHtml(profile.pos) + ' · ' + escapeHtml(category) + ' · ' + escapeHtml(profile.city || '') + '</p>' +
    '<h1 class="page-title mt-2 max-w-2xl">' + t('Olá,') + ' ' + firstName + '.</h1><p class="mt-3 max-w-xl text-lg leading-7">' + status + '</p>' +
    '<div class="mt-6 flex flex-wrap gap-2">' + cta + '<button type="button" class="btn-secondary" data-route="profile">' + icon('user', 'size-4') + ' ' + t('Meu perfil') + '</button></div>' +
    '<dl class="profile-stats mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">' +
    '<div><dt>' + t('Nota média') + '</dt><dd class="num ' + rateClass(avg) + '">' + escapeHtml(String(avg)) + '</dd></div>' +
    '<div><dt>' + t('Inscrições') + '</dt><dd class="num">' + mine.length + '</dd></div>' +
    '<div><dt>' + t('Avaliações') + '</dt><dd class="num">' + getPlayerReviewCount() + '</dd></div>' +
    '<div><dt>' + t('Mensagens novas') + '</dt><dd class="num">' + unread + '</dd></div></dl></div>' +
    nextCard + '</section>' +
    '<section class="mt-6 grid gap-5 ' + (checklistPanel ? 'lg:grid-cols-2' : '') + '">' + checklistPanel +
    '<div class="reveal panel"><h2 class="section-title !mt-0">' + t('Minha atividade') + '</h2><div class="mt-5 space-y-4">' +
    (myNotifications().length
      ? myNotifications().slice(0, 4).map((n) => activity(escapeHtml(n.title), escapeHtml(n.text), notificationTime(n))).join('')
      : '<div class="empty-state"><strong>' + t('Nada por aqui ainda') + '</strong><span class="text-sm">' + t('Inscrições, avaliações e mensagens de treinadores aparecem aqui.') + '</span></div>') +
    '</div></div></section>',
    { active: 'dashboard', role: 'player' },
  )
}


function staffDashboard() {
  return shell(
    '<section class="grid gap-6 xl:grid-cols-[1.55fr_.8fr]">' +
    '<div class="hero rounded-card surface p-6 sm:p-8"><span class="jersey" aria-hidden="true">10</span><h1 class="page-title max-w-3xl">Encontre atletas, avalie perfis e crie oportunidades.</h1><p class="mt-4 max-w-2xl text-ink-soft">Pesquise o banco, abra o perfil completo do atleta, envie mensagens, registre avaliações e agende peneiras.</p><div class="mt-8 flex flex-wrap gap-3"><button type="button" class="btn-primary" data-route="athletes">' + t('Pesquisar atletas') + ' ' + icon('search', 'size-4') + '</button><button type="button" class="btn-secondary" data-action="openTryout">' + icon('plus', 'size-4') + ' ' + t('Criar peneira') + '</button></div></div>' +
    '<aside class="panel"><span class="eyebrow">' + t('Hoje') + '</span><div class="mt-3 grid grid-cols-2 gap-3">' +
    staffStat(String(state.athletes.length).padStart(2, '0'), t('Atletas ativos')) + staffStat(String(Object.values(state.reviews).filter((list) => Array.isArray(list) && list.length).length).padStart(2, '0'), t('Perfis avaliados')) + staffStat(String(state.tryouts.length).padStart(2, '0'), t('Peneiras')) + staffStat(String(state.messages.filter((m) => String(m.thread).endsWith('::' + state.user?.email)).length).padStart(2, '0'), t('Mensagens')) +
    '</div></aside></section>' +
    '<section class="reveal mt-8 panel"><div class="flex flex-wrap items-end justify-between gap-3"><div><h2 class="section-title !mt-0">' + t('Elenco em campo') + '</h2><p class="mt-1 max-w-[60ch] text-sm text-ink-soft">' + t('Cada ponto é um atleta do banco, na posição principal. Clique para abrir o perfil.') + '</p></div></div>' +
    '<div class="mt-5">' + pitchFormation(state.athletes) + '</div>' + squadLegend(state.athletes) + '</section>' +
    '<section class="reveal mt-8 panel"><div class="flex flex-wrap items-end justify-between gap-3"><div><h2 class="section-title">' + t('Atletas para observar') + '</h2></div><button type="button" class="btn-ghost" data-route="athletes">' + t('Abrir banco completo') + ' ' + icon('arrow', 'size-4') + '</button></div><div class="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">' +
    [...state.athletes.filter((a) => isSaved(a.id)), ...state.athletes.filter((a) => !isSaved(a.id))].slice(0, 6).map((a) => athleteCard(a, true)).join('') + '</div></section>',
    { active: 'dashboard', role: 'staff' },
  )
}

function staffStat(value, label) {
  return '<div class="reveal rounded-2xl surface p-4"><p class="num text-4xl">' + value + '</p><p class="mt-1 text-xs text-ink-soft">' + label + '</p></div>'
}

// Grupo da posição (cores da convenção dos games de futebol) e sigla de 3 letras da carta.
const POSITION_GROUP = { Goleiro: 'gk', Zagueiro: 'def', Lateral: 'def', Volante: 'mid', Meia: 'mid', Ponta: 'atk', Atacante: 'atk' }
const POSITION_ABBR = { Goleiro: 'GOL', Zagueiro: 'ZAG', Lateral: 'LAT', Volante: 'VOL', Meia: 'MEI', Ponta: 'PON', Atacante: 'ATA' }
const positionGroup = (pos) => POSITION_GROUP[pos] || 'mid'

// Faixa de cor da nota (escala de 0 a 10): vermelho < 6 · laranja < 7 · verde < 8 · turquesa < 9 · azul ≥ 9.
function rateClass(value) {
  const n = Number(String(value).replace(',', '.'))
  if (!Number.isFinite(n) || n <= 0) return 'rate-0'
  return n < 6 ? 'rate-1' : n < 7 ? 'rate-2' : n < 8 ? 'rate-3' : n < 9 ? 'rate-4' : 'rate-5'
}

function posTag(pos) {
  if (!pos || pos === '—') return ''
  return '<span class="tag pos-tag pos-' + positionGroup(pos) + '">' + escapeHtml(pos) + '</span>'
}

const plural = (n, one, many) => n + ' ' + (n === 1 ? one : many)

// ---------- Loader de futebol: bola quicando sobre a linha do campo ----------
const BALL_SVG = '<svg viewBox="0 0 24 24" class="ball" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#EEF1E8"/><path d="M12 7.2l4.1 3-1.6 4.8h-5l-1.6-4.8z" fill="#0D1612"/><path d="M12 7.2V2.5M16.1 10.2l4.4-1.6M14.5 15l2.8 3.9M9.5 15l-2.8 3.9M7.9 10.2 3.5 8.6" stroke="#0D1612" stroke-width="1.3" fill="none"/></svg>'
function ballLoader(label = t('Carregando…')) {
  return '<div class="ball-loader" role="status"><div class="ball-stage" aria-hidden="true"><span class="ball-wrap">' + BALL_SVG + '</span><span class="ball-shadow"></span><span class="pitch-dash"></span></div><span class="text-sm text-ink-soft">' + escapeHtml(label) + '</span></div>'
}

// ---------- Placar: data da peneira ----------
const MONTHS = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ']
function scoreboard(date, time) {
  const [year, month, day] = String(date || '').split('-')
  if (!day) return ''
  return '<div class="scoreboard" aria-label="' + formatDate(date) + (time ? ' às ' + escapeHtml(time) : '') + '"><span class="sb-day num">' + day + '</span><span class="sb-month">' + (MONTHS[Number(month) - 1] || '') + '</span>' + (time ? '<span class="sb-time tabular">' + escapeHtml(time) + '</span>' : '') + '</div>'
}

// ---------- Elenco em campo: cada atleta na zona da posição principal ----------
const PITCH_LANES = {
  Goleiro: [7, [50, 35, 65]], Zagueiro: [22, [38, 62, 50, 26, 74]], Lateral: [31, [14, 86, 26, 74]],
  Volante: [43, [50, 35, 65]], Meia: [58, [38, 62, 50, 24, 76]], Ponta: [73, [16, 84, 28, 72]], Atacante: [87, [50, 37, 63]],
}
const PITCH_LINES = '<svg class="pitch-lines" viewBox="0 0 100 64" preserveAspectRatio="none" aria-hidden="true"><rect x="1" y="1" width="98" height="62" rx="1"/><path d="M50 1v62M1 18h13v28H1M99 18H86v28h13M1 26h5v12H1M99 26h-5v12h5"/><circle cx="50" cy="32" r="8"/><circle cx="50" cy="32" r=".6" class="dot"/></svg>'
function pitchFormation(athletes, { highlight = null, interactive = true } = {}) {
  const used = {}
  const dots = athletes.map((a, i) => {
    const lane = PITCH_LANES[a.pos] || PITCH_LANES.Meia
    const n = used[a.pos] = (used[a.pos] || 0) + 1
    const y = lane[1][(n - 1) % lane[1].length] + Math.floor((n - 1) / lane[1].length) * 5
    const label = escapeHtml(a.name) + ', ' + escapeHtml(a.pos) + (a.rating ? ', nota ' + formatRating(ratingOf(a)) : '')
    const cls = 'pitch-dot pos-' + positionGroup(a.pos) + (highlight === a.id ? ' is-me' : '')
    const style = 'left:' + lane[0] + '%;top:' + Math.min(92, y) + '%;--i:' + i
    return interactive
      ? '<button type="button" class="' + cls + '" style="' + style + '" data-open-athlete="' + a.id + '" aria-label="' + label + '" title="' + label + '">' + avatar(a.name) + '</button>'
      : '<span class="' + cls + '" style="' + style + '" role="img" aria-label="' + label + '">' + avatar(a.name) + '</span>'
  }).join('')
  return '<div class="pitch">' + PITCH_LINES + dots + '</div>'
}

function squadLegend(athletes) {
  const groups = [['gk', t('Goleiros')], ['def', t('Defesa')], ['mid', t('Meio-campo')], ['atk', t('Ataque')]]
  return '<ul class="mt-4 flex flex-wrap gap-2">' + groups.map(([key, label]) =>
    '<li class="tag pos-tag pos-' + key + '"><span class="num">' + athletes.filter((a) => positionGroup(a.pos) === key).length + '</span> ' + label + '</li>').join('') + '</ul>'
}

// ---------- Marca TIER ZERO ----------
// Símbolo "O da prancheta": na prancheta o treinador marca o jogador com um O (o zero) e o movimento
// com uma seta; a corrida em curva sai da abertura do O, "do zero para a frente".
function logoMark(size = 40, cls = '') {
  return '<svg class="logo-mark ' + cls + '" width="' + Math.round(size * 1.25) + '" height="' + size + '" viewBox="0 0 80 64" aria-hidden="true" focusable="false"><path class="lm-o" d="M48.07 26.13A19 19 0 1 1 40.07 15.89" pathLength="1" fill="none" stroke-width="5.5" stroke-linecap="round"/><path class="lm-run" d="M46.5 20.5C54 10 63 9.5 70 17.5" fill="none" stroke-width="3.2" stroke-linecap="round" stroke-dasharray="1 6.5"/><path class="lm-run lm-head" d="M70.13 10.68L70.99 18.63L63.22 16.72" fill="none" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>'
}

function brandLockup(size = 40, sub = true) {
  return '<span class="brand-lockup">' + logoMark(size) + '<span class="brand-text"><span class="brand-word">TIER ZERO</span>' + (sub ? '<span class="brand-sub">' + t('Plataforma de talentos') + '</span>' : '') + '</span></span>'
}
const partnerSeal = () => '<span class="partner-seal"><img src="./assets/brand/simbolo.jpg" width="28" height="28" decoding="async" alt="" />' + t('Em parceria com a Pelé Academia') + '</span>'

// ---------- Tema claro/escuro ----------
// Preferência salva vence; sem preferência, segue o sistema. O <head> aplica antes da 1ª pintura.
const currentTheme = () => document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
function themeButton(extra = '') {
  const next = currentTheme() === 'light' ? 'escuro' : 'claro'
  return '<button type="button" class="icon-button theme-toggle ' + extra + '" data-action="toggle-theme" aria-label="Ativar tema ' + next + '" title="Alternar tema claro/escuro" aria-live="polite">' + icon('sun', 'size-4 theme-sun') + icon('moon', 'size-4 theme-moon') + '</button>'
}
function applyTheme(theme, persistChoice = true) {
  const swap = () => {
    document.documentElement.dataset.theme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? '#F2F5EF' : '#0D1612')
    document.querySelectorAll('[data-action="toggle-theme"]').forEach((button) => button.setAttribute('aria-label', 'Ativar tema ' + (theme === 'light' ? 'escuro' : 'claro')))
  }
  if (persistChoice) { try { localStorage.setItem('ap_theme', theme) } catch {} }
  if (document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.classList.add('theme-vt')
    document.startViewTransition(swap).finished.finally(() => document.documentElement.classList.remove('theme-vt'))
  } else swap()
}
matchMedia('(prefers-color-scheme: light)').addEventListener('change', (event) => {
  let saved = null
  try { saved = localStorage.getItem('ap_theme') } catch {}
  if (!saved) applyTheme(event.matches ? 'light' : 'dark', false)
})

// Cliques globais que precisam funcionar em qualquer tela (inclusive conteúdo re-renderizado).
document.addEventListener('click', (event) => {
  if (event.target.closest('[data-action="change-lang"]')) {
    document.querySelector('#mobile-menu')?.replaceChildren()
    setLang(getLang() === 'es' ? 'pt' : 'es')
    render()
  }
  const toggle = event.target.closest('[data-action="toggle-theme"]')
  if (toggle) applyTheme(currentTheme() === 'light' ? 'dark' : 'light')
  if (event.target.closest('[data-action="toggle-watchlist"]')) {
    watchOnly = !watchOnly
    document.querySelectorAll('.tab-chip[data-action="toggle-watchlist"]').forEach((chip) => chip.setAttribute('aria-pressed', String(watchOnly)))
    applyFilters()
  }
  const quick = event.target.closest('[data-quick-reply]')
  if (quick) {
    const field = document.querySelector('#message-input')
    if (field) { field.value = quick.dataset.quickReply; field.focus() }
  }
})

// ---------- Texto humano para o card ----------
const joinPt = (items) => items.length <= 1 ? (items[0] || '') : items.slice(0, -1).join(', ') + ' e ' + items[items.length - 1]
function footPhrase(foot) {
  return foot === 'Canhoto' ? 'chuta de canhota' : foot === 'Destro' ? 'chuta de direita' : foot === 'Ambidestro' ? 'usa bem as duas pernas' : ''
}
// Destaques: os mais citados pelos olheiros; sem avaliação, as características do cadastro.
function strengthsOf(a) {
  const counts = {}
  ;(state.reviews[a.id] || []).forEach((review) => (review.strengths || []).forEach((item) => { counts[item] = (counts[item] || 0) + 1 }))
  const fromReviews = Object.keys(counts).sort((x, y) => counts[y] - counts[x])
  const list = fromReviews.length ? fromReviews : (a.tags || []).filter((item) => item && item !== a.pos && item !== a.secondary)
  return list.slice(0, 3).map((item) => item.toLowerCase())
}
function describeAthlete(a) {
  const role = a.secondary && a.secondary !== '—' && a.secondary !== a.pos ? a.pos + ' que também joga de ' + a.secondary.toLowerCase() : a.pos
  const foot = footPhrase(a.foot)
  return role + (foot ? ' e ' + foot : '') + '.'
}

// ---------- Radar de atributos (média das avaliações, 0–10) ----------
function radarChart(criteria, values) {
  const n = criteria.length
  const cx = 160, cy = 130, R = 92
  const point = (i, v) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n
    return [cx + Math.cos(angle) * R * v / 10, cy + Math.sin(angle) * R * v / 10]
  }
  const ring = (v) => criteria.map((_, i) => point(i, v).map((x) => x.toFixed(1)).join(',')).join(' ')
  const shape = criteria.map((c, i) => point(i, values[c.key] || 0).map((x) => x.toFixed(1)).join(',')).join(' ')
  const labels = criteria.map((c, i) => {
    const [x, y] = point(i, 12.2)
    const anchor = Math.abs(x - cx) < 4 ? 'middle' : x > cx ? 'start' : 'end'
    const value = values[c.key]
    return '<text x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" text-anchor="' + anchor + '" class="radar-label">' + escapeHtml(c.label.split(' e ')[0]) + '<tspan class="radar-value" dx="5">' + (value ? formatRating(value) : '—') + '</tspan></text>'
  }).join('')
  const summary = criteria.map((c) => c.label + ' ' + (values[c.key] ? formatRating(values[c.key]) : 'sem nota')).join('; ')
  return '<svg class="radar" viewBox="0 0 320 260" role="img" aria-label="Atributos: ' + escapeHtml(summary) + '">' +
    [2.5, 5, 7.5, 10].map((v) => '<polygon points="' + ring(v) + '" class="radar-ring"/>').join('') +
    criteria.map((_, i) => { const [x, y] = point(i, 10); return '<line x1="' + cx + '" y1="' + cy + '" x2="' + x.toFixed(1) + '" y2="' + y.toFixed(1) + '" class="radar-ring"/>' }).join('') +
    '<polygon points="' + shape + '" class="radar-shape"/>' + labels + '</svg>'
}
function attributeAverages(athleteId, pos) {
  const criteria = criteriaForPosition(pos)
  const reviews = (state.reviews[athleteId] || []).filter((review) => review.ratings)
  const values = {}
  criteria.forEach((c) => {
    const list = reviews.map((review) => Number(review.ratings[c.key])).filter((v) => Number.isFinite(v) && v > 0)
    if (list.length) values[c.key] = list.reduce((sum, v) => sum + v, 0) / list.length
  })
  return { criteria, values, count: reviews.length }
}

// ---------- Avatares e fotos de perfil ----------
// Foto enviada > avatar ilustrado (perfis de exemplo) > iniciais.
function personAvatar(person, cls = 'avatar') {
  const name = person?.name || 'Atleta'
  if (person?.photo) return '<span class="' + cls + ' avatar-photo"><img src="' + escapeHtml(person.photo) + '" alt="" width="88" height="88" decoding="async" /></span>'
  if (person?.demo) return '<span class="' + cls + ' avatar-photo">' + illustratedAvatar(person.id || name, person.group || positionGroup(person.pos)) + '</span>'
  return '<span class="' + cls + '">' + avatar(name) + '</span>'
}
function mePerson() {
  const account = state.accounts.find((entry) => entry.email === state.user?.email)
  const athlete = state.user?.role === 'player' ? getCurrentAthlete() : null
  return {
    name: state.user?.name, photo: state.profile?.photo || account?.profile?.photo || null,
    demo: !!(account?.profile?.demo || athlete?.demo), id: athlete?.id ?? state.user?.email, pos: athlete?.pos,
    group: state.user?.role === 'staff' ? 'staff' : undefined,
  }
}
function photoUploader(person, inputId = 'photo-input') {
  return '<div class="photo-uploader">' + personAvatar(person, 'avatar-xl profile-avatar') +
    '<label class="photo-edit" for="' + inputId + '" title="' + t('Trocar foto') + '">' + icon('camera', 'size-4') + '<span class="sr-only">' + t('Trocar foto de perfil') + '</span></label>' +
    '<input id="' + inputId + '" type="file" accept="image/*" class="sr-only" data-photo-input />' +
    (person.photo ? '<button type="button" class="photo-remove" data-photo-remove>' + t('Remover foto') + '</button>' : '') + '</div>'
}
// Salva a foto no próprio perfil: no Supabase vai junto dos dados públicos (equipe vê no banco de atletas).
async function savePhoto(photo) {
  if (remote.enabled) {
    const own = await fetchOwnProfile(state.user.uid)
    const error = await updateOwnProfile(state.user.uid, { name: own.profile.name, data: { ...(own.profile.data || {}), photo } })
    if (error) throw error
  }
  const account = state.accounts.find((entry) => entry.email === state.user.email)
  if (state.profile) state.profile.photo = photo
  if (account) account.profile = Object.assign(account.profile || {}, { photo })
  syncAthletes()
  persist()
}
function bindPhotoInputs(root = document) {
  root.querySelectorAll('[data-photo-input]').forEach((input) => input.addEventListener('change', async () => {
    const file = input.files?.[0]
    if (!file) return
    const box = input.closest('.photo-uploader')
    input.value = '' // permite escolher o mesmo arquivo de novo
    try {
      const photo = await cropPhoto(file)
      if (!photo) return
      box?.setAttribute('aria-busy', 'true')
      if (input.id === 'reg-photo-input') {
        regPhoto = photo
        box.outerHTML = photoUploader({ name: document.querySelector('#reg-name')?.value || 'Atleta', photo }, 'reg-photo-input')
        bindPhotoInputs(document.querySelector('#register-form'))
        return
      }
      await savePhoto(photo)
      render()
      toast(t('Foto atualizada.'))
    } catch (error) {
      box?.removeAttribute('aria-busy')
      toast(error?.message && !error.code ? error.message : describeError(error), 'error')
    }
  }))
  root.querySelectorAll('[data-photo-remove]').forEach((button) => button.addEventListener('click', async () => {
    const box = button.closest('.photo-uploader')
    if (box?.querySelector('#reg-photo-input')) {
      regPhoto = null
      box.outerHTML = photoUploader({ name: 'Atleta' }, 'reg-photo-input')
      bindPhotoInputs(document.querySelector('#register-form'))
      return
    }
    try { await savePhoto(null); render(); toast(t('Foto removida.')) } catch (error) { toast(describeError(error), 'error') }
  }))
}
let regPhoto = null

function athleteCard(a, staff = false) {
  const reviewCount = (state.reviews[a.id] || []).length
  const rating = ratingOf(a)

  return '<article class="reveal spot athlete-card pos-' + positionGroup(a.pos) + ' flex h-full flex-col rounded-card surface p-4">' +
    '<div class="flex gap-4"><div class="fut-badge" aria-label="Nota ' + formatRating(rating) + ', ' + escapeHtml(a.pos) + '"><span class="num text-[2rem] ' + rateClass(rating) + '">' + formatRating(rating) + '</span><span class="pos-abbr">' + (POSITION_ABBR[a.pos] || '—') + '</span></div>' +
    '<div class="min-w-0 flex-1"><div class="flex items-start justify-between gap-2"><div class="flex min-w-0 items-center gap-3">' + personAvatar(a, 'avatar card-avatar') + '<button type="button" class="min-w-0 text-left" data-open-athlete="' + a.id + '"><h3 class="truncate text-lg font-semibold leading-tight">' + escapeHtml(a.name) + '</h3><p class="mt-0.5 truncate text-sm text-ink-soft">' + a.age + ' anos · ' + escapeHtml(a.city) + '/' + escapeHtml(a.state) + '</p></button></div>' +
    saveToggle(a) + '</div>' +
    '<div class="mt-3 flex flex-wrap gap-1.5">' + posTag(a.pos) + posTag(a.secondary) + tag(getCategoryFromAge(a.age), true) + '</div></div></div>' +
    '<div class="scout-note mt-4"><p>' + escapeHtml(describeAthlete(a)) + '</p>' +
    (strengthsOf(a).length ? '<p class="scout-strengths">' + strengthsOf(a).map((item) => '<span>' + escapeHtml(item) + '</span>').join('') + '</p>' : '') + '</div>' +
    '<p class="mt-3 text-xs text-ink-soft">' + (reviewCount ? '<span class="tabular">' + plural(reviewCount, 'avaliação', 'avaliações') + '</span>' : t('ainda sem avaliação')) + (a.demo ? ' · ' + t('perfil de exemplo') : '') + '</p>' +
    '<div class="mt-auto flex flex-wrap gap-2 pt-4">' +
    (staff ? '<button type="button" class="btn-secondary" data-message-athlete="' + a.id + '">' + t('Mensagem') + '</button>' : '') +
    '<button type="button" class="btn-ghost ml-auto" data-open-athlete="' + a.id + '" aria-label="Abrir perfil de ' + escapeHtml(a.name) + '">' + t('Ver perfil') + '</button></div></article>'
}

// Lista de observação: marcador pessoal de quem o funcionário quer acompanhar. Não é voto nem curtida:
// ninguém vê quantas pessoas salvaram um atleta, e isso não muda nota nem ordem.
const isSaved = (id) => state.favorites.includes(id)
function saveToggle(a) {
  const saved = isSaved(a.id)
  return '<button type="button" class="icon-button sm save-toggle shrink-0" data-save="' + a.id + '" aria-pressed="' + saved + '" aria-label="' + saveLabel(saved, a.name) + '" title="' + saveLabel(saved) + '">' + icon('bookmark', 'size-4') + '</button>'
}
const saveLabel = (saved, name = '') => (saved ? t('Tirar da lista de observação') : t('Salvar na lista de observação')) + (name ? ': ' + escapeHtml(name) : '')
let watchOnly = false

function tag(text, ghost = false) {
  if (!text || text === '—') return ''
  const safe = escapeHtml(text)
  return '<span class="tag ' + (ghost ? 'ghost' : '') + '">' + safe + '</span>'
}

function athletesPage() {
  watchOnly = false // como os outros filtros, volta a "todos" ao abrir a página
  const filters = '<div class="filters-scrim" data-filters-close></div><aside id="filters-panel" class="filters-panel panel h-max" aria-label="Filtros de atletas" data-lenis-prevent><div class="flex items-center justify-between gap-2"><h2 class="font-bold">Filtros</h2><div class="flex items-center gap-1"><button type="button" class="btn-ghost text-xs text-brand" data-action="clearFilters">Limpar</button><button type="button" class="filters-toggle icon-button sm" aria-label="Fechar filtros" data-filters-close>' + icon('close', 'size-4') + '</button></div></div>' +
    '<div class="mt-4 space-y-4"><label class="field-label">' + t('Buscar por nome') + '<input id="filter-name" class="field" placeholder="Ex.: Gabriel" /></label>' +
    '<label class="field-label">' + t('Posição principal ou secundária') + '<select id="filter-pos" class="field"><option value="">Todas</option>' + POSITIONS.map((p) => '<option>' + p + '</option>').join('') + '</select></label>' +
    '<label class="field-label">' + t('Perna dominante') + '<select id="filter-foot" class="field"><option value="">Todas</option>' + FEET.map((f) => '<option>' + f + '</option>').join('') + '</select></label>' +
    '<label class="field-label">' + t('Cidade/região') + '<select id="filter-city" class="field"><option value="">Todas</option>' + [...new Set(state.athletes.map((a) => a.city))].sort().map((c) => '<option>' + escapeHtml(c) + '</option>').join('') + '</select></label>' +
    '<label class="field-label">' + t('Idade') + '<select id="filter-age" class="field"><option value="">Todas</option>' + [...new Set(state.athletes.map((a) => a.age))].sort((a,b)=>a-b).map((age) => '<option value="' + age + '">' + age + '</option>').join('') + '</select></label>' +
    '<label class="field-label">' + t('Categoria') + '<select id="filter-category" class="field"><option value="">Todas</option><option>Sub-7</option><option>Sub-9</option><option>Sub-11</option><option>Sub-13</option><option>Sub-15</option><option>Sub-17</option><option>Sub-20</option></select></label>' +
    '</div><div class="mt-6 rounded-2xl border border-brand/15 bg-brand/7 p-4 text-xs leading-5 text-ink-soft"><strong class="text-brand">Filtro em tempo real</strong><br/>Nome, posição, perna dominante, cidade, idade e categoria alteram a lista sem recarregar.</div></aside>'

  return shell(
    '<div class="page-head"><div><h1 class="page-title">' + t('Pesquisar atletas') + '</h1><p class="page-subtitle">Abra o perfil completo, mande uma mensagem, registre uma avaliação e salve quem você quer acompanhar.</p></div><button type="button" class="btn-primary lg:hidden" data-action="openTryout">' + icon('plus', 'size-4') + ' ' + t('Nova peneira') + '</button></div>' +
    '<section class="mt-6 grid gap-5 lg:grid-cols-[280px_1fr]">' +
    filters +
    '<div><div class="mb-4 flex flex-wrap items-center justify-between gap-2"><button type="button" class="filters-toggle btn-secondary" aria-controls="filters-panel" aria-expanded="false" data-filters-open>' + icon('filter', 'size-4') + ' Filtros</button><div class="flex flex-wrap items-center gap-3"><button type="button" class="tab-chip" data-action="toggle-watchlist" aria-pressed="' + watchOnly + '">' + icon('bookmark', 'size-4') + t('Lista de observação') + '<span class="tab-count" id="watch-count">' + state.favorites.filter((id) => state.athletes.some((a) => a.id === id)).length + '</span></button><p id="athlete-count" class="text-sm text-ink-soft" aria-live="polite">' + plural(state.athletes.length, 'atleta encontrado', 'atletas encontrados') + '</p></div><button type="button" class="btn-secondary" data-action="export">' + icon('arrow', 'size-4') + ' Exportar seleção</button></div><div id="athlete-grid" class="grid gap-4 md:grid-cols-2 min-[1700px]:grid-cols-3">' + state.athletes.map((a) => athleteCard(a, true)).join('') + '</div></div></section>',
    { active: 'athletes', role: 'staff' },
  )
}

function profilePage() {
  const role = state.user?.role || 'player'
  if (role === 'staff') {
    const account = state.accounts.find((a) => a.email === state.user.email)
    const profile = account?.profile || { name: state.user.name, email: state.user.email, phone: '', position: t('Funcionário'), city: 'São Paulo', state: 'SP' }
    return shell(
      '<div class="page-head"><div><h1 class="page-title">' + escapeHtml(profile.name) + '</h1><p class="page-subtitle">' + t('Dados do funcionário que está conectado.') + '</p></div><button type="button" class="btn-secondary" data-action="logout">' + icon('logout', 'size-4') + ' ' + t('Sair') + '</button></div>' +
      '<section class="mt-6 grid gap-5 md:grid-cols-2"><aside class="panel"><div class="flex items-center gap-4">' + photoUploader({ name: profile.name, photo: profile.photo, demo: profile.demo, id: profile.email, group: 'staff' }) + '<div><p class="text-xs text-ink-soft">' + t('Funcionário') + '</p><h2 class="mt-1 text-2xl font-bold">' + escapeHtml(profile.position || t('Profissional')) + '</h2><p class="text-sm text-ink-soft">' + escapeHtml(profile.city) + '/' + escapeHtml(profile.state) + '</p></div></div></aside><div class="panel"><h2 class="section-title">' + t('Credenciais de teste') + '</h2><p class="mt-4 text-sm leading-6 text-ink-soft">'+ t('E-mail de teste') + ': funcionario@academiapele.com<br/>' + t('Senha de teste') + ': Academia123!</p><button type="button" class="btn-primary mt-5" data-route="athletes">'+ t('Ir para o banco de atletas') + ' ' + icon('arrow', 'size-4') + '</button></div></section>',
      { active: 'dashboard', role: 'staff' },
    )
  }

  const p = state.profile || defaultProfile
  const age = getAgeFromProfile(p.birth)
  const category = getCategoryFromAge(age)
  const me = getCurrentAthlete()
  const attrs = attributeAverages(me?.id, p.pos)
  const myStrengths = me ? strengthsOf(me) : []
  const enrolledCount = state.tryouts.filter((t) => Array.isArray(t.enrolled) && t.enrolled.includes(state.user.email)).length
  const avg = averagePlayerRating(p)
  return shell(
    '<section class="hero surface rounded-card p-6 sm:p-8 pos-' + positionGroup(p.pos) + '"><span class="jersey" aria-hidden="true">' + (category.replace(/\D/g, '') || '10') + '</span>' +
    '<div class="flex flex-wrap items-center gap-5">' + photoUploader({ name: p.name, photo: p.photo }) + '<div class="min-w-0 flex-1"><h1 class="page-title !mt-0">' + escapeHtml(p.name) + '</h1>' +
    '<p class="mt-2 text-ink-soft">' + escapeHtml(describeAthlete(p)) + ' ' + age + ' anos, ' + escapeHtml(category) + ', ' + escapeHtml(p.city || '') + '.</p>' +
    '<div class="mt-3 flex flex-wrap gap-1.5">' + posTag(p.pos) + posTag(p.secondary) + tag(category, true) + '</div></div>' +
    '<button type="button" class="btn-secondary self-start" data-action="logout">' + icon('logout', 'size-4') + ' ' + t('Sair') + '</button></div>' +
    '<dl class="profile-stats mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">' +
    '<div><dt>' + t('Nota média') + '</dt><dd class="num ' + rateClass(avg) + '">' + escapeHtml(String(avg)) + '</dd></div>' +
    '<div><dt>' + t('Peneiras inscritas') + '</dt><dd class="num">' + enrolledCount + '</dd></div>' +
    '<div><dt>' + t('Avaliações recebidas') + '</dt><dd class="num">' + getPlayerReviewCount() + '</dd></div>' +
    '<div><dt>' + t('Notificações') + '</dt><dd class="num">' + myNotifications().length + '</dd></div></dl></section>' +
    '<section class="mt-6 grid gap-5 xl:grid-cols-[.8fr_1.2fr]">' +
    '<aside class="reveal panel h-max"><h2 class="section-title !mt-0">' + t('Atributos') + '</h2><p class="mt-1 text-sm text-ink-soft">' + t('Média das notas dos olheiros, de 0 a 10, nas características da sua posição.') + '</p>' +
    (Object.keys(attrs.values).length
      ? '<div class="mt-4">' + radarChart(attrs.criteria, attrs.values) + '</div><p class="text-center text-xs text-ink-soft">' + t('Com base em') + ' ' + plural(attrs.count, 'avaliação', 'avaliações') + '</p>'
      : '<div class="empty-state mt-4"><strong>' + t('Seu radar aparece aqui') + '</strong><span class="text-sm">' + t('Depois da primeira avaliação de um olheiro, você vê seus pontos fortes por característica.') + '</span><button type="button" class="btn-secondary mt-2" data-route="tryouts">' + t('Ver peneiras') + '</button></div>') +
    (myStrengths.length ? '<p class="mt-4 text-sm"><strong>' + t('Destaques:') + '</strong> ' + escapeHtml(joinPt(myStrengths)) + '.</p>' : '') +
    '<div class="mt-5">' + pitchFormation([{ id: 'me', name: p.name, pos: p.pos }], { highlight: 'me', interactive: false }) + '</div></aside>' +
    '<div class="reveal panel"><div class="flex items-center justify-between"><div><h2 class="section-title">' + t('Atualizar perfil') + '</h2></div>' + icon('edit', 'size-5 text-brand') + '</div>' +
    '<form id="profile-form" class="mt-5 grid gap-4 sm:grid-cols-2"><p class="form-group-title sm:col-span-2">' + t('Dados pessoais') + '</p>' +
    input(t('Nome completo'), 'profile-name', p.name, 'text', true) +
    input('CPF', 'profile-cpf', p.cpf || '', 'text', false, true) +
    input(t('Data de nascimento'), 'profile-birth', p.birth, 'date', true) +
    input(t('Idade'), 'profile-age', String(age), 'number', false, false, true) +
    '<label class="field-label">Categoria<select id="profile-category" class="field" disabled><option>' + escapeHtml(category) + '</option></select></label>' +
    selectField(t('Gênero'), 'profile-gender', GENDERS, p.gender) +
    input(t('E-mail'), 'profile-email', p.email, 'email', true, remote.enabled) + input(t('Telefone'), 'profile-phone', p.phone, 'tel', true) +
    '<p class="form-group-title sm:col-span-2">' + t('Futebol') + '</p>' + selectField(t('Posição principal'), 'profile-pos', POSITIONS, p.pos) + selectField(t('Posição secundária'), 'profile-secondary', ['—'].concat(POSITIONS), p.secondary) + selectField(t('Perna dominante'), 'profile-foot', FEET, p.foot || '') +
    '<p class="form-group-title sm:col-span-2">' + t('Endereço') + '</p>' +
    input(t('CEP'), 'profile-zip', p.zip, 'text', true) + input(t('Cidade'), 'profile-city', p.city, 'text', true) + input(t('Estado'), 'profile-state', p.state, 'text', true) + input(t('Bairro'), 'profile-district', p.district, 'text', true) +
    input(t('Endereço'), 'profile-address', p.address, 'text', true) + input(t('Número'), 'profile-number', p.number, 'text', true) +
    '<div id="profile-feedback" class="sm:col-span-2 hidden" role="alert"></div><div class="sm:col-span-2 flex justify-end"><button class="btn-primary" type="submit">' + t('Salvar alterações') + ' ' + icon('check', 'size-4') + '</button></div></form></div></section>' +
    '<section class="mt-6 panel"><div class="flex items-center justify-between"><div><h2 class="section-title">' + t('Comentários e notas') + '</h2><p class="mt-1 text-xs text-ink-soft">' + t('Notas e estatísticas ficam visíveis apenas para você e para a equipe da Academia.') + '</p></div><span class="tag">' + getPlayerReviewCount() + ' ' + t('registro(s)') + '</span></div><div class="mt-5 grid gap-4 md:grid-cols-2">' + renderPlayerReviews() + '</div></section>',
    { active: 'profile', role: 'player' },
  )
}

function renderPlayerReviews() {
  const profileAthlete = getCurrentAthlete()
  const reviews = state.reviews[profileAthlete?.id] || []
  if (!reviews.length) {
    return '<div class="md:col-span-2 rounded-2xl border border-dashed border-line p-8 text-center text-ink-soft">'+ t('Ainda não há avaliações registradas para este perfil.') +'</div>'
  }
  return reviews.map(reviewCard).join('')
}

function reviewStatChips(review) {
  const stats = review.stats || {}
  const chips = []
  const add = (label, value) => chips.push('<span class="tag ghost">' + escapeHtml(label) + ' <strong class="text-chalk">' + escapeHtml(value) + '</strong></span>')
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
  return '<article class="rounded-2xl surface p-5"><div class="flex items-start justify-between gap-3"><div class="flex items-center gap-3"><span class="avatar">' + avatar(review.author || 'Olheiro') + '</span><div><p class="font-semibold">' + escapeHtml(review.author || 'Olheiro') + '</p><p class="text-xs text-ink-soft">' + escapeHtml(review.date || 'Agora') + (review.position ? ' • ' + t('como') + ' ' + escapeHtml(review.position) : '') + '</p></div></div>' +
    '<div class="text-center"><div class="rounded-xl border border-brand/20 bg-brand/8 px-3 py-2 text-sm font-bold text-brand">' + escapeHtml(String(review.rating).replace('.', ',')) + '</div>' + (criteria.length ? '<p class="mt-1 text-xs text-ink-soft">' + t('nota ponderada') + '</p>' : '') + '</div></div>' +
    (criteria.length ? '<div class="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">' + criteria.map((c) => {
      const value = Number(review.ratings[c.key])
      return '<div><div class="flex justify-between text-xs text-ink-soft"><span>' + escapeHtml(c.label) + '</span><strong class="text-chalk">' + String(value).replace('.', ',') + '</strong></div><div class="mt-1 h-1 overflow-hidden rounded-full bg-line"><div class="h-1 rounded-full bg-brand" style="width:' + Math.max(0, Math.min(100, value * 10)) + '%"></div></div></div>'
    }).join('') + '</div>' : '') +
    (review.baseRating !== undefined && review.adjustment ? '<p class="mt-3 text-xs text-ink-soft">' + t('Nota base') + ' <strong class="text-chalk">' + String(review.baseRating).replace('.', ',') + '</strong> • ' + t('ajuste por desempenho') + ' <strong class="' + (review.adjustment > 0 ? 'text-success' : 'text-danger') + '">' + (review.adjustment > 0 ? '+' : '') + String(review.adjustment).replace('.', ',') + '</strong></p>' : '') +
    (reviewStatChips(review) ? '<div class="mt-4 flex flex-wrap gap-1.5">' + reviewStatChips(review) + '</div>' : '') +
    (review.strengths && review.strengths.length ? '<div class="mt-3"><p class="text-xs font-bold text-ink-soft">' + t('Pontos fortes') + '</p><div class="mt-1.5 flex flex-wrap gap-1.5">' + review.strengths.map((item) => tag(item)).join('') + '</div></div>' : '') +
    '<p class="mt-4 text-sm leading-6 text-ink-soft">“' + escapeHtml(review.comment) + '”</p>' +
    (canDelete ? '<button type="button" class="mt-3 text-xs font-semibold text-danger hover:text-danger" data-delete-review="' + review.id + '">Excluir minha avaliação</button>' : '') + '</article>'
}

function tryoutsPage() {
  const role = state.user?.role === 'staff' ? 'staff' : 'player'
  const createButton = role === 'staff' ? '<button type="button" class="btn-primary" data-action="openTryout">' + icon('plus', 'size-4') + ' ' + t('Criar peneira') + '</button>' : ''
  return shell(
    '<div class="page-head"><div><h1 class="page-title">' + t('Peneiras') + '</h1><p class="page-subtitle">Veja oportunidades, posições, categoria, vagas e sua inscrição.</p></div>' + createButton + '</div>' +
    tryoutsBody(role),
    { active: 'tryouts', role },
  )
}

function tryoutsBody(role) {
  const status = remote.enabled ? state.tryoutsStatus : 'ready'
  if (status === 'loading') {
    return '<div class="mt-6">' + ballLoader(t('Aquecendo: carregando peneiras…')) + '</div><div class="mt-4 grid gap-4 lg:grid-cols-3" aria-hidden="true">' +
      [1, 2, 3].map(() => '<div class="panel space-y-3" aria-hidden="true"><div class="skeleton h-6 w-1/3"></div><div class="skeleton h-7 w-3/4"></div><div class="skeleton h-4 w-1/2"></div><div class="skeleton h-11 w-full"></div></div>').join('') + '</div>'
  }
  if (status === 'error') {
    return '<div class="alert alert-error mt-6" role="alert">' + icon('close', 'size-5 shrink-0') + '<span><strong>' + t('Não foi possível carregar as peneiras.') + '</strong> ' + escapeHtml(state.tryoutsError || '') +
      ' <button type="button" class="font-semibold underline underline-offset-4" data-action="retry-tryouts">' + t('Tentar de novo') + '</button></span></div>'
  }
  const all = state.tryouts.filter((tryout) => role === 'player' || tryout.status !== 'cancelled')
  const { bar, items: list, key } = tryoutTabs(role, all)
  if (all.length && !list.length) {
    const empty = {
      'for-you': [t('Nenhuma peneira para o seu perfil agora'), t('Veja todas as peneiras ou ajuste suas posições no perfil.'), '<button type="button" class="btn-secondary mt-2" data-tryout-filter="all">' + t('Ver todas') + '</button>'],
      mine: [t('Você ainda não se inscreveu'), t('As peneiras em que você se inscrever aparecem aqui, com a data e o local.'), '<button type="button" class="btn-primary mt-2" data-tryout-filter="for-you">' + t('Ver peneiras para você') + '</button>'],
      past: [t('Nenhuma peneira encerrada'), t('Peneiras que já aconteceram ou foram canceladas ficam guardadas aqui.'), ''],
    }[key] || [t('Nenhuma peneira aberta'), '', '']
    return bar + '<div class="empty-state mt-6"><strong>' + empty[0] + '</strong><span class="text-sm">' + empty[1] + '</span>' + empty[2] + '</div>'
  }
  if (!all.length) {
    return '<div class="empty-state mt-6"><strong>' + t('Nenhuma peneira aberta') + '</strong><span class="text-sm">' +
      (role === 'staff' ? t('Crie a primeira peneira: os atletas compatíveis já poderão se inscrever.') : t('Quando a Pelé Academia abrir uma peneira, ela aparece aqui.')) + '</span>' +
      (role === 'staff' ? '<button type="button" class="btn-primary mt-2" data-action="openTryout">' + icon('plus', 'size-4') + ' ' + t('Criar peneira') + '</button>' : '') + '</div>'
  }
  return bar + '<div class="mt-6 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">' + list.map(tryoutCard).join('') + '</div>'
}

// ---------- Peneiras: datas, compatibilidade e filtros ----------
// "Hoje" no fuso da academia (o mesmo do servidor), não em UTC: às 21h de Brasília o UTC já é amanhã.
const todayIso = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' })
const isPastTryout = (tryout) => !!tryout.date && tryout.date < todayIso()
function daysUntil(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) return null
  return Math.round((Date.parse(date) - Date.parse(todayIso())) / 864e5)
}
function countdownLabel(date) {
  const n = daysUntil(date)
  if (n === null) return ''
  if (n < 0) return t('Encerrada')
  if (n === 0) return t('Hoje')
  if (n === 1) return t('Amanhã')
  return t('Em') + ' ' + n + ' ' + t('dias')
}
const isEnrolledIn = (tryout) => Array.isArray(tryout.enrolled) && tryout.enrolled.includes(state.user?.email)
// Por que a peneira serve (ou não) para o atleta logado.
function tryoutFit(tryout) {
  const profile = state.profile || {}
  const category = getCategoryFromAge(getAgeFromProfile(profile.birth))
  const positionOk = tryout.positions.includes(profile.pos) || tryout.positions.includes(profile.secondary)
  const categoryOk = !tryout.category || tryout.category === category
  const reasons = []
  if (!positionOk) reasons.push(t('aceita') + ' ' + joinPt(tryout.positions.map((pos) => pos.toLowerCase())))
  if (!categoryOk) reasons.push(t('é') + ' ' + tryout.category + ' ' + t('e a sua categoria é') + ' ' + category)
  return { ok: positionOk && categoryOk, reasons, category }
}
let tryoutFilter = null
function tryoutTabs(role, list) {
  const upcoming = list.filter((tryout) => !isPastTryout(tryout) && tryout.status !== 'cancelled')
  const tabs = role === 'staff'
    ? [['upcoming', t('Próximas'), upcoming], ['past', t('Encerradas'), list.filter(isPastTryout)]]
    : [['for-you', t('Para você'), upcoming.filter((tryout) => tryoutFit(tryout).ok)], ['mine', t('Minhas inscrições'), list.filter(isEnrolledIn)], ['all', t('Todas'), upcoming], ['past', t('Encerradas'), list.filter((tryout) => isPastTryout(tryout) || tryout.status === 'cancelled')]]
  if (!tryoutFilter || !tabs.some((tab) => tab[0] === tryoutFilter)) tryoutFilter = tabs[0][0]
  const current = tabs.find((tab) => tab[0] === tryoutFilter)
  const bar = '<div class="tab-bar" role="group" aria-label="' + t('Filtrar peneiras') + '">' + tabs.map(([key, label, items]) =>
    '<button type="button" class="tab-chip" data-tryout-filter="' + key + '" aria-pressed="' + (key === tryoutFilter) + '">' + label + '<span class="tab-count">' + items.length + '</span></button>').join('') + '</div>'
  return { bar, items: current[2].slice().sort((a, b) => String(a.date).localeCompare(String(b.date))), key: current[0] }
}

function tryoutCard(tryout) {
  if (tryout.status === 'cancelled') {
    return '<article class="panel flex flex-col" data-tryout-card="' + tryout.id + '"><div class="flex flex-wrap gap-1.5"><span class="tag red">' + t('Cancelada') + '</span>' + tag(tryout.category || t('Aberta'), true) + '</div>' +
      '<h2 class="mt-4 text-xl font-bold">' + escapeHtml(tryout.title) + '</h2><p class="mt-3 text-sm text-ink-soft">' + formatDate(tryout.date) + ' • ' + escapeHtml(tryout.time) + '</p>' +
      '<p class="mt-4 text-sm"><strong>' + t('Motivo:') + '</strong> ' + escapeHtml(tryout.cancelReason || t('Não informado.')) + '</p></article>'
  }
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
    actions = '<button type="button" class="btn-danger w-full" data-action="withdraw" data-id="' + tryout.id + '">' + t('Cancelar minha inscrição') + '</button>'
  } else {
    actions = '<button type="button" class="btn-' + (incompatible ? 'incompatible' : 'primary') + ' w-full" data-action="enroll" data-id="' + tryout.id + '" ' + (!canEnroll || full ? 'disabled' : '') + '>' +
      (full ? t('Sem vagas') : canEnroll ? t('Inscrever-me') : t('Indisponível para o seu perfil')) + (canEnroll && !full ? ' ' + icon('arrow', 'size-4') : '') + '</button>'
  }

  const past = isPastTryout(tryout)
  const fit = staff ? { ok: true, reasons: [] } : tryoutFit(tryout)
  const scarce = !full && vacancies <= Math.max(2, Math.ceil(seats * 0.2))
  const fitLine = staff ? '' : enrolled
    ? '<p class="fit-line fit-ok">' + icon('check', 'size-4 shrink-0') + t('Você está inscrito. Chegue 30 minutos antes.') + '</p>'
    : fit.ok
      ? '<p class="fit-line fit-ok">' + icon('check', 'size-4 shrink-0') + t('Compatível com você:') + ' ' + escapeHtml(state.profile?.pos || '') + ' · ' + escapeHtml(fit.category) + '</p>'
      : '<p class="fit-line fit-no">' + icon('info', 'size-4 shrink-0') + t('Fora do seu perfil: esta peneira') + ' ' + escapeHtml(fit.reasons.join(' e ')) + '.</p>'
  if (past) actions = '<p class="text-sm text-ink-soft">' + t('Peneira encerrada.') + '</p>'
  return '<article class="tryout-card reveal spot panel flex flex-col' + (enrolled ? ' is-enrolled' : '') + (!staff && !fit.ok && !enrolled ? ' is-off' : '') + '" data-tryout-card="' + tryout.id + '">' +
    (enrolled ? '<span class="enrolled-ribbon">' + icon('check', 'size-3.5') + t('Inscrito') + '</span>' : '') +
    '<div class="flex items-start gap-4">' + scoreboard(tryout.date, tryout.time) +
    '<div class="min-w-0 flex-1"><h2 class="text-xl font-semibold leading-tight">' + escapeHtml(tryout.title) + '</h2>' +
    '<p class="mt-1 flex items-start gap-1.5 text-sm text-ink-soft">' + icon('pin', 'size-4 mt-0.5 shrink-0 text-brand') + '<span>' + escapeHtml(tryout.location) + ' · ' + escapeHtml(tryout.city) + '/' + escapeHtml(tryout.state) + '</span></p>' +
    '<p class="countdown' + (daysUntil(tryout.date) !== null && daysUntil(tryout.date) <= 3 && !past ? ' is-soon' : '') + '">' + icon('calendar', 'size-3.5') + countdownLabel(tryout.date) + '</p></div></div>' +
    '<div class="mt-4 flex flex-wrap gap-1.5">' + tag(tryout.category || t('Livre'), true) + tryout.positions.map(posTag).join('') + '</div>' +
    fitLine +
    '<div class="mt-5"><div class="flex items-baseline justify-between gap-3 text-sm"><span><strong class="num text-2xl ' + (full ? 'text-danger' : 'text-chalk') + '">' + taken + '</strong><span class="text-ink-soft"> ' + t('de') + ' ' + seats + ' ' + t('vagas preenchidas') + '</span></span>' +
    '<span class="tag ' + (full ? 'red' : scarce ? 'warn' : 'green') + '">' + (full ? t('Lotada') : scarce ? (vacancies === 1 ? t('Última vaga') : t('Últimas') + ' ' + vacancies + ' ' + t('vagas')) : plural(vacancies, 'vaga livre', 'vagas livres')) + '</span></div>' +
    '<div class="mt-2 h-2 overflow-hidden rounded-full bg-line"><div class="bar-fill h-full rounded-full ' + (full ? 'bg-danger' : scarce ? 'bg-warning' : 'bg-brand') + '" style="width:' + Math.min(100, taken / seats * 100) + '%"></div></div></div>' +
    '<div class="mt-auto grid gap-2 pt-5">' + actions + '</div></article>'
}

function messagesPage() {
  const staff = state.user?.role === 'staff'
  const role = staff ? 'staff' : 'player'
  const conversations = getConversations()
  const heading = '<div class="chat-heading page-head"><div><h1 class="page-title">' + t('Conversas') + '</h1><p class="page-subtitle">' +
    (staff ? t('Fale com os atletas do banco: convites, dúvidas e retorno das peneiras.') : t('Fale com os treinadores e olheiros da Pelé Academia.')) + '</p>' +
    (remote.enabled ? '' : '<p class="mt-2 text-xs text-ink-soft">' + t('Modo local: as mensagens ficam só neste navegador.') + '</p>') + '</div></div>'

  if (!conversations.length) {
    activeConversation = null
    activeThreadKey = null
    return shell(
      '<div><h1 class="page-title">' + t('Conversas') + '</h1></div><div class="mt-6 rounded-2xl border border-dashed border-line p-10 text-center text-ink-soft">' +
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
    '<section class="chat-layout mt-6 grid min-h-[620px] overflow-hidden rounded-card surface md:grid-cols-[300px_1fr]" data-mobile-view="' + (mobileChatOpen ? 'chat' : 'list') + '">' +
    '<aside class="chat-list border-b border-line bg-night/60 md:border-b-0 md:border-r"><div class="p-4"><label class="field-label">Pesquisar ' + (staff ? 'atleta' : 'profissional') + '<input id="conversation-search" class="field mt-2" placeholder="Digite um nome, posição ou cidade..." autocomplete="off" /></label></div>' +
    '<div id="conversation-list" class="max-h-[520px] space-y-1 overflow-y-auto p-2">' + conversationItemsHtml(conversations, selected.id) + '</div></aside>' +
    '<div class="chat-pane flex min-w-0 flex-col"><header class="chat-header flex items-center justify-between gap-3 border-b border-line px-5 py-4"><div class="flex min-w-0 items-center gap-3">' +
    '<button type="button" class="chat-back icon-button" data-action="chat-back" aria-label="Voltar para as conversas">' + icon('back') + '</button>' +
    personAvatar(selected.person || { name: selected.avatar }) + '<div class="min-w-0"><p class="truncate font-bold">' + escapeHtml(selected.name) + '</p><p class="truncate text-xs text-ink-soft">' + escapeHtml(selected.subtitle) + '</p></div></div></header>' +
    '<div id="chat-messages" class="chat-messages flex-1 overflow-y-auto p-5">' + renderHistory(history, role) + '</div>' +
    '<form id="message-form" class="chat-input-bar border-t border-line p-3 sm:p-4"><div class="composer"><label for="message-input" class="sr-only">' + t('Mensagem para') + ' ' + escapeHtml(selected.name) + '</label><input id="message-input" class="composer-input" placeholder="' + t('Escreva uma mensagem') + '" autocomplete="off" maxlength="2000" required/><button class="btn-primary chat-send shrink-0" aria-label="' + t('Enviar mensagem') + '">' + icon('send', 'size-4') + '</button></div></form></div></section>',
    { active: 'messages', role },
  )
}

function renderHistory(history, role) {
  if (!history.length) {
    const staff = role === 'staff'
    const replies = staff
      ? [t('Olá! Vi seu perfil e gostaria de conversar.'), t('Você tem disponibilidade para uma peneira?'), t('Pode me enviar vídeos de jogos recentes?')]
      : [t('Olá! Quero saber mais sobre as peneiras.'), t('Qual a próxima peneira para a minha posição?'), t('Como funciona a avaliação?')]
    return '<div data-empty-chat class="chat-empty"><span class="chat-empty-icon">' + icon('message', 'size-6') + '</span><strong>' + t('Comece a conversa') + '</strong><span class="text-sm text-ink-soft">' + t('Escolha uma sugestão ou escreva do seu jeito.') + '</span>' +
      '<div class="mt-2 flex flex-wrap justify-center gap-2">' + replies.map((text) => '<button type="button" class="chip-btn" data-quick-reply="' + escapeHtml(text) + '">' + escapeHtml(text) + '</button>').join('') + '</div></div>'
  }
  let html = ''
  history.forEach((message, i) => {
    const ts = messageTs(message)
    const prev = history[i - 1]
    const next = history[i + 1]
    const sameDay = (other) => other && new Date(messageTs(other)).toDateString() === new Date(ts).toDateString()
    const joinsPrev = prev && sameDay(prev) && prev.senderRole === message.senderRole && ts - messageTs(prev) < GROUP_WINDOW
    const joinsNext = next && sameDay(next) && next.senderRole === message.senderRole && messageTs(next) - ts < GROUP_WINDOW
    if (!prev || !sameDay(prev)) html += '<div class="chat-day" role="separator"><span>' + escapeHtml(dayLabel(ts)) + '</span></div>'
    html += messageBubble(message, role, joinsPrev && joinsNext ? 'middle' : joinsPrev ? 'last' : joinsNext ? 'first' : 'single')
  })
  return html
}

// Prancheta tática do fundo do login: a jogada (volante → meia → ponta → atacante → gol) é SMIL nativo do SVG.
const TACTIC_BOARD = '<svg class="tactic-board" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><g class="tb-lines"><rect x="40" y="40" width="1520" height="820" rx="6" pathLength="1"/><path d="M800 40v820" pathLength="1"/><circle cx="800" cy="450" r="120" pathLength="1"/><path d="M40 230h230v440H40M1560 230h-230v440h230" pathLength="1"/><path d="M40 350h80v200H40M1560 350h-80v200h80" pathLength="1"/><path d="M270 360a120 120 0 0 1 0 180M1330 360a120 120 0 0 0 0 180" pathLength="1"/></g><g class="tb-arrows"><path d="M300 170 C 400 110, 520 120, 620 200" pathLength="1"/><path d="M860 770 C 980 810, 1100 770, 1180 690" pathLength="1"/></g><circle cx="1250" cy="400" r="13" class="tb-opp" style="--d:0.60s"/><circle cx="1300" cy="560" r="13" class="tb-opp" style="--d:0.70s"/><circle cx="1180" cy="300" r="13" class="tb-opp" style="--d:0.80s"/><circle cx="1150" cy="690" r="13" class="tb-opp" style="--d:0.90s"/><circle cx="940" cy="520" r="13" class="tb-opp" style="--d:1.00s"/><circle cx="880" cy="280" r="13" class="tb-opp" style="--d:1.10s"/><circle cx="1520" cy="450" r="13" class="tb-opp" style="--d:1.20s"/><g class="tb-player pos-gk" style="--d:0.00s"><circle cx="110" cy="450" r="15" class="tb-dot"/><circle cx="110" cy="450" r="26" class="tb-halo"/></g><g class="tb-player pos-def" style="--d:0.12s"><circle cx="300" cy="170" r="15" class="tb-dot"/><circle cx="300" cy="170" r="26" class="tb-halo"/></g><g class="tb-player pos-def" style="--d:0.24s"><circle cx="300" cy="740" r="15" class="tb-dot"/><circle cx="300" cy="740" r="26" class="tb-halo"/></g><g class="tb-player pos-def" style="--d:0.36s"><circle cx="470" cy="90" r="15" class="tb-dot"/><circle cx="470" cy="90" r="26" class="tb-halo"/></g><g class="tb-player pos-mid" style="--d:0.48s"><circle cx="560" cy="640" r="15" class="tb-dot"/><circle cx="560" cy="640" r="26" class="tb-halo"/></g><g class="tb-player pos-mid" style="--d:0.60s"><circle cx="760" cy="420" r="15" class="tb-dot"/><circle cx="760" cy="420" r="26" class="tb-halo"/></g><g class="tb-player pos-atk" style="--d:0.72s"><circle cx="1000" cy="200" r="15" class="tb-dot"/><circle cx="1000" cy="200" r="26" class="tb-halo"/></g><g class="tb-player pos-atk" style="--d:0.84s"><circle cx="1100" cy="560" r="15" class="tb-dot"/><circle cx="1100" cy="560" r="26" class="tb-halo"/></g><g class="tb-player pos-mid" style="--d:0.96s"><circle cx="860" cy="770" r="15" class="tb-dot"/><circle cx="860" cy="770" r="26" class="tb-halo"/></g><g class="tb-trails"><line x1="560" y1="640" x2="760" y2="420" class="tb-trail" stroke-dasharray="297.3" stroke-dashoffset="297.3"><animate attributeName="stroke-dashoffset" dur="9s" repeatCount="indefinite" values="297.3;297.3;0;0;297.3" keyTimes="0;0.0000;0.1111;0.92;1"/><animate attributeName="opacity" dur="9s" repeatCount="indefinite" values="1;1;0" keyTimes="0;0.9;1"/></line><line x1="760" y1="420" x2="1000" y2="200" class="tb-trail" stroke-dasharray="325.6" stroke-dashoffset="325.6"><animate attributeName="stroke-dashoffset" dur="9s" repeatCount="indefinite" values="325.6;325.6;0;0;325.6" keyTimes="0;0.1556;0.2778;0.92;1"/><animate attributeName="opacity" dur="9s" repeatCount="indefinite" values="1;1;0" keyTimes="0;0.9;1"/></line><line x1="1000" y1="200" x2="1100" y2="560" class="tb-trail" stroke-dasharray="373.6" stroke-dashoffset="373.6"><animate attributeName="stroke-dashoffset" dur="9s" repeatCount="indefinite" values="373.6;373.6;0;0;373.6" keyTimes="0;0.3222;0.4444;0.92;1"/><animate attributeName="opacity" dur="9s" repeatCount="indefinite" values="1;1;0" keyTimes="0;0.9;1"/></line><line x1="1100" y1="560" x2="1556" y2="450" class="tb-trail tb-shot" stroke-dasharray="469.1" stroke-dashoffset="469.1"><animate attributeName="stroke-dashoffset" dur="9s" repeatCount="indefinite" values="469.1;469.1;0;0;469.1" keyTimes="0;0.4778;0.5333;0.92;1"/><animate attributeName="opacity" dur="9s" repeatCount="indefinite" values="1;1;0" keyTimes="0;0.9;1"/></line></g><circle cx="1556" cy="450" r="10" class="tb-goal"><animate attributeName="r" dur="9s" repeatCount="indefinite" values="10;10;90;90" keyTimes="0;0.5333;0.6333;1"/><animate attributeName="opacity" dur="9s" repeatCount="indefinite" values="0;.9;0;0" keyTimes="0;0.5333;0.6333;1"/></circle><g class="tb-ball"><circle r="9" class="tb-ball-core"/><animateMotion dur="9s" repeatCount="indefinite" path="M560 640 L760 420 L1000 200 L1100 560 L1556 450" keyPoints="0.0000;0.2029;0.2029;0.4250;0.4250;0.6799;0.6799;1.0000;1.0000" keyTimes="0.0000;0.1111;0.1556;0.2778;0.3222;0.4444;0.4778;0.5333;1.0000" calcMode="linear"/></g></svg>'

function loginPage() {
  return '<main id="conteudo" tabindex="-1" class="login-stage outline-none text-chalk">' + TACTIC_BOARD +
    '<header class="login-brand">' + brandLockup(40) + '</header>' +
    '<div class="login-layout"><section class="login-intro"><p class="live-pill"><span class="live-dot" aria-hidden="true"></span>' + t('Peneiras abertas · Sub-7 a Sub-20') + '</p>' +
    '<h1 class="login-title">' + t('Seu próximo jogo começa aqui.') + '</h1><p class="mt-4 max-w-md text-lg">' + t('Atletas de base, treinadores e olheiros no mesmo campo.') + '</p>' +
    '<div class="mt-8">' + partnerSeal() + '</div></section>' +
    '<div class="login-card surface surface--raised"><h2 class="text-3xl font-bold">' + t('Entrar') + '</h2><p class="mt-2 text-sm text-ink-soft">' + t('Escolha o tipo de conta antes de entrar.') + '</p>' +
    '<div class="segmented mt-6" role="group" aria-label="' + t('Tipo de conta') + '" data-active="0"><span class="seg-pill" aria-hidden="true"></span><button type="button" class="role-tab active" data-role="player" aria-pressed="true">' + icon('user', 'size-4 seg-icon') + t('Jogador') + '</button><button type="button" class="role-tab" data-role="staff" aria-pressed="false">' + icon('clipboard', 'size-4 seg-icon') + t('Funcionário') + '</button></div>' +
    '<form id="login-form" class="mt-6 space-y-4">' + input(t('E-mail'), 'login-email', '', 'email', true) + input(t('Senha'), 'login-password', '', 'password', true) + '<p id="login-error" class="hidden rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-xs font-semibold text-danger"></p><button class="btn-primary w-full" type="submit">' + t('Entrar') + ' ' + icon('arrow', 'size-4') + '</button></form>' +
    '<button type="button" class="mt-3 w-full text-center text-xs text-brand hover:text-brand-strong" data-action="forgot-password">' + t('Esqueci minha senha') + '</button>' +
    '<div class="my-6 flex items-center gap-3"><span class="h-px flex-1 bg-line"></span><span class="text-xs text-ink-soft">' + t('ou') + '</span><span class="h-px flex-1 bg-line"></span></div>' +
    '<button type="button" class="btn-secondary w-full" data-route="register">' + t('Criar conta de jogador') + '</button><button type="button" class="mt-3 w-full text-center text-xs text-ink-soft hover:text-chalk" data-action="demo">' + t('Entrar com conta demo') + '</button>' +
    '<button type="button" class="mt-4 inline-flex w-full items-center justify-center gap-1.5 text-xs text-ink-soft hover:text-chalk" data-action="change-lang">' + icon('globe', 'size-3.5') + ' ' + LANGS.find((l) => l.code !== getLang())?.label + '</button><div class="mt-3 flex justify-center">' + themeButton() + '</div>' +
    '<p class="mt-5 text-center text-xs leading-5 text-ink-soft">Funcionário (teste): funcionario@academiapele.com / Academia123!<br/>Jogador (teste): gabriel@academiapele.com / Demo123!</p></div></div></main>'
}

function passwordRecoveryPage() {
  return '<main id="conteudo" tabindex="-1" class="outline-none grid min-h-screen place-items-center bg-night px-4 py-8 text-chalk"><div class="w-full max-w-md rounded-card surface p-6 sm:p-10">' +
    '<div class="mb-6">' + brandLockup(32, false) + '</div><h1 class="text-3xl font-bold">' + t('Crie uma nova senha') + '</h1><p class="mt-3 text-sm leading-6 text-ink-soft">' + t('Escolha uma senha nova para voltar a acessar sua conta.') + '</p>' +
    '<form id="password-recovery-form" class="mt-6 space-y-4">' + input(t('Nova senha'), 'recovery-password', '', 'password', true) + input(t('Confirmar senha'), 'recovery-confirm', '', 'password', true) + '<p id="recovery-feedback" class="hidden rounded-2xl border px-4 py-3 text-sm" role="alert"></p><button class="btn-primary w-full" type="submit">' + t('Salvar nova senha') + '</button></form>' +
    '</div></main>'
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

// Cadastro em 3 etapas (dados sensíveis por último), com validação por etapa e volta sem perder nada.
const REG_STEPS = [
  { title: 'Você', hint: 'Nome, documento e idade', fields: ['reg-name', 'reg-cpf', 'reg-birth', 'reg-gender'] },
  { title: 'Seu jogo', hint: 'Posições e perna dominante', fields: ['reg-pos', 'reg-secondary', 'reg-foot'] },
  { title: 'Contato e acesso', hint: 'E-mail, endereço e senha', fields: ['reg-email', 'reg-phone', 'reg-zip', 'reg-city', 'reg-state', 'reg-district', 'reg-address', 'reg-number', 'reg-password', 'reg-confirm'] },
]
function registerPage() {
  regPhoto = null
  const step = (n, body) => '<fieldset class="reg-step" data-step="' + n + '"' + (n ? ' hidden' : '') + '><legend class="sr-only">' + REG_STEPS[n].title + '</legend><h2 class="reg-step-title" tabindex="-1">' + t(REG_STEPS[n].title) + '</h2><p class="mt-1 text-sm text-ink-soft">' + t(REG_STEPS[n].hint) + '</p><div class="mt-5 grid gap-4 sm:grid-cols-2">' + body + '</div></fieldset>'
  return '<main id="conteudo" tabindex="-1" class="register-stage outline-none text-chalk">' +
    '<aside class="register-aside"><button type="button" class="self-start" data-route="login" aria-label="' + t('Voltar para o login') + '">' + brandLockup(36) + '</button>' +
    '<div><h1 class="register-title">' + t('Criar conta de jogador') + '</h1><p class="mt-3 max-w-sm text-ink-soft">' + t('Três etapas curtas. A idade e a categoria saem da data de nascimento.') + '</p></div>' +
    '<ol class="stepper" aria-label="' + t('Etapas do cadastro') + '">' + REG_STEPS.map((item, i) => '<li data-stepper="' + i + '"' + (i ? '' : ' aria-current="step"') + '><span class="stepper-dot">' + (i + 1) + '</span><span><strong>' + t(item.title) + '</strong><small>' + t(item.hint) + '</small></span></li>').join('') + '</ol>' +
    '<div class="register-foot">' + partnerSeal() + '<p class="text-sm text-ink-soft">' + t('Já tem conta?') + ' <button type="button" class="font-semibold text-brand underline underline-offset-4" data-route="login">' + t('Entrar') + '</button></p></div></aside>' +
    '<section class="register-card surface surface--raised"><div class="reg-progress" aria-hidden="true"><span style="width:33.3%"></span></div><p class="mt-3 text-xs font-semibold text-ink-soft" data-step-label aria-live="polite">' + t('Etapa') + ' 1 ' + t('de') + ' 3</p>' +
    '<form id="register-form" class="mt-4" novalidate>' +
    step(0,
      '<div class="sm:col-span-2 flex items-center gap-4">' + photoUploader({ name: 'Atleta' }, 'reg-photo-input') + '<p class="text-sm text-ink-soft">' + t('Foto de perfil (opcional). Ajuda os olheiros a lembrarem de você.') + '</p></div>' +
      input(t('Nome completo'), 'reg-name', '', 'text', true) + input('CPF', 'reg-cpf', '', 'text', true) +
      input(t('Data de nascimento'), 'reg-birth', '', 'date', true) + input(t('Idade'), 'reg-age', '', 'number', false, false, true) +
      '<label class="field-label">' + t('Categoria') + '<select id="reg-category" class="field" disabled><option>' + t('Preencha a data de nascimento') + '</option></select></label>' +
      selectField(t('Gênero'), 'reg-gender', GENDERS, '')) +
    step(1,
      selectField(t('Posição principal'), 'reg-pos', POSITIONS, '') + selectField(t('Posição secundária'), 'reg-secondary', ['—'].concat(POSITIONS), '—') +
      selectField(t('Perna dominante'), 'reg-foot', FEET, '') +
      '<div class="sm:col-span-2" data-reg-preview></div>') +
    step(2,
      input(t('E-mail'), 'reg-email', '', 'email', true) + input(t('Telefone'), 'reg-phone', '', 'tel', true) +
      '<p class="form-group-title sm:col-span-2">' + t('Endereço') + '</p>' +
      input(t('CEP'), 'reg-zip', '', 'text', true) + input(t('Cidade'), 'reg-city', '', 'text', true) + input(t('Estado'), 'reg-state', '', 'text', true) + input(t('Bairro'), 'reg-district', '', 'text', true) +
      input(t('Endereço'), 'reg-address', '', 'text', true) + input(t('Número'), 'reg-number', '', 'text', true) +
      '<p class="form-group-title sm:col-span-2">' + t('Acesso') + '</p>' +
      input(t('Senha'), 'reg-password', '', 'password', true) + input(t('Confirmar senha'), 'reg-confirm', '', 'password', true) +
      '<p class="sm:col-span-2 text-xs leading-5 text-ink-soft">' + (remote.enabled ? t('Sua conta fica no servidor da plataforma. CPF, telefone e endereço são visíveis só para você.') : t('Modo local: os dados ficam apenas neste navegador. Não use senhas reais.')) + '</p>') +
    '<div id="reg-feedback" class="mt-4 hidden rounded-2xl border px-4 py-3 text-sm" role="alert"></div>' +
    '<div class="reg-nav"><button type="button" class="btn-ghost" data-reg-back hidden>' + icon('back', 'size-4') + ' ' + t('Voltar') + '</button><button type="button" class="btn-primary ml-auto" data-reg-next>' + t('Continuar') + ' ' + icon('arrow', 'size-4') + '</button><button class="btn-primary ml-auto" type="submit" hidden>' + t('Criar conta') + ' ' + icon('check', 'size-4') + '</button></div>' +
    '</form></section></main>'
}

function setFieldError(id, message) {
  const field = document.getElementById(id)
  if (!field) return
  let error = document.getElementById(id + '-err')
  field.setAttribute('aria-invalid', message ? 'true' : 'false')
  if (!message) { error?.remove(); field.removeAttribute('aria-describedby'); return }
  if (!error) {
    error = document.createElement('p')
    error.id = id + '-err'
    error.className = 'field-error'
    field.insertAdjacentElement('afterend', error)
  }
  error.textContent = message
  field.setAttribute('aria-describedby', error.id)
}

function validateRegisterStep(n) {
  const v = (id) => (document.getElementById(id)?.value || '').trim()
  const errors = []
  if (n === 0) {
    if (v('reg-name').length < 3) errors.push(['reg-name', t('Informe o nome completo.')])
    if (!validateCPF(v('reg-cpf'))) errors.push(['reg-cpf', t('CPF inválido. Confira os 11 dígitos.')])
    const age = getAgeFromBirth(v('reg-birth'))
    if (!validBirthDate(v('reg-birth'))) errors.push(['reg-birth', t('Informe uma data de nascimento válida.')])
    else if (age < 7 || age > 20) errors.push(['reg-birth', t('A faixa da plataforma é de 7 a 20 anos (até Sub-20).')])
    if (!v('reg-gender')) errors.push(['reg-gender', t('Selecione uma opção.')])
  }
  if (n === 1) {
    if (!v('reg-pos')) errors.push(['reg-pos', t('Selecione a posição principal.')])
    if (v('reg-secondary') === v('reg-pos') && v('reg-pos')) errors.push(['reg-secondary', t('Escolha uma posição diferente da principal.')])
    if (!v('reg-foot')) errors.push(['reg-foot', t('Selecione a perna dominante.')])
  }
  if (n === 2) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v('reg-email'))) errors.push(['reg-email', t('Informe um e-mail válido.')])
    ;['reg-phone', 'reg-zip', 'reg-city', 'reg-state', 'reg-district', 'reg-address', 'reg-number'].forEach((id) => { if (!v(id)) errors.push([id, t('Campo obrigatório.')]) })
    if (v('reg-password').length < 6) errors.push(['reg-password', t('Use pelo menos 6 caracteres.')])
    if (v('reg-confirm') !== v('reg-password')) errors.push(['reg-confirm', t('As senhas não coincidem.')])
  }
  REG_STEPS[n].fields.forEach((id) => setFieldError(id, ''))
  errors.forEach(([id, message]) => setFieldError(id, message))
  if (errors.length) document.getElementById(errors[0][0])?.focus()
  return !errors.length
}

function initRegisterSteps() {
  const form = document.querySelector('#register-form')
  if (!form || form.dataset.steps) return
  form.dataset.steps = '1'
  let current = 0
  const show = (n) => {
    current = n
    form.querySelectorAll('.reg-step').forEach((fieldset) => { fieldset.hidden = Number(fieldset.dataset.step) !== n })
    document.querySelectorAll('[data-stepper]').forEach((li) => {
      const i = Number(li.dataset.stepper)
      li.toggleAttribute('data-done', i < n)
      if (i === n) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current')
    })
    form.querySelector('[data-reg-back]').hidden = n === 0
    form.querySelector('[data-reg-next]').hidden = n === REG_STEPS.length - 1
    form.querySelector('[type="submit"]').hidden = n !== REG_STEPS.length - 1
    document.querySelector('.reg-progress span').style.width = ((n + 1) / REG_STEPS.length * 100) + '%'
    document.querySelector('[data-step-label]').textContent = t('Etapa') + ' ' + (n + 1) + ' ' + t('de') + ' ' + REG_STEPS.length
    if (n === 1) {
      const name = (document.querySelector('#reg-name')?.value || '').trim().split(' ')[0]
      const age = getAgeFromBirth(document.querySelector('#reg-birth')?.value)
      document.querySelector('[data-reg-preview]').innerHTML = name && Number.isFinite(age) ? '<p class="scout-note">' + escapeHtml(name) + ', ' + age + ' ' + t('anos') + ' · ' + escapeHtml(getCategoryFromAge(age)) + '. ' + t('Escolha onde você joga melhor; a secundária ajuda a encontrar mais peneiras.') + '</p>' : ''
    }
    form.querySelector('.reg-step:not([hidden]) .reg-step-title')?.focus()
  }
  // O erro some assim que a pessoa corrige o campo.
  form.addEventListener('input', (event) => { if (event.target.getAttribute('aria-invalid') === 'true') setFieldError(event.target.id, '') })
  form.addEventListener('change', (event) => { if (event.target.getAttribute('aria-invalid') === 'true') setFieldError(event.target.id, '') })
  form.querySelector('[data-reg-next]').addEventListener('click', () => { if (validateRegisterStep(current)) show(current + 1) })
  form.querySelector('[data-reg-back]').addEventListener('click', () => show(current - 1))
  // Enter num campo avança a etapa em vez de enviar o formulário inteiro
  form.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && event.target.matches('input') && current < REG_STEPS.length - 1) {
      event.preventDefault()
      if (validateRegisterStep(current)) show(current + 1)
    }
  })
  form.addEventListener('submit', (event) => { if (!validateRegisterStep(current)) { event.preventDefault(); event.stopImmediatePropagation() } }, true)
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
    ? 'border-danger/40 bg-danger/10 text-danger'
    : 'border-success/40 bg-success/10 text-success')
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
  const attrs = attributeAverages(athlete.id, athlete.pos)
  const rating = ratingOf(athlete)
  const strengths = strengthsOf(athlete)
  wrapper.innerHTML =
    '<div class="athlete-modal pos-' + positionGroup(athlete.pos) + ' max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-card surface surface--raised shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="athlete-modal-title" data-lenis-prevent>' +
    '<header class="athlete-modal-hero"><button type="button" class="icon-button athlete-modal-close" data-close-modal aria-label="Fechar">' + icon('close') + '</button>' +
    '<div class="flex flex-wrap items-end gap-5">' + personAvatar(athlete, 'avatar-xl profile-avatar athlete-modal-avatar') +
    '<div class="min-w-0 flex-1"><h2 id="athlete-modal-title" class="text-3xl font-semibold leading-tight">' + escapeHtml(athlete.name) + '</h2>' +
    '<p class="mt-1 text-ink-soft">' + athlete.age + ' ' + t('anos') + ' · ' + escapeHtml(athlete.city) + '/' + escapeHtml(athlete.state) + (athlete.demo ? ' · ' + t('perfil de exemplo') : '') + '</p>' +
    '<div class="mt-3 flex flex-wrap gap-1.5">' + posTag(athlete.pos) + posTag(athlete.secondary) + tag(getCategoryFromAge(athlete.age), true) + (athlete.gender ? tag(athlete.gender, true) : '') + '</div></div>' +
    '<div class="fut-badge" aria-label="Nota ' + formatRating(rating) + '"><span class="num text-[2rem] ' + rateClass(rating) + '">' + formatRating(rating) + '</span><span class="pos-abbr">' + (POSITION_ABBR[athlete.pos] || '—') + '</span></div></div></header>' +
    '<div class="p-6 sm:p-8">' +
    '<div class="scout-note"><p>' + escapeHtml(describeAthlete(athlete)) + '</p>' + (strengths.length ? '<p class="scout-strengths">' + strengths.map((item) => '<span>' + escapeHtml(item) + '</span>').join('') + '</p>' : '') + '</div>' +
    '<dl class="profile-stats mt-5 grid grid-cols-3 gap-3"><div><dt>' + t('Avaliações') + '</dt><dd class="num">' + reviews.length + '</dd></div><div><dt>' + t('Última avaliação') + '</dt><dd class="text-base font-semibold tabular">' + escapeHtml(reviews[0]?.date || '—') + '</dd></div><div><dt>' + t('Status') + '</dt><dd class="text-base font-semibold">' + escapeHtml(athlete.status || '—') + '</dd></div></dl>' +
    '<div class="mt-6 flex flex-wrap gap-2"><button type="button" class="btn-primary" data-message-athlete="' + athlete.id + '">' + icon('message', 'size-4') + ' ' + t('Abrir conversa') + '</button><button type="button" class="btn-secondary save-toggle" data-save="' + athlete.id + '" aria-pressed="' + isSaved(athlete.id) + '">' + icon('bookmark', 'size-4') + '<span>' + (isSaved(athlete.id) ? t('Na sua lista') : t('Salvar na lista')) + '</span></button>' +
    (state.user?.role === 'staff' ? '<button type="button" class="btn-secondary" data-review-athlete="' + athlete.id + '">' + icon('edit', 'size-4') + ' ' + t('Registrar avaliação') + '</button>' : '') + '</div>' +
    '<section class="mt-8 grid gap-6 md:grid-cols-[1fr_1.1fr]"><div><h3 class="section-title !mt-0">' + t('Atributos') + '</h3>' +
    (Object.keys(attrs.values).length ? '<div class="mt-3">' + radarChart(attrs.criteria, attrs.values) + '</div>' : '<div class="empty-state mt-3"><strong>' + t('Sem avaliação ainda') + '</strong><span class="text-sm">' + t('O radar aparece depois da primeira avaliação registrada.') + '</span></div>') + '</div>' +
    '<div><h3 class="section-title !mt-0">' + t('Avaliações') + ' <span class="text-ink-soft">(' + reviews.length + ')</span></h3><div class="mt-3 grid gap-3">' + (reviews.length ? reviews.map((review) => reviewCard(review, athlete.id)).join('') : '<p class="text-sm text-ink-soft">' + t('Nenhuma avaliação registrada ainda.') + '</p>') + '</div></div></section>' +
    '</div></div>'

  document.body.appendChild(wrapper)
  wrapper.querySelectorAll('[data-close-modal]').forEach((button) => button.addEventListener('click', () => wrapper.remove()))
  wrapper.addEventListener('click', (event) => { if (event.target === wrapper) wrapper.remove() })
  wrapper.querySelectorAll('[data-message-athlete]').forEach((button) => button.addEventListener('click', () => {
    const id = Number(button.dataset.messageAthlete)
    wrapper.remove()
    startConversationForAthlete(id)
  }))
  wrapper.querySelectorAll('[data-save]').forEach((button) => button.addEventListener('click', () => {
    const saved = toggleSaved(Number(button.dataset.save))
    button.querySelector('span').textContent = saved ? t('Na sua lista') : t('Salvar na lista')
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
    '<div class="w-full max-w-md rounded-card surface surface--raised p-6" role="dialog" aria-modal="true"><span class="eyebrow">' + escapeHtml(eyebrow) + '</span><h2 class="mt-2 text-2xl font-bold">' + escapeHtml(title) + '</h2><p class="mt-3 text-sm leading-6 text-ink-soft">' + escapeHtml(message) + '</p>' +
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
    '<div class="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-card surface surface--raised p-6 shadow-2xl sm:p-8" role="dialog" aria-modal="true" aria-labelledby="review-modal-title">' +
    '<div class="flex items-start justify-between gap-4"><div><h2 id="review-modal-title" class="mt-2 text-2xl font-bold">Avaliar ' + escapeHtml(athlete.name) + '</h2><p class="mt-1 text-sm text-ink-soft">Dê uma nota de 0 a 10 para cada característica. A nota base é uma média ponderada pela posição avaliada; as estatísticas da partida ajustam a nota em até ±' + String(MAX_ADJUSTMENT).replace('.', ',') + ' ponto.</p></div><button type="button" class="icon-button" data-close aria-label="Fechar">' + icon('close') + '</button></div>' +
    '<form id="review-form" class="mt-6 space-y-6">' +
    '<label class="field-label">' + t('Posição avaliada') + '<select id="review-position" class="field">' + positions.map((p, i) => '<option value="' + escapeHtml(p) + '">' + escapeHtml(p) + (i === 0 ? ' (principal)' : ' (secundária)') + '</option>').join('') + '</select></label>' +
    '<section><div class="flex items-center justify-between gap-3"><h3 class="font-bold">Características <span class="text-xs font-normal text-ink-soft">(0 a 10)</span></h3><span class="text-xs text-ink-soft">O “peso” mostra a importância na posição</span></div><div id="review-criteria" class="mt-3 grid gap-3 sm:grid-cols-2"></div>' +
    '<div class="mt-4 flex items-center justify-between gap-4 rounded-2xl border border-brand/20 bg-brand/7 p-4"><div><p class="text-sm font-bold text-brand">Nota final ponderada</p><p id="review-score-hint" class="mt-1 text-xs text-ink-soft"></p></div><p id="review-score" class="text-4xl font-bold text-brand">—</p></div></section>' +
    '<section><h3 class="font-bold">Estatísticas da partida <span class="text-xs font-normal text-ink-soft">(opcional • visível só para o atleta e para a equipe)</span></h3><div id="review-stats" class="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"></div></section>' +
    '<section><h3 class="font-bold">Pontos fortes <span class="text-xs font-normal text-ink-soft">(opcional)</span></h3><div class="mt-3 flex flex-wrap gap-2">' + STRENGTHS.map((item) => '<label class="check-pill"><input type="checkbox" name="strength" value="' + escapeHtml(item) + '"/><span>' + escapeHtml(item) + '</span></label>').join('') + '</div></section>' +
    '<label class="field-label">' + t('Comentário') + '<textarea id="review-comment" class="field min-h-28 resize-y" required placeholder="Descreva o que observou no jogo, atitude, evolução..."></textarea></label>' +
    '<p id="review-error" class="hidden rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-xs font-semibold text-danger" role="alert"></p>' +
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
      const tone = level === 'alto' ? 'text-brand' : level === 'médio' ? 'text-ink-soft' : 'text-ink-soft'
      return '<label class="field-label"><span class="flex items-center justify-between gap-2"><span>' + escapeHtml(c.label) + '</span><span class="text-xs font-bold uppercase tracking-wider ' + tone + '">peso ' + level + '</span></span><input class="field" type="number" inputmode="decimal" min="0" max="10" step="0.5" required placeholder="0 a 10" data-criterion="' + c.key + '" value="' + escapeHtml(keepCriteria[c.key] ?? '') + '"/></label>'
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
    '<div class="w-full max-w-md rounded-card surface surface--raised p-6" role="dialog" aria-modal="true" aria-labelledby="location-title">' +
    '<div class="flex items-center justify-between"><div><span class="eyebrow">' + t('Localidade') + '</span><h3 id="location-title" class="mt-1 text-xl font-bold">Confirmar local da peneira</h3></div><button type="button" class="icon-button" aria-label="Fechar" data-close>' + icon('close') + '</button></div>' +
    '<div class="mt-5 space-y-2">' +
    [
      ['Centro de Treinamento Pelé', 'São Paulo/SP'],
      ['Arena Oeste', 'Osasco/SP'],
      ['CT Litoral', 'Santos/SP'],
    ].map((item) => '<button type="button" class="location-option" data-location="' + escapeHtml(item[0] + ' — ' + item[1]) + '"><span class="grid size-10 place-items-center rounded-xl bg-brand/10 text-brand">' + icon('pin', 'size-4') + '</span><span class="text-left"><strong>' + escapeHtml(item[0]) + '</strong><small>' + escapeHtml(item[1]) + '</small></span></button>').join('') +
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
    '<div class="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-card surface surface--raised p-6 shadow-2xl sm:p-8" role="dialog" aria-modal="true" aria-labelledby="tryout-title">' +
    '<div class="flex items-start justify-between gap-4"><div><h2 id="tryout-title" class="mt-2 text-2xl font-bold">Criar e agendar</h2></div><button type="button" class="icon-button" aria-label="Fechar" data-close>' + icon('close') + '</button></div>' +
    '<form id="tryout-form" class="mt-6 grid gap-4 sm:grid-cols-2">' +
    input('Nome da peneira', 'try-title', '', 'text', true) +
    input('Data', 'try-date', '', 'date', true) +
    input('Horário', 'try-time', '', 'time', true) +
    input('Quantidade de vagas', 'try-seats', '12', 'number', true) +
    '<label class="field-label">Categoria<select id="try-category" class="field" required><option>Sub-7</option><option>Sub-9</option><option>Sub-11</option><option>Sub-13</option><option>Sub-15</option><option selected>Sub-20</option></select></label>' +
    '<div class="sm:col-span-2"><p class="field-label mb-2">Localidade</p><button type="button" id="location-button" class="field flex items-center justify-between text-left"><span id="location-value" class="text-ink-soft">Selecionar local...</span>' + icon('pin', 'size-4 text-brand') + '</button></div>' +
    '<div class="sm:col-span-2"><p class="field-label">' + t('Posições disponíveis') + '</p><div class="mt-2 grid grid-cols-2 gap-2 rounded-2xl border border-line bg-night/60 p-3 sm:grid-cols-3">' +
    POSITIONS.map((p, i) => '<label class="check-pill"><input type="checkbox" name="position" value="' + escapeHtml(p) + '" ' + (i === 6 ? 'checked' : '') + '/><span>' + escapeHtml(p) + '</span></label>').join('') +
    '</div></div>' +
    '<div id="tryout-error" class="sm:col-span-2 hidden rounded-2xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger" role="alert"></div>' +
    '<div class="flex justify-end gap-2 sm:col-span-2"><button type="button" class="btn-secondary" data-close>' + t('Cancelar') + '</button><button class="btn-primary" type="submit">' + t('Criar peneira') + ' ' + icon('check', 'size-4') + '</button></div></form></div>'

  document.body.appendChild(wrapper)
  wrapper.querySelectorAll('[data-close]').forEach((button) => button.addEventListener('click', () => wrapper.remove()))
  wrapper.querySelector('#location-button').addEventListener('click', () => openLocationModal((locationValue) => {
    wrapper.querySelector('#location-value').textContent = locationValue
    wrapper.querySelector('#location-value').classList.remove('text-ink-soft')
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
    if (remote.enabled) {
      const date = wrapper.querySelector('#try-date').value
      if (!date) {
        error.textContent = 'Informe a data da peneira.'
        error.classList.remove('hidden')
        return
      }
      runTryoutAction(wrapper.querySelector('[type="submit"]'), () => createTryout({
        title, date, time: wrapper.querySelector('#try-time').value, location: match ? match[1] : location.split(' — ')[0],
        city: cityState[0] || 'São Paulo', state: cityState[1] || 'SP', category: wrapper.querySelector('#try-category').value, positions, seats,
      }), t('Peneira criada e publicada para os atletas.')).then((ok) => { if (ok) wrapper.remove() })
      return
    }
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
    '<div class="w-full max-w-md rounded-card surface surface--raised p-6" role="dialog" aria-modal="true" aria-labelledby="withdraw-title"><h2 id="withdraw-title" class="mt-2 text-2xl font-bold">Sair da peneira?</h2>' +
    '<p class="mt-3 text-sm leading-6 text-ink-soft">Você será removido de <strong class="text-chalk">' + escapeHtml(tryout.title) + '</strong> (' + formatDate(tryout.date) + ' • ' + escapeHtml(tryout.time) + '). A vaga ficará livre para outros atletas.</p>' +
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
  if (tryout.remote && remote.enabled) {
    runTryoutAction(null, () => withdrawTryout(tryout.id, state.user.uid), t('Inscrição cancelada. A vaga foi liberada.'))
    return
  }
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
    '<div class="w-full max-w-lg rounded-card surface surface--raised p-6" role="dialog" aria-modal="true" aria-labelledby="cancel-title"><h2 id="cancel-title" class="mt-2 text-2xl font-bold">' + escapeHtml(tryout.title) + '</h2>' +
    '<p class="mt-3 text-sm leading-6 text-ink-soft">' + (total ? '<strong class="text-chalk">' + total + ' inscrito(s)</strong> receberão um aviso automático com o motivo abaixo.' : 'Não há inscritos nesta peneira, então nenhum aviso será enviado.') + ' Esta ação remove a peneira da lista e não pode ser desfeita.</p>' +
    '<form id="cancel-tryout-form" class="mt-5"><label class="field-label">' + t('Motivo do cancelamento (opcional)') + '<textarea id="cancel-reason" class="field min-h-24 resize-y" maxlength="240" placeholder="Ex.: chuva forte, campo indisponível, nova data será divulgada."></textarea></label>' +
    '<div class="mt-6 flex justify-end gap-2"><button type="button" class="btn-secondary" data-close>Manter peneira</button><button type="submit" class="btn-danger">Cancelar peneira e avisar inscritos</button></div></form></div>'
  document.body.appendChild(wrapper)
  wrapper.querySelector('[data-close]').addEventListener('click', () => wrapper.remove())
  wrapper.addEventListener('click', (event) => { if (event.target === wrapper) wrapper.remove() })
  wrapper.querySelector('#cancel-tryout-form').addEventListener('submit', (event) => {
    event.preventDefault()
    const reason = wrapper.querySelector('#cancel-reason').value.trim() || 'A peneira foi cancelada por uma eventualidade.'
    const when = formatDate(tryout.date) + ' • ' + tryout.time
    if (tryout.remote && remote.enabled) {
      runTryoutAction(wrapper.querySelector('[type="submit"]'), () => cancelTryout(tryout.id, reason), t('Peneira cancelada. Os inscritos verão o motivo na tela de peneiras.')).then((ok) => { if (ok) wrapper.remove() })
      return
    }
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
    '<div class="max-h-[86vh] w-full max-w-xl overflow-y-auto rounded-card surface surface--raised p-6" role="dialog" aria-modal="true"><div class="flex items-start justify-between gap-3"><div><span class="eyebrow">Inscritos • ' + emails.length + '/' + escapeHtml(tryout.seats) + '</span><h2 class="mt-2 text-2xl font-bold">' + escapeHtml(tryout.title) + '</h2></div><button type="button" class="icon-button" aria-label="Fechar" data-close>' + icon('close') + '</button></div><div class="mt-5 space-y-2">' +
    (profiles.length ? profiles.map((profile) => '<div class="flex items-center justify-between gap-3 rounded-2xl surface p-4"><div class="flex items-center gap-3"><span class="avatar">' + avatar(profile.name) + '</span><div><p class="font-semibold">' + escapeHtml(profile.name) + '</p><p class="text-xs text-ink-soft"><span class="text-brand">Principal:</span> ' + escapeHtml(profile.pos) + ' • <span class="text-brand">Secundária:</span> ' + escapeHtml(profile.secondary && profile.secondary !== '—' ? profile.secondary : 'nenhuma') + '</p><p class="text-xs text-ink-soft">' + escapeHtml(getCategoryFromAge(getAgeFromProfile(profile.birth))) + ' • ' + escapeHtml(profile.city) + (profile.foot ? ' • ' + escapeHtml(profile.foot) : '') + '</p></div></div><div class="flex shrink-0 flex-col gap-1"><button type="button" class="btn-ghost" data-view-email="' + escapeHtml(profile.email) + '">Ver perfil</button><button type="button" class="btn-ghost" data-message-email="' + escapeHtml(profile.email) + '">Mensagem</button></div></div>').join('') : '<div class="rounded-2xl border border-dashed border-line p-8 text-center text-ink-soft">Ainda não há inscritos nesta peneira.</div>') +
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
    '<div class="w-full max-w-lg rounded-card surface surface--raised p-6" role="dialog" aria-modal="true" aria-labelledby="notifications-title">' +
    '<div class="flex items-center justify-between gap-3"><div><h2 id="notifications-title" class="mt-1 text-2xl font-bold">Notificações</h2></div><button type="button" class="icon-button" aria-label="Fechar" data-close>' + icon('close') + '</button></div>' +
    '<div class="mt-5 space-y-2">' +
    (unreadSummary().total ? '<article class="rounded-2xl surface p-4"><div class="flex items-start justify-between gap-3"><div><p class="font-semibold">' + plural(unreadSummary().total, 'mensagem não lida', 'mensagens não lidas') + '</p><p class="mt-1 text-sm text-ink-soft">' + t('De') + ' ' + escapeHtml(joinPt(unreadSummary().people)) + '.</p></div><button type="button" class="btn-secondary shrink-0" data-open-unread>' + t('Abrir') + '</button></div></article>' : '') +
    (myNotifications().length ? myNotifications().map((n) => '<article class="rounded-2xl surface p-4"><div class="flex items-start justify-between gap-3"><div><p class="font-semibold">' + escapeHtml(n.title) + '</p><p class="mt-1 text-sm text-ink-soft">' + escapeHtml(n.text) + '</p></div><span class="text-xs text-ink-soft">' + escapeHtml(n.time) + '</span></div></article>').join('') : '<div class="rounded-2xl border border-dashed border-line p-8 text-center text-ink-soft">Nenhuma notificação.</div>') +
    '</div><button type="button" class="btn-secondary mt-5 w-full" data-clear-notifications>Marcar como lidas</button></div>'

  document.body.appendChild(wrapper)
  wrapper.querySelector('[data-close]').addEventListener('click', () => wrapper.remove())
  wrapper.querySelector('[data-open-unread]')?.addEventListener('click', () => { wrapper.remove(); openUnreadConversation() })
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
    '<div class="fixed inset-0 z-[70] bg-black/70 p-4 backdrop-blur-sm" data-close-mobile><div class="ml-auto w-[min(86vw,340px)] rounded-card surface surface--raised p-4 shadow-2xl" role="dialog" aria-modal="true"><div class="flex items-center justify-between"><p class="font-bold">Navegação</p><button type="button" class="icon-button" data-close-mobile aria-label="Fechar menu">' + icon('close') + '</button></div><div class="mt-4 grid gap-2">' +
    (state.user?.role === 'staff'
      ? [['dashboard',t('Visão geral')],['athletes',t('Atletas')],['tryouts',t('Peneiras')],['messages',t('Conversas')],['profile',t('Perfil')]]
      : [['dashboard',t('Início')],['profile',t('Meu perfil')],['tryouts',t('Peneiras')],['messages',t('Conversas')]]
    ).map((item) => '<button type="button" class="nav-link justify-start" data-route="' + item[0] + '" data-close-mobile>' + item[1] + '</button>').join('') +
    '<div class="mt-3 flex items-center gap-2 border-t border-line pt-3">' + themeButton() + '<button type="button" class="btn-ghost" data-action="change-lang">' + icon('globe', 'size-4') + ' ' + LANGS.find((l) => l.code !== getLang())?.label + '</button></div>' +
    '</div></div></div>'
  root.querySelectorAll('[data-route]').forEach((button) => button.addEventListener('click', () => { root.innerHTML = ''; go(button.dataset.route) }))
  root.querySelectorAll('[data-close-mobile]').forEach((button) => button.addEventListener('click', (event) => { if (event.target === button || button.hasAttribute('aria-label')) root.innerHTML = '' }))
}

function exportSelection() {
  const athletes = state.filteredAthletes || state.athletes
  const header = ['Nome', t('Idade'), t('Categoria'), t('Gênero'), t('Perna dominante'), t('Posição principal'), t('Posição secundária'), t('Cidade'), t('Estado'), 'Nota média', 'Avaliações']
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

function clearFilters() {
  ;['filter-name', 'filter-pos', 'filter-foot', 'filter-city', 'filter-age', 'filter-category'].forEach((id) => {
    const field = document.querySelector('#' + id)
    if (field) field.value = ''
  })
  applyFilters()
}

function applyFilters() {
  const name = document.querySelector('#filter-name')?.value || ''
  const pos = document.querySelector('#filter-pos')?.value || ''
  const city = document.querySelector('#filter-city')?.value || ''
  const age = document.querySelector('#filter-age')?.value || ''
  const category = document.querySelector('#filter-category')?.value || ''
  const foot = document.querySelector('#filter-foot')?.value || ''
  const filtered = filterAthletes(state.athletes, { name, pos, city, age, category, foot }).filter((a) => !watchOnly || isSaved(a.id))
  state.filteredAthletes = filtered
  const grid = document.querySelector('#athlete-grid')
  if (grid) {
    const emptyWatch = watchOnly && !state.athletes.some((a) => isSaved(a.id))
    grid.innerHTML = filtered.map((a) => athleteCard(a, true)).join('') || (emptyWatch
      ? '<div class="empty-state md:col-span-2 xl:col-span-3">' + icon('bookmark', 'size-6 text-brand') + '<strong>' + t('Sua lista de observação está vazia') + '</strong><span class="text-sm">' + t('Toque no marcador de um card para salvar o atleta e acompanhar aqui.') + '</span><button type="button" class="btn-secondary mt-2" data-action="toggle-watchlist">' + t('Ver todos os atletas') + '</button></div>'
      : '<div class="empty-state md:col-span-2 xl:col-span-3"><strong>' + t('Nenhum atleta com esses filtros') + '</strong><span class="text-sm">' + t('Remova um filtro para ver mais atletas.') + '</span><button type="button" class="btn-secondary mt-2" data-action="clear-filters-empty">' + t('Limpar filtros') + '</button></div>')
    grid.querySelector('[data-action="clear-filters-empty"]')?.addEventListener('click', clearFilters)
  }
  const count = document.querySelector('#athlete-count')
  if (count) {
    count.textContent = plural(filtered.length, 'atleta encontrado', 'atletas encontrados')
    count.classList.remove('bump')
    void count.offsetWidth
    count.classList.add('bump')
  }
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
      data: { birth: next.birth, gender: next.gender, foot: next.foot, pos: next.pos, secondary: next.secondary, city: next.city, state: next.state, photo: p.photo || null },
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
    photo: regPhoto,
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
    if (regPhoto) { try { await savePhoto(regPhoto) } catch (error) { console.warn('[Supabase] foto não salva:', error) } }
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
  setTimeout(() => { updateMessageBadge(); announceUnread() }, 600)
  return true
}

function isConnectionError(error) {
  const message = String(error?.message || error || '').toLowerCase()
  return ['failed to fetch', 'network', 'timeout', 'load failed', 'connection'].some((part) => message.includes(part))
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
      if (isConnectionError(result.error)) {
        disableRemote()
        state.accounts = readStorage('ap_accounts', state.accounts)
        return loginAccount()
      }
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
  setTimeout(() => { updateMessageBadge(); announceUnread() }, 600)
}

async function loginDemo() {
  const role = document.querySelector('.role-tab.active')?.dataset.role || 'player'
  disableRemote()
  state.accounts = readStorage('ap_accounts', state.accounts)

  const email = role === 'staff' ? 'funcionario@academiapele.com' : 'gabriel@academiapele.com'
  const account = state.accounts.find((entry) => entry.email === email)
  if (!account) return
  state.user = { name: account.profile.name, email: account.email, role }
  state.profile = role === 'player' ? account.profile : null
  persist()
  go('dashboard')
  toast('Modo demonstração local: os dados ficam salvos neste navegador.')
}

// Evita erros silenciosos em operações assíncronas (rede, Supabase...)
function safely(promise) {
  promise.catch((error) => {
    console.error(error)
    toast(describeError(error), 'error')
    document.querySelectorAll('form button[type="submit"][disabled]').forEach((button) => button.removeAttribute('disabled'))
  })
}

// Seletor segmentado (Jogador/Funcionário): pílula desliza com mola; setas do teclado trocam a opção.
function initLoginRoleButtons() {
  document.querySelectorAll('.segmented').forEach((group) => {
    const buttons = [...group.querySelectorAll('[data-role]')]
    const select = (index, focus = false) => {
      group.dataset.active = String(index)
      buttons.forEach((item, i) => {
        item.classList.toggle('active', i === index)
        item.setAttribute('aria-pressed', String(i === index))
      })
      if (focus) buttons[index].focus()
    }
    buttons.forEach((button, i) => button.addEventListener('click', () => select(i)))
    group.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault()
        select(event.key === 'ArrowRight' ? Math.min(buttons.length - 1, Number(group.dataset.active) + 1) : Math.max(0, Number(group.dataset.active) - 1), true)
      }
    })
  })
}


// Atualiza as listas de atletas sem perder os filtros digitados.
function refreshAthleteViews() {
  if (document.querySelector('#athlete-grid')) applyFilters()
  else render()
}

// Salva ou tira da lista de observação; atualiza todos os marcadores daquele atleta na tela, com animação.
function toggleSaved(athleteId) {
  toggleFavorite(state, athleteId)
  persist()
  const saved = isSaved(athleteId)
  const name = state.athletes.find((a) => a.id === athleteId)?.name || ''
  document.querySelectorAll('[data-save="' + athleteId + '"]').forEach((button) => {
    button.setAttribute('aria-pressed', String(saved))
    if (button.classList.contains('icon-button')) { button.setAttribute('aria-label', saveLabel(saved, name)); button.title = saveLabel(saved) }
    button.classList.remove('just-saved')
    void button.offsetWidth
    if (saved) button.classList.add('just-saved')
  })
  const counter = document.querySelector('#watch-count')
  if (counter) counter.textContent = state.favorites.filter((id) => state.athletes.some((a) => a.id === id)).length
  // Com o filtro ligado, quem sai da lista sai da grade.
  if (watchOnly && !saved) applyFilters()
  return saved
}

function bindDynamicCards() {
  app.querySelectorAll('[data-open-athlete]').forEach((button) => button.addEventListener('click', () => openAthleteModal(Number(button.dataset.openAthlete))))
  app.querySelectorAll('[data-message-athlete]').forEach((button) => button.addEventListener('click', () => startConversationForAthlete(Number(button.dataset.messageAthlete))))
  app.querySelectorAll('[data-save]').forEach((button) => button.addEventListener('click', (event) => {
    event.stopPropagation()
    toggleSaved(Number(button.dataset.save))
  }))
}

function bind() {
  document.querySelectorAll('[data-route]').forEach((button) => button.addEventListener('click', (event) => {
    event.preventDefault()
    go(button.dataset.route)
  }))
  initLoginRoleButtons()
  bindPhotoInputs(app)
  initRegisterSteps()
  // Prancheta do login: com "reduzir movimento", congela num quadro da jogada (o SMIL não obedece ao CSS).
  const board = document.querySelector('.tactic-board')
  if (board && matchMedia('(prefers-reduced-motion: reduce)').matches) { board.pauseAnimations(); board.setCurrentTime(3.6) }
  // Celular/tablet: campo inteiro em miniatura no topo (no desktop ele preenche a tela).
  if (board && matchMedia('(max-width: 63.99rem)').matches) board.setAttribute('preserveAspectRatio', 'xMidYMin meet')
  bindDynamicCards()


  document.querySelectorAll('[data-action="home"]').forEach((button) => button.addEventListener('click', () => {
    document.querySelectorAll('body > div.fixed.inset-0').forEach((modal) => modal.remove())
    if (currentRoute() === 'dashboard') window.scrollTo({ top: 0, behavior: 'smooth' })
    else go('dashboard')
  }))
  document.querySelectorAll('[data-action="notifications"]').forEach((button) => button.addEventListener('click', openNotifications))
  document.querySelectorAll('[data-action="menu"]').forEach((button) => button.addEventListener('click', openMobileMenu))

  document.querySelectorAll('[data-action="clearFilters"]').forEach((button) => button.addEventListener('click', clearFilters))

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

  const filtersPanel = document.querySelector('#filters-panel')
  const setFilters = (open) => {
    filtersPanel.dataset.open = String(open)
    document.querySelector('.filters-scrim').dataset.open = String(open)
    document.querySelector('[data-filters-open]')?.setAttribute('aria-expanded', String(open))
    if (open) filtersPanel.querySelector('input, select')?.focus()
    else document.querySelector('[data-filters-open]')?.focus()
  }
  if (filtersPanel) {
    document.querySelector('[data-filters-open]')?.addEventListener('click', () => setFilters(true))
    document.querySelectorAll('[data-filters-close]').forEach((el) => el.addEventListener('click', () => setFilters(false)))
    filtersPanel.addEventListener('keydown', (event) => { if (event.key === 'Escape' && filtersPanel.dataset.open === 'true') setFilters(false) })
  }
  document.querySelectorAll('[data-tryout-filter]').forEach((button) => button.addEventListener('click', () => {
    tryoutFilter = button.dataset.tryoutFilter
    if (currentRoute() !== 'tryouts') { go('tryouts'); return }
    render()
    document.querySelector('[data-tryout-filter="' + tryoutFilter + '"]')?.focus()
  }))
  document.querySelector('[data-hide-checklist]')?.addEventListener('click', () => {
    try { localStorage.setItem('ap_hide_checklist:' + state.user.email, '1') } catch {}
    render()
  })
  document.querySelectorAll('[data-action="retry-tryouts"]').forEach((button) => button.addEventListener('click', () => {
    state.tryoutsStatus = 'loading'
    render()
    refreshRemoteTryouts().then(render)
  }))
  document.querySelectorAll('[data-action="enroll"]').forEach((button) => button.addEventListener('click', () => {
    const tryout = state.tryouts.find((item) => item.id === Number(button.dataset.id))
    if (!tryout || state.user?.role !== 'player') return
    const enrolled = Array.isArray(tryout.enrolled) ? tryout.enrolled : (tryout.enrolled = [])
    if (enrolled.includes(state.user.email)) return
    if (tryout.status === 'cancelled' || isPastTryout(tryout)) return toast(t('Esta peneira já foi encerrada.'), 'error')
    const vacancies = Number(tryout.seats) - enrolled.length
    const category = getCategoryFromAge(getAgeFromProfile(state.profile?.birth))
    const compatible = tryout.positions.includes(state.profile?.pos) || tryout.positions.includes(state.profile?.secondary)
    if (tryout.category && tryout.category !== category) return toast(t('Sua categoria não corresponde à desta peneira.'), 'error')
    if (!compatible) return toast(t('Sua posição não está entre as posições aceitas.'), 'error')
    if (vacancies <= 0) return toast(t('Não há mais vagas nesta peneira.'), 'error')
    if (tryout.remote && remote.enabled) {
      runTryoutAction(button, () => enrollTryout(tryout.id), t('Inscrição confirmada.')).then((ok) => {
        if (ok) notify(state.user.email, t('Inscrição confirmada'), 'Você se inscreveu em ' + tryout.title + '.')
      })
      return
    }
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
    if (sent === false) {
      if (!field.value) field.value = text
      // Treme o campo: mostra onde está a mensagem que não saiu.
      messageForm.classList.remove('is-refused')
      void messageForm.offsetWidth
      messageForm.classList.add('is-refused')
      messageForm.addEventListener('animationend', () => messageForm.classList.remove('is-refused'), { once: true })
    }
  })
}

// Tela mostrada uma única vez (antes do login) para escolher o idioma. Pode ser
// reaberta pelo botão de idioma no cabeçalho ou no rodapé da tela de login.
function render() {
  const route = currentRoute()
  if (route !== 'messages') mobileChatOpen = false
  let pushChatEntry = false
  if (route === 'messages' && openChatOnArrive) {
    openChatOnArrive = false
    if (isMobileView()) {
      mobileChatOpen = true
      pushChatEntry = true
    }
  }
  if (route === 'design-system') {
    const isNew = route !== lastRoute
    lastRoute = route
    paintScreen(() => {
      app.innerHTML = designSystemPage({ icon, input, selectField, tag, athleteCard, positions: POSITIONS, posTag, ballLoader, scoreboard, pitchFormation, rateClass })
      bindDesignSystem(app, { toast, confirmDialog, scrollToElement, initSegmented: initLoginRoleButtons })
      if (isNew) scrollToTop()
      enterPage(app, isNew)
    }, isNew)
    return
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

  const isNew = route !== lastRoute
  lastRoute = route
  paintScreen(() => {
    app.innerHTML = view
    bind()
    if (pushChatEntry) history.pushState({ apChat: true }, '')
    document.body.classList.toggle('chat-open', route === 'messages' && mobileChatOpen)
    updateMessageBadge()
    if (isNew) scrollToTop()
    enterPage(app, isNew)
  }, isNew)
  if (['athletes', 'dashboard', 'tryouts'].includes(route)) refreshRemote()
  syncMessagePolling(route)
}

// Atualização automática: quando outra aba/janela altera os dados (inscrição, cancelamento,
// mensagem...), esta tela é atualizada sem precisar recarregar.
function reloadSharedState() {
  if (!remote.enabled) {
    state.tryouts = readStorage('ap_tryouts', state.tryouts)
    state.messages = readStorage('ap_messages', state.messages)
  }
  state.notifications = readStorage('ap_notifications', state.notifications)
  if (!remote.enabled) {
    state.accounts = readStorage('ap_accounts', state.accounts)
  }
  state.reviews = readStorage('ap_reviews', state.reviews)
  state.favorites = readStorage('ap_favorites', state.favorites)
  syncAthletes()
}

window.addEventListener('storage', (event) => {
  if (!state.user || !event.key || !event.key.startsWith('ap_') || ['ap_user', 'ap_profile', 'ap_lastread'].includes(event.key)) return
  if (remote.enabled && event.key === 'ap_accounts') return
  const before = myNotifications().length
  reloadSharedState()
  const after = myNotifications().length
  const route = currentRoute()
  if (route === 'athletes') applyFilters()
  else if (route === 'messages') { if (!document.querySelector('#message-input')?.value) render() }
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

// Modais: todos são criados com document.body.appendChild(wrapper) contendo [role="dialog"].
// Este observador cuida, num lugar só, do que todos precisam: título acessível, foco inicial,
// Tab preso dentro do modal, Esc para fechar e foco devolvido a quem abriu.
const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
const openDialogs = []
const topDialog = () => openDialogs[openDialogs.length - 1]

new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      const dialog = node.nodeType === 1 && (node.matches('[role="dialog"]') ? node : node.querySelector('[role="dialog"]'))
      if (!dialog) return
      if (!dialog.hasAttribute('aria-labelledby') && !dialog.hasAttribute('aria-label')) {
        const heading = dialog.querySelector('h2, h3')
        if (heading) {
          heading.id ||= 'dialog-title-' + Date.now()
          dialog.setAttribute('aria-labelledby', heading.id)
        }
      }
      openDialogs.push({ wrapper: node, dialog, opener: document.activeElement })
      const first = dialog.querySelector('input:not([disabled]):not([type="hidden"]),select,textarea') || dialog.querySelector(FOCUSABLE)
      ;(first || dialog).focus?.()
    })
    mutation.removedNodes.forEach((node) => {
      const index = openDialogs.findIndex((item) => item.wrapper === node)
      if (index === -1) return
      const [closed] = openDialogs.splice(index, 1)
      if (closed.opener?.isConnected) closed.opener.focus()
      else document.querySelector('#conteudo')?.focus()
    })
  })
}).observe(document.body, { childList: true })

document.addEventListener('keydown', (event) => {
  const current = topDialog()
  if (!current) return
  if (event.key === 'Escape') {
    event.preventDefault()
    const close = current.wrapper.querySelector('[data-close], [data-close-modal], [data-x]')
    if (close) close.click()
    else current.wrapper.remove()
    return
  }
  if (event.key !== 'Tab') return
  const items = [...current.dialog.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null)
  if (!items.length) return
  const first = items[0]
  const last = items[items.length - 1]
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
  else if (!current.dialog.contains(document.activeElement)) { event.preventDefault(); first.focus() }
})

document.querySelector('.skip-link')?.addEventListener('click', (event) => {
  event.preventDefault()
  document.querySelector('#conteudo')?.focus()
})

initSmoothScroll()
initSpotlight()

// Abertura: na primeira visita da sessão fica no mínimo 1,5 s (a interface já monta por baixo);
// depois disso, ou com "reduzir movimento", sai assim que o app estiver pronto. Clique ou Esc pulam.
const SPLASH_MIN = 1500
function finishSplash() {
  const splash = document.querySelector('#splash')
  if (!splash) return
  let first = true
  try { first = !sessionStorage.getItem('ap_intro'); sessionStorage.setItem('ap_intro', '1') } catch {}
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
  const wait = first && !reduced ? Math.max(0, SPLASH_MIN - performance.now()) : 0
  app.inert = true
  const close = () => {
    if (!splash.isConnected) return
    app.inert = false
    splash.classList.add('is-done')
    splash.addEventListener('animationend', () => splash.remove(), { once: true })
    setTimeout(() => splash.remove(), 900)
    document.removeEventListener('keydown', onKey)
  }
  const onKey = (event) => { if (event.key === 'Escape') close() }
  splash.addEventListener('click', close)
  document.addEventListener('keydown', onKey)
  setTimeout(close, wait)
}

async function boot() {
  app.innerHTML = '<div class="grid min-h-screen place-items-center text-sm text-ink-soft">Carregando...</div>'
  if (await initRemote()) {
    // Com o Supabase, a sessão vem do servidor (não do localStorage)
    state.user = null
    state.profile = null
    state.accounts = readStorage('ap_accounts', state.accounts)
    try {
      const session = await getSessionUser()
      if (session) await hydrateRemote(session.uid)
    } catch (error) {
      console.warn('[Supabase] não foi possível restaurar a sessão:', error)
      disableRemote()
      state.user = null
      state.profile = null
      state.accounts = readStorage('ap_accounts', state.accounts)
      state.messages = readStorage('ap_messages', state.messages)
    }
  } else {
    ensureReadBaseline('local')
  }
  syncAthletes()
  booted = true
  render()
  finishSplash()
  startInboxWatch()
  if (state.user) setTimeout(announceUnread, 900)
}
boot()
