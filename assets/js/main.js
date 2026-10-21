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
import { todayIso, isPastTryout, daysUntil, startsAt, validTime, validTryoutDate, tryoutPhase, enrollmentOpen, countdown, bigCountdown } from './schedule.js'
import { initSmoothScroll, paintScreen, enterPage, scrollToTop, scrollToElement } from './motion.js'
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
import { threadKey, searchConversations, normalize } from './messages.js'
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
  fetchVenues,
  saveVenue,
  fetchTeam,
  createStaffInvite,
  revokeStaffInvite,
  updateStaff,
  checkStaffInvite,
  fetchGuardians,
  saveGuardian,
  revokeGuardianConsent,
  setAttendance,
  sendContactMessage,
  fetchContactMessages,
  markContactHandled,
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
  { email: 'funcionario@academiapele.com', name: 'Marina Lopes', position: 'Olheira', phone: '(11) 99999-0000', admin: true, pro: {
    org: 'Pelé Academia', team: 'Captação · Sub-15 a Sub-20', since: 2021,
    bio: 'Observa jogos de escolinhas e da várzea na Grande São Paulo e organiza as peneiras de meio-campo e ataque. Numa peneira, olha primeiro a tomada de decisão: para onde o atleta olha antes de receber a bola.',
    specialties: ['Meia', 'Ponta', 'Atacante'], categories: ['Sub-15', 'Sub-17', 'Sub-20'],
    experience: [{ role: 'Olheira', org: 'Pelé Academia', start: '2021', end: '' }, { role: 'Analista de desempenho', org: 'Escolinha de futebol (Osasco/SP)', start: '2017', end: '2021' }],
    credentials: ['Curso de análise de desempenho no futebol', 'Educação Física (bacharelado)'], linkedin: '' } },
  { email: 'treinador@academiapele.com', name: 'Bruno Martins', position: 'Treinador', phone: '(11) 99999-1111', pro: {
    org: 'Pelé Academia', team: 'Categorias de base · Sub-11 a Sub-15', since: 2022,
    bio: 'Treina as categorias de base e avalia goleiros e defensores nas peneiras. Gosta de ver o atleta errar e tentar de novo: a reação ao erro conta tanto quanto o acerto.',
    specialties: ['Goleiro', 'Zagueiro', 'Lateral', 'Volante'], categories: ['Sub-11', 'Sub-13', 'Sub-15'],
    experience: [{ role: 'Treinador', org: 'Pelé Academia', start: '2022', end: '' }, { role: 'Auxiliar técnico', org: 'Projeto social de futebol (Guarulhos/SP)', start: '2018', end: '2022' }],
    credentials: ['Licença de treinador de futebol de base', 'Primeiros socorros no esporte'], linkedin: '' } },
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

// Peneiras de exemplo organizadas pelas contas de exemplo da equipe (o atleta vê quem organiza e abre o perfil).
const DEMO_TRYOUT_OWNER = { 1: 'funcionario@academiapele.com', 2: 'funcionario@academiapele.com', 3: 'treinador@academiapele.com' }
const defaultTryouts = [
  { id: 1, title: 'Peneira Sub-20 — Atacantes', date: '2026-11-07', time: '14:00', city: 'São Paulo', state: 'SP', location: 'Centro de Treinamento Pelé', venueId: 1, category: 'Sub-20', positions: ['Atacante', 'Ponta'], seats: 12, enrolled: ['gabriel@academiapele.com'], description: 'Aquecimento, finalização em dupla e um jogo coletivo de 2 tempos de 25 minutos.\n\nO que levar: chuteira de campo, caneleira, água e documento com foto.\nChegada: 30 minutos antes, na recepção.' },
  { id: 2, title: 'Avaliação Sub-20 — Meio-campo', date: '2026-11-14', time: '09:00', city: 'Osasco', state: 'SP', location: 'Arena Oeste', venueId: 2, category: 'Sub-20', positions: ['Meia', 'Volante'], seats: 18, enrolled: [], description: 'Treino de passe e posicionamento seguido de jogo reduzido. A comissão observa tomada de decisão e leitura de jogo.' },
  { id: 3, title: 'Goleiros em Destaque', date: '2026-11-21', time: '10:30', city: 'Barueri', state: 'SP', location: 'Centro de Treinamento Oeste', venueId: 4, category: 'Sub-20', positions: ['Goleiro'], seats: 8, enrolled: [] },
]

// Locais de exemplo: os mesmos que o seletor antigo trazia fixos no código. O endereço fica em branco
// de propósito (não inventamos endereço): o funcionário completa pela aba Locais.
const defaultVenues = [
  { id: 1, name: 'Centro de Treinamento Pelé', address: '', district: '', city: 'São Paulo', state: 'SP', zip: '', reference: '', active: true },
  { id: 2, name: 'Arena Oeste', address: '', district: '', city: 'Osasco', state: 'SP', zip: '', reference: '', active: true },
  { id: 3, name: 'CT Litoral', address: '', district: '', city: 'Santos', state: 'SP', zip: '', reference: '', active: true },
  { id: 4, name: 'Centro de Treinamento Oeste', address: '', district: '', city: 'Barueri', state: 'SP', zip: '', reference: '', active: true },
]
const UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO']

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
  venues: readStorage('ap_venues', defaultVenues),
  invites: readStorage('ap_invites', []),
  contacts: readStorage('ap_contacts', []),
  guardians: {},
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
    createdBy:tryout.createdBy || DEMO_TRYOUT_OWNER[tryout.id],
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
    localStorage.setItem('ap_venues', JSON.stringify(state.venues))
    localStorage.setItem('ap_invites', JSON.stringify(state.invites))
    localStorage.setItem('ap_contacts', JSON.stringify(state.contacts))
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
  return ts > 1e12 ? fmtListTime(ts) : t(n.time || '')
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
        profile: { name: demo.name, email: demo.email, phone: demo.phone, position: demo.position, city: 'São Paulo', state: 'SP', demo: true, ...demo.pro },
      })
    }
    const account = state.accounts.find((entry) => entry.email === demo.email)
    if (account?.profile) account.profile.demo = true // contas salvas antes desta versão
    if (account?.profile && account.profile.org === undefined) Object.assign(account.profile, demo.pro)
    if (account && account.admin === undefined) account.admin = !!demo.admin
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
        subtitle: t(a.pos) + ' • ' + a.city,
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
    subtitle: proHeadline(a.profile || {}) || t('Profissional'),
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
      '<small class="conv-preview truncate text-ink-soft">' + (last ? (last.senderRole === role ? '<span>' + t('Você:') + ' </span>' : '') + '<span translate="no">' + escapeHtml(last.text) + '</span>' : '<span>' + escapeHtml(c.subtitle) + '</span>') + '</small></span>' +
      '<span class="conv-meta">' + (last ? '<time class="conv-time">' + escapeHtml(fmtListTime(messageTs(last))) + '</time>' : '') + (unread ? '<b class="conv-unread">' + unread + '</b>' : '') + '</span></button>'
  }).join('') + '<p id="conversation-empty" class="p-4 text-center text-xs text-ink-soft" hidden>' + t('Nenhum resultado encontrado.') + '</p>'
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
    admin: !!row.is_admin,
    active: row.active !== false,
    profile: { ...(row.data || {}), name: row.name, email: row.email, demo: DEMO_STAFF.some((demo) => demo.email === row.email) },
  }
}

async function hydrateRemote(uid) {
  const own = await fetchOwnProfile(uid)
  if (!own.profile) throw new Error('perfil não encontrado')
  if (own.profile.active === false) throw new Error('account_disabled')
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
  await refreshRemoteGuardians()
  if (own.profile.role === 'staff') await refreshRemoteContacts()
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
    venueId: row.venue_id == null ? null : Number(row.venue_id), address: row.address || '', district: row.district || '', reference: row.reference || '', description: row.description || '', checkins: row.checkins || {},
    enrolled: emails.concat(Array(Math.max(0, (row.taken || 0) - emails.length)).fill('')),
  }
}

async function refreshRemoteTryouts() {
  if (!remote.enabled || !state.user?.uid) return
  try {
    state.tryouts = (await fetchTryouts()).map(mapRemoteTryout)
    state.tryoutsStatus = 'ready'
    if (state.user.role === 'staff') {
      try { state.venues = (await fetchVenues()).map(mapRemoteVenue) } catch (error) {
        console.warn('[Supabase] não foi possível carregar locais:', error)
        state.venues = []
      }
    }
  } catch (error) {
    console.warn('[Supabase] não foi possível carregar peneiras:', error)
    state.tryoutsStatus = 'error'
    state.tryoutsError = describeError(error)
  }
}

function mapRemoteVenue(row) {
  const editor = row.updated_by === state.user?.uid ? state.user?.name : state.accounts.find((account) => account.uid === row.updated_by)?.profile?.name
  return {
    id: Number(row.id), name: row.name, address: row.address, district: row.district, city: row.city, state: row.state,
    zip: row.zip, reference: row.reference, active: row.active, updatedBy: editor || '', updatedAt: row.updated_at,
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
    await refreshRemoteGuardians()
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
  return tag(foot === 'Destro' ? t('Perna direita') : foot === 'Canhoto' ? t('Perna esquerda') : t('Ambidestro'), true)
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
    'trend-up': '<path d="m4 16 6-6 4 4 6-6"/><path d="M15 8h5v5"/>',
    'trend-down': '<path d="m4 8 6 6 4-4 6 6"/><path d="M15 16h5v-5"/>',
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
    users: '<path d="M16 21a6 6 0 0 0-12 0"/><circle cx="10" cy="8" r="4"/><path d="M22 21a5 5 0 0 0-4-4.9M16 3.1a4 4 0 0 1 0 7.8"/>',
    copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    shield: '<path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
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
  message = t(message)
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
    siteFooter() +
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
  const consent = isMinorBirth(profile.birth) ? [[guardianConsented(myGuardian()), t('Registre a autorização do responsável'), t('Sem ela você não consegue se inscrever em peneiras.'), 'profile']] : []
  return consent.concat([
    [!!profile.photo, t('Adicione uma foto de perfil'), t('Ajuda os olheiros a lembrarem de você.'), 'profile'],
    [!!profile.secondary && profile.secondary !== '—', t('Defina uma posição secundária'), t('Abre mais peneiras compatíveis.'), 'profile'],
    [state.tryouts.some(isEnrolledIn), t('Inscreva-se numa peneira'), t('É assim que você entra no radar da Academia.'), 'tryouts:for-you'],
    [myMessages, t('Mande uma mensagem a um treinador'), t('Apresente-se e tire dúvidas.'), 'messages'],
  ])
}

// Frase do painel sobre a próxima peneira do atleta.
function nextTryoutLine(tryout) {
  const phase = tryoutPhase(tryout)
  const at = validTime(tryout.time) ? ' ' + t('às') + ' ' + tryout.time : ''
  if (phase === 'live') return t('Sua peneira está em andamento. Bom jogo!')
  if (phase === 'tbd') return t('Sua próxima peneira ainda está com a data a confirmar.')
  if (phase === 'today') return t('Sua próxima peneira é hoje') + at + '.'
  const days = daysUntil(tryout.date)
  return t('Sua próxima peneira é') + ' ' + (days === 1 ? t('amanhã') + at : t('em') + ' ' + days + ' ' + t('dias')) + '.'
}

function playerDashboard() {
  const profile = state.profile || defaultProfile
  const firstName = escapeHtml((state.user?.name || profile.name || 'Atleta').split(' ')[0])
  const category = getCategoryFromAge(getAgeFromProfile(profile.birth))
  const upcoming = state.tryouts.filter((tryout) => !isPastTryout(tryout) && tryout.status !== 'cancelled').sort(byStart)
  const mine = upcoming.filter(isEnrolledIn)
  const forYou = upcoming.filter((tryout) => tryoutFit(tryout).ok && !isEnrolledIn(tryout))
  const next = mine[0] || forYou[0] || null
  const unread = unreadSummary().total
  const avg = averagePlayerRating(profile)
  const status = mine.length
    ? t('Você tem') + ' ' + plural(mine.length, 'inscrição', 'inscrições') + '. ' + nextTryoutLine(mine[0])
    : forYou.length
      ? t('Há') + ' ' + plural(forYou.length, 'peneira aberta', 'peneiras abertas') + ' ' + t('para') + ' ' + escapeHtml(t(profile.pos).toLowerCase()) + ' ' + t('na') + ' ' + escapeHtml(category) + '.'
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
      ? '<div class="alert alert-success mt-5">' + icon('check', 'size-5 shrink-0') + '<span><strong>' + t('Perfil completo.') + '</strong></span></div>'
      : '<ul class="checklist mt-4">' + checklist.map(([ok, title, hint, target]) => {
        const attrs = target.startsWith('tryouts:') ? 'data-tryout-filter="' + target.split(':')[1] + '"' : 'data-route="' + target + '"'
        return '<li class="' + (ok ? 'is-done' : '') + '"><span class="check-mark" aria-hidden="true">' + (ok ? icon('check', 'size-3.5') : '') + '</span><span class="min-w-0 flex-1"><strong>' + title + '</strong><small>' + hint + '</small></span>' +
          (ok ? '<span class="sr-only">' + t('concluído') + '</span>' : '<button type="button" class="btn-ghost text-sm" ' + attrs + '>' + t('Fazer') + '</button>') + '</li>'
      }).join('') + '</ul>') + '</div>'

  const nextCard = next
    ? '<aside class="next-tryout reveal surface rounded-card p-6"><div class="flex items-center justify-between gap-3"><p class="text-sm text-ink-soft">' + (isEnrolledIn(next) ? t('Sua próxima peneira') : t('Próxima peneira para você')) + '</p>' +
      '<span class="tag ' + (isEnrolledIn(next) ? 'green' : '') + '">' + (isEnrolledIn(next) ? t('Inscrito') : t('Aberta')) + '</span></div>' +
      bigCountdownTag(next) +
      '<h2 class="mt-4 text-xl font-semibold leading-tight">' + escapeHtml(next.title) + '</h2>' +
      '<div class="mt-3 flex items-center gap-3">' + scoreboard(next.date, next.time) + '<p class="text-sm text-ink-soft">' + escapeHtml(next.location) + '<br/>' + escapeHtml(next.city) + '/' + escapeHtml(next.state) + '</p></div>' +
      '<button type="button" class="btn-secondary mt-6 w-full" data-tryout-filter="' + (isEnrolledIn(next) ? 'mine' : 'for-you') + '">' + (isEnrolledIn(next) ? t('Ver detalhes') : t('Inscrever-me')) + ' ' + icon('arrow', 'size-4') + '</button></aside>'
    : '<aside class="next-tryout reveal surface rounded-card p-6"><div class="empty-state"><strong>' + t('Nenhuma peneira aberta para você') + '</strong><span class="text-sm">' + t('Assim que abrir uma peneira compatível, ela aparece aqui.') + '</span><button type="button" class="btn-secondary mt-2" data-tryout-filter="all">' + t('Ver todas') + '</button></div></aside>'

  return shell(
    '<section class="grid gap-5 xl:grid-cols-[1.5fr_.9fr]">' +
    '<div class="hero hero-with-card rounded-card surface p-6 sm:p-8">' + (getCurrentAthlete() ? playerCard(getCurrentAthlete(), { size: 'compact' }) : '') +
    '<h1 class="page-title max-w-2xl">' + t('Olá,') + ' ' + firstName + '.</h1><p class="mt-3 max-w-xl text-lg leading-7">' + escapeHtml(t(profile.pos)) + ', ' + escapeHtml(category) + (profile.city ? ', ' + escapeHtml(profile.city) : '') + '. ' + status + '</p>' +
    '<div class="mt-6 flex flex-wrap gap-2">' + cta + '<button type="button" class="btn-secondary" data-route="profile">' + icon('user', 'size-4') + ' ' + t('Meu perfil') + '</button></div>' +
    '<dl class="profile-stats mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">' +
    '<div><dt>' + avgLabel() + '</dt><dd class="num ' + rateClass(avg) + '">' + escapeHtml(String(avg)) + '</dd></div>' +
    '<div><dt>' + t('Inscrições') + '</dt><dd class="num">' + mine.length + '</dd></div>' +
    '<div><dt>' + t('Avaliações') + '</dt><dd class="num">' + getPlayerReviewCount() + '</dd></div>' +
    '<div><dt>' + t('Mensagens novas') + '</dt><dd class="num">' + unread + '</dd></div></dl></div>' +
    nextCard + '</section>' +
    '<section class="mt-6 grid gap-5 ' + (checklistPanel ? 'lg:grid-cols-2' : '') + '">' + checklistPanel +
    '<div class="reveal panel"><h2 class="section-title !mt-0">' + t('Minha atividade') + '</h2><div class="mt-5 space-y-4">' +
    (myNotifications().length
      ? myNotifications().slice(0, 4).map((n) => activity(escapeHtml(t(n.title)), escapeHtml(t(n.text)), notificationTime(n))).join('')
      : '<div class="empty-state"><strong>' + t('Nada por aqui ainda') + '</strong><span class="text-sm">' + t('Inscrições, avaliações e mensagens de treinadores aparecem aqui.') + '</span></div>') +
    '</div></div></section>',
    { active: 'dashboard', role: 'player' },
  )
}


// Painel da equipe: o que vem pela frente e o que está pendente, com números reais (sem "06", "00").
function staffDashboard() {
  const firstName = escapeHtml((state.user?.name || '').split(' ')[0])
  const upcoming = state.tryouts.filter((tryout) => !isPastTryout(tryout) && tryout.status !== 'cancelled').sort(byStart)
  const next = upcoming[0]
  const week = upcoming.filter((tryout) => (daysUntil(tryout.date) ?? 99) <= 7).length
  const unreviewed = state.athletes.filter((a) => !(state.reviews[a.id] || []).length).length
  const watching = state.favorites.filter((id) => state.athletes.some((a) => a.id === id)).length
  const status = next
    ? t('Próxima peneira:') + ' <strong>' + escapeHtml(next.title) + '</strong>, ' + formatDate(next.date) + (validTime(next.time) ? ' ' + t('às') + ' ' + escapeHtml(next.time) : '') + ', ' + (next.enrolled || []).length + ' ' + t('de') + ' ' + escapeHtml(next.seats) + ' ' + t('vagas preenchidas') + '.'
    : t('Nenhuma peneira marcada. Crie uma para os atletas compatíveis se inscreverem.')
  return shell(
    '<section class="hero rounded-card surface p-6 sm:p-8"><h1 class="page-title">' + t('Olá,') + ' ' + firstName + '.</h1><p class="mt-3 max-w-3xl text-lg leading-7">' + status + '</p>' +
    '<div class="mt-6 flex flex-wrap gap-2">' + (next
      ? '<button type="button" class="btn-primary" data-route="tryouts">' + icon('calendar', 'size-4') + ' ' + t('Ver peneiras') + '</button>'
      : '<button type="button" class="btn-primary" data-action="openTryout">' + icon('plus', 'size-4') + ' ' + t('Criar peneira') + '</button>') +
    '<button type="button" class="btn-secondary" data-route="athletes">' + icon('search', 'size-4') + ' ' + t('Pesquisar atletas') + '</button></div>' +
    '<dl class="profile-stats mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">' +
    '<div><dt>' + t('Peneiras nos próximos 7 dias') + '</dt><dd class="num">' + week + '</dd></div>' +
    '<div><dt>' + t('Atletas sem avaliação') + '</dt><dd class="num">' + unreviewed + '</dd></div>' +
    '<div><dt>' + t('Na sua lista de observação') + '</dt><dd class="num">' + watching + '</dd></div>' +
    '<div><dt>' + t('Mensagens não lidas') + '</dt><dd class="num">' + unreadSummary().total + '</dd></div></dl></section>' +
    contactInbox() +
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
  return '<span class="tag pos-tag pos-' + positionGroup(pos) + '">' + escapeHtml(t(pos)) + '</span>'
}

const plural = (n, one, many) => n + ' ' + t(n === 1 ? one : many)

// ---------- Loader de futebol: bola quicando sobre a linha do campo ----------
const BALL_SVG = '<svg viewBox="0 0 24 24" class="ball" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#F1F3F8"/><path d="M12 7.2l4.1 3-1.6 4.8h-5l-1.6-4.8z" fill="#0B0F1C"/><path d="M12 7.2V2.5M16.1 10.2l4.4-1.6M14.5 15l2.8 3.9M9.5 15l-2.8 3.9M7.9 10.2 3.5 8.6" stroke="#0B0F1C" stroke-width="1.3" fill="none"/></svg>'
function ballLoader(label = t('Carregando…')) {
  return '<div class="ball-loader" role="status"><div class="ball-stage" aria-hidden="true"><span class="ball-wrap">' + BALL_SVG + '</span><span class="ball-shadow"></span><span class="pitch-dash"></span></div><span class="text-sm text-ink-soft">' + escapeHtml(label) + '</span></div>'
}

// ---------- Placar: data da peneira ----------
const MONTHS = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'] // traduzidos por t() ao mostrar
function scoreboard(date, time) {
  const [year, month, day] = String(date || '').split('-')
  if (!day) return ''
  return '<div class="scoreboard" aria-label="' + formatDate(date) + (time ? ' ' + t('às') + ' ' + escapeHtml(time) : '') + '"><span class="sb-day num">' + day + '</span><span class="sb-month">' + t(MONTHS[Number(month) - 1] || '') + '</span>' + (time ? '<span class="sb-time tabular">' + escapeHtml(time) + '</span>' : '') + '</div>'
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
    const label = escapeHtml(a.name) + ', ' + escapeHtml(t(a.pos)) + (a.rating ? ', ' + t('nota') + ' ' + formatRating(ratingOf(a)) : '')
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
  const next = currentTheme() === 'light' ? t('Ativar tema escuro') : t('Ativar tema claro')
  return '<button type="button" class="icon-button theme-toggle ' + extra + '" data-action="toggle-theme" aria-label="' + next + '" title="' + t('Alternar tema claro/escuro') + '" aria-live="polite">' + icon('sun', 'size-4 theme-sun') + icon('moon', 'size-4 theme-moon') + '</button>'
}
function applyTheme(theme, persistChoice = true) {
  const swap = () => {
    document.documentElement.dataset.theme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? '#EEF0F5' : '#0B0F1C')
    document.querySelectorAll('[data-action="toggle-theme"]').forEach((button) => button.setAttribute('aria-label', theme === 'light' ? t('Ativar tema escuro') : t('Ativar tema claro')))
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
const joinPt = (items) => items.length <= 1 ? (items[0] || '') : items.slice(0, -1).join(', ') + ' ' + t('e') + ' ' + items[items.length - 1]
function footPhrase(foot) {
  return t(foot === 'Canhoto' ? 'chuta de canhota' : foot === 'Destro' ? 'chuta de direita' : foot === 'Ambidestro' ? 'usa bem as duas pernas' : '')
}
// Destaques: os mais citados pelos olheiros; sem avaliação, as características do cadastro.
function strengthsOf(a) {
  const counts = {}
  ;(state.reviews[a.id] || []).forEach((review) => (review.strengths || []).forEach((item) => { counts[item] = (counts[item] || 0) + 1 }))
  const fromReviews = Object.keys(counts).sort((x, y) => counts[y] - counts[x])
  const list = fromReviews.length ? fromReviews : (a.tags || []).filter((item) => item && item !== a.pos && item !== a.secondary)
  return list.slice(0, 3).map((item) => t(item).toLowerCase())
}
function describeAthlete(a) {
  const role = a.secondary && a.secondary !== '—' && a.secondary !== a.pos ? t(a.pos) + ' ' + t('que também joga de') + ' ' + t(a.secondary).toLowerCase() : t(a.pos)
  const foot = footPhrase(a.foot)
  return role + (foot ? ' ' + t('e') + ' ' + foot : '') + '.'
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
    return '<text x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" text-anchor="' + anchor + '" class="radar-label">' + escapeHtml(t(c.label).split(/ [ey] /)[0]) + '<tspan class="radar-value" dx="5">' + (value ? formatRating(value) : '—') + '</tspan></text>'
  }).join('')
  const summary = criteria.map((c) => t(c.label) + ' ' + (values[c.key] ? formatRating(values[c.key]) : t('sem nota'))).join('; ')
  return '<svg class="radar" viewBox="0 0 320 260" role="img" aria-label="' + t('Atributos') + ': ' + escapeHtml(summary) + '">' +
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

// ---------- Carta do atleta (inspirada nas cartas do EA FC) ----------
// Faixas do EA (OVR): Bronze até 64, Prata de 65 a 74, Ouro a partir de 75. Aqui a nota vai de 0 a 10, então ×10.
// Nada inventado: OVR = média das avaliações (ou a nota de exemplo dos perfis de exemplo); atributos = média por característica.
// Sem ranking: a carta aparece só para o próprio atleta e para a equipe.
const CARD_ABBR = { finalizacao: 'FIN', passe: 'PAS', tecnica: 'TÉC', visao: 'VIS', marcacao: 'MAR', posicionamento: 'POS', fisico: 'FÍS', defesas: 'DEF', saidas: 'SAÍ' }
const TIER_LABEL = { gold: 'Ouro', silver: 'Prata', bronze: 'Bronze', base: 'Carta base' }
const cardTier = (ovr) => !ovr ? 'base' : ovr >= 75 ? 'gold' : ovr >= 65 ? 'silver' : 'bronze'
// Quanto a última avaliação mexeu na nota (avaliações da mais nova para a mais antiga).
function cardDelta(reviews) {
  const scores = reviews.map((review) => Number(review.rating)).filter(Number.isFinite)
  if (scores.length < 2) return 0
  const avg = (list) => list.reduce((sum, value) => sum + value, 0) / list.length
  return Math.round(avg(scores) * 10) - Math.round(avg(scores.slice(1)) * 10)
}
// De onde vêm os números: cada atributo é a média das notas (0 a 10) que a equipe deu para aquela característica, ×10;
// a nota geral é a média das notas finais (ponderadas pela posição, com o ajuste pelas estatísticas do jogo), ×10.
function cardBasis(a) {
  const reviews = state.reviews[a.id] || []
  const { criteria, values } = attributeAverages(a.id, a.pos)
  const authors = [...new Set(reviews.map((review) => review.author).filter(Boolean))]
  const lead = reviews.length
    ? t('A nota geral é a média das notas finais de') + ' ' + plural(reviews.length, 'avaliação', 'avaliações') + (authors.length ? ' (' + escapeHtml(joinPt(authors)) + ')' : '') + ', ' + t('multiplicada por 10. A nota final de cada avaliação pondera as características da posição e soma um ajuste pelas estatísticas do jogo.')
    : a.demo ? t('Perfil de exemplo: a nota geral é de demonstração. Os atributos só aparecem com avaliações reais da equipe.') : t('Ainda não há avaliações. A carta ganha nota e atributos na primeira avaliação da equipe.')
  return '<details class="card-basis"><summary>' + icon('info', 'size-4') + t('De onde vêm os números da carta?') + '</summary><div class="card-basis-body"><p>' + lead + '</p>' +
    '<dl class="basis-list">' + criteria.map((c) => '<div><dt><abbr title="' + escapeHtml(t(c.label)) + '">' + t(CARD_ABBR[c.key]) + '</abbr> ' + escapeHtml(t(c.label)) + '</dt><dd class="tabular">' + (values[c.key] ? t('média') + ' ' + formatRating(values[c.key]) + ' → ' + Math.round(values[c.key] * 10) : t('sem nota')) + '</dd></div>').join('') + '</dl>' +
    '<p class="basis-scale">' + t('Cada olheiro dá de 0 a 10 para cada característica da posição; a carta mostra a média multiplicada por 10. Faixas: Bronze até 64, Prata de 65 a 74, Ouro a partir de 75.') + '</p></div></details>'
}
function playerCard(a, { reveal = false, size = '', flip = false } = {}) {
  const reviews = state.reviews[a.id] || []
  const ovr = Math.round(ratingOf(a) * 10) || 0
  const tier = cardTier(ovr)
  const { criteria, values } = attributeAverages(a.id, a.pos)
  const value = (c) => values[c.key] ? Math.round(values[c.key] * 10) : null
  const delta = cardDelta(reviews)
  const age = a.age ?? getAgeFromProfile(a.birth)
  const category = getCategoryFromAge(age)
  const place = [a.city, a.state].filter(Boolean).join('/')
  const label = t('Carta de') + ' ' + a.name + ': ' + (ovr ? t('nota') + ' ' + ovr + ', ' + t(TIER_LABEL[tier]) : t('sem nota')) + ', ' + t(a.pos) + '. ' +
    criteria.map((c) => t(c.label) + ' ' + (value(c) ?? t('sem nota'))).join(', ') + '.'
  const foot = reviews.length
    ? plural(reviews.length, 'avaliação', 'avaliações') + (delta ? ' · <span class="' + (delta > 0 ? 'fc-up' : 'fc-down') + '">' + icon(delta > 0 ? 'trend-up' : 'trend-down', 'size-3.5 inline') + (delta > 0 ? '+' + delta : delta) + '</span> ' + t('desde a última') : '')
    : a.demo ? t('Nota de exemplo') : t('Sem avaliação ainda')
  const front = '<div class="fc-face fc-front"><div class="fc-inner">' +
    '<div class="fc-top"><div class="fc-head"><span class="fc-ovr num">' + (ovr || '—') + '</span><span class="fc-pos">' + t(POSITION_ABBR[a.pos] || '—') + '</span><span class="fc-cat">' + escapeHtml(age ? category : '—') + '</span></div>' +
    personAvatar(a, 'fc-photo') + '</div>' +
    '<p class="fc-name">' + escapeHtml(size === 'compact' ? String(a.name).split(' ')[0] : a.name) + '</p>' +
    (size === 'compact' ? '' :
      (a.foot || place ? '<p class="fc-meta">' + (a.foot ? '<span>' + escapeHtml(t(a.foot)) + '</span>' : '') + (place ? '<span>' + escapeHtml(place) + '</span>' : '') + '</p>' : '') +
      '<dl class="fc-stats">' + criteria.map((c) => '<div><dt>' + t(CARD_ABBR[c.key]) + '</dt><dd class="num">' + (value(c) ?? '—') + '</dd></div>').join('') + '</dl>' +
      '<p class="fc-foot"><span class="fc-tier">' + t(TIER_LABEL[tier]) + '</span> · ' + foot + '</p>') +
    '</div></div>'
  const cls = 'fc-card tier-' + tier + (size ? ' is-' + size : '')
  // A figurinha do visitante é um espaço para colar: ainda não existe nota nem foto.
  if (a.slot) return '<figure class="' + cls + ' is-slot" role="img" aria-label="' + escapeHtml(t('Espaço da sua figurinha: ela nasce no cadastro.')) + '"><div class="fc-tilt" aria-hidden="true"><div class="fc-faces"><div class="fc-face fc-front"><div class="fc-inner fc-slot">' +
    '<span class="fc-slot-plus">' + icon('plus', 'size-6') + '</span><p class="fc-slot-title">' + t('Sua figurinha') + '</p><p class="fc-slot-hint">' + t('Cole aqui no cadastro') + '</p></div></div></div></div></figure>'
  if (!flip) return '<figure class="' + cls + '"' + (reveal ? ' data-card-reveal' : '') + ' role="img" aria-label="' + escapeHtml(label) + '"><div class="fc-tilt" aria-hidden="true"><div class="fc-faces">' + front + '</div></div></figure>'
  // Verso: a ficha do atleta, só com dados que existem.
  const presences = a.email ? state.tryouts.filter((tryout) => checkinsOf(tryout)[a.email]).length : 0
  const sheet = [
    [t('Posição'), t(a.pos || '—')],
    [t('Secundária'), a.secondary && a.secondary !== '—' ? t(a.secondary) : t('nenhuma')],
    [t('Perna'), a.foot ? t(a.foot) : '—'],
    [t('Idade'), age ? age + ' ' + t('anos') + ' · ' + category : '—'],
    [t('Cidade'), place || '—'],
    [t('Presenças em peneiras'), String(presences)],
    [t('Última avaliação'), reviews[0]?.date || '—'],
    [t('Base das notas'), reviews.length ? plural(reviews.length, 'avaliação', 'avaliações') + ' ' + t('da equipe') : a.demo ? t('nota de exemplo') : t('sem avaliação')],
  ]
  const strengths = strengthsOf(a)
  const back = '<div class="fc-face fc-back"><div class="fc-inner"><p class="fc-back-title">' + t('Ficha') + '</p>' +
    '<dl class="fc-sheet">' + sheet.map(([k, v]) => '<div><dt>' + k + '</dt><dd>' + escapeHtml(v) + '</dd></div>').join('') + '</dl>' +
    (strengths.length ? '<div class="fc-tags">' + strengths.map((item) => '<span>' + escapeHtml(item) + '</span>').join('') + '</div>' : '') + '</div></div>'
  const sheetText = sheet.map(([k, v]) => k + ': ' + v).join('; ') + (strengths.length ? '; ' + t('Destaques:') + ' ' + strengths.join(', ') : '')
  return '<figure class="' + cls + '"' + (reveal ? ' data-card-reveal' : '') + '>' +
    '<div class="fc-flip" role="button" tabindex="0" aria-pressed="false" aria-label="' + escapeHtml(label + ' ' + t('Virar a carta para ver a ficha.')) + '"><div class="fc-tilt" aria-hidden="true"><div class="fc-faces">' + front + back + '</div></div></div>' +
    '<figcaption class="fc-hint">' + t('Toque na carta para ver a ficha') + '<span class="sr-only">. ' + escapeHtml(t('Ficha') + ': ' + sheetText) + '</span></figcaption></figure>'
}
document.addEventListener('pointermove', (event) => {
  if (!finePointer.matches || calmMotion.matches) return
  const cover = event.target.closest?.('.album-cover')
  if (!cover) return
  cover.style.setProperty('--px', ((event.clientX / innerWidth) - 0.5).toFixed(3))
  cover.style.setProperty('--py', ((event.clientY / innerHeight) - 0.5).toFixed(3))
}, { passive: true })
// Toque (ou Enter/Espaço) vira a figurinha; com mouse, ela inclina e o brilho acompanha o ponteiro.
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)')
const calmMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
document.addEventListener('click', (event) => {
  const flip = event.target.closest?.('.fc-flip')
  if (!flip) return
  flip.setAttribute('aria-pressed', String(flip.closest('.fc-card').classList.toggle('is-flipped')))
})
document.addEventListener('keydown', (event) => {
  if ((event.key === 'Enter' || event.key === ' ') && event.target.matches?.('.fc-flip')) { event.preventDefault(); event.target.click() }
})
document.addEventListener('pointermove', (event) => {
  if (!finePointer.matches || calmMotion.matches) return
  const card = event.target.closest?.('.fc-card')
  if (!card) return
  const box = card.getBoundingClientRect()
  const x = (event.clientX - box.left) / box.width, y = (event.clientY - box.top) / box.height
  card.style.setProperty('--ry', ((x - 0.5) * 14).toFixed(1) + 'deg')
  card.style.setProperty('--rx', ((0.5 - y) * 12).toFixed(1) + 'deg')
  card.style.setProperty('--mx', Math.round(x * 100) + '%')
  card.style.setProperty('--foil', '1')
}, { passive: true })
document.addEventListener('pointerout', (event) => {
  const card = event.target.closest?.('.fc-card')
  if (card && !card.contains(event.relatedTarget)) ['--rx', '--ry', '--foil'].forEach((key) => card.style.removeProperty(key))
})

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

