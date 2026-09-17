import './styles.css'
import { validCPF as validateCPF, maskCPF as formatCPF } from './validation.js'
import { filterAthletes } from './filters.js'
import { toggleFavorite, registerVote } from './feed.js'
import { saveMessage, searchConversations } from './messages.js'

const app = document.querySelector('#app')
let activeThread = null

const INITIAL = {
  user: JSON.parse(localStorage.getItem('ap_user') || 'null'),
  favorites: JSON.parse(localStorage.getItem('ap_favorites') || '[]'),
  votes: JSON.parse(localStorage.getItem('ap_votes') || '{}'),
  messages: JSON.parse(localStorage.getItem('ap_messages') || '[]'),
  profile: JSON.parse(localStorage.getItem('ap_profile') || 'null'),
  tryouts: JSON.parse(localStorage.getItem('ap_tryouts') || 'null') || [
    { id: 1, title: 'Peneira Sub-20 — Atacantes', date: '24/09/2026', time: '14:00', city: 'São Paulo - SP', positions: ['Atacante', 'Ponta'], seats: 12, enrolled: 8 },
    { id: 2, title: 'Avaliação Aberta — Meio-campo', date: '28/09/2026', time: '09:00', city: 'Osasco - SP', positions: ['Meia', 'Volante'], seats: 18, enrolled: 11 },
    { id: 3, title: 'Goleiros em Destaque', date: '04/10/2026', time: '10:30', city: 'Barueri - SP', positions: ['Goleiro'], seats: 8, enrolled: 5 },
  ],
}

const state = { ...INITIAL, athletes: [
  { id: 1, name: 'Gabriel Martins', age: 18, city: 'São Paulo', state: 'SP', pos: 'Atacante', secondary: 'Ponta', rating: 8.8, votes: 128, status: 'Em observação', color: 'from-amber-400 to-yellow-200' },
  { id: 2, name: 'Lucas Ferreira', age: 19, city: 'Osasco', state: 'SP', pos: 'Meia', secondary: 'Volante', rating: 8.4, votes: 94, status: 'Disponível', color: 'from-sky-400 to-cyan-200' },
  { id: 3, name: 'Rafael Souza', age: 17, city: 'Guarulhos', state: 'SP', pos: 'Zagueiro', secondary: 'Lateral', rating: 8.1, votes: 76, status: 'Em avaliação', color: 'from-violet-400 to-fuchsia-200' },
  { id: 4, name: 'João Vitor', age: 18, city: 'Campinas', state: 'SP', pos: 'Volante', secondary: 'Meia', rating: 8.6, votes: 111, status: 'Destaque', color: 'from-emerald-400 to-lime-200' },
  { id: 5, name: 'Pedro Henrique', age: 20, city: 'Santos', state: 'SP', pos: 'Goleiro', secondary: '—', rating: 8.0, votes: 62, status: 'Disponível', color: 'from-slate-300 to-slate-100' },
  { id: 6, name: 'Matheus Alves', age: 18, city: 'Sorocaba', state: 'SP', pos: 'Ponta', secondary: 'Atacante', rating: 8.7, votes: 103, status: 'Destaque', color: 'from-orange-400 to-amber-200' },
] }

