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
function RoundTree({ x = 0, y = 0, color = "#e8a4bb" }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path
        d="M0 0V-32m0 12-12-10m12 5 12-9"
        fill="none"
        stroke="#8a7054"
        strokeWidth="4"
      />
      <path
        d="M-25-33Q-33-52-15-55Q-9-75 6-60Q26-67 28-46Q36-28 15-27Q0-18-13-29Z"
        fill={color}
      />
      <path
        d="M-18-44Q-23-56-9-53"
        fill="none"
        stroke="#fff"
        strokeWidth="3"
        opacity=".5"
      />
    </g>
  );
}
function AlternateShape({ type, variant: v }) {
  if (type === "house")
    return v === 1 ? (
      <>
        <path d="M-27 0V-66H10L29-53V0L6 13Z" fill="#e9d6bb" />
        <path d="M6 13V-53L29-53V0Z" fill="#c6b89f" />
        <path d="M-31-66 8-77 33-61 5-49Z" fill="#6e8c9a" />
        <path
          d="M-18-53V-38m15-9v13m-15 7v13m15-6v14m19-36v13m0 8v13"
          stroke="#7099a1"
          strokeWidth="7"
        />
        <path d="M-12 6V-9H-2V11" fill="#9a785a" />
      </>
    ) : (
      <>
        <House />
        <path
          d="M-27-13 3 4m-30-26 30 17m-30-26 30 17M7 3 29-10M7-7l22-13M7-17l22-13"
          stroke="#9b6b48"
          strokeWidth="7"
        />
        <path d="M-31-41-8-69 8-43 4-22Z" fill="#728b69" />
        <path d="M-8-69 19-50 34-37 8-22 8-43Z" fill="#4b6e53" />
        <path d="M16-51v-23h8v28" fill="#b18162" />
      </>
    );
  if (type === "cafe")
    return v === 1 ? (
      <>
        <path d="M-33-5V-51L4-34V13Z" fill="#d7e9e3" />
        <path d="M4 13V-34L33-49V-5Z" fill="#92b9bb" />
        <path d="M-36-52 0-71 37-51 4-31Z" fill="#576e64" />
        <path
          d="M-25-43v34m14-27v34M14-31v35m13-42v35"
          stroke="#5e7d75"
          strokeWidth="3"
        />
        <path
          d="M-29 1 5 20 38 1"
          fill="none"
          stroke="#ba9977"
          strokeWidth="5"
        />
      </>
    ) : (
      <>
        <House cafe />
        <path
          d="M-39 11H-14m-12 0v-25m0-12v-8M-42-15q16-29 32 0Z"
          fill="#e4a273"
          stroke="#9b7057"
          strokeWidth="2"
        />
        <path d="M17 16h20m-10 0v-14" stroke="#896f54" strokeWidth="3" />
        <ellipse cx="27" cy="1" rx="13" ry="5" fill="#d1b088" />
      </>
    );
  if (type === "temple")
    return v === 1 ? (
      <>
        <path d="M-25 9V-61h8V9m34 0v-70h8V9" fill="#b65042" />
        <path d="M-36-62Q0-54 36-62v9Q0-47-36-53Z" fill="#644f48" />
        <path d="M-32-43h64v7h-64Z" fill="#cd6e50" />
        <path d="M-2-49v12" stroke="#b65042" strokeWidth="5" />
        <path
          d="M-20 8 0 20 27 7"
          stroke="#c5c7b6"
          strokeWidth="7"
          fill="none"
        />
      </>
    ) : (
      <>
        {[0, 1, 2, 3, 4].map((i) => (
          <g
            key={i}
            transform={`translate(0 ${-i * 17}) scale(${1 - i * 0.12} 1)`}
          >
            <path d="M-17 3v-15h34V3Z" fill="#c48564" />
            <path d="M-28-15Q-8-19 0-29q8 10 28 14L0-6Z" fill="#526f63" />
            <path d="M-3-10V2" stroke="#efe3cb" strokeWidth="5" />
          </g>
        ))}
        <path d="M0-96v-7" stroke="#a28a52" strokeWidth="3" />
      </>
    );
  if (type === "tower")
    return v === 1 ? (
      <>
        <path
          d="M-25 8 0-91 25 8M-19-15h38M-14-39h28M-8-62H8M-19-15 14-39M19-15-14-39M-14-39 8-62M14-39-8-62"
          fill="none"
          stroke="#c95e49"
          strokeWidth="4"
        />
        <path
          d="M-15-43h30v-11h-30Z"
          fill="#ede4cc"
          stroke="#b44b3f"
          strokeWidth="3"
        />
        <path d="M0-91v-10" stroke="#b44b3f" strokeWidth="3" />
      </>
    ) : (
      <>
        <ellipse cy="9" rx="31" ry="10" fill="#b9bba8" />
        <path d="M-18 7-12-67H12L18 7Q0 17-18 7Z" fill="#f3eedb" />
        <path d="M-15-39h30l2 18h-34Z" fill="#be6b59" />
        <path
          d="M-15-68v-16h30v16Z"
          fill="#8db5bd"
          stroke="#526f78"
          strokeWidth="3"
        />
        <path d="M-22-84 0-100 22-84Z" fill="#be6b59" />
        <path d="M-8-6v16H4V-6Z" fill="#637e86" />
      </>
    );
  if (type === "mountain")
    return v === 1 ? (
      <>
        <path d="M-44 4Q-27-60-7-68 10-67 30 3L0 17Z" fill="#80a475" />
        <path d="M-7-68Q12-35 30 3L0 17Z" fill="#547b58" />
        <path d="M8 6Q22-38 32-43L46 5 27 14Z" fill="#99b782" />
        <path
          d="M-24 0Q-5-20-7-49"
          stroke="#dacb9d"
          strokeWidth="3"
          fill="none"
        />
      </>
    ) : (
      <>
        <path d="M-43 5-17-58 9-67 41 4 0 18Z" fill="#9e8e7a" />
        <path d="M9-67 41 4 0 18 3-55Z" fill="#796d62" />
        <ellipse cx="-3" cy="-60" rx="17" ry="7" fill="#604e47" />
        <path
          d="m-14-59 9 13 8-13 7 24 5 8"
          stroke="#db8658"
          strokeWidth="4"
          fill="none"
        />
        <path
          d="M-5-75Q-23-88-6-96Q7-101 15-88"
          stroke="#d7d3c8"
          strokeWidth="8"
          fill="none"
          opacity=".8"
        />
      </>
    );
  if (type === "forest")
    return (
      <>
        <RoundTree x={-17} y={-8} color={v === 1 ? "#e7b0c3" : "#d58c55"} />
        <g transform="scale(.8)">
          <RoundTree x={28} y={7} color={v === 1 ? "#f2c5d2" : "#c16e4e"} />
        </g>
        <path d="m-15 13 22-11 13 6-22 11Z" fill="#d6bc93" />
        <path d="M-10 11v7m25-10v7" stroke="#8c765b" strokeWidth="3" />
      </>
    );
  if (type === "lake")
    return (
      <>
        <path
          d="M-44-4Q-25-31 2-21T44-3Q36 19 2 17T-44-4Z"
          fill={v === 1 ? "#e4cf9b" : "#aacba8"}
        />
        <path d="M-35-5Q-21-25 2-15T38-3Q29 13 2 12T-35-5Z" fill="#6fa9be" />
        <path
          d="M-25-6q10-7 20 0m5 7q10-7 20 0"
          stroke="#e4f2ec"
          strokeWidth="3"
          fill="none"
        />
        {v === 1 ? (
          <>
            <path
              d="M-18-12v-33m-15 8q15-26 30 0Z"
              fill="#df9470"
              stroke="#b1845f"
              strokeWidth="2"
            />
            <path d="m16-10 12 5-8 4-12-5Z" fill="#f2ead4" />
          </>
        ) : (
          <>
            <path d="m-31 5 23-14 5 4-23 14Z" fill="#9b795b" />
            <path d="M8-1 22-8 29-3 18 4Z" fill="#b87556" />
            <path d="m15-10 9 15" stroke="#eddfbc" strokeWidth="2" />
          </>
        )}
      </>
    );
  if (type === "camp")
    return v === 1 ? (
      <>
        <Tree x={26} y={-13} scale={0.65} />
        <path d="M-37 3Q-36-51-4-50 27-47 32 4L-3 17Z" fill="#88aca4" />
        <path d="M-4-50Q12-35 15 10L-3 17-22 10Q-21-29-4-50Z" fill="#c8d5ba" />
        <path d="M-4-35 7 10-15 9Z" fill="#456a62" />
      </>
    ) : (
      <>
        <Tree x={27} y={-12} scale={0.7} />
        <path d="M-38-2v-44h49q8 0 13 12l11 15v17Z" fill="#f0e8d3" />
        <path d="M-38-14h73v12h-73Z" fill="#87aba3" />
        <path
          d="M-29-38h17v16h-17Zm25 0H9v16H-4Zm21 5 9 13H17Z"
          fill="#709ba7"
        />
        <circle cx="-23" cy="0" r="8" fill="#52615c" />
        <circle cx="23" cy="0" r="8" fill="#52615c" />
      </>
    );
  if (type === "castle")
    return v === 0 ? (
      <>
        <path d="M-35 10-26-13H26L35 10 0 24Z" fill="#9a9c8c" />
        {[0, 1, 2].map((i) => (
          <g
            key={i}
            transform={`translate(0 ${-i * 25}) scale(${1 - i * 0.22} 1)`}
          >
            <path d="M-23-8v-24h46v24L0 5Z" fill="#f1ead8" />
            <path d="M-34-34Q-13-33 0-49 13-33 34-34L0-19Z" fill="#55716a" />
            <path d="M-10-21v10M9-21v10" stroke="#6e827a" strokeWidth="5" />
          </g>
        ))}
      </>
    ) : (
      <>
        <path d="M-32 9v-52h64V9Z" fill={v === 1 ? "#c3bda6" : "#a7ae91"} />
        <path
          d={
            v === 1
              ? "M-37-32v-30h10v7h10v-7h10v30m14 0v-30h10v7h10v-7h10v30"
              : "M-37-22v-30h11v10h11v-19h8v39m14 0v-22h10v7h13v-18h7v33"
          }
          fill="#aaa78f"
        />
        <path d="M-9 9V-8a9 9 0 0 1 18 0V9Z" fill="#667164" />
        <path d="M-24-27v10m48-10v10" stroke="#65766a" strokeWidth="5" />
        {v === 2 && (
          <path
            d="M-31-29q15 6 9 25m46-31q-14 12-8 29"
            fill="none"
            stroke="#68885c"
            strokeWidth="7"
          />
        )}
      </>
    );
  if (type === "hotel")
    return v === 1 ? (
      <>
        <House cafe />
        <path
          d="M-22-38 3-24 29-39"
          fill="none"
          stroke="#4a685d"
          strokeWidth="8"
        />
        <ellipse cx="24" cy="9" rx="21" ry="10" fill="#a99b80" />
        <ellipse cx="24" cy="6" rx="16" ry="6" fill="#a2c7ca" />
        <path
          d="M18-3q-6-8 0-14m11 14q-6-8 0-14"
          stroke="#c6d7d3"
          strokeWidth="3"
          fill="none"
        />
      </>
    ) : v === 2 ? (
      <>
        <g transform="translate(-8 0) scale(.8)">
          <House cafe />
        </g>
        <path
          d="M27 9q5-21 0-49m0 0q-15-18-25 1 14-5 25-1m0 0q15-16 24 2-15-5-24-2m0 0q-2-20 11-17"
          stroke="#6a8d62"
          strokeWidth="5"
          fill="none"
        />
        <ellipse cx="1" cy="13" rx="24" ry="7" fill="#83b8c7" />
      </>
    ) : (
      <>
        <path d="M-29 0v-76h38l22 13V0L7 16Z" fill="#e8decc" />
        <path d="M7 16V-63h24V0Z" fill="#b6bba9" />
        <path d="M-33-76 6-88 35-71 7-57Z" fill="#6a8581" />
        {[-61, -42, -23].map((y) => (
          <path
            key={y}
            d={`M-20 ${y}h10m4 0H4m12 9h9`}
            stroke="#719ba5"
            strokeWidth="8"
          />
        ))}
        <path d="M-7 8V-7H4v20" fill="#9a7d62" />
      </>
    );
  if (type === "bridge")
    return (
      <>
        <path d="M-47 9Q-2-9 47 8L7 23Z" fill="#9cc2cb" />
        {v === 0 ? (
          <>
            <path d="M-42 4Q0-40 42 4L37 12Q0-20-37 12Z" fill="#bb6958" />
            <path
              d="M-40-3Q0-47 40-3M-38-2v14m15-26v13M0-24v13m23-3v13m15-3v14"
              fill="none"
              stroke="#955043"
              strokeWidth="3"
            />
          </>
        ) : v === 1 ? (
          <>
            <path
              d="M-44 1h88M-25 10v-67m50 67v-67M-43-9q18 17 18-36Q0 9 25-45q0 53 18 36"
              fill="none"
              stroke="#718e95"
              strokeWidth="4"
            />
            <path
              d="M-14-26V0M0-18V0m14-26V0"
              stroke="#8fa6a8"
              strokeWidth="2"
            />
          </>
        ) : (
          <>
            <path
              d="M-42 11v-30H42v30H30V0a9 9 0 0 0-18 0v11H2V0a9 9 0 0 0-18 0v11h-10V0a7 7 0 0 0-14 0v11Z"
              fill="#aca992"
            />
            <path d="M-43-21h86m-80 8h74" stroke="#7e8b79" strokeWidth="4" />
          </>
        )}
      </>
    );
  if (type === "station")
    return (
      <>
        <path
          d="m-44 13 79-13m-70 22 79-13M-31 11l8 9m7-11 8 9m7-11 8 9m7-11 8 9m7-11 8 9"
          stroke="#9b9c89"
          strokeWidth="3"
        />
        <path d="M-31 0v-36H27V0Z" fill={v === 2 ? "#c1a27a" : "#e9dfc6"} />
        <path
          d={v === 1 ? "M-36-43h68v10h-68Z" : "M-39-36-4-63 36-36Z"}
          fill={v === 0 ? "#ba715c" : "#6a8980"}
        />
        <path d="M-23-27h13v16h-13Zm31 0h13v16H8Z" fill="#85aeb5" />
        <path d="M-4 0v-21H5V0" fill="#6b817b" />
        <circle cx="-3" cy={v === 1 ? -38 : -46} r="6" fill="#f8f2df" />
        <path
          d={v === 1 ? "M-3-42v4h4" : "M-3-50v4h4"}
          stroke="#567368"
          fill="none"
          strokeWidth="1.5"
        />
      </>
    );
  if (type === "waterfall")
    return (
      <>
        <path d="M-36 6-29-60-6-76 27-59 39 7 0 22Z" fill="#8b9b85" />
        <path
          d={
            v === 1
              ? "M-28-54Q0-64 28-51L24 7Q0 19-22 5Z"
              : v === 2
                ? "M-8-68H7v25h10v22H5v30H-9v-39h9v-19H-8Z"
                : "M-11-69H9L13 8Q0 19-13 7Z"
          }
          fill="#99cbd3"
        />
        <path
          d={v === 2 ? "M-2-60v20h9v15H-3V3" : "M-1-57V1m8-42v44"}
          stroke="#e9f5ed"
          strokeWidth="3"
          fill="none"
        />
        <ellipse cy="10" rx="29" ry="9" fill="#8ebdc8" />
        <path
          d="M-16 11q16 6 32-1"
          stroke="#e9f5ed"
          strokeWidth="2"
          fill="none"
        />
        <Tree x={-27} y={-30} scale={0.5} />
      </>
    );
  if (type === "flowers")
    return (
      <>
        <path d="M-44 0 0-25 44 0 0 24Z" fill="#adc190" />
        {[-1, 0, 1].flatMap((row) =>
          [-1, 0, 1].map((col) => (
            <g
              key={`${row},${col}`}
              transform={`translate(${col * 20 + row * 8} ${row * 10})`}
            >
              <path
                d="M0 4v-24m0 13-6-4m6 7 6-4"
                stroke="#658952"
                strokeWidth="2.5"
              />
              {v === 1 ? (
                <path
                  d="M0-11q-10-5-5-11-6-6 0-10 0-8 5-12 5 4 5 12 6 4 0 10 5 6-5 11Z"
                  fill="#9884b3"
                />
              ) : v === 2 ? (
                <>
                  <path
                    d="M0-19m-10 0a10 10 0 1 0 20 0 10 10 0 1 0-20 0"
                    fill="#dfb754"
                  />
                  <circle cy="-19" r="5" fill="#866546" />
                </>
              ) : (
                <path
                  d="M-7-25-3-21 0-27 3-21 7-25v8q-7 10-14 0Z"
                  fill={(row + col) % 2 === 0 ? "#d67b82" : "#e7bc63"}
                />
              )}
            </g>
          )),
        )}
      </>
    );
  return null;
}
export function PieceShape({ type, variant = 0 }) {
  if (
    variant > 0 ||
    ["castle", "hotel", "bridge", "station", "waterfall", "flowers"].includes(
      type,
    )
  )
    return (
      <g strokeLinejoin="round" strokeLinecap="round">
        <ellipse cx="2" cy="3" rx="34" ry="14" fill="#314e3d" opacity=".09" />
        <AlternateShape type={type} variant={variant} />
      </g>
    );
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
export default function PieceArt({ type, variant = 0, className = "" }) {
  return (
    <svg className={className} viewBox="-52 -103 104 128" aria-hidden="true">
      <PieceShape type={type} variant={variant} />
    </svg>
  );
}
