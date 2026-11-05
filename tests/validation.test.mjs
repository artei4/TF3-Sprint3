import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validCPF, validBirthDate, getCategoryFromAge } from '../assets/js/validation.js'

test('CPF: aceita válidos, com ou sem máscara', () => {
  assert.equal(validCPF('529.982.247-25'), true)
  assert.equal(validCPF('11144477735'), true)
})

test('CPF: rejeita dígito verificador errado, sequência repetida e tamanho errado', () => {
  assert.equal(validCPF('529.982.247-24'), false)
  assert.equal(validCPF('111.444.777-30'), false)
  assert.equal(validCPF('000.000.000-00'), false)
  assert.equal(validCPF('999.999.999-99'), false)
  assert.equal(validCPF('5299822472'), false)
  assert.equal(validCPF(''), false)
})

test('Nascimento: rejeita datas impossíveis, futuras e antes de 1900', () => {
  assert.equal(validBirthDate('2008-03-14'), true)
  assert.equal(validBirthDate('2008-02-31'), false)
  assert.equal(validBirthDate('2007-02-29'), false)
  assert.equal(validBirthDate('2008-02-29'), true)
  assert.equal(validBirthDate('2999-01-01'), false)
  assert.equal(validBirthDate('1899-12-31'), false)
  assert.equal(validBirthDate('14/03/2008'), false)
})

test('Categoria pela idade', () => {
  assert.equal(getCategoryFromAge(17), 'Sub-17')
  assert.equal(getCategoryFromAge(18), 'Sub-20')
  assert.equal(getCategoryFromAge(21), 'Fora da faixa')
  assert.equal(getCategoryFromAge('x'), 'Categoria não definida')
})