const icon = (name, cls='size-5') => {
  const paths = {
    home:'<path d="m3 10 9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    user:'<circle cx="12" cy="7" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    message:'<path d="M20 11.5a7.5 7.5 0 0 1-8 7.5H6l-3 2v-5a7.5 7.5 0 1 1 17-4.5Z"/>',
    calendar:'<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    star:'<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.2 6.4 20l1.1-6.2L3 9.6l6.2-.9z"/>',
    menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
    close:'<path d="m6 6 12 12M18 6 6 18"/>',
    arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
    pin:'<path d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z"/><circle cx="12" cy="9" r="2.5"/>',
    check:'<path d="m5 12 4 4L19 6"/>',
    filter:'<path d="M4 6h16M7 12h10M10 18h4"/>',
    logout:'<path d="M10 17l5-5-5-5M15 12H3M21 19V5a2 2 0 0 0-2-2h-4"/>',
    edit:'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/>',
    bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
    heart:'<path d="M20.8 8.8c0 5.5-8.8 10.7-8.8 10.7S3.2 14.3 3.2 8.8A4.8 4.8 0 0 1 12 6a4.8 4.8 0 0 1 8.8 2.8Z"/>',
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="${cls}" aria-hidden="true">${paths[name] || ''}</svg>`
}

function persist() {
  localStorage.setItem('ap_user', JSON.stringify(state.user))
  localStorage.setItem('ap_favorites', JSON.stringify(state.favorites))
  localStorage.setItem('ap_votes', JSON.stringify(state.votes))
  localStorage.setItem('ap_messages', JSON.stringify(state.messages))
  localStorage.setItem('ap_profile', JSON.stringify(state.profile))
  localStorage.setItem('ap_tryouts', JSON.stringify(state.tryouts))
}

function go(route) {
  location.hash = route
}

function toast(message, type='success') {
  const root = document.querySelector('#toast-root')
  if (!root) return
  const el = document.createElement('div')
  el.className = `pointer-events-auto flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm shadow-2xl backdrop-blur-xl ${type==='error' ? 'border-rose-400/30 bg-rose-500/15 text-rose-100' : 'border-amber-300/30 bg-emerald-500/15 text-white'}`
  el.innerHTML = `${icon(type==='error'?'close':'check','size-4')}<span>${message}</span>`
  root.appendChild(el)
  setTimeout(() => el.remove(), 2800)
}

function avatar(name='Atleta') {
  return name.split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase()
}

function shell(content, {active='home', role='player'}={}) {
  const nav = role === 'staff'
    ? [['dashboard','Visão geral','home'],['athletes','Atletas','search'],['tryouts','Peneiras','calendar'],['messages','Conversas','message']]
    : [['dashboard','Início','home'],['profile','Meu perfil','user'],['tryouts','Peneiras','calendar'],['messages','Conversas','message']]
  return `
  <div class="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(208,169,72,.12),_transparent_26%),#090909 text-white">
    <header class="sticky top-0 z-40 border-b border-white/8 bg-[#090909]/90 backdrop-blur-xl">
      <div class="mx-auto flex h-18 max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-10">
        <button class="flex items-center gap-3" data-route="dashboard" aria-label="Ir para o início">
          <img src="./assets/brand/simbolo.jpg" alt="Academia Pelé" class="h-11 w-11 rounded-xl object-contain bg-black ring-1 ring-white/10" />
          <div class="hidden sm:block text-left"><p class="text-sm font-black uppercase tracking-[.28em] text-[#e1bb62]">Academia Pelé</p><p class="text-[11px] text-white/40">Plataforma de talentos</p></div>
        </button>
        <nav class="hidden md:flex items-center gap-1" aria-label="Navegação principal">
          ${nav.map(([route,label,ico])=>`<button data-route="${route}" class="nav-link ${active===route?'active':''}">${icon(ico,'size-4')} ${label}</button>`).join('')}
        </nav>
        <div class="flex items-center gap-2">
          <button class="icon-button" data-route="messages" aria-label="Conversas">${icon('message')}</button>
          <button class="icon-button" data-action="bell" aria-label="Notificações">${icon('bell')}</button>
          <button class="profile-chip" data-route="profile"><span class="avatar">${avatar(state.user?.name || (role==='staff'?'Marina Lopes':'Gabriel Martins'))}</span><span class="hidden lg:block max-w-28 truncate text-sm">${state.user?.name || (role==='staff'?'Marina Lopes':'Gabriel Martins')}</span></button>
          <button class="icon-button md:hidden" data-action="menu" aria-label="Abrir menu">${icon('menu')}</button>
        </div>
      </div>
    </header>
    <main class="mx-auto max-w-[1440px] px-4 py-5 sm:px-6 lg:px-10 lg:py-8">${content}</main>
    <div id="mobile-menu"></div>
    <div id="toast-root" class="fixed bottom-5 right-5 z-[80] flex w-[min(92vw,380px)] flex-col gap-2"></div>
  </div>`
}

function dashboard(role='player') {
  if (role==='staff') return staffDashboard()
  const name = state.user?.name || 'Gabriel Martins'
  return shell(`
    <section class="grid gap-6 xl:grid-cols-[1.55fr_.8fr]">
      <div class="overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,#17130c_0%,#0d0d0d_55%,#18120a_100%)] p-6 shadow-2xl sm:p-8">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div><span class="eyebrow">Painel do atleta</span><h1 class="mt-3 max-w-xl text-3xl font-black leading-tight tracking-tight sm:text-5xl">Seu talento em campo. <span class="text-[#e6bd62]">Sua carreira em movimento.</span></h1><p class="mt-4 max-w-2xl text-base leading-7 text-white/55">Acompanhe oportunidades, avaliações e conversas com profissionais da Academia Pelé.</p></div>
          <div class="hidden sm:flex h-28 w-28 items-center justify-center rounded-3xl border border-[#d4ad59]/25 bg-[#d4ad59]/10"><img src="./assets/brand/simbolo.jpg" alt="Logo Academia Pelé" class="h-24 w-24 rounded-2xl object-contain" /></div>
        </div>
        <div class="mt-8 grid gap-3 sm:grid-cols-3">
          ${stat('Avaliação média','8,6','+0,4 este mês')}${stat('Peneiras inscritas','04','1 próxima')}${stat('Visualizações','1.284','+18%')}
        </div>
      </div>
      <aside class="rounded-[28px] border border-white/10 bg-white/[.03] p-6"><div class="flex items-center justify-between"><div><span class="eyebrow">Próxima peneira</span><h2 class="mt-2 text-xl font-black">Sub-20 • Atacantes</h2></div><span class="status-dot">Confirmada</span></div><div class="mt-6 space-y-4"><div class="flex gap-3">${icon('calendar','size-5 text-[#e1bb62]')}<div><p class="text-sm font-semibold">24 de setembro • 14:00</p><p class="text-xs text-white/45">Campo principal • São Paulo</p></div></div><div class="flex gap-3">${icon('pin','size-5 text-[#e1bb62]')}<div><p class="text-sm font-semibold">Centro de Treinamento Pelé</p><p class="text-xs text-white/45">Av. Central, 450 — São Paulo/SP</p></div></div></div><button class="btn-primary mt-6 w-full" data-route="tryouts">Ver minhas peneiras ${icon('arrow','size-4')}</button></aside>
    </section>
    <section class="mt-8 grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
      <div class="panel"><div class="flex items-center justify-between"><div><span class="eyebrow">Radar de oportunidades</span><h2 class="section-title">Atletas em destaque</h2></div><button class="text-sm font-semibold text-[#e2bb62]" data-route="athletes">Explorar atletas</button></div><div class="mt-5 grid gap-3 sm:grid-cols-2">${state.athletes.slice(0,4).map(athleteCard).join('')}</div></div>
      <div class="panel"><div class="flex items-center justify-between"><div><span class="eyebrow">Minha atividade</span><h2 class="section-title">Últimos movimentos</h2></div>${icon('arrow','size-5 text-white/35')}</div><div class="mt-5 space-y-4">${activity('Avaliação registrada','Marina Lopes avaliou sua performance','Hoje, 09:42')}${activity('Perfil visualizado','Seu perfil recebeu 18 novas visualizações','Ontem')}${activity('Nova mensagem','Treinador Bruno iniciou uma conversa','Ontem, 18:10')}</div></div>
    </section>
  `,{active:'dashboard',role:'player'})
}

function staffDashboard() {
  return shell(`
    <section class="grid gap-6 xl:grid-cols-[1.55fr_.8fr]">
      <div class="rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,#17130c,#0e0e0e_65%,#1b1408)] p-6 sm:p-8"><span class="eyebrow">Central do funcionário</span><h1 class="mt-3 text-3xl font-black sm:text-5xl">Descubra talentos e <span class="text-[#e6bd62]">tome decisões melhores.</span></h1><p class="mt-4 max-w-2xl text-white/55">Pesquise atletas, crie peneiras, avalie desempenhos e mantenha contato com os jogadores.</p><div class="mt-8 flex flex-wrap gap-3"><button class="btn-primary" data-route="athletes">Pesquisar atletas ${icon('search','size-4')}</button><button class="btn-secondary" data-action="openTryout">Criar peneira ${icon('plus','size-4')}</button></div></div>
      <aside class="panel"><span class="eyebrow">Hoje</span><div class="mt-3 grid grid-cols-2 gap-3">${staffStat('74','Atletas ativos')}${staffStat('08','Avaliações pendentes')}${staffStat('03','Peneiras abertas')}${staffStat('12','Novas mensagens')}</div></aside>
    </section>
    <section class="mt-8 panel"><div class="flex flex-wrap items-end justify-between gap-3"><div><span class="eyebrow">Seu radar</span><h2 class="section-title">Atletas para observar</h2></div><button class="btn-ghost" data-route="athletes">Ver banco completo ${icon('arrow','size-4')}</button></div><div class="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">${state.athletes.slice(0,6).map(athleteCard).join('')}</div></section>
  `,{active:'dashboard',role:'staff'})
}

function stat(value,label,sub){ return `<div class="rounded-2xl border border-white/8 bg-white/[.035] p-4"><p class="text-2xl font-black text-[#e6bd62]">${value}</p><p class="mt-1 text-sm font-semibold">${label}</p><p class="mt-1 text-xs text-white/35">${sub}</p></div>` }
function staffStat(value,label){ return `<div class="rounded-2xl border border-white/8 bg-white/[.03] p-4"><p class="text-2xl font-black">${value}</p><p class="mt-1 text-xs text-white/45">${label}</p></div>` }
function activity(title,sub,time){ return `<div class="flex gap-3"><span class="mt-1 grid size-9 shrink-0 place-items-center rounded-xl bg-[#e1bb62]/10 text-[#e1bb62]">${icon('check','size-4')}</span><div class="min-w-0"><p class="text-sm font-semibold">${title}</p><p class="truncate text-xs text-white/40">${sub}</p><p class="mt-1 text-[11px] text-white/25">${time}</p></div></div>` }
function athleteCard(a){
  const fav = state.favorites.includes(a.id)
  const count = a.votes + (state.votes[a.id] || 0)
  return `<article class="group rounded-2xl border border-white/8 bg-white/[.03] p-4 transition hover:-translate-y-0.5 hover:border-[#d4ad59]/30 hover:bg-white/[.045]"><div class="flex gap-3"><div class="avatar-lg bg-gradient-to-br ${a.color}">${avatar(a.name)}</div><div class="min-w-0 flex-1"><div class="flex items-start justify-between gap-2"><div><h3 class="truncate font-bold">${a.name}</h3><p class="text-xs text-white/40">${a.age} anos • ${a.city}/${a.state}</p></div><button class="icon-button sm" data-favorite="${a.id}" aria-label="${fav?'Remover dos favoritos':'Favoritar'}">${icon('heart',`size-4 ${fav?'fill-[#e2bb62] text-[#e2bb62]':''}`)}</button></div><div class="mt-3 flex flex-wrap gap-1.5"><span class="tag">${a.pos}</span><span class="tag ghost">${a.secondary}</span><span class="tag green">${a.status}</span></div></div></div><div class="mt-4 flex items-center justify-between border-t border-white/7 pt-3"><div class="flex items-center gap-2 text-xs text-white/45">${icon('star','size-4 text-[#e2bb62]')} <strong class="text-white">${a.rating}</strong> média <span class="ml-1">•</span> ${count} votos</div><button class="vote-button" data-vote="${a.id}">Votar</button></div></article>`
}

function athletesPage() {
  return shell(`
    <div class="flex flex-wrap items-end justify-between gap-4"><div><span class="eyebrow">Banco de talentos</span><h1 class="page-title">Pesquisar atletas</h1><p class="page-subtitle">Filtre por posição e região em tempo real.</p></div><button class="btn-primary" data-action="openTryout">${icon('plus','size-4')} Nova peneira</button></div>
    <section class="mt-6 grid gap-5 lg:grid-cols-[280px_1fr]">
      <aside class="panel h-max"><div class="flex items-center justify-between"><h2 class="font-bold">Filtros</h2><button class="text-xs text-[#e2bb62]" data-action="clearFilters">Limpar</button></div><div class="mt-4 space-y-4"><label class="field-label">Buscar por nome<input id="filter-name" class="field" placeholder="Ex.: Gabriel" /></label><label class="field-label">Posição<select id="filter-pos" class="field"><option value="">Todas</option>${['Goleiro','Zagueiro','Lateral','Volante','Meia','Ponta','Atacante'].map(p=>`<option>${p}</option>`).join('')}</select></label><label class="field-label">Região<select id="filter-city" class="field"><option value="">Todas</option>${['São Paulo','Osasco','Guarulhos','Campinas','Santos','Sorocaba'].map(c=>`<option>${c}</option>`).join('')}</select></label><label class="field-label">Idade<select id="filter-age" class="field"><option value="">Todas</option><option value="17">17</option><option value="18">18</option><option value="19">19</option><option value="20">20</option></select></label></div><div class="mt-6 rounded-2xl border border-[#d4ad59]/15 bg-[#d4ad59]/7 p-4 text-xs leading-5 text-white/55"><strong class="text-[#e2bb62]">Filtro instantâneo</strong><br/>A lista abaixo é atualizada pelo JavaScript conforme você digita ou seleciona.</div></aside>
      <div><div class="mb-4 flex items-center justify-between"><p id="athlete-count" class="text-sm text-white/45">${state.athletes.length} atletas encontrados</p><button class="btn-secondary" data-action="export">Exportar seleção</button></div><div id="athlete-grid" class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">${state.athletes.map(athleteCard).join('')}</div></div>
    </section>
  `,{active:'athletes',role:'staff'})
}

function profilePage() {
  const p = state.profile || {name:state.user?.name || 'Gabriel Martins', birth:'14/03/2008', email:state.user?.email || 'gabriel@email.com', phone:'(11) 99872-1122', pos:'Atacante', secondary:'Ponta', city:'São Paulo', state:'SP', address:'Av. Ipiranga, 1200', number:'1200', district:'República', zip:'01046-010'}
  return shell(`
    <div class="flex flex-wrap items-end justify-between gap-4"><div><span class="eyebrow">Meu perfil</span><h1 class="page-title">${p.name}</h1><p class="page-subtitle">Seu perfil profissional visível para a rede da Academia Pelé.</p></div><button class="btn-secondary" data-action="logout">${icon('logout','size-4')} Sair</button></div>
    <section class="mt-6 grid gap-5 xl:grid-cols-[.75fr_1.25fr]">
      <aside class="panel"><div class="flex items-center gap-4"><div class="avatar-xl">${avatar(p.name)}</div><div><p class="text-xs uppercase tracking-[.2em] text-white/35">Atleta</p><h2 class="mt-1 text-2xl font-black">${p.pos}</h2><p class="text-sm text-white/45">${p.city}/${p.state}</p></div></div><div class="mt-6 grid grid-cols-2 gap-3">${stat('8,6','Avaliação','média atual')}${stat('04','Peneiras','inscritas')}${stat('18','Visualizações','últimos 7 dias')}${stat('03','Avaliações','recebidas')}</div><div class="mt-6 flex flex-wrap gap-2"><span class="tag">${p.pos}</span><span class="tag ghost">${p.secondary}</span><span class="tag green">Perfil ativo</span></div></aside>
      <div class="panel"><div class="flex items-center justify-between"><div><span class="eyebrow">Dados do jogador</span><h2 class="section-title">Atualizar perfil</h2></div>${icon('edit','size-5 text-[#e1bb62]')}</div><form id="profile-form" class="mt-5 grid gap-4 sm:grid-cols-2">${input('Nome completo','profile-name',p.name,'text')}${input('Data de nascimento','profile-birth',p.birth,'text')}${input('E-mail','profile-email',p.email,'email')}${input('Telefone','profile-phone',p.phone,'tel')}<label class="field-label">Posição principal<select id="profile-pos" class="field"><option ${p.pos==='Atacante'?'selected':''}>Atacante</option><option ${p.pos==='Ponta'?'selected':''}>Ponta</option><option ${p.pos==='Meia'?'selected':''}>Meia</option><option ${p.pos==='Volante'?'selected':''}>Volante</option><option ${p.pos==='Zagueiro'?'selected':''}>Zagueiro</option><option ${p.pos==='Lateral'?'selected':''}>Lateral</option><option ${p.pos==='Goleiro'?'selected':''}>Goleiro</option></select></label><label class="field-label">Posição secundária<select id="profile-secondary" class="field"><option>—</option><option ${p.secondary==='Ponta'?'selected':''}>Ponta</option><option ${p.secondary==='Atacante'?'selected':''}>Atacante</option><option ${p.secondary==='Meia'?'selected':''}>Meia</option><option ${p.secondary==='Volante'?'selected':''}>Volante</option><option ${p.secondary==='Lateral'?'selected':''}>Lateral</option></select></label><div class="sm:col-span-2 mt-2 border-t border-white/8 pt-5"><p class="text-sm font-bold">Endereço</p></div>${input('CEP','profile-zip',p.zip)}${input('Cidade','profile-city',p.city)}${input('Estado','profile-state',p.state)}${input('Bairro','profile-district',p.district)}<div class="sm:col-span-2">${input('Endereço','profile-address',p.address)}</div><div class="sm:col-span-2 flex justify-end"><button class="btn-primary" type="submit">Salvar alterações ${icon('check','size-4')}</button></div></form></div>
    </section>
    <section class="mt-6 panel"><span class="eyebrow">Olheiros</span><h2 class="section-title">Comentários e notas</h2><div class="mt-5 grid gap-4 md:grid-cols-2">${review('Marina Lopes','8,9','Boa tomada de decisão no último terço. Ataca profundidade e finaliza bem sob pressão.','Hoje, 09:42')}${review('Carlos Mendes','8,3','Perfil versátil, com boa leitura de espaço e evolução clara na recomposição.','12 set. 2026')}</div></section>
  `,{active:'profile',role:'player'})
}
function input(label,id,value='',type='text'){ return `<label class="field-label">${label}<input id="${id}" class="field" type="${type}" value="${value}" /></label>` }
function review(name,rating,text,date){ return `<article class="rounded-2xl border border-white/8 bg-white/[.025] p-5"><div class="flex items-start justify-between gap-3"><div class="flex items-center gap-3"><span class="avatar">${avatar(name)}</span><div><p class="font-semibold">${name}</p><p class="text-xs text-white/35">Olheiro</p></div></div><div class="rounded-xl border border-[#d4ad59]/20 bg-[#d4ad59]/8 px-3 py-2 text-sm font-black text-[#e2bb62]">${rating}</div></div><p class="mt-4 text-sm leading-6 text-white/65">“${text}”</p><p class="mt-3 text-xs text-white/30">${date}</p></article>` }

function tryoutsPage() {
  return shell(`
    <div class="flex flex-wrap items-end justify-between gap-4"><div><span class="eyebrow">Calendário</span><h1 class="page-title">Peneiras</h1><p class="page-subtitle">Encontre oportunidades e confira as posições abertas.</p></div><button class="btn-primary" data-action="openTryout">${icon('plus','size-4')} Criar peneira</button></div>
    <div class="mt-6 grid gap-4 lg:grid-cols-3">${state.tryouts.map(tryoutCard).join('')}</div>
  `,{active:'tryouts',role:state.user?.role==='staff'?'staff':'player'})
}
function tryoutCard(t){ return `<article class="panel flex flex-col"><div class="flex items-start justify-between gap-3"><span class="tag">${t.positions.join(' • ')}</span><span class="text-xs text-white/35">${t.enrolled}/${t.seats}</span></div><h2 class="mt-4 text-xl font-black">${t.title}</h2><div class="mt-5 space-y-3 text-sm text-white/55"><p class="flex gap-2">${icon('calendar','size-4 text-[#e2bb62]')}${t.date} • ${t.time}</p><p class="flex gap-2">${icon('pin','size-4 text-[#e2bb62]')}${t.city}</p></div><div class="mt-6 h-2 overflow-hidden rounded-full bg-white/8"><div class="h-full rounded-full bg-[#d4ad59]" style="width:${Math.min(100, t.enrolled/t.seats*100)}%"></div></div><button class="btn-secondary mt-6 w-full" data-action="enroll" data-id="${t.id}">${state.user?.role==='staff'?'Ver inscritos':'Inscrever-me'} ${icon('arrow','size-4')}</button></article>` }

function messagesPage() {
  const staff = state.user?.role==='staff'
  const conversations = staff ? state.athletes.slice(0,4).map(a=>({name:a.name, subtitle:`${a.pos} • ${a.city}`, avatar:a.name, id:`a${a.id}`})) : [{name:'Bruno Martins',subtitle:'Treinador • Academia Pelé',avatar:'Bruno',id:'staff1'},{name:'Marina Lopes',subtitle:'Olheira • São Paulo',avatar:'Marina',id:'staff2'}]
  const selected = conversations.find(c=>c.id===activeThread) || conversations[0]
  activeThread = selected.id
  const history = state.messages.filter(m=>m.thread===selected.id)
  return shell(`
    <div><span class="eyebrow">Comunicação</span><h1 class="page-title">Conversas</h1><p class="page-subtitle">Atletas e profissionais podem se encontrar pelo banco de dados e conversar por aqui.</p></div>
    <section class="mt-6 grid min-h-[620px] overflow-hidden rounded-[28px] border border-white/10 bg-white/[.025] md:grid-cols-[300px_1fr]">
      <aside class="border-b border-white/8 bg-black/20 md:border-b-0 md:border-r"><div class="p-4"><label class="field-label">Pesquisar ${staff?'atleta':'profissional'}<input id="conversation-search" class="field mt-2" placeholder="Digite um nome..." /></label></div><div id="conversation-list" class="space-y-1 p-2">${conversations.map(c=>`<button class="conversation-item ${c.id===selected.id?'selected':''}" data-thread="${c.id}" data-name="${c.name}"><span class="avatar">${avatar(c.avatar)}</span><span class="min-w-0 text-left"><strong class="block truncate">${c.name}</strong><small class="block truncate text-white/35">${c.subtitle}</small></span></button>`).join('')}</div></aside>
      <div class="flex min-w-0 flex-col"><header class="flex items-center justify-between border-b border-white/8 px-5 py-4"><div class="flex items-center gap-3"><span class="avatar">${avatar(selected.avatar)}</span><div><p class="font-bold">${selected.name}</p><p class="text-xs text-emerald-300">Disponível para conversar</p></div></div><span class="tag green">Canal seguro</span></header><div id="chat-messages" class="flex-1 space-y-3 overflow-y-auto p-5">${(history.length?history:[{from:'them',text: staff ? 'Olá! Vi seu perfil e gostaria de conversar sobre sua disponibilidade para uma avaliação.' : 'Olá! Vi suas oportunidades e quero saber mais sobre a próxima peneira.'}]).map(messageBubble).join('')}</div><form id="message-form" class="border-t border-white/8 p-4"><div class="flex gap-2"><input id="message-input" class="field" placeholder="Escreva sua mensagem..." autocomplete="off"/><button class="btn-primary shrink-0" aria-label="Enviar mensagem">${icon('arrow','size-4')}</button></div></form></div>
    </section>
  `,{active:'messages',role:staff?'staff':'player'})
}
function messageBubble(m){ const mine=m.from==='me'; return `<div class="flex ${mine?'justify-end':''}"><div class="max-w-[78%] rounded-2xl ${mine?'rounded-br-md bg-[#d8af58] text-black':'rounded-bl-md border border-white/8 bg-white/[.045] text-white'} px-4 py-3 text-sm leading-6"><p>${m.text}</p><p class="mt-1 text-[10px] opacity-50">Agora</p></div></div>` }

function loginPage() {
  return `<div class="min-h-screen bg-[radial-gradient(circle_at_center,_rgba(210,173,88,.12),_transparent_30%),#070707 px-4 py-8 text-white"><div class="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-[32px] border border-white/10 bg-white/[.025] lg:grid-cols-[.95fr_1.05fr]"><div class="relative hidden overflow-hidden border-r border-white/8 bg-[radial-gradient(circle_at_30%_20%,rgba(216,176,88,.24),transparent_25%),#0c0c0c] p-10 lg:flex lg:flex-col lg:justify-between"><div><img src="./assets/brand/simbolo.jpg" alt="Academia Pelé" class="h-28 w-28 rounded-3xl object-contain"/><span class="eyebrow mt-8">TF3 • Sprint 3</span><h1 class="mt-4 max-w-lg text-5xl font-black leading-tight">Onde o futebol encontra <span class="text-[#e1bb62]">o próximo talento.</span></h1><p class="mt-5 max-w-xl text-white/50">Uma experiência digital para jogadores e profissionais descobrirem oportunidades, avaliarem desempenho e se conectarem.</p></div><div class="text-sm text-white/30">Academia Pelé • Plataforma de talentos</div></div><div class="flex items-center justify-center p-6 sm:p-10"><div class="w-full max-w-md"><img src="./assets/brand/simbolo.jpg" alt="Academia Pelé" class="mx-auto h-24 w-24 rounded-3xl object-contain lg:hidden"/><span class="eyebrow mt-6">Acesso</span><h2 class="mt-3 text-3xl font-black">Entrar na Academia Pelé</h2><p class="mt-2 text-sm text-white/45">Escolha seu perfil para continuar.</p><div class="mt-6 grid grid-cols-2 gap-2 rounded-2xl border border-white/8 bg-black/25 p-1"><button class="role-tab active" data-role="player">Jogador</button><button class="role-tab" data-role="staff">Funcionário</button></div><form id="login-form" class="mt-6 space-y-4">${input('E-mail','login-email','','email')}${input('Senha','login-password','','password')}<p id="login-error" class="hidden text-xs font-semibold text-rose-300"></p><button class="btn-primary w-full" type="submit">Entrar ${icon('arrow','size-4')}</button></form><div class="my-6 flex items-center gap-3"><span class="h-px flex-1 bg-white/8"></span><span class="text-xs text-white/25">ou</span><span class="h-px flex-1 bg-white/8"></span></div><button class="btn-secondary w-full" data-route="register">Criar conta de jogador</button><button class="mt-3 w-full text-center text-xs text-white/35 hover:text-white" data-action="demo">Entrar com conta demo</button></div></div></div></div>`
}

function registerPage() {
  return `<div class="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(216,176,88,.1),_transparent_28%),#070707 px-4 py-8 text-white"><div class="mx-auto max-w-4xl rounded-[32px] border border-white/10 bg-white/[.025] p-6 sm:p-10"><div class="flex flex-wrap items-center justify-between gap-4"><div class="flex items-center gap-3"><img src="./assets/brand/simbolo.jpg" alt="Academia Pelé" class="h-16 w-16 rounded-2xl object-contain"/><div><span class="eyebrow">Cadastro</span><h1 class="mt-1 text-3xl font-black">Criar conta de jogador</h1></div></div><button class="btn-ghost" data-route="login">Voltar</button></div><form id="register-form" class="mt-8 grid gap-4 sm:grid-cols-2">${input('Nome completo','reg-name','','text')}${input('CPF','reg-cpf','','text')}${input('E-mail','reg-email','','email')}${input('Telefone','reg-phone','','tel')}${input('Data de nascimento','reg-birth','','text')}<label class="field-label">Posição principal<select id="reg-pos" class="field"><option value="">Selecione</option><option>Goleiro</option><option>Zagueiro</option><option>Lateral</option><option>Volante</option><option>Meia</option><option>Ponta</option><option>Atacante</option></select></label><label class="field-label">Posição secundária<select id="reg-secondary" class="field"><option>—</option><option>Ponta</option><option>Atacante</option><option>Meia</option><option>Volante</option><option>Lateral</option><option>Zagueiro</option></select></label><div class="sm:col-span-2 mt-2 border-t border-white/8 pt-5"><p class="text-sm font-bold">Endereço</p></div>${input('CEP','reg-zip','','text')}${input('Cidade','reg-city','','text')}${input('Estado','reg-state','','text')}${input('Bairro','reg-district','','text')}<div class="sm:col-span-2">${input('Endereço','reg-address','','text')}</div>${input('Senha','reg-password','','password')}${input('Confirmar senha','reg-confirm','','password')}<div id="reg-feedback" class="sm:col-span-2 hidden rounded-2xl border px-4 py-3 text-sm"></div><div class="sm:col-span-2 flex flex-wrap items-center justify-between gap-3 pt-3"><p class="max-w-xl text-xs leading-5 text-white/35">Ao criar a conta, seus dados poderão ser usados para processos de avaliação e comunicação dentro da plataforma.</p><button class="btn-primary" type="submit">Criar conta ${icon('check','size-4')}</button></div></form></div></div>`
}

function render() {
  const route = location.hash.replace('#/','') || (state.user ? 'dashboard' : 'login')
  if (!state.user && !['login','register'].includes(route)) return go('login')
  let view = route==='login' ? loginPage() : route==='register' ? registerPage() : route==='dashboard' ? dashboard(state.user.role) : route==='athletes' ? athletesPage() : route==='profile' ? profilePage() : route==='tryouts' ? tryoutsPage() : route==='messages' ? messagesPage() : dashboard(state.user.role)
  app.innerHTML = view
  bind()
}

function applyFilters(){
  const name=document.querySelector('#filter-name')?.value||''
  const pos=document.querySelector('#filter-pos')?.value||''
  const city=document.querySelector('#filter-city')?.value||''
  const age=document.querySelector('#filter-age')?.value||''
  const filtered=filterAthletes(state.athletes,{name,pos,city,age})
  const grid=document.querySelector('#athlete-grid')
  if(grid) grid.innerHTML=filtered.map(athleteCard).join('') || `<div class="md:col-span-2 xl:col-span-3 rounded-2xl border border-dashed border-white/10 p-10 text-center text-white/40">Nenhum atleta encontrado com esses filtros.</div>`
  const count=document.querySelector('#athlete-count'); if(count) count.textContent=`${filtered.length} atleta(s) encontrado(s)`
}

function validCPF(cpf){ return validateCPF(cpf) }
function maskCPF(input){ formatCPF(input) }

function bind(){
  document.querySelectorAll('[data-route]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.route)))
  document.querySelectorAll('[data-role]').forEach(b=>b.addEventListener('click',()=>document.querySelectorAll('[data-role]').forEach(x=>x.classList.toggle('active',x===b))))
  document.querySelectorAll('[data-favorite]').forEach(b=>b.addEventListener('click',()=>{const id=Number(b.dataset.favorite); toggleFavorite(state,id); persist(); render(); toast(state.favorites.includes(id)?'Atleta adicionado aos favoritos.':'Atleta removido dos favoritos.') }))
  document.querySelectorAll('[data-vote]').forEach(b=>b.addEventListener('click',()=>{const id=Number(b.dataset.vote); registerVote(state,id); persist(); b.textContent='Votado ✓'; b.disabled=true; toast('Voto registrado com sucesso.') }))
  document.querySelectorAll('[data-action="bell"]').forEach(b=>b.addEventListener('click',()=>toast('Você não possui novas notificações.')))
  document.querySelectorAll('[data-action="menu"]').forEach(b=>b.addEventListener('click',()=>{
    const menu=document.querySelector('#mobile-menu'); menu.innerHTML=`<div class="fixed inset-0 z-[70] bg-black/70 p-4 backdrop-blur-sm"><div class="ml-auto w-[min(86vw,340px)] rounded-3xl border border-white/10 bg-[#111] p-4 shadow-2xl"><div class="flex items-center justify-between"><p class="font-bold">Navegação</p><button class="icon-button" data-action="closeMenu">${icon('close')}</button></div><div class="mt-4 grid gap-2">${['dashboard','athletes','tryouts','messages','profile'].map(r=>`<button class="nav-link" data-route="${r}">${r}</button>`).join('')}</div></div></div>`; bind() }))
  document.querySelectorAll('[data-action="clearFilters"]').forEach(b=>b.addEventListener('click',()=>{['filter-name','filter-pos','filter-city','filter-age'].forEach(id=>{const e=document.querySelector('#'+id); if(e)e.value='' }); applyFilters()}))
  document.querySelectorAll('[data-action="export"]').forEach(b=>b.addEventListener('click',()=>toast('Seleção exportada para a área de trabalho.')))
  document.querySelectorAll('[data-action="logout"]').forEach(b=>b.addEventListener('click',()=>{state.user=null;persist();go('login');toast('Sessão encerrada.')}))
  document.querySelectorAll('[data-action="openTryout"]').forEach(b=>b.addEventListener('click',openTryoutModal))
  document.querySelectorAll('[data-action="enroll"]').forEach(b=>b.addEventListener('click',()=>{const t=state.tryouts.find(x=>x.id===Number(b.dataset.id)); if(!t)return; const pos=state.profile?.pos||'Atacante'; if(!t.positions.includes(pos) && state.user?.role!=='staff'){toast(`Esta peneira está limitada às posições: ${t.positions.join(', ')}.` ,'error');return} if(t.enrolled<t.seats)t.enrolled++; persist(); render(); toast(state.user?.role==='staff'?'Lista de inscritos aberta.':'Inscrição confirmada!')}))
  const name=document.querySelector('#filter-name'); const pos=document.querySelector('#filter-pos'); const city=document.querySelector('#filter-city'); const age=document.querySelector('#filter-age'); [name,pos,city,age].filter(Boolean).forEach(e=>e.addEventListener(e.tagName==='INPUT'?'input':'change',applyFilters))
  const cpf=document.querySelector('#reg-cpf'); if(cpf) cpf.addEventListener('input',()=>maskCPF(cpf))
  const reg=document.querySelector('#register-form'); if(reg) reg.addEventListener('submit',e=>{e.preventDefault(); const feedback=document.querySelector('#reg-feedback'); const cpfVal=document.querySelector('#reg-cpf').value; const pass=document.querySelector('#reg-password').value; const conf=document.querySelector('#reg-confirm').value; if(!validCPF(cpfVal)){return showReg('CPF inválido. Digite um CPF válido.',true)} if(pass.length<6){return showReg('A senha precisa ter pelo menos 6 caracteres.',true)} if(pass!==conf){return showReg('As senhas não coincidem.',true)} const profile={name:document.querySelector('#reg-name').value||'Novo Atleta',birth:document.querySelector('#reg-birth').value,email:document.querySelector('#reg-email').value||'atleta@email.com',phone:document.querySelector('#reg-phone').value,pos:document.querySelector('#reg-pos').value||'Atacante',secondary:document.querySelector('#reg-secondary').value,city:document.querySelector('#reg-city').value||'São Paulo',state:document.querySelector('#reg-state').value||'SP',address:document.querySelector('#reg-address').value,number:'',district:document.querySelector('#reg-district').value,zip:document.querySelector('#reg-zip').value}; state.profile=profile; state.user={name:profile.name,email:profile.email,role:'player'}; persist(); go('dashboard'); toast('Conta criada com sucesso.') })
  const login=document.querySelector('#login-form'); if(login) login.addEventListener('submit',e=>{e.preventDefault(); const email=document.querySelector('#login-email').value.trim(); if(!email.includes('@')){const er=document.querySelector('#login-error'); er.textContent='Informe um e-mail válido.'; er.classList.remove('hidden'); return} const role=document.querySelector('.role-tab.active')?.dataset.role || 'player'; state.user={name:role==='staff'?'Marina Lopes':'Gabriel Martins',email,role}; state.profile ||= {name:'Gabriel Martins',birth:'14/03/2008',email,phone:'(11) 99872-1122',pos:'Atacante',secondary:'Ponta',city:'São Paulo',state:'SP',address:'Av. Ipiranga, 1200',number:'1200',district:'República',zip:'01046-010'}; persist(); go('dashboard'); toast(`Login realizado como ${role==='staff'?'funcionário':'jogador'}.`) })
  document.querySelectorAll('[data-action="demo"]').forEach(b=>b.addEventListener('click',()=>{const role=document.querySelector('.role-tab.active')?.dataset.role || 'player';state.user={name:role==='staff'?'Marina Lopes':'Gabriel Martins',email:'demo@academiapelé.com',role};state.profile ||= {name:'Gabriel Martins',birth:'14/03/2008',email:'demo@academiapelé.com',phone:'(11) 99872-1122',pos:'Atacante',secondary:'Ponta',city:'São Paulo',state:'SP',address:'Av. Ipiranga, 1200',number:'1200',district:'República',zip:'01046-010'};persist();go('dashboard');toast('Conta demo carregada.') }))
  const pf=document.querySelector('#profile-form'); if(pf) pf.addEventListener('submit',e=>{e.preventDefault(); const p=state.profile||{}; Object.assign(p,{name:document.querySelector('#profile-name').value,birth:document.querySelector('#profile-birth').value,email:document.querySelector('#profile-email').value,phone:document.querySelector('#profile-phone').value,pos:document.querySelector('#profile-pos').value,secondary:document.querySelector('#profile-secondary').value,zip:document.querySelector('#profile-zip').value,city:document.querySelector('#profile-city').value,state:document.querySelector('#profile-state').value,district:document.querySelector('#profile-district').value,address:document.querySelector('#profile-address').value}); state.profile=p; if(state.user)state.user.name=p.name; persist(); render(); toast('Dados do jogador atualizados.') })
  const mf=document.querySelector('#message-form'); if(mf) mf.addEventListener('submit',e=>{e.preventDefault(); const inp=document.querySelector('#message-input'); const text=inp.value.trim(); if(!text)return; const thread=activeThread || document.querySelector('[data-thread]')?.dataset.thread || 'a1'; if(!saveMessage(state,thread,text)) return; persist(); inp.value=''; render(); setTimeout(()=>{toast('Mensagem enviada com sucesso.')},100)})
  document.querySelectorAll('[data-thread]').forEach(b=>b.addEventListener('click',()=>{activeThread=b.dataset.thread;render()}))
  const conversationSearch=document.querySelector('#conversation-search')
  if(conversationSearch) conversationSearch.addEventListener('input',()=>{
    const items=[...document.querySelectorAll('[data-thread]')].map(el=>({name:el.dataset.name,subtitle:el.textContent,el}))
    const visible=searchConversations(items.map(x=>({name:x.name,subtitle:x.subtitle,el:x.el})),conversationSearch.value)
    const visibleSet=new Set(visible.map(x=>x.el))
    items.forEach(x=>x.el.classList.toggle('hidden',!visibleSet.has(x.el)))
  })
}
function showReg(text,error){const f=document.querySelector('#reg-feedback'); if(!f)return;f.textContent=text;f.classList.remove('hidden');f.className=`sm:col-span-2 rounded-2xl border px-4 py-3 text-sm ${error?'border-rose-400/20 bg-rose-500/10 text-rose-200':'border-emerald-400/20 bg-emerald-500/10 text-emerald-200'}`}
function openTryoutModal(){
  const wrap=document.createElement('div'); wrap.id='modal-root'; wrap.className='fixed inset-0 z-[90] grid place-items-center bg-black/75 p-4 backdrop-blur-md'; wrap.innerHTML=`<div class="w-full max-w-xl rounded-[28px] border border-white/10 bg-[#111] p-6 shadow-2xl sm:p-8"><div class="flex items-start justify-between gap-4"><div><span class="eyebrow">Nova peneira</span><h2 class="mt-2 text-2xl font-black">Criar/agendar peneira</h2></div><button class="icon-button" data-close-modal>${icon('close')}</button></div><form id="tryout-form" class="mt-6 grid gap-4 sm:grid-cols-2">${input('Nome da peneira','try-title','','text')}${input('Data','try-date','','text')}${input('Horário','try-time','','text')}<label class="field-label">Quantidade de vagas<input id="try-seats" class="field" type="number" min="1" value="12" /></label><div class="sm:col-span-2"><p class="field-label mb-2">Localidade <span class="text-xs font-normal text-white/35">(popup de confirmação)</span></p><button type="button" id="location-button" class="field flex items-center justify-between text-left"><span id="location-value" class="text-white/35">Selecionar local...</span>${icon('pin','size-4 text-[#e2bb62]')}</button></div><div class="sm:col-span-2"><p class="field-label">Posições disponíveis</p><div class="mt-2 grid grid-cols-2 gap-2 rounded-2xl border border-white/8 bg-black/20 p-3 sm:grid-cols-3">${['Goleiro','Zagueiro','Lateral','Volante','Meia','Ponta','Atacante'].map((p,i)=>`<label class="check-pill"><input type="checkbox" name="position" value="${p}" ${i===6?'checked':''}/><span>${p}</span></label>`).join('')}</div></div><div class="flex justify-end gap-2 sm:col-span-2"><button type="button" class="btn-secondary" data-close-modal>Cancelar</button><button class="btn-primary" type="submit">Criar peneira ${icon('check','size-4')}</button></div></form></div>`; document.body.appendChild(wrap); wrap.querySelectorAll('[data-close-modal]').forEach(x=>x.addEventListener('click',()=>wrap.remove())); wrap.addEventListener('click',e=>{if(e.target===wrap)wrap.remove()}); document.querySelector('#location-button').addEventListener('click',openLocationModal); document.querySelector('#tryout-form').addEventListener('submit',e=>{e.preventDefault();const pos=[...document.querySelectorAll('input[name="position"]:checked')].map(x=>x.value); if(!pos.length){toast('Selecione pelo menos uma posição.','error');return} const t={id:Date.now(),title:document.querySelector('#try-title').value||'Nova peneira',date:document.querySelector('#try-date').value||'30/09/2026',time:document.querySelector('#try-time').value||'09:00',city:document.querySelector('#location-value').textContent==='Selecionar local...'? 'São Paulo - SP':document.querySelector('#location-value').textContent,positions:pos,seats:Number(document.querySelector('#try-seats').value)||12,enrolled:0}; state.tryouts.unshift(t);persist();wrap.remove();render();toast('Peneira criada e publicada.')})
}
function openLocationModal(){
  const panel=document.createElement('div'); panel.className='fixed inset-0 z-[100] grid place-items-center bg-black/70 p-4'; panel.innerHTML=`<div class="w-full max-w-md rounded-3xl border border-white/10 bg-[#151515] p-6"><div class="flex items-center justify-between"><div><span class="eyebrow">Localidade</span><h3 class="mt-1 text-xl font-black">Confirmar local da peneira</h3></div><button class="icon-button" data-x>${icon('close')}</button></div><div class="mt-5 space-y-2">${['Centro de Treinamento Pelé — São Paulo/SP','Arena Oeste — Osasco/SP','CT Litoral — Santos/SP'].map((x,i)=>`<button class="location-option" data-location="${x}"><span class="grid size-10 place-items-center rounded-xl bg-[#e1bb62]/10 text-[#e2bb62]">${icon('pin','size-4')}</span><span class="text-left"><strong>${x.split(' — ')[0]}</strong><small>${x.split(' — ')[1]}</small></span></button>`).join('')}</div></div>`; document.body.appendChild(panel); panel.querySelector('[data-x]').addEventListener('click',()=>panel.remove()); panel.querySelectorAll('[data-location]').forEach(b=>b.addEventListener('click',()=>{document.querySelector('#location-value').textContent=b.dataset.location;panel.remove();toast('Localidade confirmada.')}))
}

window.addEventListener('hashchange',render)
render()
