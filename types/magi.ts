export type Vote = "APPROVE" | "REJECT" | "ABSTAIN";

export type MagiId = "MELCHIOR" | "BALTHASAR" | "CASPER";

export type ReasoningLevel = "low" | "medium" | "high" | "default";

export interface MagiModelInfo {
  model: string;
  reasoningLevel: ReasoningLevel;
}

export interface MagiResult {
  id: MagiId;
  number: 1 | 2 | 3;
  model: string;
  reasoningLevel: ReasoningLevel;
  reasoning: string;
  vote: Vote;
  isCritical?: boolean;
  error?: string;
}

export type PartialResults = Partial<Record<MagiId, MagiResult>>;
