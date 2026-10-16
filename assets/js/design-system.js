// ===== Design system (rota pública #/design-system) =====
// Recebe os helpers reais do app (input, selectField, tag, athleteCard, confirmDialog, toast, icon):
// o que aparece aqui é exatamente o que o usuário vê nas telas.
const DS_COLORS = [
  ['night', 'Fundo da página'], ['stripe', 'Faixa do gramado'], ['panel', 'Painéis'], ['raised', 'Modais e toasts'],
  ['line', 'Divisórias'], ['line-strong', 'Borda de campos (≥3:1)'], ['chalk', 'Texto principal'], ['ink-soft', 'Texto secundário'],
  ['brand', 'Marca / CTA'], ['brand-strong', 'Marca — hover'], ['brand-ink', 'Texto sobre a marca'], ['focus', 'Anel de foco'],
  ['success', 'Sucesso'], ['danger', 'Erro / destrutivo'], ['warning', 'Atenção'],
  ['pos-gk', 'Posição: goleiro'], ['pos-def', 'Posição: defesa'], ['pos-mid', 'Posição: meio-campo'], ['pos-atk', 'Posição: ataque'],
  ['rate-1', 'Nota < 6'], ['rate-2', 'Nota 6–6,9'], ['rate-3', 'Nota 7–7,9'], ['rate-4', 'Nota 8–8,9'], ['rate-5', 'Nota ≥ 9'],
]
const DS_SECTIONS = [['ds-cores', 'Cores'], ['ds-tipo', 'Tipografia'], ['ds-espaco', 'Espaço, raios e sombras'], ['ds-botoes', 'Botões'], ['ds-campos', 'Campos'], ['ds-tags', 'Tags e navegação'], ['ds-feedback', 'Feedback'], ['ds-futebol', 'Futebol'], ['ds-cards', 'Cards e modais']]

const section = (id, title, desc, body) =>
  `<section aria-labelledby="${id}-t" class="reveal border-t border-line py-10"><h2 id="${id}-t" tabindex="-1" class="section-title outline-none">${title}</h2><p class="mt-2 max-w-[65ch] text-sm text-ink-soft">${desc}</p><div class="mt-6">${body}</div></section>`

const row = (label, html) =>
  `<div class="grid gap-3 border-b border-line py-4 last:border-0 sm:grid-cols-[10rem_1fr] sm:items-center"><p class="text-sm font-semibold text-ink-soft">${label}</p><div class="flex flex-wrap items-center gap-3">${html}</div></div>`

