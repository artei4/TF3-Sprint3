
import './styles.css'
import {
  validCPF as validateCPF,
  maskCPF as formatCPF,
  getAgeFromBirth,
  getCategoryFromAge,
  validBirthDate,
  normalizeEmail,
} from './validation.js'
import { filterAthletes } from './filters.js'
import { toggleFavorite, registerVote } from './feed.js'
import { saveMessage, searchConversations } from './messages.js'

const app = document.querySelector('#app')

const POSITIONS = ['Goleiro', 'Zagueiro', 'Lateral', 'Volante', 'Meia', 'Ponta', 'Atacante']
const GENDERS = ['Masculino', 'Feminino', 'Prefiro não informar']

const defaultProfile = {
  name: 'Gabriel Martins',
  cpf: '',
  birth: '2008-03-14',
  gender: 'Masculino',
  email: 'gabriel@academiapelé.com',
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
  { id: 1, name: 'Gabriel Martins', age: 18, birth: '2008-03-14', gender: 'Masculino', city: 'São Paulo', state: 'SP', pos: 'Atacante', secondary: 'Ponta', rating: 8.8, votes: 128, status: 'Em observação', color: 'from-amber-400 to-yellow-200', tags: ['Finalização', 'Velocidade', 'Drible'] },
  { id: 2, name: 'Lucas Ferreira', age: 19, birth: '2007-07-20', gender: 'Masculino', city: 'Osasco', state: 'SP', pos: 'Meia', secondary: 'Volante', rating: 8.4, votes: 94, status: 'Disponível', color: 'from-sky-400 to-cyan-200', tags: ['Passe', 'Visão de jogo', 'Resistência'] },
  { id: 3, name: 'Rafael Souza', age: 17, birth: '2009-01-22', gender: 'Masculino', city: 'Guarulhos', state: 'SP', pos: 'Zagueiro', secondary: 'Lateral', rating: 8.1, votes: 76, status: 'Em avaliação', color: 'from-violet-400 to-fuchsia-200', tags: ['Marcação', 'Força', 'Cabeceio'] },
  { id: 4, name: 'João Vitor', age: 18, birth: '2008-10-11', gender: 'Masculino', city: 'Campinas', state: 'SP', pos: 'Volante', secondary: 'Meia', rating: 8.6, votes: 111, status: 'Destaque', color: 'from-emerald-400 to-lime-200', tags: ['Desarme', 'Passe', 'Leitura'] },
  { id: 5, name: 'Pedro Henrique', age: 20, birth: '2006-05-05', gender: 'Masculino', city: 'Santos', state: 'SP', pos: 'Goleiro', secondary: '—', rating: 8.0, votes: 62, status: 'Disponível', color: 'from-slate-300 to-slate-100', tags: ['Reflexo', 'Posicionamento', 'Saída'] },
  { id: 6, name: 'Matheus Alves', age: 18, birth: '2008-12-02', gender: 'Masculino', city: 'Sorocaba', state: 'SP', pos: 'Ponta', secondary: 'Atacante', rating: 8.7, votes: 103, status: 'Destaque', color: 'from-orange-400 to-amber-200', tags: ['Velocidade', 'Drible', 'Cruzamento'] },
]

const defaultTryouts = [
  { id: 1, title: 'Peneira Sub-20 — Atacantes', date: '2026-09-24', time: '14:00', city: 'São Paulo', state: 'SP', location: 'Centro de Treinamento Pelé', category: 'Sub-20', positions: ['Atacante', 'Ponta'], seats: 12, enrolled: ['gabriel@academiapelé.com'] },
  { id: 2, title: 'Avaliação Sub-20 — Meio-campo', date: '2026-09-28', time: '09:00', city: 'Osasco', state: 'SP', location: 'Arena Oeste', category: 'Sub-20', positions: ['Meia', 'Volante'], seats: 18, enrolled: [] },
  { id: 3, title: 'Goleiros em Destaque', date: '2026-10-04', time: '10:30', city: 'Barueri', state: 'SP', location: 'Centro de Treinamento Oeste', category: 'Sub-20', positions: ['Goleiro'], seats: 8, enrolled: [] },
]

const state = {
  user: readStorage('ap_user', null),
  accounts: readStorage('ap_accounts', []),
  favorites: readStorage('ap_favorites', []),
  votes: readStorage('ap_votes', {}),
  messages: readStorage('ap_messages', []),
  profile: readStorage('ap_profile', null),
  tryouts: readStorage('ap_tryouts', defaultTryouts),
  reviews: readStorage('ap_reviews', {}),
  notifications: readStorage('ap_notifications', [
    { id: 1, title: 'Perfil visualizado', text: 'Um profissional visualizou seu perfil.', time: 'Hoje' },
    { id: 2, title: 'Nova oportunidade', text: 'Há uma peneira compatível com sua posição.', time: 'Ontem' },
  ]),
}

let activeThread = null

seedDemoAccount()

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

function persist() {
  localStorage.setItem('ap_user', JSON.stringify(state.user))
  localStorage.setItem('ap_accounts', JSON.stringify(state.accounts))
  localStorage.setItem('ap_favorites', JSON.stringify(state.favorites))
  localStorage.setItem('ap_votes', JSON.stringify(state.votes))
  localStorage.setItem('ap_messages', JSON.stringify(state.messages))
  localStorage.setItem('ap_profile', JSON.stringify(state.profile))
  localStorage.setItem('ap_tryouts', JSON.stringify(state.tryouts))
  localStorage.setItem('ap_reviews', JSON.stringify(state.reviews))
  localStorage.setItem('ap_notifications', JSON.stringify(state.notifications))
}

