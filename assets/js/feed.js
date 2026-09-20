export function toggleFavorite(state, athleteId){
  state.favorites=state.favorites.includes(athleteId)
    ? state.favorites.filter(x=>x!==athleteId)
    : [...state.favorites,athleteId]
  localStorage.setItem('ap_favorites', JSON.stringify(state.favorites))
  return state.favorites.includes(athleteId)
}

export function hasVoted(state, athleteId, voter){
  return (state.voted[voter]||[]).includes(athleteId)
}

// Cada usuário pode votar uma única vez em cada atleta.
// Retorna true se o voto foi registrado e false se já havia votado.
export function registerVote(state, athleteId, voter){
  if(hasVoted(state, athleteId, voter)) return false
  state.voted[voter]=[...(state.voted[voter]||[]), athleteId]
  state.votes[athleteId]=(state.votes[athleteId]||0)+1
  localStorage.setItem('ap_voted', JSON.stringify(state.voted))
  localStorage.setItem('ap_votes', JSON.stringify(state.votes))
  return true
}

// Retira o voto que o usuário havia dado ao atleta.
export function removeVote(state, athleteId, voter){
  if(!hasVoted(state, athleteId, voter)) return false
  state.voted[voter]=(state.voted[voter]||[]).filter(id=>id!==athleteId)
  state.votes[athleteId]=Math.max(0,(state.votes[athleteId]||0)-1)
  localStorage.setItem('ap_voted', JSON.stringify(state.voted))
  localStorage.setItem('ap_votes', JSON.stringify(state.votes))
  return true
}
