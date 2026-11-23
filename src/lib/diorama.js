import { validCell, prefectureAt } from "./prefectures.js";
export const SIZE = 10; // Original square-garden coordinates remain readable.
export const PIECES = [
  {
    id: "house",
    name: "小さな家",
    category: "building",
    color: "#d5886f",
    hint: "旅先の街並みや、泊まった宿に",
  },
  {
    id: "cafe",
    name: "カフェ",
    category: "building",
    color: "#d9ab65",
    hint: "また行きたい、お気に入りの一軒",
  },
  {
    id: "temple",
    name: "神社・お寺",
    category: "building",
    color: "#ba715e",
    hint: "心に残った、静かな寄り道",
  },
  {
    id: "tower",
    name: "タワー",
    category: "building",
    color: "#7b9baf",
    hint: "見上げた景色を、小さな目印に",
  },
  {
    id: "mountain",
    name: "山",
    category: "nature",
    color: "#89a99a",
    hint: "登った山も、遠くに見えた山も",
  },
  {
    id: "forest",
    name: "森・公園",
    category: "nature",
    color: "#709b81",
    hint: "緑のなかで、ひと息ついた場所",
  },
  {
    id: "lake",
    name: "海・湖",
    category: "nature",
    color: "#8bbcc6",
    hint: "忘れられない、水辺の風景",
  },
  {
    id: "camp",
    name: "キャンプ",
    category: "nature",
    color: "#cfad70",
    hint: "外で過ごした、とっておきの一日",
  },
  {
    id: "castle",
    name: "お城",
    category: "building",
    color: "#7d8c9c",
    hint: "歴史を感じる、お城や城跡に",
  },
  {
    id: "hotel",
    name: "宿・ホテル",
    category: "building",
    color: "#b48d71",
    hint: "泊まったホテルや温泉旅館に",
  },
  {
    id: "bridge",
    name: "橋",
    category: "building",
    color: "#b16e5d",
    hint: "川や海を渡った思い出に",
  },
  {
    id: "station",
    name: "駅",
    category: "building",
    color: "#658c98",
    hint: "旅のはじまりや、途中下車に",
  },
  {
    id: "waterfall",
    name: "滝",
    category: "nature",
    color: "#69a9b6",
    hint: "水音が心に残る場所に",
  },
  {
    id: "flowers",
    name: "花畑",
    category: "nature",
    color: "#bb7c9b",
    hint: "季節の花に出会った場所に",
  },
];
export const MIN_PIECE_SIZE = 0.25;
export const MAX_PIECE_SIZE = 3;
const LOOKS = {
  house: ["赤い屋根", "街の家", "ログハウス"],
  cafe: ["街角カフェ", "ガラスのカフェ", "テラス席"],
  temple: ["お寺", "赤い鳥居", "五重塔"],
  tower: ["展望タワー", "赤い鉄塔", "灯台"],
  mountain: ["雪の山", "緑の山", "火山"],
  forest: ["針葉樹の森", "桜の公園", "紅葉の森"],
  lake: ["静かな湖", "青い海", "ボートの湖"],
  camp: ["三角テント", "ドームテント", "キャンピングカー"],
  castle: ["日本のお城", "石造りのお城", "緑の城跡"],
  hotel: ["街のホテル", "温泉旅館", "リゾート"],
  bridge: ["赤い太鼓橋", "つり橋", "石のアーチ橋"],
  station: ["赤い屋根の駅", "街の駅", "木造の小さな駅"],
  waterfall: ["一筋の滝", "幅広の滝", "段々の滝"],
  flowers: ["チューリップ", "ラベンダー", "ひまわり"],
};
export const looksFor = (piece) => LOOKS[piece] || LOOKS.house;
export const pieceFor = (id) =>
  PIECES.find((piece) => piece.id === id) || PIECES[0];
export const today = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};
export const cellKey = (entry) =>
  `${entry.prefecture || "unassigned"}:${entry.grid || "legacy"}:${entry.x},${entry.y}`;

