export function filterAthletes(athletes, {name='', pos='', city='', age=''}) {
  const search=name.toLowerCase()
  return athletes.filter(a =>
    (!search || a.name.toLowerCase().includes(search)) &&
    (!pos || a.pos===pos || a.secondary===pos) &&
    (!city || a.city===city) &&
    (!age || String(a.age)===age)
  )
}
