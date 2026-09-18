function filterAthletes(athletes, {name='', pos='', city='', age='', category='', gender=''}={}){
  const search=String(name).trim().toLowerCase()
  const normalizedCity=String(city).trim().toLowerCase()
  return athletes.filter((a)=>{
    const athleteName=String(a.name||'').toLowerCase()
    const athleteCity=String(a.city||'').toLowerCase()
    const athleteCategory=a.category || getCategoryFromAge(a.age)
    const positionMatch=!pos || a.pos===pos || a.secondary===pos
    const cityMatch=!normalizedCity || athleteCity===normalizedCity
    const ageMatch=!age || String(a.age)===String(age)
    const categoryMatch=!category || athleteCategory===category
    const genderMatch=!gender || String(a.gender||'')===String(gender)
    return (!search || athleteName.includes(search)) && positionMatch && cityMatch && ageMatch && categoryMatch && genderMatch
  })
}