// Item do banco de atletas: a carta (nota, posição, categoria e atributos) é o destaque; embaixo, só o que a carta não diz.
function athleteCard(a, staff = false) {
  const reviewCount = (state.reviews[a.id] || []).length
  const strengths = strengthsOf(a)
  return '<article class="reveal athlete-tile pos-' + positionGroup(a.pos) + ' rounded-card surface">' +
    '<div class="athlete-tile-save">' + saveToggle(a) + '</div>' +
    '<div class="athlete-tile-card" data-open-athlete="' + a.id + '">' + playerCard(a) + '</div>' +
    '<p class="athlete-tile-meta">' + a.age + ' ' + t('anos') + ' · ' + escapeHtml(a.city) + '/' + escapeHtml(a.state) + (a.secondary && a.secondary !== '—' ? ' · ' + t('também') + ' ' + escapeHtml(t(a.secondary)) : '') + '</p>' +
    (strengths.length ? '<p class="scout-strengths athlete-tile-tags">' + strengths.map((item) => '<span>' + escapeHtml(item) + '</span>').join('') + '</p>' : '') +
    '<p class="athlete-tile-count">' + (reviewCount ? '<span class="tabular">' + plural(reviewCount, 'avaliação', 'avaliações') + '</span>' : t('ainda sem avaliação')) + (a.demo ? ' · ' + t('perfil de exemplo') : '') + '</p>' +
    '<div class="athlete-tile-actions">' +
    (staff ? '<button type="button" class="btn-secondary" data-message-athlete="' + a.id + '">' + icon('message', 'size-4') + ' ' + t('Mensagem') + '</button>' : '') +
    '<button type="button" class="btn-primary" data-open-athlete="' + a.id + '" aria-label="' + t('Abrir perfil de') + ' ' + escapeHtml(a.name) + '">' + t('Ver perfil') + '</button></div></article>'
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
  const safe = escapeHtml(t(text))
  return '<span class="tag ' + (ghost ? 'ghost' : '') + '">' + safe + '</span>'
}

function athletesPage() {
  watchOnly = false // como os outros filtros, volta a "todos" ao abrir a página
  const filters = '<div class="filters-scrim" data-filters-close></div><aside id="filters-panel" class="filters-panel panel h-max" aria-label="' + t('Filtros de atletas') + '" data-lenis-prevent><div class="flex items-center justify-between gap-2"><h2 class="font-bold">' + t('Filtros') + '</h2><div class="flex items-center gap-1"><button type="button" class="btn-ghost text-xs text-brand" data-action="clearFilters">' + t('Limpar') + '</button><button type="button" class="filters-toggle icon-button sm" aria-label="' + t('Fechar filtros') + '" data-filters-close>' + icon('close', 'size-4') + '</button></div></div>' +
    '<div class="mt-4 space-y-4"><label class="field-label">' + t('Buscar por nome') + '<input id="filter-name" class="field" placeholder="' + t('Ex.: Gabriel') + '" /></label>' +
    '<label class="field-label">' + t('Posição principal ou secundária') + '<select id="filter-pos" class="field"><option value="">' + t('Todas') + '</option>' + POSITIONS.map((p) => '<option value="' + p + '">' + t(p) + '</option>').join('') + '</select></label>' +
    '<label class="field-label">' + t('Perna dominante') + '<select id="filter-foot" class="field"><option value="">' + t('Todas') + '</option>' + FEET.map((f) => '<option value="' + f + '">' + t(f) + '</option>').join('') + '</select></label>' +
    '<label class="field-label">' + t('Cidade/região') + '<select id="filter-city" class="field"><option value="">' + t('Todas') + '</option>' + [...new Set(state.athletes.map((a) => a.city))].sort().map((c) => '<option>' + escapeHtml(c) + '</option>').join('') + '</select></label>' +
    '<label class="field-label">' + t('Idade') + '<select id="filter-age" class="field"><option value="">' + t('Todas') + '</option>' + [...new Set(state.athletes.map((a) => a.age))].sort((a,b)=>a-b).map((age) => '<option value="' + age + '">' + age + '</option>').join('') + '</select></label>' +
    '<label class="field-label">' + t('Categoria') + '<select id="filter-category" class="field"><option value="">' + t('Todas') + '</option><option>Sub-7</option><option>Sub-9</option><option>Sub-11</option><option>Sub-13</option><option>Sub-15</option><option>Sub-17</option><option>Sub-20</option></select></label>' +
    '</div><div class="mt-6 rounded-2xl border border-brand/15 bg-brand/7 p-4 text-xs leading-5 text-ink-soft"><strong class="text-brand">' + t('Filtro em tempo real') + '</strong><br/>' + t('Nome, posição, perna dominante, cidade, idade e categoria alteram a lista sem recarregar.') + '</div></aside>'

  return shell(
    '<div class="page-head"><div><h1 class="page-title">' + t('Pesquisar atletas') + '</h1><p class="page-subtitle">' + t('Abra o perfil completo, mande uma mensagem, registre uma avaliação e salve quem você quer acompanhar.') + '</p></div><button type="button" class="btn-primary lg:hidden" data-action="openTryout">' + icon('plus', 'size-4') + ' ' + t('Nova peneira') + '</button></div>' +
    '<section class="mt-6 grid gap-5 lg:grid-cols-[280px_1fr]">' +
    filters +
    '<div><div class="mb-4 flex flex-wrap items-center justify-between gap-2"><button type="button" class="filters-toggle btn-secondary" aria-controls="filters-panel" aria-expanded="false" data-filters-open>' + icon('filter', 'size-4') + ' ' + t('Filtros') + '</button><div class="flex flex-wrap items-center gap-3"><button type="button" class="tab-chip" data-action="toggle-watchlist" aria-pressed="' + watchOnly + '">' + icon('bookmark', 'size-4') + t('Lista de observação') + '<span class="tab-count" id="watch-count">' + state.favorites.filter((id) => state.athletes.some((a) => a.id === id)).length + '</span></button><p id="athlete-count" class="text-sm text-ink-soft" aria-live="polite">' + plural(state.athletes.length, 'atleta encontrado', 'atletas encontrados') + '</p></div><button type="button" class="btn-secondary" data-action="export">' + icon('arrow', 'size-4') + ' ' + t('Exportar seleção') + '</button></div><div id="athlete-grid" class="athlete-grid">' + state.athletes.map((a) => athleteCard(a, true)).join('') + '</div></div></section>',
    { active: 'athletes', role: 'staff' },
  )
}