function seedDemoAccount() {
  if (!state.accounts.some((account) => account.email === 'funcionario@academiapelé.com')) {
    state.accounts.push({
      email: 'funcionario@academiapelé.com',
      password: 'Academia123!',
      role: 'staff',
      profile: {
        name: 'Marina Lopes',
        email: 'funcionario@academiapelé.com',
        phone: '(11) 99999-0000',
        position: 'Olheira',
        city: 'São Paulo',
        state: 'SP',
      },
    })
    persist()
  }
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
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
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
  const normalized = String(route || 'dashboard').replace(/^#\\/?/, '')
  location.hash = '/' + normalized
}

function currentRoute() {
  const raw = location.hash.replace(/^#\\/?/, '')
  return raw || (state.user ? 'dashboard' : 'login')
}

function toast(message, type = 'success') {
  const root = document.querySelector('#toast-root')
  if (!root) return
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
    ? [['dashboard', 'Visão geral', 'home'], ['athletes', 'Atletas', 'search'], ['tryouts', 'Peneiras', 'calendar'], ['messages', 'Conversas', 'message']]
    : [['dashboard', 'Início', 'home'], ['profile', 'Meu perfil', 'user'], ['tryouts', 'Peneiras', 'calendar'], ['messages', 'Conversas', 'message']]

  return '<div class="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(208,169,72,.12),_transparent_26%),#090909] text-white">' +
    '<header class="sticky top-0 z-40 border-b border-white/8 bg-[#090909]/90 backdrop-blur-xl">' +
    '<div class="mx-auto flex min-h-18 max-w-[1440px] items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-10">' +
    '<button class="flex items-center gap-3" data-route="dashboard" aria-label="Ir para o início">' +
    '<img src="./assets/brand/simbolo.jpg" alt="Academia Pelé" class="h-11 w-11 rounded-xl object-contain bg-black ring-1 ring-white/10" />' +
    '<div class="hidden sm:block text-left"><p class="text-sm font-black uppercase tracking-[.28em] text-[#e1bb62]">Academia Pelé</p><p class="text-[11px] text-white/40">Plataforma de talentos</p></div></button>' +
    '<nav class="hidden md:flex items-center gap-1" aria-label="Navegação principal">' +
    nav.map((item) => '<button type="button" data-route="' + item[0] + '" class="nav-link ' + (active === item[0] ? 'active' : '') + '">' + icon(item[2], 'size-4') + item[1] + '</button>').join('') +
    '</nav>' +
    '<div class="flex items-center gap-2">' +
    '<button type="button" class="icon-button" data-route="messages" aria-label="Conversas">' + icon('message') + '</button>' +
    '<button type="button" class="icon-button" data-action="notifications" aria-label="Abrir notificações">' + icon('bell') + '</button>' +
    '<button type="button" class="profile-chip" data-route="profile"><span class="avatar">' + avatar(state.user?.name || 'Atleta') + '</span><span class="hidden lg:block max-w-28 truncate text-sm">' + escapeHtml(state.user?.name || 'Atleta') + '</span></button>' +
    '<button type="button" class="icon-button md:hidden" data-action="menu" aria-label="Abrir menu">' + icon('menu') + '</button>' +
    '</div></div></header>' +
    '<main class="mx-auto max-w-[1440px] px-4 py-5 sm:px-6 lg:px-10 lg:py-8">' + content + '</main>' +
    '<div id="mobile-menu"></div>' +
    '<div id="toast-root" class="fixed bottom-5 right-5 z-[80] flex w-[min(92vw,380px)] flex-col gap-2"></div>' +
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
  }) || state.tryouts[0]

  return shell(
    '<section class="grid gap-6 xl:grid-cols-[1.55fr_.8fr]">' +
    '<div class="overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,#17130c_0%,#0d0d0d_55%,#18120a_100%)] p-6 shadow-2xl sm:p-8">' +
    '<div class="flex flex-wrap items-center justify-between gap-4"><div><span class="eyebrow">Painel do atleta</span><h1 class="mt-3 max-w-xl text-3xl font-black leading-tight tracking-tight sm:text-5xl">Olá, ' + name + '. <span class="text-[#e6bd62]">Sua carreira em movimento.</span></h1><p class="mt-4 max-w-2xl text-base leading-7 text-white/55">Acompanhe oportunidades, avaliações e conversas com profissionais da Academia Pelé.</p></div>' +
    '<div class="hidden sm:flex h-28 w-28 items-center justify-center rounded-3xl border border-[#d4ad59]/25 bg-[#d4ad59]/10"><img src="./assets/brand/simbolo.jpg" alt="Logo Academia Pelé" class="h-24 w-24 rounded-2xl object-contain" /></div></div>' +
    '<div class="mt-8 grid gap-3 sm:grid-cols-3">' +
    stat(averagePlayerRating(profile), 'Avaliação média', 'notas registradas') +
    stat(String(state.tryouts.filter((t) => Array.isArray(t.enrolled) && t.enrolled.includes(state.user?.email)).length).padStart(2, '0'), 'Peneiras inscritas', 'acompanhe suas vagas') +
    stat(String(state.notifications.length).padStart(2, '0'), 'Notificações', 'atualizadas recentemente') +
    '</div></div>' +
    '<aside class="rounded-[28px] border border-white/10 bg-white/[.03] p-6"><div class="flex items-center justify-between gap-3"><div><span class="eyebrow">Próxima oportunidade</span><h2 class="mt-2 text-xl font-black">' + escapeHtml(next.title) + '</h2></div><span class="status-dot">' + escapeHtml(next.category || 'Aberta') + '</span></div>' +
    '<div class="mt-6 space-y-4"><div class="flex gap-3">' + icon('calendar', 'size-5 text-[#e1bb62]') + '<div><p class="text-sm font-semibold">' + formatDate(next.date) + ' • ' + escapeHtml(next.time) + '</p><p class="text-xs text-white/45">' + escapeHtml(next.location) + ' • ' + escapeHtml(next.city) + '/' + escapeHtml(next.state) + '</p></div></div>' +
    '<div class="flex gap-3">' + icon('pin', 'size-5 text-[#e1bb62]') + '<div><p class="text-sm font-semibold">Posições aceitas</p><p class="text-xs text-white/45">' + escapeHtml(next.positions.join(', ')) + '</p></div></div></div>' +
    '<button type="button" class="btn-primary mt-6 w-full" data-route="tryouts">Ver peneiras ' + icon('arrow', 'size-4') + '</button></aside></section>' +
    '<section class="mt-8 grid gap-5 lg:grid-cols-[1.15fr_.85fr]">' +
    '<div class="panel"><div class="flex items-center justify-between"><div><span class="eyebrow">Meu perfil</span><h2 class="section-title">' + escapeHtml(profile.pos) + ' • ' + escapeHtml(profile.city) + '</h2></div><button type="button" class="btn-ghost" data-route="profile">Editar perfil ' + icon('edit', 'size-4') + '</button></div>' +
    '<div class="mt-5 flex flex-wrap gap-2">' + tag(profile.pos) + tag(profile.secondary, true) + tag(getCategoryFromAge(getAgeFromProfile(profile.birth))) + '</div></div>' +
    '<div class="panel"><div class="flex items-center justify-between"><div><span class="eyebrow">Minha atividade</span><h2 class="section-title">Últimos movimentos</h2></div>' + icon('arrow', 'size-5 text-white/35') + '</div><div class="mt-5 space-y-4">' +
    activity('Perfil atualizado', 'Seus dados pessoais estão prontos para os profissionais.', 'Agora') +
    activity('Peneiras', 'Confira posições compatíveis com sua categoria.', 'Hoje') +
    activity('Mensagens', 'Responda contatos de treinadores e olheiros.', 'Hoje') +
    '</div></div></section>',
    { active: 'dashboard', role: 'player' },
  )
}

