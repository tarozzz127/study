import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Camera, Check, ImagePlus, MapPin, Trash2, X } from 'lucide-react'
import { MarkerArt } from './MarkerArt.jsx'
import { preparePhoto } from './lib/photo.js'

export function today() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}
export function formatDate(date) {
  return new Intl.DateTimeFormat('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(`${date}T12:00:00`))
}

export default function MemoryDialog({ entry, editing, onClose, onSave, onDelete }) {
  const dialog = useRef(null)
  const [isEditing, setEditing] = useState(editing)
  const [draft, setDraft] = useState(entry)
  const [busy, setBusy] = useState(false)
  const [photoBusy, setPhotoBusy] = useState(false)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const photoRequest = useRef(0)
  useEffect(() => {
    const element = dialog.current
    const previous = document.activeElement
    element.showModal()
    return () => { photoRequest.current++; element.close(); previous?.focus() }
  }, [])

  function update(key, value) { setDraft(current => ({ ...current, [key]: value })) }
  async function choosePhoto(event) {
    const file = event.target.files?.[0]
    if (!file) return
    const request = ++photoRequest.current
    setError(''); setPhotoBusy(true)
    try { const photo = await preparePhoto(file); if (request === photoRequest.current) update('photo', photo) }
    catch (failure) { if (request === photoRequest.current) setError(failure.message) }
    finally { if (request === photoRequest.current) setPhotoBusy(false); event.target.value = '' }
  }
  async function submit(event) {
    event.preventDefault()
    if (!draft.title.trim()) { setError('場所の名前を入力してください。'); return }
    setBusy(true); setError('')
    try { await onSave({ ...draft, title: draft.title.trim(), note: draft.note.trim() }) }
    catch { setError('保存できませんでした。端末の空き容量やブラウザの設定を確認して、もう一度お試しください。'); setBusy(false) }
  }
  async function remove() {
    setBusy(true); setError('')
    try { await onDelete(entry.id) }
    catch { setError('削除できませんでした。もう一度お試しください。'); setBusy(false) }
  }

  // Keep dismissal explicit: native photo pickers can return a click on the
  // dialog backdrop. Treating that click as cancel would discard the draft.
  return <dialog ref={dialog} className="memory-dialog" onCancel={event => { event.preventDefault(); if (!busy && !photoBusy) onClose() }} aria-labelledby="dialog-title">
    <div className="dialog-heading"><span className="eyebrow">{isEditing ? (entry.id ? 'EDIT MEMORY' : 'NEW MEMORY') : 'YOUR MEMORY'}</span><button className="icon-button" aria-label="閉じる" onClick={onClose} disabled={busy || photoBusy}><X size={22} /></button></div>
    <div className="dialog-content">
      {isEditing ? <form onSubmit={submit}>
        <h2 id="dialog-title">この場所の、思い出を。</h2><p className="dialog-intro">写真とひとこと。小さな記録からはじめよう。</p>
        <div className="photo-picker">
          {draft.photo ? <><img src={draft.photo} alt="選んだ旅の写真" /><label className="photo-replace"><Camera size={17} />写真を変更<input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" onChange={choosePhoto} disabled={photoBusy || busy} /></label><button type="button" className="photo-remove icon-button" aria-label="写真を外す" onClick={() => update('photo', '')} disabled={photoBusy || busy}><X size={18} /></button></> : <label className="photo-empty"><ImagePlus size={29} strokeWidth={1.5} /><strong>{photoBusy ? '写真を準備しています…' : '写真を選ぶ'}</strong><span>写真ライブラリから · あとでも追加できます</span><input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" onChange={choosePhoto} disabled={photoBusy || busy} /></label>}
        </div>
        <div className="field-row"><label className="field title-field">場所の名前<span className="required">必須</span><input name="title" value={draft.title} maxLength={60} placeholder="例：京都の小さな喫茶店" onChange={event => update('title', event.target.value)} required autoComplete="off" /></label><label className="field date-field">訪れた日<input name="date" type="date" value={draft.date} onChange={event => update('date', event.target.value)} required /></label></div>
        <label className="field">ひとことメモ<textarea name="note" value={draft.note} maxLength={500} placeholder="どんな景色だった？ 何が心に残った？" onChange={event => update('note', event.target.value)} rows={3} /><span className="character-count">{draft.note.length} / 500</span></label>
        <fieldset className="marker-picker"><legend>地図に置くマーク</legend><div className="marker-options">{[['building', '建物', '街歩きや、お気に入りのお店に'], ['mountain', '山', '自然や、忘れられない景色に']].map(([type, name, description]) => <label className={`marker-option ${draft.type === type ? 'checked' : ''}`} key={type}><input type="radio" name="marker" value={type} checked={draft.type === type} onChange={() => update('type', type)} /><MarkerArt type={type} /><span><strong>{name}</strong><small>{description}</small></span>{draft.type === type && <Check className="marker-check" size={16} />}</label>)}</div></fieldset>
        <p className="coordinate-note"><MapPin size={14} />選んだ場所 {draft.lat.toFixed(4)}, {draft.lng.toFixed(4)}</p>
        {error && <p role="alert" className="form-error">{error}</p>}
        <div className="dialog-actions"><button type="button" className="button secondary" onClick={onClose} disabled={busy || photoBusy}>キャンセル</button><button className="button primary" type="submit" disabled={busy || photoBusy}><Check size={18} />{busy ? '保存しています…' : photoBusy ? '写真を準備中…' : '地図に残す'}</button></div>
      </form> : <>
        <div className="detail-photo">{entry.photo ? <img src={entry.photo} alt={`${entry.title}の写真`} /> : <MarkerArt type={entry.type} size={100} />}</div>
        <div className="detail-date"><MarkerArt type={entry.type} size={30} />{formatDate(entry.date)}</div><h2 id="dialog-title">{entry.title}</h2><p className="detail-note">{entry.note || 'この場所に、思い出を残しました。'}</p>
        <p className="coordinate-note"><MapPin size={14} />{entry.lat.toFixed(4)}, {entry.lng.toFixed(4)}</p>
        {error && <p role="alert" className="form-error">{error}</p>}
        {confirmDelete ? <div className="delete-confirm"><p>この思い出を削除しますか？ 元には戻せません。</p><div><button className="button secondary" onClick={() => setConfirmDelete(false)} disabled={busy}>やめる</button><button className="button danger" onClick={remove} disabled={busy}>{busy ? '削除中…' : '削除する'}</button></div></div> : <div className="dialog-actions"><button className="button text-button" onClick={() => setConfirmDelete(true)}><Trash2 size={17} />削除</button><button className="button primary" onClick={() => setEditing(true)}>思い出を編集</button></div>}
        <button className="back-link" onClick={onClose}><ArrowLeft size={16} />地図にもどる</button>
      </>}
    </div>
  </dialog>
}
