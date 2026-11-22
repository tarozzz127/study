import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import { renderToStaticMarkup } from 'react-dom/server'
import { MarkerArt } from './MarkerArt.jsx'

export default function LocationPicker({ lat, lng, type, onChange }) {
  const container = useRef(null)
  const map = useRef(null)
  const marker = useRef(null)
  const change = useRef(onChange)
  const [adjusting, setAdjusting] = useState(false)
  const [tileError, setTileError] = useState(false)
  change.current = onChange

  useEffect(() => {
    const instance = L.map(container.current, {
      zoomControl: false, scrollWheelZoom: false, dragging: false,
      touchZoom: false, doubleClickZoom: false, boxZoom: false,
      keyboard: false, minZoom: 2, maxZoom: 18,
    }).setView([lat, lng], 10)
    map.current = instance
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>',
    }).on('tileerror', () => setTileError(true)).on('tileload', () => setTileError(false)).addTo(instance)
    marker.current = L.marker([lat, lng], { keyboard: false, interactive: false }).addTo(instance)
    const observer = new ResizeObserver(() => instance.invalidateSize())
    observer.observe(container.current)
    return () => { observer.disconnect(); instance.remove(); map.current = null }
  }, [])

  useEffect(() => {
    marker.current.setLatLng([lat, lng]).setIcon(L.divIcon({
      className: 'memory-pin', html: renderToStaticMarkup(<MarkerArt type={type} size={42} />),
      iconSize: [48, 52], iconAnchor: [24, 44],
    }))
  }, [lat, lng, type])

  useEffect(() => {
    const instance = map.current
    const choose = event => change.current({ lat: Math.max(-85, Math.min(85, event.latlng.lat)), lng: event.latlng.wrap().lng })
    for (const handler of ['dragging', 'touchZoom', 'doubleClickZoom', 'keyboard']) {
      instance[handler][adjusting ? 'enable' : 'disable']()
    }
    const zoom = adjusting ? L.control.zoom().addTo(instance) : null
    if (adjusting) instance.on('click', choose)
    return () => { instance.off('click', choose); zoom?.remove() }
  }, [adjusting])

  return <section className="location-picker" aria-label="選んだ場所の確認">
    <div className="location-heading"><strong>選んだ場所</strong><button type="button" onClick={() => setAdjusting(value => !value)}>{adjusting ? 'この場所にする' : '場所を選び直す'}</button></div>
    <div ref={container} className="location-map" aria-label={adjusting ? '地図を動かし、正しい場所をタップしてください' : '選んだ場所の地図'} />
    {tileError && <p role="status">地図を読み込めません。接続を確認してください。</p>}
    {adjusting ? <><p role="status">地図を動かして、正しい場所をタップ。写真やメモはそのまま残ります。</p><button type="button" className="location-center" onClick={() => { const center = map.current.getCenter().wrap(); change.current({ lat: Math.max(-85, Math.min(85, center.lat)), lng: center.lng }) }}>地図の中央を選ぶ</button></> : <p>マークの場所を確認してください。あとからでも選び直せます。</p>}
  </section>
}