function profilePage() {
  const role = state.user?.role || 'player'
  if (role === 'staff') {
    const account = state.accounts.find((a) => a.email === state.user.email)
    const profile = account?.profile || { name: state.user.name, email: state.user.email, phone: '', position: t('Funcionário'), city: 'São Paulo', state: 'SP' }
    return shell(
      '<div class="page-head"><div><h1 class="page-title">' + t('Meu perfil') + '</h1><p class="page-subtitle">' + t('Seu perfil profissional: é o que atletas e famílias veem quando você organiza uma peneira ou avalia alguém.') + '</p></div><button type="button" class="btn-secondary" data-action="logout">' + icon('logout', 'size-4') + ' ' + t('Sair') + '</button></div>' +
      '<section class="mt-6 grid gap-5">' + staffProCard({ ...profile, email: state.user.email }, { own: true, admin: isAdmin() }) + teamProfilePanel() + '</section>',
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
  let seen = 0
  try { seen = Number(localStorage.getItem('ap_card_seen:' + state.user.email)) || 0 } catch {}
  const cardOwner = me || { ...p, id: 'me' }
  const reveal = (state.reviews[cardOwner.id] || []).length > seen
  return shell(
    '<section class="hero surface rounded-card p-6 sm:p-8 pos-' + positionGroup(p.pos) + '"><div class="profile-hero-grid"><div class="profile-hero-info">' +
    photoUploader({ name: p.name, photo: p.photo }) + '<h1 class="page-title">' + escapeHtml(p.name) + '</h1>' +
    '<p class="text-ink-soft">' + escapeHtml(describeAthlete(p)) + ' ' + age + ' ' + t('anos') + ', ' + escapeHtml(category) + ', ' + escapeHtml(p.city || '') + '.</p>' +
    '<div class="flex flex-wrap justify-center gap-1.5 lg:justify-start">' + posTag(p.pos) + posTag(p.secondary) + tag(category, true) + '</div>' +
    '<button type="button" class="btn-secondary" data-action="logout">' + icon('logout', 'size-4') + ' ' + t('Sair') + '</button></div>' +
    '<div class="profile-hero-card">' + playerCard(cardOwner, { reveal, size: 'large', flip: true }) + cardBasis(cardOwner) + '</div>' +
    '<dl class="profile-stats profile-hero-stats grid grid-cols-2 gap-3">' +
    '<div><dt>' + avgLabel() + '</dt><dd class="num ' + rateClass(avg) + '">' + escapeHtml(String(avg)) + '</dd></div>' +
    '<div><dt>' + t('Peneiras inscritas') + '</dt><dd class="num">' + enrolledCount + '</dd></div>' +
    '<div><dt>' + t('Avaliações recebidas') + '</dt><dd class="num">' + getPlayerReviewCount() + '</dd></div>' +
    '<div><dt>' + t('Notificações') + '</dt><dd class="num">' + myNotifications().length + '</dd></div></dl></div></section>' +
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
    input(t('Data de nascimento'), 'profile-birth', p.birth, 'date', true, true) +
    input(t('Idade'), 'profile-age', String(age), 'number', false, false, true) +
    '<label class="field-label">' + t('Categoria') + '<select id="profile-category" class="field" disabled><option>' + escapeHtml(category) + '</option></select></label>' +
    selectField(t('Gênero'), 'profile-gender', GENDERS, p.gender) +
    '<p class="sm:col-span-2 -mt-1 text-xs text-ink-soft">' + t('CPF e data de nascimento não mudam depois do cadastro. Para corrigir, fale com a equipe em Conversas.') + '</p>' +
    input(t('E-mail'), 'profile-email', p.email, 'email', true, remote.enabled) + input(t('Telefone'), 'profile-phone', p.phone, 'tel', true) +
    '<p class="form-group-title sm:col-span-2">' + t('Futebol') + '</p>' + selectField(t('Posição principal'), 'profile-pos', POSITIONS, p.pos) + selectField(t('Posição secundária'), 'profile-secondary', ['—'].concat(POSITIONS), p.secondary) + selectField(t('Perna dominante'), 'profile-foot', FEET, p.foot || '') +
    addressFields('profile', p) +
    '<div id="profile-feedback" class="sm:col-span-2 hidden" role="alert"></div><div class="sm:col-span-2 flex justify-end"><button class="btn-primary" type="submit">' + t('Salvar alterações') + ' ' + icon('check', 'size-4') + '</button></div></form></div></section>' +
    '<section class="mt-6 grid gap-5 ' + (isMinorBirth(p.birth) ? 'lg:grid-cols-2' : '') + '">' + guardianPanel() + privacyPanel() + '</section>' +
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
  return '<article class="rounded-2xl surface p-5"><div class="flex items-start justify-between gap-3"><div class="flex items-center gap-3"><span class="avatar">' + avatar(review.author || 'Olheiro') + '</span><div><p class="font-semibold">' + (state.accounts.some((account) => account.role === 'staff' && account.email === review.authorEmail) ? '<button type="button" class="link-button" data-staff-profile="' + escapeHtml(review.authorEmail) + '">' + escapeHtml(review.author || 'Olheiro') + '</button>' : escapeHtml(review.author || 'Olheiro')) + '</p><p class="text-xs text-ink-soft">' + escapeHtml(review.date || t('Agora')) + (review.position ? ' • ' + t('como') + ' ' + escapeHtml(t(review.position)) : '') + '</p></div></div>' +
    '<div class="text-center"><div class="rounded-xl border border-brand/20 bg-brand/8 px-3 py-2 text-sm font-bold text-brand">' + escapeHtml(String(review.rating).replace('.', ',')) + '</div>' + (criteria.length ? '<p class="mt-1 text-xs text-ink-soft">' + t('nota ponderada') + '</p>' : '') + '</div></div>' +
    (criteria.length ? '<div class="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">' + criteria.map((c) => {
      const value = Number(review.ratings[c.key])
      return '<div><div class="flex justify-between text-xs text-ink-soft"><span>' + escapeHtml(t(c.label)) + '</span><strong class="text-chalk">' + String(value).replace('.', ',') + '</strong></div><div class="mt-1 h-1 overflow-hidden rounded-full bg-line"><div class="h-1 rounded-full bg-brand" style="width:' + Math.max(0, Math.min(100, value * 10)) + '%"></div></div></div>'
    }).join('') + '</div>' : '') +
    (review.baseRating !== undefined && review.adjustment ? '<p class="mt-3 text-xs text-ink-soft">' + t('Nota base') + ' <strong class="text-chalk">' + String(review.baseRating).replace('.', ',') + '</strong> • ' + t('ajuste por desempenho') + ' <strong class="' + (review.adjustment > 0 ? 'text-success' : 'text-danger') + '">' + (review.adjustment > 0 ? '+' : '') + String(review.adjustment).replace('.', ',') + '</strong></p>' : '') +
    (reviewStatChips(review) ? '<div class="mt-4 flex flex-wrap gap-1.5">' + reviewStatChips(review) + '</div>' : '') +
    (review.strengths && review.strengths.length ? '<div class="mt-3"><p class="text-xs font-bold text-ink-soft">' + t('Pontos fortes') + '</p><div class="mt-1.5 flex flex-wrap gap-1.5">' + review.strengths.map((item) => tag(item)).join('') + '</div></div>' : '') +
    '<p class="mt-4 text-sm leading-6 text-ink-soft">“' + escapeHtml(review.comment) + '”</p>' +
    (canDelete ? '<button type="button" class="mt-3 text-xs font-semibold text-danger hover:text-danger" data-delete-review="' + review.id + '">' + t('Excluir minha avaliação') + '</button>' : '') + '</article>'
}

function tryoutsPage() {
  const role = state.user?.role === 'staff' ? 'staff' : 'player'
  const createButton = role === 'staff' ? '<button type="button" class="btn-primary" data-action="openTryout">' + icon('plus', 'size-4') + ' ' + t('Criar peneira') + '</button>' : ''
  return shell(
    '<div class="page-head"><div><h1 class="page-title">' + t('Peneiras') + '</h1><p class="page-subtitle">' + (role === 'staff' ? t('Crie peneiras, acompanhe os inscritos e gerencie os locais.') : t('Veja oportunidades, posições, categoria, vagas e sua inscrição.')) + '</p></div>' + createButton + '</div>' +
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
  if (key === 'venues') return bar + venuesPanel()
  if (all.length && !list.length) {
    const empty = {
      'for-you': [t('Nenhuma peneira para o seu perfil agora'), t('Veja todas as peneiras ou ajuste suas posições no perfil.'), '<button type="button" class="btn-secondary mt-2" data-tryout-filter="all">' + t('Ver todas') + '</button>'],
      mine: [t('Você ainda não se inscreveu'), t('As peneiras em que você se inscrever aparecem aqui, com a data e o local.'), '<button type="button" class="btn-primary mt-2" data-tryout-filter="for-you">' + t('Ver peneiras para você') + '</button>'],
      past: [t('Nenhuma peneira encerrada'), t('Peneiras que já aconteceram ou foram canceladas ficam guardadas aqui.'), ''],
    }[key] || [t('Nenhuma peneira aberta'), '', '']
    return bar + '<div class="empty-state mt-6"><strong>' + empty[0] + '</strong><span class="text-sm">' + empty[1] + '</span>' + empty[2] + '</div>'
  }
  if (!all.length) {
    return (role === 'staff' ? bar : '') + '<div class="empty-state mt-6"><strong>' + t('Nenhuma peneira aberta') + '</strong><span class="text-sm">' +
      (role === 'staff' ? t('Crie a primeira peneira: os atletas compatíveis já poderão se inscrever.') : t('Quando a Pelé Academia abrir uma peneira, ela aparece aqui.')) + '</span>' +
      (role === 'staff' ? '<button type="button" class="btn-primary mt-2" data-action="openTryout">' + icon('plus', 'size-4') + ' ' + t('Criar peneira') + '</button>' : '') + '</div>'
  }
  return bar + '<div class="mt-6 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">' + list.map(tryoutCard).join('') + '</div>'
}

// ---------- Peneiras: datas, compatibilidade e filtros ----------
// Data, hora e contagem de cada peneira ficam em schedule.js (testado em tests/schedule.test.mjs).
const byStart = (a, b) => (startsAt(a) ?? 9e15) - (startsAt(b) ?? 9e15)
const isEnrolledIn = (tryout) => Array.isArray(tryout.enrolled) && tryout.enrolled.includes(state.user?.email)
// Por que a peneira serve (ou não) para o atleta logado.
function tryoutFit(tryout) {
  const profile = state.profile || {}
  const category = getCategoryFromAge(getAgeFromProfile(profile.birth))
  const positionOk = tryout.positions.includes(profile.pos) || tryout.positions.includes(profile.secondary)
  const categoryOk = !tryout.category || tryout.category === category
  const reasons = []
  if (!positionOk) reasons.push(t('aceita') + ' ' + joinPt(tryout.positions.map((pos) => t(pos).toLowerCase())))
  if (!categoryOk) reasons.push(t('é') + ' ' + tryout.category + ' ' + t('e a sua categoria é') + ' ' + category)
  return { ok: positionOk && categoryOk, reasons, category }
}
let tryoutFilter = null
function tryoutTabs(role, list) {
  const upcoming = list.filter((tryout) => !isPastTryout(tryout) && tryout.status !== 'cancelled')
  const tabs = role === 'staff'
    ? [['upcoming', t('Próximas'), upcoming], ['past', t('Encerradas'), list.filter(isPastTryout)], ['venues', t('Locais'), state.venues.filter((venue) => venue.active)]]
    : [['for-you', t('Para você'), upcoming.filter((tryout) => tryoutFit(tryout).ok)], ['mine', t('Minhas inscrições'), list.filter(isEnrolledIn)], ['all', t('Todas'), upcoming], ['past', t('Encerradas'), list.filter((tryout) => isPastTryout(tryout) || tryout.status === 'cancelled')]]
  if (!tryoutFilter || !tabs.some((tab) => tab[0] === tryoutFilter)) tryoutFilter = tabs[0][0]
  const current = tabs.find((tab) => tab[0] === tryoutFilter)
  const bar = '<div class="tab-bar" role="group" aria-label="' + t('Filtrar peneiras') + '">' + tabs.map(([key, label, items]) =>
    '<button type="button" class="tab-chip" data-tryout-filter="' + key + '" aria-pressed="' + (key === tryoutFilter) + '">' + label + '<span class="tab-count">' + items.length + '</span></button>').join('') + '</div>'
  const items = current[0] === 'venues' ? current[2] : current[2].slice().sort(byStart)
  return { bar, items: current[0] === 'past' ? items.reverse() : items, key: current[0] }
}

// Presença: a chamada abre no dia da peneira e segue aberta depois, para corrigir um esquecimento (mesma regra do servidor).
const checkinOpen = (tryout) => ['today', 'live', 'ended'].includes(tryoutPhase(tryout))
const checkinsOf = (tryout) => tryout.checkins || {}

// O que a tela precisa saber de uma peneira: usado pelo card e pela janela de detalhes.
function tryoutView(tryout) {
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
  const past = isPastTryout(tryout)
  const myCheckin = checkinsOf(tryout)[email]

  let actions
  if (staff) {
    const present = Object.keys(checkinsOf(tryout)).length
    actions = (checkinOpen(tryout)
      ? '<button type="button" class="' + (past ? 'btn-secondary' : 'btn-primary') + ' w-full" data-action="view-enrolled" data-id="' + tryout.id + '">' + icon('check', 'size-4') + ' ' + t('Chamada') + ' · ' + present + ' ' + t('de') + ' ' + taken + ' ' + t('presentes') + '</button>'
      : '<button type="button" class="btn-secondary w-full" data-action="view-enrolled" data-id="' + tryout.id + '">' + t('Ver inscritos') + ' (' + taken + '/' + seats + ') ' + icon('arrow', 'size-4') + '</button>') +
      (past ? '' : '<button type="button" class="btn-danger w-full" data-action="cancel-tryout" data-id="' + tryout.id + '">' + icon('close', 'size-4') + ' ' + t('Cancelar peneira') + '</button>')
  } else if (myCheckin) {
    actions = ''
  } else if (enrolled) {
    actions = '<button type="button" class="btn-danger w-full" data-action="withdraw" data-id="' + tryout.id + '">' + t('Cancelar minha inscrição') + '</button>'
  } else {
    actions = '<button type="button" class="btn-' + (incompatible ? 'incompatible' : 'primary') + ' w-full" data-action="enroll" data-id="' + tryout.id + '" ' + (!canEnroll || full ? 'disabled' : '') + '>' +
      (full ? t('Sem vagas') : canEnroll ? t('Inscrever-me') : t('Indisponível para o seu perfil')) + (canEnroll && !full ? ' ' + icon('arrow', 'size-4') : '') + '</button>'
  }

  const fit = staff ? { ok: true, reasons: [] } : tryoutFit(tryout)
  const scarce = !full && vacancies <= Math.max(2, Math.ceil(seats * 0.2))
  const place = tryoutPlace(tryout)
  const fitLine = staff ? '' : myCheckin
    ? '<p class="fit-line fit-ok">' + icon('check', 'size-4 shrink-0') + t('Presença confirmada às') + ' ' + fmtClock(myCheckin) + '.</p>'
    : enrolled && past ? ''
    : enrolled
    ? '<p class="fit-line fit-ok">' + icon('check', 'size-4 shrink-0') + '<span>' + t('Você está inscrito. Chegue 30 minutos antes.') + (place.reference ? ' ' + t('Referência:') + ' ' + escapeHtml(place.reference) + '.' : '') + '</span></p>'
    : fit.ok
      ? '<p class="fit-line fit-ok">' + icon('check', 'size-4 shrink-0') + t('Compatível com você:') + ' ' + escapeHtml(t(state.profile?.pos || '')) + ' · ' + escapeHtml(fit.category) + '</p>'
      : '<p class="fit-line fit-no">' + icon('info', 'size-4 shrink-0') + t('Fora do seu perfil: esta peneira') + ' ' + escapeHtml(fit.reasons.join(' e ')) + '.</p>'
  if (past && !staff) actions = '<p class="text-sm text-ink-soft">' + t('Peneira encerrada.') + '</p>'
  const phase = tryoutPhase(tryout)
  if (!staff && phase === 'live' && !myCheckin) actions = enrolled
    ? '<p class="fit-line fit-ok">' + icon('check', 'size-4 shrink-0') + t('Em andamento. Bom jogo!') + '</p>'
    : '<p class="text-sm text-ink-soft">' + t('Inscrições encerradas: a peneira já começou.') + '</p>'
  if (!staff && phase === 'tbd' && !enrolled) actions = '<button type="button" class="btn-incompatible w-full" disabled>' + t('Data a confirmar') + '</button>'
  else if (!staff && !enrolled && !past && canEnroll && !full && needsGuardianMe()) actions = '<button type="button" class="btn-secondary w-full" data-action="open-guardian">' + icon('user', 'size-4') + ' ' + t('Falta a autorização do responsável') + '</button>'
  return { staff, enrolled, taken, seats, vacancies, full, scarce, fit, place, actions, fitLine }
}

function seatsMeter(v) {
  return '<div class="flex items-baseline justify-between gap-3 text-sm"><span><strong class="num text-2xl ' + (v.full ? 'text-danger' : 'text-chalk') + '">' + v.taken + '</strong><span class="text-ink-soft"> ' + t('de') + ' ' + v.seats + ' ' + t('vagas preenchidas') + '</span></span>' +
    '<span class="tag ' + (v.full ? 'red' : v.scarce ? 'warn' : 'green') + '">' + (v.full ? t('Lotada') : v.scarce ? (v.vacancies === 1 ? t('Última vaga') : t('Últimas') + ' ' + v.vacancies + ' ' + t('vagas')) : plural(v.vacancies, 'vaga livre', 'vagas livres')) + '</span></div>' +
    '<div class="mt-2 h-2 overflow-hidden rounded-full bg-line"><div class="bar-fill h-full rounded-full ' + (v.full ? 'bg-danger' : v.scarce ? 'bg-warning' : 'bg-brand') + '" style="width:' + Math.min(100, v.taken / v.seats * 100) + '%"></div></div>'
}

const tryoutPlaceLine = (tryout) => escapeHtml(tryout.location) + ' · ' + escapeHtml(tryout.city) + '/' + escapeHtml(tryout.state)

function tryoutCard(tryout) {
  if (tryout.status === 'cancelled') {
    return '<article class="panel flex flex-col" data-tryout-card="' + tryout.id + '"><div class="flex flex-wrap gap-1.5"><span class="tag red">' + t('Cancelada') + '</span>' + tag(tryout.category || t('Aberta'), true) + '</div>' +
      '<h2 class="mt-4 text-xl font-bold">' + escapeHtml(tryout.title) + '</h2><p class="mt-3 text-sm text-ink-soft">' + formatDate(tryout.date) + ' • ' + escapeHtml(tryout.time) + '</p>' +
      '<p class="mt-4 text-sm"><strong>' + t('Motivo:') + '</strong> ' + escapeHtml(tryout.cancelReason || t('Não informado.')) + '</p></article>'
  }
  const v = tryoutView(tryout)
  return '<article class="tryout-card reveal spot panel flex flex-col' + (v.enrolled ? ' is-enrolled' : '') + (!v.staff && !v.fit.ok && !v.enrolled ? ' is-off' : '') + '" data-tryout-card="' + tryout.id + '">' +
    (v.enrolled ? '<span class="enrolled-ribbon">' + icon('check', 'size-3.5') + t('Inscrito') + '</span>' : '') +
    '<div class="flex items-start gap-4">' + scoreboard(tryout.date, tryout.time) +
    '<div class="min-w-0 flex-1"><h2 class="text-xl font-semibold leading-tight">' + escapeHtml(tryout.title) + '</h2>' +
    '<p class="mt-1 flex items-start gap-1.5 text-sm text-ink-soft">' + icon('pin', 'size-4 mt-0.5 shrink-0 text-brand') + '<span>' + tryoutPlaceLine(tryout) +
    (v.place.address ? '<br/><span class="text-xs">' + escapeHtml(v.place.address) + '</span> ' + mapLink([tryout.location, v.place.address, tryout.city, tryout.state]) : '') + '</span></p>' +
    countdownTag(tryout) + '</div></div>' +
    '<div class="mt-4 flex flex-wrap gap-1.5">' + tag(tryout.category || t('Livre'), true) + tryout.positions.map(posTag).join('') + '</div>' +
    (tryout.description ? '<p class="tryout-blurb">' + escapeHtml(tryout.description) + '</p>' : '') +
    v.fitLine +
    '<div class="mt-5">' + seatsMeter(v) + '</div>' +
    '<div class="mt-auto grid gap-2 pt-5">' + v.actions +
    '<button type="button" class="tryout-more" data-tryout-details="' + tryout.id + '" aria-haspopup="dialog">' + t('Ver detalhes') + '<span class="sr-only"> ' + t('de') + ' ' + escapeHtml(tryout.title) + '</span>' + icon('arrow', 'size-4') + '</button></div></article>'
}

// ---------- Detalhes da peneira ----------
// Referências: páginas de evento do Meetup ("Details" + quando/onde ao lado) e do Luma ("About Event"
// com a inscrição no rodapé). Aqui num modal, para o atleta não perder a lista.
function longTryoutDate(tryout) {
  if (!validTryoutDate(tryout.date)) return t('Data a confirmar')
  const text = new Date(tryout.date + 'T12:00:00-03:00').toLocaleDateString(getLang() === 'es' ? 'es' : 'pt-BR', { timeZone: 'America/Sao_Paulo', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function openTryoutDetails(id) {
  const tryout = state.tryouts.find((item) => item.id === id)
  if (!tryout) return
  const v = tryoutView(tryout)
  const organizer = state.accounts.find((account) => account.email === tryout.createdBy)?.profile?.name || ''
  const section = (title, iconName, body) => '<section class="td-block"><h3 class="td-label">' + icon(iconName, 'size-4') + title + '</h3>' + body + '</section>'
  const wrapper = document.createElement('div')
  wrapper.className = 'fixed inset-0 z-[90] grid place-items-center bg-black/75 p-4 backdrop-blur-md'
  wrapper.innerHTML =
    '<div class="tryout-details max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-card surface surface--raised shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="td-title" data-lenis-prevent>' +
    '<header class="td-hero"><div class="flex items-start gap-4">' + scoreboard(tryout.date, tryout.time) +
    '<div class="min-w-0 flex-1"><p class="flex flex-wrap gap-1.5">' + tag(tryout.category || t('Livre'), true) + (v.enrolled ? '<span class="tag green">' + icon('check', 'size-3.5') + ' ' + t('Inscrito') + '</span>' : '') + '</p>' +
    '<h2 id="td-title" class="mt-2 text-2xl font-bold leading-tight">' + escapeHtml(tryout.title) + '</h2>' + countdownTag(tryout) + '</div>' +
    '<button type="button" class="icon-button" aria-label="' + t('Fechar') + '" data-close>' + icon('close') + '</button></div></header>' +
    '<div class="td-body">' +
    section(t('Sobre a peneira'), 'info', tryout.description
      ? '<p class="td-text">' + escapeHtml(tryout.description) + '</p>'
      : '<p class="text-sm text-ink-soft">' + t('Quem organizou ainda não escreveu mais detalhes. Data, local e vagas estão aqui embaixo.') + '</p>') +
    '<div class="grid gap-5 sm:grid-cols-2">' +
    section(t('Quando'), 'calendar', '<p class="font-semibold">' + escapeHtml(longTryoutDate(tryout)) + '</p><p class="text-sm text-ink-soft">' + (validTime(tryout.time) ? escapeHtml(tryout.time) + ' · ' + t('horário de Brasília') : t('Horário a confirmar')) + '</p>' +
      '<p class="mt-1 text-xs text-ink-soft">' + t('As inscrições fecham na hora em que a peneira começa.') + '</p>') +
    section(t('Onde'), 'pin', '<p class="font-semibold">' + escapeHtml(tryout.location) + '</p><p class="text-sm text-ink-soft">' + (v.place.address ? escapeHtml(v.place.address) + '<br/>' : '') + escapeHtml(tryout.city) + '/' + escapeHtml(tryout.state) + '</p>' +
      (v.place.reference ? '<p class="mt-1 text-xs text-ink-soft">' + t('Referência:') + ' ' + escapeHtml(v.place.reference) + '</p>' : '') +
      (v.place.address ? '<p class="mt-2">' + mapLink([tryout.location, v.place.address, tryout.city, tryout.state]) + '</p>' : '')) +
    '</div>' +
    section(t('Para quem'), 'user', '<p class="flex flex-wrap gap-1.5">' + tag(tryout.category || t('Livre'), true) + tryout.positions.map(posTag).join('') + '</p>' + v.fitLine) +
    section(t('Vagas'), 'clipboard', seatsMeter(v)) +
    (organizer ? '<p class="text-xs text-ink-soft">' + t('Organizada por') + ' <button type="button" class="link-button" data-staff-profile="' + escapeHtml(tryout.createdBy) + '">' + escapeHtml(organizer) + '</button></p>' : '') +
    '</div>' +
    '<footer class="td-foot">' + v.actions + '</footer></div>'
  document.body.appendChild(wrapper)
  wrapper.addEventListener('click', (event) => {
    if (event.target === wrapper || event.target.closest('[data-close]')) return wrapper.remove()
    const button = event.target.closest('[data-action]')
    const run = button && {
      enroll: () => enrollInTryout(id, document.querySelector('[data-tryout-card="' + id + '"] [data-action="enroll"]')),
      withdraw: () => confirmWithdraw(id),
      'view-enrolled': () => openEnrolledModal(id),
      'cancel-tryout': () => openCancelTryoutModal(id),
      'open-guardian': () => openGuardianModal(),
    }[button.dataset.action]
    if (!run) return
    wrapper.remove()
    run()
  })
}

// ---------- Contagem regressiva ----------
function countdownClass(c) {
  return 'countdown' + (c.soon ? ' is-soon' : '') + (c.urgent ? ' is-urgent' : '') + (c.phase === 'live' ? ' is-live' : '') + (['ended', 'cancelled', 'tbd'].includes(c.phase) ? ' is-muted' : '')
}
// Cada elemento carrega a data e a hora da própria peneira; é delas que a contagem sai.
const countdownData = (tryout, phase) => ' data-countdown data-date="' + escapeHtml(tryout.date || '') + '" data-time="' + escapeHtml(tryout.time || '') + '" data-status="' + escapeHtml(tryout.status || '') + '" data-phase="' + phase + '"'
function countdownTag(tryout) {
  const c = countdown(tryout)
  return '<p class="' + countdownClass(c) + '"' + countdownData(tryout, c.phase) + '><span class="live-dot" aria-hidden="true"></span>' + icon('calendar', 'size-3.5 cd-icon') + '<span data-cd-text>' + escapeHtml(c.text) + '</span></p>'
}
function bigCountdownTag(tryout) {
  const c = bigCountdown(tryout)
  return '<div class="big-countdown mt-4 flex items-end gap-3' + (c.urgent ? ' is-urgent' : '') + '" data-big' + countdownData(tryout, c.phase) + '><span class="num countdown-big" data-cd-value>' + escapeHtml(c.value) + '</span><span class="max-w-[8rem] pb-2 text-sm leading-5 text-ink-soft" data-cd-label>' + escapeHtml(c.label) + '</span></div>'
}
// Um só intervalo redesenha os textos, mas cada contagem é calculada com os dados da própria peneira.
// Quando uma peneira muda de fase (por exemplo, começou), a tela é redesenhada para o botão de inscrição acompanhar.
function tickCountdowns() {
  if (document.hidden) return
  const now = Date.now()
  let changed = false
  document.querySelectorAll('[data-countdown]').forEach((el) => {
    const tryout = { date: el.dataset.date, time: el.dataset.time, status: el.dataset.status }
    if (el.hasAttribute('data-big')) {
      const c = bigCountdown(tryout, now)
      changed ||= c.phase !== el.dataset.phase
      el.querySelector('[data-cd-value]').textContent = c.value
      el.querySelector('[data-cd-label]').textContent = c.label
      el.classList.toggle('is-urgent', !!c.urgent)
      return
    }
    const c = countdown(tryout, now)
    changed ||= c.phase !== el.dataset.phase
    const text = el.querySelector('[data-cd-text]')
    if (text.textContent !== c.text) text.textContent = c.text
    el.className = countdownClass(c)
  })
  if (changed && !document.querySelector('[role="dialog"]')) render()
}

// ---------- Locais de peneira ----------
const activeVenues = () => state.venues.filter((venue) => venue.active).sort((a, b) => a.name.localeCompare(b.name, 'pt'))
const venueAddress = (venue) => [venue.address, venue.district].filter(Boolean).join(', ')
// Link de busca do Google Maps (não precisa de chave).
const mapLink = (parts) => '<a class="map-link" href="https://www.google.com/maps/search/?api=1&amp;query=' + encodeURIComponent(parts.filter(Boolean).join(', ')) + '" target="_blank" rel="noopener">' + t('Como chegar') + '<span class="sr-only"> (' + t('abre o mapa em outra aba') + ')</span></a>'
function tryoutPlace(tryout) {
  if (tryout.remote) return { address: [tryout.address, tryout.district].filter(Boolean).join(', '), reference: tryout.reference || '' }
  const venue = state.venues.find((item) => item.id === tryout.venueId)
  return { address: venue ? venueAddress(venue) : '', reference: venue?.reference || '' }
}
function venueOptions(selectedId = null) {
  return '<option value="">' + t('Escolha o local…') + '</option>' + activeVenues().map((venue) =>
    '<option value="' + venue.id + '"' + (venue.id === selectedId ? ' selected' : '') + '>' + escapeHtml(venue.name) + ' — ' + escapeHtml(venue.city) + '/' + escapeHtml(venue.state) + '</option>').join('')
}

// Registro de alterações. Com o Supabase quem grava é o banco (tabela audit_log); no modo local, o navegador.
function logChange(action, entity, id, details = {}) {
  if (remote.enabled) return
  const log = readStorage('ap_audit', [])
  log.push({ at: new Date().toISOString(), actor: state.user?.email || '', action, entity, id: String(id), details })
  try { localStorage.setItem('ap_audit', JSON.stringify(log.slice(-500))) } catch {}
}

let showInactiveVenues = false
let justSavedVenue = null
function venuesPanel() {
  const inactive = state.venues.filter((venue) => !venue.active).length
  const list = state.venues.filter((venue) => showInactiveVenues || venue.active).sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name, 'pt'))
  const head = '<div class="venue-head mt-6"><p class="max-w-[62ch] text-sm text-ink-soft">' + t('Os locais ativos aparecem na hora de criar uma peneira. Desativar não apaga as peneiras já marcadas.') + '</p>' +
    '<div class="flex flex-wrap gap-2">' + (inactive ? '<button type="button" class="tab-chip" data-action="toggle-inactive-venues" aria-pressed="' + showInactiveVenues + '">' + t('Mostrar desativados') + '<span class="tab-count">' + inactive + '</span></button>' : '') +
    '<button type="button" class="btn-primary" data-action="new-venue">' + icon('plus', 'size-4') + ' ' + t('Cadastrar local') + '</button></div></div>'
  const body = list.length
    ? '<div class="mt-5 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">' + list.map(venueCard).join('') + '</div>'
    : '<div class="empty-state mt-5">' + icon('pin', 'size-6 text-brand') + '<strong>' + t('Nenhum local cadastrado') + '</strong><span class="text-sm">' + t('Cadastre o primeiro local para poder marcar peneiras.') + '</span><button type="button" class="btn-primary mt-2" data-action="new-venue">' + icon('plus', 'size-4') + ' ' + t('Cadastrar local') + '</button></div>'
  justSavedVenue = null
  return head + body
}
function venueCard(venue) {
  const uses = state.tryouts.filter((tryout) => tryout.venueId === venue.id && tryout.status !== 'cancelled')
  const upcoming = uses.filter((tryout) => !isPastTryout(tryout)).length
  const address = venueAddress(venue)
  const edited = venue.updatedAt ? ' · ' + t('Atualizado') + (venue.updatedBy ? ' ' + t('por') + ' ' + escapeHtml(venue.updatedBy) : '') + ' ' + t('em') + ' ' + new Date(venue.updatedAt).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : ''
  return '<article class="venue-card reveal spot panel flex flex-col' + (venue.active ? '' : ' is-inactive') + (venue.id === justSavedVenue ? ' is-new' : '') + '" data-venue-card="' + venue.id + '">' +
    '<div class="flex items-start gap-3"><span class="venue-pin" aria-hidden="true">' + icon('pin', 'size-5') + '</span><div class="min-w-0 flex-1"><h3 class="text-lg font-semibold leading-tight">' + escapeHtml(venue.name) + '</h3>' +
    '<p class="mt-0.5 text-sm text-ink-soft">' + escapeHtml(venue.city) + '/' + escapeHtml(venue.state) + (venue.zip ? ' · CEP ' + escapeHtml(venue.zip) : '') + '</p></div>' +
    (venue.active ? '<span class="tag green">' + t('Ativo') + '</span>' : '<span class="tag">' + t('Desativado') + '</span>') + '</div>' +
    (address ? '<p class="mt-4 text-sm">' + escapeHtml(address) + '</p>' : '<p class="fit-line fit-no">' + icon('info', 'size-4 shrink-0') + t('Endereço a completar: edite para os atletas saberem onde ir.') + '</p>') +
    (venue.reference ? '<p class="mt-1 text-sm text-ink-soft">' + t('Referência:') + ' ' + escapeHtml(venue.reference) + '</p>' : '') +
    '<p class="mt-4 text-xs text-ink-soft"><span class="tabular">' + plural(uses.length, 'peneira marcada', 'peneiras marcadas') + '</span>' + (upcoming ? ' (' + upcoming + ' ' + t('por vir') + ')' : '') + edited + '</p>' +
    '<div class="mt-auto flex flex-wrap items-center gap-2 pt-5"><button type="button" class="btn-secondary" data-edit-venue="' + venue.id + '">' + icon('edit', 'size-4') + ' ' + t('Editar') + '</button>' +
    '<button type="button" class="btn-ghost' + (venue.active ? ' text-danger' : '') + '" data-toggle-venue="' + venue.id + '">' + (venue.active ? t('Desativar') : t('Reativar')) + '</button>' +
    (address ? '<span class="ml-auto">' + mapLink([venue.name, address, venue.city, venue.state]) + '</span>' : '') + '</div></article>'
}

function openVenueModal(venue = null, onSaved = null) {
  if (state.user?.role !== 'staff') return toast(t('Somente funcionários gerenciam locais.'), 'error')
  const v = venue || { name: '', address: '', district: '', city: '', state: 'SP', zip: '', reference: '' }
  const wrapper = document.createElement('div')
  wrapper.className = 'fixed inset-0 z-[95] grid place-items-center bg-black/75 p-4 backdrop-blur-md'
  wrapper.innerHTML =
    '<div class="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-card surface surface--raised p-6 shadow-2xl sm:p-8" role="dialog" aria-modal="true" aria-labelledby="venue-title" data-lenis-prevent>' +
    '<div class="flex items-start justify-between gap-4"><div><h2 id="venue-title" class="text-2xl font-bold">' + (venue ? t('Editar local') : t('Cadastrar local')) + '</h2><p class="mt-1 text-sm text-ink-soft">' + t('O endereço aparece para os atletas inscritos, com o link para o mapa.') + '</p></div><button type="button" class="icon-button" aria-label="' + t('Fechar') + '" data-close>' + icon('close') + '</button></div>' +
    '<form id="venue-form" class="mt-6 grid gap-4 sm:grid-cols-6" novalidate>' +
    '<div class="sm:col-span-6">' + input(t('Nome do local'), 'venue-name', v.name, 'text', true) + '</div>' +
    '<div class="sm:col-span-2">' + input(t('CEP (opcional)'), 'venue-zip', v.zip, 'text') + '</div>' +
    '<div class="sm:col-span-4">' + input(t('Endereço (rua e número)'), 'venue-address', v.address, 'text', true) + '</div>' +
    '<div class="sm:col-span-2">' + input(t('Bairro'), 'venue-district', v.district) + '</div>' +
    '<div class="sm:col-span-3">' + input(t('Cidade'), 'venue-city', v.city, 'text', true) + '</div>' +
    '<label class="field-label sm:col-span-1">UF<select id="venue-state" class="field" required>' + UFS.map((uf) => '<option' + (uf === v.state ? ' selected' : '') + '>' + uf + '</option>').join('') + '</select></label>' +
    '<label class="field-label sm:col-span-6">' + t('Complemento e referência (opcional)') + '<textarea id="venue-reference" class="field min-h-20" maxlength="300" placeholder="' + t('Ex.: portão 2, ao lado da estação') + '">' + escapeHtml(v.reference) + '</textarea></label>' +
    '<div class="flex justify-end gap-2 sm:col-span-6"><button type="button" class="btn-secondary" data-close>' + t('Cancelar') + '</button><button class="btn-primary" type="submit">' + (venue ? t('Salvar alterações') : t('Cadastrar local')) + ' ' + icon('check', 'size-4') + '</button></div></form></div>'
  document.body.appendChild(wrapper)
  wrapper.querySelectorAll('[data-close]').forEach((button) => button.addEventListener('click', () => wrapper.remove()))
  wrapper.querySelector('#venue-zip').addEventListener('input', (event) => { event.target.value = event.target.value.replace(/\D/g, '').slice(0, 8).replace(/^(\d{5})(\d)/, '$1-$2') })
  const form = wrapper.querySelector('#venue-form')
  const submit = form.querySelector('[type="submit"]')
  form.addEventListener('input', (event) => { if (event.target.id) setFieldError(event.target.id, '') })

  form.addEventListener('submit', (event) => {
    event.preventDefault()
    const get = (id) => wrapper.querySelector('#' + id).value.trim().replace(/[ \t]+/g, ' ')
    const fields = { name: get('venue-name'), zip: get('venue-zip'), address: get('venue-address'), district: get('venue-district'), city: get('venue-city'), state: get('venue-state'), reference: get('venue-reference') }
    const key = (item) => item.name.trim().toLowerCase() + '|' + item.city.trim().toLowerCase() + '|' + item.state
    const duplicate = state.venues.find((item) => item.id !== venue?.id && key(item) === key(fields))
    const errors = [
      ['venue-name', fields.name.length < 3 ? t('Informe o nome do local (pelo menos 3 letras).') : fields.name.length > 120 ? t('Use até 120 caracteres.') : duplicate ? t('Já existe') + ' "' + duplicate.name + '" ' + t('em') + ' ' + duplicate.city + '/' + duplicate.state + '.' : ''],
      ['venue-zip', fields.zip && !/^\d{5}-?\d{3}$/.test(fields.zip) ? t('CEP no formato 00000-000.') : ''],
      ['venue-address', fields.address.length < 5 ? t('Informe a rua e o número.') : fields.address.length > 200 ? t('Use até 200 caracteres.') : ''],
      ['venue-city', fields.city.length < 2 ? t('Informe a cidade.') : ''],
      ['venue-district', fields.district.length > 80 ? t('Use até 80 caracteres.') : ''],
    ]
    errors.forEach(([id, message]) => setFieldError(id, message))
    const firstError = errors.find(([, message]) => message)
    if (firstError) return wrapper.querySelector('#' + firstError[0]).focus()

    const save = async () => {
      submit.setAttribute('aria-busy', 'true')
      let saved
      if (remote.enabled) {
        const { row, error } = await saveVenue(venue?.id, fields)
        if (error) {
          submit.removeAttribute('aria-busy')
          if (String(error.message || '').includes('venues_name_city_key')) setFieldError('venue-name', describeError(error))
          return toast(describeError(error), 'error')
        }
        saved = mapRemoteVenue(row)
        const index = state.venues.findIndex((item) => item.id === saved.id)
        if (index >= 0) state.venues[index] = saved
        else state.venues.push(saved)
      } else {
        saved = venue ? Object.assign(venue, fields) : { id: Date.now(), active: true, ...fields }
        saved.updatedBy = state.user.name
        saved.updatedAt = new Date().toISOString()
        if (!venue) state.venues.push(saved)
        logChange(venue ? 'update' : 'create', 'venue', saved.id, fields)
        persist()
      }
      justSavedVenue = saved.id
      wrapper.remove()
      toast(venue ? t('Local atualizado.') : t('Local cadastrado. Ele já aparece na criação de peneiras.'))
      if (onSaved) return onSaved(saved)
      render()
      // O foco vai para o local salvo (em vez de cair no começo da página).
      document.querySelector('[data-venue-card="' + saved.id + '"] [data-edit-venue]')?.focus()
    }
    // Editar um local com peneiras marcadas afeta o que os inscritos veem: pede confirmação.
    const upcomingHere = venue ? state.tryouts.filter((tryout) => tryout.venueId === venue.id && tryout.status !== 'cancelled' && !isPastTryout(tryout)).length : 0
    const changed = venue && ['name', 'address', 'district', 'city', 'state', 'zip', 'reference'].some((field) => (venue[field] || '') !== fields[field])
    if (upcomingHere && changed) {
      confirmDialog({
        title: t('Alterar um local com peneiras marcadas?'),
        message: plural(upcomingHere, 'peneira por vir usa', 'peneiras por vir usam') + ' ' + t('este local. O novo endereço aparece para os inscritos; o nome e a cidade já gravados nessas peneiras não mudam.'),
        confirmLabel: t('Salvar alterações'),
        onConfirm: save,
      })
    } else save()
  })
}

function toggleVenue(id) {
  const venue = state.venues.find((item) => item.id === id)
  if (!venue || state.user?.role !== 'staff') return
  const apply = async () => {
    const active = !venue.active
    if (remote.enabled) {
      const { row, error } = await saveVenue(id, { active })
      if (error) return toast(describeError(error), 'error')
      Object.assign(venue, mapRemoteVenue(row))
    } else {
      venue.active = active
      venue.updatedBy = state.user.name
      venue.updatedAt = new Date().toISOString()
      logChange(active ? 'reactivate' : 'deactivate', 'venue', id, { active })
      persist()
    }
    // O card desbota (ou volta a cor) antes de a lista ser redesenhada.
    document.querySelector('[data-venue-card="' + id + '"]')?.classList.toggle('is-inactive', !active)
    toast(active ? t('Local reativado.') : t('Local desativado. As peneiras já marcadas continuam com ele.'))
    setTimeout(render, 420)
  }
  if (!venue.active) return apply()
  const uses = state.tryouts.filter((tryout) => tryout.venueId === id && tryout.status !== 'cancelled').length
  confirmDialog({
    title: t('Desativar') + ' ' + venue.name + '?',
    message: t('Ele deixa de aparecer na criação de peneiras.') + ' ' + (uses ? plural(uses, 'peneira já marcada aqui continua', 'peneiras já marcadas aqui continuam') + ' ' + t('com este endereço.') + ' ' : '') + t('Você pode reativar quando quiser.'),
    confirmLabel: t('Desativar local'),
    onConfirm: apply,
  })
}

// =====================================================================================
// Equipe: funcionários entram por convite; administradores controlam os acessos.
// Referências: convites de organização do GitHub (vencem em 7 dias; lista de pendentes com
// "cancelar" e "reenviar"), token do GitHub mostrado uma vez só e o "copiar link de convite" do Slack.
// No Supabase quem decide é o banco (migration 20261021120000_equipe.sql); aqui é só a tela.
// =====================================================================================
const INVITE_DAYS = 7
const myAccount = () => state.accounts.find((account) => account.email === state.user?.email)
const isAdmin = () => state.user?.role === 'staff' && !!myAccount()?.admin
const adminTag = () => '<span class="tag admin-tag">' + icon('shield', 'size-3.5') + t('Administrador') + '</span>'
const inviteStatus = (invite, now = Date.now()) => invite.usedAt ? 'used' : invite.revokedAt ? 'revoked' : Date.parse(invite.expiresAt) <= now ? 'expired' : 'valid'
const inviteLink = (code) => location.origin + location.pathname + location.search + '#/convite/' + code
const newInviteCode = () => (crypto.randomUUID() + crypto.randomUUID()).replace(/-/g, '')
const fmtWhen = (iso) => new Date(iso).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(',', ' ' + t('às'))
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// O código só existe no link; o que fica guardado é o hash (igual ao servidor).
async function sha256Hex(text) {
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text.trim())))
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

let teamCache = null
let teamStatus = null
let justInvited = null
async function loadTeam() {
  const data = await fetchTeam()
  const nameOf = (id) => data.staff.find((profile) => profile.id === id)?.name || ''
  teamCache = {
    staff: data.staff.map((row) => ({ id: row.id, email: row.email, name: row.name, position: row.data?.position || '', admin: row.is_admin, active: row.active, photo: row.data?.photo, demo: DEMO_STAFF.some((demo) => demo.email === row.email) })),
    invites: data.invites.map((row) => ({ id: Number(row.id), email: row.email, admin: row.is_admin, createdBy: nameOf(row.created_by), createdAt: row.created_at, expiresAt: row.expires_at, usedAt: row.used_at, usedBy: nameOf(row.used_by), revokedAt: row.revoked_at })),
    log: data.log.map((row) => ({ at: row.created_at, actor: nameOf(row.actor_id), action: row.action, entity: row.entity, details: row.details || {} })),
  }
}

function teamData() {
  if (remote.enabled) return teamCache
  const nameOf = (email) => state.accounts.find((account) => account.email === email)?.profile?.name || email || ''
  return {
    staff: state.accounts.filter((account) => account.role === 'staff').map((account) => ({ id: account.email, email: account.email, name: account.profile?.name || account.email, position: account.profile?.position || '', admin: !!account.admin, active: account.active !== false, photo: account.profile?.photo, demo: account.profile?.demo })),
    invites: state.invites.slice().reverse().map((invite) => ({ ...invite, createdBy: nameOf(invite.createdBy), usedBy: nameOf(invite.usedBy) })),
    log: readStorage('ap_audit', []).filter((entry) => ['staff', 'staff_invite'].includes(entry.entity)).reverse().slice(0, 20)
      .map((entry) => ({ at: entry.at, actor: nameOf(entry.actor), action: entry.action, entity: entry.entity, details: entry.details || {} })),
  }
}

// ---------- ações (modo local espelha as regras do servidor) ----------
async function inviteStaff(email, admin) {
  if (remote.enabled) {
    const { invite, error } = await createStaffInvite(email, admin)
    return error ? { error: describeError(error) } : { id: Number(invite.id), code: invite.code, expiresAt: invite.expires_at }
  }
  if (!isAdmin()) return { error: t('Só administradores podem fazer isso.') }
  if (state.accounts.some((account) => account.email === email)) return { error: t('Este e-mail já tem uma conta na plataforma.') }
  const now = new Date()
  state.invites.filter((invite) => invite.email === email && !invite.usedAt && !invite.revokedAt).forEach((invite) => { invite.revokedAt = now.toISOString(); invite.revokedBy = state.user.email })
  const code = newInviteCode()
  const invite = { id: Date.now(), email, codeHash: await sha256Hex(code), admin, createdBy: state.user.email, createdAt: now.toISOString(), expiresAt: new Date(now.getTime() + INVITE_DAYS * 864e5).toISOString() }
  state.invites.push(invite)
  logChange('create', 'staff_invite', invite.id, { email, is_admin: admin })
  persist()
  return { id: invite.id, code, expiresAt: invite.expiresAt }
}

async function revokeInvite(id) {
  if (remote.enabled) {
    const error = await revokeStaffInvite(id)
    return error ? describeError(error) : null
  }
  const invite = state.invites.find((item) => item.id === id)
  if (!isAdmin()) return t('Só administradores podem fazer isso.')
  if (!invite || invite.usedAt || invite.revokedAt) return t('Este convite já foi usado ou cancelado.')
  invite.revokedAt = new Date().toISOString()
  invite.revokedBy = state.user.email
  logChange('revoke', 'staff_invite', id, { email: invite.email })
  persist()
  return null
}

async function saveMember(member, active, admin) {
  if (remote.enabled) {
    const error = await updateStaff(member.id, active, admin)
    return error ? describeError(error) : null
  }
  const account = state.accounts.find((item) => item.email === member.email && item.role === 'staff')
  if (!isAdmin()) return t('Só administradores podem fazer isso.')
  if (!account) return t('Esta conta não é de funcionário.')
  if (account.email === state.user.email) return t('Você não pode alterar a própria conta. Peça a outro administrador.')
  const wasActive = account.active !== false
  const details = { email: account.email }
  if (wasActive !== active) details.active = { de: wasActive, para: active }
  if (!!account.admin !== admin) details.is_admin = { de: !!account.admin, para: admin }
  account.active = active
  account.admin = admin
  logChange(wasActive && !active ? 'deactivate' : !wasActive && active ? 'reactivate' : 'update', 'staff', account.email, details)
  persist()
  return null
}

async function refreshTeam() {
  if (remote.enabled) {
    try { await loadTeam() } catch (error) { toast(describeError(error), 'error') }
  }
  render()
}

// ---------- telas ----------
// ---------- Perfil profissional do funcionário ----------
// Referências: as seções do perfil do LinkedIn (título, Sobre, Experiência, Competências, Licenças) e a ficha de
// comissão técnica do Transfermarkt (clube atual, função, desde quando, histórico). Fica em profiles.data, que
// atletas logados podem ler enquanto o funcionário estiver ativo. Os números vêm do que a pessoa fez na plataforma.
const LINKEDIN_RE = /^https:\/\/(www\.)?linkedin\.com\/in\/[\w%-]+\/?$/i
const CATEGORIES = ['Sub-7', 'Sub-9', 'Sub-11', 'Sub-13', 'Sub-15', 'Sub-17', 'Sub-20']
const proHeadline = (p) => [t(p.position || 'Funcionário'), p.org].filter(Boolean).join(' · ')
function staffStats(email) {
  const authored = Object.entries(state.reviews).map(([id, list]) => [id, list.filter((review) => review.authorEmail === email).length]).filter(([, n]) => n)
  return { tryouts: state.tryouts.filter((tryout) => tryout.createdBy === email).length, reviews: authored.reduce((sum, [, n]) => sum + n, 0), athletes: authored.length }
}
function staffProCard(p, { own = false, admin = false } = {}) {
  const s = staffStats(p.email)
  const exp = (p.experience || []).filter((e) => e.role || e.org)
  const creds = (p.credentials || []).filter(Boolean)
  const empty = (text) => '<p class="text-sm text-ink-soft">' + t(text) + '</p>'
  const period = (e) => e.start ? e.start + ' – ' + (e.end || t('atual')) : (e.end || '')
  const person = { name: p.name, photo: p.photo, demo: p.demo, id: p.email, group: 'staff' }
  return '<article class="pro-card surface rounded-card">' +
    '<header class="pro-head on-album">' + (own ? photoUploader(person) : personAvatar(person, 'avatar-xl pro-avatar')) +
    '<div class="min-w-0 flex-1"><h2 class="pro-name" id="pro-name">' + escapeHtml(p.name) + '</h2><p class="pro-headline">' + escapeHtml(proHeadline(p)) + '</p>' +
    '<p class="pro-meta">' + [p.team && escapeHtml(p.team), p.since && t('desde') + ' ' + escapeHtml(String(p.since)), p.city && escapeHtml(p.city + (p.state ? '/' + p.state : ''))].filter(Boolean).join(' · ') + '</p>' +
    (admin || p.demo ? '<p class="mt-2 flex flex-wrap gap-1.5">' + (admin ? adminTag() : '') + (p.demo ? '<span class="tag ghost">' + t('Perfil de exemplo') + '</span>' : '') + '</p>' : '') + '</div>' +
    (p.linkedin && LINKEDIN_RE.test(p.linkedin) ? '<a class="btn-secondary pro-link" href="' + escapeHtml(p.linkedin) + '" target="_blank" rel="noopener noreferrer">' + icon('globe', 'size-4') + ' LinkedIn<span class="sr-only"> (' + t('abre em outra aba') + ')</span></a>' : '') +
    '</header>' +
    '<dl class="pro-stats"><div><dt>' + t('Peneiras criadas') + '</dt><dd class="num">' + s.tryouts + '</dd></div><div><dt>' + t('Avaliações feitas') + '</dt><dd class="num">' + s.reviews + '</dd></div><div><dt>' + t('Atletas avaliados') + '</dt><dd class="num">' + s.athletes + '</dd></div></dl>' +
    '<div class="pro-body">' +
    '<section><h3>' + t('Sobre') + '</h3>' + (p.bio ? '<p class="pro-bio">' + escapeHtml(p.bio) + '</p>' : empty(own ? 'Conte aos atletas e às famílias o que você faz e o que observa numa peneira.' : 'Ainda não escreveu sobre o próprio trabalho.')) + '</section>' +
    '<section><h3>' + t('Avalia') + '</h3>' + ((p.specialties || []).length || (p.categories || []).length ? '<p class="flex flex-wrap gap-1.5">' + (p.specialties || []).map((pos) => posTag(pos)).join('') + (p.categories || []).map((c) => tag(c, true)).join('') + '</p>' : empty('Posições e categorias ainda não informadas.')) + '</section>' +
    '<section><h3>' + t('Experiência') + '</h3>' + (exp.length ? '<ol class="pro-timeline">' + exp.map((e) => '<li><strong>' + escapeHtml(e.role) + '</strong><span>' + escapeHtml(e.org) + '</span><small class="tabular">' + escapeHtml(period(e)) + '</small></li>').join('') + '</ol>' : empty('Nenhuma experiência informada.')) + '</section>' +
    '<section><h3>' + t('Formação e licenças') + '</h3>' + (creds.length ? '<ul class="pro-list">' + creds.map((c) => '<li>' + escapeHtml(c) + '</li>').join('') + '</ul>' : empty('Nenhum curso ou licença informado.')) + '</section>' +
    '</div>' + (own ? '<footer class="pro-foot"><button type="button" class="btn-primary" data-action="edit-pro">' + icon('edit', 'size-4') + ' ' + t('Editar perfil profissional') + '</button></footer>' : '') + '</article>'
}
// Qualquer [data-staff-profile="email"] abre o perfil profissional por cima do que estiver aberto.
function openStaffProfile(email) {
  const account = state.accounts.find((entry) => entry.email === email && entry.role === 'staff')
  if (!account?.profile) return toast(t('Perfil do profissional indisponível.'), 'error')
  const wrapper = document.createElement('div')
  wrapper.className = 'fixed inset-0 z-[95] grid place-items-center bg-black/75 p-4 backdrop-blur-md'
  wrapper.innerHTML = '<div class="pro-modal max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-card" role="dialog" aria-modal="true" aria-labelledby="pro-name" data-lenis-prevent>' +
    '<button type="button" class="icon-button pro-close" data-close aria-label="' + t('Fechar') + '">' + icon('close') + '</button>' +
    staffProCard({ ...account.profile, email: account.email }, { admin: !!account.admin }) + '</div>'
  document.body.appendChild(wrapper)
  wrapper.querySelector('[data-close]').addEventListener('click', () => wrapper.remove())
  wrapper.addEventListener('click', (event) => { if (event.target === wrapper) wrapper.remove() })
}
document.addEventListener('click', (event) => {
  const trigger = event.target.closest?.('[data-staff-profile]')
  if (trigger) openStaffProfile(trigger.dataset.staffProfile)
})
async function saveProProfile(fields) {
  if (remote.enabled) {
    const own = await fetchOwnProfile(state.user.uid)
    const error = await updateOwnProfile(state.user.uid, { name: own.profile.name, data: { ...(own.profile.data || {}), ...fields } })
    if (error) throw error
  }
  const account = state.accounts.find((entry) => entry.email === state.user.email)
  if (account) account.profile = Object.assign(account.profile || {}, fields)
  persist()
}
function openProEditor() {
  const account = state.accounts.find((entry) => entry.email === state.user.email)
  const p = account?.profile || {}
  const exp = [0, 1, 2].map((i) => (p.experience || [])[i] || {})
  const checks = (name, list, chosen, label) => '<fieldset class="sm:col-span-2"><legend class="field-label">' + t(label) + '</legend><div class="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">' +
    list.map((item) => '<label class="check-pill"><input type="checkbox" name="' + name + '" value="' + escapeHtml(item) + '"' + ((chosen || []).includes(item) ? ' checked' : '') + '/><span>' + escapeHtml(t(item)) + '</span></label>').join('') + '</div></fieldset>'
  const wrapper = document.createElement('div')
  wrapper.className = 'fixed inset-0 z-[95] grid place-items-center bg-black/75 p-4 backdrop-blur-md'
  wrapper.innerHTML = '<div class="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-card surface surface--raised p-6 shadow-2xl sm:p-8" role="dialog" aria-modal="true" aria-labelledby="pro-edit-title" data-lenis-prevent>' +
    '<div class="flex items-start justify-between gap-4"><div><h2 id="pro-edit-title" class="text-2xl font-bold">' + t('Perfil profissional') + '</h2><p class="mt-1 text-sm text-ink-soft">' + t('Atletas e famílias veem estas informações quando você organiza uma peneira ou avalia alguém.') + '</p></div><button type="button" class="icon-button" aria-label="' + t('Fechar') + '" data-close>' + icon('close') + '</button></div>' +
    '<form id="pro-form" class="mt-6 grid gap-4 sm:grid-cols-2" novalidate>' +
    input(t('Cargo'), 'pro-position', p.position || '', 'text', true) + input(t('Academia ou clube'), 'pro-org', p.org || 'Pelé Academia', 'text', true) +
    input(t('Área ou equipe (opcional)'), 'pro-team', p.team || '', 'text') + input(t('Na organização desde (ano)'), 'pro-since', p.since ? String(p.since) : '', 'number') +
    '<label class="field-label sm:col-span-2">' + t('Sobre (opcional)') + '<textarea id="pro-bio" class="field min-h-28" maxlength="600">' + escapeHtml(p.bio || '') + '</textarea></label>' +
    checks('pro-spec', POSITIONS, p.specialties, 'Posições que você avalia') + checks('pro-cat', CATEGORIES, p.categories, 'Categorias') +
    '<p class="form-group-title sm:col-span-2">' + t('Experiência') + '</p>' +
    exp.map((e, i) => '<div class="pro-exp-row sm:col-span-2">' + input(t('Cargo'), 'pro-exp-role-' + i, e.role || '', 'text') + input(t('Onde'), 'pro-exp-org-' + i, e.org || '', 'text') + input(t('Início (ano)'), 'pro-exp-start-' + i, e.start || '', 'number') + input(t('Fim (ano, vazio se atual)'), 'pro-exp-end-' + i, e.end || '', 'number') + '</div>').join('') +
    '<label class="field-label sm:col-span-2">' + t('Formação e licenças (uma por linha, opcional)') + '<textarea id="pro-creds" class="field min-h-20" maxlength="600">' + escapeHtml((p.credentials || []).join('\n')) + '</textarea></label>' +
    '<div class="sm:col-span-2">' + input(t('LinkedIn (opcional)'), 'pro-linkedin', p.linkedin || '', 'url') + '<p class="mt-1 text-xs text-ink-soft">' + t('Formato: https://www.linkedin.com/in/seu-nome') + '</p></div>' +
    '<p id="pro-feedback" class="hidden sm:col-span-2 rounded-2xl border px-4 py-3 text-sm" role="alert"></p>' +
    '<div class="sm:col-span-2 flex justify-end gap-2"><button type="button" class="btn-ghost" data-close>' + t('Cancelar') + '</button><button type="submit" class="btn-primary">' + t('Salvar perfil') + '</button></div></form></div>'
  document.body.appendChild(wrapper)
  wrapper.querySelectorAll('[data-close]').forEach((button) => button.addEventListener('click', () => wrapper.remove()))
  wrapper.querySelector('#pro-form').addEventListener('submit', async (event) => {
    event.preventDefault()
    const val = (id) => wrapper.querySelector('#' + id).value.trim()
    const year = (id) => { const v = val(id); return v === '' ? '' : /^\d{4}$/.test(v) && Number(v) >= 1950 && Number(v) <= new Date().getFullYear() ? v : null }
    const errors = []
    const check = (id, ok, message) => { setFieldError(id, ok ? '' : t(message)); if (!ok) errors.push(id) }
    check('pro-position', val('pro-position').length >= 2 && val('pro-position').length <= 60, 'Informe o cargo (2 a 60 caracteres).')
    check('pro-org', val('pro-org').length >= 2 && val('pro-org').length <= 80, 'Informe a academia ou o clube (2 a 80 caracteres).')
    check('pro-team', val('pro-team').length <= 80, 'Use até 80 caracteres.')
    check('pro-since', year('pro-since') !== null, 'Use um ano com 4 dígitos, até o ano atual.')
    check('pro-linkedin', !val('pro-linkedin') || LINKEDIN_RE.test(val('pro-linkedin')), 'Use o endereço do perfil: https://www.linkedin.com/in/seu-nome')
    const experience = [0, 1, 2].map((i) => {
      const e = { role: val('pro-exp-role-' + i).slice(0, 80), org: val('pro-exp-org-' + i).slice(0, 80), start: year('pro-exp-start-' + i), end: year('pro-exp-end-' + i) }
      check('pro-exp-start-' + i, e.start !== null, 'Use um ano com 4 dígitos, até o ano atual.')
      check('pro-exp-end-' + i, e.end !== null && !(e.end && e.start && e.end < e.start), 'O fim não pode ser antes do início.')
      return e
    }).filter((e) => e.role || e.org)
    if (errors.length) return wrapper.querySelector('#' + errors[0])?.focus()
    const fields = {
      position: val('pro-position'), org: val('pro-org'), team: val('pro-team'), since: val('pro-since') ? Number(val('pro-since')) : '',
      bio: val('pro-bio').slice(0, 600),
      specialties: [...wrapper.querySelectorAll('input[name="pro-spec"]:checked')].map((box) => box.value),
      categories: [...wrapper.querySelectorAll('input[name="pro-cat"]:checked')].map((box) => box.value),
      experience, credentials: val('pro-creds').split('\n').map((line) => line.trim().slice(0, 120)).filter(Boolean).slice(0, 5),
      linkedin: val('pro-linkedin'),
    }
    const submit = wrapper.querySelector('[type=submit]')
    submit.setAttribute('aria-busy', 'true')
    try { await saveProProfile(fields); wrapper.remove(); render(); toast(t('Perfil profissional salvo.')) } catch (error) { showFeedback('pro-feedback', describeError(error), true) } finally { submit.removeAttribute('aria-busy') }
  })
}

// ---------- Rodapé do site, Sobre (com a parceria) e Fale conosco ----------
// Referências: rodapé do GOV.UK Design System (navegação agrupada + links de política sempre visíveis) e o
// padrão "Contact a department or service team" (diga por onde e como a resposta chega; avise o que não enviar).
function siteFooter({ ink = false } = {}) {
  const logged = !!state.user
  const link = (href, text) => '<li><a href="' + href + '">' + t(text) + '</a></li>'
  return '<footer class="site-footer' + (ink ? ' is-ink' : ' on-album') + '"><div class="sf-wrap">' +
    '<div class="sf-brand">' + brandLockup(36) + '<p class="sf-tag">' + t('Peneiras da Pelé Academia para atletas de 7 a 20 anos, da Sub-7 à Sub-20, num lugar só.') + '</p>' +
    '<a class="sf-partner" href="#/sobre/parceria"><img src="./assets/brand/simbolo.jpg" width="36" height="36" decoding="async" alt="" /><strong>' + t('Em parceria com a Pelé Academia') + '</strong></a></div>' +
    '<nav class="sf-cols" aria-label="' + t('Rodapé') + '">' +
    '<div><h2>' + t('Plataforma') + '</h2><ul>' + link('#/sobre', 'Sobre a TIER ZERO') + link('#/sobre/parceria', 'A parceria') + (logged ? link('#/tryouts', 'Peneiras') : link('#/register', 'Criar conta de jogador')) + '</ul></div>' +
    '<div><h2>' + t('Ajuda') + '</h2><ul>' + link('#/contato', 'Fale conosco') + (logged ? link('#/messages', 'Conversas') : link('#/login', 'Entrar')) + '</ul></div>' +
    '<div><h2>' + t('Seus dados') + '</h2><ul>' + link('#/termos', 'Termos de uso') + link('#/privacidade', 'Política de privacidade') + link('#/contato', 'Pedidos sobre dados (LGPD)') + '</ul></div>' +
    '</nav></div>' +
    '<div class="sf-base sf-wrap"><p>© 2026 TIER ZERO · ' + t('Projeto acadêmico FIAP') + ' · ' + t('Versão') + ' ' + CONSENT_VERSION + '</p><a href="#/design-system">Design system</a></div></footer>'
}

// Página informativa: faixa de ouro com título (e a prancheta animada, se pedida) e o conteúdo embaixo.
function infoPage(title, lead, body, { board = false } = {}) {
  return '<main id="conteudo" tabindex="-1" class="legal info-page outline-none">' +
    '<header class="legal-hero on-album' + (board ? ' has-board' : '') + '">' + (board ? TACTIC_BOARD : '') + '<div class="legal-wrap"><div class="legal-top">' + brandLockup(32) +
    '<button type="button" class="btn-secondary text-sm" data-route="' + (state.user ? 'dashboard' : 'login') + '">' + icon('back', 'size-4') + ' ' + (state.user ? t('Voltar ao início') : t('Voltar ao login')) + '</button></div>' +
    '<h1 class="legal-title">' + t(title) + '</h1><p class="legal-lead">' + t(lead) + '</p></div></header>' +
    '<div class="legal-wrap info-body">' + body + '</div></main>' + siteFooter()
}

function aboutPage() {
  const step = (n, title, text) => '<li class="info-step"><span class="info-step-num tabular" aria-hidden="true">' + n + '</span><div><strong>' + t(title) + '</strong><p>' + t(text) + '</p></div></li>'
  const promise = ([name, title, text]) => '<div class="legal-card">' + icon(name, 'size-5') + '<strong>' + t(title) + '</strong><span>' + t(text) + '</span></div>'
  const role = (text) => '<li>' + icon('check', 'size-4 shrink-0') + '<span>' + t(text) + '</span></li>'
  return infoPage('Sobre a TIER ZERO', 'A plataforma de peneiras da Pelé Academia: atletas de 7 a 20 anos mostram o seu futebol, e a equipe da academia encontra, avalia e acompanha cada um.',
    '<section class="info-section"><h2>' + t('Como funciona') + '</h2><div class="info-flows">' +
    '<div class="info-flow"><h3>' + icon('user', 'size-5') + t('Para atletas e famílias') + '</h3><ol>' +
    step('01', 'Crie sua conta', 'Posição, perna dominante e cidade. Menores de 18 anos entram com a autorização de um responsável.') +
    step('02', 'Inscreva-se numa peneira', 'Antes de se inscrever, você vê se a peneira combina com a sua posição e a sua categoria.') +
    step('03', 'Ganhe a sua carta', 'Depois da peneira, a avaliação da equipe vira nota e atributos na sua carta, com a explicação de cada número.') + '</ol></div>' +
    '<div class="info-flow"><h3>' + icon('clipboard', 'size-5') + t('Para a equipe da academia') + '</h3><ol>' +
    step('01', 'Abra a peneira', 'Data, local, categoria, posições e vagas. Só atletas compatíveis conseguem se inscrever.') +
    step('02', 'Faça a chamada e dê a nota no campo', 'No dia, a peneira ao vivo marca quem chegou e registra uma nota rápida por característica.') +
    step('03', 'Acompanhe e converse', 'Banco de atletas com filtros, lista de observação e conversa direta com atletas e famílias.') + '</ol></div></div></section>' +
    '<section id="parceria" class="info-section info-partner" tabindex="-1">' +
    '<div class="partner-lockup" aria-hidden="true">' + brandLockup(40) + '<span class="partner-x">×</span><img src="./assets/brand/simbolo.jpg" width="56" height="56" decoding="async" alt="" /></div>' +
    '<h2>' + t('A parceria com a Pelé Academia') + '</h2>' +
    '<p class="info-lead">' + t('A TIER ZERO existe para as peneiras da Pelé Academia. A academia decide; a plataforma organiza. Cada lado tem um papel claro, e é isso que dá confiança para atletas e famílias.') + '</p>' +
    '<div class="partner-roles">' +
    '<div class="partner-role is-academy"><h3><img src="./assets/brand/simbolo.jpg" width="28" height="28" decoding="async" alt="" />' + t('O que a Pelé Academia faz') + '</h3><ul>' +
    role('Abre e conduz as peneiras: data, local, categorias, posições e vagas.') +
    role('Seus olheiros e treinadores avaliam os atletas e decidem quem segue no processo.') +
    role('Convida quem entra na equipe: nenhuma conta de funcionário é criada sem convite.') +
    role('É a responsável pelos dados das peneiras (controladora, na LGPD) e define o contato oficial para pedidos.') + '</ul></div>' +
    '<div class="partner-role is-platform"><h3>' + icon('shield', 'size-5') + t('O que a TIER ZERO faz') + '</h3><ul>' +
    role('Mantém o cadastro, as inscrições, a chamada, as avaliações e as conversas num lugar só.') +
    role('Mostra ao atleta, antes da inscrição, se a peneira combina com a posição e a categoria.') +
    role('Aplica as regras de quem vê o quê e a autorização do responsável para menores de 18 anos.') +
    role('Não escolhe atletas, não muda notas e não vende dados.') + '</ul></div></div>' +
    '<h3 class="info-sub">' + t('O que a parceria garante a você') + '</h3><div class="legal-cards">' + [
      ['calendar', 'Peneiras de verdade', 'Toda peneira foi aberta por alguém da equipe da academia, com nome e perfil profissional.'],
      ['user', 'Quem avalia tem nome', 'Cada avaliação mostra quem avaliou. O perfil traz cargo, vínculo e experiência.'],
      ['star', 'Nota explicada', 'A carta mostra de onde vem cada número: média das avaliações, característica por característica.'],
      ['users', 'Família por perto', 'Menores de 18 anos só se inscrevem com a autorização de um responsável, que pode revogá-la.'],
    ].map(promise).join('') + '</div>' +
    '<p class="info-note">' + icon('info', 'size-4 shrink-0') + '<span>' + t('Esta página não traz números, depoimentos nem a história da academia: só publicamos o que conseguimos confirmar.') + '</span></p></section>' +
    '<section class="info-section"><h2>' + t('Quem faz') + '</h2><p class="info-lead">' + t('A TIER ZERO é um projeto acadêmico da FIAP (2026), feito para a Pelé Academia. O código, as regras do banco e os testes ficam no repositório do projeto.') + '</p></section>' +
    '<section class="info-cta on-album"><h2>' + t(state.user ? 'Sua próxima peneira está a um clique.' : 'Pronto para a próxima peneira?') + '</h2><div class="flex flex-wrap gap-2">' +
    (state.user ? '<button type="button" class="btn-primary" data-route="tryouts">' + icon('calendar', 'size-4') + ' ' + t('Ver peneiras') + '</button>' : '<button type="button" class="btn-primary" data-route="register">' + t('Criar conta de jogador') + ' ' + icon('arrow', 'size-4') + '</button>') +
    '<button type="button" class="btn-secondary" data-route="contato">' + icon('mail', 'size-4') + ' ' + t('Fale conosco') + '</button></div></section>', { board: true })
}

const CONTACT_TOPICS = [['peneiras', 'Peneiras e inscrição'], ['cadastro', 'Cadastro e acesso'], ['dados', 'Meus dados (LGPD)'], ['parcerias', 'Parcerias e imprensa'], ['outro', 'Outro assunto']]
const topicLabel = (key) => t((CONTACT_TOPICS.find(([k]) => k === key) || [, 'Outro assunto'])[1])
function contactPage() {
  const me = state.user ? state.accounts.find((account) => account.email === state.user.email)?.profile : null
  const ways = [
    state.user ? ['message', 'Já tem conta?', 'Em Conversas você fala direto com olheiros e treinadores. É o caminho mais rápido.', '<button type="button" class="btn-secondary mt-3" data-route="messages">' + t('Abrir conversas') + '</button>'] : null,
    ['shield', 'Pedidos sobre seus dados', 'Para ver, corrigir, receber uma cópia ou excluir seus dados, escolha o assunto Meus dados (LGPD). A cópia também sai em Meu perfil.', ''],
    ['info', 'Esqueceu a senha?', 'Use Esqueci minha senha na tela de entrada: o link chega no seu e-mail.', ''],
  ].filter(Boolean)
  return infoPage('Fale conosco', 'Dúvidas sobre peneiras, cadastro, seus dados ou parcerias. A mensagem vai para a equipe da Pelé Academia.',
    '<div class="contact-grid"><section class="contact-form-wrap panel" aria-labelledby="contact-title"><h2 id="contact-title" class="section-title !mt-0">' + t('Escreva para a equipe') + '</h2>' +
    '<p class="mt-1 text-sm text-ink-soft">' + t('A resposta chega no e-mail que você informar.') + '</p>' +
    '<form id="contact-form" class="mt-5 grid gap-4 sm:grid-cols-2" novalidate>' +
    input(t('Nome'), 'contact-name', me?.name || '', 'text', true) + input(t('E-mail'), 'contact-email', state.user?.email || '', 'email', true) +
    '<label class="field-label sm:col-span-2">' + t('Assunto') + '<select id="contact-topic" class="field" required><option value="">' + t('Selecione…') + '</option>' + CONTACT_TOPICS.map(([key, label]) => '<option value="' + key + '">' + t(label) + '</option>').join('') + '</select></label>' +
    '<label class="field-label sm:col-span-2">' + t('Mensagem') + '<textarea id="contact-body" class="field min-h-36" maxlength="2000" required aria-describedby="contact-hint"></textarea></label>' +
    '<p id="contact-hint" class="sm:col-span-2 -mt-2 flex justify-between gap-3 text-xs text-ink-soft"><span>' + t('Não escreva CPF, senhas nem dados de saúde.') + '</span><span class="tabular" data-contact-count>0/2000</span></p>' +
    // Campo isca contra robôs: fica fora da tela e do Tab; pessoas não preenchem.
    '<div class="contact-trap" aria-hidden="true"><label>Site<input id="contact-site" tabindex="-1" autocomplete="off" /></label></div>' +
    '<p class="sm:col-span-2 text-xs leading-5 text-ink-soft">' + t('Usamos o nome e o e-mail só para responder esta mensagem.') + ' <a class="underline underline-offset-4" href="#/privacidade">' + t('Política de privacidade') + '</a></p>' +
    '<p id="contact-feedback" class="hidden sm:col-span-2 rounded-2xl border px-4 py-3 text-sm" role="alert"></p>' +
    '<div class="sm:col-span-2 flex justify-end"><button type="submit" class="btn-primary">' + icon('send', 'size-4') + ' ' + t('Enviar mensagem') + '</button></div></form></section>' +
    '<aside class="contact-ways" aria-label="' + t('Outros caminhos') + '">' + ways.map(([name, title, text, extra]) => '<div class="contact-way">' + icon(name, 'size-5') + '<div><strong>' + t(title) + '</strong><p>' + t(text) + '</p>' + extra + '</div></div>').join('') +
    (remote.enabled ? '' : '<p class="contact-local">' + t('Modo local: a mensagem fica só neste navegador. A equipe vê ao entrar neste mesmo navegador.') + '</p>') + '</aside></div>')
}
function bindContactForm() {
  const form = document.querySelector('#contact-form')
  if (!form) return
  const body = form.querySelector('#contact-body')
  body.addEventListener('input', () => { form.querySelector('[data-contact-count]').textContent = body.value.length + '/2000' })
  form.addEventListener('submit', async (event) => {
    event.preventDefault()
    const val = (id) => form.querySelector('#' + id).value.trim()
    if (val('contact-site')) return // robô preencheu a isca
    const message = { name: val('contact-name'), email: val('contact-email').toLowerCase(), topic: val('contact-topic'), body: val('contact-body') }
    const errors = []
    const check = (id, ok, text) => { setFieldError(id, ok ? '' : t(text)); if (!ok) errors.push(id) }
    check('contact-name', message.name.length >= 2 && message.name.length <= 120, 'Informe seu nome.')
    check('contact-email', /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(message.email) && message.email.length <= 254, 'Informe um e-mail válido.')
    check('contact-topic', CONTACT_TOPICS.some(([key]) => key === message.topic), 'Escolha um assunto.')
    check('contact-body', message.body.length >= 10, 'Escreva pelo menos 10 caracteres.')
    if (errors.length) return form.querySelector('#' + errors[0])?.focus()
    const submit = form.querySelector('[type=submit]')
    submit.setAttribute('aria-busy', 'true')
    try {
      if (remote.enabled) {
        const error = await sendContactMessage(message)
        if (error) throw error
      } else {
        state.contacts.unshift({ id: Date.now(), ...message, createdAt: new Date().toISOString(), handledAt: null })
        state.accounts.filter((account) => account.role === 'staff').forEach((account) => notify(account.email, 'Fale conosco', message.name + ': ' + topicLabel(message.topic)))
        persist()
      }
      const wrap = form.closest('.contact-form-wrap')
      wrap.innerHTML = '<div class="contact-done" role="status"><span class="contact-done-icon">' + icon('check', 'size-7') + '</span><h2 class="section-title !mt-0">' + t('Mensagem enviada') + '</h2>' +
        '<p class="text-ink-soft">' + t('A equipe da Pelé Academia responde pelo e-mail') + ' <strong class="text-chalk">' + escapeHtml(message.email) + '</strong>.</p>' +
        '<button type="button" class="btn-secondary" data-route="contato">' + t('Enviar outra mensagem') + '</button></div>'
      wrap.querySelector('[data-route]').addEventListener('click', () => render())
      wrap.querySelector('.contact-done').focus?.()
    } catch (error) {
      showFeedback('contact-feedback', describeError(error), true)
    } finally { submit.removeAttribute('aria-busy') }
  })
}

// Caixa do Fale conosco no início da equipe: mensagens em aberto, responder por e-mail e marcar como respondida.
async function refreshRemoteContacts() {
  try {
    state.contacts = (await fetchContactMessages()).map((row) => ({ id: row.id, name: row.name, email: row.email, topic: row.topic, body: row.body, createdAt: row.created_at, handledAt: row.handled_at }))
  } catch (error) {
    console.warn('[Supabase] não foi possível carregar o Fale conosco:', error) // antes da migration, a caixa só fica vazia
  }
}
function contactInbox() {
  const open = state.contacts.filter((item) => !item.handledAt)
  const done = state.contacts.length - open.length
  const when = (iso) => new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' ' + new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return '<section class="reveal mt-8 panel"><div class="flex flex-wrap items-end justify-between gap-3"><div><h2 class="section-title !mt-0">' + t('Fale conosco') + ' <span class="tab-count">' + open.length + '</span></h2>' +
    '<p class="mt-1 text-sm text-ink-soft">' + (open.length ? t('Mensagens do site esperando resposta.') : t('Nenhuma mensagem esperando resposta.')) + (done ? ' ' + plural(done, 'já respondida', 'já respondidas') + '.' : '') + '</p></div></div>' +
    (open.length ? '<ul class="inbox">' + open.slice(0, 5).map((item) => '<li class="inbox-item"><div class="flex flex-wrap items-center gap-2">' + tag(topicLabel(item.topic), true) + '<strong>' + escapeHtml(item.name) + '</strong><span class="text-xs text-ink-soft tabular">' + escapeHtml(when(item.createdAt)) + '</span></div>' +
      '<p class="inbox-body">' + escapeHtml(item.body) + '</p><div class="flex flex-wrap gap-2">' +
      '<a class="btn-secondary text-sm" href="mailto:' + encodeURIComponent(item.email).replace('%40', '@') + '?subject=' + encodeURIComponent('TIER ZERO · ' + topicLabel(item.topic)) + '">' + icon('mail', 'size-4') + ' ' + t('Responder por e-mail') + '<span class="sr-only"> ' + escapeHtml(item.email) + '</span></a>' +
      '<button type="button" class="btn-ghost text-sm" data-contact-done="' + item.id + '">' + icon('check', 'size-4') + ' ' + t('Marcar como respondida') + '</button></div></li>').join('') + '</ul>' : '') + '</section>'
}
document.addEventListener('click', async (event) => {
  const button = event.target.closest?.('[data-contact-done]')
  if (!button) return
  const item = state.contacts.find((entry) => String(entry.id) === button.dataset.contactDone)
  if (!item) return
  button.setAttribute('aria-busy', 'true')
  if (remote.enabled) {
    const error = await markContactHandled(item.id, state.user.uid)
    if (error) { button.removeAttribute('aria-busy'); return toast(describeError(error), 'error') }
  }
  item.handledAt = new Date().toISOString()
  persist()
  render()
  toast(t('Mensagem marcada como respondida.'))
})

function teamProfilePanel() {
  return '<div class="panel flex flex-wrap items-center gap-4"><span class="venue-pin" aria-hidden="true">' + icon('users', 'size-5') + '</span><div class="min-w-0 flex-1"><h2 class="section-title !mt-0">' + t('Equipe') + '</h2>' +
    (isAdmin()
      ? '<p class="mt-1 text-sm text-ink-soft">' + t('Você é administrador: convide funcionários e decida quem gerencia a equipe.') + '</p></div><button type="button" class="btn-primary" data-route="team">' + t('Gerenciar equipe') + ' ' + icon('arrow', 'size-4') + '</button>'
      : '<p class="mt-1 text-sm text-ink-soft">' + t('Novos funcionários entram por convite de um administrador da equipe.') + '</p></div>') + '</div>'
}

function teamPage() {
  const head = '<div class="page-head"><div><h1 class="page-title">' + t('Equipe') + '</h1><p class="page-subtitle">' + t('Convide funcionários e decida quem é administrador. Contas de funcionário só são criadas por convite.') + '</p></div>' +
    '<button type="button" class="btn-primary" data-action="invite-staff">' + icon('plus', 'size-4') + ' ' + t('Convidar funcionário') + '</button></div>'
  const data = teamData()
  if (!data) {
    if (teamStatus === 'error') return shell(head + '<div class="empty-state mt-6"><strong>' + t('Não foi possível carregar a equipe') + '</strong><button type="button" class="btn-secondary mt-2" data-action="retry-team">' + t('Tentar de novo') + '</button></div>', { active: 'team', role: 'staff' })
    if (teamStatus !== 'loading') {
      teamStatus = 'loading'
      loadTeam().then(() => { teamStatus = null }, (error) => { console.warn('[Supabase] equipe:', error); teamStatus = 'error' }).then(() => { if (currentRoute() === 'team') render() })
    }
    return shell(head + '<div class="mt-10">' + ballLoader(t('Carregando a equipe…')) + '</div>', { active: 'team', role: 'staff' })
  }
  const members = data.staff.slice().sort((a, b) => Number(b.active) - Number(a.active) || Number(b.admin) - Number(a.admin) || a.name.localeCompare(b.name, 'pt'))
  const pending = data.invites.filter((invite) => inviteStatus(invite) === 'valid')
  const others = data.invites.filter((invite) => inviteStatus(invite) !== 'valid').slice(0, 6)
  const html = shell(head +
    '<section class="team-grid mt-6">' +
    '<div class="panel"><h2 class="section-title !mt-0">' + t('Funcionários') + ' <span class="tab-count">' + members.filter((member) => member.active).length + '</span></h2>' +
    '<ul class="team-list mt-3">' + members.map(memberRow).join('') + '</ul></div>' +
    '<div class="grid gap-5">' +
    '<div class="panel"><h2 class="section-title !mt-0">' + t('Convites') + (pending.length ? ' <span class="tab-count">' + pending.length + '</span>' : '') + '</h2>' +
    (data.invites.length
      ? '<ul class="team-list mt-3">' + pending.concat(others).map(inviteRow).join('') + '</ul>'
      : '<div class="empty-state mt-4">' + icon('mail', 'size-6 text-brand') + '<strong>' + t('Nenhum convite ainda') + '</strong><span class="text-sm">' + t('O link vale por 7 dias e só funciona para o e-mail convidado.') + '</span></div>') + '</div>' +
    '<div class="panel"><h2 class="section-title !mt-0">' + t('Histórico') + '</h2>' +
    (data.log.length
      ? '<ol class="audit-list mt-3">' + data.log.map(auditLine).join('') + '</ol>'
      : '<p class="mt-3 text-sm text-ink-soft">' + t('Convites e mudanças de acesso aparecem aqui, com quem fez e quando.') + '</p>') + '</div>' +
    '</div></section>', { active: 'team', role: 'staff' })
  justInvited = null
  return html
}

function memberRow(member) {
  const me = member.email === state.user?.email
  const name = escapeHtml(member.name)
  return '<li class="team-row' + (member.active ? '' : ' is-inactive') + '" data-member-row="' + escapeHtml(member.email) + '">' +
    personAvatar({ name: member.name, photo: member.photo, demo: member.demo, id: member.email, group: 'staff' }) +
    '<div class="min-w-0 flex-1"><p class="truncate font-semibold">' + name + (me ? ' <span class="text-xs font-normal text-ink-soft">(' + t('você') + ')</span>' : '') + '</p>' +
    '<p class="truncate text-xs text-ink-soft">' + (member.position ? escapeHtml(member.position) + ' · ' : '') + escapeHtml(member.email) + '</p>' +
    (member.admin || !member.active ? '<p class="mt-1.5 flex flex-wrap gap-1.5">' + (member.admin ? adminTag() : '') + (member.active ? '' : '<span class="tag">' + t('Desativado') + '</span>') + '</p>' : '') + '</div>' +
    (me ? '' : '<div class="team-actions">' +
      (member.active ? '<button type="button" class="btn-ghost" data-member-admin="' + escapeHtml(member.email) + '">' + (member.admin ? t('Remover administrador') : t('Tornar administrador')) + '</button>' : '') +
      '<button type="button" class="btn-ghost' + (member.active ? ' text-danger' : '') + '" data-member-active="' + escapeHtml(member.email) + '">' + (member.active ? t('Desativar') : t('Reativar')) + '</button></div>') +
    '</li>'
}

function inviteRow(invite) {
  const status = inviteStatus(invite)
  const daysLeft = Math.floor((Date.parse(invite.expiresAt) - Date.now()) / 864e5)
  const line = {
    valid: (invite.createdBy ? t('Convidado por') + ' ' + escapeHtml(invite.createdBy) + ' · ' : '') + (daysLeft >= 1 ? t('vence em') + ' ' + plural(daysLeft, t('dia'), t('dias')) : t('vence hoje')) + ' (' + fmtWhen(invite.expiresAt) + ')',
    used: t('Aceito') + (invite.usedBy ? ' ' + t('por') + ' ' + escapeHtml(invite.usedBy) : '') + ' ' + t('em') + ' ' + fmtWhen(invite.usedAt),
    revoked: t('Cancelado em') + ' ' + fmtWhen(invite.revokedAt),
    expired: t('Venceu em') + ' ' + fmtWhen(invite.expiresAt),
  }[status]
  const chip = { valid: '<span class="tag warn">' + t('Pendente') + '</span>', used: '<span class="tag green">' + t('Aceito') + '</span>', revoked: '<span class="tag ghost">' + t('Cancelado') + '</span>', expired: '<span class="tag ghost">' + t('Vencido') + '</span>' }[status]
  return '<li class="team-row' + (status === 'valid' ? '' : ' is-muted') + (invite.id === justInvited ? ' is-new' : '') + '" data-invite-row="' + invite.id + '">' +
    '<span class="invite-icon" aria-hidden="true">' + icon('mail', 'size-4') + '</span>' +
    '<div class="min-w-0 flex-1"><p class="flex flex-wrap items-center gap-1.5"><span class="truncate font-semibold">' + escapeHtml(invite.email) + '</span>' + chip + (invite.admin ? adminTag() : '') + '</p>' +
    '<p class="mt-0.5 text-xs text-ink-soft">' + line + '</p></div>' +
    (status === 'valid' || status === 'expired' ? '<div class="team-actions">' +
      '<button type="button" class="btn-ghost" data-reinvite="' + invite.id + '">' + t('Gerar novo link') + '</button>' +
      (status === 'valid' ? '<button type="button" class="btn-ghost text-danger" data-revoke-invite="' + invite.id + '">' + t('Cancelar') + '</button>' : '') + '</div>' : '') +
    '</li>'
}

function auditLine(entry) {
  const who = escapeHtml(entry.details.email || '')
  let text
  if (entry.entity === 'staff_invite') {
    text = { create: t('convidou') + ' ' + who + (entry.details.is_admin ? ' ' + t('como administrador') : ''), revoke: t('cancelou o convite de') + ' ' + who, accept: t('aceitou o convite e entrou na equipe') }[entry.action] || escapeHtml(entry.action)
  } else if (entry.action === 'deactivate') text = t('desativou') + ' ' + who
  else if (entry.action === 'reactivate') text = t('reativou') + ' ' + who
  else if (entry.details.is_admin) text = (entry.details.is_admin.para ? t('deu acesso de administrador a') : t('removeu o acesso de administrador de')) + ' ' + who
  else text = t('alterou') + ' ' + who
  return '<li><time class="tabular text-xs text-ink-soft" datetime="' + escapeHtml(entry.at) + '">' + fmtWhen(entry.at) + '</time><span><strong>' + escapeHtml(entry.actor || t('Alguém')) + '</strong> ' + text + '</span></li>'
}

function openInviteModal(presetEmail = '', presetAdmin = false) {
  if (!isAdmin()) return toast(t('Só administradores podem fazer isso.'), 'error')
  const wrapper = document.createElement('div')
  wrapper.className = 'fixed inset-0 z-[95] grid place-items-center bg-black/75 p-4 backdrop-blur-md'
  wrapper.innerHTML =
    '<div class="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-card surface surface--raised p-6 shadow-2xl sm:p-8" role="dialog" aria-modal="true" aria-labelledby="invite-title" data-lenis-prevent>' +
    '<div class="flex items-start justify-between gap-4"><div><h2 id="invite-title" class="text-2xl font-bold">' + t('Convidar funcionário') + '</h2><p class="mt-1 text-sm text-ink-soft">' + t('Você recebe um link para enviar. Ele só funciona para este e-mail e vence em 7 dias.') + '</p></div><button type="button" class="icon-button" aria-label="' + t('Fechar') + '" data-close>' + icon('close') + '</button></div>' +
    '<form id="invite-form" class="mt-6 grid gap-4" novalidate>' + input(t('E-mail do funcionário'), 'invite-email', presetEmail, 'email', true) +
    (presetEmail ? '<p class="fit-line fit-no !mt-0">' + icon('info', 'size-4 shrink-0') + t('Um link novo substitui o anterior, que deixa de funcionar.') + '</p>' : '') +
    '<label class="check-row"><input type="checkbox" id="invite-admin"' + (presetAdmin ? ' checked' : '') + '/><span><strong>' + t('Acesso de administrador') + '</strong><small>' + t('Também pode convidar, desativar funcionários e dar acesso de administrador.') + '</small></span></label>' +
    '<div class="flex justify-end gap-2"><button type="button" class="btn-secondary" data-close>' + t('Cancelar') + '</button><button class="btn-primary" type="submit">' + t('Gerar convite') + ' ' + icon('arrow', 'size-4') + '</button></div></form></div>'
  document.body.appendChild(wrapper)
  const dialog = wrapper.querySelector('[role="dialog"]')
  const close = () => wrapper.remove()
  wrapper.addEventListener('click', (event) => { if (event.target.closest('[data-close]')) close() })
  const form = wrapper.querySelector('#invite-form')
  form.addEventListener('input', () => setFieldError('invite-email', ''))
  form.addEventListener('submit', async (event) => {
    event.preventDefault()
    const email = normalizeEmail(form.querySelector('#invite-email').value)
    const admin = form.querySelector('#invite-admin').checked
    const known = (teamData()?.staff || []).map((member) => member.email).concat(state.accounts.map((account) => account.email))
    const problem = !EMAIL_RE.test(email) ? t('Informe um e-mail válido.') : known.includes(email) ? t('Este e-mail já tem uma conta na plataforma.') : ''
    if (problem) {
      setFieldError('invite-email', problem)
      return form.querySelector('#invite-email').focus()
    }
    const submit = form.querySelector('[type="submit"]')
    submit.setAttribute('aria-busy', 'true')
    const result = await inviteStaff(email, admin)
    if (result.error) {
      submit.removeAttribute('aria-busy')
      setFieldError('invite-email', result.error)
      return form.querySelector('#invite-email').focus()
    }
    const link = inviteLink(result.code)
    const until = fmtWhen(result.expiresAt)
    const mail = 'mailto:' + encodeURIComponent(email) + '?subject=' + encodeURIComponent(t('Convite para a equipe TIER ZERO · Pelé Academia')) +
      '&body=' + encodeURIComponent(t('Olá! Você foi convidado para a equipe de funcionários da plataforma. Crie sua conta por este link:') + '\n\n' + link + '\n\n' + t('O link vale até') + ' ' + until + ' ' + t('e só funciona para este e-mail.'))
    // Mesmo modal, segundo passo: o link aparece uma vez só (o servidor guarda apenas o hash).
    dialog.innerHTML =
      '<div class="invite-done"><span class="invite-done-icon" aria-hidden="true">' + icon('check', 'size-6') + '</span>' +
      '<h2 id="invite-title" class="mt-4 text-2xl font-bold">' + t('Convite criado') + '</h2>' +
      '<p class="mt-2 text-sm text-ink-soft">' + t('Envie este link para') + ' <strong class="text-chalk">' + escapeHtml(email) + '</strong>' + (admin ? ' (' + t('administrador') + ')' : '') + '. ' + t('Ele vale até') + ' ' + until + '.</p>' +
      '<div class="invite-link mt-5"><input id="invite-link" class="field" readonly value="' + escapeHtml(link) + '" aria-label="' + t('Link do convite') + '"/><button type="button" class="btn-primary" data-copy-invite>' + icon('copy', 'size-4') + ' <span>' + t('Copiar link') + '</span></button></div>' +
      '<p class="fit-line fit-no">' + icon('info', 'size-4 shrink-0') + t('Por segurança, o link aparece só agora. Se perder, gere um novo: o anterior deixa de funcionar.') + '</p>' +
      '<div class="mt-6 flex flex-wrap justify-end gap-2"><a class="btn-secondary" href="' + escapeHtml(mail) + '">' + icon('mail', 'size-4') + ' ' + t('Enviar por e-mail') + '</a><button type="button" class="btn-primary" data-close>' + t('Concluir') + '</button></div></div>'
    const copy = dialog.querySelector('[data-copy-invite]')
    copy.focus()
    copy.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(link)
        copy.querySelector('span').textContent = t('Copiado')
        copy.classList.remove('is-copied')
        void copy.offsetWidth
        copy.classList.add('is-copied')
      } catch {
        dialog.querySelector('#invite-link').select()
        toast(t('Não deu para copiar sozinho: o link está selecionado, use Ctrl+C.'), 'error')
      }
    })
    justInvited = result.id
    // A lista atrás do modal é atualizada quando ele fechar (botão, Esc ou clique fora).
    const watch = new MutationObserver(() => {
      if (wrapper.isConnected) return
      watch.disconnect()
      if (currentRoute() === 'team') refreshTeam()
    })
    watch.observe(document.body, { childList: true })
  })
}

