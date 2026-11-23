function Tree({ x = 0, y = 0, scale = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path d="M-2 0V-20H3V0" fill="#927b60" />
      <path d="M-18-16 0-52 18-16Z" fill="#759c82" />
      <path d="M0-52 18-16H0Z" fill="#557d68" />
      <path d="M-14-30 0-57 14-30Z" fill="#96b49b" />
    </g>
  );
}
function House({ cafe = false }) {
  return (
    <>
      <path d="M-26-10V-41L4-24V7Z" fill={cafe ? "#f4e7cf" : "#f6eadb"} />
      <path d="M4 7V-24L29-39V-8Z" fill={cafe ? "#d4c6a9" : "#ddcbbb"} />
      <path d="M-31-41-8-65 8-43 4-22Z" fill={cafe ? "#a4b497" : "#d48c73"} />
      <path
        d="M-8-65 19-50 34-37 8-22 8-43Z"
        fill={cafe ? "#7f9476" : "#b86d59"}
      />
      <path d="M-14-4V-27L-3-21V2Z" fill="#8caaa5" />
      <path d="M13-15V-27L22-32V-20Z" fill="#a2bec0" />
      <path d="M-23-31-18-28V-20L-23-23Z" fill="#b3c9c6" />
      {cafe && (
        <>
          <path d="M-28-32 4-14 9-24-23-42Z" fill="#e4b16f" />
          <path
            d="M-22-38-26-31M-11-32-15-25M0-26-4-19"
            stroke="#fff4df"
            strokeWidth="5"
          />
          <path d="M14-38 24-44V-36L14-30Z" fill="#fbf5e8" />
        </>
      )}
    </>
  );
}
export function PieceShape({ type }) {
  return (
    <g strokeLinejoin="round" strokeLinecap="round">
      <ellipse cx="2" cy="3" rx="34" ry="14" fill="#314e3d" opacity=".09" />
      {(type === "house" || type === "cafe") && (
        <House cafe={type === "cafe"} />
      )}
      {type === "mountain" && (
        <>
          <path d="M-39-4-5-69 30-3-3 14Z" fill="#91aca0" />
          <path d="M-5-69 30-3-3 14Z" fill="#6f9182" />
          <path d="M-18-44-5-69 8-45-3-49-9-41Z" fill="#fffdf7" />
          <path d="M8 2 25-34 44 3 26 13Z" fill="#a7bdb1" />
          <path d="M25-34 44 3 26 13Z" fill="#86a394" />
          <Tree x={-28} y={4} scale={0.43} />
        </>
      )}
      {type === "forest" && (
        <>
          <Tree x={-19} y={-7} scale={0.75} />
          <Tree x={17} y={-5} scale={0.9} />
          <Tree x={-3} y={10} />
          <path d="M16 10 28 4 35 8 23 15Z" fill="#d8cba8" />
        </>
      )}
      {type === "lake" && (
        <>
          <path d="M-41-8Q-18-30 6-19T41-1Q34 17 8 15T-41-8Z" fill="#bdd7d9" />
          <path d="M-33-7Q-14-22 8-14T33-1Q22 10 4 10T-33-7Z" fill="#8bb9c5" />
          <path
            d="m-20-6 12 4m12-7 14 4M-3 3 9 7"
            stroke="#e5f3ee"
            strokeWidth="2"
          />
          <path d="m22-18 12 6-5 4-13-6Z" fill="#caba94" />
          <Tree x={-25} y={-12} scale={0.5} />
        </>
      )}
      {type === "camp" && (
        <>
          <path d="M-31 0-7-43 25-5-1 12Z" fill="#e1bb78" />
          <path d="M-7-43 38-15 25-5Z" fill="#b89059" />
          <path d="M-23 0-7-32 7 7-1 12Z" fill="#647b70" />
          <path d="M-7-32-1 12 7 7Z" fill="#40594e" />
          <Tree x={27} y={-15} scale={0.7} />
          <path d="m18 9 8-4m-9 0 9 5" stroke="#91745c" strokeWidth="3" />
          <path d="M21 6Q15 0 22-8 22-3 26-3 30 4 24 7Z" fill="#dc9467" />
        </>
      )}
      {type === "tower" && (
        <>
          <path d="M-19 2 0-80 6-80 25 1 3 13Z" fill="#b8c9ce" />
          <path d="M3-80 6-80 25 1 3 13Z" fill="#7e9eac" />
          <path d="M-18-20 3-31 21-21 3-9Z" fill="#e6e9e3" />
          <path d="M-18-20V-29L3-40 21-30V-21L3-11Z" fill="#8eaeb6" />
          <path d="M-18-29 3-40 21-30 3-18Z" fill="#d6dfdd" />
          <path d="M3-80V-92" stroke="#7898a5" strokeWidth="3" />
          <path d="M-8 3 3-27 14 3 3-2Z" fill="#fff" opacity=".8" />
        </>
      )}
      {type === "temple" && (
        <>
          <path d="M-27-5V-31L2-15V11Z" fill="#eddac3" />
          <path d="M2 11V-15L29-31V-5Z" fill="#cfb99f" />
          <path d="M-35-33Q-21-32-9-55L10-40 38-30 3-10Z" fill="#6e8b83" />
          <path d="m-9-55 33 18 5 6-19-9Z" fill="#56746e" />
          <path d="M-17-6V-22L-7-16V0M11 2V-14L21-20V-4" fill="#af7160" />
          <path
            d="m-35-33 38 23 35-20"
            fill="none"
            stroke="#526f68"
            strokeWidth="3"
          />
          <path d="M-28-5 2 13 31-4 36 0 2 20-33 0Z" fill="#d7d5c7" />
        </>
      )}
    </g>
  );
}
export default function PieceArt({ type, className = "" }) {
  return (
    <svg className={className} viewBox="-52 -103 104 128" aria-hidden="true">
      <PieceShape type={type} />
    </svg>
  );
}
