import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Minus, Plus, Scan } from "lucide-react";
import { PieceShape } from "./PieceArt.jsx";
import { pieceFor, MIN_PIECE_SIZE, MAX_PIECE_SIZE } from "./lib/diorama.js";
import usePinch from "./usePinch.js";
import {
  PREFECTURES,
  PREFECTURE_SIZE,
  prefectureFor,
  cellPoint,
  cellsFor,
  validCell,
  projectLocation,
} from "./lib/prefectures.js";

function PrefectureCanvas({
  places,
  tool,
  moving,
  onCell,
  prefecture,
  disabled,
  counts,
  onPrefecture,
  whole,
  resizing,
}) {
  const svg = useRef(null);
  const [unitsPerPixel, setUnitsPerPixel] = useState(1);
  useLayoutEffect(() => {
    const measure = () => {
      const matrix = svg.current?.getScreenCTM();
      if (!matrix) return;
      const scale = Math.hypot(matrix.a, matrix.b);
      if (scale > 0) setUnitsPerPixel(1 / scale);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(svg.current);
    return () => observer.disconnect();
  }, [prefecture, whole]);
  const [cursor, setCursor] = useState(null);
  const cells = useMemo(
    () => (prefecture ? cellsFor(prefecture) : []),
    [prefecture],
  );
  const bounds =
    prefecture && !whole && prefecture.hasDistantIslands
      ? prefecture.main
      : prefecture;
  const span = bounds ? Math.max(bounds.width, bounds.height) : 510;
  // Leave room for the largest (300%) artwork, including towers on the edge.
  const pad = span * 0.34;
  const box = prefecture
    ? [
        bounds.minX - pad,
        bounds.minY - pad,
        bounds.width + pad * 2,
        bounds.height + pad * 2,
      ]
    : [-18, -20, 630, 620];
  const ghost = moving?.piece || tool;
  function activate(event) {
    if (!prefecture || disabled || !svg.current) return;
    const matrix = svg.current.getScreenCTM();
    if (!matrix) return;
    const point = svg.current.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const local = point.matrixTransform(matrix.inverse());
    const cell = {
      grid: "geo",
      prefecture: prefecture.id,
      x: Math.floor(
        ((local.x - prefecture.minX) / prefecture.width) * PREFECTURE_SIZE,
      ),
      y: Math.floor(
        ((local.y - prefecture.minY) / prefecture.height) * PREFECTURE_SIZE,
      ),
    };
    if (validCell(cell)) onCell(cell);
  }
  function keyDown(event) {
    if (!prefecture || disabled) return;
    const delta = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    }[event.key];
    if (delta) {
      event.preventDefault();
      const current =
        cursor ||
        cells.find((cell) => {
          const [x, y] = cellPoint(prefecture, cell);
          return (
            x >= bounds.minX &&
            x <= bounds.minX + bounds.width &&
            y >= bounds.minY &&
            y <= bounds.minY + bounds.height
          );
        });
      if (!current) return;
      const next = cells
        .filter((cell) =>
          delta[0]
            ? (cell.x - current.x) * delta[0] > 0
            : (cell.y - current.y) * delta[1] > 0,
        )
        .sort((a, b) => {
          const distance = (cell) =>
            Math.abs(cell.x - current.x) * (delta[0] ? 1 : 5) +
            Math.abs(cell.y - current.y) * (delta[1] ? 1 : 5);
          return distance(a) - distance(b);
        })[0];
      setCursor(cursor ? next || current : current);
    } else if (
      (event.key === "Enter" || event.key === " ") &&
      event.target === svg.current
    ) {
      event.preventDefault();
      const cell = cursor || cells[Math.floor(cells.length / 2)];
      if (cell) {
        setCursor(cell);
        onCell(cell);
      }
    }
  }
  return (
    <svg
      ref={svg}
      className="diorama japan-diorama"
      viewBox={box.join(" ")}
      width="900"
      height="620"
      tabIndex={prefecture ? 0 : undefined}
      onKeyDown={keyDown}
      aria-label={
        prefecture
          ? prefecture.name + "の箱庭。県の内側をタップして配置"
          : "日本地図。行った都道府県を選んで拡大"
      }
    >
      {(prefecture ? [prefecture] : PREFECTURES).map((pref) => (
        <path
          key={pref.id}
          d={pref.path}
          fillRule="evenodd"
          data-prefecture={pref.id}
          className={[
            "prefecture-shape",
            counts[pref.id] ? "visited" : "",
            prefecture ? "is-detail" : "",
          ].join(" ")}
          role={prefecture ? undefined : "button"}
          tabIndex={prefecture || disabled ? undefined : 0}
          aria-label={
            prefecture
              ? undefined
              : pref.name + "を拡大、" + (counts[pref.id] || 0) + "か所の思い出"
          }
          onClick={(event) => {
            if (!disabled) prefecture ? activate(event) : onPrefecture(pref.id);
          }}
          onKeyDown={(event) => {
            if (
              !prefecture &&
              !disabled &&
              (event.key === "Enter" || event.key === " ")
            ) {
              event.preventDefault();
              onPrefecture(pref.id);
            }
          }}
        >
          <title>
            {pref.name}
            {!prefecture ? " · " + (counts[pref.id] || 0) + "か所" : ""}
          </title>
        </path>
      ))}
      {prefecture && ghost && (
        <>
          <defs>
            <pattern
              id="land-dots"
              width={span / 24}
              height={span / 24}
              patternUnits="userSpaceOnUse"
            >
              <circle
                cx={span / 48}
                cy={span / 48}
                r={span / 400}
                fill="#c9d8bc"
              />
            </pattern>
          </defs>
          <path
            d={prefecture.path}
            fillRule="evenodd"
            fill="url(#land-dots)"
            pointerEvents="none"
          />
        </>
      )}
      {prefecture && cursor && (
        <circle
          cx={cellPoint(prefecture, cursor)[0]}
          cy={cellPoint(prefecture, cursor)[1]}
          r={span / 70}
          className="cursor-dot"
        />
      )}
      {prefecture &&
        places
          .filter((place) => place.prefecture === prefecture.id)
          .sort((a, b) => a.y - b.y || a.x - b.x)
          .map((place) => {
            const [x, y] = cellPoint(prefecture, place);
            const scale = (span / 1000) * (place.size ?? 1);
            // Use a filled rectangle, not a non-scaling stroke: WebKit can
            // leave holes in the stroke's hit area at very small scales.
            const hitWidth = Math.max(104 * scale, 44 * unitsPerPixel);
            const hitHeight = Math.max(128 * scale, 44 * unitsPerPixel);
            return (
              <g
                key={place.id}
                transform={`translate(${x} ${y})`}
                className={
                  "map-piece " +
                  (moving?.id === place.id ? "moving" : "") +
                  (resizing?.id === place.id ? " resizing" : "")
                }
                role="button"
                tabIndex={disabled ? undefined : 0}
                data-place-id={place.id}
                aria-label={place.title + "、" + pieceFor(place.piece).name}
                onClick={() => !disabled && onCell(place)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    event.stopPropagation();
                    if (!disabled) onCell(place);
                  }
                }}
              >
                <title>
                  {place.title} · {place.date}
                </title>
                <rect
                  className="piece-hit-target"
                  x={-hitWidth / 2}
                  y={-39 * scale - hitHeight / 2}
                  width={hitWidth}
                  height={hitHeight}
                  fill="transparent"
                />
                <g transform={`scale(${scale})`}>
                  <PieceShape type={place.piece} variant={place.variant} />
                </g>
              </g>
            );
          })}
    </svg>
  );
}

