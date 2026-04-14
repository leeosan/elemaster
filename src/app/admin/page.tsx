"use client"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { useRouter } from "next/navigation"

const ADMIN_EMAIL = "jaetech01@gmail.com"

export default function AdminPage() {
  const [tab, setTab] = useState("questions")
  const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [questions, setQuestions] = useState<any[]>([])
  const [saving, setSaving] = useState<any>(null)
  const [search, setSearch] = useState("")
  const [filterYear, setFilterYear] = useState("")
  const [years, setYears] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [userSearch, setUserSearch] = useState("")
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || user.email !== ADMIN_EMAIL) { router.replace("/"); return }
      setAuthorized(true)
      fetchQuestions()
    }
    checkAuth()
  }, [])

  const fetchQuestions = async () => {
    const supabase = createClient()
    const { data } = await supabase.from("questions")
      .select("id, question_number, question_text, year, round, subject, is_deprecated, importance")
      .order("year", { ascending: false }).order("round").order("question_number")
    setQuestions(data || [])
    const uniqueYears = [...new Set((data || []).map((q: any) => q.year))].sort((a, b) => b - a)
    setYears(uniqueYears)
    setLoading(false)
  }

  const fetchUsers = async () => {
    if (users.length > 0) return
    setUsersLoading(true)
    const supabase = createClient()
    const { data } = await supabase.from("admin_users_view").select("*").order("created_at", { ascending: false })
    setUsers(data || [])
    setUsersLoading(false)
  }

  const handleTabChange = (t: string) => {
    setTab(t)
    if (t === "users") fetchUsers()
  }

  const updateField = async (id: number, field: string, value: any) => {
    setSaving(id)
    const supabase = createClient()
    await supabase.from("questions").update({ [field]: value }).eq("id", id)
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, [field]: value } : q))
    setSaving(null)
  }

  const filtered = questions.filter(q =>
    q.question_text?.includes(search) && (filterYear ? q.year == filterYear : true)
  )

  const filteredUsers = users.filter(u =>
    u.email?.includes(userSearch) || u.name?.includes(userSearch)
  )

  const formatDate = (d: string) => {
    if (!d) return "-"
    return new Date(d).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" })
  }

  if (!authorized || loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400">확인 중...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm sticky top-0 z-10 px-4 py-3">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-lg font-bold text-gray-800 mb-3">🛠 관리자 대시보드</h1>
          <div className="flex gap-2 mb-3">
            <button onClick={() => handleTabChange("questions")}
              className={"px-4 py-1.5 rounded-lg text-sm font-semibold " + (tab === "questions" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600")}>
              📝 문제 설정
            </button>
            <button onClick={() => handleTabChange("users")}
              className={"px-4 py-1.5 rounded-lg text-sm font-semibold " + (tab === "users" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600")}>
              👥 회원 관리
            </button>
          </div>
          {tab === "questions" && (
            <div className="flex gap-2 flex-wrap">
              <input type="text" placeholder="문제 검색..." value={search} onChange={e => setSearch(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-64" />
              <select value={filterYear} onChange={e => setFilterYear(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
                <option value="">전체 연도</option>
                {years.map(y => <option key={y} value={y}>{y}년</option>)}
              </select>
              <span className="text-xs text-gray-400 self-center">{filtered.length}문제</span>
            </div>
          )}
          {tab === "users" && (
            <div className="flex gap-2">
              <input type="text" placeholder="이메일 / 이름 검색..." value={userSearch} onChange={e => setUserSearch(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-64" />
              <span className="text-xs text-gray-400 self-center">총 {filteredUsers.length}명</span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {tab === "questions" && (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-gray-600 text-xs">
                <tr>
                  <th className="px-4 py-3 text-left w-16">연도/회</th>
                  <th className="px-4 py-3 text-left">문제</th>
                  <th className="px-4 py-3 text-center w-24">출제기준변경</th>
                  <th className="px-4 py-3 text-center w-28">중요도</th>
                  <th className="px-4 py-3 text-center w-16">저장</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(q => (
                  <tr key={q.id} className={"hover:bg-gray-50 " + (q.is_deprecated ? "bg-red-50" : "")}>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{q.year}년<br/>{q.round}회</td>
                    <td className="px-4 py-3 text-gray-700">
                      <span className="text-gray-400 mr-1">{q.question_number}.</span>
                      {q.question_text?.length > 60 ? q.question_text.slice(0, 60) + "..." : q.question_text}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input type="checkbox" checked={!!q.is_deprecated}
                        onChange={e => updateField(q.id, "is_deprecated", e.target.checked)}
                        className="w-4 h-4 accent-red-500 cursor-pointer" />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <select value={q.importance || ""} onChange={e => updateField(q.id, "importance", e.target.value || null)}
                        className="border border-gray-200 rounded-lg px-2 py-1 text-xs w-full">
                        <option value="">없음</option>
                        <option value="필수">⭐ 필수</option>
                        <option value="중요">✨ 중요</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {saving === q.id ? <span className="text-xs text-blue-500">저장중...</span> : <span className="text-xs text-green-500">✓</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "users" && (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            {usersLoading ? (
              <div className="text-center py-12 text-gray-400 text-sm">불러오는 중...</div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-4 p-5 border-b">
                  <div className="bg-blue-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-blue-600">{users.length}</p>
                    <p className="text-xs text-gray-500 mt-1">전체 회원</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {users.filter(u => u.last_sign_in_at && (Date.now() - new Date(u.last_sign_in_at).getTime()) < 7*24*60*60*1000).length}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">최근 7일 활성</p>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-purple-600">
                      {users.filter(u => u.created_at && (Date.now() - new Date(u.created_at).getTime()) < 30*24*60*60*1000).length}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">이번달 신규</p>
                  </div>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 text-gray-600 text-xs">
                    <tr>
                      <th className="px-4 py-3 text-left">이메일</th>
                      <th className="px-4 py-3 text-left w-24">이름</th>
                      <th className="px-4 py-3 text-center w-24">가입경로</th>
                      <th className="px-4 py-3 text-center w-28">가입일</th>
                      <th className="px-4 py-3 text-center w-28">최근 로그인</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredUsers.map(u => (
                      <tr key={u.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-700 text-xs">{u.email}</td>
                        <td className="px-4 py-3 text-gray-600 text-xs">{u.name || "-"}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={"text-xs px-2 py-0.5 rounded-full font-medium " + (u.provider === "kakao" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-600")}>
                            {u.provider === "kakao" ? "카카오" : "이메일"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-xs text-gray-500">{formatDate(u.created_at)}</td>
                        <td className="px-4 py-3 text-center text-xs text-gray-500">{formatDate(u.last_sign_in_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}




