"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SystemHeader, SystemFooter } from "@/components/SystemChrome";

const UNITS = [
  { name: "BALTHASAR", number: "02", points: "220,12 420,12 420,130 385,158 255,158 220,130", x: 320, y: 83 },
  { name: "CASPER", number: "03", points: "50,180 202,180 262,235 262,320 50,320", x: 153, y: 250 },
  { name: "MELCHIOR", number: "01", points: "438,180 590,180 590,320 378,320 378,235", x: 487, y: 250 },
];

export default function BootSequence({ onComplete }: { onComplete: () => void }) {
  const [stage, setStage] = useState(0);
  const [progress, setProgress] = useState(0);
  const [unitOrder, setUnitOrder] = useState([0, 1, 2]);
  const finished = useRef(false);
  const screen = useRef<HTMLDivElement>(null);
  const complete = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    screen.current?.focus({ preventScroll: true });
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timers: ReturnType<typeof setTimeout>[] = [];
    const schedule = () => {
      timers.forEach(clearTimeout);
      if (motion.matches) {
        timers = [setTimeout(() => { setStage(4); setProgress(24); }, 0), setTimeout(complete, 7400)];
      } else {
        const order = [0, 1, 2];
        for (let i = order.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [order[i], order[j]] = [order[j], order[i]];
        }
        timers = [800, 1800, 2800, 4000, 7000].map((delay, index) =>
          setTimeout(() => setStage(index + 1), delay),
        );
        timers.push(setTimeout(() => {
          setUnitOrder(order);
          setStage(0);
          setProgress(0);
        }, 0));
        for (let cell = 1; cell <= 24; cell++) {
          timers.push(setTimeout(() => setProgress(cell), (4000 / 24) * cell));
        }
        timers.push(setTimeout(complete, 7400));
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Tab") {
        event.preventDefault();
        screen.current?.focus({ preventScroll: true });
      }
    };
    schedule();
    motion.addEventListener("change", schedule);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      timers.forEach(clearTimeout);
      motion.removeEventListener("change", schedule);
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [complete]);

  const ready = stage >= 4;
  return (
    <div ref={screen} tabIndex={-1} className={`boot-screen${ready ? " boot-ready" : ""}${stage === 5 ? " boot-exit" : ""}`}
      role="dialog" aria-modal="true" aria-label="MAGI system boot sequence">
      <div className="boot-scan" aria-hidden="true" />
      <SystemHeader />
      <div className="boot-content">
        <div className="boot-title">
        <div className="boot-eyebrow">SUPERCOMPUTER // 三賢人システム</div>
        <h1 className={`boot-heading${ready ? "" : " boot-heading-start"}`}>{ready ? "同期完了" : "システム起動"}</h1>
        <div className="boot-subtitle">{ready ? "全システム同期完了" : "起動シーケンス実行中"}</div>
        </div>
        <svg className="boot-diagram" viewBox="0 0 640 340" aria-label="MAGI units initializing">
          <g className="boot-guides"><path d="M0 170H640 M320 0V340" /><circle cx="320" cy="175" r="155" /></g>
          <g className={`boot-connections${stage >= 3 ? " boot-online" : ""}`}>
            {/* Cross the lower corners (255,158)/(385,158); bury endpoints under the units. */}
            <path d="M264 149L208 205 M376 149L432 205 M262 270H378" />
          </g>
          {UNITS.map((unit, index) => (
            <g key={unit.name} className={`boot-unit${stage > unitOrder.indexOf(index) ? " boot-online" : ""}`}>
              <polygon points={unit.points} />
              <text className="boot-unit-number" x={unit.x} y={unit.y - 27}>{unit.number}</text>
              <text className="boot-unit-name" x={unit.x} y={unit.y}>{unit.name}</text>
              <text className="boot-unit-status" x={unit.x} y={unit.y + 24}>{stage > unitOrder.indexOf(index) ? "● ONLINE" : "○ STANDBY"}</text>
            </g>
          ))}
          <text className="boot-core" x="320" y="220">MAGI</text>
        </svg>
        <div className="boot-telemetry">
          <span>INITIALIZATION SEQUENCE</span><span>{String(Math.round(progress / 24 * 100)).padStart(2, "0")}%</span>
          <div className="boot-progress" aria-hidden="true">
            {Array.from({ length: 24 }, (_, i) => <i key={i} className={i < progress ? "boot-filled" : ""} />)}
          </div>
          <div className="boot-status" role="status" aria-live="polite">
            {ready ? "SYSTEM READY — ALL UNITS SYNCHRONIZED" : stage === 0
              ? "起動準備 / ESTABLISHING SYSTEM BUS"
              : `${["", "人格移植 OS", "論理回路接続", "三賢人同期"][stage]} / ${UNITS[unitOrder[stage - 1]].name} CONNECTED`}
          </div>
        </div>
      </div>
      <SystemFooter>
        <span className="boot-footer-code">BOOT SEQUENCE<br />AUTOMATIC SYSTEM CHECK</span>
      </SystemFooter>
    </div>
  );
}
