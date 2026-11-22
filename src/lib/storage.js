const DB_NAME = 'tabi-no-ato'
const STORE = 'memories'

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: 'id' })
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
    request.onblocked = () => reject(new Error('データベースを開けません。ほかのタブを閉じてください。'))
  })
}

async function transact(mode, operation) {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, mode)
    let result, failure
    const abort = error => { failure = error; transaction.abort() }
    transaction.oncomplete = () => { db.close(); resolve(result) }
    transaction.onerror = transaction.onabort = () => { db.close(); reject(failure || transaction.error || new Error('保存できませんでした')) }
    try {
      const request = operation(transaction.objectStore(STORE), abort)
      if (request) request.onsuccess = () => { result = request.result }
    } catch (error) { abort(error) }
  })
}

export const getMemories = () => transact('readonly', store => store.getAll())
export const saveMemory = entry => transact('readwrite', store => store.put(entry))
export const deleteMemory = id => transact('readwrite', store => store.delete(id))
const memoryFields = ['title', 'note', 'type', 'lat', 'lng', 'date', 'photo']
const sameMemory = (left, right) => memoryFields.every(field => left[field] === right[field])

export async function importMemories(entries) {
  const summary = { added: 0, conflicts: 0, unchanged: 0 }
  // Read and merge in one transaction, including changes made in other tabs.
  // A failed write aborts the whole import without replacing existing memories.
  await transact('readwrite', (store, abort) => {
    const request = store.getAll()
    request.onsuccess = () => {
      try {
        const current = new Map(request.result.map(entry => [entry.id, entry]))
        const reservedIds = new Set(entries.map(entry => entry.id))
        for (const entry of entries) {
          const existing = current.get(entry.id)
          if (existing && [...current.values()].some(saved => sameMemory(saved, entry))) {
            summary.unchanged++
            continue
          }
          let restored = entry
          if (existing) {
            let id
            do { id = crypto.randomUUID() } while (current.has(id) || reservedIds.has(id))
            restored = { ...entry, id }
            summary.conflicts++
          }
          store.add(restored)
          current.set(restored.id, restored)
          summary.added++
        }
      } catch (error) { abort(error) }
    }
  })
  return summary
}

export function parseBackup(text) {
  const backup = JSON.parse(text)
  if (!backup || backup.app !== 'tabi-no-ato' || backup.version !== 1 || !Array.isArray(backup.memories) || backup.memories.length > 5000) {
    throw new Error('たびのあとのバックアップファイルを選んでください。')
  }
  return backup.memories.map(entry => {
    if (!entry || typeof entry.id !== 'string' || !entry.id || entry.id.length > 100 ||
        typeof entry.title !== 'string' || !entry.title.trim() || entry.title.length > 60 ||
        typeof entry.note !== 'string' || entry.note.length > 500 ||
        !['building', 'mountain'].includes(entry.type) ||
        !Number.isFinite(entry.lat) || Math.abs(entry.lat) > 85 ||
        !Number.isFinite(entry.lng) || Math.abs(entry.lng) > 180 ||
        !/^\d{4}-\d{2}-\d{2}$/.test(entry.date) || !Number.isFinite(Date.parse(entry.date)) ||
        typeof entry.photo !== 'string' || entry.photo.length > 6000000 ||
        (entry.photo !== '' && !/^data:image\/(jpeg|png|webp);base64,[a-zA-Z0-9+/=]+$/.test(entry.photo))) {
      throw new Error('バックアップの内容を読み込めませんでした。ファイルを確認してください。')
    }
    // Only accept known fields; imported text is always rendered by React, never as HTML.
    const { id, title, note, type, lat, lng, date, photo } = entry
    return { id, title, note, type, lat, lng, date, photo }
  })
}

export const makeBackup = memories => JSON.stringify({ app: 'tabi-no-ato', version: 1, memories }, null, 2)
