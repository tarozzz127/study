import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import { renderToStaticMarkup } from 'react-dom/server'
import { Layers, LocateFixed, Minus, Plus, RotateCcw, X } from 'lucide-react'
import { MarkerArt } from './MarkerArt.jsx'

const JAPAN = [36.2, 137.6]
export default function TravelMap({ memories, selected, onSelect, onAdd, onNotice, locating, setLocating }) {
  const container = useRef(null)
  const map = useRef(null)
  const layer = useRef(null)
  const callbacks = useRef({ onAdd, onSelect, onNotice })
  const [tileError, setTileError] = useState(false)
  const [reference, setReference] = useState(false)
  const [overlapping, setOverlapping] = useState([])
  const chooser = useRef(null)
  const tiles = useRef(null)
  const previousIds = useRef(new Set())
  const initializedView = useRef(false)
  const justPlaced = useRef(null)
  callbacks.current = { onAdd, onSelect, onNotice }

  useEffect(() => {
    if (overlapping.length) chooser.current.showModal()
  }, [overlapping])

  useEffect(() => {
    const instance = L.map(container.current, { zoomControl: false, attributionControl: true, minZoom: 2, maxZoom: 18, worldCopyJump: true }).setView(JAPAN, 5)
    map.current = instance
    tiles.current = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>',
      maxZoom: 19,
    })
    tiles.current.on('tileerror', () => setTileError(true))
    tiles.current.on('tileload', () => setTileError(false))
    layer.current = L.layerGroup().addTo(instance)
    instance.on('click', event => callbacks.current.onAdd({ lat: Math.max(-85, Math.min(85, event.latlng.lat)), lng: event.latlng.wrap().lng }))
    instance.on('locationfound', event => {
      setReference(true)
      instance.flyTo(event.latlng, 13, { duration: 0.6 })
      setLocating(false)
      callbacks.current.onNotice('現在地を表示しました。残したい場所をタップしてください。')
    })
    instance.on('locationerror', () => { setLocating(false); callbacks.current.onNotice('現在地を取得できませんでした。地図を動かして場所を選べます。') })
    const observer = new ResizeObserver(() => instance.invalidateSize())
    observer.observe(container.current)
    return () => { observer.disconnect(); instance.remove(); map.current = null }
  }, [setLocating])

  useEffect(() => {
    if (!map.current || !tiles.current) return
    if (reference) tiles.current.addTo(map.current)
    else tiles.current.remove()
  }, [reference])

  useEffect(() => {
    if (!map.current) return
    // Fit restored memories once, not every time a new object is placed.
    if (!initializedView.current && (memories.length || selected)) {
      initializedView.current = true
      if (!selected) map.current.fitBounds(memories.map(entry => [entry.lat, entry.lng]), { padding: [90, 90], maxZoom: 13 })
    }
    const placed = memories.find(entry => entry.id === selected?.id && !previousIds.current.has(entry.id))
    justPlaced.current = placed?.id
    if (placed) setReference(false)
    layer.current.clearLayers()
    const renderedMarkers = []
    memories.forEach(entry => {
      const icon = L.divIcon({
        className: `memory-pin ${selected?.id === entry.id ? 'is-selected' : ''}`,
        html: renderToStaticMarkup(<div className={`map-object ${placed?.id === entry.id ? 'is-new' : ''}`}><svg className="object-ground" viewBox="0 0 88 42" aria-hidden="true"><path className="ground-edge" d="m5 17 37-13 41 13v8L46 39 5 25z" /><path className="ground-top" d="M5 17 42 4l41 13-37 14z" /><path className="ground-grass" d="m17 19 5-2m43 2 5-2m-24 9 5-2" /></svg><MarkerArt type={entry.type} size={68} /></div>),
        iconSize: [88, 88], iconAnchor: [44, 70],
      })
      const marker = L.marker([entry.lat, entry.lng], { icon, keyboard: true }).addTo(layer.current)
      marker.getElement().setAttribute('aria-label', `${entry.title}の記録`)
      const label = document.createElement('span')
      label.textContent = entry.title
      marker.bindTooltip(label, { direction: 'bottom', offset: [0, 15], className: 'object-label' })
      renderedMarkers.push({ entry, marker })
      marker.on('click', event => {
        const pointer = event.originalEvent
        // Hit-test the rendered objects, not geographic distance: overlap changes with zoom.
        const candidates = typeof pointer?.clientX === 'number' && !pointer.key ? renderedMarkers.filter(item => {
          const rect = item.marker.getElement().getBoundingClientRect()
          return pointer.clientX >= rect.left - 8 && pointer.clientX <= rect.right + 8 && pointer.clientY >= rect.top - 8 && pointer.clientY <= rect.bottom + 8
        }).map(item => item.entry) : [entry]
        if (candidates.length > 1) {
          marker.closeTooltip()
          setOverlapping(candidates)
        } else callbacks.current.onSelect(entry)
      })
    })
    previousIds.current = new Set(memories.map(entry => entry.id))
  }, [memories, selected])

  useEffect(() => {
    // Saving grows the current scene. Only explicit navigation may pan it.
    if (selected && map.current && justPlaced.current !== selected.id) map.current.panInside([selected.lat, selected.lng], { padding: [90, 100] })
  }, [selected])

  function showAll() {
    if (memories.length) map.current.fitBounds(memories.map(entry => [entry.lat, entry.lng]), { padding: [90, 90], maxZoom: 13 })
    else map.current.setView(JAPAN, 5)
  }

  return <div className={`map-shell ${reference ? 'reference-map' : 'personal-map'}`}>
    <div ref={container} className="map-canvas" aria-label="旅の地図。場所をタップすると記録できます。キーボードでは矢印で移動し、中央に記録ボタンを使えます。" />
    <div className="map-view-switch" role="group" aria-label="地図の表示"><button aria-pressed={!reference} onClick={() => setReference(false)}>自分の地図</button><button aria-pressed={reference} onClick={() => setReference(true)}><Layers size={14} />場所を探す</button></div>
    <div className="map-tip"><span className="tip-dot" />{reference ? '下絵で訪れた場所を探して、タップ' : memories.length ? `建物 ${memories.filter(entry => entry.type === 'building').length} ・ 山 ${memories.filter(entry => entry.type === 'mountain').length} — あなたの旅で育つ地図` : 'まっしろな地図。「場所を探す」からはじめよう'}</div>
    {tileError && reference && <div className="tile-error" role="status">地図を読み込めません。接続を確認して <button onClick={() => { setTileError(false); tiles.current.redraw() }}>再読み込み</button></div>}
    <div className="map-tools">
      <div className="zoom-tools"><button aria-label="拡大" onClick={() => map.current.zoomIn()}><Plus size={21} /></button><button aria-label="縮小" onClick={() => map.current.zoomOut()}><Minus size={21} /></button></div>
      <button aria-label="現在地を表示" title="現在地を表示" disabled={locating} onClick={() => { setLocating(true); map.current.locate({ timeout: 10000 }) }}><LocateFixed size={21} /></button>
      <button aria-label="地図全体を表示" title="地図全体を表示" onClick={showAll}><RotateCcw size={19} /></button>
    </div>
    <div className="map-bottom"><span>あなただけの、旅の地図</span><button onClick={() => { const center = map.current.getCenter().wrap(); onAdd({ lat: Math.max(-85, Math.min(85, center.lat)), lng: center.lng }) }}>地図の中央に記録</button></div>
    {overlapping.length > 0 && <dialog ref={chooser} className="overlap-dialog" aria-labelledby="overlap-title" onCancel={event => { event.preventDefault(); setOverlapping([]) }} onClick={event => { if (event.target === event.currentTarget) setOverlapping([]) }}><div className="dialog-heading"><span className="eyebrow">CLOSE TOGETHER</span><button className="icon-button" aria-label="思い出の選択を閉じる" onClick={() => setOverlapping([])}><X size={22} /></button></div><div className="dialog-content"><h2 id="overlap-title">重なった思い出を選ぶ</h2><p className="dialog-intro">このあたりに {overlapping.length} か所。見たい場所を選んでください。</p><div className="overlap-options">{overlapping.map(entry => <button key={entry.id} onClick={() => { setOverlapping([]); callbacks.current.onSelect(entry) }}><MarkerArt type={entry.type} size={46} /><span><strong>{entry.title}</strong><small>{entry.date} ・ {entry.type === 'mountain' ? '山' : '建物'}</small></span></button>)}</div></div></dialog>}
  </div>
}
