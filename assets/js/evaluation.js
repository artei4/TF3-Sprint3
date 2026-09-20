// Regras de avaliação de atletas: características avaliadas, pesos por posição,
// estatísticas de partida e cálculo da nota final ponderada.

export const FEET = ['Destro', 'Canhoto', 'Ambidestro']

// Características avaliadas (nota de 0 a 10)
export const OUTFIELD_CRITERIA = [
  { key: 'finalizacao', label: 'Finalização' },
  { key: 'passe', label: 'Passe' },
  { key: 'tecnica', label: 'Técnica e drible' },
  { key: 'visao', label: 'Visão de jogo' },
  { key: 'marcacao', label: 'Marcação e desarme' },
  { key: 'posicionamento', label: 'Posicionamento' },
  { key: 'fisico', label: 'Físico e velocidade' },
]

export const KEEPER_CRITERIA = [
  { key: 'defesas', label: 'Defesas e reflexos' },
  { key: 'saidas', label: 'Jogo aéreo e saídas' },
  { key: 'posicionamento', label: 'Posicionamento' },
  { key: 'passe', label: 'Passe e reposição' },
  { key: 'fisico', label: 'Físico e agilidade' },
]

// Peso de cada característica em cada posição.
// - Atacante: finalização pesa muito; marcação pesa pouco (não é a função principal).
// - Zagueiro: marcação/posicionamento pesam muito; finalização quase não pesa.
// - Volante e Meia: pesos equilibrados entre características defensivas e ofensivas.
export const WEIGHTS = {
  Goleiro: { defesas: 4, saidas: 2.5, posicionamento: 2, passe: 1, fisico: 0.5 },
  Zagueiro: { marcacao: 4, posicionamento: 3, fisico: 2, passe: 1.5, visao: 0.5, tecnica: 0.5, finalizacao: 0.3 },
  Lateral: { marcacao: 2.5, fisico: 2.5, passe: 2, posicionamento: 2, tecnica: 1.5, visao: 1, finalizacao: 0.7 },
  Volante: { marcacao: 2.5, passe: 2.5, posicionamento: 2, fisico: 2, visao: 2, tecnica: 1.5, finalizacao: 1 },
  Meia: { passe: 2.5, visao: 2.5, tecnica: 2.5, finalizacao: 1.8, marcacao: 1.8, fisico: 1.5, posicionamento: 1.5 },
  Ponta: { tecnica: 3, fisico: 2.5, finalizacao: 2, passe: 1.5, visao: 1.5, posicionamento: 1, marcacao: 0.5 },
  Atacante: { finalizacao: 4, posicionamento: 2.5, tecnica: 2, fisico: 1.5, passe: 1, visao: 1, marcacao: 0.5 },
}

// Estatísticas registradas da partida (todas opcionais)
export const OUTFIELD_STATS = [
  { key: 'minutos', label: 'Minutos jogados' },
  { key: 'gols', label: 'Gols' },
  { key: 'assistencias', label: 'Assistências' },
  { key: 'finalizacoes', label: 'Finalizações (total)' },
  { key: 'finalizacoesAlvo', label: 'Finalizações no alvo' },
  { key: 'passesCertos', label: 'Passes certos' },
  { key: 'passesTentados', label: 'Passes tentados' },
  { key: 'desarmes', label: 'Desarmes / bolas roubadas' },
]

export const KEEPER_STATS = [
  { key: 'minutos', label: 'Minutos jogados' },
  { key: 'defesas', label: 'Defesas realizadas' },
  { key: 'golsSofridos', label: 'Gols sofridos' },
  { key: 'passesCertos', label: 'Passes certos' },
  { key: 'passesTentados', label: 'Passes tentados' },
]

export const STRENGTHS = [
  'Velocidade', 'Drible', 'Finalização', 'Chute de longa distância', 'Passe', 'Visão de jogo',
  'Marcação', 'Desarme', 'Cabeceio', 'Jogo aéreo', 'Posicionamento', 'Reflexo',
  'Bola parada', 'Força física', 'Resistência', 'Liderança', 'Inteligência tática', 'Cruzamento',
]

export function criteriaForPosition(pos) {
  return pos === 'Goleiro' ? KEEPER_CRITERIA : OUTFIELD_CRITERIA
}

export function statsForPosition(pos) {
  return pos === 'Goleiro' ? KEEPER_STATS : OUTFIELD_STATS
}

export function weightsForPosition(pos) {
  return WEIGHTS[pos] || WEIGHTS.Meia
}

// "alto" / "médio" / "baixo" conforme a fatia da característica no total dos pesos da posição
export function weightLevel(pos, key) {
  const weights = weightsForPosition(pos)
  const total = criteriaForPosition(pos).reduce((sum, c) => sum + (weights[c.key] || 0), 0)
  const share = total ? (weights[key] || 0) / total : 0
  if (share >= 0.15) return 'alto'
  if (share >= 0.09) return 'médio'
  return 'baixo'
}

// Nota final = média ponderada das características avaliadas, com pesos da posição.
// Retorna null se nenhuma característica foi avaliada.
export function computeScore(pos, ratings = {}) {
  const weights = weightsForPosition(pos)
  let sum = 0
  let totalWeight = 0
  criteriaForPosition(pos).forEach(({ key }) => {
    const value = Number(ratings[key])
    if (ratings[key] === '' || ratings[key] == null || !Number.isFinite(value)) return
    const weight = weights[key] || 0
    sum += value * weight
    totalWeight += weight
  })
  if (!totalWeight) return null
  return Math.round((sum / totalWeight) * 10) / 10
}

export function percent(hit, total) {
  const a = Number(hit)
  const b = Number(total)
  return Number.isFinite(a) && Number.isFinite(b) && b > 0 ? Math.round((a / b) * 100) : null
}

// Valida as estatísticas. Retorna mensagem de erro ou '' se estiver tudo certo.
export function validateStats(stats) {
  const has = (k) => stats[k] !== undefined
  if (has('finalizacoesAlvo') && has('finalizacoes') && stats.finalizacoesAlvo > stats.finalizacoes) return 'Finalizações no alvo não podem ser mais que as finalizações totais.'
  if (has('passesCertos') && has('passesTentados') && stats.passesCertos > stats.passesTentados) return 'Passes certos não podem ser mais que os passes tentados.'
  if (has('minutos') && stats.minutos > 150) return 'Minutos jogados deve ser no máximo 150.'
  return ''
}
