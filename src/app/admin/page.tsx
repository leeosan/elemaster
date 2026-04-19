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
  const [posts, setPosts] = useState<any[]>([])
  const [postsLoading, setPostsLoading] = useState(false)
  const [postSearch, setPostSearch] = useState("")
  const [aiSets, setAiSets] = useState<any[]>([])
  const [aiLoading, setAiLoading] = useState(false)
  const [aiGenerating, setAiGenerating] = useState(false)
  const [topicSubject, setTopicSubject] = useState("전기이론")
  const [topicData, setTopicData] = useState<any[]>([])
  const [topicLoading, setTopicLoading] = useState(false)
  const [selectedAiSet, setSelectedAiSet] = useState<number | null>(null)
  const [aiSetQuestions, setAiSetQuestions] = useState<any[]>([])
  const [aiSetLoading, setAiSetLoading] = useState(false)
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
    let allData: any[] = []
    let from = 0
    while (true) {
      const { data, error } = await supabase.from("questions")
        .select("id, question_number, question_text, year, round, subject, is_deprecated, importance")
        .order("year", { ascending: false }).order("round").order("question_number")
        .range(from, from + 999)
      if (error || !data || data.length === 0) break
      allData = [...allData, ...data]
      if (data.length < 1000) break
      from += 1000
    }
    setQuestions(allData)
    const uniqueYears = [...new Set(allData.map((q: any) => q.year))].sort((a, b) => b - a)
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

  const fetchPosts = async () => {
    setPostsLoading(true)
    const supabase = createClient()
    const { data } = await supabase.from("posts").select("*").order("created_at", { ascending: false })
    setPosts(data || [])
    setPostsLoading(false)
  }

  const fetchAiSets = async () => {
    setAiLoading(true)
    const supabase = createClient()
    const { data } = await supabase.from("ai_exams").select("set_number, question_id").order("set_number")
    const grouped = (data || []).reduce((acc: any, r: any) => {
      acc[r.set_number] = (acc[r.set_number] || 0) + 1
      return acc
    }, {})
    setAiSets(Object.entries(grouped).map(([set, cnt]) => ({ set: Number(set), cnt })))
    setAiLoading(false)
  }

  const fetchTopics = async (subject: string) => {
    setTopicLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from("top_frequent_topics")
      .select("id, subject, chapter, topic, frequency, importance, last_year")
      .eq("subject", subject)
      .order("frequency", { ascending: false })
      .limit(30)
    setTopicData(data || [])
    setTopicLoading(false)
  }

  const fetchAiSetQuestions = async (setNum: number) => {
    setAiSetLoading(true)
    setSelectedAiSet(setNum)
    const supabase = createClient()
    const { data: aiData } = await supabase.from("ai_exams")
      .select("question_id, question_order")
      .eq("set_number", setNum)
      .order("question_order")
    const ids = (aiData || []).map((r: any) => r.question_id)
    const { data: qData } = await supabase.from("questions")
      .select("id, question_number, question_text, year, round, subject, is_deprecated, importance")
      .in("id", ids)
    const ordered = (aiData || []).map((r: any) => (qData || []).find((q: any) => q.id === r.question_id)).filter(Boolean)
    setAiSetQuestions(ordered)
    setAiSetLoading(false)
  }

  const handleTabChange = (t: string) => {
    setTab(t)
    setSelectedAiSet(null)
    setAiSetQuestions([])
    if (t === "users") fetchUsers()
    if (t === "posts") fetchPosts()
    if (t === "ai") fetchAiSets()
    if (t === "topics") fetchTopics(topicSubject)
  }

  const updateField = async (id: number, field: string, value: any) => {
    setSaving(id)
    const supabase = createClient()
    await supabase.from("questions").update({ [field]: value }).eq("id", id)
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, [field]: value } : q))
    setAiSetQuestions(prev => prev.map(q => q.id === id ? { ...q, [field]: value } : q))
    setSaving(null)
  }

  const deleteUser = async (userId: string, email: string) => {
    if (!confirm(`${email} 회원을 삭제하시겠습니까?`)) return
    const res = await fetch("/api/admin/delete-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId })
    })
    if (res.ok) {
      setUsers(prev => prev.filter(u => u.id !== userId))
      alert("삭제 완료")
    } else {
      alert("삭제 실패")
    }
  }

  const deletePost = async (postId: number, title: string) => {
    if (!confirm("게시글을 삭제하시겠습니까?")) return
    const supabase = createClient()
    await supabase.from("posts").delete().eq("id", postId)
    setPosts(prev => prev.filter(p => p.id !== postId))
  }

  const deleteAiSet = async (setNum: number) => {
    if (!confirm(`AI 추천 문제 ${setNum}을 삭제하시겠습니까?`)) return
    const supabase = createClient()
    await supabase.from("ai_exams").delete().eq("set_number", setNum)
    setAiSets(prev => prev.filter(s => s.set !== setNum))
    if (selectedAiSet === setNum) { setSelectedAiSet(null); setAiSetQuestions([]) }
  }

  const regenerateAiSets = async () => {
    if (!confirm("모든 AI 추천 문제 세트를 재생성하시겠습니까?")) return
    setAiGenerating(true)
    const supabase = createClient()
    await supabase.from("ai_exams").delete().neq("id", 0)
    const subjects = [
      { name: "전기이론", cnt: 12 }, { name: "전기기기", cnt: 15 },
      { name: "전력전자", cnt: 7 }, { name: "전기설비", cnt: 11 },
      { name: "송배전공학", cnt: 5 }, { name: "디지털공학", cnt: 4 },
      { name: "공업경영", cnt: 6 },
    ]
    for (let setNum = 1; setNum <= 10; setNum++) {
      let order = 1
      for (const subj of subjects) {
        const { data } = await supabase.from("questions")
          .select("id").eq("subject", subj.name).limit(subj.cnt * 10)
        if (!data) continue
        const shuffled = data.sort(() => Math.random() - 0.5).slice(0, subj.cnt)
        for (const q of shuffled) {
          await supabase.from("ai_exams").insert({ set_number: setNum, question_id: q.id, question_order: order++ })
        }
      }
    }
    setAiGenerating(false)
    setSelectedAiSet(null)
    setAiSetQuestions([])
    fetchAiSets()
    alert("AI 추천 문제 10세트 재생성 완료!")
  }

  const filtered = questions.filter(q =>
    q.question_text?.includes(search) && (filterYear ? q.year == filterYear : true)
  )
  const filteredUsers = users.filter(u => u.email?.includes(userSearch) || u.name?.includes(userSearch))
  const filteredPosts = posts.filter(p => p.title?.includes(postSearch) || p.content?.includes(postSearch))

  const formatDate = (d: string) => {
    if (!d) return "-"
    return new Date(d).toLocaleString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
  }

  const QuestionTable = ({ data }: { data: any[] }) => (
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
          {data.map(q => (
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
  )

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
          <div className="flex gap-2 mb-3 overflow-x-auto">
            {[
              { key: "questions", label: "📝 문제 설정" },
              { key: "ai", label: "🤖 AI 추천 관리" },
              { key: "topics", label: "📊 빈출 분석" },
              { key: "users", label: "👥 회원 관리" },
              { key: "posts", label: "💬 게시판 관리" },
            ].map(t => (
              <button key={t.key} onClick={() => handleTabChange(t.key)}
                className={"px-4 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap " + (tab === t.key ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600")}>
                {t.label}
              </button>
            ))}
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
          {tab === "posts" && (
            <div className="flex gap-2">
              <input type="text" placeholder="제목 / 내용 검색..." value={postSearch} onChange={e => setPostSearch(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-64" />
              <span className="text-xs text-gray-400 self-center">총 {filteredPosts.length}개</span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">

        {/* 문제 설정 */}
        {tab === "questions" && <QuestionTable data={filtered} />}

        {/* AI 추천 관리 */}
        {tab === "ai" && (
          <div>
            {/* 세트 목록 */}
            <div className="bg-white rounded-xl shadow p-5 mb-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-bold text-gray-800">🤖 AI 추천 모의고사 세트</h2>
                  <p className="text-xs text-gray-400 mt-1">세트를 클릭하면 문제를 개별 관리할 수 있어요</p>
                </div>
                <button onClick={regenerateAiSets} disabled={aiGenerating}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 disabled:opacity-50">
                  {aiGenerating ? "⏳ 생성 중..." : "🔄 전체 재생성"}
                </button>
              </div>
              {aiLoading ? (
                <p className="text-center text-gray-400 text-sm py-8">불러오는 중...</p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {aiSets.map(s => (
                    <div key={s.set}
                      className={"border rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all " + (selectedAiSet === s.set ? "border-purple-400 bg-purple-50" : "border-gray-200 hover:border-purple-300")}
                      onClick={() => fetchAiSetQuestions(s.set)}>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">AI 추천 문제 {s.set}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{s.cnt}문제 {selectedAiSet === s.set ? "· 편집 중 ✏️" : ""}</p>
                      </div>
                      <button onClick={e => { e.stopPropagation(); deleteAiSet(s.set) }}
                        className="text-xs text-red-500 border border-red-200 rounded-lg px-2 py-1 hover:bg-red-50">
                        삭제
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 선택된 세트 문제 목록 */}
            {selectedAiSet && (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="font-bold text-gray-800">AI 추천 문제 {selectedAiSet} — 개별 설정</h3>
                  <button onClick={() => { setSelectedAiSet(null); setAiSetQuestions([]) }}
                    className="text-xs text-gray-400 hover:text-gray-600">✕ 닫기</button>
                </div>
                {aiSetLoading ? (
                  <div className="bg-white rounded-xl shadow p-8 text-center text-gray-400 text-sm">불러오는 중...</div>
                ) : (
                  <QuestionTable data={aiSetQuestions} />
                )}
              </div>
            )}
          </div>
        )}

        {/* 회원 관리 */}
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
                      <th className="px-4 py-3 text-center w-16">삭제</th>
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
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => deleteUser(u.id, u.email)}
                            className="text-xs text-red-500 hover:text-red-700 border border-red-200 rounded-lg px-2 py-1 hover:bg-red-50">삭제</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        )}

        {/* 빈출 분석 */}
        {tab === "topics" && (
          <div>
            <div className="bg-white rounded-xl shadow p-5 mb-4">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div>
                  <h2 className="font-bold text-gray-800">📊 과목별 빈출 TOP 30</h2>
                  <p className="text-xs text-gray-400 mt-1">AI가 분석한 기출문제 출제 빈도 순위입니다</p>
                </div>
                <select
                  value={topicSubject}
                  onChange={(e) => { setTopicSubject(e.target.value); fetchTopics(e.target.value) }}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium"
                >
                  <option value="전기이론">전기이론</option>
                  <option value="전기기기">전기기기</option>
                  <option value="전기설비">전기설비</option>
                  <option value="송배전공학">송배전공학</option>
                  <option value="디지털공학">디지털공학</option>
                  <option value="전력전자">전력전자</option>
                  <option value="공업경영">공업경영</option>
                </select>
              </div>

              {topicLoading ? (
                <p className="text-center text-gray-400 text-sm py-8">불러오는 중...</p>
              ) : topicData.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-8">데이터가 없습니다</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 text-gray-600 text-xs">
                    <tr>
                      <th className="px-3 py-2 text-center w-12">순위</th>
                      <th className="px-3 py-2 text-left w-28">대주제</th>
                      <th className="px-3 py-2 text-left">소주제</th>
                      <th className="px-3 py-2 text-center w-20">출제빈도</th>
                      <th className="px-3 py-2 text-center w-20">최근출제</th>
                      <th className="px-3 py-2 text-center w-16">중요도</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {topicData.map((t: any, i: number) => (
                      <tr key={t.id} className={"hover:bg-gray-50 " + (i < 5 ? "bg-yellow-50" : i < 10 ? "bg-blue-50" : "")}>
                        <td className="px-3 py-2 text-center font-bold">
                          {i < 3 ? (i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉") : (i + 1)}
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-600">{t.chapter}</td>
                        <td className="px-3 py-2 text-gray-800 font-medium">{t.topic}</td>
                        <td className="px-3 py-2 text-center">
                          <span className="inline-block bg-blue-100 text-blue-700 text-xs font-bold rounded-full px-3 py-1">
                            {t.frequency}회
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center text-xs text-gray-500">
                          {t.last_year ? t.last_year + "년" : "-"}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className="text-xs text-gray-600">{t.importance || "-"}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* 게시판 관리 */}
        {tab === "posts" && (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            {postsLoading ? (
              <div className="text-center py-12 text-gray-400 text-sm">불러오는 중...</div>
            ) : filteredPosts.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">게시글이 없습니다</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-100 text-gray-600 text-xs">
                  <tr>
                    <th className="px-4 py-3 text-center w-24">카테고리</th>
                    <th className="px-4 py-3 text-left">제목</th>
                    <th className="px-4 py-3 text-center w-20">작성자</th>
                    <th className="px-4 py-3 text-center w-24">작성일</th>
                    <th className="px-4 py-3 text-center w-16">삭제</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredPosts.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-center">
                        <span className={"text-xs px-2 py-0.5 rounded-full font-medium " + (p.category === "free" ? "bg-blue-100 text-blue-600" : p.category === "qna" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700")}>
                          {p.category === "free" ? "💬 자유" : p.category === "qna" ? "❓ 질문/답변" : "🏆 합격후기"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700 text-xs">{p.title?.length > 40 ? p.title.slice(0, 40) + "..." : p.title}</td>
                      <td className="px-4 py-3 text-center text-xs text-gray-500">{p.user_id?.slice(0, 6)}</td>
                      <td className="px-4 py-3 text-center text-xs text-gray-500">{formatDate(p.created_at)}</td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => deletePost(p.id, p.title)}
                          className="text-xs text-red-500 hover:text-red-700 border border-red-200 rounded-lg px-2 py-1 hover:bg-red-50">삭제</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
