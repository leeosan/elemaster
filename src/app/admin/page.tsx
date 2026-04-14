"use client"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"

export default function AdminPage() {
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<number | null>(null)
  const [search, setSearch] = useState("")
  const [filterYear, setFilterYear] = useState("")
  const [years, setYears] = useState<number[]>([])

  useEffect(() => {
    fetchQuestions()
  }, [])

  const fetchQuestions = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("questions")
      .select("id, question_number, question_text, year, round, subject, is_deprecated, importance")
      .order("year", { ascending: false })
      .order("round")
      .order("question_number")
    setQuestions(data || [])
    const uniqueYears = [...new Set((data || []).map((q: any) => q.year))].sort((a, b) => b - a)
    setYears(uniqueYears as number[])
    setLoading(false)
  }

  const updateField = async (id: number, field: string, value: any) => {
    setSaving(id)
    const supabase = createClient()
    await supabase.from("questions").update({ [field]: value }).eq("id", id)
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, [field]: value } : q))
    setSaving(null)
  }

  const filtered = questions.filter(q => {
    const matchSearch = q.question_text?.includes(search)
    const matchYear = filterYear ? q.year == filterYear : true
    return matchSearch && matchYear
  })

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400">불러오는 중...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm sticky top-0 z-10 px-4 py-3">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-lg font-bold text-gray-800 mb-3">🛠 관리자 — 문제 설정</h1>
          <div className="flex gap-2 flex-wrap">
            <input
              type="text"
              placeholder="문제 검색..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-64"
            />
            <select
              value={filterYear}
              onChange={e => setFilterYear(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
            >
              <option value="">전체 연도</option>
              {years.map(y => <option key={y} value={y}>{y}년</option>)}
            </select>
            <span className="text-xs text-gray-400 self-center">{filtered.length}문제</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-gray-600 text-xs">
              <tr>
                <th className="px-4 py-3 text-left w-16">연도/회</th>
                <th className="px-4 py-3 text-left">문제</th>
                <th className="px-4 py-3 text-center w-24">출제기준<br/>변경</th>
                <th className="px-4 py-3 text-center w-28">중요도</th>
                <th className="px-4 py-3 text-center w-16">저장</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(q => (
                <tr key={q.id} className={`hover:bg-gray-50 ${q.is_deprecated ? "bg-red-50" : ""}`}>
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                    {q.year}년<br/>{q.round}회
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    <span className="text-gray-400 mr-1">{q.question_number}.</span>
                    {q.question_text?.length > 60 ? q.question_text.slice(0, 60) + "..." : q.question_text}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={!!q.is_deprecated}
                      onChange={e => updateField(q.id, "is_deprecated", e.target.checked)}
                      className="w-4 h-4 accent-red-500 cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <select
                      value={q.importance || ""}
                      onChange={e => updateField(q.id, "importance", e.target.value || null)}
                      className="border border-gray-200 rounded-lg px-2 py-1 text-xs w-full"
                    >
                      <option value="">없음</option>
                      <option value="필수">⭐ 필수</option>
                      <option value="중요">✨ 중요</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {saving === q.id
                      ? <span className="text-xs text-blue-500">저장중...</span>
                      : <span className="text-xs text-green-500">✓</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
