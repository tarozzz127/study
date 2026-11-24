import test from "node:test";
import assert from "node:assert/strict";
import { bindPinch } from "./pinch.js";

const touch = (identifier, x, y = 0) => ({
  identifier,
  clientX: x,
  clientY: y,
});
function surface(overrides = {}) {
  const element = new EventTarget();
  const changes = [],
    pans = [],
    endings = [];
  let clock = 1000;
  const options = {
    value: 1,
    min: 0.25,
    max: 3,
    onChange: (value, frame) => changes.push({ value, frame }),
    onPan: (delta) => pans.push(delta),
    onEnd: (event) => endings.push(event),
    ...overrides,
  };
  const cleanup = bindPinch(
    element,
    () => options,
    () => clock,
  );
  const send = (type, touches = []) => {
    const event = new Event(type, { cancelable: true });
    Object.defineProperty(event, "touches", { value: touches });
    element.dispatchEvent(event);
    return event;
  };
  return {
    send,
    changes,
    pans,
    endings,
    options,
    cleanup,
    tick: (milliseconds) => {
      clock += milliseconds;
    },
  };
}

test("pinch uses initial span and value, not compounded React updates, and reports midpoint", () => {
  const s = surface({ value: 1.25 });
  assert.equal(
    s.send("touchstart", [touch(1, 20), touch(2, 120)]).defaultPrevented,
    true,
  );
  s.send("touchmove", [touch(1, 0, 10), touch(2, 200, 10)]);
  assert.equal(s.changes.at(-1).value, 2.5);
  assert.deepEqual(s.changes.at(-1).frame.center, { x: 100, y: 10 });
  s.options.value = 2.5;
  s.send("touchmove", [touch(1, 0), touch(2, 120)]);
  assert.equal(s.changes.at(-1).value, 1.5);
});

test("piece size and map zoom clamp at their own bounds and reverse naturally", () => {
  for (const min of [0.25, 1]) {
    const s = surface({ min });
    s.send("touchstart", [touch(1, 0), touch(2, 100)]);
    for (const [distance, value] of [
      [500, 3],
      [2, min],
      [150, 1.5],
    ]) {
      s.send("touchmove", [touch(1, 0), touch(2, distance)]);
      assert.equal(s.changes.at(-1).value, value);
    }
  }
});

test("one finger pans after a movement threshold; taps and later fresh taps are not swallowed", () => {
  const s = surface();
  assert.equal(
    s.send("touchstart", [touch(1, 100, 100)]).defaultPrevented,
    false,
  );
  s.send("touchmove", [touch(1, 98, 100)]);
  assert.equal(s.pans.length, 0);
  s.send("touchmove", [touch(1, 80, 120)]);
  assert.deepEqual(s.pans, [{ x: 20, y: -20 }]);
  s.send("touchend");
  assert.equal(s.send("click").defaultPrevented, true);
  s.send("touchstart", [touch(2, 50)]);
  s.send("touchend");
  assert.equal(s.send("click").defaultPrevented, false);
});

test("lifting one finger ends pinch without starting a pan or opening a placement", () => {
  const s = surface();
  s.send("touchstart", [touch(1, 0), touch(2, 100)]);
  s.send("touchend", [touch(1, 0)]);
  s.send("touchmove", [touch(1, 80)]);
  assert.equal(s.pans.length, 0);
  assert.equal(s.send("click").defaultPrevented, true);
  s.send("touchend");
  assert.deepEqual(s.endings, [{ cancelled: false }]);
  assert.equal(s.send("click").defaultPrevented, true);
  s.tick(501);
  assert.equal(s.send("click").defaultPrevented, false);
});

test("third finger, changed touch identity, and touchcancel cancel safely and allow a new gesture", () => {
  for (const interrupt of ["third", "identity", "cancel"]) {
    const s = surface();
    s.send("touchstart", [touch(1, 0), touch(2, 100)]);
    if (interrupt === "third")
      s.send("touchstart", [touch(1, 0), touch(2, 100), touch(3, 50)]);
    if (interrupt === "identity")
      s.send("touchmove", [touch(3, 0), touch(4, 200)]);
    if (interrupt === "cancel") s.send("touchcancel");
    assert.deepEqual(s.endings, [{ cancelled: true }]);
    assert.equal(s.changes.length, 0);
    s.send("touchend");
    s.send("touchstart", [touch(5, 0), touch(6, 100)]);
    s.send("touchmove", [touch(5, 0), touch(6, 150)]);
    assert.equal(s.changes.at(-1).value, 1.5);
  }
});

test("disabled, zero-span, and detached surfaces never change a value", () => {
  for (const scenario of ["disabled", "zero", "detach"]) {
    const s = surface({ disabled: scenario === "disabled" });
    if (scenario === "detach") s.cleanup();
    s.send("touchstart", [
      touch(1, 0),
      touch(2, scenario === "zero" ? 0 : 100),
    ]);
    s.send("touchmove", [touch(1, 0), touch(2, 200)]);
    assert.equal(s.changes.length, 0);
  }
});

test("Safari gesture events prevent page magnification only on an enabled surface", () => {
  const s = surface();
  for (const type of ["gesturestart", "gesturechange", "gestureend"])
    assert.equal(s.send(type).defaultPrevented, true);
  s.options.disabled = true;
  assert.equal(s.send("gesturestart").defaultPrevented, false);
});
