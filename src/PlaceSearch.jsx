import { useEffect, useRef, useState } from "react";
import { Search, X, Plus } from "lucide-react";
import PieceArt from "./PieceArt.jsx";
import { pieceFor } from "./lib/diorama.js";
import { searchPlaces } from "./lib/place-search.js";

export default function PlaceSearch({ disabled, onChoose }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const controller = useRef(null);
  const request = useRef(0);
  useEffect(() => () => controller.current?.abort(), []);
  function cancel() {
    request.current++;
    controller.current?.abort();
    setLoading(false);
    setResults(null);
    setError("");
  }
  async function submit(event) {
    event.preventDefault();
    if (disabled || loading) return;
    controller.current?.abort();
    const id = ++request.current;
    const abort = new AbortController();
    controller.current = abort;
    setLoading(true);
    setError("");
    setResults(null);
    const timeout = setTimeout(() => abort.abort(), 12000);
    try {
      const candidates = await searchPlaces(query, { signal: abort.signal });
      if (id === request.current) setResults(candidates);
    } catch (reason) {
      if (id === request.current)
        setError(
          reason.name === "AbortError"
            ? "検索に時間がかかっています。通信を確認して、もう一度お試しください。"
            : reason.message ||
                "通信できませんでした。県を選んで手動でも置けます。",
        );
    } finally {
      clearTimeout(timeout);
      if (id === request.current) setLoading(false);
    }
  }
  return (
    <section className="place-search" aria-label="場所を検索して配置">
      <label htmlFor="place-query">行った場所を、検索して置こう</label>
      <p className="search-hint">
        候補を選ぶだけで、建物や自然を実際の位置に自動配置します
      </p>
      <form onSubmit={submit} role="search">
        <Search size={19} aria-hidden="true" />
        <input
          id="place-query"
          type="search"
          maxLength={100}
          autoComplete="off"
          placeholder="例：東京タワー、富士山、清水寺"
          value={query}
          onChange={(event) => {
            cancel();
            setQuery(event.target.value);
          }}
          disabled={disabled}
        />
        <button
          className="primary"
          disabled={disabled || loading || query.trim().length < 2}
        >
          {loading ? "検索中…" : "検索"}
        </button>
      </form>
      <div aria-live="polite" aria-busy={loading}>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {results && (
          <div className="search-results">
            <div className="search-results-heading">
              <span>
                {results.length
                  ? "この場所に行った？"
                  : "場所が見つかりませんでした"}
              </span>
              <button
                className="icon-button"
                aria-label="検索結果を閉じる"
                onClick={cancel}
              >
                <X size={18} />
              </button>
            </div>
            {!results.length && (
              <p>
                市町村名も付けて検索してみてください。見つからない場所は、県を選んで手動でも置けます。
              </p>
            )}
            <ul>
              {results.map((candidate) => (
                <li key={candidate.id}>
                  <button
                    disabled={disabled}
                    onClick={async () => {
                      if (await onChoose(candidate)) cancel();
                    }}
                  >
                    <PieceArt type={candidate.piece} />
                    <span>
                      <strong>{candidate.title}</strong>
                      <small>{candidate.address}</small>
                      <em>{pieceFor(candidate.piece).name}を置く</em>
                    </span>
                    <Plus size={18} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <p className="search-credit">
        検索には通信が必要です ·{" "}
        <a href="https://photon.komoot.io" target="_blank" rel="noreferrer">
          Photon
        </a>{" "}
        / ©{" "}
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noreferrer"
        >
          OpenStreetMap contributors
        </a>
      </p>
    </section>
  );
}
