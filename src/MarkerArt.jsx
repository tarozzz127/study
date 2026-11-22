export function MarkerArt({ type = 'building', size = 52 }) {
  return <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true" className={`marker-art ${type}`}>
    <ellipse className="marker-shadow" cx="32" cy="54" rx="24" ry="6" />
    {type === 'mountain' ? <>
      <path className="mountain-back" d="m30 48 15-27 16 27z" />
      <path className="mountain-main" d="M3 50 27 11l26 39z" />
      <path className="mountain-side" d="M27 11v39h26z" />
      <path className="snow" d="m27 11-9 15 7-3 5 6 5-6z" />
      <path className="tree" d="m47 48 5-10 5 10h-4v5h-2v-5zM8 48l4-8 4 8h-3v5h-2v-5z" />
    </> : <>
      <path className="building-side" d="m35 13 17 9v29l-17 5z" />
      <path className="building-front" d="m12 22 23-9v43l-23-7z" />
      <path className="roof" d="m9 22 26-12 20 11-23 9z" />
      <path className="roof-edge" d="m9 22 23 8 23-9v4l-23 9-23-8z" />
      <path className="window" d="m17 32 6 2v7l-6-2zm10 3 5 2v7l-5-2zm13-4 6-2v7l-6 2zm0 11 6-2v7l-6 2z" />
      <path className="door" d="m24 45 7 2v8l-7-2z" />
    </>}
  </svg>
}
