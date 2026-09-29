import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { MagiId, MagiModelInfo, Vote } from "@/types/magi";
import { MELCHIOR_PROMPT, BALTHASAR_PROMPT, CASPER_PROMPT } from "./prompts";

function parseVoteResponse(text: string): { reasoning: string; vote: Vote; isCritical: boolean } {
  const cleaned = text.trim().replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
  const parsed = JSON.parse(cleaned);
  const vote = (["APPROVE", "REJECT", "ABSTAIN"].includes(parsed.vote)
    ? parsed.vote
    : "ABSTAIN") as Vote;
  return { reasoning: parsed.reasoning || "", vote, isCritical: parsed.isCritical === true };
}

function getOpenAIReasoningEffort(): "low" | "medium" | "high" {
  const effort = process.env.OPENAI_REASONING_EFFORT;
  return effort === "medium" || effort === "high" ? effort : "low";
}

function getGoogleThinkingLevel(): "low" | "medium" | "high" {
  const level = process.env.GOOGLE_THINKING_LEVEL;
  return level === "medium" || level === "high" ? level : "low";
}

function getAnthropicEffort(): "low" | "medium" | "high" {
  const effort = process.env.ANTHROPIC_EFFORT;
  return effort === "medium" || effort === "high" ? effort : "low";
}

export function getMagiModelInfo(id: MagiId): MagiModelInfo {
  switch (id) {
    case "MELCHIOR":
      return {
        model: process.env.OPENAI_MODEL ?? "gpt-6-luna",
        reasoningLevel: getOpenAIReasoningEffort(),
      };
    case "BALTHASAR": {
      const model = process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5";
      return {
        model,
        reasoningLevel: model.includes("sonnet-5-5") ? getAnthropicEffort() : "default",
      };
    }
    case "CASPER":
      return {
        model: process.env.GOOGLE_MODEL ?? "gemini-3.5-flash-lite",
        reasoningLevel: getGoogleThinkingLevel(),
      };
  }
}

export async function queryMelchior(topic: string): Promise<{ reasoning: string; vote: Vote; isCritical: boolean }> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const { model } = getMagiModelInfo("MELCHIOR");
  const response = await client.responses.create({
    model,
    instructions: MELCHIOR_PROMPT,
    input: topic,
    reasoning: { effort: getOpenAIReasoningEffort() },
    max_output_tokens: 1024,
  });
  return parseVoteResponse(response.output_text);
}

export async function queryBalthasar(topic: string): Promise<{ reasoning: string; vote: Vote; isCritical: boolean }> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const { model, reasoningLevel } = getMagiModelInfo("BALTHASAR");
  const request: Parameters<typeof client.messages.create>[0] & {
    stream: false;
    output_config?: { effort: "low" | "medium" | "high" };
  } = {
    model,
    max_tokens: 1024,
    stream: false,
    system: BALTHASAR_PROMPT,
    messages: [{ role: "user", content: topic }],
    ...(reasoningLevel !== "default"
      ? { output_config: { effort: reasoningLevel } }
      : {}),
  };
  const response = await client.messages.create(request);
  if (response.stop_reason === "max_tokens") {
    throw new Error("Claude response was truncated at max_tokens");
  }
  const text = response.content.find((block) => block.type === "text")?.text ?? "";
  return parseVoteResponse(text);
}

export async function queryCasper(topic: string): Promise<{ reasoning: string; vote: Vote; isCritical: boolean }> {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY ?? "");
  const { model: modelName } = getMagiModelInfo("CASPER");
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: CASPER_PROMPT,
  });
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: topic }] }],
    generationConfig: { thinkingConfig: { thinkingLevel: getGoogleThinkingLevel() } } as object,
  });
  const text = result.response.text();
  return parseVoteResponse(text);
}