function staffDashboard() {
  return shell(
    '<section class="grid gap-6 xl:grid-cols-[1.55fr_.8fr]">' +
    '<div class="rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,#17130c,#0e0e0e_65%,#1b1408)] p-6 sm:p-8"><span class="eyebrow">Central do funcionário</span><h1 class="mt-3 text-3xl font-black sm:text-5xl">Encontre atletas, avalie perfis e <span class="text-[#e6bd62]">crie oportunidades.</span></h1><p class="mt-4 max-w-2xl text-white/55">Pesquise o banco, abra o perfil completo do atleta, envie mensagens, registre avaliações e agende peneiras.</p><div class="mt-8 flex flex-wrap gap-3"><button type="button" class="btn-primary" data-route="athletes">Pesquisar atletas ' + icon('search', 'size-4') + '</button><button type="button" class="btn-secondary" data-action="openTryout">' + icon('plus', 'size-4') + ' Criar peneira</button></div></div>' +
    '<aside class="panel"><span class="eyebrow">Hoje</span><div class="mt-3 grid grid-cols-2 gap-3">' +
    staffStat('74', 'Atletas ativos') + staffStat(String(Object.keys(state.reviews).length).padStart(2, '0'), 'Perfis avaliados') + staffStat(String(state.tryouts.length).padStart(2, '0'), 'Peneiras') + staffStat(String(state.messages.length).padStart(2, '0'), 'Mensagens') +
    '</div></aside></section>' +
    '<section class="mt-8 panel"><div class="flex flex-wrap items-end justify-between gap-3"><div><span class="eyebrow">Seu radar</span><h2 class="section-title">Atletas para observar</h2></div><button type="button" class="btn-ghost" data-route="athletes">Abrir banco completo ' + icon('arrow', 'size-4') + '</button></div><div class="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">' +
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

  return '<article class="group rounded-2xl border border-white/8 bg-white/[.03] p-4 transition hover:-translate-y-0.5 hover:border-[#d4ad59]/30 hover:bg-white/[.045]">' +
    '<div class="flex gap-3"><div class="avatar-lg bg-gradient-to-br ' + a.color + '">' + avatar(a.name) + '</div><div class="min-w-0 flex-1"><div class="flex items-start justify-between gap-2"><button type="button" class="min-w-0 text-left" data-open-athlete="' + a.id + '"><h3 class="truncate font-bold">' + escapeHtml(a.name) + '</h3><p class="text-xs text-white/40">' + a.age + ' anos • ' + escapeHtml(a.city) + '/' + escapeHtml(a.state) + '</p></button>' +
    '<button type="button" class="icon-button sm" data-favorite="' + a.id + '" aria-label="' + (fav ? 'Remover dos favoritos' : 'Favoritar') + '">' + icon('heart', 'size-4 ' + (fav ? 'fill-[#e2bb62] text-[#e2bb62]' : '')) + '</button></div>' +
    '<div class="mt-3 flex flex-wrap gap-1.5">' + tag(a.pos) + tag(a.secondary, true) + tag(getCategoryFromAge(a.age)) + '</div></div></div>' +
    '<div class="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/7 pt-3"><div class="flex items-center gap-2 text-xs text-white/45">' + icon('star', 'size-4 text-[#e2bb62]') + '<strong class="text-white">' + a.rating.toFixed(1) + '</strong> média <span>•</span> ' + count + ' votos <span>•</span> ' + reviewCount + ' avaliação(ões)</div>' +
    '<div class="flex gap-2"><button type="button" class="vote-button" data-vote="' + a.id + '">Votar</button>' +
    (staff ? '<button type="button" class="btn-secondary px-3 py-2 text-xs" data-message-athlete="' + a.id + '">Mensagem</button>' : '') +
    '<button type="button" class="btn-ghost px-2" data-open-athlete="' + a.id + '" aria-label="Abrir perfil de ' + escapeHtml(a.name) + '">Ver perfil</button></div></div></article>'
}

function tag(text, ghost = false) {
  const safe = escapeHtml(text || '—')
  return '<span class="tag ' + (ghost ? 'ghost' : '') + '">' + safe + '</span>'
}

function athletesPage() {
  const filters = '<aside class="panel h-max"><div class="flex items-center justify-between"><h2 class="font-bold">Filtros</h2><button type="button" class="text-xs text-[#e2bb62]" data-action="clearFilters">Limpar</button></div>' +
    '<div class="mt-4 space-y-4"><label class="field-label">Buscar por nome<input id="filter-name" class="field" placeholder="Ex.: Gabriel" /></label>' +
    '<label class="field-label">Posição principal ou secundária<select id="filter-pos" class="field"><option value="">Todas</option>' + POSITIONS.map((p) => '<option>' + p + '</option>').join('') + '</select></label>' +
    '<label class="field-label">Cidade/região<select id="filter-city" class="field"><option value="">Todas</option>' + [...new Set(state.athletes.map((a) => a.city))].sort().map((c) => '<option>' + escapeHtml(c) + '</option>').join('') + '</select></label>' +
    '<label class="field-label">Idade<select id="filter-age" class="field"><option value="">Todas</option>' + [...new Set(state.athletes.map((a) => a.age))].sort((a,b)=>a-b).map((age) => '<option value="' + age + '">' + age + '</option>').join('') + '</select></label>' +
    '<label class="field-label">Categoria<select id="filter-category" class="field"><option value="">Todas</option><option>Sub-7</option><option>Sub-9</option><option>Sub-11</option><option>Sub-13</option><option>Sub-15</option><option>Sub-17</option><option>Sub-20</option></select></label>' +
    '</div><div class="mt-6 rounded-2xl border border-[#d4ad59]/15 bg-[#d4ad59]/7 p-4 text-xs leading-5 text-white/55"><strong class="text-[#e2bb62]">Filtro em tempo real</strong><br/>Nome, posição, cidade, idade e categoria alteram a lista sem recarregar.</div></aside>'

  return shell(
    '<div class="flex flex-wrap items-end justify-between gap-4"><div><span class="eyebrow">Banco de talentos</span><h1 class="page-title">Pesquisar atletas</h1><p class="page-subtitle">Abra o perfil completo, mande uma mensagem, vote e registre uma avaliação.</p></div><button type="button" class="btn-primary" data-action="openTryout">' + icon('plus', 'size-4') + ' Nova peneira</button></div>' +
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
    const profile = account?.profile || { name: state.user.name, email: state.user.email, phone: '', position: 'Funcionário', city: 'São Paulo', state: 'SP' }
    return shell(
      '<div class="flex flex-wrap items-end justify-between gap-4"><div><span class="eyebrow">Meu perfil</span><h1 class="page-title">' + escapeHtml(profile.name) + '</h1><p class="page-subtitle">Dados do funcionário que está conectado.</p></div><button type="button" class="btn-secondary" data-action="logout">' + icon('logout', 'size-4') + ' Sair</button></div>' +
      '<section class="mt-6 grid gap-5 md:grid-cols-2"><aside class="panel"><div class="flex items-center gap-4"><div class="avatar-xl">' + avatar(profile.name) + '</div><div><p class="text-xs uppercase tracking-[.2em] text-white/35">Funcionário</p><h2 class="mt-1 text-2xl font-black">' + escapeHtml(profile.position || 'Profissional') + '</h2><p class="text-sm text-white/45">' + escapeHtml(profile.city) + '/' + escapeHtml(profile.state) + '</p></div></div></aside><div class="panel"><span class="eyebrow">Acesso demo</span><h2 class="section-title">Credenciais de teste</h2><p class="mt-4 text-sm leading-6 text-white/55">E-mail: funcionario@academiapelé.com<br/>Senha: Academia123!</p><button type="button" class="btn-primary mt-5" data-route="athletes">Ir para o banco de atletas ' + icon('arrow', 'size-4') + '</button></div></section>',
      { active: 'dashboard', role: 'staff' },
    )
  }

  const p = state.profile || defaultProfile
  const age = getAgeFromProfile(p.birth)
  const category = getCategoryFromAge(age)
  return shell(
    '<div class="flex flex-wrap items-end justify-between gap-4"><div><span class="eyebrow">Meu perfil</span><h1 class="page-title">' + escapeHtml(p.name) + '</h1><p class="page-subtitle">Mantenha seus dados pessoais, categoria, cidade e posições atualizados.</p></div><button type="button" class="btn-secondary" data-action="logout">' + icon('logout', 'size-4') + ' Sair</button></div>' +
    '<section class="mt-6 grid gap-5 xl:grid-cols-[.75fr_1.25fr]">' +
    '<aside class="panel"><div class="flex items-center gap-4"><div class="avatar-xl">' + avatar(p.name) + '</div><div><p class="text-xs uppercase tracking-[.2em] text-white/35">Atleta</p><h2 class="mt-1 text-2xl font-black">' + escapeHtml(p.pos) + '</h2><p class="text-sm text-white/45">' + age + ' anos • ' + escapeHtml(category) + '</p></div></div>' +
    '<div class="mt-6 grid grid-cols-2 gap-3">' + stat(averagePlayerRating(p), 'Avaliação', 'média atual') + stat(String(state.tryouts.filter((t) => Array.isArray(t.enrolled) && t.enrolled.includes(state.user.email)).length).padStart(2, '0'), 'Peneiras', 'inscritas') + stat(String(getPlayerReviewCount()).padStart(2, '0'), 'Avaliações', 'recebidas') + stat(String(state.notifications.length).padStart(2, '0'), 'Notificações', 'recentes') + '</div>' +
    '<div class="mt-6 flex flex-wrap gap-2">' + tag(p.pos) + tag(p.secondary, true) + tag(category) + tag(p.city) + '</div></aside>' +
    '<div class="panel"><div class="flex items-center justify-between"><div><span class="eyebrow">Dados do jogador</span><h2 class="section-title">Atualizar perfil</h2></div>' + icon('edit', 'size-5 text-[#e1bb62]') + '</div>' +
    '<form id="profile-form" class="mt-5 grid gap-4 sm:grid-cols-2">' +
    input('Nome completo', 'profile-name', p.name, 'text', true) +
    input('CPF', 'profile-cpf', p.cpf || '', 'text', false, true) +
    input('Data de nascimento', 'profile-birth', p.birth, 'date', true) +
    input('Idade', 'profile-age', String(age), 'number', false, false, true) +
    '<label class="field-label">Categoria<select id="profile-category" class="field" disabled><option>' + escapeHtml(category) + '</option></select></label>' +
    selectField('Gênero', 'profile-gender', GENDERS, p.gender) +
    input('E-mail', 'profile-email', p.email, 'email', true) + input('Telefone', 'profile-phone', p.phone, 'tel', true) +
    selectField('Posição principal', 'profile-pos', POSITIONS, p.pos) + selectField('Posição secundária', 'profile-secondary', ['—'].concat(POSITIONS), p.secondary) +
    '<div class="sm:col-span-2 mt-2 border-t border-white/8 pt-5"><p class="text-sm font-bold">Endereço</p></div>' +
    input('CEP', 'profile-zip', p.zip, 'text', true) + input('Cidade', 'profile-city', p.city, 'text', true) + input('Estado', 'profile-state', p.state, 'text', true) + input('Bairro', 'profile-district', p.district, 'text', true) +
    input('Endereço', 'profile-address', p.address, 'text', true) + input('Número', 'profile-number', p.number, 'text', true) +
    '<div class="sm:col-span-2 flex justify-end"><button class="btn-primary" type="submit">Salvar alterações ' + icon('check', 'size-4') + '</button></div></form></div></section>' +
    '<section class="mt-6 panel"><div class="flex items-center justify-between"><div><span class="eyebrow">Olheiros</span><h2 class="section-title">Comentários e notas</h2></div><span class="tag">' + getPlayerReviewCount() + ' registro(s)</span></div><div class="mt-5 grid gap-4 md:grid-cols-2">' + renderPlayerReviews() + '</div></section>',
    { active: 'profile', role: 'player' },
  )
}

function renderPlayerReviews() {
  const profileAthlete = getCurrentAthlete()
  const reviews = state.reviews[profileAthlete?.id] || []
  if (!reviews.length) {
    return '<div class="md:col-span-2 rounded-2xl border border-dashed border-white/10 p-8 text-center text-white/40">Ainda não há avaliações registradas para este perfil.</div>'
  }
  return reviews.map(reviewCard).join('')
}

function reviewCard(review) {
  return '<article class="rounded-2xl border border-white/8 bg-white/[.025] p-5"><div class="flex items-start justify-between gap-3"><div class="flex items-center gap-3"><span class="avatar">' + avatar(review.author || 'Olheiro') + '</span><div><p class="font-semibold">' + escapeHtml(review.author || 'Olheiro') + '</p><p class="text-xs text-white/35">' + escapeHtml(review.date || 'Agora') + '</p></div></div><div class="rounded-xl border border-[#d4ad59]/20 bg-[#d4ad59]/8 px-3 py-2 text-sm font-black text-[#e2bb62]">' + escapeHtml(review.rating) + '</div></div><p class="mt-4 text-sm leading-6 text-white/65">“' + escapeHtml(review.comment) + '”</p></article>'
}

function tryoutsPage() {
  const role = state.user?.role === 'staff' ? 'staff' : 'player'
  const createButton = role === 'staff' ? '<button type="button" class="btn-primary" data-action="openTryout">' + icon('plus', 'size-4') + ' Criar peneira</button>' : ''
  return shell(
    '<div class="flex flex-wrap items-end justify-between gap-4"><div><span class="eyebrow">Calendário</span><h1 class="page-title">Peneiras</h1><p class="page-subtitle">Veja oportunidades, posições, categoria, vagas e sua inscrição.</p></div>' + createButton + '</div>' +
    '<div class="mt-6 grid gap-4 lg:grid-cols-3">' + state.tryouts.map(tryoutCard).join('') + '</div>',
    { active: 'tryouts', role },
  )
}

function tryoutCard(t) {
  const email = state.user?.email || ''
  const enrolled = Array.isArray(t.enrolled) && t.enrolled.includes(email)
  const vacancies = Math.max(0, Number(t.seats) - (Array.isArray(t.enrolled) ? t.enrolled.length : 0))
  const playerCategory = getCategoryFromAge(getAgeFromProfile(state.profile?.birth))
  const playerPos = state.profile?.pos
  const canEnroll = state.user?.role === 'staff' || ((t.positions.includes(playerPos) || t.positions.includes(state.profile?.secondary)) && (!t.category || t.category === playerCategory))
  const button = state.user?.role === 'staff'
    ? '<button type="button" class="btn-secondary mt-6 w-full" data-action="view-enrolled" data-id="' + t.id + '">Ver inscritos ' + icon('arrow', 'size-4') + '</button>'
    : '<button type="button" class="btn-' + (enrolled ? 'secondary' : 'primary') + ' mt-6 w-full" data-action="enroll" data-id="' + t.id + '" ' + (!enrolled && (!canEnroll || vacancies === 0) ? 'disabled' : '') + '>' +
      (enrolled ? 'Inscrição confirmada' : vacancies === 0 ? 'Sem vagas' : canEnroll ? 'Inscrever-me' : 'Posição/categoria incompatível') + ' ' + icon(enrolled ? 'check' : 'arrow', 'size-4') + '</button>'

  return '<article class="panel flex flex-col"><div class="flex items-start justify-between gap-3"><div class="flex flex-wrap gap-1.5">' + tag(t.category || 'Aberta') + tag(t.positions.join(' • '), true) + '</div><span class="text-xs text-white/35">' + vacancies + ' vaga(s)</span></div>' +
    '<h2 class="mt-4 text-xl font-black">' + escapeHtml(t.title) + '</h2><div class="mt-5 space-y-3 text-sm text-white/55">' +
    '<p class="flex gap-2">' + icon('calendar', 'size-4 text-[#e2bb62]') + formatDate(t.date) + ' • ' + escapeHtml(t.time) + '</p>' +
    '<p class="flex gap-2">' + icon('pin', 'size-4 text-[#e2bb62]') + escapeHtml(t.location) + ' — ' + escapeHtml(t.city) + '/' + escapeHtml(t.state) + '</p></div>' +
    '<div class="mt-6 h-2 overflow-hidden rounded-full bg-white/8"><div class="h-full rounded-full bg-[#d4ad59]" style="width:' + Math.min(100, (Array.isArray(t.enrolled) ? t.enrolled.length : 0) / Math.max(1, Number(t.seats)) * 100) + '%"></div></div>' + button + '</article>'
}

function messagesPage() {
  const staff = state.user?.role === 'staff'
  const conversations = staff
    ? state.athletes.map((a) => ({ name: a.name, subtitle: a.pos + ' • ' + a.city, avatar: a.name, id: 'a' + a.id, athleteId: a.id }))
    : [
      { name: 'Bruno Martins', subtitle: 'Treinador • Academia Pelé', avatar: 'Bruno Martins', id: 'staff1' },
      { name: 'Marina Lopes', subtitle: 'Olheira • São Paulo', avatar: 'Marina Lopes', id: 'staff2' },
    ]

  const selected = conversations.find((c) => c.id === activeThread) || conversations[0]
  activeThread = selected.id
  const history = state.messages.filter((m) => m.thread === selected.id)

  return shell(
    '<div><span class="eyebrow">Comunicação</span><h1 class="page-title">Conversas</h1><p class="page-subtitle">' + (staff ? 'Pesquise qualquer atleta do banco, abra a conversa e envie uma mensagem.' : 'Converse com treinadores e olheiros disponíveis.') + '</p></div>' +
    '<section class="mt-6 grid min-h-[620px] overflow-hidden rounded-[28px] border border-white/10 bg-white/[.025] md:grid-cols-[300px_1fr]">' +
    '<aside class="border-b border-white/8 bg-black/20 md:border-b-0 md:border-r"><div class="p-4"><label class="field-label">Pesquisar ' + (staff ? 'atleta' : 'profissional') + '<input id="conversation-search" class="field mt-2" placeholder="Digite um nome, posição ou cidade..." /></label></div>' +
    '<div id="conversation-list" class="space-y-1 p-2">' + conversations.map((c) => '<button type="button" class="conversation-item ' + (c.id === selected.id ? 'selected' : '') + '" data-thread="' + c.id + '" data-name="' + escapeHtml(c.name) + '"><span class="avatar">' + avatar(c.avatar) + '</span><span class="min-w-0 text-left"><strong class="block truncate">' + escapeHtml(c.name) + '</strong><small class="block truncate text-white/35">' + escapeHtml(c.subtitle) + '</small></span></button>').join('') + '</div></aside>' +
    '<div class="flex min-w-0 flex-col"><header class="flex items-center justify-between gap-3 border-b border-white/8 px-5 py-4"><div class="flex items-center gap-3"><span class="avatar">' + avatar(selected.avatar) + '</span><div><p class="font-bold">' + escapeHtml(selected.name) + '</p><p class="text-xs text-emerald-300">Disponível para conversar</p></div></div>' + tag(staff ? selected.subtitle : 'Canal seguro') + '</header>' +
    '<div id="chat-messages" class="flex-1 space-y-3 overflow-y-auto p-5">' + renderHistory(history, staff) + '</div>' +
    '<form id="message-form" class="border-t border-white/8 p-4"><div class="flex gap-2"><input id="message-input" class="field" placeholder="Escreva sua mensagem..." autocomplete="off" required/><button class="btn-primary shrink-0" aria-label="Enviar mensagem">' + icon('arrow', 'size-4') + '</button></div></form></div></section>',
    { active: 'messages', role: staff ? 'staff' : 'player' },
  )
}

function renderHistory(history, staff) {
  const messages = history.length
    ? history
    : [{ from: 'them', text: staff ? 'Olá! Seu perfil entrou no meu radar. Podemos conversar sobre seu momento atual?' : 'Olá! Vi sua atividade na Academia Pelé e gostaria de falar sobre uma oportunidade.' }]

  return messages.map(messageBubble).join('')
}

function messageBubble(message) {
  const mine = message.from === 'me'
  return '<div class="flex ' + (mine ? 'justify-end' : '') + '"><div class="max-w-[78%] rounded-2xl ' + (mine ? 'rounded-br-md bg-[#d8af58] text-black' : 'rounded-bl-md border border-white/8 bg-white/[.045] text-white') + ' px-4 py-3 text-sm leading-6"><p>' + escapeHtml(message.text) + '</p><p class="mt-1 text-[10px] opacity-50">' + escapeHtml(message.time || 'Agora') + '</p></div></div>'
}

function loginPage() {
  return '<div class="min-h-screen bg-[radial-gradient(circle_at_center,_rgba(210,173,88,.12),_transparent_30%),#070707] px-4 py-8 text-white"><div class="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-[32px] border border-white/10 bg-white/[.025] lg:grid-cols-[.95fr_1.05fr]">' +
    '<div class="relative hidden overflow-hidden border-r border-white/8 bg-[radial-gradient(circle_at_30%_20%,rgba(216,176,88,.24),transparent_25%),#0c0c0c] p-10 lg:flex lg:flex-col lg:justify-between"><div><img src="./assets/brand/simbolo.jpg" alt="Academia Pelé" class="h-28 w-28 rounded-3xl object-contain"/><span class="eyebrow mt-8">TF3 • Sprint 3</span><h1 class="mt-4 max-w-lg text-5xl font-black leading-tight">Onde o futebol encontra <span class="text-[#e1bb62]">o próximo talento.</span></h1><p class="mt-5 max-w-xl text-white/50">Uma experiência para atletas, treinadores, funcionários e olheiros se encontrarem.</p></div><div class="text-sm text-white/30">Academia Pelé • Plataforma de talentos</div></div>' +
    '<div class="flex items-center justify-center p-6 sm:p-10"><div class="w-full max-w-md"><img src="./assets/brand/simbolo.jpg" alt="Academia Pelé" class="mx-auto h-24 w-24 rounded-3xl object-contain lg:hidden"/><span class="eyebrow mt-6">Acesso</span><h2 class="mt-3 text-3xl font-black">Entrar na Academia Pelé</h2><p class="mt-2 text-sm text-white/45">Escolha o tipo de conta antes de entrar.</p>' +
    '<div class="mt-6 grid grid-cols-2 gap-2 rounded-2xl border border-white/8 bg-black/25 p-1"><button type="button" class="role-tab active" data-role="player">Jogador</button><button type="button" class="role-tab" data-role="staff">Funcionário</button></div>' +
    '<form id="login-form" class="mt-6 space-y-4">' + input('E-mail', 'login-email', '', 'email', true) + input('Senha', 'login-password', '', 'password', true) + '<p id="login-error" class="hidden rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-200"></p><button class="btn-primary w-full" type="submit">Entrar ' + icon('arrow', 'size-4') + '</button></form>' +
    '<div class="my-6 flex items-center gap-3"><span class="h-px flex-1 bg-white/8"></span><span class="text-xs text-white/25">ou</span><span class="h-px flex-1 bg-white/8"></span></div>' +
    '<button type="button" class="btn-secondary w-full" data-route="register">Criar conta de jogador</button><button type="button" class="mt-3 w-full text-center text-xs text-white/35 hover:text-white" data-action="demo">Entrar com conta demo</button>' +
    '<p class="mt-5 text-center text-[11px] leading-5 text-white/30">Conta de funcionário para teste: funcionario@academiapelé.com / Academia123!</p></div></div></div></div>'
}

function registerPage() {
  return '<div class="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(216,176,88,.1),transparent_28%),#070707] px-4 py-8 text-white"><div class="mx-auto max-w-5xl rounded-[32px] border border-white/10 bg-white/[.025] p-6 sm:p-10">' +
    '<div class="flex flex-wrap items-center justify-between gap-4"><div class="flex items-center gap-3"><img src="./assets/brand/simbolo.jpg" alt="Academia Pelé" class="h-16 w-16 rounded-2xl object-contain"/><div><span class="eyebrow">Cadastro</span><h1 class="mt-1 text-3xl font-black">Criar conta de jogador</h1></div></div><button type="button" class="btn-ghost" data-route="login">Voltar</button></div>' +
    '<p class="mt-3 max-w-3xl text-sm leading-6 text-white/45">Preencha seus dados pessoais, categoria esportiva, gênero, posições e endereço. A idade e a categoria são calculadas automaticamente pela data de nascimento.</p>' +
    '<form id="register-form" class="mt-8 grid gap-4 sm:grid-cols-2">' +
    input('Nome completo', 'reg-name', '', 'text', true) +
    input('CPF', 'reg-cpf', '', 'text', true) +
    input('Data de nascimento', 'reg-birth', '', 'date', true) +
    input('Idade', 'reg-age', '', 'number', false, false, true) +
    '<label class="field-label">Categoria<select id="reg-category" class="field" disabled><option>Preencha a data de nascimento</option></select></label>' +
    selectField('Gênero', 'reg-gender', GENDERS, '') +
    input('E-mail', 'reg-email', '', 'email', true) +
    input('Telefone', 'reg-phone', '', 'tel', true) +
    selectField('Posição principal', 'reg-pos', POSITIONS, '') +
    selectField('Posição secundária', 'reg-secondary', ['—'].concat(POSITIONS), '—') +
    '<div class="sm:col-span-2 mt-2 rounded-2xl border border-white/8 bg-black/15 p-4"><p class="text-sm font-bold">Endereço</p><p class="mt-1 text-xs text-white/35">A cidade informada aqui será usada também nos filtros de região.</p></div>' +
    input('CEP', 'reg-zip', '', 'text', true) +
    input('Cidade', 'reg-city', '', 'text', true) +
    input('Estado', 'reg-state', '', 'text', true) +
    input('Bairro', 'reg-district', '', 'text', true) +
    input('Endereço', 'reg-address', '', 'text', true) +
    input('Número', 'reg-number', '', 'text', true) +
    input('Senha', 'reg-password', '', 'password', true) +
    input('Confirmar senha', 'reg-confirm', '', 'password', true) +
    '<div id="reg-feedback" class="sm:col-span-2 hidden rounded-2xl border px-4 py-3 text-sm" role="alert"></div>' +
    '<div class="sm:col-span-2 flex flex-wrap items-center justify-between gap-3 pt-3"><p class="max-w-2xl text-xs leading-5 text-white/35">Nesta versão front-end, os dados são armazenados localmente no navegador para permitir a demonstração do fluxo. Não use senhas reais.</p><button class="btn-primary" type="submit">Criar conta ' + icon('check', 'size-4') + '</button></div>' +
    '</form></div></div>'
}

function input(label, id, value = '', type = 'text', required = false, disabled = false, readonly = false) {
  return '<label class="field-label">' + escapeHtml(label) + '<input id="' + id + '" class="field" type="' + type + '" value="' + escapeHtml(value) + '"' + (required ? ' required' : '') + (disabled ? ' disabled' : '') + (readonly ? ' readonly' : '') + ' /></label>'
}

function selectField(label, id, options, selected = '') {
  return '<label class="field-label">' + escapeHtml(label) + '<select id="' + id + '" class="field" required>' + options.map((option) => '<option value="' + escapeHtml(option) + '" ' + (String(option) === String(selected) ? 'selected' : '') + '>' + escapeHtml(option) + '</option>').join('') + '</select></label>'
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
  const email = state.user?.email
  if (email === 'funcionario@academiapelé.com' || state.user?.role === 'staff') return null
  const profile = state.profile
  if (profile && profile.name === 'Gabriel Martins') return state.athletes.find((a) => a.id === 1)
  return state.athletes.find((a) => a.name === profile?.name) || null
}

function getPlayerReviewCount() {
  const athlete = getCurrentAthlete()
  return athlete ? (state.reviews[athlete.id] || []).length : 0
}

function averagePlayerRating(profile) {
  const athlete = state.athletes.find((a) => a.name === profile?.name) || getCurrentAthlete()
  if (!athlete) return '—'
  const reviews = state.reviews[athlete.id] || []
  if (!reviews.length) return athlete.rating.toFixed(1).replace('.', ',')
  const average = reviews.reduce((sum, review) => sum + Number(review.rating), 0) / reviews.length
  return average.toFixed(1).replace('.', ',')
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
    '<div class="flex items-start justify-between gap-4"><div class="flex items-center gap-4"><div class="avatar-xl bg-gradient-to-br ' + athlete.color + '">' + avatar(athlete.name) + '</div><div><span class="eyebrow">Perfil do atleta</span><h2 id="athlete-modal-title" class="mt-1 text-2xl font-black">' + escapeHtml(athlete.name) + '</h2><p class="text-sm text-white/45">' + athlete.age + ' anos • ' + escapeHtml(athlete.city) + '/' + escapeHtml(athlete.state) + '</p></div></div><button type="button" class="icon-button" data-close-modal aria-label="Fechar">' + icon('close') + '</button></div>' +
    '<div class="mt-6 flex flex-wrap gap-2">' + tag(athlete.pos) + tag(athlete.secondary, true) + tag(getCategoryFromAge(athlete.age)) + tag(athlete.gender || 'Não informado', true) + '</div>' +
    '<div class="mt-6 grid gap-4 md:grid-cols-3"><div class="panel"><p class="text-xs text-white/35">Avaliação média</p><p class="mt-2 text-3xl font-black text-[#e6bd62]">' + athlete.rating.toFixed(1) + '</p></div><div class="panel"><p class="text-xs text-white/35">Votos</p><p class="mt-2 text-3xl font-black">' + (athlete.votes + (state.votes[athlete.id] || 0)) + '</p></div><div class="panel"><p class="text-xs text-white/35">Status</p><p class="mt-2 text-lg font-black">' + escapeHtml(athlete.status) + '</p></div></div>' +
    '<div class="mt-6"><span class="eyebrow">Atributos</span><div class="mt-3 flex flex-wrap gap-2">' + (athlete.tags || []).map((item) => tag(item)).join('') + '</div></div>' +
    '<div class="mt-6 flex flex-wrap gap-2"><button type="button" class="btn-primary" data-message-athlete="' + athlete.id + '">' + icon('message', 'size-4') + ' Abrir conversa</button><button type="button" class="btn-secondary" data-vote="' + athlete.id + '">' + icon('star', 'size-4') + ' Votar</button>' +
    (state.user?.role === 'staff' ? '<button type="button" class="btn-secondary" data-review-athlete="' + athlete.id + '">' + icon('edit', 'size-4') + ' Registrar avaliação</button>' : '') + '</div>' +
    '<section class="mt-8"><div class="flex items-center justify-between gap-3"><div><span class="eyebrow">Avaliações</span><h3 class="section-title">' + reviews.length + ' registro(s)</h3></div></div><div class="mt-4 grid gap-4 md:grid-cols-2">' + (reviews.length ? reviews.map(reviewCard).join('') : '<div class="md:col-span-2 rounded-2xl border border-dashed border-white/10 p-8 text-center text-white/40">Nenhuma avaliação registrada ainda.</div>') + '</div></section>' +
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
    registerVote(state, Number(button.dataset.vote))
    persist()
    button.textContent = 'Votado ✓'
    button.disabled = true
    toast('Voto registrado com sucesso.')
  }))
  wrapper.querySelectorAll('[data-review-athlete]').forEach((button) => button.addEventListener('click', () => {
    wrapper.remove()
    openReviewModal(Number(button.dataset.reviewAthlete))
  }))
}

