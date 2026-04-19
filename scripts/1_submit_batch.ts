/**
 * 배치 태깅 스크립트 1/3: 배치 제출
 *
 * 사용법: npx tsx scripts/1_submit_batch.ts
 */

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!ANTHROPIC_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ 환경변수 누락: .env.local 확인 필요");
  console.error("필요: ANTHROPIC_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

// ⚠️ 테스트 모드: 처음 N개만 처리 (0이면 전체)
const TEST_LIMIT = 0;

const MODEL = "claude-sonnet-4-5";

const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface Question {
  id: number;
  year: number;
  round: number;
  subject: string;
  question_number: number;
  question_text: string;
  option_1: string | null;
  option_2: string | null;
  option_3: string | null;
  option_4: string | null;
  answer: number | null;
}

interface Topic {
  id: number;
  subject: string;
  chapter: string;
  topic: string;
  keywords: string[];
  importance: number;
}

async function fetchQuestions(): Promise<Question[]> {
  console.log("📥 questions 조회 중...");
  const all: Question[] = [];
  const PAGE = 1000;
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("questions")
      .select("id, year, round, subject, question_number, question_text, option_1, option_2, option_3, option_4, answer")
      .not("subject", "is", null)
      .not("question_text", "is", null)
      .order("id")
      .range(from, from + PAGE - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...(data as Question[]));
    if (data.length < PAGE) break;
    from += PAGE;
  }

  console.log(`✅ ${all.length}개 문제 로드됨`);
  return all;
}

async function fetchTopics(): Promise<Topic[]> {
  console.log("📥 topic_tags 조회 중...");
  const { data, error } = await supabase
    .from("topic_tags")
    .select("id, subject, chapter, topic, keywords, importance")
    .order("id");

  if (error) throw error;
  console.log(`✅ ${data.length}개 주제 로드됨`);
  return data as Topic[];
}

async function fetchAlreadyTaggedIds(): Promise<Set<number>> {
  console.log("📥 기존 태깅 확인 중...");
  const tagged = new Set<number>();
  const PAGE = 1000;
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("question_topics")
      .select("question_id")
      .range(from, from + PAGE - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;
    data.forEach((r: any) => tagged.add(r.question_id));
    if (data.length < PAGE) break;
    from += PAGE;
  }

  console.log(`✅ 기존 태깅된 문제: ${tagged.size}개 (제외 대상)`);
  return tagged;
}

function buildSystemPrompt(topics: Topic[]): string {
  const bySubject: Record<string, Topic[]> = {};
  topics.forEach((t) => {
    if (!bySubject[t.subject]) bySubject[t.subject] = [];
    bySubject[t.subject].push(t);
  });

  let prompt = `당신은 한국 전기기사/산업기사/기능사 시험의 주제 분류 전문가입니다.
주어진 문제를 분석해 가장 관련성 높은 주제 ID를 선택하세요.

# 규칙
1. 반드시 문제의 "subject"와 일치하는 과목 내에서만 선택
2. 주 주제 1개 (primary_topic_id) + 보조 주제 최대 2개 (additional) 선택
3. 확신도 0.0~1.0 사이로 표시
4. JSON 형식으로만 응답 (다른 설명 금지)

# 응답 형식 (JSON만)
{
  "primary_topic_id": 숫자,
  "additional_topic_ids": [숫자, 숫자],
  "confidence": 0.95
}

# 주제 목록 (과목별)

`;

  for (const subject of Object.keys(bySubject).sort()) {
    prompt += `\n## ${subject}\n`;
    for (const t of bySubject[subject]) {
      prompt += `ID ${t.id}: [${t.chapter}] ${t.topic} (키워드: ${t.keywords.join(", ")}, 중요도: ${t.importance})\n`;
    }
  }

  return prompt;
}

function buildBatchRequest(q: Question, systemPrompt: string) {
  const options = [q.option_1, q.option_2, q.option_3, q.option_4]
    .map((o, i) => (o ? `${i + 1}) ${o}` : null))
    .filter(Boolean)
    .join("\n");

  const userMessage = `# 문제 정보
- subject: ${q.subject}
- year: ${q.year}, round: ${q.round}, number: ${q.question_number}

# 문제
${q.question_text}

${options ? `# 보기\n${options}\n` : ""}

위 문제를 ${q.subject} 과목의 주제 중에서 분류하세요. JSON 응답만.`;

  return {
    custom_id: `q_${q.id}`,
    params: {
      model: MODEL,
      max_tokens: 200,
      system: [
        {
          type: "text" as const,
          text: systemPrompt,
          cache_control: { type: "ephemeral" as const },
        },
      ],
      messages: [{ role: "user" as const, content: userMessage }],
    },
  };
}

async function main() {
  console.log("🚀 배치 태깅 시작\n");

  const [questions, topics, taggedIds] = await Promise.all([
    fetchQuestions(),
    fetchTopics(),
    fetchAlreadyTaggedIds(),
  ]);

  let targets = questions.filter((q) => !taggedIds.has(q.id));
  
  if (TEST_LIMIT > 0) {
    targets = targets.slice(0, TEST_LIMIT);
    console.log(`\n⚠️  테스트 모드: ${TEST_LIMIT}개만 처리합니다.`);
  }
  
  console.log(`\n📊 태깅 대상: ${targets.length}개 (전체 ${questions.length}개 중)\n`);

  if (targets.length === 0) {
    console.log("✅ 모든 문제가 이미 태깅되어 있습니다.");
    return;
  }

  const subjectCounts: Record<string, number> = {};
  targets.forEach((q) => {
    subjectCounts[q.subject] = (subjectCounts[q.subject] || 0) + 1;
  });
  console.log("📚 과목별 태깅 대상:");
  Object.entries(subjectCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([s, c]) => console.log(`  ${s}: ${c}개`));
  console.log();

  const systemPrompt = buildSystemPrompt(topics);
  console.log(`📝 System 프롬프트: ${systemPrompt.length} 글자 (캐싱됨)\n`);

  const requests = targets.map((q) => buildBatchRequest(q, systemPrompt));

  console.log(`📤 Anthropic Batch API 제출 중... (${requests.length}건)`);
  const batch = await anthropic.messages.batches.create({
    requests: requests as any,
  });

  console.log(`\n✅ 배치 제출 완료!`);
  console.log(`   Batch ID: ${batch.id}`);
  console.log(`   상태: ${batch.processing_status}`);
  console.log(`   제출 건수: ${requests.length}`);

  const state = {
    batch_id: batch.id,
    submitted_at: new Date().toISOString(),
    total_requests: requests.length,
    question_ids: targets.map((q) => q.id),
  };

  fs.writeFileSync(
    path.join(process.cwd(), "batch_state.json"),
    JSON.stringify(state, null, 2)
  );

  console.log(`\n💾 batch_state.json 저장 완료`);
  console.log(`\n⏭️  다음 단계:`);
  console.log(`   30분~2시간 후: npx tsx scripts/2_check_status.ts`);
}

main().catch((err) => {
  console.error("❌ 오류:", err);
  process.exit(1);
});