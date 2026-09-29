"use client";

import { useSyncExternalStore } from "react";

interface Lang {
  units: [string, string, string];
  steps: string[];
  confirm: string;
}

const LANGS: Record<string, Lang> = {
  zh: {
    units: [
      "OpenAI GPT — 科學家的視角",
      "Anthropic Claude — 母親的視角",
      "Google Gemini — 女性的視角",
    ],
    steps: [
      "在下方輸入欄輸入是非題形式的議題，按下 Enter 送出",
      "三台電腦同時審議，完成後以多數決顯示最終裁決",
      "點擊任一電腦可查看詳細推理說明",
      "⚠ 若兩台以上判定為重大議題，切換為全票制：三台必須一致同意才能執行",
    ],
    confirm: "CONFIRM — 開始審議",
  },
  en: {
    units: [
      "OpenAI GPT — Scientist's perspective",
      "Anthropic Claude — Mother's perspective",
      "Google Gemini — Woman's perspective",
    ],
    steps: [
      "Type a yes/no question in the input below and press Enter",
      "All three units deliberate simultaneously and reach a verdict by majority vote",
      "Click any unit to read its full reasoning",
      "⚠ If two or more units flag the topic as a critical matter, unanimous approval is required — any dissent blocks the action",
    ],
    confirm: "CONFIRM — BEGIN DELIBERATION",
  },
  ja: {
    units: [
      "OpenAI GPT — 科学者の視点",
      "Anthropic Claude — 母親の視点",
      "Google Gemini — 女性の視点",
    ],
    steps: [
      "賛否を問う形式の議題を入力し、Enter キーで送信",
      "3台が同時に審議を行い、多数決で最終決定を表示",
      "各ユニットをクリックすると詳細な判断理由を確認できます",
      "⚠ 2台以上が重大事項と判断した場合、全会一致が要求されます：1台でも反対すれば否決となります",
    ],
    confirm: "CONFIRM — 審議を開始",
  },
};

interface Props {
  onClose: () => void;
}

export default function IntroModal({ onClose }: Props) {
  const lang = useSyncExternalStore(
    () => () => {},
    () => {
      const code = navigator.language || "";
      if (code.startsWith("zh")) return LANGS.zh;
      if (code.startsWith("ja")) return LANGS.ja;
      return LANGS.en;
    },
    () => LANGS.en,
  );

  return (
    <div className="modal-overlay">
      <div className="modal-box intro-modal-box">
        <div className="modal-header">
          <span className="modal-title">MAGI SYSTEM — NERV</span>
        </div>
        <div className="modal-body">
          <table className="intro-table">
            <tbody>
              {(["MELCHIOR · 1", "BALTHASAR · 2", "CASPER · 3"] as const).map((unit, i) => (
                <tr key={unit}>
                  <td className="intro-unit">{unit.replace("·", "·\u00a0")}</td>
                  <td>{lang.units[i]}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <ol className="intro-steps">
            {lang.steps.map((step) => {
              const [beforeEnter, afterEnter] = step.split("Enter");
              return (
                <li key={step}>
                  <span className="intro-step-prefix">▸</span>
                  {afterEnter !== undefined ? (
                    <>
                      {beforeEnter}
                      <kbd>Enter</kbd>
                      {afterEnter}
                    </>
                  ) : step}
                </li>
              );
            })}
          </ol>

          <div className="intro-verdict-ref">
            <span style={{ color: "var(--green-ok)" }}>承認</span>
            <span style={{ color: "var(--red-ng)" }}>否決</span>
            <span style={{ color: "var(--blue-info)" }}>棄権</span>
            <span style={{ color: "var(--amber)" }}>膠着</span>
          </div>

          <button className="intro-confirm" onClick={onClose}>
            {lang.confirm}
          </button>
        </div>
      </div>
    </div>
  );
}