export function designSystemPage({ icon, input, selectField, tag, athleteCard, positions, posTag, ballLoader, scoreboard, pitchFormation, rateClass }) {
  const btnStates = (cls, name, label) => row(name,
    `<button type="button" class="${cls}" data-ds-demo>${label}</button>` +
    `<button type="button" class="${cls} is-hover" data-ds-demo>Hover</button>` +
    `<button type="button" class="${cls} is-focus" data-ds-demo>Foco</button>` +
    `<button type="button" class="${cls} is-active" data-ds-demo>Ativo</button>` +
    `<button type="button" class="${cls}" disabled>Desabilitado</button>` +
    (cls === 'btn-primary' || cls === 'btn-secondary' ? `<button type="button" class="${cls}" aria-busy="true">Salvando…</button>` : ''))
  const withAttrs = (html, attrs) => html.replace('class="field"', attrs)
  const demoAthlete = { id: 0, foot: 'Canhoto', name: 'Atleta de exemplo', age: 16, city: 'São Paulo', state: 'SP', pos: 'Meia', secondary: 'Volante', rating: 0, votes: 0, color: 'from-amber-400 to-yellow-200' }

  return '<div class="min-h-screen">' +
    '<header class="sticky top-0 z-40 border-b border-line bg-night/95 backdrop-blur"><div class="mx-auto flex min-h-[4.5rem] max-w-[1200px] items-center justify-between gap-3 px-4 sm:px-6">' +
    '<a href="#/" class="flex min-w-0 items-center gap-3"><svg class="logo-mark shrink-0" width="45" height="36" viewBox="0 0 80 64" aria-hidden="true"><path class="lm-o" d="M48.07 26.13A19 19 0 1 1 40.07 15.89" fill="none" stroke-width="5.5" stroke-linecap="round"/><path class="lm-run" d="M46.5 20.5C54 10 63 9.5 70 17.5" fill="none" stroke-width="3.2" stroke-linecap="round" stroke-dasharray="1 6.5"/><path class="lm-run" d="M70.13 10.68L70.99 18.63L63.22 16.72" fill="none" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg><span class="truncate font-bold font-display">TIER ZERO <span class="font-semibold text-ink-soft">· Design system</span></span></a>' +
    '<div class="flex shrink-0 items-center gap-2"><button type="button" class="icon-button theme-toggle" data-action="toggle-theme" aria-label="Alternar tema claro/escuro" title="Alternar tema claro/escuro">' + icon('sun', 'size-4 theme-sun') + icon('moon', 'size-4 theme-moon') + '</button><a href="#/" class="btn-secondary">Voltar ao app</a></div></div></header>' +
    '<div class="mx-auto grid max-w-[1200px] gap-x-8 px-4 sm:px-6 lg:grid-cols-[13rem_minmax(0,1fr)]">' +
    '<nav aria-label="Seções do design system" class="min-w-0 lg:sticky lg:top-24 lg:self-start lg:pt-10"><ul class="flex gap-1 overflow-x-auto py-4 lg:flex-col lg:py-0">' +
    DS_SECTIONS.map(([id, label]) => `<li><a href="#${id}" data-ds-jump="${id}" class="nav-link whitespace-nowrap">${label}</a></li>`).join('') + '</ul></nav>' +
    '<main id="conteudo" tabindex="-1" class="min-w-0 pb-16 outline-none lg:pt-10">' +
    '<h1 class="page-title">Design system</h1><p class="page-subtitle">Tokens e componentes vivos da plataforma. Os componentes são os mesmos das telas do app e os tokens vêm de <code class="text-chalk">assets/js/styles.css</code> (<code class="text-chalk">@theme</code>).</p>' +

    section('ds-cores', 'Cores', 'Valores lidos do CSS em tempo real. Todos os pares de texto passam o contraste AA (4.5:1) sobre os fundos.',
      '<ul class="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">' + DS_COLORS.map(([name, use]) =>
        `<li class="reveal spot overflow-hidden rounded-[var(--radius-control)] border border-line"><span class="block h-16" style="background:var(--color-${name})"></span><span class="block p-3 text-sm"><strong class="block">${name}</strong><span class="block text-ink-soft">${use}</span><code class="tabular mt-1 block text-xs text-ink-soft" data-ds-token="--color-${name}"></code></span></li>`).join('') + '</ul>') +

    section('ds-tipo', 'Tipografia', 'Bricolage Grotesque (títulos e números, eixo óptico) + Instrument Sans (texto). Ambas variáveis, carregadas com display=swap.',
      row('Display', '<p class="page-title !mt-0">Peneira Sub-17</p>') +
      row('Título de seção', '<p class="section-title !mt-0">Atletas para observar</p>') +
      row('Numeral', '<p class="num text-5xl text-brand">8,6</p><p class="num text-5xl">12/18</p>') +
      row('Texto', '<p class="max-w-[65ch] leading-7">Inscreva-se em peneiras compatíveis com a sua posição e categoria.</p>') +
      row('Secundário', '<p class="text-sm text-ink-soft">Atualizado agora há pouco</p>') +
      row('Rótulo', '<span class="eyebrow">Próxima peneira</span>')) +

    section('ds-espaco', 'Espaço, raios e sombras', 'Escala de 4px do Tailwind; alvos de toque com no mínimo 44px (2.75rem).',
      row('Espaços', [1, 2, 3, 4, 6, 8, 12].map((n) => `<span class="grid justify-items-center gap-1 text-xs text-ink-soft"><span class="block h-3 rounded-sm bg-brand" style="width:calc(var(--spacing) * ${n})"></span>${n * 4}px</span>`).join('')) +
      row('Raios', '<span class="grid size-20 place-items-center rounded-[var(--radius-control)] border border-line-strong text-xs">control</span><span class="grid size-20 place-items-center rounded-card border border-line-strong text-xs">card</span><span class="grid h-10 w-24 place-items-center rounded-full border border-line-strong text-xs">pílula</span>') +
      row('Sombras', '<span class="grid h-16 w-32 place-items-center rounded-[var(--radius-control)] bg-panel text-xs shadow-lift">lift</span><span class="grid h-16 w-32 place-items-center rounded-card bg-raised text-xs shadow-modal">modal</span>')) +

    section('ds-botoes', 'Botões', 'Estados: padrão, hover, foco (teclado), ativo (pressionado), desabilitado e carregando (aria-busy).',
      btnStates('btn-primary', 'Primário', 'Inscrever-se') + btnStates('btn-secondary', 'Secundário', 'Criar peneira') + btnStates('btn-danger', 'Destrutivo', 'Cancelar peneira') + btnStates('vote-button', 'Voto', 'Votar') +
      row('Incompatível', '<button type="button" class="btn-incompatible" disabled>Posição incompatível</button>') +
      row('Ghost e ícone', `<button type="button" class="btn-ghost" data-ds-demo>Ver perfil</button><button type="button" class="icon-button" aria-label="Notificações (exemplo)" data-ds-demo>${icon('bell')}</button><button type="button" class="icon-button is-focus" aria-label="Menu (exemplo)" data-ds-demo>${icon('menu')}</button>`)) +

    section('ds-campos', 'Campos', 'Todo campo tem label associado. Erros usam aria-invalid e mensagem ligada por aria-describedby.',
      '<div class="grid gap-5 sm:grid-cols-2">' +
      input('Nome completo', 'ds-name', '', 'text') +
      withAttrs(input('E-mail (foco)', 'ds-focus', 'atleta@exemplo.com', 'email'), 'class="field is-focus"') +
      '<div>' + withAttrs(input('CPF (erro)', 'ds-cpf', '123.456.789-00'), 'class="field" aria-invalid="true" aria-describedby="ds-cpf-err"') + '<p id="ds-cpf-err" class="field-error">CPF inválido. Confira os 11 dígitos.</p></div>' +
      '<div>' + withAttrs(input('CEP (válido)', 'ds-cep', '01310-100'), 'class="field !border-success" aria-describedby="ds-cep-ok"') + '<p id="ds-cep-ok" class="field-hint !text-success">CEP encontrado: São Paulo/SP.</p></div>' +
      input('Idade (desabilitado)', 'ds-age', '16', 'number', false, true) +
      selectField('Posição principal', 'ds-pos', positions, '') +
      '<fieldset class="sm:col-span-2"><legend class="field-label">Posições aceitas</legend><div class="mt-2 flex flex-wrap gap-2">' + ['Meia', 'Volante', 'Atacante'].map((p, i) => `<label class="check-pill"><input type="checkbox" ${i === 0 ? 'checked' : ''} /> ${p}</label>`).join('') + '</div></fieldset>' +
      '<div class="sm:col-span-2"><p class="field-label">Seletor segmentado (clique ou setas)</p><div class="segmented mt-2 max-w-sm" role="group" aria-label="Tipo de conta (exemplo)" data-active="0"><span class="seg-pill" aria-hidden="true"></span><button type="button" class="role-tab active" data-role="player" aria-pressed="true">Jogador</button><button type="button" class="role-tab" data-role="staff" aria-pressed="false">Funcionário</button></div></div>' +
      '</div>') +

    section('ds-tags', 'Tags e navegação', 'Tags identificam posição, categoria e status; a navegação marca a página atual com aria-current.',
      row('Tags', tag('Atacante') + tag('Ponta', true) + '<span class="tag green">Inscrito</span><span class="tag red">Esgotada</span><span class="status-dot">Sub-17</span>') +
      row('Navegação', `<div class="flex flex-wrap gap-1"><a href="#ds-tags" class="nav-link" aria-current="page" data-ds-jump="ds-tags">${icon('home', 'size-4')}Atual</a><a href="#ds-tags" class="nav-link is-hover" data-ds-jump="ds-tags">${icon('calendar', 'size-4')}Hover</a><a href="#ds-tags" class="nav-link is-focus" data-ds-jump="ds-tags">${icon('message', 'size-4')}Foco</a></div>`) +
      row('Avatar', '<span class="avatar">GM</span><span class="avatar-lg bg-gradient-to-br from-sky-400 to-cyan-200">LF</span><span class="avatar-xl">AE</span>')) +

    section('ds-feedback', 'Feedback', 'Estados reais do fluxo: carregando, vazio, erro com ação de recuperação e sucesso inequívoco.',
      '<div class="grid gap-4 lg:grid-cols-2">' +
      `<div class="alert alert-success">${icon('check', 'size-5 shrink-0')}<span><strong>Inscrição confirmada.</strong> Você está na peneira Sub-17 — Meio-campo, 02/11 às 09:00.</span></div>` +
      `<div class="alert alert-error">${icon('close', 'size-5 shrink-0')}<span><strong>Não foi possível salvar.</strong> Verifique sua conexão e tente novamente. <button type="button" class="font-semibold underline underline-offset-4" data-ds-demo>Tentar de novo</button></span></div>` +
      `<div class="alert alert-info">${icon('bell', 'size-5 shrink-0')}<span>As vagas são confirmadas por ordem de inscrição.</span></div>` +
      '<div class="flex items-center gap-3 rounded-[var(--radius-control)] border border-line p-4"><span class="spinner" aria-hidden="true"></span><span class="text-sm">Carregando atletas…</span></div>' +
      '<div class="space-y-2 rounded-[var(--radius-control)] border border-line p-4" aria-hidden="true"><div class="skeleton h-4 w-2/3"></div><div class="skeleton h-4 w-1/2"></div><div class="skeleton h-10 w-full"></div></div>' +
      '<div class="empty-state"><strong>Nenhuma peneira aberta</strong><span class="text-sm">Quando um funcionário criar uma peneira compatível, ela aparece aqui.</span><button type="button" class="btn-secondary mt-2" data-ds-demo>Atualizar</button></div>' +
      '</div>' +
      row('Toasts', '<button type="button" class="btn-secondary" data-ds-toast="success">Disparar sucesso</button><button type="button" class="btn-secondary" data-ds-toast="error">Disparar erro</button>')) +

    section('ds-futebol', 'Futebol', 'Componentes próprios do domínio: cores de posição, escala de nota, placar, campo e o loader da bola.',
      row('Posições', positions.map(posTag).join('')) +
      row('Escala de nota', [5.4, 6.5, 7.3, 8.4, 9.2].map((n) => `<span class="num text-3xl ${rateClass(n)}">${String(n).replace('.', ',')}</span>`).join('')) +
      row('Placar', scoreboard('2026-11-07', '14:00') + scoreboard('2026-11-21', '')) +
      row('Carregando', ballLoader('Aquecendo: carregando peneiras…')) +
      '<div class="mt-4">' + pitchFormation(positions.map((pos, i) => ({ id: 'ds' + i, name: pos + ' Exemplo', pos })), { interactive: false }) + '</div>') +

    section('ds-cards', 'Cards e modais', 'O card abaixo é o mesmo do banco de atletas (dados de exemplo). O modal usa o componente de confirmação do app.',
      '<div class="grid gap-4 lg:grid-cols-2"><div data-ds-card>' + athleteCard(demoAthlete, true) + '</div>' +
      '<div class="panel"><h3 class="section-title !mt-0">Painel</h3><p class="mt-2 text-sm text-ink-soft">Superfície padrão para agrupar conteúdo.</p><button type="button" class="btn-danger mt-4" data-ds-modal>Abrir modal de confirmação</button></div></div>') +

    '</main></div></div>'
}

