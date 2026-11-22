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
    let result
    const request = operation(transaction.objectStore(STORE))
    if (request) request.onsuccess = () => { result = request.result }
    transaction.oncomplete = () => { db.close(); resolve(result) }
    transaction.onerror = transaction.onabort = () => { db.close(); reject(transaction.error || new Error('保存できませんでした')) }
  })
}

export const getMemories = () => transact('readonly', store => store.getAll())
export const saveMemory = entry => transact('readwrite', store => store.put(entry))
export const deleteMemory = id => transact('readwrite', store => store.delete(id))
export const importMemories = entries => transact('readwrite', store => { entries.forEach(entry => store.put(entry)) })

export function parseBackup(text) {
  const backup = JSON.parse(text)
  if (backup.app !== 'tabi-no-ato' || backup.version !== 1 || !Array.isArray(backup.memories) || backup.memories.length > 5000) {
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
