import { state, persist } from './state.js'
import { icon, toast } from './ui.js'

function field(label,id,value='',type='text'){ return `<label class="field-label">${label}<input id="${id}" class="field" type="${type}" value="${value}" /></label>` }

export function openTryoutModal(render){
  const wrap=document.createElement('div')
  wrap.id='modal-root'
  wrap.className='fixed inset-0 z-[90] grid place-items-center bg-black/75 p-4 backdrop-blur-md'
  wrap.innerHTML=`<div class="w-full max-w-xl rounded-[28px] border border-white/10 bg-[#111] p-6 shadow-2xl sm:p-8"><div class="flex items-start justify-between gap-4"><div><span class="eyebrow">Nova peneira</span><h2 class="mt-2 text-2xl font-black">Criar/agendar peneira</h2></div><button class="icon-button" data-close-modal>${icon('close')}</button></div><form id="tryout-form" class="mt-6 grid gap-4 sm:grid-cols-2">${field('Nome da peneira','try-title')}${field('Data','try-date')}${field('Horário','try-time')}<label class="field-label">Quantidade de vagas<input id="try-seats" class="field" type="number" min="1" value="12" /></label><div class="sm:col-span-2"><p class="field-label mb-2">Localidade <span class="text-xs font-normal text-white/35">(popup de confirmação)</span></p><button type="button" id="location-button" class="field flex items-center justify-between text-left"><span id="location-value" class="text-white/35">Selecionar local...</span>${icon('pin','size-4 text-[#e2bb62]')}</button></div><div class="sm:col-span-2"><p class="field-label">Posições disponíveis</p><div class="mt-2 grid grid-cols-2 gap-2 rounded-2xl border border-white/8 bg-black/20 p-3 sm:grid-cols-3">${['Goleiro','Zagueiro','Lateral','Volante','Meia','Ponta','Atacante'].map((p,i)=>`<label class="check-pill"><input type="checkbox" name="position" value="${p}" ${i===6?'checked':''}/><span>${p}</span></label>`).join('')}</div></div><div class="flex justify-end gap-2 sm:col-span-2"><button type="button" class="btn-secondary" data-close-modal>Cancelar</button><button class="btn-primary" type="submit">Criar peneira ${icon('check','size-4')}</button></div></form></div>`
  document.body.appendChild(wrap)
  wrap.querySelectorAll('[data-close-modal]').forEach(x=>x.addEventListener('click',()=>wrap.remove()))
  wrap.addEventListener('click',e=>{if(e.target===wrap)wrap.remove()})
  document.querySelector('#location-button').addEventListener('click',()=>openLocationModal())
  document.querySelector('#tryout-form').addEventListener('submit',e=>{
    e.preventDefault()
    const pos=[...document.querySelectorAll('input[name="position"]:checked')].map(x=>x.value)
    if(!pos.length){toast('Selecione pelo menos uma posição.','error');return}
    const t={id:Date.now(),title:document.querySelector('#try-title').value||'Nova peneira',date:document.querySelector('#try-date').value||'30/09/2026',time:document.querySelector('#try-time').value||'09:00',city:document.querySelector('#location-value').textContent==='Selecionar local...'? 'São Paulo - SP':document.querySelector('#location-value').textContent,positions:pos,seats:Number(document.querySelector('#try-seats').value)||12,enrolled:0}
    state.tryouts.unshift(t); persist(); wrap.remove(); render(); toast('Peneira criada e publicada.')
  })
}

function openLocationModal(){
  const panel=document.createElement('div')
  panel.className='fixed inset-0 z-[100] grid place-items-center bg-black/70 p-4'
  panel.innerHTML=`<div class="w-full max-w-md rounded-3xl border border-white/10 bg-[#151515] p-6"><div class="flex items-center justify-between"><div><span class="eyebrow">Localidade</span><h3 class="mt-1 text-xl font-black">Confirmar local da peneira</h3></div><button class="icon-button" data-x>${icon('close')}</button></div><div class="mt-5 space-y-2">${['Centro de Treinamento Pelé — São Paulo/SP','Arena Oeste — Osasco/SP','CT Litoral — Santos/SP'].map(x=>`<button class="location-option" data-location="${x}"><span class="grid size-10 place-items-center rounded-xl bg-[#e1bb62]/10 text-[#e2bb62]">${icon('pin','size-4')}</span><span class="text-left"><strong>${x.split(' — ')[0]}</strong><small>${x.split(' — ')[1]}</small></span></button>`).join('')}</div></div>`
  document.body.appendChild(panel)
  panel.querySelector('[data-x]').addEventListener('click',()=>panel.remove())
  panel.querySelectorAll('[data-location]').forEach(b=>b.addEventListener('click',()=>{document.querySelector('#location-value').textContent=b.dataset.location;panel.remove();toast('Localidade confirmada.')}))
}

export function enrollInTryout(id, role, profile){
  const t=state.tryouts.find(x=>x.id===id)
  if(!t) return {ok:false,message:'Peneira não encontrada.'}
  if(role==='staff') return {ok:true,message:'Lista de inscritos aberta.'}
  const pos=profile?.pos||'Atacante'
  if(!t.positions.includes(pos)) return {ok:false,message:`Esta peneira está limitada às posições: ${t.positions.join(', ')}.`}
  if(t.enrolled>=t.seats) return {ok:false,message:'Não há mais vagas disponíveis.'}
  t.enrolled++; persist(); return {ok:true,message:'Inscrição confirmada!'}
}
