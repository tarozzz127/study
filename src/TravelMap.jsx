import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import { renderToStaticMarkup } from 'react-dom/server'
import { LocateFixed, Minus, Plus, RotateCcw } from 'lucide-react'
import { MarkerArt } from './MarkerArt.jsx'

const JAPAN = [36.2, 137.6]
export default function TravelMap({ memories, selected, onSelect, onAdd, onNotice, locating, setLocating }) {
  const container = useRef(null)
  const map = useRef(null)
  const layer = useRef(null)
  const callbacks = useRef({ onAdd, onSelect, onNotice })
  const [tileError, setTileError] = useState(false)
  const tiles = useRef(null)
  callbacks.current = { onAdd, onSelect, onNotice }

  useEffect(() => {
    const instance = L.map(container.current, { zoomControl: false, attributionControl: true, minZoom: 2, maxZoom: 18, worldCopyJump: true }).setView(JAPAN, 5)
    map.current = instance
    tiles.current = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(instance)
    tiles.current.on('tileerror', () => setTileError(true))
    tiles.current.on('tileload', () => setTileError(false))
    layer.current = L.layerGroup().addTo(instance)
    instance.on('click', event => callbacks.current.onAdd({ lat: Math.max(-85, Math.min(85, event.latlng.lat)), lng: event.latlng.wrap().lng }))
    instance.on('locationfound', event => {
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
    if (!map.current) return
    layer.current.clearLayers()
    memories.forEach(entry => {
      const icon = L.divIcon({
        className: `memory-pin ${selected?.id === entry.id ? 'is-selected' : ''}`,
        html: renderToStaticMarkup(<MarkerArt type={entry.type} size={58} />),
        iconSize: [64, 68], iconAnchor: [32, 56],
      })
      const marker = L.marker([entry.lat, entry.lng], { icon, title: entry.title, alt: `${entry.title}の記録`, keyboard: true }).addTo(layer.current)
      marker.on('click', () => callbacks.current.onSelect(entry))
    })
  }, [memories, selected])

  useEffect(() => {
    if (selected && map.current) map.current.flyTo([selected.lat, selected.lng], Math.max(map.current.getZoom(), 10), { duration: 0.6 })
  }, [selected])

  function showAll() {
    if (memories.length) map.current.fitBounds(memories.map(entry => [entry.lat, entry.lng]), { padding: [80, 80], maxZoom: 12 })
    else map.current.setView(JAPAN, 5)
  }

  return <div className="map-shell">
    <div ref={container} className="map-canvas" aria-label="旅の地図。場所をタップすると記録できます。キーボードでは矢印で移動し、中央に記録ボタンを使えます。" />
    <div className="map-tip"><span className="tip-dot" />地図をタップして、思い出を残そう</div>
    {tileError && <div className="tile-error" role="status">地図を読み込めません。接続を確認して <button onClick={() => { setTileError(false); tiles.current.redraw() }}>再読み込み</button></div>}
    <div className="map-tools">
      <div className="zoom-tools"><button aria-label="拡大" onClick={() => map.current.zoomIn()}><Plus size={21} /></button><button aria-label="縮小" onClick={() => map.current.zoomOut()}><Minus size={21} /></button></div>
      <button aria-label="現在地を表示" title="現在地を表示" disabled={locating} onClick={() => { setLocating(true); map.current.locate({ timeout: 10000 }) }}><LocateFixed size={21} /></button>
      <button aria-label="地図全体を表示" title="地図全体を表示" onClick={showAll}><RotateCcw size={19} /></button>
    </div>
    <div className="map-bottom"><span>あなただけの、旅の地図</span><button onClick={() => { const center = map.current.getCenter().wrap(); onAdd({ lat: Math.max(-85, Math.min(85, center.lat)), lng: center.lng }) }}>地図の中央に記録</button></div>
  </div>
}
