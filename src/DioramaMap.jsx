import { useMemo, useRef, useState } from "react";
import { ArrowLeft, Minus, Plus, Scan } from "lucide-react";
import { PieceShape } from "./PieceArt.jsx";
import { pieceFor } from "./lib/diorama.js";
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
}) {
  const svg = useRef(null);
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
  const pad = span * 0.18;
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
            return (
              <g
                key={place.id}
                transform={
                  "translate(" + x + " " + y + ") scale(" + span / 1000 + ")"
                }
                className={
                  "map-piece " + (moving?.id === place.id ? "moving" : "")
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
                <circle cy="-22" r="38" fill="transparent" />
                <PieceShape type={place.piece} />
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
          disabled={!prefecture || disabled}
        >
          <ArrowLeft size={15} /> 日本全体
        </button>
        <label className="prefecture-picker">
          <span className="visually-hidden">都道府県を選ぶ</span>
          <select
            aria-label="都道府県を選ぶ"
            value={prefectureId || ""}
            disabled={disabled}
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
          {prefecture
            ? "県の内側に、建物や自然を置いてみよう"
            : "地図の県をタップで拡大。小さな県は上の一覧からも選べます"}
        </span>
        {prefecture?.hasDistantIslands && (
          <button
            className="islands-toggle"
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
      <div className="map-scroll japan-scroll" ref={scroll}>
        <div style={{ width: zoom * 100 + "%" }}>
          <PrefectureCanvas
            key={(prefectureId || "japan") + whole}
            {...{
              places,
              tool,
              moving,
              onCell,
              disabled,
              prefecture,
              counts,
              whole,
            }}
            onPrefecture={select}
          />
        </div>
      </div>
      <div className="map-bottom">
        <span>
          {prefecture
            ? (counts[prefecture.id] || 0) + "か所の思い出"
            : "思い出を置いた都道府県 " + Object.keys(counts).length + " / 47"}
        </span>
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
