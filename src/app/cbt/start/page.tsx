"use client"
import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase"
import { useSearchParams, useRouter } from "next/navigation"

export default function CBTStartPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const examId = searchParams.get("exam") || "1"

  const [questions, setQuestions] = useState<any[]>([])
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<{[key: number]: number}>({})
  const [timeLeft, setTimeLeft] = useState(60 * 60)
  const [loading, setLoading] = useState(true)
  const [finished, setFinished] = useState(false)
  const [showExplanation, setShowExplanation] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from("questions")
      .select("*")
      .eq("exam_type_id", examId)
      .limit(60)
      .then(({ data }) => {
        const shuffled = (data || []).sort(() => Math.random() - 0.5)
        setQuestions(shuffled)
        setLoading(false)
      })
  }, [examId])

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

  const getScore = () => {
    let correct = 0
    questions.forEach((q, i) => {
      if (answers[i] === q.answer) correct++
    })
    return { correct, total: questions.length, score: Math.round((correct / questions.length) * 100) }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400">문제 불러오는 중...</p>
    </div>
  )

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
        <div className="max-w-lg mx-auto bg-white rounded-2xl shadow p-8 text-center">
          <div className="text-5xl mb-4">{score >= 60 ? "🎉" : "😅"}</div>
          <h1 className="text-2xl font-bold mb-2">{score >= 60 ? "합격!" : "불합격"}</h1>
          <p className="text-gray-500 mb-6">합격 기준: 60점 이상</p>
          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <p className="text-4xl font-bold text-blue-600 mb-2">{score}점</p>
            <p className="text-gray-500">{total}문제 중 {correct}문제 정답</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => { setFinished(false); setAnswers({}); setCurrent(0); setTimeLeft(3600); setShowExplanation(false) }}
              className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
            >
              다시 풀기
            </button>
            <button
              onClick={() => router.push("/cbt")}
              className="flex-1 py-3 bg-white border border-gray-300 text-gray-600 rounded-lg font-semibold hover:bg-gray-50"
            >
              종목 선택
            </button>
          </div>
        </div>
      </div>
    )
  }

  const q = questions[current]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 상단 바 */}
      <div className="bg-white shadow-sm sticky top-0 z-10 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-600">
            {current + 1} / {questions.length}
          </span>
          <span className={`text-lg font-bold ${timeLeft < 300 ? "text-red-500" : "text-blue-600"}`}>
            ⏱ {formatTime(timeLeft)}
          </span>
          <button
            onClick={() => setFinished(true)}
            className="text-sm bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600"
          >
            제출
          </button>
        </div>
        {/* 진행바 */}
        <div className="max-w-2xl mx-auto mt-2 bg-gray-200 rounded-full h-1.5">
          <div
            className="bg-blue-600 h-1.5 rounded-full transition-all"
            style={{ width: `${((current + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* 문제 */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow p-6 mb-4">
          <p className="text-xs text-gray-400 mb-2">{q.subject} · {q.year}년 {q.round}회</p>
          <p className="text-base font-medium text-gray-800 leading-relaxed">
            {q.question_number}. {q.question_text}
          </p>
        </div>

        {/* 보기 */}
        <div className="flex flex-col gap-3 mb-4">
          {[1, 2, 3, 4].map(num => (
            <button
              key={num}
              onClick={() => selectAnswer(num)}
              className={`w-full text-left px-5 py-4 rounded-xl border-2 text-sm font-medium transition-all
                ${answers[current] === num
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : "border-gray-200 bg-white text-gray-700 hover:border-blue-300"
                }`}
            >
              {num}. {q[`option_${num}`]}
            </button>
          ))}
        </div>

        {/* 해설 */}
        {answers[current] && (
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            className="w-full py-2 text-sm text-blue-600 hover:underline mb-3"
          >
            {showExplanation ? "해설 닫기 ▲" : "해설 보기 ▼"}
          </button>
        )}
        {showExplanation && q.explanation && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4 text-sm text-gray-700">
            <p className="font-semibold text-yellow-700 mb-1">📖 해설</p>
            <p>{q.explanation}</p>
          </div>
        )}

        {/* 이전/다음 버튼 */}
        <div className="flex gap-3">
          <button
            onClick={() => { setCurrent(c => c - 1); setShowExplanation(false) }}
            disabled={current === 0}
            className="flex-1 py-3 bg-white border border-gray-300 text-gray-600 rounded-xl font-semibold disabled:opacity-30 hover:bg-gray-50"
          >
            ← 이전
          </button>
          <button
            onClick={() => { setCurrent(c => c + 1); setShowExplanation(false) }}
            disabled={current === questions.length - 1}
            className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold disabled:opacity-30 hover:bg-blue-700"
          >
            다음 →
          </button>
        </div>
      </div>
    </div>
  )
}