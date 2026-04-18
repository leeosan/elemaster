"use client"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { useRouter } from "next/navigation"

// 🔒 관리자 전용 이메일
const ADMIN_EMAIL = "jaetech01@gmail.com"

const SUBJECTS = ["전기이론", "전기기기", "전기설비", "전력전자", "송배전공학", "디지털공학", "공업경영"]

export default function PopularPage() {
  const router = useRouter()
  const [selectedSubject, setSelectedSubject] = useState("전기이론")
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState<number | null>(null)
  const [singleAi, setSingleAi] = useState<{[key: number]: string}>({})
  const [singleAiLoading, setSingleAiLoading] = useState<number | null>(null)
  const [authChecked, setAuthChecked] = useState(false)

  // 🔒 관리자 전용 체크
  useEffect(() => {
    const checkAdmin = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace("/login")
        return
      }
      if (user.email !== ADMIN_EMAIL) {
        alert("관리자 전용 페이지입니다.")
        router.replace("/cbt/past")
        return
      }
      setAuthChecked(true)
    }
    checkAdmin()
  }, [])

  useEffect(() => {
    if (!authChecked) return
    fetchPopular(selectedSubject)
  }, [selectedSubject, authChecked])

  const fetchPopular = async (subject: string) => {
    setLoading(true)
    setExpanded(null)
    const supabase = createClient()
    const { data } = await supabase.rpc("get_popular_questions", { p_subject: subject })
    setQuestions(data || [])
    setLoading(false)
  }

  const getSingleAi = async (index: number, question: any) => {
    setSingleAiLoading(index)
    try {
      const res = await fetch("/api/ai-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "single", singleQuestion: question, questions: [], answers: {} })
      })
      const data = await res.json()
      setSingleAi(prev => ({ ...prev, [index]: data.result || "분석 실패" }))
    } catch {
      setSingleAi(prev => ({ ...prev, [index]: "AI 분석 서비스가 일시적으로 중단되었습니다." }))
    }
    setSingleAiLoading(null)
  }

  // 🔒 인증 체크 중 로딩 화면
  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">확인 중...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <button onClick={() => router.back()} className="text-gray-500 text-sm mb-3 hover:text-gray-700">← 뒤로</button>
          <h1 className="text-2xl font-bold text-gray-800">📊 과목별 최다출제문제 <span className="text-sm text-red-500">(관리자)</span></h1>
          <p className="text-gray-500 text-sm mt-1">2회 이상 출제된 문제 모음</p>
        </div>

        {/* 과목 탭 */}
        <div className="flex gap-2 flex-wrap mb-5">
          {SUBJECTS.map(s => (
            <button key={s} onClick={() => setSelectedSubject(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${selectedSubject === s ? "bg-blue-600 text-white" : "bg-white text-gray-600 border border-gray-200 hover:border-blue-300"}`}>
              {s}
            </button>
          ))}
        </div>

        {/* 문제 목록 */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">불러오는 중...</div>
        ) : questions.length === 0 ? (
          <div className="text-center py-12 text-gray-400">해당 과목의 최다출제문제가 없습니다</div>
        ) : (
          <div className="flex flex-col gap-3">
            {questions.map((q, i) => (
              <div key={i} className="bg-white rounded-xl shadow overflow-hidden">
                <button onClick={() => setExpanded(expanded === i ? null : i)}
                  className="w-full text-left p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs bg-blue-100 text-blue-600 font-bold px-2 py-0.5 rounded-full">
                          📌 {q.cnt}회 출제
                        </span>
                        <span className="text-xs text-gray-400">{q.appearances}</span>
                      </div>
                      <p className="text-sm text-gray-800 font-medium leading-relaxed">{q.question_text}</p>
                    </div>
                    <span className="text-gray-400 text-xs flex-shrink-0">{expanded === i ? "▲" : "▼"}</span>
                  </div>
                </button>
                {expanded === i && (
                  <div className="px-4 pb-4 border-t border-gray-100">
                    <div className="flex flex-col gap-2 mt-3">
                      {[1, 2, 3, 4].map(num => (
                        <div key={num} className={`px-4 py-3 rounded-xl border-2 text-sm
                          ${num === q.answer ? "border-green-500 bg-green-50 text-green-700 font-semibold" : "border-gray-200 text-gray-600"}`}>
                          {num === q.answer && <span className="mr-1">✓</span>}
                          {num}. {q[`option_${num}`]}
                        </div>
                      ))}
                    </div>
                    {q.explanation && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mt-3 text-sm text-gray-700">
                        <p className="font-semibold text-yellow-700 mb-1">💡 해설</p>
                        <p>{q.explanation}</p>
                      </div>
                    )}
                    <button onClick={() => getSingleAi(i, q)} disabled={singleAiLoading === i}
                      className="mt-3 w-full py-2 bg-purple-100 text-purple-700 rounded-xl text-sm font-semibold hover:bg-purple-200 disabled:opacity-50">
                      {singleAiLoading === i ? "🤖 생성 중..." : "🤖 AI 풀이법 & 답 보기"}
                    </button>
                    {singleAi[i] && (
                      <div className="mt-2 bg-purple-50 border border-purple-200 rounded-xl p-4 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {singleAi[i]}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}