export function toggleFavorite(state, athleteId){
  state.favorites=state.favorites.includes(athleteId)
    ? state.favorites.filter(x=>x!==athleteId)
    : [...state.favorites,athleteId]
  localStorage.setItem('ap_favorites', JSON.stringify(state.favorites))
  return state.favorites.includes(athleteId)
}

