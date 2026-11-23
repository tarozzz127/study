import { JAPAN_MAP } from "./japan-map.js";

export const PREFECTURE_SIZE = 24;
export const PREFECTURES = JAPAN_MAP.map((prefecture) => {
  const points = prefecture.rings.flat();
  const xs = points.map(([x]) => x), ys = points.map(([, y]) => y);
  const minX = Math.min(...xs), minY = Math.min(...ys);
  const width = Math.max(...xs) - minX, height = Math.max(...ys) - minY;
  return {
    ...prefecture, minX, minY, width, height,
    path: prefecture.rings.map(ring => `M${ring.map(point => point.join(",")).join("L")}Z`).join(""),
  };
});
export const prefectureFor = id => PREFECTURES.find(prefecture => prefecture.id === id);
export function pointInPrefecture(prefecture, x, y) {
  // Even-odd winding also excludes holes (for example lakes).
  let inside = false;
  for (const ring of prefecture.rings) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i], [xj, yj] = ring[j];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
    }
  }
  return inside;
}
export function cellPoint(prefecture, cell) {
  return [prefecture.minX + (cell.x + 0.5) * prefecture.width / PREFECTURE_SIZE,
    prefecture.minY + (cell.y + 0.5) * prefecture.height / PREFECTURE_SIZE];
}
export function validCell(cell) {
  const prefecture = prefectureFor(cell.prefecture);
  return !!prefecture && Number.isInteger(cell.x) && Number.isInteger(cell.y) &&
    cell.x >= 0 && cell.x < PREFECTURE_SIZE && cell.y >= 0 && cell.y < PREFECTURE_SIZE &&
    pointInPrefecture(prefecture, ...cellPoint(prefecture, cell));
}
export const cellsFor = prefecture => Array.from({length: PREFECTURE_SIZE ** 2}, (_, i) => ({
  prefecture: prefecture.id, x: i % PREFECTURE_SIZE, y: Math.floor(i / PREFECTURE_SIZE),
})).filter(validCell);
