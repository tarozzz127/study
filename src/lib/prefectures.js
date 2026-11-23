import { JAPAN_MAP } from "./japan-map.js";

export const PREFECTURE_SIZE = 1000;
const boundsFor = (points) => {
  const xs = points.map(([x]) => x),
    ys = points.map(([, y]) => y);
  const minX = Math.min(...xs),
    minY = Math.min(...ys);
  return {
    minX,
    minY,
    width: Math.max(...xs) - minX,
    height: Math.max(...ys) - minY,
  };
};
const ringArea = (ring) =>
  Math.abs(
    ring.reduce((sum, [x, y], i) => {
      const [nx, ny] = ring[(i + 1) % ring.length];
      return sum + x * ny - nx * y;
    }, 0),
  );
export const PREFECTURES = JAPAN_MAP.map((prefecture) => {
  const bounds = boundsFor(prefecture.rings.flat());
  const main = boundsFor(
    [...prefecture.rings].sort((a, b) => ringArea(b) - ringArea(a))[0],
  );
  return {
    ...prefecture,
    ...bounds,
    main,
    hasDistantIslands:
      bounds.width > main.width * 1.7 || bounds.height > main.height * 1.7,
    path: prefecture.rings
      .map((ring) => `M${ring.map((point) => point.join(",")).join("L")}Z`)
      .join(""),
  };
});
export const prefectureFor = (id) =>
  PREFECTURES.find((prefecture) => prefecture.id === id);
export function pointInPrefecture(prefecture, x, y) {
  // Even-odd winding also excludes holes (for example lakes).
  let inside = false;
  for (const ring of prefecture.rings) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i],
        [xj, yj] = ring[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
        inside = !inside;
    }
  }
  return inside;
}
export function cellPoint(prefecture, cell) {
  return [
    prefecture.minX + ((cell.x + 0.5) * prefecture.width) / PREFECTURE_SIZE,
    prefecture.minY + ((cell.y + 0.5) * prefecture.height) / PREFECTURE_SIZE,
  ];
}
export function validCell(cell) {
  const prefecture = prefectureFor(cell.prefecture);
  return (
    !!prefecture &&
    Number.isInteger(cell.x) &&
    Number.isInteger(cell.y) &&
    cell.x >= 0 &&
    cell.x < PREFECTURE_SIZE &&
    cell.y >= 0 &&
    cell.y < PREFECTURE_SIZE &&
    pointInPrefecture(prefecture, ...cellPoint(prefecture, cell))
  );
}
// Sparse land anchors for keyboard navigation, including detached islands.
// Pointer placement uses the full 1000 x 1000 coordinate precision instead.
export const cellsFor = (prefecture) => {
  const cells = new Map();
  for (const ring of prefecture.rings) {
    const bounds = boundsFor(ring);
    for (let y = 0; y < 20; y++)
      for (let x = 0; x < 20; x++) {
        const cell = {
          prefecture: prefecture.id,
          x: Math.floor(
            ((bounds.minX + ((x + 0.5) * bounds.width) / 20 - prefecture.minX) /
              prefecture.width) *
              PREFECTURE_SIZE,
          ),
          y: Math.floor(
            ((bounds.minY +
              ((y + 0.5) * bounds.height) / 20 -
              prefecture.minY) /
              prefecture.height) *
              PREFECTURE_SIZE,
          ),
        };
        if (validCell(cell)) cells.set(`${cell.x},${cell.y}`, cell);
      }
  }
  return [...cells.values()];
};
