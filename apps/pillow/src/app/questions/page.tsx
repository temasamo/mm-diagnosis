import fs from "node:fs";
import path from "node:path";
import QuestionRenderer from "./QuestionRenderer";
import type { Questionnaire } from "@core/mm";

export default function Page() {
  const file = path.join(process.cwd(), "src", "questions.json");
  const data = JSON.parse(fs.readFileSync(file, "utf-8")) as Questionnaire;
  return (
    <main className="max-w-[720px] mx-auto my-10">
      <h2 className="text-xl font-semibold">質問シート</h2>
      <QuestionRenderer data={data} />
    </main>
  );
}
