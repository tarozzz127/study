import { JAPAN_MAP } from "./japan-map.js";
import { GEOGRAPHIC_MAP } from "./geographic-map.js";

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
const withBounds = (prefecture) => {
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
};
// Keep the old illustration for validating v2 records; never rewrite their coordinates.
const LEGACY_PREFECTURES = JAPAN_MAP.map(withBounds);
export const PREFECTURES = GEOGRAPHIC_MAP.map(withBounds);
export const projectLocation = ({ lon, lat }) => [
  (lon - 122) * 18,
  (46 - lat) * 22,
];
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
function rawCellPoint(prefecture, cell) {
  return [
    prefecture.minX + ((cell.x + 0.5) * prefecture.width) / PREFECTURE_SIZE,
    prefecture.minY + ((cell.y + 0.5) * prefecture.height) / PREFECTURE_SIZE,
  ];
}
export function cellPoint(prefecture, cell) {
  if (cell.location) return projectLocation(cell.location);
  const point = rawCellPoint(prefecture, cell);
  // Old hand-placed memories have no real location. Keep their relative position,
  // nudging only offshore points onto the new outline for display (not in storage).
  if (!cell.grid && !pointInPrefecture(prefecture, ...point)) {
    return rawCellPoint(prefecture, nearestLandCell(prefecture, point));
  }
  return point;
}
export function validCell(cell) {
  const prefecture =
    cell.grid === "geo"
      ? prefectureFor(cell.prefecture)
      : LEGACY_PREFECTURES.find((pref) => pref.id === cell.prefecture);
  return (
    !!prefecture &&
    Number.isInteger(cell.x) &&
    Number.isInteger(cell.y) &&
    cell.x >= 0 &&
    cell.x < PREFECTURE_SIZE &&
    cell.y >= 0 &&
    cell.y < PREFECTURE_SIZE &&
    (cell.grid === undefined || cell.grid === "geo") &&
    pointInPrefecture(prefecture, ...rawCellPoint(prefecture, cell))
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
          grid: "geo",
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

function cellAt(prefecture, [x, y]) {
  return {
    prefecture: prefecture.id,
    grid: "geo",
    x: Math.max(
      0,
      Math.min(
        999,
        Math.floor(
          ((x - prefecture.minX) / prefecture.width) * PREFECTURE_SIZE,
        ),
      ),
    ),
    y: Math.max(
      0,
      Math.min(
        999,
        Math.floor(
          ((y - prefecture.minY) / prefecture.height) * PREFECTURE_SIZE,
        ),
      ),
    ),
  };
}
function nearestBoundary(prefecture, point) {
  let best = { distance: Infinity, point };
  for (const ring of prefecture.rings) {
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i],
        b = ring[(i + 1) % ring.length];
      const dx = b[0] - a[0],
        dy = b[1] - a[1];
      const length = dx * dx + dy * dy;
      const t = length
        ? Math.max(
            0,
            Math.min(
              1,
              ((point[0] - a[0]) * dx + (point[1] - a[1]) * dy) / length,
            ),
          )
        : 0;
      const near = [a[0] + t * dx, a[1] + t * dy];
      const distance = Math.hypot(point[0] - near[0], point[1] - near[1]);
      if (distance < best.distance) best = { distance, point: near };
    }
  }
  return best;
}
export function nearestLandCell(prefecture, point, occupied = new Set()) {
  const start = cellAt(
    prefecture,
    pointInPrefecture(prefecture, ...point)
      ? point
      : nearestBoundary(prefecture, point).point,
  );
  for (let radius = 0; radius <= 25; radius++) {
    for (let y = -radius; y <= radius; y++) {
      for (let x = -radius; x <= radius; x++) {
        if (radius && Math.abs(x) !== radius && Math.abs(y) !== radius)
          continue;
        const cell = { ...start, x: start.x + x, y: start.y + y };
        if (validCell(cell) && !occupied.has(`${cell.x},${cell.y}`))
          return cell;
      }
    }
  }
  return cellsFor(prefecture)
    .filter((cell) => !occupied.has(`${cell.x},${cell.y}`))
    .sort((a, b) => {
      const distance = (cell) => {
        const p = rawCellPoint(prefecture, cell);
        return Math.hypot(p[0] - point[0], p[1] - point[1]);
      };
      return distance(a) - distance(b);
    })[0];
}
export function prefectureAt(location, hint = "") {
  if (typeof hint !== "string") return null;
  if (
    !Number.isFinite(location?.lat) ||
    !Number.isFinite(location?.lon) ||
    location.lat < 20 ||
    location.lat > 46 ||
    location.lon < 122 ||
    location.lon > 154
  )
    return null;
  const point = projectLocation(location);
  const hinted = PREFECTURES.find((pref) => hint.includes(pref.name));
  if (
    hinted &&
    (pointInPrefecture(hinted, ...point) ||
      nearestBoundary(hinted, point).distance < 2)
  )
    return hinted;
  const inside = PREFECTURES.find((pref) => pointInPrefecture(pref, ...point));
  if (inside) return inside;
  const nearest = PREFECTURES.map((pref) => ({
    pref,
    distance: nearestBoundary(pref, point).distance,
  })).sort((a, b) => a.distance - b.distance)[0];
  return nearest.distance < 2 ? nearest.pref : null;
}
