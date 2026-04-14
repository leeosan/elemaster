"use client"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function MyPage() {
  const [user, setUser] = useState<any>(null)
  const [wrongAnswers, setWrongAnswers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewIndex, setReviewIndex] = useState<number | null>(null)
  const [stats, setStats] = useState({ total: 0, thisWeek: 0, subjects: {} as any })
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace("/login"); return }
      setUser(user)

      const { data } = await supabase
        .from("wrong_answers")
        .select("*, questions(*)")
        .eq("user_id", user.id)
        .order("solved_at", { ascending: false })

      setWrongAnswers(data || [])

      const thisWeek = (data || []).filter(w => {
        const diff = Date.now() - new Date(w.solved_at).getTime()
        return diff < 7 * 24 * 60 * 60 * 1000
      }).length

      const subjects: any = {}
      ;(data || []).forEach(w => {
        const s = w.questions?.subject || "기타"
        subjects[s] = (subjects[s] || 0) + 1
      })

      setStats({ total: (data || []).length, thisWeek, subjects })
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

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400">불러오는 중...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">📊 나의 학습</h1>

        {/* 통계 카드 */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <p className="text-2xl font-bold text-red-500">{stats.total}</p>
            <p className="text-xs text-gray-500 mt-1">전체 오답</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <p className="text-2xl font-bold text-orange-500">{stats.thisWeek}</p>
            <p className="text-xs text-gray-500 mt-1">이번주 오답</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <p className="text-2xl font-bold text-blue-500">{Object.keys(stats.subjects).length}</p>
            <p className="text-xs text-gray-500 mt-1">취약 과목수</p>
          </div>
        </div>

        {/* 과목별 오답 현황 */}
        {Object.keys(stats.subjects).length > 0 && (
          <div className="bg-white rounded-xl shadow p-5 mb-6">
            <h2 className="font-bold text-gray-700 mb-3 text-sm">📚 과목별 오답 현황</h2>
            <div className="flex flex-col gap-2">
              {Object.entries(stats.subjects)
                .sort((a: any, b: any) => b[1] - a[1])
                .map(([subject, count]: any) => (
                  <div key={subject} className="flex items-center gap-3">
                    <span className="text-xs text-gray-600 w-40 truncate">{subject}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-red-400 h-2 rounded-full"
                        style={{ width: `${Math.min((count / stats.total) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-6 text-right">{count}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* 오답 목록 */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <h2 className="font-bold text-gray-800">❌ 오답 목록</h2>
            {wrongAnswers.length > 0 && (
              <button
                onClick={() => router.push(`/cbt/start?exam=1&wrongOnly=true&ids=${wrongAnswers.map(w => w.question_id).join(",")}`)}
                className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700"
              >
                오답 다시 풀기
              </button>
            )}
          </div>

          {wrongAnswers.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">🎉</p>
              <p className="text-gray-500 text-sm">오답이 없어요! CBT를 풀어보세요.</p>
              <button onClick={() => router.push("/cbt/past?exam=1")} className="mt-4 text-blue-600 text-sm hover:underline">
                문제 풀러 가기 →
              </button>
            </div>
          ) : (
            <div className="divide-y">
              {wrongAnswers.map((w, i) => {
                const q = w.questions
                const isOpen = reviewIndex === i
                return (
                  <div key={w.id}>
                    <button
                      onClick={() => setReviewIndex(isOpen ? null : i)}
                      className="w-full text-left px-5 py-4 flex items-center gap-3 hover:bg-gray-50"
                    >
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
                        <button
                          onClick={e => { e.stopPropagation(); deleteWrong(w.id) }}
                          className="text-xs text-gray-400 hover:text-red-500 px-1"
                        >
                          🗑
                        </button>
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
                          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-gray-700">
                            <p className="font-semibold text-yellow-700 mb-1">📖 해설</p>
                            <p>{q.explanation}</p>
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
      </div>
    </div>
  )
}
