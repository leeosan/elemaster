/**
 * 배치 태깅 스크립트 3/3: 결과 저장
 *
 * 사용법: npx tsx scripts/3_save_results.ts
 */

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface TagResult {
  primary_topic_id: number;
  additional_topic_ids: number[];
  confidence: number;
}

function parseResponse(text: string): TagResult | null {
  try {
    const cleaned = text.replace(/```json|```/g, "").trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return null;
    const obj = JSON.parse(match[0]);
    if (!obj.primary_topic_id || typeof obj.primary_topic_id !== "number") return null;
    return {
      primary_topic_id: obj.primary_topic_id,
      additional_topic_ids: Array.isArray(obj.additional_topic_ids) ? obj.additional_topic_ids : [],
      confidence: typeof obj.confidence === "number" ? obj.confidence : 0.5,
    };
  } catch {
    return null;
  }
}

async function main() {
  const statePath = path.join(process.cwd(), "batch_state.json");
  if (!fs.existsSync(statePath)) {
    console.error("❌ batch_state.json 없음");
    process.exit(1);
  }

  const state = JSON.parse(fs.readFileSync(statePath, "utf-8"));
  console.log(`📥 배치 결과 다운로드: ${state.batch_id}\n`);

  const batch = await anthropic.messages.batches.retrieve(state.batch_id);
  if (batch.processing_status !== "ended") {
    console.error(`❌ 배치가 아직 완료되지 않음 (상태: ${batch.processing_status})`);
    process.exit(1);
  }

  const results: { customId: string; result: any }[] = [];
  const stream = await anthropic.messages.batches.results(state.batch_id);
  for await (const item of stream) {
    results.push({ customId: item.custom_id, result: item.result });
  }

  console.log(`✅ 결과 ${results.length}건 다운로드 완료\n`);

  const toInsert: { question_id: number; topic_id: number; relevance: number; tagged_by: string }[] = [];
  let succeeded = 0;
  let failedParse = 0;
  let errored = 0;
  const errors: string[] = [];

  for (const { customId, result } of results) {
    const questionId = parseInt(customId.replace("q_", ""), 10);

    if (result.type !== "succeeded") {
      errored++;
      errors.push(`q_${questionId}: ${result.type}`);
      continue;
    }

    const message = result.message;
    const text = message.content
      .filter((b: any) => b.type === "text")
      .map((b: any) => b.text)
      .join("");

    const parsed = parseResponse(text);
    if (!parsed) {
      failedParse++;
      errors.push(`q_${questionId}: parse failure`);
      continue;
    }

    toInsert.push({
      question_id: questionId,
      topic_id: parsed.primary_topic_id,
      relevance: parsed.confidence,
      tagged_by: "ai",
    });

    const seen = new Set([parsed.primary_topic_id]);
    for (const tid of parsed.additional_topic_ids.slice(0, 2)) {
      if (typeof tid !== "number" || seen.has(tid)) continue;
      seen.add(tid);
      toInsert.push({
        question_id: questionId,
        topic_id: tid,
        relevance: Math.max(0.3, parsed.confidence - 0.2),
        tagged_by: "ai",
      });
    }

    succeeded++;
  }

  console.log(`📊 파싱 결과:`);
  console.log(`   ✅ 성공: ${succeeded}`);
  console.log(`   ⚠️  파싱 실패: ${failedParse}`);
  console.log(`   ❌ API 에러: ${errored}`);
  console.log(`   📌 총 tag 레코드: ${toInsert.length}\n`);

  if (errors.length > 0 && errors.length <= 20) {
    console.log(`오류 샘플:`);
    errors.slice(0, 20).forEach((e) => console.log(`   ${e}`));
    console.log();
  }

  console.log(`💾 Supabase에 저장 중...`);
  const BATCH = 500;
  let inserted = 0;
  for (let i = 0; i < toInsert.length; i += BATCH) {
    const chunk = toInsert.slice(i, i + BATCH);
    const { error } = await supabase
      .from("question_topics")
      .upsert(chunk, { onConflict: "question_id,topic_id", ignoreDuplicates: false });

    if (error) {
      console.error(`❌ 저장 에러 (batch ${i / BATCH + 1}):`, error.message);
      continue;
    }
    inserted += chunk.length;
    console.log(`   저장 진행: ${inserted}/${toInsert.length}`);
  }

  console.log(`\n🎉 완료! ${inserted}개 tag 레코드 저장됨\n`);

  console.log(`📈 빈출 TOP 10 미리보기:`);
  const { data: top10 } = await supabase
    .from("top_frequent_topics")
    .select("subject, topic, frequency")
    .order("frequency", { ascending: false })
    .limit(10);

  if (top10) {
    top10.forEach((r: any, i: number) => {
      console.log(`   ${i + 1}. [${r.subject}] ${r.topic}: ${r.frequency}회`);
    });
  }
}

main().catch((err) => {
  console.error("❌ 오류:", err);
  process.exit(1);
});