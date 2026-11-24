import { useEffect, useRef } from "react";
import { bindPinch } from "./lib/pinch.js";

export default function usePinch(ref, options) {
  const latest = useRef(options);
  latest.current = options;
  useEffect(() => {
    if (ref.current) return bindPinch(ref.current, () => latest.current);
  }, [ref]);
}
