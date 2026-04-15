import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
 
export async function POST(req: NextRequest) {
  try {
    const { questions, answers, mode, singleQuestion } = await req.json()
    let prompt = ""
 
    // 단일 문제 암기법 모드
    if (mode === "single" && singleQuestion) {
      const q = singleQuestion
 
      // 캐시 확인
      const supabase = createClient()
      const { data: cached } = await supabase
        .from("ai_explanations")
        .select("content")
        .eq("question_id", q.id)
        .single()
 
      if (cached?.content) {
        return NextResponse.json({ result: cached.content })
      }
 
      // 캐시 없으면 API 호출
      prompt = `당신은 전기기능장 시험 전문 강사입니다.
다음 문제에 대해 분석해주세요:
[문제] ${q.question_text}
[과목] ${q.subject}
[보기]
1번: ${q.option_1}
2번: ${q.option_2}
3번: ${q.option_3}
4번: ${q.option_4}
[정답] ${q.answer}번: ${q["option_"+q.answer]}
다음 형식으로 간결하게 답변해주세요:
## 💡 핵심 개념
이 문제의 핵심 개념 한 줄 요약
## 🧠 왜 정답인가
정답이 ${q.answer}번인 이유를 쉽게 설명
## 🔑 암기법
이 개념을 쉽게 기억하는 연상법이나 암기 공식`
 
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY!,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-5",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }]
        })
      })
 
      const data = await res.json()
      const text = data.content?.[0]?.text || "분석 실패"
 
      // DB에 캐시 저장
      if (text !== "분석 실패") {
        await supabase.from("ai_explanations").upsert({
          question_id: q.id,
          content: text
        }, { onConflict: "question_id" })
      }
 
      return NextResponse.json({ result: text })
 
    } else {
      // 전체 분석 모드 (캐싱 불필요)
      const wrongQs = mode === "wrongOnly"
        ? questions
        : questions.filter((q: any, i: number) => answers[i] !== q.answer)
 
      prompt = `당신은 전기기능장 시험 전문 강사입니다.
[${mode === "wrongOnly" ? "누적 오답 문제" : "전체 문제"}]
${questions.map((q: any, i: number) => `${i+1}. [${q.subject}] ${q.question_text} (정답: ${q.answer}번)`).join("\n")}
[틀린 문제]
${wrongQs.length === 0 ? "없음 (모두 정답!)" : wrongQs.map((q: any) => `- [${q.subject}] ${q.question_text}`).join("\n")}
다음 형식으로 간단히 분석해주세요:
## 📊 취약 과목 분석
틀린 문제 기준 취약 과목
## 🎯 핵심 출제 포인트
자주 나오는 핵심 개념 3가지
## 💡 쉽게 암기하는 법
각 개념별 암기 팁
## 📝 다음 학습 추천
집중 공부할 부분`
 
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY!,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-5",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }]
        })
      })
 
      const data = await res.json()
      const text = data.content?.[0]?.text || "분석 실패"
      return NextResponse.json({ result: text })
    }
  } catch (e) {
    return NextResponse.json({ result: "AI 분석 서비스가 일시적으로 중단됐습니다. 잠시 후 다시 시도해주세요." }, { status: 500 })
  }
}
 