function confirmRevokeInvite(id) {
  const invite = teamData()?.invites.find((item) => item.id === id)
  if (!invite) return
  confirmDialog({
    title: t('Cancelar o convite de') + ' ' + invite.email + '?',
    message: t('O link deixa de funcionar na hora. Você pode convidar de novo depois.'),
    confirmLabel: t('Cancelar convite'),
    onConfirm: async () => {
      const error = await revokeInvite(id)
      if (error) return toast(error, 'error')
      document.querySelector('[data-invite-row="' + id + '"]')?.classList.add('is-muted')
      toast(t('Convite cancelado.'))
      setTimeout(refreshTeam, 420)
    },
  })
}

function confirmMemberChange(button) {
  const email = button.dataset.memberAdmin || button.dataset.memberActive
  const member = teamData()?.staff.find((item) => item.email === email)
  if (!member) return
  const toggleAdmin = 'memberAdmin' in button.dataset
  const active = toggleAdmin ? member.active : !member.active
  // Desativar também tira o acesso de administrador: quem volta, volta como funcionário comum.
  const admin = toggleAdmin ? !member.admin : active && member.admin
  const apply = async () => {
    const error = await saveMember(member, active, admin)
    if (error) return toast(error, 'error')
    if (!toggleAdmin) document.querySelector('[data-member-row="' + CSS.escape(email) + '"]')?.classList.toggle('is-inactive', !active)
    toast(toggleAdmin ? (admin ? member.name + ' ' + t('agora é administrador.') : member.name + ' ' + t('não é mais administrador.')) : (active ? member.name + ' ' + t('foi reativado.') : member.name + ' ' + t('foi desativado.')))
    setTimeout(refreshTeam, toggleAdmin ? 0 : 420)
  }
  if (!toggleAdmin && active) return apply()
  confirmDialog({
    title: toggleAdmin ? (admin ? t('Dar acesso de administrador a') + ' ' + member.name + '?' : t('Remover o acesso de administrador de') + ' ' + member.name + '?') : t('Desativar') + ' ' + member.name + '?',
    message: toggleAdmin
      ? (admin ? member.name + ' ' + t('poderá convidar, desativar funcionários e mudar acessos, inclusive o seu.') : member.name + ' ' + t('continua como funcionário, mas não gerencia mais a equipe.'))
      : member.name + ' ' + t('não consegue mais entrar como funcionário. As avaliações e peneiras que criou continuam. Você pode reativar depois.') + (member.admin ? ' ' + t('O acesso de administrador é removido.') : ''),
    confirmLabel: toggleAdmin ? (admin ? t('Dar acesso') : t('Remover acesso')) : t('Desativar conta'),
    onConfirm: apply,
  })
}

