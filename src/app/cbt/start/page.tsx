"use client"
import { useState, useEffect, Suspense } from "react"
import { createClient } from "@/lib/supabase"
import { useSearchParams, useRouter } from "next/navigation"

const ADMIN_EMAIL = "jaetech01@gmail.com"

// 신고 유형 정의
const REPORT_TYPES = [
  { value: "wrong_answer", label: "❌ 정답 오류", desc: "표시된 정답이 틀렸어요" },
  { value: "wrong_content", label: "📝 문제/보기 오류", desc: "문제 본문이나 보기에 오타·오류가 있어요" },
  { value: "wrong_image", label: "🖼 이미지 오류", desc: "이미지가 잘못됐거나 안 보여요" },
  { value: "etc", label: "💬 기타", desc: "그 외 문제점" },
]

function CBTStartInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const examId = searchParams.get("exam") || "1"
  const year = searchParams.get("year")
  const round = searchParams.get("round")
  const aiset = searchParams.get("aiset")

  const [questions, setQuestions] = useState<any[]>([])
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<{[key: number]: number}>({})
  const [timeLeft, setTimeLeft] = useState(60 * 60)
  const [loading, setLoading] = useState(true)
  const [finished, setFinished] = useState(false)
  const [showExplanation, setShowExplanation] = useState(false)
  const [reviewIndex, setReviewIndex] = useState<number | null>(null)
  const [aiAnalysis, setAiAnalysis] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [bookmarks, setBookmarks] = useState<Set<number>>(new Set())
  const [showNotes, setShowNotes] = useState(false)
  const [notes, setNotes] = useState<any[]>([])
  const [myNote, setMyNote] = useState("")
  const [notesLoading, setNotesLoading] = useState(false)
  const [noteSaving, setNoteSaving] = useState(false)
  const [likedNotes, setLikedNotes] = useState<Set<number>>(new Set())
  const [singleAi, setSingleAi] = useState<{[key: number]: string}>({})
  const [singleAiLoading, setSingleAiLoading] = useState<number | null>(null)

  // 문제 네비게이션 상태
  const [showNav, setShowNav] = useState(false)
  const [navSearch, setNavSearch] = useState("")

  // ✅ 학습 모드: "exam"(시험 모드) | "instant"(정답 모드 — 보기 클릭 즉시 채점)
  const [mode, setMode] = useState<"exam" | "instant">("exam")

  // 🚨 오류 신고 상태 (reportTarget = 신고 대상 문제 객체, 풀이 중/제출 후 공용 모달)
  const [reportTarget, setReportTarget] = useState<any>(null)
  const [reportType, setReportType] = useState("wrong_answer")
  const [reportDesc, setReportDesc] = useState("")
  const [reportSending, setReportSending] = useState(false)
  const [reportedIds, setReportedIds] = useState<Set<number>>(new Set())

  // 모드 설정 불러오기 (localStorage)
  useEffect(() => {
    const saved = localStorage.getItem("cbt_mode")
    if (saved === "instant" || saved === "exam") setMode(saved)
  }, [])

  const changeMode = (m: "exam" | "instant") => {
    setMode(m)
    localStorage.setItem("cbt_mode", m)
  }

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.replace("/login"); return }
      // aiset 파라미터는 관리자 전용
      if (aiset && data.user.email !== ADMIN_EMAIL) {
        alert("AI 추천 모의고사는 관리자 전용입니다.")
        router.replace("/cbt/past")
        return
      }
      setUser(data.user)
      const { data: bData } = await supabase.from("bookmarks").select("question_id").eq("user_id", data.user.id)
      setBookmarks(new Set((bData || []).map((b: any) => b.question_id)))
    })
  }, [])

  useEffect(() => {
    const supabase = createClient()
    const load = async () => {
      if (aiset) {
        const { data: aiData } = await supabase.from("ai_exams").select("question_id, question_order").eq("set_number", aiset).order("question_order")
        const ids = (aiData || []).map((r: any) => r.question_id)
        const { data } = await supabase.from("questions_with_meta").select("*").in("id", ids).eq("is_deprecated", false)
        const ordered = (aiData || []).map((r: any) => (data || []).find((q: any) => q.id === r.question_id)).filter(Boolean)
        setQuestions(ordered)
        setLoading(false)
      } else {
        let query = supabase.from("questions_with_meta").select("*").eq("exam_type_id", examId).eq("is_deprecated", false)
        if (year && round) query = query.eq("year", year).eq("round", round)
        query.limit(60).then(({ data }) => {
          const sorted = year && round
            ? (data || []).sort((a: any, b: any) => a.question_number - b.question_number)
            : (data || []).sort(() => Math.random() - 0.5)
          setQuestions(sorted)
          setLoading(false)
        })
      }
    }
    load()
  }, [examId, year, round, aiset])

  // 타이머: 정답 모드에서는 시간 제한 없음
  useEffect(() => {
    if (finished || loading || mode === "instant") return
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timer); setFinished(true); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [finished, loading, mode])

  const fetchNotes = async (questionId: number) => {
    setNotesLoading(true)
    const supabase = createClient()
    const { data } = await supabase.from("question_notes").select("*").eq("question_id", questionId).order("like_count", { ascending: false })
    setNotes(data || [])
    if (user) {
      const mine = (data || []).find((n: any) => n.user_id === user.id)
      setMyNote(mine?.content || "")
      const { data: likes } = await supabase.from("note_likes").select("note_id").eq("user_id", user.id)
      setLikedNotes(new Set((likes || []).map((l: any) => l.note_id)))
    }
    setNotesLoading(false)
  }

  const handleToggleNotes = () => {
    if (!showNotes && questions[current]) fetchNotes(questions[current].id)
    setShowNotes(v => !v)
  }

  const saveNote = async () => {
    if (!user || !myNote.trim()) return
    setNoteSaving(true)
    const supabase = createClient()
    await supabase.from("question_notes").upsert({
      user_id: user.id, question_id: questions[current].id,
      content: myNote.trim(), updated_at: new Date().toISOString()
    }, { onConflict: "user_id,question_id" })
    await fetchNotes(questions[current].id)
    setNoteSaving(false)
  }

  const toggleLike = async (noteId: number) => {
    if (!user) return
    const supabase = createClient()
    if (likedNotes.has(noteId)) {
      await supabase.from("note_likes").delete().eq("user_id", user.id).eq("note_id", noteId)
      setLikedNotes(prev => { const s = new Set(prev); s.delete(noteId); return s })
      setNotes(prev => prev.map(n => n.id === noteId ? { ...n, like_count: n.like_count - 1 } : n))
    } else {
      await supabase.from("note_likes").insert({ user_id: user.id, note_id: noteId })
      setLikedNotes(prev => new Set(prev).add(noteId))
      setNotes(prev => prev.map(n => n.id === noteId ? { ...n, like_count: n.like_count + 1 } : n))
    }
  }

  const toggleBookmark = async (questionId: number) => {
    if (!user) return
    const supabase = createClient()
    if (bookmarks.has(questionId)) {
      await supabase.from("bookmarks").delete().eq("user_id", user.id).eq("question_id", questionId)
      setBookmarks(prev => { const s = new Set(prev); s.delete(questionId); return s })
    } else {
      await supabase.from("bookmarks").insert({ user_id: user.id, question_id: questionId })
      setBookmarks(prev => new Set(prev).add(questionId))
    }
  }

  // 🚨 오류 신고 제출 (풀이 중 / 제출 후 공용)
  const submitReport = async () => {
    if (!user) { alert("로그인이 필요합니다."); return }
    if (!reportTarget) return
    setReportSending(true)
    const supabase = createClient()
    const { error } = await supabase.from("question_reports").insert({
      question_id: reportTarget.id,
      report_type: reportType,
      description: reportDesc.trim() || null,
      reporter_email: user.email,
    })
    setReportSending(false)
    if (error) {
      alert("신고 접수에 실패했습니다. 잠시 후 다시 시도해주세요.")
      return
    }
    setReportedIds(prev => new Set(prev).add(reportTarget.id))
    setReportTarget(null)
    setReportDesc("")
    setReportType("wrong_answer")
    alert("신고가 접수되었습니다. 검토 후 빠르게 반영하겠습니다. 감사합니다!")
  }

  // 🚨 신고 모달 (풀이 중 / 제출 후 화면 양쪽에서 렌더링)
  const renderReportModal = () => {
    if (!reportTarget) return null
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setReportTarget(null)}>
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-5 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-red-700">🚨 문제 오류 신고</p>
            <button onClick={() => setReportTarget(null)} className="text-gray-400 text-2xl leading-none">×</button>
          </div>
          <div className="bg-gray-50 rounded-lg px-3 py-2 mb-3">
            <p className="text-xs text-gray-400">{reportTarget.year}년 {reportTarget.round}회 · {reportTarget.question_number}번</p>
            <p className="text-xs text-gray-600 mt-0.5">{reportTarget.question_text?.length > 60 ? reportTarget.question_text.slice(0, 60) + "..." : reportTarget.question_text}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {REPORT_TYPES.map(rt => (
              <button key={rt.value} onClick={() => setReportType(rt.value)}
                className={`text-left px-3 py-2 rounded-lg border text-xs transition-all ${reportType === rt.value
                  ? "border-red-400 bg-red-50 font-semibold text-red-700"
                  : "border-gray-200 bg-white text-gray-600 hover:border-red-300"}`}>
                <span className="block">{rt.label}</span>
                <span className="block text-gray-400 mt-0.5">{rt.desc}</span>
              </button>
            ))}
          </div>
          <textarea value={reportDesc} onChange={e => setReportDesc(e.target.value)}
            placeholder={reportType === "wrong_answer" ? "예: 정답이 3번이 아니라 2번입니다. 계산하면 1/√2가 나옵니다." : "오류 내용을 자세히 적어주시면 빠르게 수정할 수 있어요."}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-red-400 mb-3" rows={3} />
          <div className="flex gap-2">
            <button onClick={submitReport} disabled={reportSending}
              className="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 disabled:opacity-50">
              {reportSending ? "접수 중..." : "신고 접수"}
            </button>
            <button onClick={() => setReportTarget(null)}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-500 rounded-lg text-sm hover:bg-gray-50">취소</button>
          </div>
        </div>
      </div>
    )
  }

  const getSingleAi = async (index: number, question: any) => {
    setSingleAiLoading(index)
    // ① 관리자가 등록/편집한 풀이(ai_explanations)가 있으면 우선 표시
    try {
      const supabase = createClient()
      const { data: saved } = await supabase.from("ai_explanations")
        .select("content").eq("question_id", question.id).maybeSingle()
      if (saved?.content) {
        setSingleAi(prev => ({ ...prev, [index]: saved.content }))
        setSingleAiLoading(null)
        return
      }
    } catch { /* 저장 풀이 조회 실패 시 AI 생성으로 진행 */ }
    // ② 저장된 풀이가 없으면 AI 생성
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

  const getAiAnalysis = async () => {
    setAiLoading(true)
    setAiAnalysis("")
    try {
      const res = await fetch("/api/ai-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions, answers })
      })
      const data = await res.json()
      setAiAnalysis(data.result || "분석 실패")
    } catch { setAiAnalysis("AI 분석 서비스가 일시적으로 중단됐습니다. 잠시 후 다시 시도해주세요.") }
    setAiLoading(false)
  }

  const saveWrongAnswers = async () => {
    if (!user) return
    const supabase = createClient()
    const wrongs = questions.map((q, i) => ({ q, myAnswer: answers[i] })).filter(({ q, myAnswer }) => myAnswer !== q.answer)
    for (const { q, myAnswer } of wrongs) {
      await supabase.from("wrong_answers").upsert({
        user_id: user.id, question_id: q.id,
        my_answer: myAnswer || null, correct_answer: q.answer,
        solved_at: new Date().toISOString()
      }, { onConflict: "user_id,question_id" })
    }
    const { correct } = getScore()
    await supabase.from("study_logs").upsert({
      user_id: user.id,
      studied_at: new Date().toISOString().split("T")[0],
      score: Math.round((correct / questions.length) * 100),
      total: questions.length
    }, { onConflict: "user_id,studied_at" })
  }

  const getScore = () => {
    let correct = 0
    questions.forEach((q, i) => { if (answers[i] === q.answer) correct++ })
    return { correct, total: questions.length, score: Math.round((correct / questions.length) * 100) }
  }

  const moveTo = (idx: number) => {
    setCurrent(idx)
    setShowExplanation(false)
    setShowNotes(false)
    setReportTarget(null)
    setNotes([])
    setMyNote("")
  }

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, "0")
    const s = (sec % 60).toString().padStart(2, "0")
    return `${m}:${s}`
  }

  const selectAnswer = (num: number) => {
    if (finished) return
    // 정답 모드: 이미 답을 선택한 문제는 변경 불가 (정답이 노출됐으므로)
    if (mode === "instant" && answers[current] !== undefined) return
    setAnswers(prev => ({ ...prev, [current]: num }))
    // 정답 모드: 선택 즉시 해설 자동 펼침
    setShowExplanation(mode === "instant")
  }

  // 번호 검색 → 해당 문제로 이동
  const handleNavSearch = () => {
    const n = parseInt(navSearch)
    if (!isNaN(n) && n >= 1 && n <= questions.length) {
      moveTo(n - 1)
      setShowNav(false)
      setNavSearch("")
    }
  }

  // 문제 번호 네비게이션 사이드바 (데스크톱/모바일 공용)
  const renderNavigationPanel = () => {
    const answeredCount = Object.keys(answers).length
    const progress = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0
    const groups: number[][] = []
    for (let i = 0; i < questions.length; i += 10) {
      groups.push(Array.from({length: Math.min(10, questions.length - i)}, (_, j) => i + j))
    }
    return (
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-800 text-sm">📋 문제 번호</h3>
          <button onClick={() => setShowNav(false)} className="lg:hidden text-gray-400 text-2xl leading-none">×</button>
        </div>

        <div className="flex gap-2 mb-3">
          <input
            type="number"
            min="1"
            max={questions.length}
            value={navSearch}
            onChange={e => setNavSearch(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleNavSearch()}
            placeholder={`1-${questions.length}`}
            className="flex-1 min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
          />
          <button onClick={handleNavSearch}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 flex-shrink-0">
            이동
          </button>
        </div>

        <div className="text-xs text-gray-500 mb-1.5">풀이 진행: {answeredCount}/{questions.length} ({progress}%)</div>
        <div className="bg-gray-200 rounded-full h-1.5 mb-4">
          <div className="bg-blue-600 h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>

        <div className="flex flex-wrap gap-x-3 gap-y-1 mb-3 text-xs text-gray-500">
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-600 rounded"></span>현재</span>
          {mode === "instant" ? (
            <>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-100 border border-green-400 rounded"></span>정답</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-100 border border-red-400 rounded"></span>오답</span>
            </>
          ) : (
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-100 border border-green-400 rounded"></span>완료</span>
          )}
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-gray-100 border border-gray-300 rounded"></span>미답</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-white border-2 border-yellow-400 rounded"></span>북마크</span>
        </div>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {groups.map((grp, gIdx) => {
            const start = gIdx * 10 + 1
            const end = Math.min(start + 9, questions.length)
            return (
              <div key={gIdx}>
                <div className="text-xs text-gray-400 font-semibold mb-1.5">{start}-{end}</div>
                <div className="grid grid-cols-5 gap-1.5">
                  {grp.map(idx => {
                    const isAnswered = answers[idx] !== undefined
                    const isCurrent = idx === current
                    const isBookmarked = questions[idx] && bookmarks.has(questions[idx].id)
                    // 정답 모드: 정답/오답 색상 구분 표시
                    const isCorrectAns = isAnswered && questions[idx] && answers[idx] === questions[idx].answer
                    let cls = "aspect-square rounded-lg text-xs font-bold border transition-all flex items-center justify-center "
                    if (isCurrent) cls += "bg-blue-600 text-white border-blue-600 ring-2 ring-blue-300 "
                    else if (isAnswered && mode === "instant") {
                      cls += isCorrectAns
                        ? "bg-green-100 text-green-700 border-green-300 hover:bg-green-200 "
                        : "bg-red-100 text-red-600 border-red-300 hover:bg-red-200 "
                    }
                    else if (isAnswered) cls += "bg-green-100 text-green-700 border-green-300 hover:bg-green-200 "
                    else cls += "bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200 "
                    if (isBookmarked && !isCurrent) cls += "ring-2 ring-yellow-400 "
                    return (
                      <button
                        key={idx}
                        onClick={() => { moveTo(idx); setShowNav(false) }}
                        className={cls}
                      >
                        {idx + 1}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">문제 불러오는 중...</p></div>

  if (questions.length === 0) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-500 mb-4">등록된 문제가 없습니다</p>
        <button onClick={() => router.back()} className="text-blue-600 hover:underline">← 돌아가기</button>
      </div>
    </div>
  )

  if (finished) {
    const { correct, total, score } = getScore()
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-10">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow p-8 text-center mb-6">
            <div className="text-5xl mb-4">{score >= 60 ? "🎉" : "😅"}</div>
            <h1 className="text-2xl font-bold mb-2">{score >= 60 ? "합격!" : "불합격"}</h1>
            <p className="text-gray-500 mb-6">합격 기준: 60점 이상</p>
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <p className="text-4xl font-bold text-blue-600 mb-2">{score}점</p>
              <p className="text-gray-500">{total}문제 중 {correct}문제 정답</p>
            </div>
            <button onClick={getAiAnalysis} disabled={aiLoading}
              className="w-full py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 disabled:opacity-50 mb-3">
              {aiLoading ? "🤖 AI 분석 중..." : "🤖 AI 학습 분석 받기"}
            </button>
            {aiAnalysis && (
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-5 mb-4 text-left text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {aiAnalysis}
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => { setFinished(false); setAnswers({}); setCurrent(0); setTimeLeft(3600); setShowExplanation(false); setReviewIndex(null); setAiAnalysis("") }}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">다시 풀기</button>
              <button onClick={() => router.back()} className="flex-1 py-3 bg-white border border-gray-300 text-gray-600 rounded-lg font-semibold hover:bg-gray-50">목록으로</button>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow overflow-hidden">
            <div className="px-6 py-4 border-b"><h2 className="font-bold text-gray-800">📋 문제별 정답 확인</h2></div>
            <div className="divide-y">
              {questions.map((q, i) => {
                const myAnswer = answers[i]
                const isCorrect = myAnswer === q.answer
                const isOpen = reviewIndex === i
                return (
                  <div key={i} className={isCorrect ? "bg-white" : "bg-red-50"}>
                    <button onClick={() => setReviewIndex(isOpen ? null : i)} className="w-full text-left px-6 py-4 flex items-center gap-3">
                      <span className={`text-lg ${isCorrect ? "text-green-500" : "text-red-500"}`}>{isCorrect ? "⭕" : "❌"}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 truncate"><span className="text-gray-400 mr-1">{i + 1}.</span>{q.question_text}</p>
                        <div className="flex gap-3 mt-1 text-xs">
                          <span className={myAnswer ? (isCorrect ? "text-green-600" : "text-red-500") : "text-gray-400"}>내 답: {myAnswer ? `${myAnswer}번` : "미응답"}</span>
                          {!isCorrect && <span className="text-blue-600 font-semibold">정답: {q.answer}번</span>}
                        </div>
                      </div>
                      <span className="text-gray-400 text-xs">{isOpen ? "▲" : "▼"}</span>
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-4">
                        <div className="flex flex-col gap-2 mb-3">
                          {[1, 2, 3, 4].map(num => (
                            <div key={num} className={`px-4 py-3 rounded-xl border-2 text-sm
                              ${num === q.answer ? "border-green-500 bg-green-50 text-green-700 font-semibold" : ""}
                              ${num === myAnswer && num !== q.answer ? "border-red-400 bg-red-50 text-red-600" : ""}
                              ${num !== q.answer && num !== myAnswer ? "border-gray-200 text-gray-600" : ""}`}>
                              {num === q.answer && <span className="mr-1">✅</span>}
                              {num === myAnswer && num !== q.answer && <span className="mr-1">❌</span>}
                              {num}. <RenderOption text={q[`option_${num}`]} />
                            </div>
                          ))}
                        </div>
                        {q.explanation && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-gray-700 mb-3">
                            <p className="font-semibold text-yellow-700 mb-1">📖 해설</p>
                            <p>{q.explanation}</p>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <button onClick={() => getSingleAi(i + 1000, q)} disabled={singleAiLoading === i + 1000}
                            className="flex-1 py-2 bg-purple-100 text-purple-700 rounded-xl text-sm font-semibold hover:bg-purple-200 disabled:opacity-50">
                            {singleAiLoading === i + 1000 ? "🤖 생성 중..." : "🤖 AI 암기법 & 풀이 보기"}
                          </button>
                          <button onClick={() => { if (!reportedIds.has(q.id)) setReportTarget(q) }}
                            className={`px-3 py-2 rounded-xl text-sm font-semibold border transition-all ${reportedIds.has(q.id)
                              ? "bg-gray-100 text-gray-400 border-gray-200 cursor-default"
                              : "bg-white text-red-500 border-red-200 hover:bg-red-50"}`}>
                            {reportedIds.has(q.id) ? "✓ 신고됨" : "🚨 오류 신고"}
                          </button>
                        </div>
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
          </div>
        </div>
        {renderReportModal()}
      </div>
    )
  }

  const q = questions[current]
  const answered = answers[current] !== undefined
  const isCorrectNow = answered && answers[current] === q.answer

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm sticky top-0 z-10 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-gray-600 flex-shrink-0">{current + 1} / {questions.length}</span>

          {/* 모드 토글 */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs font-semibold flex-shrink-0">
            <button onClick={() => changeMode("exam")}
              className={`px-3 py-1.5 transition-all ${mode === "exam" ? "bg-blue-600 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}>
              📝 시험 모드
            </button>
            <button onClick={() => changeMode("instant")}
              className={`px-3 py-1.5 transition-all ${mode === "instant" ? "bg-green-600 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}>
              ✅ 정답 모드
            </button>
          </div>

          {mode === "exam" ? (
            <span className={`text-lg font-bold flex-shrink-0 ${timeLeft < 300 ? "text-red-500" : "text-blue-600"}`}>⏱ {formatTime(timeLeft)}</span>
          ) : (
            <span className="text-xs font-semibold text-green-600 flex-shrink-0 hidden sm:inline">⏱ 시간 제한 없음</span>
          )}

          <button onClick={async () => { setFinished(true); await saveWrongAnswers() }} className="text-sm bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 flex-shrink-0">제출</button>
        </div>
        <div className="max-w-6xl mx-auto mt-2 bg-gray-200 rounded-full h-1.5">
          <div className="bg-blue-600 h-1.5 rounded-full transition-all" style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 lg:flex lg:gap-6 lg:items-start">
        <div className="flex-1 min-w-0 max-w-2xl lg:max-w-none mx-auto lg:mx-0">
          {q.is_deprecated && (
            <div className="bg-red-50 border border-red-300 rounded-xl px-4 py-3 mb-3 flex items-start gap-2">
              <span className="text-red-500 text-lg">🚫</span>
              <div>
                <p className="text-red-700 font-semibold text-sm">출제기준 변경 문제</p>
                <p className="text-red-500 text-xs">현재 출제기준과 다릅니다. 학습 참고용으로만 활용하세요.</p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow p-6 mb-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex flex-wrap gap-2">
                <p className="text-xs text-gray-400">{q.subject} · {aiset ? `AI 추천 문제 ${aiset}` : `${q.year}년 ${q.round}회`}</p>
                {q.importance === "필수" && <span className="text-xs bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full">⭐ 필수문제</span>}
                {q.importance === "중요" && <span className="text-xs bg-yellow-100 text-yellow-700 font-bold px-2 py-0.5 rounded-full">✨ 중요문제</span>}
              </div>
              <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                {/* 🚨 오류 신고 버튼 */}
                <button onClick={() => { if (!reportedIds.has(q.id)) setReportTarget(q) }}
                  title="문제 오류 신고"
                  className={`text-xs px-2 py-1 rounded-lg border transition-all ${reportedIds.has(q.id)
                    ? "bg-gray-100 text-gray-400 border-gray-200 cursor-default"
                    : "bg-white text-red-500 border-red-200 hover:bg-red-50"}`}>
                  {reportedIds.has(q.id) ? "✓ 신고됨" : "🚨 오류 신고"}
                </button>
                <button onClick={() => toggleBookmark(q.id)} className="text-xl">
                  {bookmarks.has(q.id) ? "🔖" : "📄"}
                </button>
              </div>
            </div>

            <p className="text-base font-medium text-gray-800 leading-relaxed mb-3 whitespace-pre-wrap">{q.question_number}. {q.question_text}</p>

            {q.duplicate_cnt >= 2 && (
              <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 flex items-start gap-2">
                <span className="text-blue-500 text-sm">🔁</span>
                <div>
                  <p className="text-blue-700 text-xs font-semibold">{q.duplicate_cnt}회 동일 출제</p>
                  <p className="text-blue-500 text-xs">{q.duplicate_appearances}</p>
                </div>
              </div>
            )}

            {q.image_url && (
              <div className="mt-3 mb-2 flex justify-center">
                <img src={q.image_url} alt="문제 이미지" className="max-w-full rounded-lg border border-gray-200" style={{ maxHeight: "250px" }} />
              </div>
            )}
          </div>

          {/* ✅ 정답 모드: 채점 결과 배너 */}
          {mode === "instant" && answered && (
            <div className={`rounded-xl px-4 py-3 mb-3 flex items-center gap-2 border ${isCorrectNow
              ? "bg-green-50 border-green-300"
              : "bg-red-50 border-red-300"}`}>
              <span className="text-xl">{isCorrectNow ? "⭕" : "❌"}</span>
              <p className={`text-sm font-semibold ${isCorrectNow ? "text-green-700" : "text-red-600"}`}>
                {isCorrectNow ? "정답입니다!" : `오답입니다. 정답은 ${q.answer}번입니다.`}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-3 mb-4">
            {[1, 2, 3, 4].map(num => {
              let cls = "w-full text-left px-5 py-4 rounded-xl border-2 text-sm font-medium transition-all "
              if (mode === "instant" && answered) {
                // 정답 모드 + 답 선택 후: 정답/오답 색상 표시
                if (num === q.answer) cls += "border-green-500 bg-green-50 text-green-700 font-semibold"
                else if (num === answers[current]) cls += "border-red-400 bg-red-50 text-red-600"
                else cls += "border-gray-200 bg-white text-gray-400"
              } else {
                cls += answers[current] === num
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : "border-gray-200 bg-white text-gray-700 hover:border-blue-300"
              }
              return (
                <button key={num} onClick={() => selectAnswer(num)} className={cls}>
                  {mode === "instant" && answered && num === q.answer && <span className="mr-1">✅</span>}
                  {mode === "instant" && answered && num === answers[current] && num !== q.answer && <span className="mr-1">❌</span>}
                  {num}. <RenderOption text={q[`option_${num}`]} />
                </button>
              )
            })}
          </div>

          {answered && (
            <button onClick={() => setShowExplanation(!showExplanation)} className="w-full py-2 text-sm text-blue-600 hover:underline mb-3">
              {showExplanation ? "해설 닫기 ▲" : "해설 보기 ▼"}
            </button>
          )}
          {showExplanation && q.explanation && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4 text-sm text-gray-700">
              <p className="font-semibold text-yellow-700 mb-1">📖 해설</p>
              <p>{q.explanation}</p>
            </div>
          )}

          {answered && (
            <div className="mb-3">
              <button onClick={() => getSingleAi(current, questions[current])} disabled={singleAiLoading === current}
                className="w-full py-2 bg-purple-100 text-purple-700 rounded-xl text-sm font-semibold hover:bg-purple-200 disabled:opacity-50">
                {singleAiLoading === current ? "🤖 생성 중..." : "🤖 AI 암기법 & 풀이 보기"}
              </button>
              {singleAi[current] && (
                <div className="mt-2 bg-purple-50 border border-purple-200 rounded-xl p-4 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {singleAi[current]}
                </div>
              )}
            </div>
          )}

          <button onClick={handleToggleNotes} className="w-full py-2 text-sm text-purple-600 hover:underline mb-3 border border-purple-200 rounded-xl bg-purple-50">
            {showNotes ? "✏️ 풀이 닫기 ▲" : "✏️ 풀이 보기 / 작성 ▼"}
          </button>

          {showNotes && (
            <div className="bg-white rounded-xl shadow p-5 mb-4">
              {user ? (
                <div className="mb-5">
                  <p className="text-sm font-semibold text-gray-700 mb-2">✏️ 내 풀이 작성</p>
                  <textarea value={myNote} onChange={e => setMyNote(e.target.value)}
                    placeholder="이 문제의 풀이를 작성해보세요. 다른 수험생에게 도움이 됩니다!"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-purple-400" rows={4} />
                  <button onClick={saveNote} disabled={noteSaving || !myNote.trim()}
                    className="mt-2 w-full py-2 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 disabled:opacity-40">
                    {noteSaving ? "저장 중..." : "풀이 저장"}
                  </button>
                </div>
              ) : (
                <div className="mb-5 bg-gray-50 rounded-xl p-4 text-center text-sm text-gray-500">
                  풀이를 작성하려면 <a href="/login" className="text-purple-600 font-semibold hover:underline">로그인</a>이 필요합니다
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">👥 다른 수험생 풀이 {notes.length > 0 && <span className="text-gray-400 font-normal">({notes.length}개)</span>}</p>
                {notesLoading ? (
                  <p className="text-xs text-gray-400 text-center py-4">불러오는 중...</p>
                ) : notes.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">아직 작성된 풀이가 없어요. 첫 번째 풀이를 작성해보세요!</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {notes.map((note, idx) => (
                      <div key={note.id} className={`rounded-xl border p-4 ${idx === 0 ? "border-yellow-300 bg-yellow-50" : "border-gray-200 bg-gray-50"}`}>
                        {idx === 0 && <span className="text-xs text-yellow-600 font-bold mb-1 block">🏆 베스트 풀이</span>}
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-gray-400">{note.user_id === user?.id ? "✏️ 내 풀이" : `수험생 ${note.user_id.slice(0, 6)}`}</span>
                          <button onClick={() => toggleLike(note.id)} disabled={!user}
                            className={`flex items-center gap-1 text-xs px-3 py-1 rounded-full border transition-all
                              ${likedNotes.has(note.id) ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-500 border-gray-300 hover:border-blue-400"}`}>
                            👍 {note.like_count}
                          </button>
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => moveTo(current - 1)} disabled={current === 0}
              className="flex-1 py-3 bg-white border border-gray-300 text-gray-600 rounded-xl font-semibold disabled:opacity-30 hover:bg-gray-50">← 이전</button>
            <button onClick={() => moveTo(current + 1)} disabled={current === questions.length - 1}
              className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold disabled:opacity-30 hover:bg-blue-700">다음 →</button>
          </div>
        </div>

        {/* 데스크톱 사이드바 */}
        <aside className="hidden lg:block w-72 flex-shrink-0">
          <div className="sticky top-24">
            {renderNavigationPanel()}
          </div>
        </aside>
      </div>

      {/* 모바일 플로팅 버튼 */}
      <button
        onClick={() => setShowNav(true)}
        className="lg:hidden fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center text-2xl z-20 hover:bg-blue-700 active:scale-95 transition"
        aria-label="문제 번호 네비게이션 열기"
      >
        📋
      </button>

      {/* 모바일 바텀시트 */}
      {showNav && (
        <div className="lg:hidden fixed inset-0 z-30 bg-black/50 flex items-end" onClick={() => setShowNav(false)}>
          <div className="w-full bg-gray-50 rounded-t-2xl max-h-[85vh] overflow-y-auto p-4" onClick={e => e.stopPropagation()}>
            {renderNavigationPanel()}
          </div>
        </div>
      )}

      {/* 🚨 오류 신고 모달 */}
      {renderReportModal()}
    </div>
  )
}

function RenderOption({ text }: { text: string | null | undefined }) {
  if (!text) return null;
  const imgMatch = text.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
  if (imgMatch) {
    return <img src={imgMatch[2]} alt={imgMatch[1] || "보기"} className="inline-block max-w-full h-auto my-1" />;
  }
  return <>{text}</>;
}

export default function 
CBTStartPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">로딩 중...</p></div>}>
      <CBTStartInner />
    </Suspense>
  )
}
