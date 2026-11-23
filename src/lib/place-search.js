import {
  nearestLandCell,
  prefectureAt,
  projectLocation,
} from "./prefectures.js";

// Photon permits reasonable, small-project usage of its demo API. Search only
// on explicit submit; cache repeated queries and never send background lookups.
export const SEARCH_ENDPOINT = "https://photon.komoot.io/api/";
const cache = new Map();
let lastRequest = 0;

export function pieceForPlace(properties) {
  const kind = `${properties.osm_key || ""} ${properties.osm_value || ""}`;
  const name = properties.name || "";
  if (/camp_site|caravan_site/.test(kind) || /キャンプ|野営/.test(name))
    return "camp";
  if (/waterfall/.test(kind) || /滝$/.test(name)) return "waterfall";
  if (/castle/.test(kind) || /城$|城跡/.test(name)) return "castle";
  if (
    /hotel|guest_house|ryokan|motel|hostel/.test(kind) ||
    /ホテル|旅館/.test(name)
  )
    return "hotel";
  if (/bridge/.test(kind) || /大橋$|橋$/.test(name)) return "bridge";
  if (/railway station/.test(kind) || /駅$/.test(name)) return "station";
  if (
    /flowerbed/.test(kind) ||
    /花畑|花園|フラワー|ラベンダー|ひまわり/.test(name)
  )
    return "flowers";
  if (/peak|volcano|mountain/.test(kind) || /(?:山|岳|富士)$/.test(name))
    return "mountain";
  if (
    /water|lake|beach|bay|river|coastline|waterfall/.test(kind) ||
    /湖|海岸|海浜|ビーチ|滝|渓谷/.test(name)
  )
    return "lake";
  if (
    /wood|forest|park|garden|nature_reserve/.test(kind) ||
    /公園|庭園|森林|植物園/.test(name)
  )
    return "forest";
  if (
    /place_of_worship|monastery|shrine|temple/.test(kind) ||
    /神社|神宮|大社|天満宮|寺|お宮/.test(name)
  )
    return "temple";
  if (
    /tower|lighthouse|observation/.test(kind) ||
    /タワー|スカイツリー|展望|灯台/.test(name)
  )
    return "tower";
  if (
    /cafe|restaurant|bar|fast_food|bakery/.test(kind) ||
    /カフェ|珈琲|喫茶|コーヒー/.test(name)
  )
    return "cafe";
  return "house";
}

export function parseCandidates(data) {
  if (!Array.isArray(data?.features))
    throw new Error("検索結果を読み込めませんでした。もう一度お試しください。");
  const seen = new Set();
  return data.features
    .flatMap((feature) => {
      const p = feature.properties;
      const coordinates = feature.geometry?.coordinates;
      if (
        !p ||
        feature.geometry?.type !== "Point" ||
        !Array.isArray(coordinates) ||
        p.countrycode?.toUpperCase() !== "JP" ||
        !p.name ||
        typeof p.name !== "string"
      )
        return [];
      // Don't mistake similarly named bus stops or traffic signals for landmarks.
      if (
        ["highway", "public_transport", "boundary"].includes(p.osm_key) ||
        (p.osm_key === "railway" && p.osm_value !== "station") ||
        ["bicycle_rental", "parking", "parking_entrance"].includes(p.osm_value)
      )
        return [];
      const location = { lon: coordinates[0], lat: coordinates[1] };
      const hint = [p.state, p.city]
        .filter((value) => typeof value === "string")
        .join(" ");
      const prefecture = prefectureAt(location, hint);
      if (
        !prefecture ||
        !["N", "W", "R"].includes(p.osm_type) ||
        !Number.isSafeInteger(p.osm_id)
      )
        return [];
      const id = `${p.osm_type}${p.osm_id}`;
      if (seen.has(id)) return [];
      seen.add(id);
      return [
        {
          id,
          title: p.name.slice(0, 60),
          address: [
            ...new Set(
              [prefecture.name, p.city, p.district, p.street].filter(
                (part) => typeof part === "string" && part,
              ),
            ),
          ]
            .join(" ")
            .slice(0, 200),
          prefecture: prefecture.id,
          piece: pieceForPlace(p),
          location: {
            ...location,
            sourceId: id,
            prefectureName: prefecture.name,
          },
        },
      ];
    })
    .slice(0, 8);
}

export function placementForCandidate(candidate, places) {
  const prefecture = prefectureAt(
    candidate.location,
    candidate.location.prefectureName,
  );
  if (!prefecture)
    throw new Error(
      "この場所は現在の日本地図にありません。県を選んで手動で置いてください。",
    );
  const occupied = new Set(
    places
      .filter((p) => p.prefecture === prefecture.id && p.grid === "geo")
      .map((p) => `${p.x},${p.y}`),
  );
  const cell = nearestLandCell(
    prefecture,
    projectLocation(candidate.location),
    occupied,
  );
  if (!cell)
    throw new Error("この県はいっぱいです。ほかの思い出を移動してください。");
  return { ...cell, location: candidate.location };
}

export async function searchPlaces(
  query,
  { signal, fetcher = fetch, now = Date.now } = {},
) {
  const key = query.trim().normalize("NFKC");
  if (key.length < 2)
    throw new Error("場所の名前を2文字以上で入力してください。");
  if (cache.has(key)) return cache.get(key);
  if (now() - lastRequest < 1500)
    throw new Error("少し待ってから、もう一度検索してください。");
  lastRequest = now();
  const params = new URLSearchParams({
    q: key,
    bbox: "122,20,154,46",
    limit: "12",
  });
  let data;
  try {
    const response = await fetcher(`${SEARCH_ENDPOINT}?${params}`, {
      signal,
      credentials: "omit",
      referrerPolicy: "origin",
    });
    if (!response.ok) throw new Error("Search service unavailable");
    data = await response.json();
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new Error(
      "いまは場所を検索できません。通信を確認して、もう一度お試しください。県を選んで手動でも置けます。",
    );
  }
  const candidates = parseCandidates(data);
  if (cache.size >= 40) cache.delete(cache.keys().next().value);
  cache.set(key, candidates);
  return candidates;
}
