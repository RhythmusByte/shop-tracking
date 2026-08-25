"use client";

import { useEffect, useRef, useState } from "react";

// Animates from 0 (or the previous value) to `value` over `duration` ms.
// `prefix`/`suffix` wrap the formatted number (e.g. prefix="₹").
export default function CountUp({ value, duration = 700, prefix = "", suffix = "" }) {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);
  const frameRef = useRef(null);

  useEffect(() => {
    const from = fromRef.current;
    const to = Number(value) || 0;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = from + (to - from) * eased;
      setDisplay(current);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    }

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <>
      {prefix}
      {Math.round(display).toLocaleString()}
      {suffix}
    </>
  );
}
