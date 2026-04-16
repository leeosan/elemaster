"use client"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import Link from "next/link"

export default function CBTPage() {
  const [examTypes, setExamTypes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.from("exam_types").select("*").eq("is_active", true).then(({ data }) => {
      setExamTypes(data || [])
      setLoading(false)
    })
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">📝 필기 CBT</h1>
        <p className="text-gray-500 text-sm mb-8">시험 종목을 선택하세요</p>

        {loading ? (
          <p className="text-gray-400 text-center py-20">불러오는 중...</p>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {examTypes.map(exam => (
              <div key={exam.id} className="bg-white rounded-xl shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-800">{exam.name}</h2>
                  <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">필기</span>
                </div>
                <p className="text-gray-500 text-sm mb-4">{exam.description}</p>
                <div className="flex gap-2">
                  <Link
                    href={`/cbt/start?exam=${exam.id}&mode=random`}
                    className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold text-center hover:bg-blue-700"
                  >
                    랜덤 모의고사
                  </Link>
                  <Link
                    href={`/cbt/past?exam=${exam.id}`}
                    className="flex-1 py-2 bg-white border border-blue-600 text-blue-600 rounded-lg text-sm font-semibold text-center hover:bg-blue-50"
                  >
                    과년도 풀기
                  </Link>
                  <Link
                    href="/cbt/popular"
                    className="flex-1 py-2 bg-white border border-green-600 text-green-600 rounded-lg text-sm font-semibold text-center hover:bg-green-50"
                  >
                    📊 최다출제
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}