export default function DioramaMap({
  places,
  tool,
  moving,
  onCell,
  disabled,
  prefectureId,
  onPrefecture,
  focusPlace,
  resizing,
  onResizeChange,
  onResizeCancel,
  onResizeSave,
}) {
  const [zoom, setZoom] = useState(1);
  const [whole, setWhole] = useState(() => {
    const pref = prefectureFor(prefectureId);
    if (!pref?.hasDistantIslands || !focusPlace?.location) return false;
    const [x, y] = projectLocation(focusPlace.location);
    return (
      x < pref.main.minX ||
      x > pref.main.minX + pref.main.width ||
      y < pref.main.minY ||
      y > pref.main.minY + pref.main.height
    );
  });
  const scroll = useRef(null);
  const anchor = useRef(null);
  const pendingScroll = useRef(null);
  usePinch(scroll, {
    value: resizing ? (resizing.size ?? 1) : zoom,
    min: resizing ? MIN_PIECE_SIZE : 1,
    max: resizing ? MAX_PIECE_SIZE : 3,
    disabled,
    onStart: ({ center }) => {
      const element = scroll.current;
      const box = element.getBoundingClientRect();
      anchor.current = {
        zoom,
        x: element.scrollLeft + center.x - box.left,
        y: element.scrollTop + center.y - box.top,
      };
    },
    onChange: (next, { center }) => {
      if (resizing) {
        onResizeChange(Math.round(next * 100) / 100);
        return;
      }
      const box = scroll.current.getBoundingClientRect();
      const ratio = next / anchor.current.zoom;
      pendingScroll.current = {
        x: anchor.current.x * ratio - (center.x - box.left),
        y: anchor.current.y * ratio - (center.y - box.top),
      };
      if (next === zoom) {
        scroll.current.scrollTo(
          pendingScroll.current.x,
          pendingScroll.current.y,
        );
        pendingScroll.current = null;
      } else setZoom(next);
    },
    onPan: ({ x, y }) => scroll.current.scrollBy(x, y),
  });
  useLayoutEffect(() => {
    if (!pendingScroll.current) return;
    const { x, y } = pendingScroll.current;
    scroll.current.scrollTo(x, y);
    pendingScroll.current = null;
  }, [zoom]);
  const displayedPlaces = resizing
    ? places.map((place) =>
        place.id === resizing.id ? { ...place, size: resizing.size } : place,
      )
    : places;
  useEffect(() => {
    if (!focusPlace) return;
    // Search results can be above a tall map, especially on landscape iPad.
    // Reveal the actual new piece after both the map and results list update.
    const frame = requestAnimationFrame(() => {
      const marker = [
        ...(scroll.current?.querySelectorAll("[data-place-id]") || []),
      ].find(
        (element) => element.getAttribute("data-place-id") === focusPlace.id,
      );
      marker?.scrollIntoView({
        block: "center",
        inline: "center",
        behavior: "instant",
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [focusPlace]);
  const prefecture = prefectureFor(prefectureId);
  const counts = useMemo(
    () =>
      places.reduce((all, place) => {
        if (place.prefecture)
          all[place.prefecture] = (all[place.prefecture] || 0) + 1;
        return all;
      }, {}),
    [places],
  );
  function select(id) {
    onPrefecture(id || null);
    setZoom(1);
    if (scroll.current) scroll.current.scrollTo(0, 0);
  }
  return (
    <div className="map-stage japan-stage">
      <div className="map-navigation">
        <button
          className="map-back"
          onClick={() => select(null)}
          disabled={!prefecture || disabled || !!resizing}
        >
          <ArrowLeft size={15} /> 日本全体
        </button>
        <label className="prefecture-picker">
          <span className="visually-hidden">都道府県を選ぶ</span>
          <select
            aria-label="都道府県を選ぶ"
            value={prefectureId || ""}
            disabled={disabled || !!resizing}
            onChange={(event) => select(event.target.value)}
          >
            <option value="">行った都道府県を選ぶ</option>
            {PREFECTURES.map((pref) => (
              <option key={pref.id} value={pref.id}>
                {pref.name}
                {counts[pref.id] ? " · " + counts[pref.id] + "か所" : ""}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="map-caption" aria-live="polite">
        <strong>
          {prefecture
            ? prefecture.name + "の箱庭"
            : "日本のかたちに、旅を残そう。"}
        </strong>
        <span>
          {resizing
            ? "2本指を広げる・つまむと、このパーツだけ拡大・縮小"
            : "地図は2本指で拡大・縮小、1本指で移動できます"}
        </span>
        {prefecture?.hasDistantIslands && (
          <button
            className="islands-toggle"
            disabled={disabled || !!resizing}
            onClick={() => {
              setWhole(!whole);
              setZoom(1);
              scroll.current?.scrollTo(0, 0);
            }}
          >
            {whole ? "本土・本島を拡大" : "離島を含めて県全体を表示"}
          </button>
        )}
      </div>
      {resizing && (
        <div
          className="pinch-resize-bar"
          role="region"
          aria-label="パーツのピンチ調整"
        >
          <div>
            <strong>{resizing.title}</strong>
            <p>
              パーツのサイズ{" "}
              <output>{Math.round((resizing.size ?? 1) * 100)}%</output> ·
              地図の大きさは変わりません
            </p>
          </div>
          <div className="pinch-resize-buttons">
            <button
              className="secondary"
              disabled={disabled}
              onClick={onResizeCancel}
            >
              キャンセル
            </button>
            <button
              className="primary"
              disabled={disabled}
              onClick={onResizeSave}
            >
              サイズを保存
            </button>
          </div>
        </div>
      )}
      <div className="map-scroll japan-scroll pinch-surface" ref={scroll}>
        <div style={{ width: zoom * 100 + "%" }}>
          <PrefectureCanvas
            key={(prefectureId || "japan") + whole}
            {...{
              tool,
              moving,
              onCell,
              prefecture,
              counts,
              whole,
              resizing,
            }}
            places={displayedPlaces}
            disabled={disabled || !!resizing}
            onPrefecture={select}
          />
        </div>
      </div>
      <div className="map-bottom">
        <span>
          {resizing
            ? "選んだパーツをピンチで調整 → サイズを保存"
            : prefecture
              ? (counts[prefecture.id] || 0) + "か所の思い出"
              : "思い出を置いた都道府県 " +
                Object.keys(counts).length +
                " / 47"}
        </span>
        <output className="map-zoom-percent" aria-label="地図の拡大率">
          地図 {Math.round(zoom * 100)}%
        </output>
        <div className="zoom-controls">
          <button
            aria-label="縮小"
            disabled={zoom <= 1}
            onClick={() => setZoom((z) => Math.max(1, z - 0.5))}
          >
            <Minus size={17} />
          </button>
          <button
            aria-label="全体を表示"
            onClick={() => {
              setZoom(1);
              scroll.current?.scrollTo(0, 0);
            }}
          >
            <Scan size={17} />
          </button>
          <button
            aria-label="拡大"
            disabled={zoom >= 3}
            onClick={() => setZoom((z) => Math.min(3, z + 0.5))}
          >
            <Plus size={17} />
          </button>
        </div>
      </div>
    </div>
  );
}
