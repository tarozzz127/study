import { useEffect, useRef, useState } from 'react'
import { MarkerArt } from './MarkerArt.jsx'

export default function MemoryThumbnail({ photo, type }) {
  const container = useRef(null)
  const [nearby, setNearby] = useState(false)

  useEffect(() => {
    if (!photo) return
    if (!('IntersectionObserver' in window)) {
      setNearby(true)
      return
    }
    // Only attach photo sources near the scrollable list's viewport. Native
    // lazy loading alone can still decode offscreen data-URL images eagerly.
    const observer = new IntersectionObserver(([entry]) => setNearby(entry.isIntersecting), {
      root: container.current.closest('.memory-list'),
      rootMargin: '150px 0px',
    })
    observer.observe(container.current)
    return () => observer.disconnect()
  }, [photo])

  return <div ref={container} className="entry-thumb">
    {photo ? nearby && <img src={photo} alt="" width={61} height={67} decoding="async" /> : <MarkerArt type={type} size={46} />}
  </div>
}