export function validatePlaces(entries) {
  if (!Array.isArray(entries) || entries.length > 4700)
    throw new Error("箱庭のデータを読み込めませんでした。");
  const ids = new Set(),
    cells = new Set();
  return entries.map((entry) => {
    if (
      !entry ||
      typeof entry.id !== "string" ||
      !entry.id ||
      entry.id.length > 100 ||
      ids.has(entry.id) ||
      !PIECES.some((piece) => piece.id === entry.piece) ||
      (entry.variant !== undefined &&
        (!Number.isInteger(entry.variant) ||
          entry.variant < 0 ||
          entry.variant >= looksFor(entry.piece).length)) ||
      (entry.size !== undefined &&
        (!Number.isFinite(entry.size) ||
          entry.size < MIN_PIECE_SIZE ||
          entry.size > MAX_PIECE_SIZE)) ||
      (entry.grid !== undefined &&
        (entry.grid !== "geo" || !entry.prefecture)) ||
      (entry.location !== undefined &&
        (entry.grid !== "geo" ||
          !Number.isFinite(entry.location?.lat) ||
          !Number.isFinite(entry.location?.lon) ||
          typeof entry.location?.sourceId !== "string" ||
          !entry.location.sourceId ||
          entry.location.sourceId.length > 100 ||
          typeof entry.location.prefectureName !== "string" ||
          entry.location.prefectureName.length > 30 ||
          prefectureAt(entry.location, entry.location.prefectureName || "")
            ?.id !== entry.prefecture)) ||
      (entry.prefecture !== undefined
        ? !validCell(entry)
        : !Number.isInteger(entry.x) ||
          entry.x < 0 ||
          entry.x >= SIZE ||
          !Number.isInteger(entry.y) ||
          entry.y < 0 ||
          entry.y >= SIZE) ||
      cells.has(cellKey(entry)) ||
      typeof entry.title !== "string" ||
      !entry.title.trim() ||
      entry.title.length > 60 ||
      typeof entry.note !== "string" ||
      entry.note.length > 500 ||
      typeof entry.date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(entry.date) ||
      !Number.isFinite(Date.parse(entry.date)) ||
      new Date(entry.date).toISOString().slice(0, 10) !== entry.date
    ) {
      throw new Error(
        "箱庭のデータが正しくありません。ファイルを確認してください。",
      );
    }
    ids.add(entry.id);
    cells.add(cellKey(entry));
    const { id, piece, x, y, title, note, date } = entry;
    return {
      id,
      piece,
      x,
      y,
      title: title.trim(),
      note,
      date,
      ...(entry.variant !== undefined ? { variant: entry.variant } : {}),
      ...(entry.size !== undefined ? { size: entry.size } : {}),
      ...(entry.grid ? { grid: entry.grid } : {}),
      ...(entry.location
        ? {
            location: {
              lat: entry.location.lat,
              lon: entry.location.lon,
              sourceId: entry.location.sourceId,
              prefectureName: prefectureAt(
                entry.location,
                entry.location.prefectureName || "",
              ).name,
            },
          }
        : {}),
      ...(entry.prefecture !== undefined
        ? { prefecture: entry.prefecture }
        : {}),
    };
  });
}
export const makeDioramaBackup = (places) =>
  JSON.stringify({ app: "tabi-no-ato-diorama", version: 4, places }, null, 2);
export function parseDioramaBackup(text) {
  const backup = JSON.parse(text);
  if (
    backup?.app !== "tabi-no-ato-diorama" ||
    ![1, 2, 3, 4].includes(backup.version)
  )
    throw new Error(
      "箱庭のバックアップファイルを選んでください。前の旅ログとは形式が異なります。",
    );
  return validatePlaces(backup.places);
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    // A separate database keeps the previous photo journal intact.
    const request = indexedDB.open("tabi-no-ato-diorama", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("world");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () =>
      reject(new Error("ほかのタブを閉じて、もう一度お試しください。"));
  });
}
export async function readPlaces() {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("world", "readonly");
    const request = tx.objectStore("world").get("places");
    tx.oncomplete = () => {
      db.close();
      try {
        resolve(validatePlaces(request.result || []));
      } catch (error) {
        reject(error);
      }
    };
    tx.onerror = tx.onabort = () => {
      db.close();
      reject(tx.error || new Error("読み込めませんでした"));
    };
  });
}
export async function writePlaces(places) {
  const clean = validatePlaces(places);
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("world", "readwrite");
    tx.objectStore("world").put(clean, "places");
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = tx.onabort = () => {
      db.close();
      reject(tx.error || new Error("保存できませんでした"));
    };
  });
}
