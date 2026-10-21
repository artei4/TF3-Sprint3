// Fotos de perfil e avatares ilustrados.
//
// Foto: a orientação do celular é corrigida (createImageBitmap + from-image) e a pessoa enquadra
// num recorte circular com zoom e arrastar. A saída usa exatamente a mesma conta da prévia:
// 320 px em WebP (JPEG se o navegador não gerar WebP), ~15–40 KB, pequena o bastante para ir no perfil.
import { t } from './i18n.js'

const PHOTO_SIZE = 320
const MAX_FILE = 8 * 1024 * 1024
const MAX_ZOOM = 4

// Abre o recorte; resolve com a imagem pronta (data URL) ou null se a pessoa cancelar.
export async function cropPhoto(file) {
  if (!file || !file.type.startsWith('image/')) throw new Error('Escolha um arquivo de imagem (JPG, PNG ou WebP).')
  if (file.size > MAX_FILE) throw new Error('A imagem passa de 8 MB. Escolha uma menor.')
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  // Prévia com a imagem já na orientação certa.
  const source = document.createElement('canvas')
  source.width = bitmap.width
  source.height = bitmap.height
  source.getContext('2d').drawImage(bitmap, 0, 0)

  return new Promise((resolve) => {
    const wrapper = document.createElement('div')
    wrapper.className = 'fixed inset-0 z-[130] grid place-items-center bg-black/80 p-4'
    wrapper.innerHTML =
      '<div class="cropper surface surface--raised" role="dialog" aria-modal="true" aria-labelledby="crop-title">' +
      '<h2 id="crop-title" class="text-xl font-semibold">' + t('Enquadre sua foto') + '</h2>' +
      '<p class="mt-1 text-sm text-ink-soft">' + t('Arraste para mover e use o zoom. No teclado: setas movem, + e − aproximam.') + '</p>' +
      '<div class="crop-stage" tabindex="0" role="group" aria-label="' + t('Área de recorte da foto') + '"><img alt="" draggable="false" /><span class="crop-ring" aria-hidden="true"></span></div>' +
      '<label class="crop-zoom"><span>Zoom</span><input type="range" min="1" max="' + MAX_ZOOM + '" step="0.01" value="1" /></label>' +
      '<div class="mt-5 flex justify-end gap-2"><button type="button" class="btn-secondary" data-close>' + t('Cancelar') + '</button><button type="button" class="btn-primary" data-crop-ok>' + t('Usar foto') + '</button></div></div>'
    document.body.appendChild(wrapper)

    const stage = wrapper.querySelector('.crop-stage')
    const img = wrapper.querySelector('img')
    const slider = wrapper.querySelector('input[type="range"]')
    img.src = source.toDataURL('image/jpeg', 0.92)
    const V = () => stage.clientWidth
    const base = () => V() / Math.min(bitmap.width, bitmap.height) // escala que cobre o círculo
    let zoom = 1, x = 0, y = 0 // x,y = canto superior esquerdo da imagem dentro da área

    const clamp = () => {
      const s = base() * zoom
      x = Math.min(0, Math.max(V() - bitmap.width * s, x))
      y = Math.min(0, Math.max(V() - bitmap.height * s, y))
    }
    const paint = () => {
      clamp()
      const s = base() * zoom
      img.style.width = bitmap.width * s + 'px'
      img.style.height = bitmap.height * s + 'px'
      img.style.transform = 'translate(' + x + 'px,' + y + 'px)'
      slider.value = String(zoom)
    }
    // Zoom mantendo fixo o ponto (cx, cy) da área (centro, cursor ou meio da pinça).
    const setZoom = (next, cx = V() / 2, cy = V() / 2) => {
      next = Math.min(MAX_ZOOM, Math.max(1, next))
      const k = next / zoom
      x = cx - (cx - x) * k
      y = cy - (cy - y) * k
      zoom = next
      paint()
    }
    const center = () => {
      const s = base()
      x = (V() - bitmap.width * s) / 2
      y = (V() - bitmap.height * s) / 2
      paint()
    }

    const pointers = new Map()
    let pinch = 0
    stage.addEventListener('pointerdown', (event) => { stage.setPointerCapture(event.pointerId); pointers.set(event.pointerId, { x: event.clientX, y: event.clientY }) })
    stage.addEventListener('pointermove', (event) => {
      if (!pointers.has(event.pointerId)) return
      const prev = pointers.get(event.pointerId)
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()]
        const dist = Math.hypot(a.x - b.x, a.y - b.y)
        const rect = stage.getBoundingClientRect()
        if (pinch) setZoom(zoom * dist / pinch, (a.x + b.x) / 2 - rect.left, (a.y + b.y) / 2 - rect.top)
        pinch = dist
        return
      }
      x += event.clientX - prev.x
      y += event.clientY - prev.y
      paint()
    })
    const release = (event) => { pointers.delete(event.pointerId); if (pointers.size < 2) pinch = 0 }
    stage.addEventListener('pointerup', release)
    stage.addEventListener('pointercancel', release)
    stage.addEventListener('wheel', (event) => {
      event.preventDefault()
      const rect = stage.getBoundingClientRect()
      setZoom(zoom * (event.deltaY < 0 ? 1.08 : 1 / 1.08), event.clientX - rect.left, event.clientY - rect.top)
    }, { passive: false })
    stage.addEventListener('keydown', (event) => {
      const step = event.shiftKey ? 40 : 12
      const moves = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] }
      if (moves[event.key]) { event.preventDefault(); x += moves[event.key][0]; y += moves[event.key][1]; paint() }
      if (event.key === '+' || event.key === '=') { event.preventDefault(); setZoom(zoom * 1.15) }
      if (event.key === '-') { event.preventDefault(); setZoom(zoom / 1.15) }
    })
    slider.addEventListener('input', () => setZoom(Number(slider.value)))

    const finish = (result) => { wrapper.remove(); bitmap.close?.(); resolve(result) }
    wrapper.querySelector('[data-close]').addEventListener('click', () => finish(null))
    wrapper.querySelector('[data-crop-ok]').addEventListener('click', () => {
      // Mesma conta da prévia: a área visível (V×V) convertida para pixels da imagem original.
      const s = base() * zoom
      const out = document.createElement('canvas')
      out.width = out.height = PHOTO_SIZE
      const ctx = out.getContext('2d')
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(source, -x / s, -y / s, V() / s, V() / s, 0, 0, PHOTO_SIZE, PHOTO_SIZE)
      const webp = out.toDataURL('image/webp', 0.82)
      finish(webp.startsWith('data:image/webp') ? webp : out.toDataURL('image/jpeg', 0.85))
    })
    requestAnimationFrame(center)
  })
}

