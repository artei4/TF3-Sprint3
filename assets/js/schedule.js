// Horário das peneiras. Cada peneira calcula a própria contagem a partir da própria data e hora:
// não existe cronômetro compartilhado, só um "agora" que cada cálculo recebe.
// A contagem é informativa; quem decide se a inscrição ainda vale é o servidor (enroll_tryout).
import { t } from './i18n.js'

export const ACADEMY_TZ = 'America/Sao_Paulo'
// ponytail: o Brasil não tem horário de verão desde 2019, então São Paulo é sempre UTC−3.
// Se voltar a ter, calcular o offset com Intl.DateTimeFormat(..., { timeZoneName: 'longOffset' }).
const SP_OFFSET = '-03:00'
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/

// "Hoje" no fuso da academia, não em UTC (às 21h de Brasília o UTC já é amanhã).
export const todayIso = (now = Date.now()) => new Date(now).toLocaleDateString('sv-SE', { timeZone: ACADEMY_TZ })
export const validTime = (time) => TIME_RE.test(time || '')
export function validTryoutDate(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) return false
  const parsed = new Date(date + 'T12:00:00Z')
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date // rejeita 31/02
}

// Início em milissegundos (sem horário, conta a partir da meia-noite do dia).
export function startsAt(tryout) {
  if (!validTryoutDate(tryout?.date)) return null
  return Date.parse(tryout.date + 'T' + (validTime(tryout.time) ? tryout.time : '00:00') + ':00' + SP_OFFSET)
}

export function daysUntil(date, now = Date.now()) {
  if (!validTryoutDate(date)) return null
  return Math.round((Date.parse(date) - Date.parse(todayIso(now))) / 864e5)
}

// cancelled · tbd (data ausente ou inválida) · ended (o dia já passou) · live (já começou, ainda hoje) · today · upcoming
export function tryoutPhase(tryout, now = Date.now()) {
  if (tryout?.status === 'cancelled') return 'cancelled'
  const start = startsAt(tryout)
  if (start === null) return 'tbd'
  const today = todayIso(now)
  if (tryout.date < today) return 'ended'
  if (now >= start) return 'live'
  return tryout.date === today ? 'today' : 'upcoming'
}

export const isPastTryout = (tryout, now) => tryoutPhase(tryout, now) === 'ended'
// Mesma regra do servidor: as inscrições fecham na hora em que a peneira começa.
export const enrollmentOpen = (tryout, now) => ['upcoming', 'today'].includes(tryoutPhase(tryout, now))

const two = (n) => String(n).padStart(2, '0')

// Texto curto do card. `urgent` = falta menos de 1 hora (o texto muda a cada segundo).
export function countdown(tryout, now = Date.now()) {
  const phase = tryoutPhase(tryout, now)
  const at = validTime(tryout?.time) ? ' ' + t('às') + ' ' + tryout.time : ''
  if (phase === 'cancelled') return { phase, text: t('Cancelada') }
  if (phase === 'tbd') return { phase, text: t('Data a confirmar') }
  if (phase === 'ended') return { phase, text: t('Encerrada') }
  if (phase === 'live') return { phase, text: t('Em andamento') }
  const ms = startsAt(tryout) - now
  if (phase === 'today') {
    if (ms < 36e5) {
      const s = Math.floor(ms / 1000)
      return { phase, soon: true, urgent: true, text: t('Começa em') + ' ' + two(Math.floor(s / 60)) + ':' + two(s % 60) }
    }
    const min = Math.floor(ms / 6e4)
    return { phase, soon: true, text: t('Hoje') + at + ' · ' + t('faltam') + ' ' + Math.floor(min / 60) + ' h ' + two(min % 60) + ' min' }
  }
  const days = daysUntil(tryout.date, now)
  if (days === 1) return { phase, soon: true, text: t('Amanhã') + at }
  return { phase, soon: days <= 3, text: t('Em') + ' ' + days + ' ' + t('dias') }
}

// Versão grande do painel do atleta: número + legenda.
export function bigCountdown(tryout, now = Date.now()) {
  const phase = tryoutPhase(tryout, now)
  if (phase === 'live') return { phase, value: t('Agora'), label: t('em andamento') }
  if (phase === 'upcoming') {
    const days = daysUntil(tryout.date, now)
    return { phase, value: String(days), label: (days === 1 ? t('dia') : t('dias')) + ' ' + t('para o jogo') }
  }
  if (phase === 'today') {
    const s = Math.max(0, Math.floor((startsAt(tryout) - now) / 1000))
    return s < 3600
      ? { phase, urgent: true, value: two(Math.floor(s / 60)) + ':' + two(s % 60), label: t('para começar') }
      : { phase, value: Math.floor(s / 3600) + ':' + two(Math.floor(s / 60) % 60), label: t('horas para o jogo') }
  }
  return { phase, value: '—', label: countdown(tryout, now).text }
}
