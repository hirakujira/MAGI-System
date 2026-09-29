"use server";

import { getMagiModelInfo, queryMelchior, queryBalthasar, queryCasper } from "@/lib/ai-clients";
import { MagiResult } from "@/types/magi";

type MagiAnswer = Pick<MagiResult, "reasoning" | "vote" | "isCritical">;

async function deliberate(
  topic: string,
  id: MagiResult["id"],
  number: MagiResult["number"],
  query: (topic: string) => Promise<MagiAnswer>,
): Promise<MagiResult> {
  const modelInfo = getMagiModelInfo(id);
  try {
    return { id, number, ...modelInfo, ...await query(topic) };
  } catch (err) {
    return {
      id,
      number,
      ...modelInfo,
      reasoning: "SYSTEM ERROR: Connection lost",
      vote: "ABSTAIN",
      error: String(err),
    };
  }
}

export async function deliberateMelchior(topic: string): Promise<MagiResult> {
  return deliberate(topic, "MELCHIOR", 1, queryMelchior);
}

export async function deliberateBalthasar(topic: string): Promise<MagiResult> {
  return deliberate(topic, "BALTHASAR", 2, queryBalthasar);
}

export async function deliberateCasper(topic: string): Promise<MagiResult> {
  return deliberate(topic, "CASPER", 3, queryCasper);
}