// Avatar ilustrado (perfis de exemplo): jogador com a camisa na cor da posição; equipe com camisa dourada.
// Desenhado aqui, então não usa rosto de pessoa real nem foto de banco de imagens.
const SKIN = ['#F2C9A6', '#E2AE84', '#C98B62', '#A06A45', '#7B4D30', '#5A3723']
const HAIR = ['#17110C', '#2E1E12', '#4A2F1B', '#6B4423', '#B88A4E']
const POS_COLOR = { gk: '#F5A34B', def: '#6FB1FF', mid: '#57D49A', atk: '#FF7B6E', staff: '#F2C23A' }

function hash(text) {
  let h = 2166136261
  for (const ch of String(text)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  return h >>> 0
}

export function illustratedAvatar(seed, group = 'mid', label = '') {
  const h = hash(seed)
  const skin = SKIN[h % SKIN.length]
  const hair = HAIR[(h >>> 3) % HAIR.length]
  const shirt = POS_COLOR[group] || POS_COLOR.mid
  const style = (h >>> 6) % 4
  const hairPath = [
    'M30 27c0-9 6-14 14-14s14 5 14 14c-3-4-8-6-14-6s-11 2-14 6Z', // curto
    'M28 30c-2-12 5-19 16-19s18 7 16 19c-1-3-2-5-4-6 1-3 0-6-2-7-3 3-6 4-10 4s-8-1-11-4c-2 1-3 4-2 7-2 1-3 3-3 6Z', // crespo volumoso
    'M31 26c1-8 6-12 13-12s12 4 13 12c-4-3-8-4-13-4s-9 1-13 4Z', // raspado
    'M29 28c0-10 7-15 15-15 7 0 13 4 14 11-5-1-10-3-13-6-2 4-8 8-16 10Z', // franja
  ][style]
  const curls = style === 1 ? '<circle cx="31" cy="22" r="4"/><circle cx="57" cy="22" r="4"/><circle cx="44" cy="12" r="5"/><circle cx="36" cy="14" r="4.5"/><circle cx="52" cy="14" r="4.5"/>' : ''
  // Equipe: gola polo e prancheta no peito, para diferenciar de atleta.
  const detail = group === 'staff'
    ? '<path d="M38 64h12l-6 7Z" fill="#0B0F1C" fill-opacity=".3"/><rect x="52" y="72" width="9" height="11" rx="1.5" fill="#0B0F1C" fill-opacity=".35"/>'
    : '<path d="M37 64l7 9 7-9" fill="none" stroke="#0B0F1C" stroke-opacity=".35" stroke-width="2.5" stroke-linejoin="round"/>'
  return '<svg viewBox="0 0 88 88" class="avatar-illustration"' + (label ? ' role="img" aria-label="' + label + '"' : ' aria-hidden="true"') + '>' +
    '<defs><radialGradient id="bg' + h + '" cx="50%" cy="30%" r="75%"><stop offset="0" stop-color="#34406B"/><stop offset="1" stop-color="#141A33"/></radialGradient></defs>' +
    '<rect width="88" height="88" fill="url(#bg' + h + ')"/><circle cx="44" cy="44" r="30" fill="none" stroke="#F1F3F8" stroke-opacity=".08" stroke-width="1.5"/>' +
    '<path d="M14 88c2-16 13-24 30-24s28 8 30 24Z" fill="' + shirt + '"/>' + detail +
    '<rect x="39" y="50" width="10" height="14" rx="4" fill="' + skin + '"/>' +
    '<ellipse cx="44" cy="36" rx="13.5" ry="15" fill="' + skin + '"/>' +
    '<g fill="' + hair + '">' + curls + '<path d="' + hairPath + '"/></g>' +
    '</svg>'
}
