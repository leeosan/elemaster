/**
 * 배치 태깅 스크립트 2/3: 진행 상황 확인
 *
 * 사용법: npx tsx scripts/2_check_status.ts
 */

import Anthropic from "@anthropic-ai/sdk";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

async function main() {
  const statePath = path.join(process.cwd(), "batch_state.json");
  if (!fs.existsSync(statePath)) {
    console.error("❌ batch_state.json 없음. 먼저 1_submit_batch.ts 실행 필요");
    process.exit(1);
  }

  const state = JSON.parse(fs.readFileSync(statePath, "utf-8"));
  console.log(`🔍 배치 상태 조회: ${state.batch_id}\n`);

  const batch = await anthropic.messages.batches.retrieve(state.batch_id);

  console.log(`📊 배치 정보:`);
  console.log(`   ID: ${batch.id}`);
  console.log(`   상태: ${batch.processing_status}`);
  console.log(`   생성 시각: ${batch.created_at}`);

  if (batch.request_counts) {
    const rc = batch.request_counts;
    console.log(`\n📈 요청 현황:`);
    console.log(`   총 건수: ${state.total_requests}`);
    console.log(`   ✅ 성공: ${rc.succeeded || 0}`);
    console.log(`   ⚠️  오류: ${rc.errored || 0}`);
    console.log(`   ❌ 취소: ${rc.canceled || 0}`);
    console.log(`   🔄 처리 중: ${rc.processing || 0}`);
    console.log(`   ⏰ 만료: ${rc.expired || 0}`);
  }

  console.log();

  if (batch.processing_status === "ended") {
    console.log(`🎉 배치 완료! 다음 명령 실행:`);
    console.log(`   npx tsx scripts/3_save_results.ts`);
  } else {
    console.log(`⏳ 아직 처리 중입니다. 잠시 후 다시 확인하세요.`);
    if (batch.expires_at) {
      console.log(`   만료 예정: ${batch.expires_at}`);
    }
  }
}

main().catch((err) => {
  console.error("❌ 오류:", err);
  process.exit(1);
});