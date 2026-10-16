// Movimento da interface: troca de tela, entrada dos títulos, reveal ao rolar, contadores,
// spotlight nos cards e rolagem suave. Tudo respeita prefers-reduced-motion.
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches

// ---------- Rolagem suave (Lenis) ----------
// Só com mouse/trackpad e sem movimento reduzido; no toque fica a rolagem nativa do aparelho.
// O código chega por import() depois do load, fora da primeira carga.
let lenis = null
export function initSmoothScroll() {
  const query = matchMedia('(pointer: fine) and (prefers-reduced-motion: no-preference)')
  const sync = () => {
    if (query.matches && !lenis) {
      Promise.all([import('lenis'), import('lenis/dist/lenis.css')]).then(([{ default: Lenis }]) => {
        if (lenis || !query.matches) return
        // ponytail: autoRaf mantém um requestAnimationFrame vivo; trocar por loop sob demanda se o idle importar.
        lenis = new Lenis({
          autoRaf: true,
          lerp: 0.12,
          // Scrollers internos (modais, conversas, filtros) rolam nativamente.
          prevent: (node) => !!node.closest?.('[role="dialog"], .chat-messages, #conversation-list, [data-lenis-prevent]'),
        })
      }).catch(() => {})
    } else if (!query.matches && lenis) {
      lenis.destroy()
      lenis = null
    }
  }
  if (document.readyState === 'complete') sync()
  else addEventListener('load', sync, { once: true })
  query.addEventListener('change', sync)
}

export function scrollToTop() {
  if (lenis) lenis.scrollTo(0, { immediate: true })
  else window.scrollTo(0, 0)
}

export function scrollToElement(element) {
  if (!element) return
  if (lenis) lenis.scrollTo(element, { offset: -96 })
  else element.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' })
}

// ---------- Troca de tela ----------
// View Transitions nativas (Chrome/Edge/Safari 18): a tela antiga sai e a nova entra; o header fica.
export function paintScreen(update, isNewRoute) {
  if (!isNewRoute || reduced() || !document.startViewTransition) return update()
  document.startViewTransition(update)
}

// ---------- Entrada da página ----------
// Título h1 dividido em palavras (entrada em cascata), reveal ao rolar e contadores.
function splitTitle(title) {
  if (!title || title.dataset.split || title.children.length) return
  title.dataset.split = '1'
  title.setAttribute('aria-label', title.textContent.trim())
  title.innerHTML = title.textContent.trim().split(/\s+/).map((word, i) =>
    '<span class="word" aria-hidden="true" style="--i:' + i + '"><span>' + word + '</span></span>').join(' ')
}

// "06", "8.6", "8,6", "12/18": anima o primeiro número até o valor final, mantendo o formato.
function countUp(element) {
  const text = element.textContent
  const match = text.match(/\d+(?:[.,]\d+)?/)
  if (!match) return
  const raw = match[0]
  const decimals = (raw.split(/[.,]/)[1] || '').length
  const target = parseFloat(raw.replace(',', '.'))
  const pad = raw.split(/[.,]/)[0].length
  if (!target) return
  const start = performance.now()
  const duration = 900
  const frame = (now) => {
    const progress = Math.min(1, (now - start) / duration)
    const eased = 1 - Math.pow(1 - progress, 4)
    const [whole, fraction] = (target * eased).toFixed(decimals).split('.')
    const value = whole.padStart(pad, '0') + (fraction ? (raw.includes(',') ? ',' : '.') + fraction : '')
    element.textContent = text.replace(raw, value)
    if (progress < 1) requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)
}

let revealObserver = null
export function enterPage(root, isNewRoute) {
  if (reduced()) return
  if (isNewRoute) splitTitle(root.querySelector('main h1'))
  revealObserver?.disconnect()
  revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return
      const element = entry.target
      revealObserver.unobserve(element)
      element.classList.add('is-in')
      if (element.matches('.num')) countUp(element)
      element.querySelectorAll?.('.num').forEach(countUp)
    })
  }, { rootMargin: '0px 0px 12% 0px' })
  if (!isNewRoute) return
  // Ordem de cascata por grupo: cards irmãos entram um após o outro.
  root.querySelectorAll('main .reveal').forEach((element) => {
    const siblings = [...element.parentElement.children].filter((child) => child.classList.contains('reveal'))
    element.style.setProperty('--i', String(Math.min(siblings.indexOf(element), 8)))
    element.classList.add('will-reveal')
    revealObserver.observe(element)
  })
  root.querySelectorAll('main .num').forEach((element) => { if (!element.closest('.reveal')) revealObserver.observe(element) })
}

// ---------- Spotlight dos cards ----------
// Um único listener: o brilho dourado segue o cursor dentro de qualquer .spot.
export function initSpotlight() {
  document.addEventListener('pointermove', (event) => {
    if (event.pointerType !== 'mouse') return
    const card = event.target.closest?.('.spot')
    if (!card) return
    const rect = card.getBoundingClientRect()
    card.style.setProperty('--mx', (event.clientX - rect.left) + 'px')
    card.style.setProperty('--my', (event.clientY - rect.top) + 'px')
  }, { passive: true })
}