// ---------- aceitar convite (#/convite/<código>) ----------
function invitePage() {
  return '<main id="conteudo" tabindex="-1" class="outline-none grid min-h-screen place-items-center bg-night px-4 py-8 text-chalk"><div class="w-full max-w-lg rounded-card surface surface--raised p-6 sm:p-10">' +
    '<div class="mb-6">' + brandLockup(32, false) + '</div><div data-invite-root aria-live="polite">' + ballLoader(t('Conferindo o convite…')) + '</div></div></main>'
}

const INVITE_PROBLEMS = {
  used: ['Este convite já foi usado', 'Se a conta é sua, entre com o e-mail e a senha na aba Funcionário.'],
  revoked: ['Este convite foi cancelado', 'Peça um link novo a quem convidou você.'],
  expired: ['Este convite venceu', 'Os convites valem por 7 dias. Peça um link novo a quem convidou você.'],
  missing: ['Link de convite inválido', 'Confira se você abriu o endereço inteiro, do jeito que recebeu.'],
}
function inviteProblem(status) {
  const [title, text] = INVITE_PROBLEMS[status] || INVITE_PROBLEMS.missing
  return '<div class="empty-state">' + icon('info', 'size-6 text-brand') + '<strong>' + t(title) + '</strong><span class="text-sm">' + t(text) + '</span><button type="button" class="btn-secondary mt-2" data-invite-login>' + t('Ir para o login') + '</button></div>'
}

async function findInvite(code) {
  if (remote.enabled) {
    const row = await checkStaffInvite(code)
    return row && { email: row.email, status: row.status, expiresAt: row.expires_at, admin: row.is_admin, invitedBy: row.invited_by }
  }
  const hash = await sha256Hex(code)
  const invite = state.invites.find((item) => item.codeHash === hash)
  return invite && { local: invite, email: invite.email, status: inviteStatus(invite), expiresAt: invite.expiresAt, admin: invite.admin, invitedBy: state.accounts.find((account) => account.email === invite.createdBy)?.profile?.name || '' }
}

async function loadInvitePage(code) {
  const root = document.querySelector('[data-invite-root]')
  let invite = null
  try { invite = /^[0-9a-f]{64}$/.test(code) ? await findInvite(code) : null } catch (error) { console.warn('[convite]', error) }
  if (!root.isConnected) return
  root.addEventListener('click', (event) => { if (event.target.closest('[data-invite-login]')) go('login') })
  if (!invite || invite.status !== 'valid') {
    root.innerHTML = inviteProblem(invite?.status)
    return
  }
  root.innerHTML = '<h1 class="text-3xl font-bold">' + t('Crie sua conta de funcionário') + '</h1>' +
    '<p class="mt-3 text-sm leading-6 text-ink-soft">' + (invite.invitedBy ? escapeHtml(invite.invitedBy) + ' ' + t('convidou você') : t('Você foi convidado')) + ' ' + t('para entrar como funcionário') + (invite.admin ? ' (' + t('administrador') + ')' : '') + '. ' + t('O convite vale até') + ' ' + fmtWhen(invite.expiresAt) + '.</p>' +
    '<form id="invite-accept-form" class="mt-6 grid gap-4" novalidate>' +
    input(t('Nome completo'), 'inv-name', '', 'text', true) + input(t('Cargo'), 'inv-position', '', 'text', true) +
    input(t('E-mail'), 'inv-email', invite.email, 'email', true, false, true) +
    input(t('Senha'), 'inv-password', '', 'password', true) + input(t('Confirmar senha'), 'inv-confirm', '', 'password', true) +
    '<p id="inv-feedback" class="hidden rounded-2xl border px-4 py-3 text-sm" role="alert"></p>' +
    '<button class="btn-primary w-full" type="submit">' + t('Criar conta de funcionário') + ' ' + icon('check', 'size-4') + '</button></form>'
  root.querySelector('#inv-position').placeholder = t('Ex.: Treinador, Olheira, Preparador físico')
  root.querySelector('#inv-name').focus()
  const form = root.querySelector('#invite-accept-form')
  form.addEventListener('input', (event) => { if (event.target.id) setFieldError(event.target.id, '') })
  form.addEventListener('submit', (event) => {
    event.preventDefault()
    safely(acceptInvite(code, invite, form))
  })
}

async function acceptInvite(code, invite, form) {
  const value = (id) => form.querySelector('#' + id).value.trim()
  const name = value('inv-name')
  const position = value('inv-position')
  const password = form.querySelector('#inv-password').value
  const errors = [
    ['inv-name', name.length < 3 ? t('Informe o nome completo.') : ''],
    ['inv-position', position.length < 2 || position.length > 60 ? t('Informe o cargo (até 60 caracteres).') : ''],
    ['inv-password', password.length < 6 ? t('Use pelo menos 6 caracteres.') : ''],
    ['inv-confirm', form.querySelector('#inv-confirm').value !== password ? t('As senhas não coincidem.') : ''],
  ]
  errors.forEach(([id, message]) => setFieldError(id, message))
  const first = errors.find(([, message]) => message)
  if (first) return form.querySelector('#' + first[0]).focus()
  const submit = form.querySelector('[type="submit"]')
  submit.setAttribute('aria-busy', 'true')

  if (remote.enabled) {
    const result = await remoteSignUp({ email: invite.email, password, name, publicData: { position }, invite: code })
    if (result.error) {
      submit.removeAttribute('aria-busy')
      // O servidor recusa o convite sem dizer o motivo na criação da conta: confere de novo para explicar.
      const again = await findInvite(code).catch(() => null)
      return showFeedback('inv-feedback', again && again.status !== 'valid' ? t(INVITE_PROBLEMS[again.status][0]) + '. ' + t(INVITE_PROBLEMS[again.status][1]) : describeError(result.error), true)
    }
    if (!result.session) {
      form.closest('[data-invite-root]').innerHTML = '<div class="empty-state">' + icon('mail', 'size-6 text-brand') + '<strong>' + t('Conta criada! Falta confirmar o e-mail') + '</strong><span class="text-sm">' + t('Abra o link que enviamos para') + ' ' + escapeHtml(invite.email) + ' ' + t('e depois entre na aba Funcionário.') + '</span><button type="button" class="btn-secondary mt-2" data-invite-login>' + t('Ir para o login') + '</button></div>'
      return
    }
    await hydrateRemote(result.session.user.id)
  } else {
    const current = await findInvite(code)
    if (!current || current.status !== 'valid') {
      submit.removeAttribute('aria-busy')
      return showFeedback('inv-feedback', t(INVITE_PROBLEMS[current?.status || 'missing'][0]) + '.', true)
    }
    if (state.accounts.some((account) => account.email === invite.email)) {
      submit.removeAttribute('aria-busy')
      return showFeedback('inv-feedback', t('Este e-mail já tem uma conta na plataforma.'), true)
    }
    state.accounts.push({ email: invite.email, password, role: 'staff', admin: !!current.admin, active: true, profile: { name, email: invite.email, position } })
    current.local.usedAt = new Date().toISOString()
    current.local.usedBy = invite.email
    state.user = { name, email: invite.email, role: 'staff' }
    state.profile = null
    logChange('accept', 'staff_invite', current.local.id, { email: invite.email, is_admin: !!current.admin })
    notify(current.local.createdBy, 'Convite aceito', name + ' entrou na equipe.')
  }
  persist()
  go('dashboard')
  toast(t('Conta de funcionário criada. Boas-vindas à equipe!'))
}

// =====================================================================================
// Menores de 18 anos: responsável legal e autorização
// Referências: LGPD art. 14 (dados de crianças e adolescentes; § 1º: consentimento "específico e em
// destaque" de um dos pais ou do responsável, para crianças; § 6º: informação simples e clara) e
// ECA art. 2º (criança até 12 anos incompletos). A plataforma aplica a autorização até os 18 anos.
// Quem garante a regra é o banco (migration 20261023120000_responsavel.sql).
// =====================================================================================
const CONSENT_VERSION = '2026-10'
const RELATIONSHIPS = [['mae', 'Mãe'], ['pai', 'Pai'], ['avo', 'Avó ou avô'], ['tutor', 'Tutor(a) legal'], ['outro', 'Outro responsável legal']]
const relationshipLabel = (value) => t((RELATIONSHIPS.find(([code]) => code === value) || [, 'Responsável'])[1])
const isMinorBirth = (birth) => validBirthDate(birth || '') && getAgeFromBirth(birth) < 18
const guardianConsented = (guardian) => !!guardian?.consentAt
const myGuardian = () => remote.enabled ? state.guardians[state.user?.uid] : state.profile?.guardian
const needsGuardianMe = () => state.user?.role === 'player' && isMinorBirth(state.profile?.birth) && !guardianConsented(myGuardian())
function guardianFor(athlete) {
  if (remote.enabled) return state.guardians[athlete.profileId]
  return state.accounts.find((account) => account.role === 'player' && account.athleteId === athlete.id)?.profile?.guardian
}
const localGuardian = (g) => ({ name: g.name, relationship: g.relationship, email: g.email, phone: g.phone, consentAt: new Date().toISOString(), consentVersion: CONSENT_VERSION, revokedAt: null })
const mapRemoteGuardian = (row) => ({ name: row.name, relationship: row.relationship, email: row.email, phone: row.phone, consentAt: row.consent_at, consentVersion: row.consent_version, revokedAt: row.revoked_at })

async function refreshRemoteGuardians() {
  if (!remote.enabled) return
  try {
    state.guardians = Object.fromEntries((await fetchGuardians()).map((row) => [row.athlete_id, mapRemoteGuardian(row)]))
  } catch (error) {
    // Antes da migration de responsável a tabela não existe: o resto do site continua.
    console.warn('[Supabase] não foi possível carregar responsáveis:', error)
  }
}

function readGuardianForm(prefix) {
  const v = (id) => (document.getElementById(prefix + id)?.value || '').trim()
  return { name: v('name'), relationship: v('relation'), email: normalizeEmail(v('email')), phone: v('phone'), consent: !!document.getElementById(prefix + 'consent')?.checked }
}

