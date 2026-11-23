import { test } from "node:test";
import assert from "node:assert/strict";
import {
  PREFECTURES,
  PREFECTURE_SIZE,
  prefectureFor,
  cellsFor,
  validCell,
  pointInPrefecture,
} from "./prefectures.js";

test("all 47 prefectures, including Tokyo and Okinawa, have land available for memories", () => {
  assert.equal(PREFECTURES.length, 47);
  assert.equal(new Set(PREFECTURES.map((p) => p.id)).size, 47);
  assert.equal(prefectureFor("tokyo").name, "東京都");
  assert.equal(prefectureFor("okinawa").name, "沖縄県");
  for (const prefecture of PREFECTURES) {
    assert.ok(cellsFor(prefecture).length > 0, prefecture.name);
    assert.ok(!validCell({ prefecture: prefecture.id, x: -1, y: 0 }));
    assert.ok(
      !validCell({ prefecture: prefecture.id, x: PREFECTURE_SIZE, y: 0 }),
    );
  }
  assert.ok(!validCell({ prefecture: "not-a-prefecture", x: 2, y: 3 }));
});

test("land selection excludes the sea, holes and gaps between islands", () => {
  const shape = {
    rings: [
      [
        [0, 0],
        [10, 0],
        [10, 10],
        [0, 10],
      ],
      [
        [3, 3],
        [7, 3],
        [7, 7],
        [3, 7],
      ],
      [
        [20, 0],
        [25, 0],
        [25, 5],
        [20, 5],
      ],
    ],
  };
  assert.ok(pointInPrefecture(shape, 1, 1));
  assert.ok(pointInPrefecture(shape, 22, 2));
  assert.ok(!pointInPrefecture(shape, 5, 5));
  assert.ok(!pointInPrefecture(shape, 15, 2));
  assert.ok(!pointInPrefecture(shape, -1, 1));
});
