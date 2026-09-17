export function toast(message, type='success') {
  const root = document.querySelector('#toast-root')
  if (!root) return
  const el = document.createElement('div')
  el.className = `pointer-events-auto flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm shadow-2xl backdrop-blur-xl ${type==='error' ? 'border-rose-400/30 bg-rose-500/15 text-rose-100' : 'border-amber-300/30 bg-emerald-500/15 text-white'}`
  el.innerHTML = `${icon(type==='error'?'close':'check','size-4')}<span>${message}</span>`
  root.appendChild(el)
  setTimeout(() => el.remove(), 2800)
}

export function avatar(name='Atleta') {
  return name.split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase()
}

export const icon = (name, cls='size-5') => {
  const paths = {
    home:'<path d="m3 10 9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    user:'<circle cx="12" cy="7" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    message:'<path d="M20 11.5a7.5 7.5 0 0 1-8 7.5H6l-3 2v-5a7.5 7.5 0 1 1 17-4.5Z"/>',
    calendar:'<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    star:'<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.2 6.4 20l1.1-6.2L3 9.6l6.2-.9z"/>',
    menu:'<path d="M4 6h16M4 12h16M4 18h16"/>', close:'<path d="m6 6 12 12M18 6 6 18"/>', arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>', plus:'<path d="M12 5v14M5 12h14"/>',
    pin:'<path d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z"/><circle cx="12" cy="9" r="2.5"/>',
    check:'<path d="m5 12 4 4L19 6"/>', filter:'<path d="M4 6h16M7 12h10M10 18h4"/>', logout:'<path d="M10 17l5-5-5-5M15 12H3M21 19V5a2 2 0 0 0-2-2h-4"/>', edit:'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/>', bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>', heart:'<path d="M20.8 8.8c0 5.5-8.8 10.7-8.8 10.7S3.2 14.3 3.2 8.8A4.8 4.8 0 0 1 12 6a4.8 4.8 0 0 1 8.8 2.8Z"/>'
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="${cls}" aria-hidden="true">${paths[name] || ''}</svg>`
}
