import { test } from 'node:test'
import assert from 'node:assert/strict'
import { contemPalavrao, normalizar } from '../assets/js/profanity.js'

test('palavrão: barra palavrões em português, ignorando acento e maiúsculas', () => {
  assert.equal(contemPalavrao('Que merda de jogo'), true)
  assert.equal(contemPalavrao('PÔRRA!'), true)
  assert.equal(contemPalavrao('cuzão'), true)
  assert.equal(contemPalavrao('foda-se'), true)
})

test('palavrão: pega disfarces comuns (números no lugar de letras, letra repetida)', () => {
  assert.equal(contemPalavrao('m3rda'), true)
  assert.equal(contemPalavrao('porrrrrra'), true)
})

test('palavrão: só barra palavra inteira (sem falso positivo)', () => {
  assert.equal(contemPalavrao('computador'), false)
  assert.equal(contemPalavrao('O treinador Cunha, do Cuiabá'), false)
  assert.equal(contemPalavrao('Sub-15, 3 gols e 2 assistências'), false)
  assert.equal(contemPalavrao(''), false)
  assert.equal(contemPalavrao(null), false)
})

test('normalizar: tira acento e caixa, desfaz número no lugar de letra', () => {
  assert.equal(normalizar('PÔRRA'), 'porra')
  assert.equal(normalizar('m3rd4'), 'merda')
})
