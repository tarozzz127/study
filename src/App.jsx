import { useEffect, useRef, useState } from 'react'
import { ArrowDownToLine, ArrowRight, BookOpen, Check, ChevronRight, CircleHelp, FolderInput, Map, MapPin, Plus, ShieldCheck, Sparkles, X } from 'lucide-react'
import TravelMap from './TravelMap.jsx'
import MemoryDialog, { formatDate, today } from './MemoryDialog.jsx'
import { MarkerArt } from './MarkerArt.jsx'
import { deleteMemory, getMemories, importMemories, makeBackup, parseBackup, saveMemory } from './lib/storage.js'

export default function App() {
  const [memories, setMemories] = useState([])
  const [ready, setReady] = useState(false)
  const [storageError, setStorageError] = useState(false)
  const [dialog, setDialog] = useState(null)
  const [selected, setSelected] = useState(null)
  const [picking, setPicking] = useState(false)
  const [notice, setNotice] = useState('')
  const [filter, setFilter] = useState('all')
  const [locating, setLocating] = useState(false)
  const [importing, setImporting] = useState(false)
  const help = useRef(null)
  const importInput = useRef(null)

  useEffect(() => {
    getMemories().then(setMemories).catch(() => setStorageError(true)).finally(() => setReady(true))
  }, [])
  useEffect(() => {
    if (!notice) return
    const timeout = setTimeout(() => setNotice(''), 6000)
    return () => clearTimeout(timeout)
  }, [notice])

  const sorted = [...memories].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
  const visible = sorted.filter(entry => filter === 'all' || entry.type === filter)
  function add(position) {
    if (!ready || storageError || dialog) return
    setPicking(false)
    setDialog({ editing: true, entry: { ...position, id: '', title: '', date: today(), note: '', photo: '', type: 'building' } })
  }
  function select(entry) { setSelected(entry); setDialog({ editing: false, entry }) }
  function startPicking() {
    setPicking(true)
    document.querySelector('.map-shell')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    document.querySelector('.map-canvas')?.focus({ preventScroll: true })
  }
  async function save(entry) {
    const saved = { ...entry, id: entry.id || crypto.randomUUID() }
    await saveMemory(saved)
    setMemories(current => [...current.filter(memory => memory.id !== saved.id), saved])
    setSelected(saved); setDialog(null); setFilter('all')
    setNotice('思い出を地図に残しました。')
    navigator.storage?.persist?.().catch(() => {})
  }
  async function remove(id) {
    await deleteMemory(id)
    setMemories(current => current.filter(memory => memory.id !== id))
    setSelected(null); setDialog(null); setNotice('思い出を削除しました。')
  }
  function exportData() {
    const blob = new Blob([makeBackup(memories)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url; link.download = `たびのあと-${today()}.json`
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    setNotice('バックアップを書き出しました。ファイルを大切に保管してください。')
  }
  async function restore(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setImporting(true)
    try {
      if (file.size > 100 * 1024 * 1024) throw new Error('100MB以下のバックアップを選んでください。')
      const entries = parseBackup(await file.text())
      await importMemories(entries)
      setMemories(await getMemories()); setStorageError(false)
      help.current.close(); setNotice(`${entries.length}件の思い出を読み込みました。`)
    } catch (error) { setNotice(error instanceof SyntaxError ? 'バックアップファイルを読み込めませんでした。' : error.message) }
    finally { event.target.value = ''; setImporting(false) }
  }

  return <div className="app">
    <header className="app-header"><a className="brand" href="/" aria-label="たびのあと ホーム"><span className="brand-icon"><Map size={25} strokeWidth={1.7} /></span><span>たびのあと<small>YOUR LITTLE TRAVEL JOURNAL</small></span></a><div className="header-actions"><span className="private-label"><ShieldCheck size={16} />自分だけの旅の記録</span><button className="help-button" onClick={() => help.current.showModal()}><CircleHelp size={19} /><span>使い方</span></button></div></header>
    <main>
      <section className="page-heading"><div><p className="eyebrow">PLACES THAT STAY WITH YOU</p><h1>あなたの旅を、<span>地図に。</span></h1><p className="heading-caption">何気ない寄り道も、忘れられない景色も。</p></div><button className="button primary add-button" onClick={startPicking} disabled={!ready || storageError}><Plus size={20} />思い出を残す</button></section>
      {storageError && <p role="alert" className="storage-error">このブラウザでは記録を読み込めませんでした。通常モードで開き直し、ブラウザのストレージを有効にしてください。データの上書きを防ぐため、新規保存は停止しています。</p>}
      <section className={`journal-layout ${picking ? 'is-picking' : ''}`} aria-label="旅の記録">
        <aside className="journal-sidebar"><div className="sidebar-heading"><div><BookOpen size={19} /><h2>旅の思い出</h2></div><span className="memory-count">{memories.length}<small>か所</small></span></div>
          <div className="filters" role="group" aria-label="マークで絞り込み">{[['all', 'すべて'], ['building', '建物'], ['mountain', '山']].map(([value, label]) => <button key={value} aria-pressed={filter === value} className={filter === value ? 'active' : ''} onClick={() => setFilter(value)}>{label}</button>)}</div>
          <div className="memory-list">
            {!ready ? <p className="loading-state" role="status">思い出をひらいています…</p> : !memories.length ? <div className="empty-state"><div className="empty-illustration"><span className="illustration-sun" /><div className="illustration-mountain"><MarkerArt type="mountain" size={95} /></div><svg className="illustration-trail" viewBox="0 0 180 80" aria-hidden="true"><path d="M16 62c30 0 21-45 63-34s28 40 77 13" /></svg><div className="illustration-building"><MarkerArt type="building" size={80} /></div><span className="illustration-star">+</span></div><p className="empty-eyebrow">まだ、まっしろな旅の地図。</p><h3>最初の思い出を<br />残してみませんか</h3><p>訪れた場所に、写真とひとこと。<br />あなただけの地図が育っていきます。</p><button className="empty-start" onClick={startPicking} disabled={storageError}>地図から場所を選ぶ<ArrowRight size={16} /></button></div> : !visible.length ? <div className="filter-empty"><MarkerArt type={filter} /><p>このマークの思い出は<br />まだありません。</p></div> : <div className="entry-list">{visible.map(entry => <button key={entry.id} className={`entry-card ${selected?.id === entry.id ? 'selected' : ''}`} onClick={() => select(entry)}><div className="entry-thumb">{entry.photo ? <img src={entry.photo} alt="" /> : <MarkerArt type={entry.type} size={46} />}</div><span className="entry-copy"><small>{formatDate(entry.date)}</small><strong>{entry.title}</strong><span>{entry.note || (entry.type === 'building' ? '街で出会った思い出' : '自然の中の思い出')}</span></span><ChevronRight size={15} /></button>)}</div>}
          </div>
          <div className="sidebar-footer"><ShieldCheck size={17} /><p>思い出はこのブラウザに保存されます<small>ほかの端末とは自動で共有されません</small></p></div>
        </aside>
        <div className="map-area"><TravelMap memories={memories} selected={selected} onSelect={select} onAdd={add} onNotice={setNotice} locating={locating} setLocating={setLocating} />{picking && <div className="picking-banner" role="status"><MapPin size={19} /><span>思い出を残したい場所をタップ</span><button aria-label="場所選びをやめる" onClick={() => setPicking(false)}><X size={19} /></button></div>}</div>
      </section>
      <footer className="page-footer"><span><Sparkles size={14} />旅の数だけ、あなたらしい地図に。</span><button onClick={() => help.current.showModal()}>使い方・データの保存<ArrowRight size={14} /></button></footer>
    </main>
    {notice && <div className="toast" role="status"><Check size={18} /><span>{notice}</span><button aria-label="通知を閉じる" onClick={() => setNotice('')}><X size={17} /></button></div>}
    {dialog && <MemoryDialog key={dialog.entry.id || 'new'} {...dialog} onClose={() => setDialog(null)} onSave={save} onDelete={remove} />}
    <dialog ref={help} className="help-dialog" aria-labelledby="help-title" onClick={event => { if (event.target === help.current && !importing) help.current.close() }} onCancel={event => { if (importing) event.preventDefault() }}><div className="dialog-heading"><span className="eyebrow">A LITTLE GUIDE</span><button className="icon-button" aria-label="使い方を閉じる" onClick={() => help.current.close()} disabled={importing}><X size={22} /></button></div><div className="dialog-content"><h2 id="help-title">思い出の残し方</h2><ol className="guide-steps"><li><span>1</span><div><strong>地図で場所をタップ</strong><p>指で動かしたり、広げたりして場所を探せます。</p></div></li><li><span>2</span><div><strong>写真とひとことを添える</strong><p>場所の名前と日付を入れましょう。写真はあとからでも。</p></div></li><li><span>3</span><div><strong>建物か山のマークを置く</strong><p>「地図に残す」で完成。マークをタップすると見返せます。</p></div></li></ol><div className="data-note"><ShieldCheck size={21} /><div><strong>あなたの思い出は、このブラウザに。</strong><p>写真とメモはサーバーに送信しません。端末やブラウザを変えても自動では引き継がれません。ブラウザのデータを消す前に、バックアップを保存してください。</p><p>背景の地図と現在地の取得にはインターネットを使います。</p></div></div><div className="backup-actions"><button className="button secondary" onClick={exportData} disabled={!ready || !memories.length || importing}><ArrowDownToLine size={18} />バックアップを保存</button><button className="button secondary" onClick={() => importInput.current.click()} disabled={importing}><FolderInput size={18} />{importing ? '読み込み中…' : 'バックアップを読込'}</button><input ref={importInput} type="file" accept="application/json,.json" onChange={restore} hidden /></div><p className="backup-hint">読み込みでは今の記録を残し、同じ記録だけを更新します。</p></div></dialog>
  </div>
}
