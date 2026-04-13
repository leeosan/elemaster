"use client"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function CBTPastPage() {
  const router = useRouter()
  const [exams, setExams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from("questions")
      .select("year, round")
      .eq("exam_type_id", 1)
      .order("year", { ascending: false })
      .order("round", { ascending: false })
      .then(({ data }) => {
        const unique = Array.from(
          new Map((data || []).map(q => [`${q.year}-${q.round}`, q])).values()
        )
        setExams(unique)
        setLoading(false)
      })
  }, [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400">불러오는 중...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">📚 과년도 문제</h1>
          <p className="text-gray-500 text-sm mt-1">전기기능장 과년도 기출문제</p>
        </div>
        <div className="grid gap-3">
          {exams.map((exam) => (
            <button
              key={`${exam.year}-${exam.round}`}
              onClick={() => router.push(`/cbt/start?exam=1&year=${exam.year}&round=${exam.round}`)}
              className="bg-white rounded-xl shadow p-4 text-left hover:shadow-md transition-all border border-gray-100 hover:border-blue-300"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-800">
                    전기기능장 {exam.year}년 {exam.round}회
                  </p>
                  <p className="text-sm text-gray-400 mt-0.5">60문제 · 60분</p>
                </div>
                <span className="text-blue-500 text-lg">→</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}