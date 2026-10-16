// Fotos de perfil e avatares ilustrados.
//
// Foto: lida no navegador, com a orientação do celular corrigida (createImageBitmap + from-image),
// recortada no centro em quadrado e reduzida para 320 px em WebP (JPEG se o navegador não gerar WebP).
// Fica com ~15–40 KB, pequena o bastante para ir no perfil (jsonb no Supabase / localStorage no modo local).
// ponytail: recorte automático no centro; adicionar recorte com zoom/arrastar se pedirem enquadramento manual.
const PHOTO_SIZE = 320
const MAX_FILE = 8 * 1024 * 1024

export async function processPhoto(file) {
  if (!file || !file.type.startsWith('image/')) throw new Error('Escolha um arquivo de imagem (JPG, PNG ou WebP).')
  if (file.size > MAX_FILE) throw new Error('A imagem passa de 8 MB. Escolha uma menor.')
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const side = Math.min(bitmap.width, bitmap.height)
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = PHOTO_SIZE
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, PHOTO_SIZE, PHOTO_SIZE)
  bitmap.close?.()
  const webp = canvas.toDataURL('image/webp', 0.82)
  return webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/jpeg', 0.85)
}

// Avatar ilustrado (perfis de exemplo): jogador com a camisa na cor da posição.
// Desenhado aqui, então não usa rosto de pessoa real nem foto de banco de imagens.
const SKIN = ['#F2C9A6', '#E2AE84', '#C98B62', '#A06A45', '#7B4D30', '#5A3723']
const HAIR = ['#17110C', '#2E1E12', '#4A2F1B', '#6B4423', '#B88A4E']
const POS_COLOR = { gk: '#F5A34B', def: '#6FB1FF', mid: '#57D49A', atk: '#FF7B6E' }

function hash(text) {
  let h = 2166136261
  for (const ch of String(text)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  return h >>> 0
}

export function illustratedAvatar(seed, group = 'mid', label = '') {
  const h = hash(seed)
  const skin = SKIN[h % SKIN.length]
  const hair = HAIR[(h >> 3) % HAIR.length]
  const shirt = POS_COLOR[group] || POS_COLOR.mid
  const style = (h >> 6) % 4
  const hairPath = [
    'M30 27c0-9 6-14 14-14s14 5 14 14c-3-4-8-6-14-6s-11 2-14 6Z', // curto
    'M28 30c-2-12 5-19 16-19s18 7 16 19c-1-3-2-5-4-6 1-3 0-6-2-7-3 3-6 4-10 4s-8-1-11-4c-2 1-3 4-2 7-2 1-3 3-3 6Z', // crespo volumoso
    'M31 26c1-8 6-12 13-12s12 4 13 12c-4-3-8-4-13-4s-9 1-13 4Z', // raspado
    'M29 28c0-10 7-15 15-15 7 0 13 4 14 11-5-1-10-3-13-6-2 4-8 8-16 10Z', // franja
  ][style]
  const curls = style === 1 ? '<circle cx="31" cy="22" r="4"/><circle cx="57" cy="22" r="4"/><circle cx="44" cy="12" r="5"/><circle cx="36" cy="14" r="4.5"/><circle cx="52" cy="14" r="4.5"/>' : ''
  return '<svg viewBox="0 0 88 88" class="avatar-illustration"' + (label ? ' role="img" aria-label="' + label + '"' : ' aria-hidden="true"') + '>' +
    '<defs><radialGradient id="bg' + h + '" cx="50%" cy="30%" r="75%"><stop offset="0" stop-color="#3A6250"/><stop offset="1" stop-color="#16291F"/></radialGradient></defs>' +
    '<rect width="88" height="88" fill="url(#bg' + h + ')"/><circle cx="44" cy="44" r="30" fill="none" stroke="#EEF1E8" stroke-opacity=".08" stroke-width="1.5"/>' +
    '<path d="M14 88c2-16 13-24 30-24s28 8 30 24Z" fill="' + shirt + '"/>' +
    '<path d="M37 64l7 9 7-9" fill="none" stroke="#0D1612" stroke-opacity=".35" stroke-width="2.5" stroke-linejoin="round"/>' +
    '<rect x="39" y="50" width="10" height="14" rx="4" fill="' + skin + '"/>' +
    '<ellipse cx="44" cy="36" rx="13.5" ry="15" fill="' + skin + '"/>' +
    '<g fill="' + hair + '">' + curls + '<path d="' + hairPath + '"/></g>' +
    '</svg>'
}
