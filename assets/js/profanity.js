// Filtro de palavrões, baseado na biblioteca "bad-words".
//
// A lista que vem na biblioteca é em inglês, então acrescentamos aqui os palavrões
// em português. Para bloquear mais uma palavra, basta incluí-la em PALAVROES (sem
// acento, em minúsculas). Para liberar uma, basta removê-la.
import * as BadWords from 'bad-words'

// v3 (CommonJS) entrega o construtor em `default`; v4 (ESM) em `Filter`.
const Filter = BadWords.Filter ?? BadWords.default?.Filter ?? BadWords.default ?? BadWords

// true  = bloqueia palavrões em inglês + português
// false = bloqueia só os de PALAVROES (use se a lista em inglês barrar algo legítimo)
const INCLUIR_LISTA_EM_INGLES = true

const PALAVROES = [
  'porra', 'caralho', 'carai', 'caraio', 'merda', 'merdao', 'bosta',
  'puta', 'puto', 'putaria', 'fdp', 'pqp', 'vsf', 'vtnc', 'tnc', 'krl',
  'foda', 'foder', 'fodase', 'fodido', 'fodida', 'fodeu',
  'cu', 'cuzao', 'cuzona', 'buceta', 'xoxota', 'xereca', 'piroca', 'punheta',
  'viado', 'viadinho', 'arrombado', 'arrombada', 'babaca', 'otario', 'otaria',
  'vagabundo', 'vagabunda', 'vadia', 'desgraca', 'desgracado', 'desgracada',
  'idiota', 'imbecil', 'retardado',
]

const LEET = { 0: 'o', 1: 'i', 3: 'e', 4: 'a', 5: 's', '@': 'a', $: 's' }

// Deixa o texto "comparável": sem acento, minúsculo, com os disfarces mais comuns
// desfeitos ("m3rda" -> "merda", "porrrrra" -> "porra").
// Só serve para checar; a mensagem enviada continua exatamente como a pessoa escreveu.
export function normalizar(texto) {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[013-5@$]/g, (c) => LEET[c])
    .replace(/(.)\1{2,}/g, '$1$1')
}

const filtro = new Filter({ emptyList: !INCLUIR_LISTA_EM_INGLES })
filtro.addWords(...PALAVROES.map(normalizar))

// true se o texto tiver algum palavrão (palavra inteira: "computador" não é barrado por causa de "puta").
export function contemPalavrao(texto) {
  const limpo = normalizar(texto)
  return limpo !== '' && filtro.isProfane(limpo)
}