function guardianErrors(name, relationship, email, phone, consent, prefix = '') {
  return [
    [prefix + 'name', String(name).trim().length < 3 ? t('Informe o nome completo do responsável.') : ''],
    [prefix + 'relation', relationship ? '' : t('Selecione o parentesco.')],
    [prefix + 'email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? '' : t('Informe um e-mail válido do responsável.')],
    [prefix + 'phone', String(phone).length > 30 ? t('Use até 30 caracteres.') : ''],
    [prefix + 'consent', consent ? '' : t('A autorização do responsável é obrigatória para menores de 18 anos.')],
  ].filter(([, message]) => message)
}

// Autorização separada, desmarcada e em destaque (não fica escondida no meio de outros termos).
function consentBox(id) {
  return '<label class="consent-box sm:col-span-2"><input type="checkbox" id="' + id + '"/><span><strong>' + t('Autorização do responsável legal') + '</strong>' +
    t('Sou o responsável legal pelo atleta e autorizo o cadastro na plataforma, o uso dos dados dele para participar de peneiras e o contato da equipe da Academia comigo. Posso revogar quando quiser, no perfil do atleta.') +
    ' <a href="#/privacidade" target="_blank" rel="noopener">' + t('Ler como os dados são usados') + '<span class="sr-only"> (' + t('abre em outra aba') + ')</span></a></span></label>'
}

function guardianPanel() {
  const profile = state.profile || {}
  if (!isMinorBirth(profile.birth)) return ''
  const guardian = myGuardian()
  const head = '<div class="flex items-start gap-3"><span class="venue-pin" aria-hidden="true">' + icon('user', 'size-5') + '</span><div class="min-w-0 flex-1"><h2 class="section-title !mt-0">' + t('Responsável legal') + '</h2>'
  if (!guardianConsented(guardian)) {
    return '<div class="panel guardian-panel is-missing">' + head + '<p class="mt-1 text-sm text-ink-soft">' + (guardian?.revokedAt ? t('A autorização foi revogada em') + ' ' + new Date(guardian.revokedAt).toLocaleDateString('pt-BR') + '. ' : '') +
      t('Sem a autorização de um responsável, você não consegue se inscrever em peneiras.') + '</p></div></div>' +
      '<button type="button" class="btn-primary mt-5" data-action="open-guardian">' + t('Registrar autorização') + ' ' + icon('arrow', 'size-4') + '</button></div>'
  }
  return '<div class="panel guardian-panel">' + head + '<p class="mt-1 text-sm text-ink-soft">' + t('Autorizado em') + ' ' + new Date(guardian.consentAt).toLocaleDateString('pt-BR') + '.</p></div><span class="tag green">' + icon('check', 'size-3.5') + ' ' + t('Autorizado') + '</span></div>' +
    '<dl class="guardian-data mt-4"><div><dt>' + t('Nome') + '</dt><dd>' + escapeHtml(guardian.name) + ' <span class="text-ink-soft">(' + escapeHtml(relationshipLabel(guardian.relationship)) + ')</span></dd></div>' +
    '<div><dt>' + t('E-mail') + '</dt><dd>' + escapeHtml(guardian.email) + '</dd></div>' + (guardian.phone ? '<div><dt>' + t('Telefone') + '</dt><dd>' + escapeHtml(guardian.phone) + '</dd></div>' : '') + '</dl>' +
    '<div class="mt-5 flex flex-wrap gap-2"><button type="button" class="btn-secondary" data-action="open-guardian">' + icon('edit', 'size-4') + ' ' + t('Atualizar dados') + '</button><button type="button" class="btn-ghost text-danger" data-action="revoke-guardian">' + t('Revogar autorização') + '</button></div></div>'
}

function privacyPanel() {
  return '<div class="panel"><div class="flex items-start gap-3"><span class="venue-pin" aria-hidden="true">' + icon('shield', 'size-5') + '</span><div><h2 class="section-title !mt-0">' + t('Seus dados') + '</h2>' +
    '<p class="mt-1 text-sm text-ink-soft">' + t('CPF, telefone e endereço só você vê. A equipe vê seus dados de jogo, inscrições e avaliações.') + '</p></div></div>' +
    '<div class="mt-5 flex flex-wrap gap-2"><button type="button" class="btn-secondary" data-action="download-data">' + icon('arrow', 'size-4 rotate-90') + ' ' + t('Baixar meus dados') + '</button>' +
    '<button type="button" class="btn-ghost" data-route="privacidade">' + t('Como usamos seus dados') + '</button>' +
    '<button type="button" class="btn-ghost" data-route="messages">' + t('Pedir correção ou exclusão') + '</button></div></div>'
}

function openGuardianModal() {
  if (state.user?.role !== 'player') return
  const current = myGuardian() || {}
  const wrapper = document.createElement('div')
  wrapper.className = 'fixed inset-0 z-[96] grid place-items-center bg-black/75 p-4 backdrop-blur-md'
  wrapper.innerHTML =
    '<div class="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-card surface surface--raised p-6 shadow-2xl sm:p-8" role="dialog" aria-modal="true" aria-labelledby="guardian-title" data-lenis-prevent>' +
    '<div class="flex items-start justify-between gap-4"><div><h2 id="guardian-title" class="text-2xl font-bold">' + t('Autorização do responsável') + '</h2><p class="mt-1 text-sm text-ink-soft">' + t('Preencha junto com seu responsável. Ao salvar, a autorização é registrada com a data de hoje.') + '</p></div><button type="button" class="icon-button" aria-label="' + t('Fechar') + '" data-close>' + icon('close') + '</button></div>' +
    '<form id="guardian-form" class="mt-6 grid gap-4 sm:grid-cols-2" novalidate>' +
    '<div class="sm:col-span-2">' + input(t('Nome completo do responsável'), 'g-name', current.name || '', 'text', true) + '</div>' +
    '<label class="field-label">' + t('Parentesco') + '<select id="g-relation" class="field" required><option value="">' + t('Selecione…') + '</option>' + RELATIONSHIPS.map(([value, label]) => '<option value="' + value + '"' + (value === current.relationship ? ' selected' : '') + '>' + t(label) + '</option>').join('') + '</select></label>' +
    input(t('Telefone do responsável (opcional)'), 'g-phone', current.phone || '', 'tel') +
    '<div class="sm:col-span-2">' + input(t('E-mail do responsável'), 'g-email', current.email || '', 'email', true) + '</div>' +
    consentBox('g-consent') +
    '<div class="flex justify-end gap-2 sm:col-span-2"><button type="button" class="btn-secondary" data-close>' + t('Cancelar') + '</button><button class="btn-primary" type="submit">' + t('Salvar autorização') + ' ' + icon('check', 'size-4') + '</button></div></form></div>'
  document.body.appendChild(wrapper)
  wrapper.querySelectorAll('[data-close]').forEach((button) => button.addEventListener('click', () => wrapper.remove()))
  const form = wrapper.querySelector('#guardian-form')
  form.addEventListener('input', (event) => { if (event.target.id) setFieldError(event.target.id, '') })
  form.addEventListener('change', (event) => { if (event.target.id) setFieldError(event.target.id, '') })
  form.addEventListener('submit', async (event) => {
    event.preventDefault()
    const g = readGuardianForm('g-')
    const errors = guardianErrors(g.name, g.relationship, g.email, g.phone, g.consent, 'g-')
    ;['g-name', 'g-relation', 'g-email', 'g-phone', 'g-consent'].forEach((id) => setFieldError(id, ''))
    errors.forEach(([id, message]) => setFieldError(id, message))
    if (errors.length) return wrapper.querySelector('#' + errors[0][0]).focus()
    const submit = form.querySelector('[type="submit"]')
    submit.setAttribute('aria-busy', 'true')
    if (remote.enabled) {
      const error = await saveGuardian(g)
      if (error) {
        submit.removeAttribute('aria-busy')
        return toast(describeError(error), 'error')
      }
      await refreshRemoteGuardians()
    } else {
      state.profile.guardian = localGuardian(g)
      const account = state.accounts.find((item) => item.email === state.user.email)
      if (account) account.profile = state.profile
      logChange('consent', 'guardian', state.user.email, { relationship: g.relationship, version: CONSENT_VERSION })
      persist()
    }
    wrapper.remove()
    render()
    toast(t('Autorização registrada. Você já pode se inscrever em peneiras.'))
  })
}

function confirmRevokeGuardian() {
  confirmDialog({
    title: t('Revogar a autorização?'),
    message: t('Você deixa de poder se inscrever em novas peneiras até um responsável autorizar de novo. As inscrições já feitas continuam.'),
    confirmLabel: t('Revogar autorização'),
    onConfirm: async () => {
      if (remote.enabled) {
        const error = await revokeGuardianConsent()
        if (error) return toast(describeError(error), 'error')
        await refreshRemoteGuardians()
      } else {
        Object.assign(state.profile.guardian, { consentAt: null, revokedAt: new Date().toISOString() })
        logChange('revoke_consent', 'guardian', state.user.email)
        persist()
      }
      render()
      toast(t('Autorização revogada.'))
    },
  })
}

// Bloco no perfil do atleta que a equipe abre: só aparece para menores.
function guardianStaffBox(athlete) {
  if (state.user?.role !== 'staff' || !(athlete.age > 0 && athlete.age < 18)) return ''
  const guardian = guardianFor(athlete)
  if (!guardianConsented(guardian)) {
    return '<p class="fit-line fit-no mt-5">' + icon('info', 'size-4 shrink-0') + '<span><strong>' + t('Menor de idade.') + '</strong> ' +
      (athlete.demo ? t('Perfil de exemplo, sem responsável cadastrado.') : t('Sem autorização do responsável: o atleta não consegue se inscrever em peneiras.')) + '</span></p>'
  }
  return '<div class="guardian-staff mt-5"><p class="td-label !mb-1">' + icon('user', 'size-4') + t('Menor de idade · responsável legal') + '</p>' +
    '<p class="text-sm"><strong>' + escapeHtml(guardian.name) + '</strong> (' + escapeHtml(relationshipLabel(guardian.relationship)) + ') · <a class="underline underline-offset-4" href="mailto:' + escapeHtml(guardian.email) + '">' + escapeHtml(guardian.email) + '</a>' + (guardian.phone ? ' · ' + escapeHtml(guardian.phone) : '') + '</p>' +
    '<p class="mt-1 text-xs text-ink-soft">' + t('Autorizou em') + ' ' + new Date(guardian.consentAt).toLocaleDateString('pt-BR') + '.</p></div>'
}

// Cópia dos próprios dados (LGPD art. 18): tudo o que esta conta enxerga sobre si, num arquivo JSON.
function downloadMyData() {
  if (state.user?.role !== 'player') return
  const me = getCurrentAthlete()
  const { photo, ...profile } = state.profile || {}
  const data = {
    exportado_em: new Date().toISOString(),
    origem: remote.enabled ? 'servidor' : 'navegador (modo local)',
    conta: { nome: state.user.name, email: state.user.email },
    perfil: { ...profile, foto: photo ? '(imagem incluída no perfil)' : null },
    responsavel: myGuardian() || null,
    inscricoes: state.tryouts.filter((tryout) => (tryout.enrolled || []).includes(state.user.email)).map((tryout) => ({ peneira: tryout.title, data: tryout.date, horario: tryout.time, local: tryout.location + ' · ' + tryout.city + '/' + tryout.state, status: tryout.status || 'open' })),
    avaliacoes: (state.reviews[me?.id] || []).map(({ author, position, rating, comment, date, strengths, stats }) => ({ avaliador: author, posicao: position, nota: rating, comentario: comment, data: date, destaques: strengths, estatisticas: stats })),
    mensagens: state.messages.filter((message) => String(message.thread).includes(String(me?.id ?? ''))).map((message) => ({ de: message.senderRole === 'player' ? 'você' : 'equipe', texto: message.text, em: message.ts ? new Date(message.ts).toISOString() : null })),
  }
  const link = document.createElement('a')
  link.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
  link.download = 'meus-dados-tier-zero.json'
  link.click()
  setTimeout(() => URL.revokeObjectURL(link.href), 1000)
  toast(t('Arquivo com seus dados baixado.'))
}

// ---------- Páginas legais (#/termos e #/privacidade) ----------
// Referências: LGPD (Lei 13.709/2018) arts. 7º, 14, 16, 18, 33, 41 e 48; Enunciado CD/ANPD nº 1/2023 (bases legais para
// crianças e adolescentes, sempre no melhor interesse); ECA Digital (Lei 15.211/2025). Formato: índice numerado ao lado e
// seções curtas, como as páginas legais do GOV.UK e da Stripe. O índice usa botões porque o roteador ocupa o hash da URL.
const legalText = (text) => '<p>' + t(text) + '</p>'
const legalList = (items) => '<ul>' + items.map((item) => '<li>' + (Array.isArray(item) ? '<strong>' + t(item[0]) + '</strong> ' + t(item[1]) : t(item)) + '</li>').join('') + '</ul>'
function legalPage(current, title, lead, sections) {
  const other = current === 'termos' ? ['privacidade', 'Política de privacidade'] : ['termos', 'Termos de uso']
  const num = (i) => String(i + 1).padStart(2, '0')
  return '<main id="conteudo" tabindex="-1" class="legal outline-none">' +
    '<header class="legal-hero on-album"><div class="legal-wrap"><div class="legal-top">' + brandLockup(32) +
    '<button type="button" class="btn-secondary text-sm" data-route="' + (state.user ? 'profile' : 'login') + '">' + icon('back', 'size-4') + ' ' + (state.user ? t('Voltar ao perfil') : t('Voltar ao login')) + '</button></div>' +
    '<h1 class="legal-title">' + t(title) + '</h1><p class="legal-lead">' + t(lead) + '</p>' +
    '<p class="legal-meta">' + t('Versão') + ' ' + CONSENT_VERSION + ' · <a href="#/' + other[0] + '">' + t('Ler também:') + ' ' + t(other[1]) + '</a></p></div></header>' +
    '<div class="legal-wrap legal-body"><nav class="legal-toc" aria-label="' + t('Nesta página') + '"><p>' + t('Nesta página') + '</p><ol>' +
    sections.map(([id, heading], i) => '<li><button type="button" data-scroll-to="' + id + '"><span class="tabular">' + num(i) + '</span>' + t(heading) + '</button></li>').join('') + '</ol></nav>' +
    '<article class="privacy legal-article"><p class="fit-line fit-no">' + icon('info', 'size-4 shrink-0') + '<span>' + t('Projeto acadêmico (FIAP 2026). Este texto descreve como a plataforma funciona hoje. Ele não é uma avaliação jurídica, não foi revisado por advogado e não afirma conformidade com a LGPD (Lei 13.709/2018).') + '</span></p>' +
    sections.map(([id, heading, body], i) => '<section id="' + id + '" class="legal-section" tabindex="-1"><h2><span class="legal-num tabular" aria-hidden="true">' + num(i) + '</span>' + t(heading) + '</h2>' + body + '</section>').join('') +
    '</article></div></main>' + siteFooter()
}
document.addEventListener('click', (event) => {
  const target = document.getElementById(event.target.closest?.('[data-scroll-to]')?.dataset.scrollTo || '')
  if (!target) return
  target.scrollIntoView({ behavior: calmMotion.matches ? 'auto' : 'smooth', block: 'start' })
  target.focus({ preventScroll: true })
})

function privacyPage() {
  const row = (data, why, who) => '<tr><th scope="row">' + t(data) + '</th><td data-label="' + t('Para quê') + '">' + t(why) + '</td><td data-label="' + t('Quem vê') + '">' + t(who) + '</td></tr>'
  const basis = (what, base) => '<tr><th scope="row">' + t(what) + '</th><td data-label="' + t('Base legal') + '">' + t(base) + '</td></tr>'
  const card = ([name, heading, text]) => '<div class="legal-card">' + icon(name, 'size-5') + '<strong>' + t(heading) + '</strong><span>' + t(text) + '</span></div>'
  return legalPage('privacidade', 'Política de privacidade', 'Como a TIER ZERO usa os dados de atletas, responsáveis e funcionários, em linguagem simples, para que pais, responsáveis e os próprios atletas entendam (LGPD, art. 14, § 6º).', [
    ['resumo', 'Resumo', '<div class="legal-cards">' + [
      ['shield', 'Sem venda de dados', 'A plataforma não vende dados e não mostra anúncios.'],
      ['users', 'Menores com responsável', 'Atletas menores de 18 anos só se inscrevem em peneiras com a autorização de um responsável.'],
      ['user', 'Só a equipe vê', 'Perfil, carta e avaliações ficam entre o atleta e a equipe da Pelé Academia. Nada disso é público.'],
      ['copy', 'Você no controle', 'Você pode baixar uma cópia dos seus dados, corrigir o perfil e pedir a exclusão da conta.'],
    ].map(card).join('') + '</div>'],
    ['controlador', 'Quem cuida dos dados', legalText('Controladora: Pelé Academia, que usa a TIER ZERO para organizar peneiras e avaliações. A TIER ZERO é um projeto acadêmico da FIAP (2026).') +
      legalText('Encarregado pelo tratamento de dados (art. 41): o nome e o contato oficiais ainda serão definidos pela Pelé Academia antes do lançamento. Até lá, pedidos e dúvidas vão para a equipe pela tela Conversas.')],
    ['dados', 'Quais dados, para quê e quem vê', '<div class="privacy-table"><table><thead><tr><th scope="col">' + t('Dado') + '</th><th scope="col">' + t('Para quê') + '</th><th scope="col">' + t('Quem vê') + '</th></tr></thead><tbody>' +
      row('Nome, foto e gênero', 'Identificar você no perfil.', 'Você e a equipe') +
      row('Data de nascimento', 'Calcular a idade e a categoria (Sub-7 a Sub-20) e saber se precisa de responsável.', 'Você e a equipe') +
      row('Posições, perna dominante, cidade e UF', 'Mostrar as peneiras compatíveis e ajudar os olheiros a encontrar você.', 'Você e a equipe') +
      row('E-mail', 'Entrar na conta e identificar sua inscrição nas peneiras.', 'Você e a equipe') +
      row('CPF', 'Evitar duas contas para a mesma pessoa.', 'Só você') +
      row('Telefone e endereço (opcional)', 'Ficam no seu perfil. O endereço é opcional e nenhuma função o usa.', 'Só você') +
      row('Inscrições, avaliações e conversas', 'Organizar as peneiras e o acompanhamento técnico.', 'Você e a equipe') +
      row('Responsável legal (menores de 18)', 'Registrar a autorização e permitir que a equipe fale com a família.', 'Você e a equipe') +
      row('Perfil profissional (funcionários)', 'Mostrar aos atletas e às famílias quem organiza a peneira e quem avalia.', 'Atletas e equipe') +
      row('Nome, e-mail e mensagem do Fale conosco', 'Responder quem escreveu.', 'Só a equipe') +
      '</tbody></table></div>' +
      legalText('A plataforma não pede dados sensíveis, como saúde, origem racial, religião ou biometria. Só pedimos o que alguma função usa (LGPD, art. 6º, III).')],
    ['bases', 'Por que podemos usar esses dados', '<div class="privacy-table"><table><thead><tr><th scope="col">' + t('Uso') + '</th><th scope="col">' + t('Base legal') + '</th></tr></thead><tbody>' +
      basis('Conta, perfil, inscrições e avaliações', 'Execução do serviço que você pediu ao se cadastrar (art. 7º, V).') +
      basis('Dados de atletas menores de 18 anos', 'Consentimento específico e em destaque de um responsável (art. 14, § 1º), sempre no melhor interesse do atleta (Enunciado CD/ANPD nº 1/2023).') +
      basis('Histórico de alterações (quem mudou o quê e quando)', 'Legítimo interesse, para segurança e prevenção de fraudes (art. 7º, IX).') +
      '</tbody></table></div>'],
    ['menores', 'Atletas menores de 18 anos', legalList([
      'A conta só é criada com a autorização de um responsável legal (mãe, pai, avó ou avô, tutor ou outro responsável), marcada em destaque no cadastro. A plataforma guarda quando a autorização foi dada e em qual versão desta política.',
      'Para crianças (até 12 anos incompletos), a LGPD pede o consentimento específico e em destaque de um dos pais ou do responsável (art. 14, § 1º). A plataforma aplica a mesma regra até os 18 anos.',
      'O ECA Digital (Lei 15.211/2025), em vigor desde março de 2026, pede que contas de menores de 16 anos em serviços digitais fiquem vinculadas a um responsável. Aqui o responsável é pedido até os 18.',
      'Sem autorização, ou se ela for revogada, o atleta não consegue se inscrever em peneiras.',
      'A equipe vê o nome e o contato do responsável para falar com a família.',
      'A plataforma registra a declaração, mas não confere documentos. A equipe pode pedir a confirmação do responsável no dia da peneira.'])],
    ['compartilhamento', 'Com quem os dados são compartilhados', legalList([
      ['Equipe da Pelé Academia:', 'olheiros e treinadores veem perfis, inscrições e avaliações para conduzir as peneiras.'],
      ['Supabase:', 'hospeda o banco de dados e cuida do login. Conforme a região do servidor, os dados podem ficar fora do Brasil; a LGPD trata essa transferência internacional no art. 33.'],
      ['Google Fonts:', 'entrega a fonte do site. Para isso, o navegador se conecta ao Google e envia dados técnicos, como o endereço IP.'],
      'O botão "Entrar com o Google" desta versão é uma demonstração: ele entra numa conta de exemplo e não envia nem recebe dados do Google.',
      'Nenhum dado é vendido, alugado ou usado para publicidade.'])],
    ['guarda', 'Por quanto tempo os dados ficam guardados', legalText('Enquanto a conta existir. Quando a conta é excluída no servidor, o perfil, as conversas e as avaliações ligadas a ela são apagados junto, exceto o que a lei obrigar a guardar (art. 16).') +
      legalText('A plataforma ainda não apaga contas paradas automaticamente: a exclusão é feita a pedido, por um administrador.')],
    ['seguranca', 'Segurança e incidentes', legalList([
      'A senha fica com o serviço de autenticação (Supabase Auth); a plataforma não tem acesso a ela.',
      'As regras de quem vê o quê ficam no banco de dados (políticas de acesso por linha), não só na tela.',
      'A comunicação com o servidor é criptografada (HTTPS).',
      'Se houver um incidente de segurança que possa causar risco ou dano relevante, a LGPD manda comunicar a ANPD e as pessoas afetadas (art. 48).'])],
    ['navegador', 'O que fica salvo no seu navegador', legalText('A plataforma não usa cookies de rastreamento nem ferramentas de análise. Ela guarda no armazenamento local do navegador só o necessário para funcionar: idioma, tema claro ou escuro, a sessão de login e o que você já leu nas conversas.') +
      legalText('No modo de demonstração (sem servidor), tudo fica salvo apenas neste navegador, inclusive a senha: não use dados ou senhas reais nele.')],
    ['direitos', 'Seus direitos e como pedir', legalList([
      ['Confirmar e acessar:', 'em Meu perfil você vê tudo o que a plataforma guarda sobre você.'],
      ['Corrigir:', 'em Meu perfil. CPF e data de nascimento são corrigidos pela equipe: peça em Conversas.'],
      ['Receber uma cópia:', 'em Meu perfil → Baixar meus dados (arquivo JSON).'],
      ['Revogar a autorização do responsável:', 'em Meu perfil → Responsável legal.'],
      ['Excluir a conta ou tirar dúvidas:', 'escreva para a equipe em Conversas. A exclusão é feita por um administrador da plataforma.'],
      ['Reclamar:', 'se o pedido não for atendido, você pode peticionar à Autoridade Nacional de Proteção de Dados, a ANPD (art. 18, § 1º).']]) +
      legalText('Esses direitos estão no art. 18 da LGPD.')],
    ['mudancas', 'Mudanças nesta política', legalText('Quando esta política mudar, a versão no topo da página muda junto. Cada autorização de responsável fica registrada com a versão em vigor no momento em que foi dada.')],
  ])
}

function termsPage() {
  return legalPage('termos', 'Termos de uso', 'As regras para usar a TIER ZERO: o que a plataforma faz, o que se espera de atletas, responsáveis e funcionários e o que acontece se alguém quebrar essas regras.', [
    ['servico', 'O que é a TIER ZERO', legalText('A TIER ZERO é a plataforma de peneiras da Pelé Academia. Atletas de 7 a 20 anos criam um perfil, se inscrevem em peneiras e conversam com a equipe; olheiros e treinadores organizam as peneiras e registram avaliações.') +
      legalText('Ao criar uma conta ou usar a plataforma, você concorda com estes termos e com a Política de privacidade.')],
    ['quem', 'Quem pode usar', legalList([
      'Atletas de 7 a 20 anos, nas categorias Sub-7 a Sub-20.',
      'Atletas menores de 18 anos precisam da autorização de um responsável legal, dada no cadastro. Sem ela, não dá para se inscrever em peneiras.',
      'Funcionários entram por convite de um administrador da Pelé Academia.'])],
    ['conta', 'Sua conta', legalList([
      'Use dados verdadeiros. Cada pessoa tem uma conta só; o CPF evita contas duplicadas.',
      'A senha é pessoal. Não compartilhe e avise a equipe se achar que alguém entrou na sua conta.',
      'Você pode corrigir seus dados em Meu perfil quando quiser.'])],
    ['peneiras', 'Peneiras', legalList([
      'A inscrição não garante aprovação nem vaga em time.',
      'Cada peneira tem posições, categoria, local, data e horário definidos pela equipe. A equipe pode mudar ou cancelar uma peneira, e os inscritos veem a mudança na plataforma.',
      'Atletas menores de 18 anos devem ir acompanhados de um responsável, que pode ter de confirmar a autorização no dia.',
      'A presença é marcada pela equipe no local da peneira.'])],
    ['avaliacoes', 'Avaliações e carta do atleta', legalList([
      'As notas são a opinião técnica de olheiros e treinadores da Pelé Academia, registrada depois de observar o atleta.',
      'Cada característica da posição (por exemplo passe, drible ou finalização) recebe uma nota de 0 a 10. Na carta, cada atributo é a média das notas recebidas multiplicada por 10, e a nota geral é a média das notas gerais multiplicada por 10.',
      'Perfis marcados como "exemplo" mostram notas de demonstração, não avaliações reais.',
      'A nota não é promessa de contratação nem laudo esportivo ou médico.'])],
    ['conduta', 'Conversas e conduta', legalList([
      'Trate todos com respeito. Não são aceitos assédio, ofensas, discriminação, ameaças nem pedidos de dinheiro.',
      'A equipe fala com atletas menores de 18 anos só pela plataforma ou pelo contato do responsável cadastrado.',
      'Não envie senhas, documentos nem dados de outras pessoas pelas conversas.',
      'Mensagens que quebrem estes termos podem ser removidas, e a conta pode ser suspensa.'])],
    ['conteudo', 'Fotos e textos que você envia', legalText('A foto e os textos continuam sendo seus. Ao enviá-los, você autoriza a Pelé Academia a mostrá-los dentro da plataforma, para a equipe, enquanto a conta existir. Envie só fotos suas, que você tenha o direito de usar.')],
    ['equipe', 'Regras para funcionários', legalList([
      'Use os dados dos atletas só para organizar peneiras e avaliar. Não leve dados para fora da plataforma sem necessidade.',
      'Avalie com base no que viu em campo e registre a avaliação na peneira em que observou o atleta.',
      'Quando alguém sai da equipe, um administrador desativa a conta dessa pessoa.'])],
    ['suspensao', 'Suspensão e exclusão', legalText('A equipe pode suspender ou excluir contas que quebrem estes termos ou a lei. Você pode pedir a exclusão da sua conta a qualquer momento pela tela Conversas.')],
    ['limites', 'Limites do serviço', legalText('A plataforma é um projeto acadêmico e é oferecida como está. Ela pode ficar fora do ar para manutenção. No modo de demonstração, os dados ficam só no navegador e somem se o histórico for apagado.')],
    ['lei', 'Mudanças, lei aplicável e contato', legalText('Estes termos podem mudar; quando isso acontecer, a versão no topo da página muda junto. Valem as leis brasileiras, entre elas o Estatuto da Criança e do Adolescente e a LGPD. Dúvidas: escreva para a equipe em Conversas.')],
  ])
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
      t(remote.enabled && staff ? 'Nenhum jogador cadastrado ainda. Quando um atleta criar a conta, ele aparece aqui.' : 'Nenhuma conversa disponível no momento.') + '</div>',
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
    '<aside class="chat-list border-b border-line bg-night/60 md:border-b-0 md:border-r"><div class="p-4"><label class="field-label">' + (staff ? t('Pesquisar atleta') : t('Pesquisar profissional')) + '<input id="conversation-search" class="field mt-2" placeholder="' + t('Digite um nome, posição ou cidade...') + '" autocomplete="off" /></label></div>' +
    '<div id="conversation-list" class="max-h-[520px] space-y-1 overflow-y-auto p-2">' + conversationItemsHtml(conversations, selected.id) + '</div></aside>' +
    '<div class="chat-pane flex min-w-0 flex-col"><header class="chat-header flex items-center justify-between gap-3 border-b border-line px-5 py-4"><div class="flex min-w-0 items-center gap-3">' +
    '<button type="button" class="chat-back icon-button" data-action="chat-back" aria-label="' + t('Voltar para as conversas') + '">' + icon('back') + '</button>' +
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

// Prancheta tática do fundo da capa: a jogada (volante → meia → ponta → atacante → gol) é SMIL nativo do SVG, em tinta sobre o ouro.
const TACTIC_BOARD = '<svg class="tactic-board" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><g class="tb-lines"><rect x="40" y="40" width="1520" height="820" rx="6" pathLength="1"/><path d="M800 40v820" pathLength="1"/><circle cx="800" cy="450" r="120" pathLength="1"/><path d="M40 230h230v440H40M1560 230h-230v440h230" pathLength="1"/><path d="M40 350h80v200H40M1560 350h-80v200h80" pathLength="1"/><path d="M270 360a120 120 0 0 1 0 180M1330 360a120 120 0 0 0 0 180" pathLength="1"/></g><g class="tb-arrows"><path d="M300 170 C 400 110, 520 120, 620 200" pathLength="1"/><path d="M860 770 C 980 810, 1100 770, 1180 690" pathLength="1"/></g><circle cx="1250" cy="400" r="13" class="tb-opp" style="--d:0.60s"/><circle cx="1300" cy="560" r="13" class="tb-opp" style="--d:0.70s"/><circle cx="1180" cy="300" r="13" class="tb-opp" style="--d:0.80s"/><circle cx="1150" cy="690" r="13" class="tb-opp" style="--d:0.90s"/><circle cx="940" cy="520" r="13" class="tb-opp" style="--d:1.00s"/><circle cx="880" cy="280" r="13" class="tb-opp" style="--d:1.10s"/><circle cx="1520" cy="450" r="13" class="tb-opp" style="--d:1.20s"/><g class="tb-player pos-gk" style="--d:0.00s"><circle cx="110" cy="450" r="15" class="tb-dot"/><circle cx="110" cy="450" r="26" class="tb-halo"/></g><g class="tb-player pos-def" style="--d:0.12s"><circle cx="300" cy="170" r="15" class="tb-dot"/><circle cx="300" cy="170" r="26" class="tb-halo"/></g><g class="tb-player pos-def" style="--d:0.24s"><circle cx="300" cy="740" r="15" class="tb-dot"/><circle cx="300" cy="740" r="26" class="tb-halo"/></g><g class="tb-player pos-def" style="--d:0.36s"><circle cx="470" cy="90" r="15" class="tb-dot"/><circle cx="470" cy="90" r="26" class="tb-halo"/></g><g class="tb-player pos-mid" style="--d:0.48s"><circle cx="560" cy="640" r="15" class="tb-dot"/><circle cx="560" cy="640" r="26" class="tb-halo"/></g><g class="tb-player pos-mid" style="--d:0.60s"><circle cx="760" cy="420" r="15" class="tb-dot"/><circle cx="760" cy="420" r="26" class="tb-halo"/></g><g class="tb-player pos-atk" style="--d:0.72s"><circle cx="1000" cy="200" r="15" class="tb-dot"/><circle cx="1000" cy="200" r="26" class="tb-halo"/></g><g class="tb-player pos-atk" style="--d:0.84s"><circle cx="1100" cy="560" r="15" class="tb-dot"/><circle cx="1100" cy="560" r="26" class="tb-halo"/></g><g class="tb-player pos-mid" style="--d:0.96s"><circle cx="860" cy="770" r="15" class="tb-dot"/><circle cx="860" cy="770" r="26" class="tb-halo"/></g><g class="tb-trails"><line x1="560" y1="640" x2="760" y2="420" class="tb-trail" stroke-dasharray="297.3" stroke-dashoffset="297.3"><animate attributeName="stroke-dashoffset" dur="9s" repeatCount="indefinite" values="297.3;297.3;0;0;297.3" keyTimes="0;0.0000;0.1111;0.92;1"/><animate attributeName="opacity" dur="9s" repeatCount="indefinite" values="1;1;0" keyTimes="0;0.9;1"/></line><line x1="760" y1="420" x2="1000" y2="200" class="tb-trail" stroke-dasharray="325.6" stroke-dashoffset="325.6"><animate attributeName="stroke-dashoffset" dur="9s" repeatCount="indefinite" values="325.6;325.6;0;0;325.6" keyTimes="0;0.1556;0.2778;0.92;1"/><animate attributeName="opacity" dur="9s" repeatCount="indefinite" values="1;1;0" keyTimes="0;0.9;1"/></line><line x1="1000" y1="200" x2="1100" y2="560" class="tb-trail" stroke-dasharray="373.6" stroke-dashoffset="373.6"><animate attributeName="stroke-dashoffset" dur="9s" repeatCount="indefinite" values="373.6;373.6;0;0;373.6" keyTimes="0;0.3222;0.4444;0.92;1"/><animate attributeName="opacity" dur="9s" repeatCount="indefinite" values="1;1;0" keyTimes="0;0.9;1"/></line><line x1="1100" y1="560" x2="1556" y2="450" class="tb-trail tb-shot" stroke-dasharray="469.1" stroke-dashoffset="469.1"><animate attributeName="stroke-dashoffset" dur="9s" repeatCount="indefinite" values="469.1;469.1;0;0;469.1" keyTimes="0;0.4778;0.5333;0.92;1"/><animate attributeName="opacity" dur="9s" repeatCount="indefinite" values="1;1;0" keyTimes="0;0.9;1"/></line></g><circle cx="1556" cy="450" r="10" class="tb-goal"><animate attributeName="r" dur="9s" repeatCount="indefinite" values="10;10;90;90" keyTimes="0;0.5333;0.6333;1"/><animate attributeName="opacity" dur="9s" repeatCount="indefinite" values="0;.9;0;0" keyTimes="0;0.5333;0.6333;1"/></circle><g class="tb-ball"><circle r="9" class="tb-ball-core"/><animateMotion dur="9s" repeatCount="indefinite" path="M560 640 L760 420 L1000 200 L1100 560 L1556 450" keyPoints="0.0000;0.2029;0.2029;0.4250;0.4250;0.6799;0.6799;1.0000;1.0000" keyTimes="0.0000;0.1111;0.1556;0.2778;0.3222;0.4444;0.4778;0.5333;1.0000" calcMode="linear"/></g></svg>'

// Fotos coladas na capa (Unsplash, licença Unsplash; origem em assets/photos/*.json). Crianças reais jogando, sem nome nem nota.
const COVER_PHOTOS = [
  ['./assets/photos/menino-bola-azul.webp', 'Menino de camisa branca chutando uma bola azul num campo de grama', '-6deg', '0s'],
  ['./assets/photos/menina-chute.webp', 'Menina de camisa preta chutando a bola num campo à tarde', '5deg', '.18s'],
  ['./assets/photos/criancas-campo.webp', 'Crianças disputando a bola perto do gol num campo de grama', '-2deg', '.36s'],
]
const coverPhoto = ([src, alt, r, d], i) => '<figure class="cover-photo" style="--r:' + r + ';--d:' + d + ';--depth:' + (i + 2) + '"><img src="' + src + '" alt="' + t(alt) + '" width="900" height="600" decoding="async"' + (i ? ' loading="lazy"' : '') + ' /></figure>'

// Botão no formato do "Sign in with Google" (logo G oficial, fundo branco, borda #747775; developers.google.com/identity/branding-guidelines).
// Aqui é só demonstração: entra na conta de exemplo da aba escolhida, sem falar com o Google. A legenda diz isso.
const GOOGLE_G = '<svg class="google-g" viewBox="0 0 48 48" aria-hidden="true" focusable="false"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>'
const demoNote = (role) => role === 'staff' ? t('Demonstração: entra na conta de exemplo de funcionário (Marina Lopes), sem usar sua conta Google.') : t('Demonstração: entra na conta de exemplo de jogador (Gabriel Martins), sem usar sua conta Google.')

// Capa do álbum: o ouro a tela toda, a prancheta animada ao fundo, a lombada, o título, fotos coladas e três figurinhas de exemplo em leque.
function loginPage() {
  const visitor = { id: 'voce', slot: true, name: t('Você'), pos: '', city: '', state: '' }
  const fan = [defaultAthletes.find((a) => a.id === 2), visitor, defaultAthletes.find((a) => a.id === 1)].filter(Boolean)
  const tilt = [['-9deg', '1.1rem', '.15s'], ['0deg', '0', '.3s'], ['8deg', '1.3rem', '.45s']]
  return '<main id="conteudo" tabindex="-1" class="album-cover on-album outline-none">' + TACTIC_BOARD +
    '<header class="cover-top">' + brandLockup(40) + '</header>' +
    '<div class="cover-photos">' + COVER_PHOTOS.map(coverPhoto).join('') + '</div>' +
    '<p class="cover-spine" aria-hidden="true">' + t('Peneiras · Sub-7 a Sub-20') + '</p>' +
    '<section class="cover-intro"><h1 class="login-title">' + t('Seu próximo jogo começa aqui.') + '</h1><p class="cover-lead">' + t('Peneiras da Pelé Academia para atletas de 7 a 20 anos, da Sub-7 à Sub-20.') + '</p>' +
    '<div class="cover-fan">' + fan.map((a, i) => playerCard(a, { size: 'compact' }).replace('<figure class="', '<figure style="--r:' + tilt[i][0] + ';--y:' + tilt[i][1] + ';--d:' + tilt[i][2] + '" class="')).join('') + '</div>' +
    '<p class="cover-note">' + t('Nas pontas, figurinhas de exemplo. No meio, a sua: nasce no cadastro como carta base e ganha nota com as avaliações dos olheiros.') + '</p>' +
    '<div class="cover-foot">' + partnerSeal() + '</div></section>' +
    '<div class="login-card paper"><h2 class="text-3xl font-bold">' + t('Entrar') + '</h2><p class="mt-2 text-sm text-ink-soft">' + t('Escolha o tipo de conta antes de entrar.') + '</p>' +
    '<div class="segmented mt-6" role="group" aria-label="' + t('Tipo de conta') + '" data-active="0"><span class="seg-pill" aria-hidden="true"></span><button type="button" class="role-tab active" data-role="player" aria-pressed="true">' + icon('user', 'size-4 seg-icon') + t('Jogador') + '</button><button type="button" class="role-tab" data-role="staff" aria-pressed="false">' + icon('clipboard', 'size-4 seg-icon') + t('Funcionário') + '</button></div>' +
    '<form id="login-form" class="mt-6 space-y-4">' + input(t('E-mail'), 'login-email', '', 'email', true) + input(t('Senha'), 'login-password', '', 'password', true) + '<p id="login-error" class="hidden rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-xs font-semibold text-danger"></p><button class="btn-primary w-full" type="submit">' + t('Entrar') + ' ' + icon('arrow', 'size-4') + '</button></form>' +
    '<button type="button" class="mt-3 w-full text-center text-xs text-brand hover:text-brand-strong" data-action="forgot-password">' + t('Esqueci minha senha') + '</button>' +
    '<div class="my-6 flex items-center gap-3"><span class="h-px flex-1 bg-line"></span><span class="text-xs text-ink-soft">' + t('ou') + '</span><span class="h-px flex-1 bg-line"></span></div>' +
    '<button type="button" class="btn-google w-full" data-action="demo" aria-describedby="demo-note">' + GOOGLE_G + '<span>' + t('Entrar com o Google') + '</span></button>' +
    '<p id="demo-note" class="demo-note" data-demo-note aria-live="polite">' + demoNote('player') + '</p>' +
    '<button type="button" class="btn-secondary mt-4 w-full" data-route="register">' + t('Criar conta de jogador') + '</button>' +
    '<div class="mt-4 flex items-center justify-center gap-2"><button type="button" class="btn-ghost text-xs" data-action="change-lang">' + icon('globe', 'size-3.5') + ' ' + LANGS.find((l) => l.code !== getLang())?.label + '</button>' + themeButton() + '</div>' +
    '<p class="legal-links"><a href="#/termos">' + t('Termos de uso') + '</a><span aria-hidden="true">·</span><a href="#/privacidade">' + t('Política de privacidade') + '</a></p></div></main>' + siteFooter({ ink: true })
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
  { title: 'Responsável', hint: 'Autorização para menores de 18', fields: ['reg-g-name', 'reg-g-relation', 'reg-g-email', 'reg-g-phone', 'reg-g-consent'], minorOnly: true },
  { title: 'Contato e acesso', hint: 'E-mail, cidade e senha', fields: ['reg-email', 'reg-phone', 'reg-zip', 'reg-city', 'reg-state', 'reg-district', 'reg-address', 'reg-number', 'reg-password', 'reg-confirm'] },
]
function registerPage() {
  regPhoto = null
  const step = (n, body) => '<fieldset class="reg-step" data-step="' + n + '"' + (n ? ' hidden' : '') + '><legend class="sr-only">' + t(REG_STEPS[n].title) + '</legend><h2 class="reg-step-title" tabindex="-1">' + t(REG_STEPS[n].title) + '</h2><p class="mt-1 text-sm text-ink-soft">' + t(REG_STEPS[n].hint) + '</p><div class="mt-5 grid gap-4 sm:grid-cols-2">' + body + '</div></fieldset>'
  return '<main id="conteudo" tabindex="-1" class="register-stage on-album outline-none">' +
    '<aside class="register-aside"><button type="button" class="self-start" data-route="login" aria-label="' + t('Voltar para o login') + '">' + brandLockup(36) + '</button>' +
    '<div><h1 class="register-title">' + t('Criar conta de jogador') + '</h1><p class="mt-3 max-w-sm text-ink-soft">' + t('Três etapas curtas (quatro para menores de 18). A idade e a categoria saem da data de nascimento.') + '</p></div>' +
    '<ol class="stepper" aria-label="' + t('Etapas do cadastro') + '">' + REG_STEPS.map((item, i) => '<li data-stepper="' + i + '"' + (i ? '' : ' aria-current="step"') + (item.minorOnly ? ' hidden' : '') + '><span class="stepper-dot">' + (i + 1) + '</span><span><strong>' + t(item.title) + '</strong><small>' + t(item.hint) + '</small></span></li>').join('') + '</ol>' +
    '<div class="register-foot">' + partnerSeal() + '<p class="text-sm text-ink-soft">' + t('Já tem conta?') + ' <button type="button" class="font-semibold text-brand underline underline-offset-4" data-route="login">' + t('Entrar') + '</button></p></div></aside>' +
    '<section class="register-card paper"><div class="reg-progress" aria-hidden="true"><span></span></div><p class="mt-3 text-xs font-semibold text-ink-soft" data-step-label aria-live="polite">' + t('Etapa') + ' 1 ' + t('de') + ' 3</p>' +
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
      '<p class="sm:col-span-2 text-sm leading-6" data-guardian-intro></p>' +
      input(t('Nome completo do responsável'), 'reg-g-name', '', 'text', true) +
      '<label class="field-label">' + t('Parentesco') + '<select id="reg-g-relation" class="field" required><option value="">' + t('Selecione…') + '</option>' + RELATIONSHIPS.map(([value, label]) => '<option value="' + value + '">' + t(label) + '</option>').join('') + '</select></label>' +
      input(t('E-mail do responsável'), 'reg-g-email', '', 'email', true) + input(t('Telefone do responsável (opcional)'), 'reg-g-phone', '', 'tel') +
      consentBox('reg-g-consent')) +
    step(3,
      input(t('E-mail'), 'reg-email', '', 'email', true) + input(t('Telefone'), 'reg-phone', '', 'tel', true) +
      addressFields('reg') +
      '<p class="form-group-title sm:col-span-2">' + t('Acesso') + '</p>' +
      input(t('Senha'), 'reg-password', '', 'password', true) + input(t('Confirmar senha'), 'reg-confirm', '', 'password', true) +
      '<p class="sm:col-span-2 text-xs leading-5 text-ink-soft">' + (remote.enabled ? t('Sua conta fica no servidor da plataforma. CPF, telefone e endereço são visíveis só para você.') : t('Modo local: os dados ficam apenas neste navegador. Não use senhas reais.')) + '</p>' +
      '<p class="sm:col-span-2 text-sm leading-6">' + t('Ao criar a conta, você concorda com os') + ' <a class="font-semibold underline underline-offset-4" href="#/termos" target="_blank" rel="noopener">' + t('Termos de uso') + '<span class="sr-only"> (' + t('abre em outra aba') + ')</span></a> ' + t('e com a') + ' <a class="font-semibold underline underline-offset-4" href="#/privacidade" target="_blank" rel="noopener">' + t('Política de privacidade') + '<span class="sr-only"> (' + t('abre em outra aba') + ')</span></a>.</p>') +
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
  const group = field.closest('details')
  if (group) group.open = true
  if (!error) {
    error = document.createElement('p')
    error.id = id + '-err'
    error.className = 'field-error'
    ;(field.closest('.consent-box') || field).insertAdjacentElement('afterend', error)
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
  if (n === 2) guardianErrors(v('reg-g-name'), v('reg-g-relation'), v('reg-g-email'), v('reg-g-phone'), document.getElementById('reg-g-consent')?.checked, 'reg-g-').forEach((item) => errors.push(item))
  if (n === 3) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v('reg-email'))) errors.push(['reg-email', t('Informe um e-mail válido.')])
    ;['reg-phone', 'reg-city', 'reg-state'].forEach((id) => { if (!v(id)) errors.push([id, t('Campo obrigatório.')]) })
    if (!zipOk(v('reg-zip'))) errors.push(['reg-zip', t('CEP no formato 00000-000.')])
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
  // `current` é a posição entre as etapas visíveis; a etapa do responsável só entra para menores de 18.
  let current = 0
  const visible = () => REG_STEPS.map((_, i) => i).filter((i) => !REG_STEPS[i].minorOnly || isMinorBirth(document.querySelector('#reg-birth')?.value))
  const stepAt = (position) => visible()[position]
  const show = (position) => {
    current = position
    const steps = visible()
    const n = steps[position]
    const last = position === steps.length - 1
    form.querySelectorAll('.reg-step').forEach((fieldset) => { fieldset.hidden = Number(fieldset.dataset.step) !== n })
    document.querySelectorAll('[data-stepper]').forEach((li) => {
      const i = Number(li.dataset.stepper)
      const at = steps.indexOf(i)
      li.hidden = at < 0
      li.querySelector('.stepper-dot').textContent = at + 1
      li.toggleAttribute('data-done', at >= 0 && at < position)
      if (i === n) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current')
    })
    form.querySelector('[data-reg-back]').hidden = position === 0
    form.querySelector('[data-reg-next]').hidden = last
    form.querySelector('[type="submit"]').hidden = !last
    document.querySelector('.reg-progress span').style.setProperty('--p', String((position + 1) / steps.length))
    document.querySelector('[data-step-label]').textContent = t('Etapa') + ' ' + (position + 1) + ' ' + t('de') + ' ' + steps.length
    if (n === 2) {
      const name = (document.querySelector('#reg-name')?.value || '').trim().split(' ')[0]
      document.querySelector('[data-guardian-intro]').textContent = (name || t('O atleta')) + ' ' + t('tem menos de 18 anos. Para criar a conta e participar das peneiras, um responsável legal precisa autorizar. Faça esta etapa com o responsável ao lado.')
    }
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
  form.querySelector('[data-reg-next]').addEventListener('click', () => { if (validateRegisterStep(stepAt(current))) show(current + 1) })
  form.querySelector('[data-reg-back]').addEventListener('click', () => show(current - 1))
  // Enter num campo avança a etapa em vez de enviar o formulário inteiro
  form.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && event.target.matches('input:not([type="checkbox"])') && current < visible().length - 1) {
      event.preventDefault()
      if (validateRegisterStep(stepAt(current))) show(current + 1)
    }
  })
  form.addEventListener('submit', (event) => { if (!validateRegisterStep(stepAt(current))) { event.preventDefault(); event.stopImmediatePropagation() } }, true)
}


