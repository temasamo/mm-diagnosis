import path from "path";
import fs from "fs/promises";
import type { Questionnaire } from "./types";

export async function loadPillowQuestions(): Promise<Questionnaire> {
  const filePath = path.join(process.cwd(), "apps/pillow/public/questions.pillow.v2.json");
  const raw = await fs.readFile(filePath, "utf-8");
  const data = JSON.parse(raw);
  if (!data?.items) throw new Error("Invalid questionnaire JSON");
  return data as Questionnaire;
} 