function startConversationForAthlete(id) {
  activeThread = 'a' + id
  go('messages')
}

function openReviewModal(athleteId) {
  if (state.user?.role !== 'staff') return
  const athlete = state.athletes.find((a) => a.id === athleteId)
  if (!athlete) return

  const wrapper = document.createElement('div')
  wrapper.className = 'fixed inset-0 z-[95] grid place-items-center bg-black/75 p-4 backdrop-blur-md'
  wrapper.innerHTML =
    '<div class="w-full max-w-xl rounded-[28px] border border-white/10 bg-[#111] p-6 shadow-2xl sm:p-8" role="dialog" aria-modal="true" aria-labelledby="review-modal-title">' +
    '<div class="flex items-start justify-between gap-4"><div><span class="eyebrow">Avaliação</span><h2 id="review-modal-title" class="mt-2 text-2xl font-black">Avaliar ' + escapeHtml(athlete.name) + '</h2></div><button type="button" class="icon-button" data-close>' + icon('close') + '</button></div>' +
    '<form id="review-form" class="mt-6 space-y-4"><label class="field-label">Nota (0 a 10)<input id="review-rating" class="field" type="number" min="0" max="10" step="0.1" value="8.0" required/></label><label class="field-label">Comentário<textarea id="review-comment" class="field min-h-32 resize-y" required placeholder="Descreva pontos fortes e aspectos observados..."></textarea></label><p id="review-error" class="hidden text-xs text-rose-300"></p><div class="flex justify-end gap-2"><button type="button" class="btn-secondary" data-close>Cancelar</button><button type="submit" class="btn-primary">Salvar avaliação ' + icon('check', 'size-4') + '</button></div></form></div>'

  document.body.appendChild(wrapper)
  wrapper.querySelectorAll('[data-close]').forEach((button) => button.addEventListener('click', () => wrapper.remove()))
  wrapper.querySelector('#review-form').addEventListener('submit', (event) => {
    event.preventDefault()
    const rating = Number(wrapper.querySelector('#review-rating').value)
    const comment = wrapper.querySelector('#review-comment').value.trim()
    if (!Number.isFinite(rating) || rating < 0 || rating > 10) {
      const error = wrapper.querySelector('#review-error')
      error.textContent = 'Informe uma nota entre 0 e 10.'
      error.classList.remove('hidden')
      return
    }
    if (comment.length < 10) {
      const error = wrapper.querySelector('#review-error')
      error.textContent = 'Escreva um comentário com pelo menos 10 caracteres.'
      error.classList.remove('hidden')
      return
    }
    const list = state.reviews[athleteId] || []
    list.unshift({ id: Date.now(), author: state.user?.name || 'Olheiro', rating: rating.toFixed(1), comment, date: 'Agora' })
    state.reviews[athleteId] = list
    state.notifications.unshift({ id: Date.now(), title: 'Avaliação registrada', text: 'Uma avaliação foi adicionada ao perfil de ' + athlete.name + '.', time: 'Agora' })
    persist()
    wrapper.remove()
    toast('Avaliação salva.')
    openAthleteModal(athleteId)
  })
}

