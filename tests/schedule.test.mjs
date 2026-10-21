import { test } from 'node:test'
import assert from 'node:assert/strict'

// i18n lê o idioma salvo no navegador; no Node não existe localStorage.
globalThis.localStorage = { getItem: () => null, setItem() {} }
const { countdown, bigCountdown, tryoutPhase, enrollmentOpen, startsAt, todayIso } = await import('../assets/js/schedule.js')

// "Agora" fixo: 19/10/2026 às 10:00 em São Paulo (13:00 UTC).
const NOW = Date.parse('2026-10-19T10:00:00-03:00')
const at = (date, time = '14:00', extra = {}) => ({ date, time, ...extra })

test('cada peneira conta a partir da própria data, sem relógio compartilhado', () => {
  const a = at('2026-11-07', '14:00')
  const b = at('2026-10-19', '10:30')
  const before = countdown(a, NOW).text
  assert.equal(before, 'Em 19 dias')
  assert.equal(countdown(b, NOW).text, 'Começa em 30:00')
  // calcular b em outro instante não muda a
  countdown(b, NOW + 60_000)
  assert.equal(countdown(a, NOW).text, before)
  assert.equal(countdown(b, NOW + 60_000).text, 'Começa em 29:00')
})

test('estados: amanhã, hoje, em andamento, encerrada, cancelada', () => {
  assert.equal(countdown(at('2026-10-20', '09:00'), NOW).text, 'Amanhã às 09:00')
  assert.equal(countdown(at('2026-10-19', '15:20'), NOW).text, 'Hoje às 15:20 · faltam 5 h 20 min')
  assert.equal(countdown(at('2026-10-19', '09:00'), NOW).text, 'Em andamento')
  assert.equal(countdown(at('2026-10-18', '09:00'), NOW).text, 'Encerrada')
  assert.equal(countdown(at('2026-11-07', '14:00', { status: 'cancelled' }), NOW).text, 'Cancelada')
  assert.equal(countdown(at('2026-10-22'), NOW).soon, true)
  assert.equal(countdown(at('2026-10-25'), NOW).soon, false)
})

test('datas ausentes ou inválidas não quebram a contagem', () => {
  for (const date of ['', undefined, '2026-02-31', '07/11/2026', 'amanhã']) {
    assert.equal(tryoutPhase({ date, time: '14:00' }, NOW), 'tbd')
    assert.equal(countdown({ date, time: '14:00' }, NOW).text, 'Data a confirmar')
    assert.equal(enrollmentOpen({ date, time: '14:00' }, NOW), false)
  }
  // horário inválido: conta a partir da meia-noite
  assert.equal(startsAt(at('2026-11-07', '25:99')), Date.parse('2026-11-07T00:00:00-03:00'))
})

test('fuso de São Paulo: às 22h de Brasília ainda é hoje', () => {
  const night = Date.parse('2026-10-19T22:00:00-03:00') // 01:00 UTC do dia 20
  assert.equal(todayIso(night), '2026-10-19')
  assert.equal(tryoutPhase(at('2026-10-19', '09:00'), night), 'live')
  assert.equal(tryoutPhase(at('2026-10-19', '09:00'), Date.parse('2026-10-20T00:01:00-03:00')), 'ended')
})

test('inscrição fecha quando a peneira começa', () => {
  assert.equal(enrollmentOpen(at('2026-10-19', '10:01'), NOW), true)
  assert.equal(enrollmentOpen(at('2026-10-19', '10:00'), NOW), false)
  assert.equal(enrollmentOpen(at('2026-11-07'), NOW), true)
})

test('contagem grande do painel', () => {
  assert.deepEqual([bigCountdown(at('2026-11-07'), NOW).value, bigCountdown(at('2026-11-07'), NOW).label], ['19', 'dias para o jogo'])
  assert.equal(bigCountdown(at('2026-10-19', '13:05'), NOW).value, '3:05')
  assert.equal(bigCountdown(at('2026-10-19', '10:09'), NOW).value, '09:00')
  assert.equal(bigCountdown(at('2026-10-19', '09:00'), NOW).value, 'Agora')
})
