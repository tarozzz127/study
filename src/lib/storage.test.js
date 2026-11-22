import 'fake-indexeddb/auto'
import test from 'node:test'
import assert from 'node:assert/strict'
import { getMemories, saveMemory, deleteMemory, importMemories, parseBackup, makeBackup } from './storage.js'

const example = { id: 'kyoto', title: '京都の思い出', note: 'また行きたい', type: 'building', lat: 35, lng: 135, date: '2026-11-22', photo: '' }

test('records survive a fresh database connection, updates replace, and deletes persist', async () => {
  assert.deepEqual(await getMemories(), [])
  await saveMemory(example)
  assert.deepEqual(await getMemories(), [example])
  await saveMemory({ ...example, note: '紅葉がきれいだった' })
  assert.equal((await getMemories())[0].note, '紅葉がきれいだった')
  await deleteMemory(example.id)
  assert.deepEqual(await getMemories(), [])
})

test('backups round trip photos and both marker types without losing unrelated entries', async () => {
  const mountain = { ...example, id: 'fuji', type: 'mountain', photo: 'data:image/jpeg;base64,YWJj' }
  const restored = parseBackup(makeBackup([example, mountain]))
  assert.deepEqual(restored, [example, mountain])
  await saveMemory({ ...example, id: 'other' })
  await importMemories(restored)
  await importMemories(restored)
  assert.equal((await getMemories()).length, 3)
})

test('imports reject unsupported files, corrupt locations, and active image payloads', () => {
  assert.throws(() => parseBackup('{}'))
  for (const change of [{ lat: 100 }, { lng: '135' }, { type: 'script' }, { photo: 'data:image/svg+xml;base64,abc' }, { title: '' }, { date: 'invalid' }]) {
    assert.throws(() => parseBackup(makeBackup([{ ...example, ...change }])))
  }
  assert.throws(() => parseBackup('not json'))
})