// Cidade e UF são obrigatórias (filtro de atletas e card). O resto do endereço é opcional:
// nenhuma função da plataforma usa, então só pedimos o que é necessário (LGPD, art. 6º, III).
const zipOk = (zip) => !zip || /^\d{5}-?\d{3}$/.test(zip)
function addressFields(prefix, p = {}) {
  const filled = p.zip || p.district || p.address || p.number
  return '<p class="form-group-title sm:col-span-2">' + t('Onde você mora') + '</p>' +
    input(t('Cidade'), prefix + '-city', p.city || '', 'text', true) + input(t('Estado (UF)'), prefix + '-state', p.state || '', 'text', true) +
    '<details class="optional-group sm:col-span-2"' + (filled ? ' open' : '') + '><summary><span>' + t('Endereço completo (opcional)') + '</span><small>' + t('Nenhuma função da plataforma usa o endereço. Preencha só se quiser.') + '</small></summary>' +
    '<div class="mt-4 grid gap-4 sm:grid-cols-2">' + input(t('CEP'), prefix + '-zip', p.zip || '', 'text') + input(t('Bairro'), prefix + '-district', p.district || '', 'text') +
    input(t('Rua'), prefix + '-address', p.address || '', 'text') + input(t('Número'), prefix + '-number', p.number || '', 'text') + '</div></details>'
}

function input(label, id, value = '', type = 'text', required = false, disabled = false, readonly = false) {
  return '<label class="field-label">' + escapeHtml(t(label)) + '<input id="' + id + '" class="field" type="' + type + '" value="' + escapeHtml(value) + '"' + (required ? ' required' : '') + (disabled ? ' disabled' : '') + (readonly ? ' readonly' : '') + ' /></label>'
}

function selectField(label, id, options, selected = '') {
  const placeholder = selected ? '' : '<option value="" disabled selected>' + t('Selecione') + '</option>'
  return '<label class="field-label">' + escapeHtml(t(label)) + '<select id="' + id + '" class="field" required>' + placeholder + options.map((option) => '<option value="' + escapeHtml(option) + '" ' + (String(option) === String(selected) ? 'selected' : '') + '>' + escapeHtml(t(option)) + '</option>').join('') + '</select></label>'
}

function showFeedback(id, text, error = false) {
  const element = document.querySelector('#' + id)
  if (!element) return
  element.textContent = t(text)
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

// Perfil de exemplo sem avaliação mostra a nota de exemplo, sinalizada como tal (nada de nota sem origem).
const ratingIsExample = () => { const a = getCurrentAthlete(); return !!a?.demo && !(state.reviews[a.id] || []).length }
const avgLabel = () => t('Nota média') + (ratingIsExample() ? ' (' + t('exemplo') + ')' : '')
function averagePlayerRating() {
  const athlete = getCurrentAthlete()
  return athlete ? formatRating(ratingOf(athlete)).replace('.', ',') : '—'
}

function formatDate(date) {
  if (!date) return t('Data não informada')
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
    if (categoryField) categoryField.innerHTML = '<option>' + t('Preencha uma data válida') + '</option>'
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
  const strengths = strengthsOf(athlete)
  const enrolledIn = athlete.email ? state.tryouts.filter((tryout) => (tryout.enrolled || []).includes(athlete.email)).sort(byStart) : []
  const presences = enrolledIn.filter((tryout) => checkinsOf(tryout)[athlete.email]).length
  wrapper.innerHTML =
    '<div class="athlete-modal pos-' + positionGroup(athlete.pos) + ' max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-card surface surface--raised shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="athlete-modal-title" data-lenis-prevent>' +
    '<header class="athlete-modal-hero"><button type="button" class="icon-button athlete-modal-close" data-close-modal aria-label="' + t('Fechar') + '">' + icon('close') + '</button>' +
    '<div class="athlete-modal-card">' + playerCard(athlete, { flip: true, size: 'large' }) + '</div>' +
    '<h2 id="athlete-modal-title" class="athlete-modal-name">' + escapeHtml(athlete.name) + '</h2>' +
    '<p class="mt-1 text-center text-ink-soft">' + athlete.age + ' ' + t('anos') + ' · ' + escapeHtml(athlete.city) + '/' + escapeHtml(athlete.state) + (athlete.demo ? ' · ' + t('perfil de exemplo') : '') + '</p>' +
    '<div class="mt-3 flex flex-wrap justify-center gap-1.5">' + posTag(athlete.pos) + posTag(athlete.secondary) + tag(getCategoryFromAge(athlete.age), true) + (athlete.gender ? tag(athlete.gender, true) : '') + '</div>' +
    '</header>' +
    '<div class="p-6 sm:p-8">' +
    '<div class="scout-note"><p>' + escapeHtml(describeAthlete(athlete)) + '</p>' + (strengths.length ? '<p class="scout-strengths">' + strengths.map((item) => '<span>' + escapeHtml(item) + '</span>').join('') + '</p>' : '') + '</div>' +
    '<h3 class="section-title mt-8">' + t('Ficha do atleta') + '</h3>' +
    '<dl class="athlete-facts">' + [
      [t('Idade'), athlete.age + ' ' + t('anos') + ' · ' + getCategoryFromAge(athlete.age)],
      [t('Posição'), t(athlete.pos) + (athlete.secondary && athlete.secondary !== '—' ? ' / ' + t(athlete.secondary) : '')],
      [t('Perna dominante'), athlete.foot ? t(athlete.foot) : '—'],
      [t('Cidade'), athlete.city + '/' + athlete.state],
      [t('Status'), t(athlete.status || '—')],
      [t('Avaliações'), String(reviews.length)],
      [t('Última avaliação'), reviews[0]?.date || '—'],
      [t('Peneiras'), plural(enrolledIn.length, 'inscrição', 'inscrições') + ' · ' + plural(presences, 'presença', 'presenças')],
    ].map(([k, v]) => '<div><dt>' + k + '</dt><dd>' + escapeHtml(v) + '</dd></div>').join('') + '</dl>' +
    (enrolledIn.length ? '<h3 class="section-title mt-8">' + t('Peneiras do atleta') + '</h3><ul class="athlete-tryouts">' + enrolledIn.map((tryout) => '<li><span class="min-w-0"><strong class="block truncate">' + escapeHtml(tryout.title) + '</strong><small class="text-ink-soft">' + escapeHtml(formatDate(tryout.date)) + ' · ' + escapeHtml(tryout.location || '') + '</small></span>' + (checkinsOf(tryout)[athlete.email] ? '<span class="tag green">' + icon('check', 'size-3.5') + ' ' + t('Presente') + '</span>' : tryout.status === 'cancelled' ? '<span class="tag ghost">' + t('Cancelada') + '</span>' : '<span class="tag ghost">' + t('Inscrito') + '</span>') + '</li>').join('') + '</ul>' : '') +
    guardianStaffBox(athlete) +
    '<div class="mt-6 flex flex-wrap gap-2"><button type="button" class="btn-primary" data-message-athlete="' + athlete.id + '">' + icon('message', 'size-4') + ' ' + t('Abrir conversa') + '</button><button type="button" class="btn-secondary save-toggle" data-save="' + athlete.id + '" aria-pressed="' + isSaved(athlete.id) + '">' + icon('bookmark', 'size-4') + '<span>' + (isSaved(athlete.id) ? t('Na sua lista') : t('Salvar na lista')) + '</span></button>' +
    (state.user?.role === 'staff' ? '<button type="button" class="btn-secondary" data-review-athlete="' + athlete.id + '">' + icon('edit', 'size-4') + ' ' + t('Registrar avaliação') + '</button>' : '') + '</div>' +
    '<section class="mt-8 grid gap-6 md:grid-cols-[1fr_1.1fr]"><div><h3 class="section-title !mt-0">' + t('Atributos') + '</h3>' +
    (Object.keys(attrs.values).length ? '<div class="mt-3">' + radarChart(attrs.criteria, attrs.values) + '</div>' : '<div class="empty-state mt-3"><strong>' + t('Sem avaliação ainda') + '</strong><span class="text-sm">' + t('O radar aparece depois da primeira avaliação registrada.') + '</span></div>') + cardBasis(athlete) + '</div>' +
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

function confirmDialog({ title, message, confirmLabel = t('Confirmar'), onConfirm }) {
  const wrapper = document.createElement('div')
  wrapper.className = 'fixed inset-0 z-[110] grid place-items-center bg-black/75 p-4'
  wrapper.innerHTML =
    '<div class="w-full max-w-md rounded-card surface surface--raised p-6" role="dialog" aria-modal="true"><h2 class="text-2xl font-bold">' + escapeHtml(title) + '</h2><p class="mt-3 text-sm leading-6 text-ink-soft">' + escapeHtml(message) + '</p>' +
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
    '<div class="flex items-start justify-between gap-4"><div><h2 id="review-modal-title" class="mt-2 text-2xl font-bold">' + t('Avaliar') + ' ' + escapeHtml(athlete.name) + '</h2><p class="mt-1 text-sm text-ink-soft">' + t('Dê uma nota de 0 a 10 para cada característica. A nota base é uma média ponderada pela posição avaliada; as estatísticas da partida ajustam a nota em até ±') + String(MAX_ADJUSTMENT).replace('.', ',') + ' ' + t('ponto.') + '</p></div><button type="button" class="icon-button" data-close aria-label="' + t('Fechar') + '">' + icon('close') + '</button></div>' +
    '<form id="review-form" class="mt-6 space-y-6">' +
    '<label class="field-label">' + t('Posição avaliada') + '<select id="review-position" class="field">' + positions.map((p, i) => '<option value="' + escapeHtml(p) + '">' + escapeHtml(t(p)) + ' (' + (i === 0 ? t('principal') : t('secundária')) + ')</option>').join('') + '</select></label>' +
    '<section><div class="flex items-center justify-between gap-3"><h3 class="font-bold">' + t('Características') + ' <span class="text-xs font-normal text-ink-soft">(0 a 10)</span></h3><span class="text-xs text-ink-soft">' + t('O “peso” mostra a importância na posição') + '</span></div><div id="review-criteria" class="mt-3 grid gap-3 sm:grid-cols-2"></div>' +
    '<div class="mt-4 flex items-center justify-between gap-4 rounded-2xl border border-brand/20 bg-brand/7 p-4"><div><p class="text-sm font-bold text-brand">' + t('Nota final ponderada') + '</p><p id="review-score-hint" class="mt-1 text-xs text-ink-soft"></p></div><p id="review-score" class="text-4xl font-bold text-brand">—</p></div></section>' +
    '<section><h3 class="font-bold">' + t('Estatísticas da partida') + ' <span class="text-xs font-normal text-ink-soft">(' + t('opcional • visível só para o atleta e para a equipe') + ')</span></h3><div id="review-stats" class="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"></div></section>' +
    '<section><h3 class="font-bold">' + t('Pontos fortes') + ' <span class="text-xs font-normal text-ink-soft">(' + t('opcional') + ')</span></h3><div class="mt-3 flex flex-wrap gap-2">' + STRENGTHS.map((item) => '<label class="check-pill"><input type="checkbox" name="strength" value="' + escapeHtml(item) + '"/><span>' + escapeHtml(t(item)) + '</span></label>').join('') + '</div></section>' +
    '<label class="field-label">' + t('Comentário') + '<textarea id="review-comment" class="field min-h-28 resize-y" required placeholder="' + t('Descreva o que observou no jogo, atitude, evolução...') + '"></textarea></label>' +
    '<p id="review-error" class="hidden rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-xs font-semibold text-danger" role="alert"></p>' +
    '<div class="flex justify-end gap-2"><button type="button" class="btn-secondary" data-close>' + t('Cancelar') + '</button><button type="submit" class="btn-primary">' + t('Salvar avaliação') + ' ' + icon('check', 'size-4') + '</button></div></form></div>'
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
      return '<label class="field-label"><span class="flex items-center justify-between gap-2"><span>' + escapeHtml(t(c.label)) + '</span><span class="text-xs font-bold uppercase tracking-wider ' + tone + '">' + t('peso') + ' ' + t(level) + '</span></span><input class="field" type="number" inputmode="decimal" min="0" max="10" step="0.5" required placeholder="' + t('0 a 10') + '" data-criterion="' + c.key + '" value="' + escapeHtml(keepCriteria[c.key] ?? '') + '"/></label>'
    }).join('')
    statsBox.innerHTML = statsForPosition(pos).map((c) =>
      '<label class="field-label">' + escapeHtml(t(c.label)) + '<input class="field" type="number" inputmode="numeric" min="0" step="1" placeholder="—" data-stat="' + c.key + '" value="' + escapeHtml(keepStats[c.key] ?? '') + '"/></label>').join('')
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
      error.textContent = t(message)
      error.classList.remove('hidden')
      error.scrollIntoView({ block: 'nearest' })
    }
    const pos = positionSelect.value
    const ratings = {}
    for (const c of criteriaForPosition(pos)) {
      const value = Number(wrapper.querySelector('[data-criterion="' + c.key + '"]').value)
      if (!Number.isFinite(value) || value < 0 || value > 10) return fail(t('A nota de') + ' "' + t(c.label) + '" ' + t('deve estar entre 0 e 10.'))
      ratings[c.key] = value
    }
    const stats = {}
    for (const c of statsForPosition(pos)) {
      const raw = wrapper.querySelector('[data-stat="' + c.key + '"]').value
      if (raw === '') continue
      const value = Number(raw)
      if (!Number.isInteger(value) || value < 0) return fail('"' + t(c.label) + '" ' + t('deve ser um número inteiro, 0 ou maior.'))
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
    if (athlete.email) notify(athlete.email, t('Nova avaliação'), t('Um olheiro avaliou seu desempenho como') + ' ' + t(pos) + ' (' + t('nota') + ' ' + score.toFixed(1).replace('.', ',') + ').')
    persist()
    wrapper.remove()
    toast(t('Avaliação salva. Nota final:') + ' ' + score.toFixed(1).replace('.', ',') + '.')
    refreshAthleteViews()
    openAthleteModal(athleteId)
  })
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
    '<div class="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-card surface surface--raised p-6 shadow-2xl sm:p-8" role="dialog" aria-modal="true" aria-labelledby="tryout-title" data-lenis-prevent>' +
    '<div class="flex items-start justify-between gap-4"><div><h2 id="tryout-title" class="mt-2 text-2xl font-bold">' + t('Criar e agendar') + '</h2><p class="mt-1 text-sm text-ink-soft">' + t('Horário de Brasília. As inscrições fecham na hora em que a peneira começa.') + '</p></div><button type="button" class="icon-button" aria-label="' + t('Fechar') + '" data-close>' + icon('close') + '</button></div>' +
    '<form id="tryout-form" class="mt-6 grid gap-4 sm:grid-cols-2" novalidate>' +
    input('Nome da peneira', 'try-title', '', 'text', true) +
    input('Data', 'try-date', '', 'date', true) +
    input('Horário', 'try-time', '', 'time', true) +
    input('Quantidade de vagas', 'try-seats', '12', 'number', true) +
    '<label class="field-label">' + t('Categoria') + '<select id="try-category" class="field" required><option>Sub-7</option><option>Sub-9</option><option>Sub-11</option><option>Sub-13</option><option>Sub-15</option><option>Sub-17</option><option selected>Sub-20</option></select></label>' +
    '<div class="sm:col-span-2"><div class="flex flex-wrap items-end gap-2"><label class="field-label min-w-0 flex-1">' + t('Local') + '<select id="try-venue" class="field" required>' + venueOptions() + '</select></label>' +
    '<button type="button" class="btn-secondary" data-new-venue-inline>' + icon('plus', 'size-4') + ' ' + t('Novo local') + '</button></div><p id="try-venue-hint" class="mt-2 text-xs text-ink-soft" aria-live="polite"></p></div>' +
    '<div class="sm:col-span-2"><p class="field-label">' + t('Posições disponíveis') + '</p><div class="mt-2 grid grid-cols-2 gap-2 rounded-2xl border border-line bg-night/60 p-3 sm:grid-cols-3">' +
    POSITIONS.map((p, i) => '<label class="check-pill"><input type="checkbox" name="position" value="' + escapeHtml(p) + '" ' + (i === 6 ? 'checked' : '') + '/><span>' + escapeHtml(t(p)) + '</span></label>').join('') +
    '</div></div>' +
    '<label class="field-label sm:col-span-2">' + t('Sobre a peneira (opcional)') + '<textarea id="try-description" class="field min-h-28 resize-y" maxlength="1000" aria-describedby="try-description-count" placeholder="' + t('Ex.: como vai ser a avaliação, o que levar (chuteira, caneleira, água), documentos e a que horas chegar.') + '"></textarea>' +
    '<span id="try-description-count" class="block text-right text-xs font-normal text-ink-soft">0/1000</span></label>' +
    '<div id="tryout-error" class="sm:col-span-2 hidden rounded-2xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger" role="alert"></div>' +
    '<div class="flex justify-end gap-2 sm:col-span-2"><button type="button" class="btn-secondary" data-close>' + t('Cancelar') + '</button><button class="btn-primary" type="submit">' + t('Criar peneira') + ' ' + icon('check', 'size-4') + '</button></div></form></div>'

  document.body.appendChild(wrapper)
  wrapper.querySelectorAll('[data-close]').forEach((button) => button.addEventListener('click', () => wrapper.remove()))
  wrapper.querySelector('#try-date').min = todayIso()
  const select = wrapper.querySelector('#try-venue')
  const showHint = () => {
    const venue = state.venues.find((item) => item.id === Number(select.value))
    wrapper.querySelector('#try-venue-hint').textContent = venue
      ? (venueAddress(venue) || t('Endereço a completar: edite o local para os atletas saberem onde ir.')) + (venue.reference ? ' · ' + venue.reference : '')
      : activeVenues().length ? '' : t('Nenhum local ativo. Cadastre um para marcar a peneira.')
  }
  select.addEventListener('change', showHint)
  const description = wrapper.querySelector('#try-description')
  description.addEventListener('input', () => { wrapper.querySelector('#try-description-count').textContent = description.value.length + '/1000' })
  wrapper.querySelector('#tryout-form').addEventListener('input', (event) => { if (event.target.id) setFieldError(event.target.id, '') })
  wrapper.querySelector('#tryout-form').addEventListener('change', (event) => { if (event.target.id) setFieldError(event.target.id, '') })
  showHint()
  wrapper.querySelector('[data-new-venue-inline]').addEventListener('click', () => openVenueModal(null, (venue) => {
    select.innerHTML = venueOptions(venue.id)
    setFieldError('try-venue', '')
    showHint()
    select.focus()
  }))

  wrapper.querySelector('#tryout-form').addEventListener('submit', (event) => {
    event.preventDefault()
    const value = (id) => wrapper.querySelector('#' + id).value.trim()
    const title = value('try-title')
    const date = value('try-date')
    const time = value('try-time')
    const seats = Number(value('try-seats'))
    const venue = state.venues.find((item) => item.id === Number(select.value) && item.active)
    const positions = [...wrapper.querySelectorAll('input[name="position"]:checked')].map((box) => box.value)
    const errors = [
      ['try-title', title.length < 3 ? t('Dê um nome à peneira (pelo menos 3 letras).') : ''],
      ['try-date', !validTryoutDate(date) ? t('Escolha a data.') : date < todayIso() ? t('Essa data já passou.') : ''],
      ['try-time', !validTime(time) ? t('Escolha o horário.') : date === todayIso() && !enrollmentOpen({ date, time }) ? t('Esse horário de hoje já passou.') : ''],
      ['try-seats', !Number.isInteger(seats) || seats < 1 || seats > 500 ? t('Entre 1 e 500 vagas.') : ''],
      ['try-venue', venue ? '' : t('Escolha o local.')],
    ]
    errors.forEach(([id, message]) => setFieldError(id, message))
    const error = wrapper.querySelector('#tryout-error')
    error.textContent = positions.length ? '' : t('Marque pelo menos uma posição.')
    error.classList.toggle('hidden', !!positions.length)
    const firstError = errors.find(([, message]) => message)
    if (firstError) return wrapper.querySelector('#' + firstError[0]).focus()
    if (!positions.length) return

    const fields = { title, date, time, location: venue.name, city: venue.city, state: venue.state, category: value('try-category'), positions, seats, venueId: venue.id, description: value('try-description').replace(/\n{3,}/g, '\n\n') }
    if (remote.enabled) {
      runTryoutAction(wrapper.querySelector('[type="submit"]'), () => createTryout(fields), t('Peneira criada e publicada para os atletas.')).then((ok) => { if (ok) wrapper.remove() })
      return
    }
    const tryout = { id: Date.now(), ...fields, enrolled: [], createdBy: state.user.email }
    state.tryouts.unshift(tryout)
    logChange('create', 'tryout', tryout.id, { title, date, venueId: venue.id })
    notify(state.user.email, 'Nova peneira criada', title + ' foi publicada.')
    persist()
    wrapper.remove()
    render()
    toast(t('Peneira criada e publicada.'))
  })
}

