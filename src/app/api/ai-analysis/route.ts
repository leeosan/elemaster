import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

export async function POST(req: NextRequest) {
  try {
    const { questions, answers, mode, singleQuestion } = await req.json()
    let prompt = ""

    if (mode === "single" && singleQuestion) {
      const q = singleQuestion

      const supabase = createClient()
      const { data: cached } = await supabase
        .from("ai_explanations")
        .select("content")
        .eq("question_id", q.id)
        .single()

      if (cached?.content) {
        return NextResponse.json({ result: cached.content })
      }

      prompt = `당신은 전기기능사 자격증 전문 강사입니다.
다음 문제에 대해 설명해주세요:
[문제] ${q.question_text}
[과목] ${q.subject}
[보기]
1번: ${q.option_1}
2번: ${q.option_2}
3번: ${q.option_3}
4번: ${q.option_4}
[정답] ${q.answer}번: ${q["option_" + q.answer]}
다음 형식으로 깔끔하게 설명해주세요:
## 🧠 핵심 개념
이 문제의 핵심 개념 및 이론 설명
## ✅ 왜 이게 정답인가?
정답이 ${q.answer}번인 이유를 명확하게 설명
## 🔑 암기법
이 개념을 쉽게 기억할 수 있는 암기 요령`

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY!,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }]
        })
      })

      const data = await res.json()
      const text = data.content?.[0]?.text || "분석 실패"

      if (text !== "분석 실패") {
        await supabase.from("ai_explanations").upsert({
          question_id: q.id,
          content: text
        }, { onConflict: "question_id" })
      }

      return NextResponse.json({ result: text })

    } else {
      const wrongQs = mode === "wrongOnly"
        ? questions
        : questions.filter((q: any, i: number) => answers[i] !== q.answer)

      prompt = `당신은 전기기능사 자격증 전문 강사입니다.
[${mode === "wrongOnly" ? "오답 노트 문제" : "전체 문제"}]
${questions.map((q: any, i: number) => `${i + 1}. [${q.subject}] ${q.question_text} (정답: ${q.answer}번)`).join("\n")}
[오답 문제]
${wrongQs.length === 0 ? "없음 (모두 정답!)" : wrongQs.map((q: any) => `- [${q.subject}] ${q.question_text}`).join("\n")}
다음 형식으로 간단히 분석해주세요:
## 📊 취약 과목 분석
## 📚 핵심 학습 포인트 3가지
## 🔑 암기 요령
## 📅 다음 학습 권장`

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY!,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }]
        })
      })

      const data = await res.json()
      const text = data.content?.[0]?.text || "분석 실패"
      return NextResponse.json({ result: text })
    }
  } catch (e) {
    return NextResponse.json({ result: "AI 분석 서비스가 일시적으로 이용 불가합니다. 잠시 후 다시 시도해주세요." }, { status: 500 })
  }
}