export function bindDesignSystem(root, { toast, confirmDialog, scrollToElement, initSegmented }) {
  initSegmented?.()
  const styles = getComputedStyle(document.documentElement)
  root.querySelectorAll('[data-ds-token]').forEach((el) => { el.textContent = styles.getPropertyValue(el.dataset.dsToken).trim() })
  root.querySelectorAll('[data-ds-jump]').forEach((link) => link.addEventListener('click', (event) => {
    event.preventDefault() // o roteador usa o hash; a âncora só rola e foca a seção
    const heading = document.getElementById(link.dataset.dsJump + '-t')
    scrollToElement(heading)
    heading?.focus({ preventScroll: true })
  }))
  root.querySelectorAll('[data-ds-demo]').forEach((button) => button.addEventListener('click', () => toast('Exemplo do design system: no app, este controle executa a ação real.')))
  root.querySelectorAll('[data-ds-card] button').forEach((button) => button.addEventListener('click', () => toast('Card de exemplo: no banco de atletas, este botão abre o perfil, vota ou envia mensagem.')))
  root.querySelectorAll('[data-ds-toast]').forEach((button) => button.addEventListener('click', () => toast(button.dataset.dsToast === 'error' ? 'Não foi possível enviar. Tente novamente.' : 'Avaliação salva.', button.dataset.dsToast)))
  root.querySelector('[data-ds-modal]')?.addEventListener('click', () => confirmDialog({ title: 'Cancelar peneira?', message: 'Os atletas inscritos serão avisados. Esta ação não pode ser desfeita.', confirmLabel: 'Cancelar peneira', onConfirm: () => toast('Exemplo: nada foi cancelado.') }))
}
