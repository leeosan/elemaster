import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { questions, answers } = await req.json()
    const wrongQs = questions.filter((q: any, i: number) => answers[i] !== q.answer)

    const prompt = `당신은 전기기능장 시험 전문 강사입니다.

[전체 문제]
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
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }]
      })
    })

    const data = await res.json()
    const text = data.content?.[0]?.text || "분석 실패"
    return NextResponse.json({ result: text })
  } catch (e) {
    return NextResponse.json({ result: "AI 분석 서비스가 일시적으로 중단됐습니다. 잠시 후 다시 시도해주세요." }, { status: 500 })
  }
}
