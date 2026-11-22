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
  assert.throws(() => parseBackup('null'), /バックアップファイル/)
  for (const change of [{ lat: 100 }, { lng: '135' }, { type: 'script' }, { photo: 'data:image/svg+xml;base64,abc' }, { title: '' }, { date: 'invalid' }]) {
    assert.throws(() => parseBackup(makeBackup([{ ...example, ...change }])))
  }
  assert.throws(() => parseBackup('not json'))
})

test('an old backup preserves current text and photo, restores a copy, and is repeatable', async () => {
  const old = { ...example, id: 'changed', photo: 'data:image/jpeg;base64,YWJj' }
  const current = { ...old, note: '新しいメモ', photo: 'data:image/jpeg;base64,ZGVm' }
  await saveMemory(current)
  assert.deepEqual(await importMemories([old]), { added: 1, conflicts: 1, unchanged: 0 })
  let all = await getMemories()
  assert.deepEqual(all.find(entry => entry.id === current.id), current)
  const copy = all.find(entry => entry.id !== current.id && entry.note === old.note && entry.photo === old.photo && entry.id !== 'kyoto')
  assert.ok(copy)
  assert.deepEqual(copy, { ...old, id: copy.id })
  assert.deepEqual(await importMemories([old]), { added: 0, conflicts: 0, unchanged: 1 })
  all = await getMemories()
  assert.deepEqual(all.find(entry => entry.id === current.id), current)
  assert.equal(all.filter(entry => entry.id === copy.id).length, 1)
})

test('a failed import rolls back every added record without changing existing memories', async () => {
  const before = await getMemories()
  await assert.rejects(importMemories([{ ...example, id: 'rollback' }, { ...example, id: undefined }]))
  assert.deepEqual(await getMemories(), before)
})

test('duplicate backup IDs with different content both survive', async () => {
  const one = { ...example, id: 'duplicate', note: '最初の記録' }
  const two = { ...one, note: '別の内容' }
  assert.deepEqual(await importMemories([one, two]), { added: 2, conflicts: 1, unchanged: 0 })
  const all = await getMemories()
  assert.deepEqual(all.find(entry => entry.id === one.id), one)
  assert.ok(all.some(entry => entry.id !== one.id && entry.note === two.note))
})