function openLocationModal(onSelect) {
  const panel = document.createElement('div')
  panel.className = 'fixed inset-0 z-[100] grid place-items-center bg-black/70 p-4'
  panel.innerHTML =
    '<div class="w-full max-w-md rounded-3xl border border-white/10 bg-[#151515] p-6" role="dialog" aria-modal="true" aria-labelledby="location-title">' +
    '<div class="flex items-center justify-between"><div><span class="eyebrow">Localidade</span><h3 id="location-title" class="mt-1 text-xl font-black">Confirmar local da peneira</h3></div><button type="button" class="icon-button" data-close>' + icon('close') + '</button></div>' +
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
    '<div class="flex items-start justify-between gap-4"><div><span class="eyebrow">Nova peneira</span><h2 id="tryout-title" class="mt-2 text-2xl font-black">Criar e agendar</h2></div><button type="button" class="icon-button" data-close>' + icon('close') + '</button></div>' +
    '<form id="tryout-form" class="mt-6 grid gap-4 sm:grid-cols-2">' +
    input('Nome da peneira', 'try-title', '', 'text', true) +
    input('Data', 'try-date', '', 'date', true) +
    input('Horário', 'try-time', '', 'time', true) +
    input('Quantidade de vagas', 'try-seats', '12', 'number', true) +
    '<label class="field-label">Categoria<select id="try-category" class="field" required><option>Sub-7</option><option>Sub-9</option><option>Sub-11</option><option>Sub-13</option><option>Sub-15</option><option selected>Sub-20</option></select></label>' +
    '<div class="sm:col-span-2"><p class="field-label mb-2">Localidade</p><button type="button" id="location-button" class="field flex items-center justify-between text-left"><span id="location-value" class="text-white/35">Selecionar local...</span>' + icon('pin', 'size-4 text-[#e2bb62]') + '</button></div>' +
    '<div class="sm:col-span-2"><p class="field-label">Posições disponíveis</p><div class="mt-2 grid grid-cols-2 gap-2 rounded-2xl border border-white/8 bg-black/20 p-3 sm:grid-cols-3">' +
    POSITIONS.map((p, i) => '<label class="check-pill"><input type="checkbox" name="position" value="' + escapeHtml(p) + '" ' + (i === 6 ? 'checked' : '') + '/><span>' + escapeHtml(p) + '</span></label>').join('') +
    '</div></div>' +
    '<div id="tryout-error" class="sm:col-span-2 hidden rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200" role="alert"></div>' +
    '<div class="flex justify-end gap-2 sm:col-span-2"><button type="button" class="btn-secondary" data-close>Cancelar</button><button class="btn-primary" type="submit">Criar peneira ' + icon('check', 'size-4') + '</button></div></form></div>'

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

    const match = location.match(/^(.+?) — ([A-Za-zÀ-ÿ ]+\\/\\s?[A-Z]{2})$/)
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
    })
    state.notifications.unshift({ id: Date.now(), title: 'Nova peneira criada', text: title + ' foi publicada.', time: 'Agora' })
    persist()
    wrapper.remove()
    render()
    toast('Peneira criada e publicada.')
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
    '<div class="max-h-[86vh] w-full max-w-xl overflow-y-auto rounded-[28px] border border-white/10 bg-[#111] p-6" role="dialog" aria-modal="true"><div class="flex items-start justify-between gap-3"><div><span class="eyebrow">Inscritos</span><h2 class="mt-2 text-2xl font-black">' + escapeHtml(tryout.title) + '</h2></div><button type="button" class="icon-button" data-close>' + icon('close') + '</button></div><div class="mt-5 space-y-2">' +
    (profiles.length ? profiles.map((profile) => '<div class="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[.03] p-4"><div class="flex items-center gap-3"><span class="avatar">' + avatar(profile.name) + '</span><div><p class="font-semibold">' + escapeHtml(profile.name) + '</p><p class="text-xs text-white/35">' + escapeHtml(profile.pos) + ' • ' + escapeHtml(getCategoryFromAge(getAgeFromProfile(profile.birth))) + ' • ' + escapeHtml(profile.city) + '</p></div></div><button type="button" class="btn-ghost" data-message-email="' + escapeHtml(profile.email) + '">Mensagem</button></div>').join('') : '<div class="rounded-2xl border border-dashed border-white/10 p-8 text-center text-white/40">Ainda não há inscritos nesta peneira.</div>') +
    '</div></div>'

  document.body.appendChild(wrapper)
  wrapper.querySelector('[data-close]').addEventListener('click', () => wrapper.remove())
  wrapper.querySelectorAll('[data-message-email]').forEach((button) => button.addEventListener('click', () => {
    const profile = state.accounts.find((account) => account.email === button.dataset.messageEmail)?.profile
    if (!profile) return
    const athlete = state.athletes.find((a) => a.name === profile.name)
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
    '<div class="flex items-center justify-between gap-3"><div><span class="eyebrow">Central</span><h2 id="notifications-title" class="mt-1 text-2xl font-black">Notificações</h2></div><button type="button" class="icon-button" data-close>' + icon('close') + '</button></div>' +
    '<div class="mt-5 space-y-2">' +
    (state.notifications.length ? state.notifications.map((n) => '<article class="rounded-2xl border border-white/8 bg-white/[.03] p-4"><div class="flex items-start justify-between gap-3"><div><p class="font-semibold">' + escapeHtml(n.title) + '</p><p class="mt-1 text-sm text-white/50">' + escapeHtml(n.text) + '</p></div><span class="text-xs text-white/30">' + escapeHtml(n.time) + '</span></div></article>').join('') : '<div class="rounded-2xl border border-dashed border-white/10 p-8 text-center text-white/40">Nenhuma notificação.</div>') +
    '</div><button type="button" class="btn-secondary mt-5 w-full" data-clear-notifications>Marcar como lidas</button></div>'

  document.body.appendChild(wrapper)
  wrapper.querySelector('[data-close]').addEventListener('click', () => wrapper.remove())
  wrapper.querySelector('[data-clear-notifications]').addEventListener('click', () => {
    state.notifications = []
    persist()
    wrapper.remove()
    toast('Notificações limpas.')
  })
}

function openMobileMenu() {
  const root = document.querySelector('#mobile-menu')
  if (!root) return
  root.innerHTML =
    '<div class="fixed inset-0 z-[70] bg-black/70 p-4 backdrop-blur-sm" data-close-mobile><div class="ml-auto w-[min(86vw,340px)] rounded-3xl border border-white/10 bg-[#111] p-4 shadow-2xl" role="dialog" aria-modal="true"><div class="flex items-center justify-between"><p class="font-bold">Navegação</p><button type="button" class="icon-button" data-close-mobile aria-label="Fechar menu">' + icon('close') + '</button></div><div class="mt-4 grid gap-2">' +
    (state.user?.role === 'staff'
      ? [['dashboard','Visão geral'],['athletes','Atletas'],['tryouts','Peneiras'],['messages','Conversas'],['profile','Perfil']]
      : [['dashboard','Início'],['profile','Meu perfil'],['tryouts','Peneiras'],['messages','Conversas']]
    ).map((item) => '<button type="button" class="nav-link justify-start" data-route="' + item[0] + '" data-close-mobile>' + item[1] + '</button>').join('') +
    '</div></div></div>'
  root.querySelectorAll('[data-route]').forEach((button) => button.addEventListener('click', () => { root.innerHTML = ''; go(button.dataset.route) }))
  root.querySelectorAll('[data-close-mobile]').forEach((button) => button.addEventListener('click', (event) => { if (event.target === button || button.hasAttribute('aria-label')) root.innerHTML = '' }))
}

function exportSelection() {
  const rows = [['Nome', 'Idade', 'Categoria', 'Gênero', 'Posição principal', 'Posição secundária', 'Cidade', 'Estado', 'Nota']]
  state.filteredAthletes.forEach((a) => rows.push([a.name, a.age, getCategoryFromAge(a.age), a.gender || '', a.pos, a.secondary, a.city, a.state, a.rating]))
  const csv = rows.map((row) => row.map((cell) => '"' + String(cell).replaceAll('"', '""') + '"').join(';')).join('\\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'academia-pele-atletas.csv'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
  toast('CSV exportado.')
}

function applyFilters() {
  const name = document.querySelector('#filter-name')?.value || ''
  const pos = document.querySelector('#filter-pos')?.value || ''
  const city = document.querySelector('#filter-city')?.value || ''
  const age = document.querySelector('#filter-age')?.value || ''
  const category = document.querySelector('#filter-category')?.value || ''
  const filtered = filterAthletes(state.athletes, { name, pos, city, age, category })
  state.filteredAthletes = filtered
  const grid = document.querySelector('#athlete-grid')
  if (grid) grid.innerHTML = filtered.map((a) => athleteCard(a, true)).join('') || '<div class="md:col-span-2 xl:col-span-3 rounded-2xl border border-dashed border-white/10 p-10 text-center text-white/40">Nenhum atleta encontrado com esses filtros.</div>'
  const count = document.querySelector('#athlete-count')
  if (count) count.textContent = filtered.length + ' atleta(s) encontrado(s)'
  bindDynamicCards()
}

function updateCategoryPreview(prefix) {
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

function saveProfile() {
  const p = state.profile || {}
  const birth = document.querySelector('#profile-birth').value
  const age = getAgeFromBirth(birth)
  const pos = document.querySelector('#profile-pos').value
  const secondary = document.querySelector('#profile-secondary').value
  if (!validBirthDate(birth) || age < 7 || age > 20) return showFeedback('profile-feedback', 'Informe uma data de nascimento válida para uma categoria até Sub-20.', true)
  if (pos === secondary && secondary !== '—') return showFeedback('profile-feedback', 'A posição secundária deve ser diferente da principal.', true)
  Object.assign(p, {
    name: document.querySelector('#profile-name').value.trim(),
    cpf: document.querySelector('#profile-cpf').value.trim(),
    birth,
    gender: document.querySelector('#profile-gender').value,
    email: normalizeEmail(document.querySelector('#profile-email').value),
    phone: document.querySelector('#profile-phone').value.trim(),
    pos,
    secondary,
    zip: document.querySelector('#profile-zip').value.trim(),
    city: document.querySelector('#profile-city').value.trim(),
    state: document.querySelector('#profile-state').value.trim().toUpperCase(),
    district: document.querySelector('#profile-district').value.trim(),
    address: document.querySelector('#profile-address').value.trim(),
    number: document.querySelector('#profile-number').value.trim(),
  })
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
  persist()
  render()
  toast('Dados do jogador atualizados.')
}

function registerAccount() {
  const name = document.querySelector('#reg-name').value.trim()
  const cpf = document.querySelector('#reg-cpf').value.trim()
  const birth = document.querySelector('#reg-birth').value
  const gender = document.querySelector('#reg-gender').value
  const email = normalizeEmail(document.querySelector('#reg-email').value)
  const phone = document.querySelector('#reg-phone').value.trim()
  const pos = document.querySelector('#reg-pos').value
  const secondary = document.querySelector('#reg-secondary').value
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
  if (!email || !email.includes('@')) return showFeedback('reg-feedback', 'Informe um e-mail válido.', true)
  if (!phone) return showFeedback('reg-feedback', 'Informe o telefone.', true)
  if (!pos) return showFeedback('reg-feedback', 'Selecione a posição principal.', true)
  if (!secondary) return showFeedback('reg-feedback', 'Selecione a posição secundária ou "—".', true)
  if (secondary === pos && secondary !== '—') return showFeedback('reg-feedback', 'A posição secundária deve ser diferente da principal.', true)
  if (!zip || !city || !region || !district || !address || !number) return showFeedback('reg-feedback', 'Preencha todo o endereço, incluindo cidade e estado.', true)
  if (password.length < 6) return showFeedback('reg-feedback', 'A senha precisa ter pelo menos 6 caracteres.', true)
  if (password !== confirm) return showFeedback('reg-feedback', 'As senhas não coincidem.', true)
  if (state.accounts.some((account) => account.email === email)) return showFeedback('reg-feedback', 'Já existe uma conta com esse e-mail.', true)
  if (state.accounts.some((account) => account.cpf && account.cpf === cpf.replace(/\\D/g, ''))) return showFeedback('reg-feedback', 'Já existe uma conta com esse CPF.', true)

  const profile = {
    name,
    cpf: cpf.replace(/\\D/g, ''),
    birth,
    gender,
    email,
    phone,
    pos,
    secondary,
    city,
    state: region,
    address,
    number,
    district,
    zip,
  }

  state.accounts.push({ email, password, role: 'player', cpf: profile.cpf, profile })
  state.profile = profile
  state.user = { name, email, role: 'player' }
  state.notifications.unshift({ id: Date.now(), title: 'Conta criada', text: 'Seu cadastro foi concluído com categoria ' + getCategoryFromAge(age) + '.', time: 'Agora' })
  persist()
  go('dashboard')
  toast('Conta criada com sucesso.')
}

function loginAccount() {
  const email = normalizeEmail(document.querySelector('#login-email').value)
  const password = document.querySelector('#login-password').value
  const role = document.querySelector('.role-tab.active')?.dataset.role || 'player'
  const errorId = 'login-error'

  if (!email || !email.includes('@')) return showFeedback(errorId, 'Informe um e-mail válido.', true)

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

function loginDemo() {
  const role = document.querySelector('.role-tab.active')?.dataset.role || 'player'
  if (role === 'staff') {
    state.user = { name: 'Marina Lopes', email: 'funcionario@academiapelé.com', role: 'staff' }
    state.profile = null
  } else {
    const demoEmail = 'gabriel@academiapelé.com'
    let account = state.accounts.find((entry) => entry.email === demoEmail)
    if (!account) {
      const profile = {
        ...defaultProfile,
        email: demoEmail,
        cpf: '11144477735',
      }
      account = { email: demoEmail, password: 'Demo123!', role: 'player', cpf: profile.cpf, profile }
      state.accounts.push(account)
    }
    state.user = { name: account.profile.name, email: account.email, role: 'player' }
    state.profile = account.profile
  }
  persist()
  go('dashboard')
  toast('Conta demo carregada.')
}

function initLoginRoleButtons() {
  document.querySelectorAll('[data-role]').forEach((button) => button.addEventListener('click', () => {
    document.querySelectorAll('[data-role]').forEach((item) => item.classList.toggle('active', item === button))
  }))
}

function bindDynamicCards() {
  document.querySelectorAll('[data-open-athlete]').forEach((button) => button.addEventListener('click', () => openAthleteModal(Number(button.dataset.openAthlete))))
  document.querySelectorAll('[data-message-athlete]').forEach((button) => button.addEventListener('click', () => startConversationForAthlete(Number(button.dataset.messageAthlete))))
  document.querySelectorAll('[data-favorite]').forEach((button) => button.addEventListener('click', (event) => {
    event.stopPropagation()
    toggleFavorite(state, Number(button.dataset.favorite))
    persist()
    render()
    toast(state.favorites.includes(Number(button.dataset.favorite)) ? 'Atleta adicionado aos favoritos.' : 'Atleta removido dos favoritos.')
  }))
  document.querySelectorAll('[data-vote]').forEach((button) => button.addEventListener('click', (event) => {
    event.stopPropagation()
    registerVote(state, Number(button.dataset.vote))
    persist()
    button.textContent = 'Votado ✓'
    button.disabled = true
    toast('Voto registrado com sucesso.')
  }))
}

function bind() {
  document.querySelectorAll('[data-route]').forEach((button) => button.addEventListener('click', () => go(button.dataset.route)))
  initLoginRoleButtons()
  bindDynamicCards()

  document.querySelectorAll('[data-action="notifications"]').forEach((button) => button.addEventListener('click', openNotifications))
  document.querySelectorAll('[data-action="menu"]').forEach((button) => button.addEventListener('click', openMobileMenu))

  document.querySelectorAll('[data-action="clearFilters"]').forEach((button) => button.addEventListener('click', () => {
    ;['filter-name', 'filter-pos', 'filter-city', 'filter-age', 'filter-category'].forEach((id) => {
      const field = document.querySelector('#' + id)
      if (field) field.value = ''
    })
    applyFilters()
  }))

  document.querySelectorAll('[data-action="export"]').forEach((button) => button.addEventListener('click', exportSelection))
  document.querySelectorAll('[data-action="logout"]').forEach((button) => button.addEventListener('click', () => {
    state.user = null
    state.profile = null
    persist()
    go('login')
    toast('Sessão encerrada.')
  }))

  document.querySelectorAll('[data-action="openTryout"]').forEach((button) => button.addEventListener('click', openTryoutModal))
  document.querySelectorAll('[data-action="view-enrolled"]').forEach((button) => button.addEventListener('click', () => openEnrolledModal(Number(button.dataset.id))))

  document.querySelectorAll('[data-action="enroll"]').forEach((button) => button.addEventListener('click', () => {
    const tryout = state.tryouts.find((item) => item.id === Number(button.dataset.id))
    if (!tryout || state.user?.role !== 'player') return
    const enrolled = Array.isArray(tryout.enrolled) ? tryout.enrolled : (tryout.enrolled = [])
    if (enrolled.includes(state.user.email)) return
    const vacancies = Number(tryout.seats) - enrolled.length
    const category = getCategoryFromAge(getAgeFromProfile(state.profile?.birth))
    const compatible = tryout.positions.includes(state.profile?.pos) || tryout.positions.includes(state.profile?.secondary)
    if (tryout.category && tryout.category !== category) return toast('Sua categoria não corresponde à desta peneira.', 'error')
    if (!compatible) return toast('Sua posição não está entre as posições aceitas.', 'error')
    if (vacancies <= 0) return toast('Não há mais vagas nesta peneira.', 'error')
    enrolled.push(state.user.email)
    state.notifications.unshift({ id: Date.now(), title: 'Inscrição confirmada', text: 'Você se inscreveu em ' + tryout.title + '.', time: 'Agora' })
    persist()
    render()
    toast('Inscrição confirmada.')
  }))

  const filterIds = ['filter-name', 'filter-pos', 'filter-city', 'filter-age', 'filter-category']
  filterIds.forEach((id) => {
    const field = document.querySelector('#' + id)
    if (field) field.addEventListener(field.tagName === 'INPUT' ? 'input' : 'change', applyFilters)
  })

  const registerForm = document.querySelector('#register-form')
  if (registerForm) {
    document.querySelector('#reg-cpf').addEventListener('input', (event) => formatCPF(event.target))
    document.querySelector('#reg-birth').addEventListener('change', () => updateCategoryPreview('reg'))
    document.querySelector('#reg-birth').addEventListener('input', () => updateCategoryPreview('reg'))
    registerForm.addEventListener('submit', (event) => { event.preventDefault(); registerAccount() })
  }

  const profileForm = document.querySelector('#profile-form')
  if (profileForm) {
    document.querySelector('#profile-birth').addEventListener('change', () => updateCategoryPreview('profile'))
    profileForm.addEventListener('submit', (event) => { event.preventDefault(); saveProfile() })
  }

  const loginForm = document.querySelector('#login-form')
  if (loginForm) loginForm.addEventListener('submit', (event) => { event.preventDefault(); loginAccount() })
  document.querySelectorAll('[data-action="demo"]').forEach((button) => button.addEventListener('click', loginDemo))

  const conversationSearch = document.querySelector('#conversation-search')
  if (conversationSearch) conversationSearch.addEventListener('input', () => {
    const items = [...document.querySelectorAll('[data-thread]')].map((el) => ({ name: el.dataset.name, subtitle: el.textContent, el }))
    const visible = searchConversations(items, conversationSearch.value)
    const visibleSet = new Set(visible.map((item) => item.el))
    items.forEach((item) => item.el.classList.toggle('hidden', !visibleSet.has(item.el)))
  })

  document.querySelectorAll('[data-thread]').forEach((button) => button.addEventListener('click', () => {
    activeThread = button.dataset.thread
    render()
  }))

  const messageForm = document.querySelector('#message-form')
  if (messageForm) messageForm.addEventListener('submit', (event) => {
    event.preventDefault()
    const inputField = document.querySelector('#message-input')
    const textValue = inputField.value.trim()
    if (!textValue) return
    const thread = activeThread || document.querySelector('[data-thread]')?.dataset.thread
    if (!thread) return
    state.messages.push({ id: Date.now(), thread, from: 'me', text: textValue, time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) })
    state.notifications.unshift({ id: Date.now() + 1, title: 'Mensagem enviada', text: 'Sua mensagem foi enviada.', time: 'Agora' })
    persist()
    inputField.value = ''
    render()
    toast('Mensagem enviada com sucesso.')
  })
}

function render() {
  const route = currentRoute()
  if (!state.user && !['login', 'register'].includes(route)) {
    go('login')
    return
  }
  if (state.user?.role === 'player' && route === 'athletes') {
    go('dashboard')
    return
  }

  let view
  if (route === 'login') view = loginPage()
  else if (route === 'register') view = registerPage()
  else if (route === 'dashboard') view = dashboard(state.user.role)
  else if (route === 'athletes') view = athletesPage()
  else if (route === 'profile') view = profilePage()
  else if (route === 'tryouts') view = tryoutsPage()
  else if (route === 'messages') view = messagesPage()
  else view = dashboard(state.user.role)

  app.innerHTML = view
  bind()
}

window.addEventListener('hashchange', render)
render()
