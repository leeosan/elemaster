"use client"
import { useState, useEffect, Suspense } from "react"
import { createClient } from "@/lib/supabase"
import { useRouter, useSearchParams } from "next/navigation"

function CommunityWriteInner() {
  const searchParams = useSearchParams()
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [category, setCategory] = useState(searchParams.get("category") || "free")
  const [user, setUser] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.replace("/login"); return }
      setUser(data.user)
    })
  }, [])

  const handleSubmit = async (selectedCategory: string) => {
    if (!title.trim() || !content.trim()) return
    setSaving(true)
    const supabase = createClient()
    const { data, error } = await supabase.from("posts").insert({
      user_id: user.id,
      category: selectedCategory,
      title: title.trim(),
      content: content.trim()
    }).select().single()
    if (!error && data) router.push(`/community/${data.id}`)
    setSaving(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">←</button>
          <h1 className="text-xl font-bold text-gray-800">✏️ 글쓰기</h1>
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          <div className="flex gap-2 mb-4">
            {[
              { key: "free", label: "💬 자유" },
              { key: "qna", label: "❓ 질문/답변" },
              { key: "pass", label: "🏆 합격후기" },
            ].map(c => (
              <button
                key={c.key}
                onClick={() => setCategory(c.key)}
                className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all
                  ${category === c.key ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="제목을 입력하세요"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm mb-3 focus:outline-none focus:border-blue-400"
          />

          <textarea
            placeholder="내용을 입력하세요"
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={10}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-blue-400"
          />

          <button
            onClick={() => handleSubmit(category)}
            disabled={saving || !title.trim() || !content.trim()}
            className="mt-4 w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-40"
          >
            {saving ? "등록 중..." : `${category === "free" ? "💬 자유" : category === "qna" ? "❓ 질문/답변" : "🏆 합격후기"} 게시글 등록`}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function CommunityWritePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">로딩 중...</p></div>}>
      <CommunityWriteInner />
    </Suspense>
  )
}