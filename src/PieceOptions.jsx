import { useId } from "react";
import PieceArt, { PieceShape } from "./PieceArt.jsx";
import { looksFor, MIN_PIECE_SIZE, MAX_PIECE_SIZE } from "./lib/diorama.js";

export default function PieceOptions({
  piece,
  value,
  onChange,
  compact = false,
  disabled = false,
}) {
  const id = useId();
  const percent = Math.round((value.size ?? 1) * 100);
  const resize = (next) =>
    onChange({
      ...value,
      size:
        Math.min(MAX_PIECE_SIZE * 100, Math.max(MIN_PIECE_SIZE * 100, next)) /
        100,
    });
  return (
    <section
      className={`piece-options ${compact ? "compact" : ""}`}
      aria-label="見た目とサイズ"
    >
      {!compact && (
        <div className="appearance-preview">
          <svg viewBox="-160 -310 320 384" aria-hidden="true">
            <g transform={`scale(${value.size ?? 1})`}>
              <PieceShape type={piece} variant={value.variant ?? 0} />
            </g>
          </svg>
          <span>
            {looksFor(piece)[value.variant ?? 0]} · {percent}%
          </span>
        </div>
      )}
      <fieldset disabled={disabled}>
        <legend>見た目を選ぶ</legend>
        <div className="look-options">
          {looksFor(piece).map((name, variant) => (
            <button
              type="button"
              key={name}
              className={`look-card ${(value.variant ?? 0) === variant ? "selected" : ""}`}
              aria-pressed={(value.variant ?? 0) === variant}
              onClick={() => onChange({ ...value, variant })}
            >
              <PieceArt type={piece} variant={variant} />
              <span>{name}</span>
            </button>
          ))}
        </div>
      </fieldset>
      {!compact && (
        <div className="size-options">
          <label htmlFor={id}>
            サイズ <output htmlFor={id}>{percent}%</output>
          </label>
          <div className="size-slider-row">
            <button
              type="button"
              aria-label="パーツを小さく"
              disabled={disabled || percent <= MIN_PIECE_SIZE * 100}
              onClick={() => resize(percent - 10)}
            >
              −
            </button>
            <input
              id={id}
              type="range"
              min={MIN_PIECE_SIZE * 100}
              max={MAX_PIECE_SIZE * 100}
              step="1"
              value={percent}
              disabled={disabled}
              onChange={(event) => resize(Number(event.target.value))}
            />
            <button
              type="button"
              aria-label="パーツを大きく"
              disabled={disabled || percent >= MAX_PIECE_SIZE * 100}
              onClick={() => resize(percent + 10)}
            >
              ＋
            </button>
          </div>
          <div className="size-caption">
            <span>小さく 25%</span>
            <button
              type="button"
              disabled={disabled}
              onClick={() => resize(100)}
            >
              100%に戻す
            </button>
            <span>大きく 300%</span>
          </div>
          <p className="muted">
            指でスライダーを動かして調整。保存後も何度でも変えられます。
          </p>
        </div>
      )}
    </section>
  );
}
