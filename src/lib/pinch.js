export const clampScale = (value, min, max) =>
  Math.min(max, Math.max(min, value));

function frame(touches) {
  const [a, b] = touches;
  return {
    distance: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
    center: { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 },
  };
}

// Bind non-passive native listeners: Safari must not turn this surface's
// two-finger gesture into page zoom. Single-finger taps still create clicks.
export function bindPinch(element, getOptions, now = () => performance.now()) {
  let pinch = null,
    pan = null,
    blocked = false,
    clickUntil = 0;
  const prevent = (event) => {
    if (event.cancelable) event.preventDefault();
  };
  function finish(cancelled) {
    if (pinch) getOptions().onEnd?.({ cancelled });
    pinch = null;
    pan = null;
  }
  function start(event) {
    const options = getOptions();
    if (options.disabled) return;
    if (event.touches.length > 2) {
      prevent(event);
      finish(true);
      blocked = true;
      return;
    }
    if (blocked) {
      prevent(event);
      return;
    }
    if (event.touches.length === 1) {
      clickUntil = 0;
      const touch = event.touches[0];
      pan = {
        startX: touch.clientX,
        startY: touch.clientY,
        x: touch.clientX,
        y: touch.clientY,
        moved: false,
      };
    } else if (event.touches.length === 2) {
      prevent(event);
      blocked = true;
      pan = null;
      const current = frame(event.touches);
      if (current.distance < 1) return;
      pinch = {
        ...current,
        value: options.value,
        ids: [...event.touches].map((touch) => touch.identifier),
      };
      options.onStart?.(current);
    }
  }
  function move(event) {
    const options = getOptions();
    if (options.disabled) {
      finish(true);
      return;
    }
    if (blocked) {
      prevent(event);
      if (!pinch || event.touches.length !== 2) return;
      if (
        ![...event.touches].every((touch) =>
          pinch.ids.includes(touch.identifier),
        )
      ) {
        finish(true);
        return;
      }
      const current = frame(event.touches);
      const next = clampScale(
        (pinch.value * current.distance) / pinch.distance,
        options.min,
        options.max,
      );
      options.onChange(next, current);
    } else if (pan && event.touches.length === 1 && options.onPan) {
      const touch = event.touches[0];
      if (
        !pan.moved &&
        Math.hypot(touch.clientX - pan.startX, touch.clientY - pan.startY) < 5
      )
        return;
      prevent(event);
      pan.moved = true;
      options.onPan({ x: pan.x - touch.clientX, y: pan.y - touch.clientY });
      pan.x = touch.clientX;
      pan.y = touch.clientY;
    }
  }
  function end(event) {
    if (blocked) {
      prevent(event);
      if (pinch && event.touches.length < 2) finish(false);
      if (!event.touches.length) {
        blocked = false;
        clickUntil = now() + 500;
      }
    } else if (!event.touches.length) {
      if (pan?.moved) clickUntil = now() + 500;
      pan = null;
    }
  }
  function cancel() {
    if (pinch || pan || blocked) clickUntil = now() + 500;
    finish(true);
    blocked = false;
  }
  function click(event) {
    if (blocked || now() < clickUntil) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }
  function safariGesture(event) {
    if (!getOptions().disabled) prevent(event);
  }
  const listeners = [
    ["touchstart", start],
    ["touchmove", move],
    ["touchend", end],
    ["touchcancel", cancel],
    ["gesturestart", safariGesture],
    ["gesturechange", safariGesture],
    ["gestureend", safariGesture],
  ];
  for (const [name, handler] of listeners)
    element.addEventListener(name, handler, { passive: false });
  element.addEventListener("click", click, true);
  return () => {
    for (const [name, handler] of listeners)
      element.removeEventListener(name, handler);
    element.removeEventListener("click", click, true);
  };
}
