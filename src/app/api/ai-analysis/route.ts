import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
 
export async function POST(req: NextRequest) {
  try {
    const { questions, answers, mode, singleQuestion } = await req.json()
    let prompt = ""
 
    // ?⑥씪 臾몄젣 ?붽린踰?紐⑤뱶
    if (mode === "single" && singleQuestion) {
      const q = singleQuestion
 
      // 罹먯떆 ?뺤씤
      const supabase = createClient()
      const { data: cached } = await supabase
        .from("ai_explanations")
        .select("content")
        .eq("question_id", q.id)
        .single()
 
      if (cached?.content) {
        return NextResponse.json({ result: cached.content })
      }
 
      // 罹먯떆 ?놁쑝硫?API ?몄텧
      prompt = `?뱀떊? ?꾧린湲곕뒫???쒗뿕 ?꾨Ц 媛뺤궗?낅땲??
?ㅼ쓬 臾몄젣?????遺꾩꽍?댁＜?몄슂:
[臾몄젣] ${q.question_text}
[怨쇰ぉ] ${q.subject}
[蹂닿린]
1踰? ${q.option_1}
2踰? ${q.option_2}
3踰? ${q.option_3}
4踰? ${q.option_4}
[?뺣떟] ${q.answer}踰? ${q["option_"+q.answer]}
?ㅼ쓬 ?뺤떇?쇰줈 媛꾧껐?섍쾶 ?듬??댁＜?몄슂:
## ?뮕 ?듭떖 媛쒕뀗
??臾몄젣???듭떖 媛쒕뀗 ??以??붿빟
## ?쭬 ???뺣떟?멸?
?뺣떟??${q.answer}踰덉씤 ?댁쑀瑜??쎄쾶 ?ㅻ챸
## ?뵎 ?붽린踰???媛쒕뀗???쎄쾶 湲곗뼲?섎뒗 ?곗긽踰뺤씠???붽린 怨듭떇`
 
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
      const text = data.content?.[0]?.text || "遺꾩꽍 ?ㅽ뙣"
 
      // DB??罹먯떆 ???      if (text !== "遺꾩꽍 ?ㅽ뙣") {
        await supabase.from("ai_explanations").upsert({
          question_id: q.id,
          content: text
        }, { onConflict: "question_id" })
      }
 
      return NextResponse.json({ result: text })
 
    } else {
      // ?꾩껜 遺꾩꽍 紐⑤뱶 (罹먯떛 遺덊븘??
      const wrongQs = mode === "wrongOnly"
        ? questions
        : questions.filter((q: any, i: number) => answers[i] !== q.answer)
 
      prompt = `?뱀떊? ?꾧린湲곕뒫???쒗뿕 ?꾨Ц 媛뺤궗?낅땲??
[${mode === "wrongOnly" ? "?꾩쟻 ?ㅻ떟 臾몄젣" : "?꾩껜 臾몄젣"}]
${questions.map((q: any, i: number) => `${i+1}. [${q.subject}] ${q.question_text} (?뺣떟: ${q.answer}踰?`).join("\n")}
[?由?臾몄젣]
${wrongQs.length === 0 ? "?놁쓬 (紐⑤몢 ?뺣떟!)" : wrongQs.map((q: any) => `- [${q.subject}] ${q.question_text}`).join("\n")}
?ㅼ쓬 ?뺤떇?쇰줈 媛꾨떒??遺꾩꽍?댁＜?몄슂:
## ?뱤 痍⑥빟 怨쇰ぉ 遺꾩꽍
?由?臾몄젣 湲곗? 痍⑥빟 怨쇰ぉ
## ?렞 ?듭떖 異쒖젣 ?ъ씤???먯＜ ?섏삤???듭떖 媛쒕뀗 3媛吏
## ?뮕 ?쎄쾶 ?붽린?섎뒗 踰?媛?媛쒕뀗蹂??붽린 ??## ?뱷 ?ㅼ쓬 ?숈뒿 異붿쿇
吏묒쨷 怨듬???遺遺?
 
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
      const text = data.content?.[0]?.text || "遺꾩꽍 ?ㅽ뙣"
      return NextResponse.json({ result: text })
    }
  } catch (e) {
    return NextResponse.json({ result: "AI 遺꾩꽍 ?쒕퉬?ㅺ? ?쇱떆?곸쑝濡?以묐떒?먯뒿?덈떎. ?좎떆 ???ㅼ떆 ?쒕룄?댁＜?몄슂." }, { status: 500 })
  }
}
 
