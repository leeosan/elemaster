"use client"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function MyPage() {
  const [user, setUser] = useState<any>(null)
  const [wrongAnswers, setWrongAnswers] = useState<any[]>([])
  const [bookmarkedQs, setBookmarkedQs] = useState<any[]>([])
  const [studyLogs, setStudyLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"wrong" | "bookmark">("wrong")
  const [reviewIndex, setReviewIndex] = useState<number | null>(null)
  const [stats, setStats] = useState({ total: 0, thisWeek: 0, subjects: {} as any })
  const [aiAnalysis, setAiAnalysis] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const [singleAi, setSingleAi] = useState<{[key: number]: string}>({})
  const [singleAiLoading, setSingleAiLoading] = useState<number | null>(null)
  const [streak, setStreak] = useState(0)
  const [passPredict, setPassPredict] = useState<number | null>(null)
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace("/login"); return }
      setUser(user)

      // 오답 불러오기
      const { data: wrongData } = await supabase
        .from("wrong_answers").select("*, questions(*)")
        .eq("user_id", user.id).order("solved_at", { ascending: false })
      setWrongAnswers(wrongData || [])

      // 북마크 불러오기
      const { data: bmData } = await supabase
        .from("bookmarks").select("*, questions(*)")
        .eq("user_id", user.id).order("created_at", { ascending: false })
      setBookmarkedQs(bmData || [])

      // 학습기록 불러오기 (스트릭 + 합격예측)
      const { data: logData } = await supabase
        .from("study_logs").select("*")
        .eq("user_id", user.id).order("studied_at", { ascending: false })
        .limit(30)
      setStudyLogs(logData || [])

      // 스트릭 계산
      let s = 0
      const today = new Date()
      for (let i = 0; i < 30; i++) {
        const d = new Date(today)
        d.setDate(d.getDate() - i)
        const ds = d.toISOString().split("T")[0]
        if ((logData || []).find((l: any) => l.studied_at === ds)) s++
        else if (i > 0) break
      }
      setStreak(s)

      // 합격 예측 (최근 5회 평균)
      const recent5 = (logData || []).slice(0, 5)
      if (recent5.length > 0) {
        const avg = recent5.reduce((sum: number, l: any) => sum + l.score, 0) / recent5.length
        setPassPredict(Math.round(avg))
      }

      // 통계
      const thisWeek = (wrongData || []).filter(w => {
        const diff = Date.now() - new Date(w.solved_at).getTime()
        return diff < 7 * 24 * 60 * 60 * 1000
      }).length
      const subjects: any = {}
      ;(wrongData || []).forEach(w => {
        const s = w.questions?.subject || "기타"
        subjects[s] = (subjects[s] || 0) + 1
      })
      setStats({ total: (wrongData || []).length, thisWeek, subjects })
      setLoading(false)
    }
    init()
  }, [])

  const deleteWrong = async (id: number) => {
    const supabase = createClient()
    await supabase.from("wrong_answers").delete().eq("id", id)
    setWrongAnswers(prev => prev.filter(w => w.id !== id))
    setStats(prev => ({ ...prev, total: prev.total - 1 }))
  }

  const deleteBookmark = async (questionId: number) => {
    const supabase = createClient()
    await supabase.from("bookmarks").delete().eq("user_id", user.id).eq("question_id", questionId)
    setBookmarkedQs(prev => prev.filter(b => b.question_id !== questionId))
  }

  const getAiAnalysis = async () => {
    if (wrongAnswers.length === 0) return
    setAiLoading(true)
    setAiAnalysis("")
    const questions = wrongAnswers.map(w => w.questions).filter(Boolean)
    try {
      const res = await fetch("/api/ai-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions, answers: {}, mode: "wrongOnly" })
      })
      const data = await res.json()
      setAiAnalysis(data.result || "분석 실패")
    } catch { setAiAnalysis("AI 분석 서비스가 일시적으로 중단됐습니다.") }
    setAiLoading(false)
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
    } catch { setSingleAi(prev => ({ ...prev, [index]: "AI 분석 서비스가 일시적으로 중단됐습니다." })) }
    setSingleAiLoading(null)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">불러오는 중...</p></div>

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">📊 나의 학습</h1>

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <p className="text-2xl font-bold text-red-500">{stats.total}</p>
            <p className="text-xs text-gray-500 mt-1">전체 오답</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <p className="text-2xl font-bold text-orange-500">{stats.thisWeek}</p>
            <p className="text-xs text-gray-500 mt-1">이번주 오답</p>
          </div>
        </div>

        {/* 스트릭 + 합격예측 */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <p className="text-2xl font-bold text-yellow-500">🔥 {streak}일</p>
            <p className="text-xs text-gray-500 mt-1">연속 학습 스트릭</p>
          </div>
          <div className={`rounded-xl shadow p-4 text-center ${passPredict === null ? "bg-white" : passPredict >= 60 ? "bg-green-50" : "bg-red-50"}`}>
            <p className={`text-2xl font-bold ${passPredict === null ? "text-gray-400" : passPredict >= 60 ? "text-green-600" : "text-red-500"}`}>
              {passPredict === null ? "-" : `${passPredict}점`}
            </p>
            <p className="text-xs text-gray-500 mt-1">합격 예측 (최근 5회)</p>
            {passPredict !== null && (
              <p className={`text-xs font-semibold mt-1 ${passPredict >= 60 ? "text-green-600" : "text-red-500"}`}>
                {passPredict >= 60 ? "✅ 합격권!" : "❌ 더 노력하세요"}
              </p>
            )}
          </div>
        </div>

        {/* 전체 AI 분석 버튼 */}
        {wrongAnswers.length > 0 && (
          <div className="mb-6">
            <button onClick={getAiAnalysis} disabled={aiLoading}
              className="w-full py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 disabled:opacity-50">
              {aiLoading ? "🤖 AI 분석 중..." : "🤖 내 오답 전체 AI 분석 받기"}
            </button>
            {aiAnalysis && (
              <div className="mt-3 bg-purple-50 border border-purple-200 rounded-xl p-5 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {aiAnalysis}
              </div>
            )}
          </div>
        )}

        {/* 과목별 오답 현황 */}
        {Object.keys(stats.subjects).length > 0 && (
          <div className="bg-white rounded-xl shadow p-5 mb-6">
            <h2 className="font-bold text-gray-700 mb-3 text-sm">📚 과목별 오답 현황</h2>
            <div className="flex flex-col gap-2">
              {Object.entries(stats.subjects).sort((a: any, b: any) => b[1] - a[1]).map(([subject, count]: any) => (
                <div key={subject} className="flex items-center gap-3">
                  <span className="text-xs text-gray-600 w-40 truncate">{subject}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div className="bg-red-400 h-2 rounded-full" style={{ width: `${Math.min((count / stats.total) * 100, 100)}%` }} />
                  </div>
                  <span className="text-xs text-gray-500 w-6 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 탭 */}
        <div className="flex gap-2 mb-4">
          <button onClick={() => setTab("wrong")}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold ${tab === "wrong" ? "bg-blue-600 text-white" : "bg-white text-gray-600 border border-gray-200"}`}>
            ❌ 오답 목록 ({wrongAnswers.length})
          </button>
          <button onClick={() => setTab("bookmark")}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold ${tab === "bookmark" ? "bg-blue-600 text-white" : "bg-white text-gray-600 border border-gray-200"}`}>
            🔖 북마크 ({bookmarkedQs.length})
          </button>
        </div>

        {/* 오답 목록 */}
        {tab === "wrong" && (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <h2 className="font-bold text-gray-800">❌ 오답 목록</h2>
              {wrongAnswers.length > 0 && (
                <button onClick={() => router.push(`/cbt/start?exam=1&wrongOnly=true&ids=${wrongAnswers.map(w => w.question_id).join(",")}`)}
                  className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700">
                  오답 다시 풀기
                </button>
              )}
            </div>
            {wrongAnswers.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-4xl mb-3">🎉</p>
                <p className="text-gray-500 text-sm">오답이 없어요! CBT를 풀어보세요.</p>
                <button onClick={() => router.push("/cbt/past?exam=1")} className="mt-4 text-blue-600 text-sm hover:underline">문제 풀러 가기 →</button>
              </div>
            ) : (
              <div className="divide-y">
                {wrongAnswers.map((w, i) => {
                  const q = w.questions
                  const isOpen = reviewIndex === i
                  return (
                    <div key={w.id}>
                      <button onClick={() => setReviewIndex(isOpen ? null : i)} className="w-full text-left px-5 py-4 flex items-center gap-3 hover:bg-gray-50">
                        <span className="text-red-400 text-lg">❌</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-700 truncate">{q?.question_text}</p>
                          <div className="flex gap-3 mt-1 text-xs">
                            <span className="text-gray-400">{q?.year}년 {q?.round}회</span>
                            <span className="text-red-500">내 답: {w.my_answer}번</span>
                            <span className="text-blue-600 font-semibold">정답: {w.correct_answer}번</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400 text-xs">{isOpen ? "▲" : "▼"}</span>
                          <button onClick={e => { e.stopPropagation(); deleteWrong(w.id) }} className="text-xs text-gray-400 hover:text-red-500 px-1">🗑</button>
                        </div>
                      </button>
                      {isOpen && q && (
                        <div className="px-5 pb-4">
                          <div className="flex flex-col gap-2 mb-3">
                            {[1, 2, 3, 4].map(num => (
                              <div key={num} className={`px-4 py-3 rounded-xl border-2 text-sm
                                ${num === w.correct_answer ? "border-green-500 bg-green-50 text-green-700 font-semibold" : ""}
                                ${num === w.my_answer && num !== w.correct_answer ? "border-red-400 bg-red-50 text-red-600" : ""}
                                ${num !== w.correct_answer && num !== w.my_answer ? "border-gray-200 text-gray-600" : ""}`}>
                                {num === w.correct_answer && <span className="mr-1">✅</span>}
                                {num === w.my_answer && num !== w.correct_answer && <span className="mr-1">❌</span>}
                                {num}. {q[`option_${num}`]}
                              </div>
                            ))}
                          </div>
                          {q.explanation && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-gray-700 mb-3">
                              <p className="font-semibold text-yellow-700 mb-1">📖 해설</p>
                              <p>{q.explanation}</p>
                            </div>
                          )}
                          <button onClick={() => getSingleAi(i, q)} disabled={singleAiLoading === i}
                            className="w-full py-2 bg-purple-100 text-purple-700 rounded-xl text-sm font-semibold hover:bg-purple-200 disabled:opacity-50">
                            {singleAiLoading === i ? "🤖 생성 중..." : "🤖 AI 암기법 & 풀이 보기"}
                          </button>
                          {singleAi[i] && (
                            <div className="mt-2 bg-purple-50 border border-purple-200 rounded-xl p-4 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                              {singleAi[i]}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* 북마크 목록 */}
        {tab === "bookmark" && (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="px-5 py-4 border-b">
              <h2 className="font-bold text-gray-800">🔖 북마크 목록</h2>
            </div>
            {bookmarkedQs.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-4xl mb-3">🔖</p>
                <p className="text-gray-500 text-sm">북마크한 문제가 없어요!</p>
                <p className="text-gray-400 text-xs mt-1">문제 풀 때 📄 버튼을 눌러 북마크하세요</p>
              </div>
            ) : (
              <div className="divide-y">
                {bookmarkedQs.map((b, i) => {
                  const q = b.questions
                  const isOpen = reviewIndex === i + 1000
                  return (
                    <div key={b.id}>
                      <button onClick={() => setReviewIndex(isOpen ? null : i + 1000)} className="w-full text-left px-5 py-4 flex items-center gap-3 hover:bg-gray-50">
                        <span className="text-yellow-500 text-lg">🔖</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-700 truncate">{q?.question_text}</p>
                          <p className="text-xs text-gray-400 mt-1">{q?.subject} · {q?.year}년 {q?.round}회</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400 text-xs">{isOpen ? "▲" : "▼"}</span>
                          <button onClick={e => { e.stopPropagation(); deleteBookmark(b.question_id) }} className="text-xs text-gray-400 hover:text-red-500 px-1">🗑</button>
                        </div>
                      </button>
                      {isOpen && q && (
                        <div className="px-5 pb-4">
                          <p className="text-sm text-gray-800 font-medium mb-3">{q.question_text}</p>
                          <div className="flex flex-col gap-2 mb-3">
                            {[1, 2, 3, 4].map(num => (
                              <div key={num} className={`px-4 py-3 rounded-xl border-2 text-sm
                                ${num === q.answer ? "border-green-500 bg-green-50 text-green-700 font-semibold" : "border-gray-200 text-gray-600"}`}>
                                {num === q.answer && <span className="mr-1">✅</span>}
                                {num}. {q[`option_${num}`]}
                              </div>
                            ))}
                          </div>
                          {q.explanation && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-gray-700 mb-3">
                              <p className="font-semibold text-yellow-700 mb-1">📖 해설</p>
                              <p>{q.explanation}</p>
                            </div>
                          )}
                          <button onClick={() => getSingleAi(i + 1000, q)} disabled={singleAiLoading === i + 1000}
                            className="w-full py-2 bg-purple-100 text-purple-700 rounded-xl text-sm font-semibold hover:bg-purple-200 disabled:opacity-50">
                            {singleAiLoading === i + 1000 ? "🤖 생성 중..." : "🤖 AI 암기법 & 풀이 보기"}
                          </button>
                          {singleAi[i + 1000] && (
                            <div className="mt-2 bg-purple-50 border border-purple-200 rounded-xl p-4 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                              {singleAi[i + 1000]}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
