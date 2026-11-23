import { useState } from "react";
import { Minus, Plus, Scan } from "lucide-react";
import { PieceShape } from "./PieceArt.jsx";
import { SIZE, cellKey, pieceFor } from "./lib/diorama.js";
const point = (x, y) => [500 + (x - y) * 43, 108 + (x + y) * 22];
const cells = Array.from({ length: SIZE * SIZE }, (_, i) => ({
  x: i % SIZE,
  y: Math.floor(i / SIZE),
})).sort((a, b) => a.x + a.y - b.x - b.y || a.x - b.x);
export default function DioramaMap({ places, tool, moving, onCell, disabled }) {
  const [hover, setHover] = useState(null);
  const [cursor, setCursor] = useState({ x: 4, y: 4 });
  const [keyboard, setKeyboard] = useState(false);
  const [zoom, setZoom] = useState(1);
  const occupied = new Map(places.map((entry) => [cellKey(entry), entry]));
  const active = keyboard ? cursor : hover;
  const ghost = moving?.piece || tool;
  function keyDown(event) {
    const delta = {
      ArrowRight: [1, 0],
      ArrowLeft: [-1, 0],
      ArrowDown: [0, 1],
      ArrowUp: [0, -1],
    }[event.key];
    if (delta) {
      event.preventDefault();
      setKeyboard(true);
      setCursor((c) => ({
        x: Math.max(0, Math.min(SIZE - 1, c.x + delta[0])),
        y: Math.max(0, Math.min(SIZE - 1, c.y + delta[1])),
      }));
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (!disabled) onCell(cursor);
    }
  }
  return (
    <div className="map-stage">
      <div className="map-coordinate">
        <span className="status-dot" /> MY LITTLE WORLD <span>10 × 10</span>
      </div>
      <div className="map-scroll">
        <svg
          className="diorama"
          viewBox="0 0 1000 650"
          style={{ width: `${zoom * 100}%` }}
          role="group"
          aria-label="自分の箱庭。矢印キーでマスを選び、Enterで配置または思い出を開きます"
          tabIndex="0"
          onKeyDown={keyDown}
          onBlur={() => setKeyboard(false)}
          onPointerLeave={() => setHover(null)}
        >
          <defs>
            <filter
              id="island-shadow"
              x="-20%"
              y="-40%"
              width="140%"
              height="200%"
            >
              <feGaussianBlur stdDeviation="17" />
            </filter>
          </defs>
          <path
            d="M500 112 937 332 500 563 63 332Z"
            fill="#b7b8a6"
            opacity=".12"
            filter="url(#island-shadow)"
          />
          <path
            d="M70 306 500 526 930 306V320L500 540 70 320Z"
            fill="#e2e7dc"
          />
          <path d="M500 526 930 306V320L500 540Z" fill="#d3dfd4" />
          {cells.map((cell) => {
            const [px, py] = point(cell.x, cell.y);
            const selected = active?.x === cell.x && active?.y === cell.y;
            const entry = occupied.get(cellKey(cell));
            return (
              <polygon
                key={cellKey(cell)}
                data-cell={`${cell.x}-${cell.y}`}
                points={`${px},${py - 22} ${px + 43},${py} ${px},${py + 22} ${px - 43},${py}`}
                className={`map-cell ${selected ? "active" : ""} ${entry ? "filled" : ""}`}
                onPointerEnter={() => {
                  setKeyboard(false);
                  setHover(cell);
                }}
                onClick={() => !disabled && onCell(cell)}
              >
                <title>
                  {cell.x + 1}列 {cell.y + 1}行
                  {entry ? `：${entry.title}` : "：空いているマス"}
                </title>
              </polygon>
            );
          })}
          {cells.map((cell) => {
            const entry = occupied.get(cellKey(cell));
            const isGhost =
              !entry && ghost && active?.x === cell.x && active?.y === cell.y;
            if (!entry && !isGhost) return null;
            const [px, py] = point(cell.x, cell.y);
            return (
              <g
                key={cellKey(cell)}
                transform={`translate(${px} ${py}) scale(.86)`}
                className={`map-piece ${isGhost ? "ghost" : ""} ${moving?.id === entry?.id ? "moving" : ""}`}
                onPointerEnter={() => {
                  setKeyboard(false);
                  setHover(cell);
                }}
                onClick={() => !disabled && onCell(cell)}
                role={entry ? "button" : undefined}
                aria-label={
                  entry
                    ? `${entry.title}、${pieceFor(entry.piece).name}`
                    : undefined
                }
              >
                {entry && (
                  <title>
                    {entry.title} · {entry.date}
                  </title>
                )}
                <PieceShape type={entry?.piece || ghost} />
              </g>
            );
          })}
          <g className="compass" transform="translate(875 537)">
            <path d="m0-20 7 19-7-4-7 4Z" fill="#81978a" />
            <path d="m0 18 7-19-7 4-7-4Z" fill="#d5ddd4" />
            <text x="0" y="-29" textAnchor="middle">
              N
            </text>
          </g>
        </svg>
      </div>
      <div className="map-bottom">
        <span>きみの旅が、この世界のつづき。</span>
        <div className="zoom-controls">
          <button
            aria-label="縮小"
            disabled={zoom <= 1}
            onClick={() => setZoom((z) => Math.max(1, z - 0.25))}
          >
            <Minus size={17} />
          </button>
          <button aria-label="全体を表示" onClick={() => setZoom(1)}>
            <Scan size={17} />
          </button>
          <button
            aria-label="拡大"
            disabled={zoom >= 2}
            onClick={() => setZoom((z) => Math.min(2, z + 0.25))}
          >
            <Plus size={17} />
          </button>
        </div>
      </div>
    </div>
  );
}
