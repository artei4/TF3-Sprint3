export function validCPF(cpf){
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

export function maskCPF(input){
  input.value=input.value.replace(/\D/g,'').slice(0,11)
    .replace(/(\d{3})(\d)/,'$1.$2')
    .replace(/(\d{3})(\d)/,'$1.$2')
    .replace(/(\d{3})(\d{1,2})$/,'$1-$2')
}
