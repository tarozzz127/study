import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseCandidates,
  pieceForPlace,
  placementForCandidate,
  searchPlaces,
} from "./place-search.js";
import {
  cellPoint,
  prefectureAt,
  prefectureFor,
  projectLocation,
  validCell,
} from "./prefectures.js";
import {
  makeDioramaBackup,
  parseDioramaBackup,
  validatePlaces,
} from "./diorama.js";

const towerFeature = {
  type: "Feature",
  properties: {
    name: "東京タワー",
    osm_type: "R",
    osm_id: 4247312,
    osm_key: "man_made",
    osm_value: "tower",
    city: "東京都",
    countrycode: "JP",
  },
  geometry: { type: "Point", coordinates: [139.745536, 35.6584491] },
};
const response = (features = [towerFeature]) => ({ features });
const tower = () => parseCandidates(response())[0];

test("real coordinates select the right prefecture, including remote islands and lakes", () => {
  for (const [lat, lon, hint, expected] of [
    [35.6584491, 139.745536, "", "tokyo"],
    [34.994856, 135.785046, "京都府", "kyoto"],
    [35.3606, 138.7274, "山梨県", "yamanashi"],
    [26.217, 127.719, "", "okinawa"],
    [24.344, 124.157, "", "okinawa"],
    [27.094, 142.193, "", "tokyo"],
    [35.2, 136.05, "滋賀県", "shiga"],
  ])
    assert.equal(prefectureAt({ lat, lon }, hint)?.id, expected, expected);
  assert.equal(prefectureAt({ lat: 48.85, lon: 2.35 }), null);
  assert.equal(prefectureAt({ lat: 35, lon: 150 }), null);
  assert.equal(prefectureAt({ lat: NaN, lon: 140 }), null);
});

test("landmarks receive appropriate pieces and transport stops are not candidates", () => {
  for (const [osm_key, osm_value, name, expected] of [
    ["natural", "peak", "富士山", "mountain"],
    ["amenity", "place_of_worship", "清水寺", "temple"],
    ["leisure", "park", "代々木公園", "forest"],
    ["natural", "water", "河口湖", "lake"],
    ["tourism", "camp_site", "キャンプ場", "camp"],
    ["amenity", "cafe", "喫茶", "cafe"],
    ["man_made", "tower", "東京タワー", "tower"],
    ["tourism", "hotel", "旅館", "house"],
  ])
    assert.equal(pieceForPlace({ osm_key, osm_value, name }), expected);
  const bus = {
    ...towerFeature,
    properties: {
      ...towerFeature.properties,
      osm_key: "highway",
      osm_value: "bus_stop",
    },
  };
  const abroad = {
    ...towerFeature,
    properties: { ...towerFeature.properties, countrycode: "FR" },
  };
  const malformed = {
    ...towerFeature,
    geometry: { type: "Point", coordinates: ["139", null] },
  };
  assert.deepEqual(
    parseCandidates(
      response([towerFeature, towerFeature, bus, abroad, malformed]),
    ),
    [tower()],
  );
});

test("nearby places retain exact geographic positions without replacing occupied cells", () => {
  const candidate = tower();
  const placed = {
    ...placementForCandidate(candidate, []),
    id: "first",
    title: candidate.title,
    piece: candidate.piece,
    date: "2026-11-23",
    note: "",
  };
  assert.ok(validCell(placed));
  assert.deepEqual(
    cellPoint(prefectureFor("tokyo"), placed),
    projectLocation(candidate.location),
  );
  const next = placementForCandidate(candidate, [placed]);
  assert.notDeepEqual([next.x, next.y], [placed.x, placed.y]);
  assert.deepEqual(next.location, placed.location);
  assert.deepEqual(parseDioramaBackup(makeDioramaBackup([placed])), [placed]);
  for (const location of [
    null,
    { ...placed.location, lat: 49 },
    { ...placed.location, sourceId: 12 },
    { ...placed.location, prefectureName: {} },
  ]) {
    assert.throws(() => validatePlaces([{ ...placed, location }]));
  }
});

test("v2 prefecture coordinates survive import and v3 export unchanged", () => {
  const legacy = {
    id: "old",
    piece: "cafe",
    prefecture: "tokyo",
    x: 750,
    y: 200,
    title: "以前の旅",
    note: "残す",
    date: "2026-11-22",
  };
  // Find a land anchor on the original illustration, independent of the new map.
  let entry;
  for (let y = 10; y < 1000 && !entry; y += 10)
    for (let x = 10; x < 1000; x += 10)
      if (validCell({ ...legacy, x, y })) {
        entry = { ...legacy, x, y };
        break;
      }
  assert.ok(entry);
  const imported = parseDioramaBackup(
    JSON.stringify({ app: "tabi-no-ato-diorama", version: 2, places: [entry] }),
  );
  assert.deepEqual(imported, [entry]);
  cellPoint(prefectureFor("tokyo"), imported[0]);
  assert.deepEqual(parseDioramaBackup(makeDioramaBackup(imported)), [entry]);
});

test("explicit search caches repeats, validates errors and does not save empty offline failures", async () => {
  let calls = 0;
  const fetcher = async (url, options) => {
    calls++;
    assert.equal(new URL(url).searchParams.get("q"), "東京タワー");
    assert.equal(options.credentials, "omit");
    return { ok: true, json: async () => response() };
  };
  assert.deepEqual(
    await searchPlaces("東京タワー", { fetcher, now: () => 10000 }),
    [tower()],
  );
  await searchPlaces("東京タワー", { fetcher, now: () => 10001 });
  assert.equal(calls, 1);
  await assert.rejects(
    searchPlaces("富士山", { fetcher, now: () => 10001 }),
    /少し待って/,
  );
  await assert.rejects(
    searchPlaces("別の場所", {
      fetcher: async () => ({ ok: false }),
      now: () => 13000,
    }),
    /検索できません/,
  );
  await assert.rejects(searchPlaces("あ", { fetcher }), /2文字/);
});
