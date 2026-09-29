"use client";

import { useEffect, useState } from "react";
import { MagiId, MagiResult, PartialResults, Vote } from "@/types/magi";

type Verdict = Vote | "DEADLOCK";

const COLORS: Record<Verdict, string> = {
  APPROVE: "var(--green-ok)",
  REJECT: "var(--red-ng)",
  ABSTAIN: "var(--blue-info)",
  DEADLOCK: "var(--amber)",
};

const VERDICT_TEXT: Record<Verdict, string> = {
  APPROVE: "承 認",
  REJECT: "否 決",
  ABSTAIN: "棄 権",
  DEADLOCK: "膠 着",
};

function voteBackground(vote: Vote | null): string {
  return COLORS[vote ?? "ABSTAIN"];
}

function verdictText(verdict: Verdict): string {
  return VERDICT_TEXT[verdict];
}

function verdictColor(verdict: Verdict): string {
  return COLORS[verdict];
}

function rand(digits: number) {
  const min = 10 ** (digits - 1);
  const max = 10 ** digits - 1;
  return String(Math.floor(Math.random() * (max - min + 1)) + min);
}

interface Props {
  partialResults: PartialResults;
  processingUnits: Set<MagiId>;
  finalVerdict: (Vote | "DEADLOCK") | null;
}

const SHAPES: Array<{ id: MagiId; label: string; cls: string }> = [
  { id: "BALTHASAR", label: "BALTHASAR • 2", cls: "wise-balthasar" },
  { id: "CASPER", label: "CASPER • 3", cls: "wise-casper" },
  { id: "MELCHIOR", label: "MELCHIOR • 1", cls: "wise-melchior" },
];

export default function MagiDiagram({ partialResults, processingUnits, finalVerdict }: Props) {
  const [modalId, setModalId] = useState<MagiId | null>(null);
  const [flickerDelays, setFlickerDelays] = useState<Record<MagiId, string>>({
    BALTHASAR: "0ms", CASPER: "0ms", MELCHIOR: "0ms",
  });
  const [code, setCode] = useState("473");
  const [ext, setExt] = useState("STBY");

  const isProcessing = processingUnits.size > 0;

  useEffect(() => {
    if (processingUnits.size === 3) {
      // 新しい審議が始まった時だけリセット
      setFlickerDelays({
        BALTHASAR: `${Math.floor(Math.random() * 180)}ms`,
        CASPER: `${Math.floor(Math.random() * 180)}ms`,
        MELCHIOR: `${Math.floor(Math.random() * 180)}ms`,
      });
      setCode(rand(3));
      setExt(rand(4));
    }
  }, [processingUnits.size]);

  const modalResult: MagiResult | null = modalId ? (partialResults[modalId] ?? null) : null;

  return (
    <>
      <div className="magi-grid">
        <div className="magi-conn conn-cb" />
        <div className="magi-conn conn-bm" />
        <div className="magi-conn conn-cm" />

        {/* System status */}
        <div className="magi-sys-status">
          <div>CODE:{code}</div>
          <div className="magi-sys-status-inner">
            <div>FILE:MAGI_SYS</div>
            <div>EXT:{ext}</div>
            <div>EX_MODE:OFF</div>
            <div>PRIORITY:AAA</div>
          </div>
        </div>

        {/* Verdict badge */}
        <div
          className={`magi-verdict${isProcessing ? " flicker" : ""}`}
          style={{
            color: isProcessing ? "#f7ca62" : finalVerdict ? verdictColor(finalVerdict) : "#3caee0",
            borderColor: isProcessing ? "#f7ca62" : finalVerdict ? verdictColor(finalVerdict) : "#3caee0",
          }}
        >
          <div className="magi-verdict-inner">
            {isProcessing ? "審議中" : finalVerdict ? verdictText(finalVerdict) : "情 報"}
          </div>
        </div>

        {/* Decorative headers */}
        <div className="magi-header-deco left">
          <div className="magi-header-deco-bar" />
          <div className="magi-header-deco-bar" />
          <span>提 訴</span>
          <div className="magi-header-deco-bar" />
          <div className="magi-header-deco-bar" />
        </div>
        <div className="magi-header-deco right">
          <div className="magi-header-deco-bar" />
          <div className="magi-header-deco-bar" />
          <span>決 議</span>
          <div className="magi-header-deco-bar" />
          <div className="magi-header-deco-bar" />
        </div>

        {/* Three MAGI units */}
        {SHAPES.map(({ id, label, cls }) => {
          const result = partialResults[id];
          const processing = processingUnits.has(id);
          const bg = voteBackground(result?.vote ?? null);
          return (
            <div
              key={id}
              className={`wise-man ${cls}`}
              onClick={() => result && setModalId(id)}
              style={{ cursor: result ? "pointer" : "default" }}
            >
              <div
                className={`wise-inner${processing ? " flicker-fast" : ""}`}
                style={{
                  "--wise-bg": bg,
                  animationDelay: processing ? flickerDelays[id] : "0ms",
                } as React.CSSProperties}
              >
                {label}
              </div>
            </div>
          );
        })}

        <div className="magi-center-title">MAGI</div>
      </div>

      {/* Reasoning modal */}
      {modalResult && (
        <div className="modal-overlay" onClick={() => setModalId(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">
                <span>{modalResult.id} • {modalResult.number}</span>
                <span className="modal-model-info">
                  MODEL: {modalResult.model} • REASONING: {modalResult.reasoningLevel}
                </span>
              </span>
              <button className="modal-close" onClick={() => setModalId(null)}>✕</button>
            </div>
            <div className="modal-body">
              {modalResult.isCritical && (
                <div className="modal-critical">⚠ CRITICAL MATTER — 重大議題</div>
              )}
              <div
                className="modal-vote"
                style={{
                  color: voteBackground(modalResult.vote),
                  borderColor: voteBackground(modalResult.vote),
                }}
              >
                {verdictText(modalResult.vote)}
              </div>
              <p className="modal-reasoning">{modalResult.reasoning}</p>
              {modalResult.error && (
                <p className="modal-error">ERR: {modalResult.error}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
