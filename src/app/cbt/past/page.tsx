"use client"
import { useState, useEffect, Suspense } from "react"
import { createClient } from "@/lib/supabase"
import { useRouter, useSearchParams } from "next/navigation"

function CBTPastInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const examTypeId = searchParams.get("exam") || "1"
  const [exams, setExams] = useState<any[]>([])
  const [aiSets, setAiSets] = useState<number[]>([])
  const [authChecked, setAuthChecked] = useState(false)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"past" | "ai">("past")

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace("/login"); return }
      setAuthChecked(true)
    }
    checkAuth()
  }, [])

  useEffect(() => {
    if (!authChecked) return
    async function fetchAll() {
      const supabase = createClient()

      // 과년도 기출문제
      let allData: any[] = []
      let from = 0
      const pageSize = 1000
      while (true) {
        const { data, error } = await supabase
          .from("questions")
          .select("year, round")
          .eq("exam_type_id", examTypeId).lte("year", 2018)
          .order("round", { ascending: false })
          .range(from, from + pageSize - 1)
        if (error || !data || data.length === 0) break
        allData = [...allData, ...data]
        if (data.length < pageSize) break
        from += pageSize
      }
      const unique = Array.from(
        new Map(allData.map((q: any) => [`${q.year}-${q.round}`, q])).values()
      )
      setExams(unique)

      // AI 추천 문제 세트 목록
      const { data: aiData } = await supabase
        .from("ai_exams")
        .select("set_number")
        .order("set_number")
      const sets = [...new Set((aiData || []).map((r: any) => r.set_number))]
      setAiSets(sets)

      setLoading(false)
    }
    fetchAll()
  }, [examTypeId, authChecked])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400">불러오는 중...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <button onClick={() => router.back()} className="text-gray-500 text-sm mb-3 hover:text-gray-700">← 뒤로</button>
          <h1 className="text-2xl font-bold text-gray-800">필기 CBT</h1>
        </div>

        {/* 탭 */}
        <div className="flex gap-2 mb-5">
          <button
            onClick={() => setTab("past")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${tab === "past" ? "bg-blue-600 text-white" : "bg-white text-gray-600 border border-gray-200"}`}
          >
            📝 과년도 기출문제
          </button>
          <button
            onClick={() => setTab("ai")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${tab === "ai" ? "bg-purple-600 text-white" : "bg-white text-gray-600 border border-gray-200"}`}
          >
            🤖 AI 추천 문제
          </button>
          <button
            onClick={() => router.push("/cbt/popular")}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all bg-white text-gray-600 border border-gray-200"
          >
            📊 최다출제
          </button>
        </div>

        {/* 과년도 기출문제 */}
        {tab === "past" && (
          <div>
            <p className="text-gray-500 text-sm mb-3">전기기능장 과년도 기출문제 ({exams.length}회차)</p>
            <div className="grid gap-3">
              {exams.map((exam) => (
                <button
                  key={`${exam.year}-${exam.round}`}
                  onClick={() => router.push(`/cbt/start?exam=${examTypeId}&year=${exam.year}&round=${exam.round}`)}
                  className="bg-white rounded-xl shadow p-4 text-left hover:shadow-md transition-all border border-gray-100 hover:border-blue-300"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-800">
                        전기기능장 {exam.year}년 제{exam.round}회
                      </p>
                      <p className="text-sm text-gray-400 mt-0.5">60문제 · 60분</p>
                    </div>
                    <span className="text-blue-500 text-lg">→</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* AI 추천 문제 */}
        {tab === "ai" && (
          <div>
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-4">
              <p className="text-purple-700 text-sm font-semibold mb-1">🤖 AI 추천 모의고사란?</p>
              <p className="text-purple-600 text-xs leading-relaxed">
                2019~2022년 최신 기출 문제를 실제 출제 비중에 맞게 선별한 모의고사예요.<br/>
                전기이론 12문제 · 전기기기 15문제 · 전력전자 7문제 · 전기설비 11문제 · 송배전공학 5문제 · 디지털공학 4문제 · 공업경영 6문제
              </p>
            </div>
            <p className="text-gray-500 text-sm mb-3">총 {aiSets.length}세트 · 각 60문제 · 60분</p>
            <div className="grid gap-3">
              {aiSets.map((setNum) => (
                <button
                  key={setNum}
                  onClick={() => router.push(`/cbt/start?exam=${examTypeId}&aiset=${setNum}`)}
                  className="bg-white rounded-xl shadow p-4 text-left hover:shadow-md transition-all border border-gray-100 hover:border-purple-300"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-800">AI 추천 문제 {setNum}</p>
                      <p className="text-sm text-gray-400 mt-0.5">60문제 · 60분 · 2019~2022년 최신 기출</p>
                    </div>
                    <span className="text-purple-500 text-lg">→</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function CBTPastPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">로딩 중...</p></div>}>
      <CBTPastInner />
    </Suspense>
  )
}