function enrollInTryout(id, button) {
  const tryout = state.tryouts.find((item) => item.id === id)
  if (!tryout || state.user?.role !== 'player') return
  const enrolled = Array.isArray(tryout.enrolled) ? tryout.enrolled : (tryout.enrolled = [])
  if (enrolled.includes(state.user.email)) return
  if (!enrollmentOpen(tryout)) return toast(t('As inscrições desta peneira estão fechadas.'), 'error')
  if (needsGuardianMe()) return toast(t('Falta a autorização do responsável. Registre no seu perfil.'), 'error', { label: t('Registrar'), onClick: () => openGuardianModal() })
  const vacancies = Number(tryout.seats) - enrolled.length
  const category = getCategoryFromAge(getAgeFromProfile(state.profile?.birth))
  const compatible = tryout.positions.includes(state.profile?.pos) || tryout.positions.includes(state.profile?.secondary)
  if (tryout.category && tryout.category !== category) return toast(t('Sua categoria não corresponde à desta peneira.'), 'error')
  if (!compatible) return toast(t('Sua posição não está entre as posições aceitas.'), 'error')
  if (vacancies <= 0) return toast(t('Não há mais vagas nesta peneira.'), 'error')
  if (tryout.remote && remote.enabled) {
    runTryoutAction(button, () => enrollTryout(tryout.id), t('Inscrição confirmada.')).then((ok) => {
      if (ok) notify(state.user.email, t('Inscrição confirmada'), t('Você se inscreveu em') + ' ' + tryout.title + '.')
    })
    return
  }
  enrolled.push(state.user.email)
  notifyTryoutStaff(tryout, t('Nova inscrição'), state.user.name + ' ' + t('se inscreveu em') + ' "' + tryout.title + '" (' + enrolled.length + '/' + tryout.seats + ').')
  notify(state.user.email, t('Inscrição confirmada'), t('Você se inscreveu em') + ' ' + tryout.title + '.')
  persist()
  render()
  toast(t('Inscrição confirmada.'))
}

function confirmWithdraw(tryoutId) {
  const tryout = state.tryouts.find((item) => item.id === Number(tryoutId))
  if (!tryout || state.user?.role !== 'player') return
  const wrapper = document.createElement('div')
  wrapper.className = 'fixed inset-0 z-[92] grid place-items-center bg-black/75 p-4'
  wrapper.innerHTML =
    '<div class="w-full max-w-md rounded-card surface surface--raised p-6" role="dialog" aria-modal="true" aria-labelledby="withdraw-title"><h2 id="withdraw-title" class="mt-2 text-2xl font-bold">' + t('Sair da peneira?') + '</h2>' +
    '<p class="mt-3 text-sm leading-6 text-ink-soft">' + t('Você será removido de') + ' <strong class="text-chalk">' + escapeHtml(tryout.title) + '</strong> (' + formatDate(tryout.date) + ' • ' + escapeHtml(tryout.time) + '). ' + t('A vaga ficará livre para outros atletas.') + '</p>' +
    '<div class="mt-6 flex justify-end gap-2"><button type="button" class="btn-secondary" data-close>' + t('Manter inscrição') + '</button><button type="button" class="btn-danger" data-confirm>' + t('Cancelar inscrição') + '</button></div></div>'
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
  notify(email, t('Inscrição cancelada'), t('Você saiu da peneira') + ' "' + tryout.title + '". ' + t('A vaga foi liberada.'))
  notifyTryoutStaff(tryout, t('Vaga liberada'), state.user.name + ' ' + t('cancelou a inscrição em') + ' "' + tryout.title + '" (' + tryout.enrolled.length + '/' + tryout.seats + ').')
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
    '<p class="mt-3 text-sm leading-6 text-ink-soft">' + (total ? '<strong class="text-chalk">' + total + ' ' + t('inscrito(s)') + '</strong> ' + t('receberão um aviso automático com o motivo abaixo.') : t('Não há inscritos nesta peneira, então nenhum aviso será enviado.')) + ' ' + t('Esta ação remove a peneira da lista e não pode ser desfeita.') + '</p>' +
    '<form id="cancel-tryout-form" class="mt-5"><label class="field-label">' + t('Motivo do cancelamento (opcional)') + '<textarea id="cancel-reason" class="field min-h-24 resize-y" maxlength="240" placeholder="' + t('Ex.: chuva forte, campo indisponível, nova data será divulgada.') + '"></textarea></label>' +
    '<div class="mt-6 flex justify-end gap-2"><button type="button" class="btn-secondary" data-close>' + t('Manter peneira') + '</button><button type="submit" class="btn-danger">' + t('Cancelar peneira e avisar inscritos') + '</button></div></form></div>'
  document.body.appendChild(wrapper)
  wrapper.querySelector('[data-close]').addEventListener('click', () => wrapper.remove())
  wrapper.addEventListener('click', (event) => { if (event.target === wrapper) wrapper.remove() })
  wrapper.querySelector('#cancel-tryout-form').addEventListener('submit', (event) => {
    event.preventDefault()
    const reason = wrapper.querySelector('#cancel-reason').value.trim() || t('A peneira foi cancelada por uma eventualidade.')
    const when = formatDate(tryout.date) + ' • ' + tryout.time
    if (tryout.remote && remote.enabled) {
      runTryoutAction(wrapper.querySelector('[type="submit"]'), () => cancelTryout(tryout.id, reason), t('Peneira cancelada. Os inscritos verão o motivo na tela de peneiras.')).then((ok) => { if (ok) wrapper.remove() })
      return
    }
    ;(tryout.enrolled || []).forEach((email) => notify(email, t('Peneira cancelada'), '"' + tryout.title + '" (' + when + ') ' + t('foi cancelada. Motivo:') + ' ' + reason))
    // Cancelar não apaga: a peneira fica guardada com o motivo (os inscritos a veem em "Encerradas").
    tryout.status = 'cancelled'
    tryout.cancelReason = reason
    logChange('cancel', 'tryout', tryout.id, { reason })
    persist()
    wrapper.remove()
    render()
    toast(t('Peneira cancelada.') + ' ' + total + ' ' + t('inscrito(s) avisado(s).'))
  })
}

// Chamada no dia: busca pelo nome e um toque marca (ou desmarca) a presença.
// Referências: check-in manual do Eventbrite Organizer (buscar ou rolar a lista e marcar "Check in")
// e do Peatix e do Understory (busca pelo nome, desfazer ao lado do "presente").
function openEnrolledModal(tryoutId) {
  const tryout = state.tryouts.find((item) => item.id === Number(tryoutId))
  if (!tryout) return
  const emails = Array.isArray(tryout.enrolled) ? tryout.enrolled : []
  const profiles = emails.map((email) => state.accounts.find((account) => account.email === email)?.profile).filter(Boolean)
    .sort((a, b) => String(a.name).localeCompare(String(b.name), 'pt'))
  const open = checkinOpen(tryout)
  const arrived = (at) => '<p class="checkin-at">' + (at ? t('Chegou às') + ' ' + fmtClock(at) : '') + '</p>'
  const row = (profile) => {
    const at = checkinsOf(tryout)[profile.email]
    return '<div class="team-row checkin-row' + (at ? ' is-present' : '') + '" data-checkin-row data-name="' + escapeHtml(normalize(profile.name)) + '">' +
      '<span class="avatar">' + avatar(profile.name) + '</span><div class="min-w-0"><p class="font-semibold">' + escapeHtml(profile.name) + '</p>' +
      '<p class="text-xs text-ink-soft"><span class="text-brand">' + t('Principal:') + '</span> ' + escapeHtml(t(profile.pos)) + ' • <span class="text-brand">' + t('Secundária:') + '</span> ' + escapeHtml(profile.secondary && profile.secondary !== '—' ? t(profile.secondary) : t('nenhuma')) + '</p>' +
      '<p class="text-xs text-ink-soft">' + escapeHtml(getCategoryFromAge(getAgeFromProfile(profile.birth))) + ' • ' + escapeHtml(profile.city) + (profile.foot ? ' • ' + escapeHtml(t(profile.foot)) : '') + '</p>' +
      (open ? arrived(at) : '') + '</div>' +
      '<div class="team-actions">' +
      (open ? '<label class="checkin-toggle"><input type="checkbox" data-checkin="' + escapeHtml(profile.email) + '"' + (at ? ' checked' : '') + ' /><span>' + icon('check', 'size-4') + t('Presente') + '</span><span class="sr-only"> ' + escapeHtml(profile.name) + '</span></label>' : '') +
      '<button type="button" class="btn-ghost" data-view-email="' + escapeHtml(profile.email) + '">' + t('Ver perfil') + '</button><button type="button" class="btn-ghost" data-message-email="' + escapeHtml(profile.email) + '">' + t('Mensagem') + '</button></div></div>'
  }
  const wrapper = document.createElement('div')
  wrapper.className = 'fixed inset-0 z-[92] grid place-items-center bg-black/75 p-4'
  wrapper.innerHTML =
    '<div class="max-h-[86vh] w-full max-w-2xl overflow-y-auto rounded-card surface surface--raised p-6" role="dialog" aria-modal="true" aria-labelledby="enrolled-title" data-lenis-prevent><div class="flex items-start justify-between gap-3"><div><h2 id="enrolled-title" class="text-2xl font-bold">' + escapeHtml(tryout.title) + '</h2><p class="mt-1 text-sm text-ink-soft">' + (open ? t('Chamada') : t('Inscritos')) + ' ' + emails.length + '/' + escapeHtml(tryout.seats) + ' · ' + escapeHtml(longTryoutDate(tryout)) + (validTime(tryout.time) ? ' · ' + escapeHtml(tryout.time) : '') + '</p></div><button type="button" class="icon-button" aria-label="' + t('Fechar') + '" data-close>' + icon('close') + '</button></div>' +
    (open && profiles.length
      ? '<div class="checkin-meter mt-5"><p class="text-sm" aria-live="polite" data-checkin-count></p><div class="mt-2 h-2 overflow-hidden rounded-full bg-line"><div class="checkin-fill h-full rounded-full bg-success" data-checkin-fill></div></div></div>' +
        (profiles.length > 1 ? '<label class="mt-4 block"><span class="sr-only">' + t('Buscar atleta pelo nome') + '</span><input type="search" class="field" placeholder="' + t('Buscar atleta pelo nome') + '" autocomplete="off" data-checkin-search /></label>' : '')
      : tryout.status !== 'cancelled' && profiles.length ? '<p class="fit-line mt-4">' + icon('info', 'size-4 shrink-0') + t('A chamada abre no dia da peneira.') + '</p>' : '') +
    '<div class="team-list mt-4">' +
    (profiles.length ? profiles.map(row).join('') + '<p class="py-6 text-center text-sm text-ink-soft" data-checkin-empty hidden>' + t('Ninguém com esse nome na lista.') + '</p>' : '<div class="rounded-2xl border border-dashed border-line p-8 text-center text-ink-soft">' + t('Ainda não há inscritos nesta peneira.') + '</div>') +
    '</div></div>'

  const updateCount = () => {
    const count = wrapper.querySelector('[data-checkin-count]')
    if (!count) return
    const present = profiles.filter((profile) => checkinsOf(tryout)[profile.email]).length
    count.innerHTML = '<strong class="num text-2xl text-chalk">' + present + '</strong> <span class="text-ink-soft">' + t('de') + ' ' + profiles.length + ' ' + t('presentes') + (present < profiles.length ? ' · ' + (profiles.length - present) + ' ' + t('faltando') : '') + '</span>'
    wrapper.querySelector('[data-checkin-fill]').style.setProperty('--p', String(present / profiles.length))
  }
  updateCount()
  document.body.appendChild(wrapper)
  wrapper.querySelector('[data-checkin-search]')?.focus()

  // O card atrás mostra o total de presentes: redesenha quando a janela fechar (botão, Esc ou clique fora).
  let changed = false
  const watch = new MutationObserver(() => {
    if (wrapper.isConnected) return
    watch.disconnect()
    if (changed) render()
  })
  watch.observe(document.body, { childList: true })
  wrapper.addEventListener('click', (event) => { if (event.target === wrapper || event.target.closest('[data-close]')) wrapper.remove() })
  wrapper.querySelector('[data-checkin-search]')?.addEventListener('input', (event) => {
    const query = normalize(event.target.value).trim()
    let shown = 0
    wrapper.querySelectorAll('[data-checkin-row]').forEach((item) => { item.hidden = !!query && !item.dataset.name.includes(query); shown += item.hidden ? 0 : 1 })
    wrapper.querySelector('[data-checkin-empty]').hidden = shown > 0
  })
  wrapper.addEventListener('change', async (event) => {
    const box = event.target.closest('[data-checkin]')
    if (!box) return
    const present = box.checked
    box.disabled = true
    const at = await markAttendance(tryout, box.dataset.checkin, present)
    box.disabled = false
    if (at === false) { box.checked = !present; return }
    changed = true
    const item = box.closest('[data-checkin-row]')
    item.classList.toggle('is-present', !!at)
    item.querySelector('.checkin-at').outerHTML = arrived(at)
    updateCount()
  })
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

// Devolve a hora da chegada, null ao desfazer, ou false se não deu certo.
async function markAttendance(tryout, email, present) {
  let at = present ? (checkinsOf(tryout)[email] || new Date().toISOString()) : null
  if (tryout.remote && remote.enabled) {
    const result = await setAttendance(tryout.id, email, present)
    if (result.error) {
      toast(describeError(result.error), 'error')
      return false
    }
    at = result.at
  } else {
    logChange(present ? 'checkin' : 'undo_checkin', 'tryout', tryout.id, { athlete: state.accounts.find((account) => account.email === email)?.athleteId ?? null })
  }
  tryout.checkins = { ...checkinsOf(tryout) }
  if (at) tryout.checkins[email] = at
  else delete tryout.checkins[email]
  persist()
  return at
}

function openNotifications() {
  const wrapper = document.createElement('div')
  wrapper.className = 'fixed inset-0 z-[90] grid place-items-center bg-black/70 p-4'
  wrapper.innerHTML =
    '<div class="w-full max-w-lg rounded-card surface surface--raised p-6" role="dialog" aria-modal="true" aria-labelledby="notifications-title">' +
    '<div class="flex items-center justify-between gap-3"><div><h2 id="notifications-title" class="mt-1 text-2xl font-bold">' + t('Notificações') + '</h2></div><button type="button" class="icon-button" aria-label="' + t('Fechar') + '" data-close>' + icon('close') + '</button></div>' +
    '<div class="mt-5 space-y-2">' +
    (unreadSummary().total ? '<article class="rounded-2xl surface p-4"><div class="flex items-start justify-between gap-3"><div><p class="font-semibold">' + plural(unreadSummary().total, 'mensagem não lida', 'mensagens não lidas') + '</p><p class="mt-1 text-sm text-ink-soft">' + t('De') + ' ' + escapeHtml(joinPt(unreadSummary().people)) + '.</p></div><button type="button" class="btn-secondary shrink-0" data-open-unread>' + t('Abrir') + '</button></div></article>' : '') +
    (myNotifications().length ? myNotifications().map((n) => '<article class="rounded-2xl surface p-4"><div class="flex items-start justify-between gap-3"><div><p class="font-semibold">' + escapeHtml(t(n.title)) + '</p><p class="mt-1 text-sm text-ink-soft">' + escapeHtml(t(n.text)) + '</p></div><span class="text-xs text-ink-soft">' + escapeHtml(t(n.time || '')) + '</span></div></article>').join('') : '<div class="rounded-2xl border border-dashed border-line p-8 text-center text-ink-soft">' + t('Nenhuma notificação.') + '</div>') +
    '</div><button type="button" class="btn-secondary mt-5 w-full" data-clear-notifications>' + t('Marcar como lidas') + '</button></div>'

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
    '<div class="fixed inset-0 z-[70] bg-black/70 p-4 backdrop-blur-sm" data-close-mobile><div class="ml-auto w-[min(86vw,340px)] rounded-card surface surface--raised p-4 shadow-2xl" role="dialog" aria-modal="true"><div class="flex items-center justify-between"><p class="font-bold">' + t('Navegação') + '</p><button type="button" class="icon-button" data-close-mobile aria-label="' + t('Fechar menu') + '">' + icon('close') + '</button></div><div class="mt-4 grid gap-2">' +
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
  const header = [t('Nome'), t('Idade'), t('Categoria'), t('Gênero'), t('Perna dominante'), t('Posição principal'), t('Posição secundária'), t('Cidade'), t('Estado'), t('Nota média'), t('Avaliações')]
  const rows = athletes.map((a) => [
    a.name,
    a.age,
    getCategoryFromAge(a.age),
    t(a.gender || 'Não informado'),
    t(a.foot || 'Não informada'),
    t(a.pos || 'Não informada'),
    a.secondary && a.secondary !== '—' ? t(a.secondary) : t('Nenhuma'),
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
  if (!zipOk(document.querySelector('#profile-zip').value.trim())) return showFeedback('profile-feedback', t('CEP no formato 00000-000.'), true)
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
    state.tryouts.forEach((tryout) => {
      tryout.enrolled = (tryout.enrolled || []).map((email) => (email === oldEmail ? p.email : email))
      if (tryout.checkins?.[oldEmail]) { tryout.checkins[p.email] = tryout.checkins[oldEmail]; delete tryout.checkins[oldEmail] }
    })
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
  if (!city || !region) return showFeedback('reg-feedback', 'Informe a cidade e o estado.', true)
  if (!zipOk(zip)) return showFeedback('reg-feedback', 'CEP no formato 00000-000.', true)
  if (password.length < 6) return showFeedback('reg-feedback', 'A senha precisa ter pelo menos 6 caracteres.', true)
  if (password !== confirm) return showFeedback('reg-feedback', 'As senhas não coincidem.', true)
  const guardian = isMinorBirth(birth) ? readGuardianForm('reg-g-') : null
  if (guardian && guardianErrors(guardian.name, guardian.relationship, guardian.email, guardian.phone, guardian.consent).length) return showFeedback('reg-feedback', t('Preencha os dados do responsável e marque a autorização.'), true)
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
      guardian,
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
    notify(email, t('Conta criada'), t('Seu cadastro foi concluído com categoria') + ' ' + getCategoryFromAge(age) + '.')
    persist()
    go('dashboard')
    toast(t('Conta criada com sucesso.'))
    return
  }

  const athleteId = Date.now()
  if (guardian) profile.guardian = localGuardian(guardian)
  state.accounts.push({ email, password, role: 'player', cpf: profile.cpf, athleteId, profile })
  state.profile = profile
  state.user = { name, email, role: 'player' }
  if (guardian) logChange('consent', 'guardian', email, { relationship: guardian.relationship, version: CONSENT_VERSION })
  syncAthletes()
  notify(email, t('Conta criada'), t('Seu cadastro foi concluído com categoria') + ' ' + getCategoryFromAge(age) + '.')
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
    showFeedback(errorId, actual === 'staff' ? t('Esta conta é de funcionário. Selecione a aba correta acima.') : t('Esta conta é de jogador. Selecione a aba correta acima.'), true)
    return false
  }
  persist()
  go('dashboard')
  toast(role === 'staff' ? t('Login realizado como funcionário.') : t('Login realizado como jogador.'))
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
    return showFeedback(errorId, anyRole.role === 'staff' ? t('Esta conta é de funcionário. Selecione a aba correta acima.') : t('Esta conta é de jogador. Selecione a aba correta acima.'), true)
  }
  const account = state.accounts.find((entry) => entry.email === email && entry.role === role)
  if (account && account.password === password && account.active === false) return showFeedback(errorId, t('Esta conta de funcionário foi desativada. Fale com um administrador.'), true)
  if (!account || account.password !== password) {
    return showFeedback(errorId, role === 'staff'
      ? 'Funcionário não encontrado ou senha incorreta. Para testar, use Entrar com o Google.'
      : 'Conta não encontrada ou senha incorreta. Crie sua conta ou, para testar, use Entrar com o Google.', true)
  }

  state.user = { name: account.profile?.name || 'Usuário', email, role }
  state.profile = role === 'player' ? account.profile : null
  persist()
  go('dashboard')
  toast(role === 'staff' ? t('Login realizado como funcionário.') : t('Login realizado como jogador.'))
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
      const note = document.querySelector('[data-demo-note]')
      if (note) note.textContent = demoNote(buttons[index].dataset.role)
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
  if (document.querySelector('[data-card-reveal]')) {
    try { localStorage.setItem('ap_card_seen:' + state.user.email, String((state.reviews[getCurrentAthlete()?.id ?? 'me'] || []).length)) } catch {}
    toast(t('Nova avaliação: sua carta foi atualizada.'))
  }
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
  document.querySelectorAll('[data-action="open-guardian"]').forEach((button) => button.addEventListener('click', () => openGuardianModal()))
  document.querySelectorAll('[data-action="revoke-guardian"]').forEach((button) => button.addEventListener('click', confirmRevokeGuardian))
  document.querySelectorAll('[data-action="download-data"]').forEach((button) => button.addEventListener('click', downloadMyData))
  document.querySelectorAll('[data-action="invite-staff"]').forEach((button) => button.addEventListener('click', () => openInviteModal()))
  document.querySelectorAll('[data-action="retry-team"]').forEach((button) => button.addEventListener('click', () => { teamStatus = null; render() }))
  document.querySelectorAll('[data-reinvite]').forEach((button) => button.addEventListener('click', () => {
    const invite = teamData()?.invites.find((item) => item.id === Number(button.dataset.reinvite))
    if (invite) openInviteModal(invite.email, invite.admin)
  }))
  document.querySelectorAll('[data-revoke-invite]').forEach((button) => button.addEventListener('click', () => confirmRevokeInvite(Number(button.dataset.revokeInvite))))
  document.querySelectorAll('[data-member-admin], [data-member-active]').forEach((button) => button.addEventListener('click', () => confirmMemberChange(button)))
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
  document.querySelectorAll('[data-action="new-venue"]').forEach((button) => button.addEventListener('click', () => openVenueModal()))
  document.querySelectorAll('[data-edit-venue]').forEach((button) => button.addEventListener('click', () => openVenueModal(state.venues.find((venue) => venue.id === Number(button.dataset.editVenue)))))
  document.querySelectorAll('[data-toggle-venue]').forEach((button) => button.addEventListener('click', () => toggleVenue(Number(button.dataset.toggleVenue))))
  document.querySelectorAll('[data-action="toggle-inactive-venues"]').forEach((button) => button.addEventListener('click', () => { showInactiveVenues = !showInactiveVenues; render() }))
  document.querySelector('[data-hide-checklist]')?.addEventListener('click', () => {
    try { localStorage.setItem('ap_hide_checklist:' + state.user.email, '1') } catch {}
    render()
  })
  document.querySelectorAll('[data-action="retry-tryouts"]').forEach((button) => button.addEventListener('click', () => {
    state.tryoutsStatus = 'loading'
    render()
    refreshRemoteTryouts().then(render)
  }))
  document.querySelectorAll('[data-action="enroll"]').forEach((button) => button.addEventListener('click', () => enrollInTryout(Number(button.dataset.id), button)))
  document.querySelectorAll('[data-tryout-details]').forEach((button) => button.addEventListener('click', () => openTryoutDetails(Number(button.dataset.tryoutDetails))))
  // Clicar em qualquer parte do card (fora de botões e links) também abre os detalhes.
  document.querySelectorAll('.tryout-card[data-tryout-card]').forEach((card) => card.addEventListener('click', (event) => {
    if (event.target.closest('a, button, input, label, select, textarea') || String(getSelection())) return
    openTryoutDetails(Number(card.dataset.tryoutCard))
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
  document.querySelectorAll('[data-action="edit-pro"]').forEach((button) => button.addEventListener('click', openProEditor))
  bindContactForm()

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
  const [routeBase, routeArg = ''] = route.split('/')
  if (!state.user && !['login', 'register', 'reset-password', 'convite', 'privacidade', 'termos', 'sobre', 'contato'].includes(routeBase)) {
    go('login')
    return
  }
  if (state.user && routeBase === 'convite') {
    go('dashboard')
    setTimeout(() => toast(t('Você já está conectado. Saia da conta para aceitar o convite.'), 'error'), 300)
    return
  }
  if (route === 'team' && !isAdmin()) {
    go('dashboard')
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
  else if (route === 'team') view = teamPage()
  else if (routeBase === 'convite') view = invitePage()
  else if (route === 'privacidade') view = privacyPage()
  else if (route === 'termos') view = termsPage()
  else if (routeBase === 'sobre') view = aboutPage()
  else if (route === 'contato') view = contactPage()
  else view = dashboard(state.user.role)

  const isNew = route !== lastRoute
  lastRoute = route
  paintScreen(() => {
    app.innerHTML = view
    bind()
    if (routeBase === 'convite') loadInvitePage(routeArg)
    if (route === 'sobre/parceria') requestAnimationFrame(() => document.getElementById('parceria')?.scrollIntoView({ block: 'start' }))
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
    state.venues = readStorage('ap_venues', state.venues)
    state.invites = readStorage('ap_invites', state.invites)
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
setInterval(tickCountdowns, 1000)
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

// Abertura: na primeira visita da sessão fica no mínimo 2,3 s (a interface já monta por baixo);
// depois disso, ou com "reduzir movimento", sai assim que o app estiver pronto. Clique ou Esc pulam.
const SPLASH_MIN = 2300 // o pacote rasga e a carta sai girando por volta de 2 s
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
  // O index.html vem em português; o que ele mostra antes do app é traduzido aqui.
  document.querySelector('.skip-link')?.replaceChildren(t('Pular para o conteúdo'))
  document.querySelector('#splash .splash-text')?.replaceChildren(t('Abrindo o pacote…'))
  document.querySelector('#splash .sr-only')?.replaceChildren(t('Carregando a Pelé Academia'))
  app.innerHTML = '<div class="grid min-h-screen place-items-center text-sm text-ink-soft">' + t('Carregando…') + '</div>'
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
      if (String(error?.message).includes('account_disabled')) {
        await clearRemoteSession()
        setTimeout(() => toast(describeError(error), 'error'), 600)
      } else {
        disableRemote()
        state.user = null
        state.profile = null
        state.accounts = readStorage('ap_accounts', state.accounts)
        state.messages = readStorage('ap_messages', state.messages)
      }
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
