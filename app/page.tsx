"use client";

import { useCallback, useState } from "react";
import BootSequence from "@/components/BootSequence";
import MagiDiagram from "@/components/MagiDiagram";
import DeliberationInput from "@/components/DeliberationInput";
import IntroModal from "@/components/IntroModal";
import { SystemHeader, SystemFooter } from "@/components/SystemChrome";
import { MagiId, MagiResult, PartialResults, Vote } from "@/types/magi";
import { deliberateMelchior, deliberateBalthasar, deliberateCasper } from "@/app/actions";

const UNITS: MagiId[] = ["MELCHIOR", "BALTHASAR", "CASPER"];
const ACTIONS = {
  MELCHIOR: deliberateMelchior,
  BALTHASAR: deliberateBalthasar,
  CASPER: deliberateCasper,
} satisfies Record<MagiId, (topic: string) => Promise<MagiResult>>;

function computeVerdict(results: PartialResults): (Vote | "DEADLOCK") | null {
  const all = UNITS.map((u) => results[u]).filter(Boolean) as MagiResult[];
  if (all.length !== UNITS.length) return null;

  const isCritical = all.filter((r) => r.isCritical).length >= 2;
  if (isCritical) {
    return all.every((r) => r.vote === "APPROVE") ? "APPROVE" : "REJECT";
  }

  const approveCount = all.filter((r) => r.vote === "APPROVE").length;
  const rejectCount  = all.filter((r) => r.vote === "REJECT").length;
  const abstainCount = all.filter((r) => r.vote === "ABSTAIN").length;
  if (abstainCount >= 2) return "ABSTAIN";
  if (approveCount > rejectCount) return "APPROVE";
  if (rejectCount  > approveCount) return "REJECT";
  return "DEADLOCK";
}

export default function Home() {
  const [entryPhase, setEntryPhase] = useState<"boot" | "intro" | "ready">("boot");
  const finishBoot = useCallback(() => setEntryPhase("intro"), []);
  const [topic, setTopic] = useState("");
  const [processingUnits, setProcessingUnits] = useState<Set<MagiId>>(new Set());
  const [partialResults, setPartialResults] = useState<PartialResults>({});
  const [error, setError] = useState<string | null>(null);

  const isProcessing = processingUnits.size > 0;
  const finalVerdict = computeVerdict(partialResults);

  const handleDeliberate = async () => {
    if (!topic.trim() || isProcessing) return;

    setProcessingUnits(new Set(UNITS));
    setPartialResults({});
    setError(null);

    const runUnit = async (unit: MagiId) => {
      try {
        const result = await ACTIONS[unit](topic);
        setPartialResults((prev) => ({ ...prev, [unit]: result }));
      } catch {
        setError("Connection lost");
      } finally {
        setProcessingUnits((prev) => {
          const next = new Set(prev);
          next.delete(unit);
          return next;
        });
      }
    };

    UNITS.forEach((unit) => runUnit(unit));
  };

  return (
    <>
      {entryPhase === "boot" && <BootSequence onComplete={finishBoot} />}
      {entryPhase === "intro" && <IntroModal onClose={() => setEntryPhase("ready")} />}
    <main className="magi-main" inert={entryPhase !== "ready"} aria-hidden={entryPhase !== "ready"}>
      <SystemHeader />
      <div className="magi-console">
      <div className="console-banner">
        <h1>MAGI <span>/ 三賢人システム</span></h1>
        <span className={`console-status${error ? " console-status-error" : isProcessing ? " console-status-active" : ""}`} role="status">
          <span aria-hidden="true">● </span>
          {error ? "CONNECTION ERROR" : isProcessing ? "DELIBERATION IN PROGRESS" : "AWAITING INPUT"}
        </span>
      </div>
      <div className="system-border">
        <MagiDiagram
          partialResults={partialResults}
          processingUnits={processingUnits}
          finalVerdict={finalVerdict}
        />

        {error && (
          <div className="error-panel">
            <span className="error-icon">⚠</span>
            <span>SYSTEM ERROR: {error}</span>
          </div>
        )}

        <DeliberationInput
          topic={topic}
          onTopicChange={setTopic}
          onSubmit={handleDeliberate}
          isProcessing={isProcessing}
        />
      </div>
      </div>
      <SystemFooter>
      <div className="console-footer-right">
      <span className="boot-footer-code">MAGI SYSTEM<br />DELIBERATION CONTROL</span>
      <a
        href="https://github.com/hirakujira/MAGI/"
        target="_blank"
        rel="noopener noreferrer"
        className="github-link"
      >
        ⌥ GitHub
      </a>
      </div>
      </SystemFooter>
    </main>
    </>
  );
}
