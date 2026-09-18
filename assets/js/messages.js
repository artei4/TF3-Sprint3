// Uma conversa é sempre o par (atleta, profissional). Assim as duas pontas
// enxergam exatamente o mesmo histórico.
export function threadKey(athleteId, staffEmail){
  return `${athleteId}::${staffEmail}`
}

export function searchConversations(conversations, term){
  const query=String(term||'').trim().toLowerCase()
  if(!query) return conversations
  return conversations.filter(c => String(c.name||'').toLowerCase().includes(query) || String(c.subtitle||'').toLowerCase().includes(query))
}
