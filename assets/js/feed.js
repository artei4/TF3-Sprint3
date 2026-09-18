function toggleFavorite(state, athleteId){
  state.favorites=state.favorites.includes(athleteId)
    ? state.favorites.filter(x=>x!==athleteId)
    : [...state.favorites,athleteId]
  localStorage.setItem('ap_favorites', JSON.stringify(state.favorites))
  return state.favorites.includes(athleteId)
}

function registerVote(state, athleteId){
  state.votes[athleteId]=(state.votes[athleteId]||0)+1
  localStorage.setItem('ap_votes', JSON.stringify(state.votes))
  return state.votes[athleteId]
}
