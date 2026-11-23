import "fake-indexeddb/auto";
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  makeDioramaBackup,
  parseDioramaBackup,
  readPlaces,
  validatePlaces,
  writePlaces,
} from "./diorama.js";
import { getMemories, saveMemory } from "./storage.js";
const place = {
  id: "one",
  piece: "cafe",
  x: 3,
  y: 4,
  title: "京都の喫茶店",
  note: "静かな窓際",
  date: "2026-11-23",
};

test("round-trip a box garden without photos or untrusted fields", () => {
  assert.deepEqual(
    parseDioramaBackup(makeDioramaBackup([{ ...place, unsafe: "<script>" }])),
    [place],
  );
  assert.deepEqual(parseDioramaBackup(makeDioramaBackup([])), []);
});
test("reject malformed, overlapping or out-of-bounds backups before writing", () => {
  for (const patch of [
    { x: 10 },
    { x: -1 },
    { y: 1.5 },
    { piece: "unknown" },
    { title: "  " },
    { note: "x".repeat(501) },
    { date: "2026-02-30" },
    { id: "" },
  ]) {
    assert.throws(() => validatePlaces([{ ...place, ...patch }]));
  }
  assert.throws(() => validatePlaces([place, { ...place, id: "two" }]));
  assert.throws(() => validatePlaces([place, { ...place, x: 1 }]));
  assert.throws(() => parseDioramaBackup("{broken"));
  assert.throws(() =>
    parseDioramaBackup(
      JSON.stringify({ app: "tabi-no-ato", version: 1, memories: [] }),
    ),
  );
});
test("create, edit, move, replace and delete persist without touching the old photo journal", async () => {
  const legacy = {
    id: "legacy",
    title: "前の旅",
    photo: "data:image/jpeg;base64,AA==",
  };
  await saveMemory(legacy);
  assert.deepEqual(await readPlaces(), []);
  await writePlaces([place]);
  assert.deepEqual(await readPlaces(), [place]);
  const moved = { ...place, title: "また行きたい喫茶店", x: 6, y: 1 };
  await writePlaces([moved]);
  assert.deepEqual(await readPlaces(), [moved]);
  await assert.rejects(() =>
    writePlaces([moved, { ...place, id: "two", x: 6, y: 1 }]),
  );
  assert.deepEqual(await readPlaces(), [moved]);
  await writePlaces(parseDioramaBackup(makeDioramaBackup([place])));
  assert.deepEqual(await readPlaces(), [place]);
  await writePlaces([]);
  assert.deepEqual(await readPlaces(), []);
  assert.deepEqual(await getMemories(), [legacy]);
});
