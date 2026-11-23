import { useEffect, useRef, useState } from "react";
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  CircleHelp,
  Flag,
  FolderInput,
  Grid2X2,
  Leaf,
  MapPin,
  Move,
  Pencil,
  Settings2,
  Sparkles,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import PieceArt from "./PieceArt.jsx";
import PieceOptions from "./PieceOptions.jsx";
import DioramaMap from "./DioramaMap.jsx";
import PlaceSearch from "./PlaceSearch.jsx";
import { placementForCandidate } from "./lib/place-search.js";
import {
  PIECES,
  looksFor,
  cellKey,
  makeDioramaBackup,
  parseDioramaBackup,
  pieceFor,
  readPlaces,
  today,
  writePlaces,
} from "./lib/diorama.js";
import { getMemories, makeBackup } from "./lib/storage.js";
import { prefectureFor } from "./lib/prefectures.js";

function Modal({ children, title, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal"
      aria-label={title}
      onCancel={(e) => {
        if (e.target === e.currentTarget) {
          e.preventDefault();
          onClose();
        }
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-content">
        <button
          className="icon-button modal-close"
          aria-label="閉じる"
          onClick={onClose}
        >
          <X size={20} />
        </button>
        {children}
      </div>
    </dialog>
  );
}
function EntryForm({ entry, busy, error, onSave, onClose }) {
  const [draft, setDraft] = useState(entry);
  return (
    <Modal
      title={entry.id ? "思い出を編集" : "旅のかけらを置く"}
      onClose={onClose}
    >
      <p className="eyebrow">A PIECE OF YOUR JOURNEY</p>
      <h2>{entry.id ? "思い出を、わたし好みに。" : "どんな場所に行った？"}</h2>
      <p className="muted">
        {prefectureFor(entry.prefecture)?.name || "前の箱庭の思い出"} ·
        その日のことを、小さなかたちに。
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave({ ...draft, title: draft.title.trim() });
        }}
      >
        <label>
          パーツ
          <select
            value={draft.piece}
            onChange={(event) =>
              setDraft({ ...draft, piece: event.target.value, variant: 0 })
            }
          >
            {PIECES.map((piece) => (
              <option key={piece.id} value={piece.id}>
                {piece.name}
              </option>
            ))}
          </select>
        </label>
        <PieceOptions
          piece={draft.piece}
          value={draft}
          onChange={setDraft}
          disabled={busy}
        />
        <label>
          場所の名前 <span className="required">必須</span>
          <input
            required
            maxLength={60}
            placeholder="例：京都の小さな喫茶店"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          />
        </label>
        <label>
          訪れた日
          <input
            type="date"
            required
            value={draft.date}
            onChange={(e) => setDraft({ ...draft, date: e.target.value })}
          />
        </label>
        <label>
          ひとこと <span className="muted">お好みで</span>
          <textarea
            rows="3"
            maxLength={500}
            placeholder="窓際の席から見えた景色が、よかった。"
            value={draft.note}
            onChange={(e) => setDraft({ ...draft, note: e.target.value })}
          />
        </label>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button className="primary full" disabled={busy || !draft.title.trim()}>
          {busy ? "保存中…" : entry.id ? "変更を保存" : "この場所に置く"}
          <Check size={17} />
        </button>
      </form>
    </Modal>
  );
}
function download(text, name) {
  const url = URL.createObjectURL(
    new Blob([text], { type: "application/json" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
export default function App() {
  const [toolLook, setToolLook] = useState({ variant: 0, size: 1 });
  const [prefectureId, setPrefectureId] = useState(null);
  const [focusPlace, setFocusPlace] = useState(null);
  const [places, setPlaces] = useState([]),
    [ready, setReady] = useState(false),
    [fatal, setFatal] = useState(false),
    [busy, setBusy] = useState(false);
  const [tool, setTool] = useState(null),
    [category, setCategory] = useState("all"),
    [panel, setPanel] = useState("build");
  const [dialog, setDialog] = useState(null),
    [selected, setSelected] = useState(null),
    [moving, setMoving] = useState(null);
  const [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [undo, setUndo] = useState(null);
  const [pendingImport, setPendingImport] = useState(null),
    [confirmDelete, setConfirmDelete] = useState(false),
    [legacy, setLegacy] = useState([]);
  const importInput = useRef(null),
    lock = useRef(false);
  useEffect(() => {
    readPlaces()
      .then(setPlaces)
      .catch(() => setFatal(true))
      .finally(() => setReady(true));
    getMemories()
      .then(setLegacy)
      .catch(() => {});
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timeout = setTimeout(() => setNotice(""), 6500);
    return () => clearTimeout(timeout);
  }, [notice]);
  const level = Math.floor(places.length / 5) + 1,
    remaining = 5 - (places.length % 5);
  const natureCount = places.filter(
    (p) => pieceFor(p.piece).category === "nature",
  ).length;
  const visitedCount = new Set(
    places.filter((p) => p.prefecture).map((p) => p.prefecture),
  ).size;
  const unassignedCount = places.filter((p) => !p.prefecture).length;
  function close() {
    if (!lock.current) {
      setDialog(null);
      setSelected(null);
      setError("");
      setPendingImport(null);
      setConfirmDelete(false);
    }
  }
  async function persist(next, message, allowUndo = true) {
    if (lock.current || fatal || !ready) return false;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      await writePlaces(next);
      setUndo(allowUndo ? places : null);
      setPlaces(next);
      setNotice(message);
      return true;
    } catch {
      setError(
        "保存できませんでした。端末の空き容量やブラウザの設定を確認して、もう一度お試しください。",
      );
      return false;
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  function choosePiece(id) {
    setTool(id);
    setToolLook({ variant: 0, size: 1 });
    setMoving(null);
    setError("");
    setPanel("build");
  }
  async function onCell(cell) {
    if (!ready || fatal || busy || dialog) return;
    const entry = places.find((p) => cellKey(p) === cellKey(cell));
    if (moving) {
      if (entry && entry.id !== moving.id) {
        setNotice("そこには思い出があります。県の内側の別の場所を選んでね");
        return;
      }
      if (
        await persist(
          places.map((p) =>
            p.id === moving.id ? { ...p, ...cell, location: undefined } : p,
          ),
          "場所を移しました",
        )
      )
        setMoving(null);
    } else if (entry) {
      setSelected(entry);
      setDialog("detail");
      setConfirmDelete(false);
      setError("");
    } else if (tool) {
      setSelected({
        ...cell,
        piece: tool,
        ...toolLook,
        title: "",
        note: "",
        date: today(),
        id: "",
      });
      setDialog("form");
      setError("");
    } else {
      setNotice("パーツから、置きたい建物や自然を選んでね");
      setPanel("build");
    }
  }
  async function save(entry) {
    const saved = { ...entry, id: entry.id || crypto.randomUUID() };
    if (
      await persist(
        [...places.filter((p) => p.id !== saved.id), saved],
        entry.id
          ? "思い出を更新しました"
          : "旅のかけらが、ひとつ増えました +100 pt",
      )
    ) {
      setDialog(null);
      setSelected(null);
    }
  }
  async function addSearchPlace(candidate) {
    if (lock.current || !ready || fatal || dialog) return false;
    const existing = places.find(
      (place) => place.location?.sourceId === candidate.id,
    );
    if (existing) {
      setTool(null);
      setMoving(null);
      setPrefectureId(existing.prefecture);
      setFocusPlace(existing);
      setSelected(existing);
      setConfirmDelete(false);
      setDialog("detail");
      setNotice("この場所はすでに地図にあります");
      return true;
    }
    try {
      const entry = {
        ...placementForCandidate(candidate, places),
        id: crypto.randomUUID(),
        piece: candidate.piece,
        title: candidate.title,
        note: "",
        date: today(),
      };
      if (
        !(await persist(
          [...places, entry],
          `${entry.title}を地図に置きました。日付やパーツはタップして変更できます`,
        ))
      )
        return false;
      setTool(null);
      setMoving(null);
      setPrefectureId(entry.prefecture);
      setFocusPlace(entry);
      return true;
    } catch (reason) {
      setError(reason.message);
      return false;
    }
  }
  async function loadFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError("");
    try {
      if (file.size > 10000000)
        throw new Error("10MBまでの箱庭バックアップを選んでください。");
      setPendingImport(parseDioramaBackup(await file.text()));
    } catch (e) {
      setError(
        e instanceof SyntaxError
          ? "ファイルを読み込めませんでした。箱庭のJSONファイルを選んでください。"
          : e.message,
      );
    }
  }
  return (
    <div className="app-shell">
      <header className="app-header">
        <a href="./" className="brand" aria-label="たびのあと ホーム">
          <span className="brand-mark">
            <Flag size={23} strokeWidth={1.5} />
          </span>
          <span>
            たびのあと<small>旅からつくる、小さな世界。</small>
          </span>
        </a>
        <div className="header-right">
          <span className="save-state">
            <span className="status-dot" />
            {!ready
              ? "読み込み中"
              : fatal
                ? "保存を使えません"
                : busy
                  ? "保存中…"
                  : "この端末に自動保存"}
          </span>
          <button
            className="icon-button"
            aria-label="使い方"
            onClick={() => {
              setError("");
              setDialog("help");
            }}
          >
            <CircleHelp size={21} />
          </button>
          <button
            className="icon-button"
            aria-label="データとバックアップ"
            onClick={() => {
              setError("");
              setDialog("settings");
            }}
          >
            <Settings2 size={21} />
          </button>
        </div>
      </header>
      <main className="workspace">
        <aside className="sidebar">
          <nav className="mode-tabs" aria-label="表示切り替え">
            <button
              className={panel === "build" ? "selected" : ""}
              onClick={() => setPanel("build")}
            >
              <Grid2X2 size={16} />
              つくる
            </button>
            <button
              className={panel === "journal" ? "selected" : ""}
              onClick={() => setPanel("journal")}
            >
              <BookOpen size={16} />
              旅のきろく<span>{places.length}</span>
            </button>
          </nav>
          {panel === "build" ? (
            <>
              <div className="sidebar-heading">
                <p className="eyebrow">PIECES OF YOUR JOURNEY</p>
                <h2>なにを置こう？</h2>
                <p>行った場所に似たパーツを選ぼう。</p>
              </div>
              <div className="category-tabs" aria-label="パーツの種類">
                {[
                  ["all", "すべて"],
                  ["building", "建物"],
                  ["nature", "自然"],
                ].map(([id, label]) => (
                  <button
                    key={id}
                    className={category === id ? "selected" : ""}
                    onClick={() => setCategory(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="piece-catalog">
                {PIECES.filter(
                  (p) => category === "all" || p.category === category,
                ).map((piece) => (
                  <button
                    key={piece.id}
                    className={`piece-card ${tool === piece.id && !moving ? "selected" : ""}`}
                    aria-pressed={tool === piece.id && !moving}
                    onClick={() => choosePiece(piece.id)}
                    disabled={!ready || fatal}
                  >
                    <PieceArt type={piece.id} />
                    <span>{piece.name}</span>
                    {tool === piece.id && !moving && (
                      <span className="piece-check">
                        <Check size={11} />
                      </span>
                    )}
                  </button>
                ))}
              </div>
              {tool && !moving && (
                <PieceOptions
                  compact
                  piece={tool}
                  value={toolLook}
                  onChange={setToolLook}
                  disabled={!ready || fatal || busy}
                />
              )}
              <div className="catalog-note">
                <Sparkles size={16} />
                <p>
                  全部のパーツが、はじめから使えます。
                  <br />
                  思い出の数だけ、自由につくろう。
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="sidebar-heading">
                <p className="eyebrow">YOUR TRAVEL JOURNAL</p>
                <h2>旅のきろく</h2>
                <p>
                  {places.length
                    ? "小さなかたちに、大切な思い出。"
                    : "はじめの思い出を待っています。"}
                </p>
              </div>
              <div className="journal-list">
                {[...places].reverse().map((entry) => (
                  <button
                    key={entry.id}
                    className="journal-entry"
                    onClick={() => {
                      setSelected(entry);
                      setDialog("detail");
                      setError("");
                      setConfirmDelete(false);
                    }}
                  >
                    <PieceArt type={entry.piece} variant={entry.variant} />
                    <span>
                      <strong>{entry.title}</strong>
                      <small>
                        {prefectureFor(entry.prefecture)?.name ||
                          "県を選んで地図へ"}{" "}
                        · {entry.date.replaceAll("-", ".")}
                      </small>
                    </span>
                    <ChevronRight size={15} />
                  </button>
                ))}
                {!places.length && (
                  <div className="journal-empty">
                    <BookOpen size={30} />
                    <p>
                      旅先のカフェも、近所の公園も。
                      <br />
                      あなたの「行った」を残そう。
                    </p>
                    <button
                      className="text-button"
                      onClick={() => setPanel("build")}
                    >
                      パーツを選ぶ
                      <ArrowRight size={15} />
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
          <div className="sidebar-footer">
            <span className="tiny-diamond" /> NO PHOTO. JUST MEMORIES.
          </div>
        </aside>
        <section className="world-section" aria-label="旅の箱庭">
          <div className="world-heading">
            <div>
              <p className="eyebrow">MY TRAVEL DIORAMA</p>
              <h1>旅を、ひとつずつ。</h1>
              <p>日本のかたちに、あなただけの足あとを。</p>
            </div>
            <div className="level-badge">
              <span>
                <Leaf size={18} />
              </span>
              <div>
                <small>旅するひと</small>
                <strong>LEVEL {level.toString().padStart(2, "0")}</strong>
              </div>
            </div>
          </div>
          <div className="world-card">
            <div className="world-toolbar">
              <div>
                <span className="world-tag">わたしの日本地図</span>
                <span className="world-season">
                  {prefectureFor(prefectureId)?.name ||
                    "47の都道府県を、小さな箱庭に"}
                </span>
              </div>
              <span className="placed-count">
                <MapPin size={14} />
                {visitedCount} / 47 都道府県
              </span>
            </div>
            {fatal && (
              <div className="error storage-error" role="alert">
                保存データを開けませんでした。ブラウザの設定を確認して再読み込みしてください。データは上書きしません。
              </div>
            )}
            <PlaceSearch
              disabled={!ready || fatal || busy || !!dialog}
              onChoose={addSearchPlace}
            />
            <DioramaMap
              key={(prefectureId || "japan") + (focusPlace?.id || "")}
              places={places}
              tool={tool}
              moving={moving}
              onCell={onCell}
              disabled={!ready || fatal || busy}
              prefectureId={prefectureId}
              onPrefecture={(id) => {
                setFocusPlace(null);
                setPrefectureId(id);
              }}
              focusPlace={
                focusPlace?.prefecture === prefectureId ? focusPlace : null
              }
            />
            {unassignedCount > 0 && (
              <div className="unassigned-note">
                前の箱庭の思い出が{unassignedCount}
                件あります。消していません。「旅のきろく」で開いて「移動」すると県に置けます。
                <button onClick={() => setPanel("journal")}>
                  旅のきろくを開く
                </button>
              </div>
            )}
            <div
              className={`placement-guide ${tool || moving ? "is-placing" : ""}`}
              aria-live="polite"
            >
              <span className="guide-number">
                {!prefectureId ? "01" : tool || moving ? "03" : "02"}
              </span>
              <div>
                <strong>
                  {!prefectureId
                    ? "まず、行った都道府県を選ぼう。"
                    : moving
                      ? `「${moving.title}」を、どこに移す？`
                      : tool
                        ? `${pieceFor(tool).name}を、どこに置く？`
                        : "あなたの旅から、世界がはじまる。"}
                </strong>
                <p>
                  {!prefectureId
                    ? "日本地図をタップ、または上の一覧から選んで拡大"
                    : moving
                      ? "県の内側の空いている場所をタップして移動"
                      : tool
                        ? "県の内側をタップ → 場所の名前をつけて完成"
                        : "場所を検索して自動配置。パーツを選んで手動でも置けます"}
                </p>
              </div>
              {tool || moving ? (
                <button
                  className="icon-button"
                  aria-label="配置をやめる"
                  onClick={() => {
                    setTool(null);
                    setMoving(null);
                  }}
                >
                  <X size={18} />
                </button>
              ) : (
                <ArrowLeft size={22} className="guide-arrow" />
              )}
            </div>
          </div>
          <div className="journey-strip">
            <div className="journey-summary">
              <span className="stamp">
                <Flag size={24} strokeWidth={1.3} />
              </span>
              <div>
                <span className="eyebrow">YOUR JOURNEY SO FAR</span>
                <p>
                  <strong>{places.length}</strong> か所の思い出
                  <span className="summary-divider" />
                  建物 {places.length - natureCount} ・ 自然 {natureCount}
                </p>
              </div>
            </div>
            <div className="level-progress">
              <div>
                <span>次のレベルまで、あと {remaining} か所</span>
                <strong>{places.length * 100} pt</strong>
              </div>
              <div className="progress-track">
                <span style={{ width: `${(places.length % 5) * 20}%` }} />
              </div>
            </div>
          </div>
          <footer className="world-footer">
            <span>いつもの道も、遠い街も。ぜんぶ、旅になる。</span>
            <button onClick={() => setDialog("help")}>
              あそびかた
              <ArrowRight size={13} />
            </button>
          </footer>
        </section>
      </main>
      {error && !dialog && (
        <div className="floating-error" role="alert">
          {error}
          <button
            className="icon-button"
            aria-label="エラーを閉じる"
            onClick={() => setError("")}
          >
            <X size={17} />
          </button>
        </div>
      )}
      {notice && (
        <div className="toast" role="status">
          <Check size={17} />
          <span>{notice}</span>
          {undo && (
            <button
              disabled={busy}
              onClick={async () => {
                if (await persist(undo, "ひとつ前に戻しました", false))
                  setUndo(null);
              }}
            >
              <Undo2 size={15} />
              戻す
            </button>
          )}
          <button aria-label="通知を閉じる" onClick={() => setNotice("")}>
            <X size={15} />
          </button>
        </div>
      )}
      {dialog === "form" && (
        <EntryForm
          key={selected.id || "new"}
          entry={selected}
          busy={busy}
          error={error}
          onSave={save}
          onClose={close}
        />
      )}
      {dialog === "detail" && selected && (
        <Modal title={selected.title} onClose={close}>
          <div className="detail-hero">
            <PieceArt type={selected.piece} variant={selected.variant} />
            <span>{pieceFor(selected.piece).name}</span>
          </div>
          <p className="eyebrow">A LITTLE MEMORY</p>
          <h2 className="place-title">{selected.title}</h2>
          <p className="detail-date">
            <MapPin size={14} />
            {prefectureFor(selected.prefecture)?.name ||
              "県はまだ未設定"} · {selected.date.replaceAll("-", ".")}
          </p>
          <p className="muted">
            {looksFor(selected.piece)[selected.variant ?? 0]} · サイズ{" "}
            {Math.round((selected.size ?? 1) * 100)}%
          </p>
          {selected.location && (
            <p className="muted">
              検索した実際の位置に配置済み ·
              日付や見た目は「編集・サイズ」で変えられます
            </p>
          )}
          <p className="detail-note">
            {selected.note || "言葉にしなくても、ちゃんと残る思い出。"}
          </p>
          <div className="detail-actions">
            <button className="secondary" onClick={() => setDialog("form")}>
              <Pencil size={16} />
              編集・サイズ
            </button>
            <button
              className="secondary"
              onClick={() => {
                setMoving(selected);
                setTool(null);
                setPrefectureId(selected.prefecture || null);
                setPanel("build");
                close();
              }}
            >
              <Move size={16} />
              移動
            </button>
            <button
              className="icon-button danger"
              aria-label="この思い出を削除"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 size={18} />
            </button>
          </div>
          {selected.prefecture && (
            <button
              className="text-button"
              onClick={() => {
                setPrefectureId(selected.prefecture);
                setFocusPlace(selected);
                close();
              }}
            >
              <MapPin size={15} /> この県の地図を見る
            </button>
          )}
          {confirmDelete && (
            <div className="delete-confirm">
              <p>「{selected.title}」を箱庭から取り除きますか？</p>
              <button
                className="danger-button"
                disabled={busy}
                onClick={async () => {
                  if (
                    await persist(
                      places.filter((p) => p.id !== selected.id),
                      "思い出を取り除きました",
                    )
                  )
                    close();
                }}
              >
                取り除く
              </button>
              <button
                className="text-button"
                onClick={() => setConfirmDelete(false)}
              >
                やめる
              </button>
            </div>
          )}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
        </Modal>
      )}
      {dialog === "help" && (
        <Modal title="あそびかた" onClose={close}>
          <div className="help-icon">
            <Flag size={29} />
          </div>
          <p className="eyebrow">WELCOME TO YOUR LITTLE WORLD</p>
          <h2>旅の思い出で、街をつくろう。</h2>
          <p className="muted">
            ここは、日本地図からつくる小さな箱庭。
            <br />
            行った都道府県を、思い出のかたちで育てよう。
          </p>
          <ol className="help-steps">
            <li>
              <span>01</span>
              <div>
                <strong>日本地図で、行った都道府県を選ぶ</strong>
                <p>県をタップすると拡大。一覧からも選べます。</p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <strong>建物や自然を、県のかたちの中に置く</strong>
                <p>パーツを選び、県の内側をタップ。名前と日付をつけよう。</p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <strong>旅をするたび、世界が育つ</strong>
                <p>1か所で100pt。5か所ごとにレベルアップ。</p>
              </div>
            </li>
          </ol>
          <p className="help-footnote">
            場所の名前で検索して候補を選ぶと、その実際の位置にパーツを自動配置します。日付は今日で保存され、「編集・サイズ」で変更できます。検索で選ばれたパーツも変更できます。
          </p>
          <p className="help-footnote">
            パーツは14種類、それぞれ3つの見た目から選べます。「編集・サイズ」で25〜300%の好きな大きさに調整できます。見た目とサイズは移動やバックアップでもそのまま残ります。
          </p>
          <p className="help-footnote">
            置いたパーツをタップすると、編集・移動・削除ができます。「移動」中に県を選び直すと、別の県へ移せます。拡大後は指で地図をスクロールできます。キーボードでは矢印キーとEnterが使えます。
          </p>
          <button className="primary full" onClick={close}>
            さあ、つくろう
            <ArrowRight size={17} />
          </button>
        </Modal>
      )}
      {dialog === "settings" && (
        <Modal title="データとバックアップ" onClose={close}>
          <p className="eyebrow">KEEP YOUR MEMORIES SAFE</p>
          <h2>思い出を、とっておく。</h2>
          <p className="muted">
            箱庭はこの端末・このブラウザに保存されます。
            <br />
            自動同期はありません。ときどきバックアップを。
          </p>
          <div className="settings-actions">
            <button
              className="secondary"
              disabled={!ready || fatal || busy}
              onClick={() => {
                download(
                  makeDioramaBackup(places),
                  `たびのあと-箱庭-${today()}.json`,
                );
                setNotice("バックアップファイルを保存しました");
              }}
            >
              <ArrowDownToLine size={18} />
              <span>
                箱庭をファイルに保存
                <small>今の箱庭をまるごとバックアップ</small>
              </span>
              <ChevronRight size={16} />
            </button>
            <button
              className="secondary"
              disabled={!ready || fatal || busy}
              onClick={() => importInput.current.click()}
            >
              <FolderInput size={18} />
              <span>
                ファイルから読み込む<small>別の端末へのお引っ越しにも</small>
              </span>
              <ChevronRight size={16} />
            </button>
            <input
              className="visually-hidden"
              ref={importInput}
              type="file"
              accept=".json,application/json"
              onChange={loadFile}
              tabIndex="-1"
            />
          </div>
          {pendingImport && (
            <div className="import-confirm">
              <p>
                {pendingImport.length}か所の箱庭に入れ替えます。
                <br />
                今の{places.length}
                か所の箱庭は置き換わります。先にバックアップを保存してください。
              </p>
              <button
                className="primary"
                disabled={busy}
                onClick={async () => {
                  if (await persist(pendingImport, "箱庭を読み込みました"))
                    close();
                }}
              >
                この箱庭に入れ替える
              </button>
              <button
                className="text-button"
                onClick={() => setPendingImport(null)}
              >
                やめる
              </button>
            </div>
          )}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <p className="help-footnote">
            ブラウザのデータ削除や端末の整理で消えることがあります。プライベートブラウズは使わず、保存したファイルも確認してください。アプリの起動にはインターネット接続が必要です。
          </p>
          {legacy.length > 0 && (
            <div className="legacy-note">
              <strong>前の旅ログも残っています（{legacy.length}件）</strong>
              <p>
                写真つきの記録は消していません。箱庭とは別に保管しています。
              </p>
              <button
                className="text-button"
                onClick={() =>
                  download(
                    makeBackup(legacy),
                    `たびのあと-前の旅ログ-${today()}.json`,
                  )
                }
              >
                <ArrowDownToLine size={15} />
                前の旅ログを保存
              </button>
            </div>
          )}
          <p className="map-credit">
            現在の地図:{" "}
            <a
              href="https://www.naturalearthdata.com/"
              target="_blank"
              rel="noreferrer"
            >
              Natural Earth
            </a>
            （Public domain）。検索: Photon / © OpenStreetMap
            contributors。地図は簡略化しているため、小さな島や海岸線は正確に描けない場合があります。以前手動で置いた記録は元の座標を残して表示します。
          </p>
          <p className="map-credit">
            以前の地図データ（互換用）:{" "}
            <a
              href="https://mapsvg.com/maps/japan"
              target="_blank"
              rel="noreferrer"
            >
              MapSVG
            </a>{" "}
            /{" "}
            <a
              href="https://github.com/VictorCazanave/svg-maps/tree/master/packages/japan"
              target="_blank"
              rel="noreferrer"
            >
              svg-maps
            </a>
            （
            <a
              href="https://creativecommons.org/licenses/by/4.0/"
              target="_blank"
              rel="noreferrer"
            >
              CC BY 4.0
            </a>
            ・座標形式と表示を変更）。一部の小さな島を省略したイラスト地図です。
          </p>
        </Modal>
      )}
    </div>
  );
}
