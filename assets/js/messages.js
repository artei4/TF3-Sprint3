export function saveMessage(state, thread, text, from='me'){
  const clean=text.trim()
  if(!clean) return false
  state.messages.push({thread,from,text:clean})
  localStorage.setItem('ap_messages', JSON.stringify(state.messages))
  return true
}

export function searchConversations(conversations, term){
  const query=term.trim().toLowerCase()
  if(!query) return conversations
  return conversations.filter(c => c.name.toLowerCase().includes(query) || c.subtitle.toLowerCase().includes(query))
}
