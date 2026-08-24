import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

async function source(path) {
  return readFile(new URL(`../../${path}`, import.meta.url), 'utf8')
}

test('AppShell nao cria um segundo landmark main ao redor das paginas', async () => {
  const shell = await source('src/apps/portal/AppShell.jsx')

  assert.match(shell, /id="portal-main-content"/)
  assert.doesNotMatch(shell, /<main[^>]*id="portal-main-content"/)
})

test('modal de pedido da radio oferece fechamento por Escape e feedback acessivel', async () => {
  const radio = await source('src/apps/radio/RadioPage.jsx')

  assert.match(radio, /event\.key !== "Escape"/)
  assert.match(radio, /aria-modal="true"/)
  assert.match(radio, /aria-live="polite"/)
})

test('busca de noticias possui nome acessivel explicito', async () => {
  const news = await source('src/modules/news/pages/NewsPage.jsx')

  assert.match(news, /aria-label="Pesquisar notícias"/)
})
