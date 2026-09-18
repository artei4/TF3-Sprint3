function validCPF(cpf){
  cpf=cpf.replace(/\D/g,'')
  if(cpf.length!==11 || /^(\d)\1{10}$/.test(cpf)) return false
  let sum=0
  for(let i=0;i<9;i++) sum += Number(cpf[i])*(10-i)
  let d=(sum*10)%11
  if(d===10)d=0
  if(d!==Number(cpf[9]))return false
  sum=0
  for(let i=0;i<10;i++) sum += Number(cpf[i])*(11-i)
  d=(sum*10)%11
  if(d===10)d=0
  return d===Number(cpf[10])
}

function maskCPF(input){
  input.value=input.value.replace(/\D/g,'').slice(0,11)
    .replace(/(\d{3})(\d)/,'$1.$2')
    .replace(/(\d{3})(\d)/,'$1.$2')
    .replace(/(\d{3})(\d{1,2})$/,'$1-$2')
}


function getAgeFromBirth(birth){
  if(!birth) return NaN
  const date=new Date(birth+'T00:00:00')
  if(Number.isNaN(date.getTime())) return NaN
  const today=new Date()
  let age=today.getFullYear()-date.getFullYear()
  const month=today.getMonth()-date.getMonth()
  if(month<0 || (month===0 && today.getDate()<date.getDate())) age--
  return age
}

function validBirthDate(birth){
  if(!birth || !/^\d{4}-\d{2}-\d{2}$/.test(birth)) return false
  const date=new Date(birth+'T00:00:00')
  if(Number.isNaN(date.getTime())) return false
  const today=new Date()
  if(date>today) return false
  return date.getFullYear()>=1900
}

function getCategoryFromAge(age){
  if(!Number.isFinite(Number(age))) return 'Categoria não definida'
  const value=Number(age)
  if(value<=7) return 'Sub-7'
  if(value<=9) return 'Sub-9'
  if(value<=11) return 'Sub-11'
  if(value<=13) return 'Sub-13'
  if(value<=15) return 'Sub-15'
  if(value<=17) return 'Sub-17'
  if(value<=20) return 'Sub-20'
  return 'Fora da faixa'
}

function normalizeEmail(email){
  return String(email||'').trim().toLowerCase()
}
