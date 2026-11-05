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

// Nota base = média ponderada das características avaliadas, com os pesos da posição.
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

// ---------------------------------------------------------------------------
// Ajuste por desempenho na partida
// As estatísticas influenciam a nota só um pouco: no máximo ±MAX_ADJUSTMENT ponto.
// Cada grupo de estatística é multiplicado pela relevância dele na posição
// (gols pesam mais para o atacante; desarmes e defesas pesam mais para zagueiro/goleiro).
// ---------------------------------------------------------------------------
export const MAX_ADJUSTMENT = 0.6

const RELEVANCE = {
  ataque: { Atacante: 1, Ponta: 0.9, Meia: 0.7, Lateral: 0.4, Volante: 0.4, Zagueiro: 0.3, Goleiro: 0 },
  passe: { Meia: 1, Volante: 1, Lateral: 0.8, Zagueiro: 0.8, Ponta: 0.6, Atacante: 0.5, Goleiro: 0.5 },
  defesa: { Zagueiro: 1, Volante: 1, Goleiro: 1, Lateral: 0.8, Meia: 0.5, Ponta: 0.2, Atacante: 0.2 },
}

const clamp = (value, min, max) => Math.max(min, Math.min(max, value))
const round1 = (value) => Math.round(value * 10) / 10
const num = (value) => (Number.isFinite(Number(value)) && value !== '' && value != null ? Number(value) : null)

export function performanceAdjustment(pos, stats = {}) {
  const factors = []
  const rel = (group) => (RELEVANCE[group][pos] ?? 0.5)

  // Ataque: gols, assistências e pontaria das finalizações
  let attack = 0
  const goals = num(stats.gols)
  const assists = num(stats.assistencias)
  const shots = num(stats.finalizacoes)
  const onTarget = num(stats.finalizacoesAlvo)
  if (goals) attack += Math.min(goals * 0.15, 0.45)
  if (assists) attack += Math.min(assists * 0.1, 0.3)
  if (shots !== null && onTarget !== null && shots >= 3) attack += clamp((onTarget / shots - 0.4) * 0.4, -0.1, 0.15)
  if (attack) factors.push({ label: 'Gols, assistências e finalizações', value: attack * rel('ataque') })

  // Passes: só conta com amostra mínima de 10 passes
  const hits = num(stats.passesCertos)
  const tries = num(stats.passesTentados)
  if (hits !== null && tries !== null && tries >= 10) {
    factors.push({ label: 'Precisão de passes', value: clamp((hits / tries - 0.75) * 1.2, -0.3, 0.3) * rel('passe') })
  }

  // Defesa: desarmes (linha) ou defesas e gols sofridos (goleiro)
  if (pos === 'Goleiro') {
    const saves = num(stats.defesas)
    const conceded = num(stats.golsSofridos)
    if (saves !== null || conceded !== null) {
      factors.push({ label: 'Defesas e gols sofridos', value: clamp(Math.min((saves || 0) * 0.12, 0.6) - (conceded || 0) * 0.15, -0.5, 0.6) })
    }
  } else if (num(stats.desarmes)) {
    factors.push({ label: 'Desarmes', value: Math.min(num(stats.desarmes) * 0.1, 0.4) * rel('defesa') })
  }

  // Poucos minutos em campo = estatística menos confiável
  const minutes = num(stats.minutos)
  const playtime = minutes === null ? 1 : clamp(minutes / 60, 0.25, 1)
  const total = clamp(factors.reduce((sum, f) => sum + f.value, 0) * playtime, -MAX_ADJUSTMENT, MAX_ADJUSTMENT)
  return {
    value: round1(total),
    factors: factors
      .map((f) => ({ label: f.label, value: round1(f.value * playtime) }))
      .filter((f) => f.value !== 0),
  }
}

// Nota final = nota base (características ponderadas pela posição) + ajuste por desempenho.
// Retorna null enquanto não houver nota base.
export function computeFinalScore(pos, ratings = {}, stats = {}) {
  const base = computeScore(pos, ratings)
  if (base === null) return null
  const { value, factors } = performanceAdjustment(pos, stats)
  const final = round1(clamp(base + value, 0, 10))
  return { base, adjustment: round1(final - base), final, factors }
}
