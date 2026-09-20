// Uma conversa é sempre o par (atleta, profissional). Assim as duas pontas
// enxergam exatamente o mesmo histórico.
export function threadKey(athleteId, staffEmail){
  return `${athleteId}::${staffEmail}`
}

// Ignora maiúsculas e acentos: "joao" encontra "João".
const normalize = (text) => String(text||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()

export function searchConversations(conversations, term){
  const query=normalize(term).trim()
  if(!query) return conversations
  return conversations.filter(c => normalize(c.name).includes(query) || normalize(c.subtitle).includes(query))
}
