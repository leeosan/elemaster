"use client"
import { useState, useEffect, Suspense } from "react"
import { createClient } from "@/lib/supabase"
import { useSearchParams, useRouter } from "next/navigation"

function CBTStartInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const examId = searchParams.get("exam") || "1"
  const year = searchParams.get("year")
  const round = searchParams.get("round")

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

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.replace("/login"); return }
      setUser(data.user)
      const { data: bData } = await supabase.from("bookmarks").select("question_id").eq("user_id", data.user.id)
      setBookmarks(new Set((bData || []).map((b: any) => b.question_id)))
    })
  }, [])

  useEffect(() => {
    const supabase = createClient()
    let query = supabase.from("questions_with_meta").select("*").eq("exam_type_id", examId)
    if (year && round) query = query.eq("year", year).eq("round", round)
    query.limit(60).then(({ data }) => {
      const sorted = year && round
        ? (data || []).sort((a: any, b: any) => a.question_number - b.question_number)
        : (data || []).sort(() => Math.random() - 0.5)
      setQuestions(sorted)
      setLoading(false)
    })
  }, [examId, year, round])

  useEffect(() => {
    if (finished || loading) return
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timer); setFinished(true); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [finished, loading])

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
    setAnswers(prev => ({ ...prev, [current]: num }))
    setShowExplanation(false)
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
          </div>
        </div>
      </div>
    )
  }

  const q = questions[current]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm sticky top-0 z-10 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-600">{current + 1} / {questions.length}</span>
          <span className={`text-lg font-bold ${timeLeft < 300 ? "text-red-500" : "text-blue-600"}`}>⏱ {formatTime(timeLeft)}</span>
          <button onClick={async () => { setFinished(true); await saveWrongAnswers() }} className="text-sm bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600">제출</button>
        </div>
        <div className="max-w-2xl mx-auto mt-2 bg-gray-200 rounded-full h-1.5">
          <div className="bg-blue-600 h-1.5 rounded-full transition-all" style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
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
              <p className="text-xs text-gray-400">{q.subject} · {q.year}년 {q.round}회</p>
              {q.importance === "필수" && <span className="text-xs bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full">⭐ 필수문제</span>}
              {q.importance === "중요" && <span className="text-xs bg-yellow-100 text-yellow-700 font-bold px-2 py-0.5 rounded-full">✨ 중요문제</span>}
            </div>
            <button onClick={() => toggleBookmark(q.id)} className="text-xl ml-2 flex-shrink-0">
              {bookmarks.has(q.id) ? "🔖" : "📄"}
            </button>
          </div>
          <p className="text-base font-medium text-gray-800 leading-relaxed mb-3">{q.question_number}. {q.question_text}</p>

          {/* 동일 출제 뱃지 */}
          {q.duplicate_cnt >= 2 && (
            <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 flex items-start gap-2">
              <span className="text-blue-500 text-sm">🔁</span>
              <div>
                <p className="text-blue-700 text-xs font-semibold">{q.duplicate_cnt}회 동일 출제</p>
                <p className="text-blue-500 text-xs">{q.duplicate_appearances}</p>
              </div>
            </div>
          )}

          {/* 유사문제 뱃지 */}
          {q.duplicate_cnt < 2 && q.similar_cnt >= 1 && (
            <div className="mt-2 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2 flex items-start gap-2">
              <span className="text-indigo-500 text-sm">🔀</span>
              <div>
                <p className="text-indigo-700 text-xs font-semibold">유사문제 출제</p>
                <p className="text-indigo-500 text-xs">{q.similar_appearances}</p>
              </div>
            </div>
          )}

          {q.image_url && (
            <div className="mt-3 mb-2 flex justify-center">
              <img src={q.image_url} alt="문제 이미지" className="max-w-full rounded-lg border border-gray-200" style={{ maxHeight: "250px" }} />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 mb-4">
          {[1, 2, 3, 4].map(num => (
            <button key={num} onClick={() => selectAnswer(num)}
              className={`w-full text-left px-5 py-4 rounded-xl border-2 text-sm font-medium transition-all
                ${answers[current] === num ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-700 hover:border-blue-300"}`}>
              {num}. {q[`option_${num}`]}
            </button>
          ))}
        </div>

        {answers[current] && (
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
    </div>
  )
}

export default function CBTStartPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">로딩 중...</p></div>}>
      <CBTStartInner />
    </Suspense>
  )
}
